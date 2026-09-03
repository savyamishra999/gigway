# Media Inspection worker

The existing private Cloud Run worker service exposes a separate `POST /tasks/inspect-media` task endpoint. It accepts only `{"inspectionId":"<uuid>"}`. The worker reloads the inspection row and derives the only accepted temporary object path from `uploader_user_id`; it never accepts an arbitrary storage path or a signed URL.

For `jox_audio`, the worker downloads the private source, runs `ffprobe`, and accepts only one `opus` audio stream in a WebM container, with a trusted duration of 1–27 seconds and a trusted size no greater than 10 MB. Rejected objects are removed immediately. `POST /tasks/cleanup-media-inspections` removes stale pending, processing, and failed temporary objects/rows older than 24 hours. A scheduler must invoke it; it is not automatically active merely because this code exists.

Configure a separate queue and task-invoker identity:

```sh
gcloud tasks queues create MEDIA_INSPECTION_QUEUE --location=REGION --project=PROJECT_ID
gcloud iam service-accounts create MEDIA_INSPECTION_TASK_INVOKER --project=PROJECT_ID
gcloud run services add-iam-policy-binding WORKER_SERVICE --region=REGION --member=serviceAccount:MEDIA_INSPECTION_TASK_INVOKER@PROJECT_ID.iam.gserviceaccount.com --role=roles/run.invoker
```

Grant GigWay's runtime identity `roles/cloudtasks.enqueuer` and `iam.serviceAccounts.actAs` on that task-invoker identity. Deploy the existing worker image revision with the new module, retain `SUPABASE_SERVICE_ROLE_KEY` only through Secret Manager, and configure Vercel/server variables: `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_REGION`, `MEDIA_INSPECTION_TASK_QUEUE`, `MEDIA_INSPECTION_WORKER_URL`, and `MEDIA_INSPECTION_TASK_SERVICE_ACCOUNT_EMAIL`.

Configure Cloud Scheduler with OIDC to POST to the private worker's `/tasks/cleanup-media-inspections` endpoint at an appropriate bounded cadence, for example hourly. Alternatively, Cloud Scheduler may enqueue an authenticated cleanup task through a dedicated queue producer. Do not make the worker public.

This worker shares only container infrastructure with Jox Clip rendering: FFprobe verifies trusted source metadata; FFmpeg remains reserved for later Jox Clip rendering/transcoding.
