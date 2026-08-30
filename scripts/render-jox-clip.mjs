#!/usr/bin/env node
/**
 * Local-only Phase 3A.3A Jox Clip proof of concept.
 *
 * It deliberately has no database, queue, Storage, or HTTP dependency.  Give it
 * a locally owned Jox WebM and it writes a single MP4 to a local path.
 */
import { mkdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";

const WIDTH = 720;
const HEIGHT = 1280;
const FPS = 30;
const MAX_DURATION_SECONDS = 27;

function usage(message) {
  if (message) console.error(`Error: ${message}\n`);
  console.error("Usage: node scripts/render-jox-clip.mjs --audio <local-jox.webm> --avatar <local-avatar> --output <clip.mp4> --display-name <name> --username <username> --caption <caption> --transcript <transcript> [--image <local-image>]\n");
  process.exitCode = 1;
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function metadataOption(name, maximum) {
  const value = option(name);
  if (!value || value.length > maximum || /[\r\n\[\];]/.test(value)) throw new Error(`${name} is required and must be a single line of at most ${maximum} characters.`);
  return value;
}

function optionalMetadataOption(name, maximum) {
  const value = option(name);
  if (!value) return null;
  if (value.length > maximum || /[\r\n\[\];]/.test(value)) throw new Error(`${name} must be a single line of at most ${maximum} characters.`);
  return value;
}

function filterText(value) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/:/g, "\\:").replace(/%/g, "\\%");
}

function rendererFont() {
  // Explicit font files avoid host fontconfig discovery (which is unavailable in
  // some minimal Windows/server environments). Deployments can supply their own.
  return process.env.JOX_CLIP_FONT_FILE || (process.platform === "win32" ? "C:/Windows/Fonts/arial.ttf" : "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf");
}

function executable(name) {
  const configured = process.env[`JOX_${name.toUpperCase()}_PATH`];
  return configured || name.toLowerCase();
}

function run(command, args) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    let stdout = "", stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", (error) => rejectRun(error));
    child.once("close", (code) => code === 0 ? resolveRun({ stdout, stderr }) : rejectRun(new Error(`${command} exited ${code}: ${stderr.trim()}`)));
  });
}

async function probe(audioPath) {
  const result = await run(executable("ffprobe"), [
    "-v", "error", "-show_entries", "format=format_name,duration:stream=codec_type,codec_name",
    "-of", "json", audioPath,
  ]);
  const data = JSON.parse(result.stdout);
  const duration = Number(data.format?.duration);
  const audioStreams = (data.streams || []).filter((stream) => stream.codec_type === "audio");
  if (!Number.isFinite(duration) || duration <= 0 || duration > MAX_DURATION_SECONDS) throw new Error(`Jox duration must be > 0 and <= ${MAX_DURATION_SECONDS} seconds (received ${data.format?.duration ?? "unknown"}).`);
  if (audioStreams.length !== 1) throw new Error("Input must contain exactly one audio stream.");
  if (!String(data.format?.format_name || "").split(",").includes("webm")) throw new Error("Input must be a local Jox WebM recording.");
  return duration;
}

function filterGraph(hasImage, duration, identity) {
  const imageInput = hasImage ? 2 : null;
  const background = hasImage
    ? `[${imageInput}:v]scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,eq=brightness=-0.18:saturation=0.72[base]`
    : "color=c=0xFCFBFF:s=720x1280:r=30:d=" + duration.toFixed(6) + "[base]";
  const progress = `if(between(hypot(X-W/2,Y-H/2),155,168)*gte(T/${duration.toFixed(6)},mod(atan2(X-W/2,-(Y-H/2))+2*PI,2*PI)/(2*PI)),255,0)`;
  const font = `fontfile='${filterText(rendererFont())}'`;
  const transcript = identity.transcript && identity.transcript.trim().toLocaleLowerCase() !== identity.caption.trim().toLocaleLowerCase()
    ? `,drawtext=${font}:text='${filterText(identity.transcript)}':fontcolor=0x5D5876:fontsize=21:x=(w-text_w)/2:y=875`
    : "";
  const atmosphere = hasImage
    ? "drawbox=x=0:y=0:w=720:h=1280:color=0xFAF9FF@0.12:t=fill,drawbox=x=0:y=735:w=720:h=545:color=0xFAF9FF@0.58:t=fill"
    : "drawbox=x=0:y=0:w=720:h=1280:color=0xE9E7FF@0.38:t=fill";
  // avectorscope receives the decoded source signal (with one channel phase
  // shifted) and supplies the moving energy halo. No decorative/random signal.
  return `${background};[base]${atmosphere},drawbox=x=72:y=615:w=576:h=2:color=0xD7D4F5@0.75:t=fill[canvas];[0:a]asplit=2[energyLeft][energyRight];[energyRight]aphaseshift=shift=0.25[energyShift];[energyLeft][energyShift]join=inputs=2:channel_layout=stereo,volume=8[energyStereo];[energyStereo]avectorscope=s=390x390:r=30:draw=line:scale=lin,format=rgba,colorkey=0x000000:0.08:0.15,colorchannelmixer=rr=1:gg=0.55:bb=1.25:aa=0.88[energy];[1:v]scale=310:310:force_original_aspect_ratio=increase,crop=310:310,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lte(hypot(X-W/2,Y-H/2),150),255,0)'[avatar];color=c=black@0.0:s=340x340:r=30:d=${duration.toFixed(6)},format=rgba,geq=r='if(between(hypot(X-W/2,Y-H/2),155,168),103,0)':g='if(between(hypot(X-W/2,Y-H/2),155,168),91,0)':b='if(between(hypot(X-W/2,Y-H/2),155,168),205,0)':a='if(between(hypot(X-W/2,Y-H/2),155,168),95,0)'[track];color=c=black@0.0:s=340x340:r=30:d=${duration.toFixed(6)},format=rgba,geq=r='if(${progress},if(lte(X,W/2),236,79),0)':g='if(${progress},if(lte(Y,H/2),72,70),0)':b='if(${progress},if(gte(X,W/2),246,153),0)':a='${progress}'[progress];[canvas][energy]overlay=165:250:format=auto[heroEnergy];[heroEnergy][avatar]overlay=205:290:format=auto[heroAvatar];[heroAvatar][track]overlay=190:275:format=auto[heroTrack];[heroTrack][progress]overlay=190:275:format=auto,drawtext=${font}:text='VIJOX':fontcolor=0x463886:fontsize=26:x=(w-text_w)/2:y=48,drawtext=${font}:text='Share your voice.':fontcolor=0x716B99:fontsize=15:x=(w-text_w)/2:y=84,drawtext=${font}:text='${filterText(identity.displayName)}':fontcolor=0x1F1B3B:fontsize=38:x=(w-text_w)/2:y=650,drawtext=${font}:text='@${filterText(identity.username)} · Jox':fontcolor=0x625D80:fontsize=21:x=(w-text_w)/2:y=699,drawtext=${font}:text='${filterText(identity.caption)}':fontcolor=0x211D3F:fontsize=32:x=(w-text_w)/2:y=805${transcript},drawtext=${font}:text='VIJOX · GigWay':fontcolor=0x51459A:fontsize=20:x=(w-text_w)/2:y=1050,drawtext=${font}:text='Jox your voice.':fontcolor=0x7A7596:fontsize=16:x=(w-text_w)/2:y=1087,format=yuv420p[video]`;
}

async function main() {
  const audio = option("--audio"), avatar = option("--avatar"), output = option("--output"), image = option("--image");
  if (!audio || !avatar || !output) return usage("--audio, --avatar, and --output are required.");
  const identity = {
    displayName: metadataOption("--display-name", 80),
    username: metadataOption("--username", 32),
    caption: metadataOption("--caption", 140),
    transcript: optionalMetadataOption("--transcript", 240),
  };
  const audioPath = resolve(audio), avatarPath = resolve(avatar), outputPath = resolve(output), imagePath = image ? resolve(image) : undefined;
  await stat(audioPath);
  await stat(avatarPath);
  if (imagePath) await stat(imagePath);
  const duration = await probe(audioPath);
  await mkdir(dirname(outputPath), { recursive: true });
  const args = ["-y", "-i", audioPath, "-loop", "1", "-framerate", String(FPS), "-i", avatarPath];
  if (imagePath) args.push("-loop", "1", "-framerate", String(FPS), "-i", imagePath);
  args.push(
    "-filter_complex", filterGraph(Boolean(imagePath), duration, identity), "-map", "[video]", "-map", "0:a:0",
    "-t", duration.toFixed(3), "-r", String(FPS), "-c:v", "libx264", "-preset", "medium", "-crf", "23",
    "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", outputPath,
  );
  await run(executable("ffmpeg"), args);
  console.log(JSON.stringify({ output: outputPath, durationSeconds: duration, width: WIDTH, height: HEIGHT, fps: FPS, video: "H.264/yuv420p", audio: "AAC" }, null, 2));
}

main().catch((error) => { console.error(`Jox Clip render failed: ${error.message}`); process.exitCode = 1; });
