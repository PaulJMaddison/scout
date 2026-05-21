# Release Process

This document describes the coordinated release process for the three KynticAI Scout repositories:

| Repository | Visibility | Purpose |
|---|---|---|
| [scout](https://github.com/PaulJMaddison/scout) | Public | Open-source core: domain, APIs, SDKs, React frontend |
| [scout-enterprise](https://github.com/PaulJMaddison/scout-enterprise) | Private | Enterprise extensions: connectors, governance, identity, deployment |
| [scout-cloud](https://github.com/PaulJMaddison/scout-cloud) | Private | Hosted control plane: accounts, licensing, billing, portal |

All three repositories **must** be versioned together. A release is not complete until every repo has been tagged with the same version.

---

## Version Numbering

Scout follows [Semantic Versioning 2.0.0](https://semver.org/):

```
vMAJOR.MINOR.PATCH
```

| Bump | When |
|---|---|
| **MAJOR** | Breaking changes to the public API contract, GraphQL schema, REST endpoints, SDK interfaces, or data model migrations that are not backwards-compatible. |
| **MINOR** | New features, new endpoints, new connector families, new SDK capabilities, or backwards-compatible enhancements. |
| **PATCH** | Bug fixes, security patches, documentation corrections, or performance improvements with no API surface change. |

### Rules

1. The version string always takes the form `vX.Y.Z` (with the `v` prefix) for git tags and GitHub Releases.
2. Internal file references (`.csproj`, `package.json`, `Chart.yaml`) use `X.Y.Z` without the `v` prefix.
3. Pre-release versions (e.g. `v2.8.0-rc.1`) may be used for release candidates but are not covered by the standard release flow below.
4. All three repos share the same version number. There is no independent versioning.

---

## Cross-Repo Versioning

The open-source, enterprise, and cloud repositories are released as a coordinated set:

- **Same version**: All three repos carry the same `vX.Y.Z` tag for every release.
- **Open-source first**: The public repo is always tagged first so the GitHub Release workflow runs and creates the release artefact before the private repos are tagged.
- **No partial releases**: If a release cannot be completed across all three repos, it must be rolled back or held until all repos are ready.

### Where version numbers live

| Repository | Files |
|---|---|
| Open-source | `Directory.Build.props` (`<Version>`, `<AssemblyVersion>`, `<FileVersion>`, `<InformationalVersion>`), `apps/web/package.json`, `packages/typescript/scout-sdk/package.json` |
| Enterprise | `Directory.Build.props` (same properties) |
| Cloud | `Directory.Build.props` (same properties), `apps/cloud-portal/package.json`, `deploy/helm/Chart.yaml` |

Use `scripts/bump-version.sh` to update all version references in a given repo.

---

## Pre-Release Checklist

Before starting the release process, verify **every** item:

- [ ] All tests pass in the open-source repo (73 tests)
- [ ] All tests pass in the enterprise repo (132 tests)
- [ ] All tests pass in the cloud repo (55 tests)
- [ ] Run `scripts/check-release-alignment.sh` in the open-source repo -- no warnings
- [ ] No secret leaks: review `git diff` for API keys, signing keys, connection strings, or customer data
- [ ] Version numbers updated in all relevant files across all three repos
- [ ] `CHANGELOG.md` updated in all three repos (root-level changelog)
- [ ] `docs/releases/CHANGELOG.md` updated in the open-source repo (cross-repo changelog)
- [ ] Docker images build successfully for enterprise and cloud
- [ ] No uncommitted changes in any repo (`git status` is clean)
- [ ] All branches are up to date with their respective `main` branches

---

## Release Steps

Follow these steps **in order**. Do not skip or reorder.

### 1. Create release branches

In each of the three repos:

```bash
git checkout main
git pull origin main
git checkout -b release/vX.Y.Z
```

### 2. Update version numbers

In each repo, run the version bump script:

```bash
# Open-source
./scripts/bump-version.sh X.Y.Z

# Enterprise (from enterprise repo root)
./scripts/bump-version.sh X.Y.Z

# Cloud (from cloud repo root)
./scripts/bump-version.sh X.Y.Z
```

If a repo does not yet have a `bump-version.sh` script, manually update the version in `Directory.Build.props` and any `package.json` or `Chart.yaml` files.

### 3. Update changelogs

Update the following files with the new version entry:

- **Open-source**: `CHANGELOG.md` (root) and `docs/releases/CHANGELOG.md`
- **Enterprise**: `CHANGELOG.md`
- **Cloud**: `CHANGELOG.md`

Follow the [Keep a Changelog](https://keepachangelog.com/) format with categories: Added, Changed, Fixed, Removed, Security, Breaking Changes.

### 4. Run the full test suite

```bash
# Open-source
dotnet test KynticAI.Scout.slnx --configuration Release

# Enterprise
dotnet test KynticAIScout.Enterprise.slnx --configuration Release

# Cloud
dotnet test ScoutCloudControlPlane.slnx --configuration Release
```

All tests must pass. Do not proceed if any test fails.

### 5. Commit and merge release branches

```bash
git add -A
git commit -m "Release vX.Y.Z"
git checkout main
git merge release/vX.Y.Z --no-ff -m "Merge release/vX.Y.Z"
git push origin main
```

Repeat for all three repos.

### 6. Tag the open-source repo first

```bash
cd /path/to/scout
./scripts/tag-release.sh vX.Y.Z
```

This creates an annotated tag and pushes it to origin. The GitHub Actions `release.yml` workflow will automatically:
- Build and test the solution
- Create a GitHub Release with auto-generated release notes

**Wait** for the GitHub Release to appear before proceeding.

### 7. Tag the enterprise repo

```bash
cd /path/to/scout-enterprise
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```

### 8. Tag the cloud repo

```bash
cd /path/to/scout-cloud
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```

### 9. Verify the GitHub Release (open-source)

- Navigate to [GitHub Releases](https://github.com/PaulJMaddison/scout/releases)
- Confirm the release was created by the workflow
- Review the auto-generated release notes
- Edit the release notes if needed to add cross-repo context

### 10. Build and push Docker images (enterprise and cloud)

```bash
# Enterprise
docker build -t scout-enterprise:vX.Y.Z .
docker tag scout-enterprise:vX.Y.Z <registry>/scout-enterprise:vX.Y.Z
docker tag scout-enterprise:vX.Y.Z <registry>/scout-enterprise:latest
docker push <registry>/scout-enterprise:vX.Y.Z
docker push <registry>/scout-enterprise:latest

# Cloud
docker build -t scout-cloud-api:vX.Y.Z -f src/Scout.Cloud.Api/Dockerfile .
docker tag scout-cloud-api:vX.Y.Z <registry>/scout-cloud-api:vX.Y.Z
docker tag scout-cloud-api:vX.Y.Z <registry>/scout-cloud-api:latest
docker push <registry>/scout-cloud-api:vX.Y.Z
docker push <registry>/scout-cloud-api:latest
```

### 11. Verify packages are accessible

- [ ] GitHub Release page shows the correct tag and release notes
- [ ] Docker images are pullable: `docker pull <registry>/scout-enterprise:vX.Y.Z`
- [ ] NuGet packages (if published) are available
- [ ] npm packages (if published) are available

---

## Post-Release Checklist

- [ ] GitHub Releases created with notes for open-source repo
- [ ] Docker images tagged and pullable for enterprise and cloud
- [ ] Marketing site version references updated (README badges, landing page)
- [ ] `docs/roadmap.md` updated if the release closes planned milestones
- [ ] Announce the release internally and to any active pilot customers
- [ ] Build and verify the production web app if frontend changes were included:
  ```bash
  cd apps/web && npm run build
  ```

---

## Hotfix Process

Hotfixes are for critical bug fixes or security patches that cannot wait for the next scheduled release.

### Steps

1. **Branch from the release tag**, not from `main`:
   ```bash
   git checkout vX.Y.Z
   git checkout -b hotfix/vX.Y.(Z+1)
   ```

2. **Apply the fix** with minimal changes. Do not bundle unrelated features.

3. **Bump the patch version** in all three repos:
   ```bash
   ./scripts/bump-version.sh X.Y.(Z+1)
   ```

4. **Update changelogs** with the hotfix entry.

5. **Run the full test suite** in all three repos.

6. **Merge to main** in all three repos:
   ```bash
   git checkout main
   git merge hotfix/vX.Y.(Z+1) --no-ff
   git push origin main
   ```

7. **Tag and release** following the standard release steps (6-11 above).

8. **Cherry-pick to any active release branches** if applicable.

### Hotfix Rules

- Hotfixes always increment the **patch** version.
- The fix must be applied to all three repos, even if only one repo contains the bug, to keep versions aligned.
- If the other repos have no code change, they still get a version bump and changelog entry noting the coordinated release.

---

## Dry Run

Both release scripts support a `--dry-run` flag that previews changes without modifying anything:

```bash
./scripts/tag-release.sh v2.8.0 --dry-run
./scripts/bump-version.sh 2.8.0 --dry-run
```

Always do a dry run first when preparing a release.

---

## Rollback

If a release must be reverted:

1. **Delete the git tag** locally and remotely:
   ```bash
   git tag -d vX.Y.Z
   git push origin :refs/tags/vX.Y.Z
   ```

2. **Delete the GitHub Release** from the Releases page.

3. **Revert the merge commit** on `main`:
   ```bash
   git revert -m 1 <merge-commit-sha>
   git push origin main
   ```

4. **Remove Docker images** from the registry if they were pushed.

5. Repeat for all three repos.

Rollbacks should be rare. Prefer a hotfix release over a rollback when possible.
