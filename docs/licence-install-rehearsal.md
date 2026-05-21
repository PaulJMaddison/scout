# Licence Install Rehearsal

This is a local proof for the paid-pilot licence handoff. It does not use production signing keys or customer secrets.

## Flow

1. Start the cloud API/portal in `C:\scout-cloud`.
2. Sign in with seeded local credentials.
3. Issue a development licence for a fictional account.
4. Download the `.scout-licence.json` file.
5. Place it outside tracked source, for example:

```text
C:\Scout\.local\licences\pilot.scout-licence.json
```

6. Run:

```powershell
.\scripts\licence-install-rehearsal.ps1
```

7. Start the public data plane with:

```text
Licence__Mode=Licensed
Licence__FilePath=C:\Scout\.local\licences\pilot.scout-licence.json
Licence__PublicKeyPem=<cloud licence public verification key from local config or secret store>
```

8. Verify:

```http
GET /api/v1/licence/status
```

## Local Code Path

The open-core data plane now supports both:

- the older local `LocalLicenceDocument` shape used by open-core demos
- the cloud control-plane `Scout-LICENCE-v1` signed envelope shape

When `Licence__PublicKeyPem` is set, the data plane verifies the cloud envelope signature before treating it as active. For local development only, the reader can parse an envelope without a public key and returns a warning on `/api/v1/licence/status`; do not use that warning state for a customer install.

The rehearsal script checks the local file path, prints the required environment values, and, when the backend is running, signs in with seeded local credentials and calls the licence status endpoint without printing tokens or licence content.
