# KidDo Backend — Docker & Google Cloud Deployment

This guide covers running the backend in Docker locally and deploying it to Google Cloud Run.

## Local Docker

Requirements: Docker (with Compose v2).

```bash
# Copy the example env and fill in real values
cp .env.example .env

# Build image and start backend + MongoDB together
docker compose up --build
```

- API: `http://localhost:4000` (health check: `http://localhost:4000/health`)
- Swagger docs: `http://localhost:4000/api-docs`
- MongoDB is exposed on `localhost:27017` inside the `kiddo-mongodb` container.

Build the image alone: `docker build -t kiddo-backend .`
Run it alone (MongoDB must be reachable): `docker run -p 4000:4000 --env-file .env kiddo-backend`

## Deploy to Google Cloud Run (manual, from your machine)

### 1. Prerequisites

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com) and note the **Project ID**.
2. Enable required APIs:
   - Cloud Run API
   - Artifact Registry API (optional; `gcr.io` works without it)
   - Secret Manager API
   - Cloud Build API (only needed if you use the CI/CD path below)
3. Install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) and authenticate:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

> **Automated setup:** once gcloud is installed and authenticated, run
> `.\setup-gcp.ps1 -ProjectId YOUR_PROJECT_ID` to do steps 2–5 below automatically —
> it creates the Secret Manager secrets from your `.env`, the deployer service account,
> IAM bindings, and the Workload Identity Federation pool/provider, then prints the
> exact GitHub secret/variable values to paste. Use `-Suffix "-dev"` / `-Suffix "-staging"`
> to provision the dev/staging environments.

### 2. Store secrets in Secret Manager (recommended)

Create secrets for anything sensitive. Cloud Run can mount them as env vars.

```bash
# Plain-text env vars can be passed directly (NODE_ENV, PORT, CLIENT_ORIGIN, JWT expiry)
# Secrets should go in Secret Manager:
printf '%s' 'mongodb+srv://user:pass@cluster.mongodb.net/kiddo?retryWrites=true&w=majority' | gcloud secrets create mongodb-uri --data-file=-
printf '%s' 'your-64-char-access-secret' | gcloud secrets versions add mongodb-uri --data-file=-
# Repeat the two commands above for: jwt-access-secret, jwt-refresh-secret,
# and firebase-service-account-key (the single-line service account JSON).

# Grant the default compute service account access to read secrets
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 3. Configure env vars and deploy

Non-secret vars are read from your `.env` file. Fill in `.env` (from `.env.example`) with:
`NODE_ENV=production`, `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
`CLIENT_ORIGIN` (e.g. `https://kiddoapp.in,https://www.kiddoapp.in`),
and optionally `FIREBASE_SERVICE_ACCOUNT_KEY`.

```powershell
# Windows PowerShell
.\deploy.ps1 -ProjectId YOUR_PROJECT_ID
```

The script builds the image, pushes it to `gcr.io/<project>/kiddo-backend`, and deploys
it to Cloud Run in `asia-south1` (change `-Region` if needed). It also writes a
`.cloud-run.env.yaml` from your `.env` for `--env-vars-file`.

Cloud Run injects `PORT=8080` automatically; the app reads `PORT` from the environment,
so no change is needed.

### 4. Verify

- Health check: `https://kiddo-backend-<project>-uc.a.run.app/health`
- Swagger docs: `https://kiddo-backend-<project>-uc.a.run.app/api-docs`
- Add the Cloud Run URL to `CLIENT_ORIGIN` if your web app calls it directly.

### Updating

Redeploy with the same command — Cloud Run creates a new revision with the new image.

## CI/CD with Google Cloud Build (push-to-deploy)

1. Create the Secret Manager secrets listed in step 2 (Cloud Build reads them at deploy time).
2. In the Cloud Console, go to **Cloud Build > Triggers > Create trigger**:
   - Event: *Push to a branch* (e.g. `main`)
   - Source: your GitHub/GitLab repository
   - Config: *Cloud Build configuration file*, path `cloudbuild.yaml`
   - Service account: the default Cloud Build SA (needs `roles/run.admin`, `roles/iam.serviceAccountUser`, and `roles/secretmanager.secretAccessor`)
3. Every push to the branch builds the image, pushes it to `gcr.io`, and deploys a new Cloud Run revision.

Notes:
- The region is set to `asia-south1` in `cloudbuild.yaml`; change it if you deploy elsewhere.
- `cloudbuild.yaml` uses `--set-secrets`, so the four secrets above must exist in the same project.
- MongoDB: the app connects to whatever `MONGODB_URI` points to (e.g. MongoDB Atlas).
  Whitelist the Cloud Run egress IPs or enable VPC/private connectivity for production.
- Socket.IO works on Cloud Run, but long-lived WebSocket connections count against the
  request timeout (`--timeout=300`). Increase it if clients stay connected longer.

## CI/CD with GitHub Actions

Two workflows live in `.github/workflows/`:

- `ci.yml` — runs `npm ci`, typecheck (`npm run lint`), and `npm run build` on every push/PR to `main`.
- `deploy.yml` — builds the Docker image, pushes it to `gcr.io`, and deploys to Cloud Run on every push to `main` (also manually triggerable via *Actions > Deploy to Cloud Run > Run workflow*).

### GitHub repo setup

**Repository secrets** (Settings > Secrets and variables > Actions):

| Secret | Value |
|---|---|
| `WIF_PROVIDER` | Workload Identity Federation provider ID, e.g. `projects/123456789/locations/global/workloadIdentityPools/gh-actions/providers/github` |
| `GCP_SERVICE_ACCOUNT` | Deployer SA email, e.g. `github-actions@<project>.iam.gserviceaccount.com` |

**Repository variables** (same page, *Variables* tab):

| Variable | Example |
|---|---|
| `GCP_PROJECT_ID` | `kiddo-backend-prod` |
| `GCP_REGION` | `asia-south1` |
| `CLIENT_ORIGIN` | `https://kiddoapp.in,https://www.kiddoapp.in` |
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `FIREBASE_PROJECT_ID` | `kiddo-bf68d` |

### Google Cloud setup (one time)

1. Create the workload identity pool and provider:

```bash
gcloud iam workload-identity-pools create gh-actions \
  --location=global \
  --display-name="GitHub Actions"

gcloud iam workload-identity-pools providers create-oidc github \
  --location=global \
  --workload-identity-pool=gh-actions \
  --display-name="GitHub" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository_owner == 'YOUR_GITHUB_ORG_OR_USER'"
```

2. Create the deployer service account and grant permissions:

```bash
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions deployer"

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:github-actions@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:github-actions@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:github-actions@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:github-actions@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

3. Allow the GitHub repo to impersonate the service account:

```bash
gcloud iam service-accounts add-iam-policy-binding \
  github-actions@$GCP_PROJECT_ID.iam.gserviceaccount.com \
  --member="principalSet://iam.googleapis.com/projects/$GCP_PROJECT_NUMBER/locations/global/workloadIdentityPools/gh-actions/attribute.repository/YOUR_GITHUB_ORG_OR_USER/YOUR_REPO_NAME" \
  --role="roles/iam.workloadIdentityUser"
```

4. Grab the provider ID and SA email from the console (or output above) and set the `WIF_PROVIDER` and `GCP_SERVICE_ACCOUNT` secrets in GitHub.

5. The Secret Manager secrets from step 2 of the manual deploy section (`mongodb-uri`, `jwt-access-secret`, `jwt-refresh-secret`, `firebase-service-account-key`) must exist — the workflow references them via `--set-secrets`-style `secrets:` mapping.

After that, every push to `main` runs CI, then builds and deploys a new Cloud Run revision automatically.

### Dev environment (dev branch)

`deploy-dev.yml` deploys every push to the `dev` branch to a separate Cloud Run service
`kiddo-backend-dev` (useful for `dev.kiddoapp.in`). It uses its own set of variables and
secrets, all suffixed `_DEV`:

| Kind | Name |
|---|---|
| Secrets | `WIF_PROVIDER_DEV`, `GCP_SERVICE_ACCOUNT_DEV` |
| Variables | `GCP_PROJECT_ID_DEV`, `GCP_REGION_DEV`, `CLIENT_ORIGIN_DEV`, `JWT_ACCESS_EXPIRES_IN_DEV`, `JWT_REFRESH_EXPIRES_IN_DEV`, `FIREBASE_PROJECT_ID_DEV` |
| Secret Manager secrets | `mongodb-uri-dev`, `jwt-access-secret-dev`, `jwt-refresh-secret-dev`, `firebase-service-account-key-dev` |

You can reuse the same GCP project (create the four secrets with the `-dev` suffix in the
same project) or use a separate project for dev. Either way, the workload identity setup
(step 1 of the Google Cloud setup above) must be repeated for the dev project, or the dev
SA granted access to the existing pool.

### Staging environment (staging branch)

`deploy-staging.yml` deploys every push to the `staging` branch to a separate Cloud Run
service `kiddo-backend-staging` for pre-prod testing. It mirrors production settings
(`NODE_ENV=production`) but uses its own set of variables and secrets, all suffixed
`_STAGING`:

| Kind | Name |
|---|---|
| Secrets | `WIF_PROVIDER_STAGING`, `GCP_SERVICE_ACCOUNT_STAGING` |
| Variables | `GCP_PROJECT_ID_STAGING`, `GCP_REGION_STAGING`, `CLIENT_ORIGIN_STAGING`, `JWT_ACCESS_EXPIRES_IN_STAGING`, `JWT_REFRESH_EXPIRES_IN_STAGING`, `FIREBASE_PROJECT_ID_STAGING` |
| Secret Manager secrets | `mongodb-uri-staging`, `jwt-access-secret-staging`, `jwt-refresh-secret-staging`, `firebase-service-account-key-staging` |

The same workload identity setup applies — either a separate pool/SA for staging or grant
the staging SA access to the existing pool.