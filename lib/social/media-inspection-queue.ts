import "server-only";
import { IdentityPoolClient } from "google-auth-library";

export type MediaInspectionTask = { inspectionId: string };
type Config = { project: string; region: string; queue: string; workerUrl: string; serviceAccount: string };
type WifConfig = { projectNumber: string; poolId: string; providerId: string; producerServiceAccount: string };
type QueueStage = "configuration" | "vercel_oidc" | "google_sts" | "service_account_impersonation" | "cloud_tasks_create";

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
  const audience = `//iam.googleapis.com/projects/${wif.projectNumber}/locations/global/workloadIdentityPools/${wif.poolId}/providers/${wif.providerId}`;
  console.info("media_inspection_wif_sts_audience", {
    audience: JSON.stringify(audience),
    audienceLength: audience.length,
    projectNumber: JSON.stringify(wif.projectNumber),
    projectNumberLength: wif.projectNumber.length,
    poolId: JSON.stringify(wif.poolId),
    poolIdLength: wif.poolId.length,
    providerId: JSON.stringify(wif.providerId),
    providerIdLength: wif.providerId.length,
  });
  return new IdentityPoolClient({
    type: "external_account",
    audience,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${wif.producerServiceAccount}:generateAccessToken`,
    subject_token_supplier: { getSubjectToken: async () => vercelOidcToken },
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
}

function safeErrorDetails(error: unknown) {
  const value = error as { name?: unknown; code?: unknown; message?: unknown } | undefined;
  return {
    errorName: typeof value?.name === "string" ? value.name : "Error",
    errorCode: typeof value?.code === "string" || typeof value?.code === "number" ? value.code : undefined,
    // Google error messages are useful for configuration diagnosis. Never log the
    // error object itself, which could include request or credential details.
    errorMessage: typeof value?.message === "string"
      ? value.message.replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]").replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[REDACTED_JWT]").slice(0, 500)
      : "Unknown error",
  };
}

function failureStage(stage: QueueStage, error: unknown): QueueStage {
  if (stage !== "google_sts") return stage;
  const message = typeof (error as { message?: unknown })?.message === "string" ? (error as { message: string }).message : "";
  return /iamcredentials|generateaccess?token|serviceaccounts/i.test(message) ? "service_account_impersonation" : stage;
}

/**
 * In production, pass the server route's incoming Request. The token is a
 * Vercel-injected header and Google verifies its issuer and WIF attributes.
 */
export async function enqueueMediaInspection(job: MediaInspectionTask, request?: Pick<Request, "headers">) {
  let stage: QueueStage = "configuration";
  try {
    const c = config(); if (!c) throw new Error("Media Inspection Cloud Tasks is not configured.");
    const { CloudTasksClient } = await import("@google-cloud/tasks");
    const production = process.env.VERCEL_ENV === "production";
    const vercelOidcToken = request?.headers.get("x-vercel-oidc-token") || undefined;
    stage = "vercel_oidc";
    if (production && !vercelOidcToken) throw new Error("Vercel production OIDC token is required.");
    if (!production && process.env.MEDIA_INSPECTION_ALLOW_LOCAL_ADC !== "true") throw new Error("Local Cloud Tasks ADC is disabled. Set MEDIA_INSPECTION_ALLOW_LOCAL_ADC=true explicitly for development.");
    const authClient = production ? productionGoogleAuth(vercelOidcToken!) : undefined;
    // Force federation before createTask so Vercel logs distinguish WIF/SA errors
    // from Cloud Tasks request errors. No token or credential is logged.
    if (authClient) { stage = "google_sts"; await authClient.getAccessToken(); }
    const client = new CloudTasksClient(authClient ? { authClient } : undefined);
    const parent = client.queuePath(c.project, c.region, c.queue);
    const name = client.taskPath(c.project, c.region, c.queue, `inspection-${job.inspectionId}`);
    stage = "cloud_tasks_create";
    const [created] = await client.createTask({ parent, task: { name, httpRequest: { httpMethod: "POST", url: `${c.workerUrl}/tasks/inspect-media`, headers: { "Content-Type": "application/json" }, body: Buffer.from(JSON.stringify({ inspectionId: job.inspectionId })), oidcToken: { serviceAccountEmail: c.serviceAccount, audience: c.workerUrl } } } });
    return created.name;
  } catch (error: any) {
    if (stage === "cloud_tasks_create" && error?.code === 6) {
      const c = config()!;
      return `projects/${c.project}/locations/${c.region}/queues/${c.queue}/tasks/inspection-${job.inspectionId}`;
    }
    console.error("media_inspection_queue_failed", { stage: failureStage(stage, error), inspectionId: job.inspectionId, ...safeErrorDetails(error) });
    throw error;
  }
}
