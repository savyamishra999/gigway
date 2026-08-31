# Jox Clip worker

The Cloud Run worker is private. Cloud Tasks sends `POST /tasks/render-jox-clip` with exactly `{"renditionId":"<uuid>"}` and an OIDC token. The worker re-loads all media, post visibility, identity, and rendition state with its Supabase service-role credential.

## Required environment

GigWay queue producer: `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_REGION`, `JOX_CLIP_TASK_QUEUE`, `JOX_CLIP_WORKER_URL`, `JOX_CLIP_TASK_SERVICE_ACCOUNT_EMAIL`.

Worker: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. For explicit local worker testing only: `JOX_CLIP_LOCAL_WORKER_TOKEN` and `NODE_ENV=development`. A missing/untrusted creator avatar uses a deterministic, worker-generated initials avatar; local POC fixtures are never a production fallback.

## Human setup

Enable the APIs, replacing every placeholder before execution:

```sh
gcloud services enable run.googleapis.com cloudtasks.googleapis.com artifactregistry.googleapis.com --project=PROJECT_ID
gcloud tasks queues create JOX_QUEUE --location=REGION --project=PROJECT_ID
gcloud iam service-accounts create JOX_TASK_INVOKER --project=PROJECT_ID
gcloud builds submit --config=worker/cloudbuild.yaml --substitutions=_IMAGE=REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/jox-clip-worker:VERSION --project=PROJECT_ID .
gcloud run deploy JOX_WORKER --image REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/jox-clip-worker:VERSION --region=REGION --no-allow-unauthenticated --concurrency=1 --memory=1Gi --timeout=300 --set-secrets=SUPABASE_SERVICE_ROLE_KEY=SECRET_NAME:latest --set-env-vars=NEXT_PUBLIC_SUPABASE_URL=SUPABASE_URL
```

Grant the GigWay runtime identity Cloud Tasks Enqueuer and `iam.serviceAccounts.actAs` for that task-invoker account. Grant the task-invoker account Cloud Run Invoker on this worker service. Set the queue-producer variables in GigWay and configure `JOX_CLIP_WORKER_URL` to the deployed Cloud Run `run.app` URL; the OIDC audience is that same service URL. Use Secret Manager or an equivalent managed secret source for the worker service role; do not create downloaded service-account keys.

Start conservatively: Cloud Run concurrency `1`, one CPU, at least 1 GiB memory, and a request timeout that exceeds the renderer's 120-second child-process timeout. Configure the queue with one concurrent dispatch, bounded retries (for example max attempts 5, minimum backoff 30s, maximum backoff 10m, max doublings 3). Do not configure unlimited retries.

Smoke test by creating a public published Jox, then creator-POSTing its existing Jox Clip API. Confirm the queue task, worker logs, `jox_renditions` transition, private object, and same-origin delivery route. Never send source URLs or service-role credentials in task payloads.

For explicit local-only worker testing, set the worker Supabase variables, `NODE_ENV=development`, and `JOX_CLIP_LOCAL_WORKER_TOKEN`; run `node worker/jox-clip-worker.mjs`, then POST `{"renditionId":"UUID"}` to `http://localhost:8080/tasks/render-jox-clip` with `Authorization: Bearer LOCAL_TOKEN`. This is never invoked automatically by the Next.js request route.
