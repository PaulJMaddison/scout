# Licence Install Rehearsal

This is a local proof for the paid-pilot licence handoff. It does not use production signing keys or customer secrets.

## Flow

1. Start the cloud API/portal in `C:\universalcontextlayer-cloud`.
2. Sign in with seeded local credentials.
3. Issue a development licence for a fictional account.
4. Download the `.ucl-licence.json` file.
5. Place it outside tracked source, for example:

```text
C:\UCL\.local\licences\pilot.ucl-licence.json
```

6. Run:

```powershell
.\scripts\licence-install-rehearsal.ps1
```

7. Start the public data plane with:

```text
Licence__Mode=Licensed
Licence__FilePath=C:\UCL\.local\licences\pilot.ucl-licence.json
```

8. Verify:

```http
GET /api/v1/licence/status
```

## Known Gap To Check

The public open-core data plane has a local licence-file seam. If the cloud-generated signed envelope differs from the current public local reader schema, record that mismatch before the first customer install and do not promise automated licence installation until the schema is aligned.
