import { mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!baseUrl || !serviceKey) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
const db = createClient(baseUrl, serviceKey, { auth: { persistSession: false } });
const MAX_JOX_BYTES = 10 * 1024 * 1024;
const TTL_HOURS = 24;
const log = (event, fields = {}) => console.info(JSON.stringify({ event, ...fields }));

function run(command, args, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "pipe", windowsHide: true }); let stdout = "", stderr = "";
    child.stdout.on("data", chunk => { stdout += chunk; }); child.stderr.on("data", chunk => { stderr += chunk; });
    const timer = setTimeout(() => { child.kill("SIGKILL"); reject(new Error("inspection_timeout")); }, timeout);
    child.on("error", reject); child.on("close", code => { clearTimeout(timer); code === 0 ? resolve(stdout) : reject(new Error(`ffprobe_failed:${code}:${stderr.slice(-800)}`)); });
  });
}

async function reject(inspection, code, details = {}) {
  await db.storage.from(inspection.bucket).remove([inspection.storage_path]);
  await db.from("media_inspections").update({ status: "rejected", rejection_code: code, completed_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...details }).eq("id", inspection.id).in("status", ["pending", "processing"]);
  log("media_inspection_rejected", { inspectionId: inspection.id, code });
}

function joxProbeAccepted(value, size) {
  const audio = (value.streams || []).filter(stream => stream.codec_type === "audio"), formats = String(value.format?.format_name || "").split(",");
  const duration = Number(value.format?.duration), container = formats.includes("webm") ? "webm" : formats[0] || null, codec = audio[0]?.codec_name || null;
  return { duration, container, codec, accepted: formats.includes("webm") && audio.length === 1 && (value.streams || []).length === 1 && codec === "opus" && Number.isFinite(duration) && duration > 0 && duration <= 27 && size > 0 && size <= MAX_JOX_BYTES };
}

export async function inspectMedia(inspectionId) {
  const { data: inspection } = await db.from("media_inspections").select("id,uploader_user_id,bucket,storage_path,purpose,status").eq("id", inspectionId).maybeSingle();
  if (!inspection || inspection.status === "ready" || inspection.status === "rejected") return { status: 204 };
  if (inspection.purpose !== "jox_audio" || inspection.bucket !== "post-media" || inspection.storage_path !== `users/${inspection.uploader_user_id}/jox-temp/${inspection.id}/source.webm`) {
    if (inspection.status === "pending" || inspection.status === "processing") await reject(inspection, "invalid_inspection_target");
    return { status: 204 };
  }
  const { data: claimed } = await db.from("media_inspections").update({ status: "processing", updated_at: new Date().toISOString(), rejection_code: null }).eq("id", inspectionId).eq("status", "pending").select("id").maybeSingle();
  if (!claimed) return { status: inspection.status === "processing" ? 503 : 204 };
  const work = await mkdtemp(join(tmpdir(), "media-inspection-"));
  try {
    const source = join(work, "source.webm"), download = await db.storage.from(inspection.bucket).download(inspection.storage_path);
    if (download.error || !download.data) throw new Error("temporary_object_missing");
    await writeFile(source, Buffer.from(await download.data.arrayBuffer()));
    const size = (await stat(source)).size;
    if (size > MAX_JOX_BYTES) { await reject(inspection, "size_exceeded", { detected_size_bytes: size }); return { status: 204 }; }
    const output = await run("ffprobe", ["-v", "error", "-show_entries", "format=format_name,duration,size:stream=codec_type,codec_name", "-of", "json", source]);
    const probe = joxProbeAccepted(JSON.parse(output), size);
    if (!probe.accepted) { await reject(inspection, !Number.isFinite(probe.duration) || probe.duration <= 0 ? "duration_unavailable" : probe.duration > 27 ? "duration_exceeded" : probe.container !== "webm" ? "invalid_container" : probe.codec !== "opus" ? "invalid_codec" : "invalid_audio_streams", { detected_container: probe.container, detected_audio_codec: probe.codec, detected_duration_seconds: Number.isFinite(probe.duration) ? probe.duration : null, detected_size_bytes: size }); return { status: 204 }; }
    await db.from("media_inspections").update({ status: "ready", detected_container: probe.container, detected_audio_codec: probe.codec, detected_duration_seconds: probe.duration, detected_size_bytes: size, rejection_code: null, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", inspection.id).eq("status", "processing");
    log("media_inspection_ready", { inspectionId, purpose: inspection.purpose }); return { status: 204 };
  } catch (error) {
    await db.from("media_inspections").update({ status: "failed", rejection_code: String(error.message || "inspection_failed").slice(0, 120), completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", inspection.id).eq("status", "processing");
    log("media_inspection_failed", { inspectionId }); return { status: 500 };
  } finally { await rm(work, { recursive: true, force: true }); }
}

export async function cleanupMediaInspections() {
  const before = new Date(Date.now() - TTL_HOURS * 60 * 60 * 1000).toISOString();
  const { data: stale } = await db.from("media_inspections").select("id,bucket,storage_path").in("status", ["pending", "processing", "failed"]).lt("created_at", before).limit(100);
  for (const item of stale || []) { await db.storage.from(item.bucket).remove([item.storage_path]); await db.from("media_inspections").delete().eq("id", item.id); }
  log("media_inspection_cleanup", { count: stale?.length || 0 }); return { status: 204 };
}
