# M2M And Webhook Smoke

The local smoke script proves the public data-plane identity and event-ingestion seams without real customer systems.

```powershell
.\scripts\m2m-and-webhook-smoke.ps1
```

It checks:

- machine client token request
- scoped API call
- webhook signing secret creation
- signed source event accepted
- replay rejected
- bad signature rejected

If the backend is not running, the script prints the startup command and exits without attempting network mutations.

The script uses seeded demo credentials and generated local API clients only. Do not use real webhook secrets, customer event payloads, or production endpoints.
