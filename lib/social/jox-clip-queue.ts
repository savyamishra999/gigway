import "server-only";
import { CloudTasksClient } from "@google-cloud/tasks";

export type JoxClipTask = { renditionId: string };
type Config = { project: string; region: string; queue: string; workerUrl: string; serviceAccount: string };

function config(): Config | null {
  const project = process.env.GOOGLE_CLOUD_PROJECT, region = process.env.GOOGLE_CLOUD_REGION, queue = process.env.JOX_CLIP_TASK_QUEUE, workerUrl = process.env.JOX_CLIP_WORKER_URL, serviceAccount = process.env.JOX_CLIP_TASK_SERVICE_ACCOUNT_EMAIL;
  if (![project, region, queue, workerUrl, serviceAccount].every(Boolean)) return null;
  if (!workerUrl!.startsWith("https://")) throw new Error("JOX_CLIP_WORKER_URL must be an HTTPS Cloud Run URL.");
  return { project: project!, region: region!, queue: queue!, workerUrl: workerUrl!.replace(/\/$/, ""), serviceAccount: serviceAccount! };
}

export function joxClipQueueConfigured() { return !!config(); }

export async function enqueueJoxClipRender(job: JoxClipTask) {
  const c = config(); if (!c) throw new Error("Jox Clip Cloud Tasks is not configured.");
  const client = new CloudTasksClient(), parent = client.queuePath(c.project, c.region, c.queue);
  const name = client.taskPath(c.project, c.region, c.queue, `jox-${job.renditionId}`);
  try {
    const [created] = await client.createTask({ parent, task: { name, httpRequest: { httpMethod: "POST", url: `${c.workerUrl}/tasks/render-jox-clip`, headers: { "Content-Type": "application/json" }, body: Buffer.from(JSON.stringify({ renditionId: job.renditionId })), oidcToken: { serviceAccountEmail: c.serviceAccount, audience: c.workerUrl } } } });
    console.info(JSON.stringify({ event: "jox_clip_task_accepted", renditionId: job.renditionId, taskName: created.name }));
    return created.name;
  } catch (error: any) {
    // An idempotent task name can collide during a retry after a response loss.
    if (error?.code === 6) return name;
    throw error;
  }
}
