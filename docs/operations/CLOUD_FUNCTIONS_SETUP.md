# Cloud Functions Setup (Firebase)

This guide configures the Storage triggers that drive the photo moderation pipeline.

## 1) Configure Runtime Secrets

Set the backend storage webhook endpoint and secret in Functions config.

```
firebase functions:config:set \
  photo.storage_webhook_url="https://api.yourapp.com/internal/photos/storage/upload" \
  photo.storage_webhook_secret="<your-storage-webhook-secret>" \
  photo.storage_webhook_max_retries="3" \
  photo.storage_webhook_retry_base_ms="1000"

# Verify
firebase functions:config:get
```

Expected to match backend env:

- Backend `.env` `PHOTO_STORAGE_WEBHOOK_SECRET` must equal `photo.storage_webhook_secret`.
- Backend endpoint: `/internal/photos/storage/upload`.

## 2) Deploy

```
firebase deploy --only functions
```

## 3) Alerts & Monitoring

- Errors are logged via `functions.logger.error` and visible in Cloud Logging / Error Reporting.
- For on-call notifications, add a Log-based metric filtered by:
  - resource.type="cloud_function"
  - severity>=ERROR
  - textPayload or jsonPayload contains "Failed to invoke moderation webhook"
- Create an Alerting policy on the metric with your preferred channel (email, Slack, etc.).

## 4) What the Function Sends

On image upload under `users/{uid}/photos/*`, the function collects and posts:

- `record.name`: storage object path
- `record.metadata`: includes `public_url`, `hash`, `width`, `height`, `bytes` (if determinable)

Backend will then create/update `photo_meta` and kick off image moderation via Supabase Edge Functions.

