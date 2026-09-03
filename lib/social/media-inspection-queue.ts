import "server-only";
import { IdentityPoolClient } from "google-auth-library";

export type MediaInspectionTask = { inspectionId: string };
type Config = { project: string; region: string; queue: string; workerUrl: string; serviceAccount: string };
type WifConfig = { projectNumber: string; poolId: string; providerId: string; producerServiceAccount: string };

function config(): Config | null {
  const project = process.env.GOOGLE_CLOUD_PROJECT, region = process.env.GOOGLE_CLOUD_REGION, queue = process.env.MEDIA_INSPECTION_TASK_QUEUE, workerUrl = process.env.MEDIA_INSPECTION_WORKER_URL, serviceAccount = process.env.MEDIA_INSPECTION_TASK_SERVICE_ACCOUNT_EMAIL;
  if (![project, region, queue, workerUrl, serviceAccount].every(Boolean)) return null;
  if (!workerUrl!.startsWith("https://")) throw new Error("MEDIA_INSPECTION_WORKER_URL must be an HTTPS Cloud Run URL.");
  return { project: project!, region: region!, queue: queue!, workerUrl: workerUrl!.replace(/\/$/, ""), serviceAccount: serviceAccount! };
}

export function mediaInspectionQueueConfigured() { return !!config(); }

function wifConfig(): WifConfig | null {
  const projectNumber = process.env.GCP_WIF_PROJECT_NUMBER, poolId = process.env.GCP_WIF_POOL_ID, providerId = process.env.GCP_WIF_PROVIDER_ID, producerServiceAccount = process.env.GCP_WIF_SERVICE_ACCOUNT_EMAIL;
  if (![projectNumber, poolId, providerId, producerServiceAccount].every(Boolean)) return null;
  return { projectNumber: projectNumber!, poolId: poolId!, providerId: providerId!, producerServiceAccount: producerServiceAccount! };
}

function productionGoogleAuth(vercelOidcToken: string) {
  const wif = wifConfig();
  if (!wif) throw new Error("Vercel WIF is not configured.");
  return new IdentityPoolClient({
    type: "external_account",
    audience: `//iam.googleapis.com/projects/${wif.projectNumber}/locations/global/workloadIdentityPools/${wif.poolId}/providers/${wif.providerId}`,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${wif.producerServiceAccount}:generateAccessToken`,
    subject_token_supplier: { getSubjectToken: async () => vercelOidcToken },
  });
}

/**
 * In production, pass the server route's incoming Request. The token is a
 * Vercel-injected header and Google verifies its issuer and WIF attributes.
 */
export async function enqueueMediaInspection(job: MediaInspectionTask, request?: Pick<Request, "headers">) {
  const c = config(); if (!c) throw new Error("Media Inspection Cloud Tasks is not configured.");
  const { CloudTasksClient } = await import("@google-cloud/tasks");
  const production = process.env.VERCEL_ENV === "production";
  const vercelOidcToken = request?.headers.get("x-vercel-oidc-token") || undefined;
  if (production && !vercelOidcToken) throw new Error("Vercel production OIDC token is required.");
  if (!production && process.env.MEDIA_INSPECTION_ALLOW_LOCAL_ADC !== "true") throw new Error("Local Cloud Tasks ADC is disabled. Set MEDIA_INSPECTION_ALLOW_LOCAL_ADC=true explicitly for development.");
  const client = production ? new CloudTasksClient({ authClient: productionGoogleAuth(vercelOidcToken!) }) : new CloudTasksClient();
  const parent = client.queuePath(c.project, c.region, c.queue);
  const name = client.taskPath(c.project, c.region, c.queue, `inspection-${job.inspectionId}`);
  try {
    const [created] = await client.createTask({ parent, task: { name, httpRequest: { httpMethod: "POST", url: `${c.workerUrl}/tasks/inspect-media`, headers: { "Content-Type": "application/json" }, body: Buffer.from(JSON.stringify({ inspectionId: job.inspectionId })), oidcToken: { serviceAccountEmail: c.serviceAccount, audience: c.workerUrl } } } });
    return created.name;
  } catch (error: any) { if (error?.code === 6) return name; throw error; }
}
