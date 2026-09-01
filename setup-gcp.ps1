param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectId,

  [string]$Region = "asia-south1",
  [string]$EnvFile = ".env",
  [string]$GitHubOwner = "",
  [string]$GitHubRepo = "",
  [string]$Suffix = ""
)

$ErrorActionPreference = "Continue"

if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
  Write-Error "gcloud CLI is not installed. Install from https://cloud.google.com/sdk"
}
if (-not $GitHubOwner) { $GitHubOwner = Read-Host "GitHub owner (user or org)" }
if (-not $GitHubRepo) { $GitHubRepo = Read-Host "GitHub repo name" }
if (-not (Test-Path $EnvFile)) { Write-Error "Env file '$EnvFile' not found." }

gcloud auth list --format="value(account)" 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Error "Not authenticated. Run: gcloud auth login"
}

$saName = "github-actions$Suffix"
$saEmail = "$saName@$ProjectId.iam.gserviceaccount.com"
$secretSuffix = $Suffix
if ($Suffix -eq "-staging") { $secretSuffix = "-staging" }

Write-Host "=== Step 1: Setting project and enabling APIs ==="
gcloud config set project $ProjectId
gcloud services enable run.googleapis.com secretmanager.googleapis.com iamcredentials.googleapis.com

Write-Host "=== Step 2: Parsing $EnvFile ==="
$vars = @{}
$inJson = $false
$jsonLines = @()
foreach ($line in (Get-Content $EnvFile)) {
  $t = $line.Trim()
  if ($inJson) {
    $jsonLines += $line
    if ($t -eq "}") {
      $vars["FIREBASE_SERVICE_ACCOUNT_KEY"] = $jsonLines -join "`n"
      $inJson = $false
      $jsonLines = @()
    }
    continue
  }
  if ($t -match "^FIREBASE_SERVICE_ACCOUNT_KEY\s*=\s*\{") {
    $inJson = $true
    $jsonLines += $line
    continue
  }
  if ($t -and -not $t.StartsWith("#") -and $t.Contains("=")) {
    $k, $v = $t -split "=", 2
    $vars[$k.Trim()] = $v.Trim()
  }
}
Write-Host "Parsed $($vars.Count) variables"

Write-Host "=== Step 3: Creating Secret Manager secrets ==="
$secretMap = @{
  "MONGODB_URI"               = "mongodb-uri$secretSuffix"
  "JWT_ACCESS_SECRET"         = "jwt-access-secret$secretSuffix"
  "JWT_REFRESH_SECRET"        = "jwt-refresh-secret$secretSuffix"
  "FIREBASE_SERVICE_ACCOUNT_KEY" = "firebase-service-account-key$secretSuffix"
}
foreach ($k in $secretMap.Keys) {
  $value = $vars[$k]
  if (-not $value) { Write-Warning "  $k not found in $EnvFile - skipping secret $($secretMap[$k])"; continue }
  $secretName = $secretMap[$k]
  Write-Host "  Upserting secret $secretName ..."
  $value | gcloud secrets create $secretName --data-file=- 2>$null
  if ($LASTEXITCODE -ne 0) {
    $value | gcloud secrets versions add $secretName --data-file=-
  }
}

Write-Host "=== Step 4: Creating service account $saEmail ==="
gcloud iam service-accounts create $saName --display-name="GitHub Actions deployer$Suffix" 2>$null
foreach ($role in @("roles/run.admin", "roles/iam.serviceAccountUser", "roles/storage.admin", "roles/secretmanager.secretAccessor")) {
  Write-Host "  Binding $role ..."
  gcloud projects add-iam-policy-binding $ProjectId --member="serviceAccount:$saEmail" --role=$role --quiet
}

Write-Host "=== Step 5: Creating Workload Identity Federation ==="
gcloud iam workload-identity-pools create gh-actions --location=global --display-name="GitHub Actions" 2>$null
$providerExists = gcloud iam workload-identity-pools providers describe github --location=global --workload-identity-pool=gh-actions --format="value(name)" 2>$null
if (-not $providerExists) {
  gcloud iam workload-identity-pools providers create-oidc github `
    --location=global `
    --workload-identity-pool=gh-actions `
    --display-name="GitHub" `
    --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" `
    --issuer-uri="https://token.actions.githubusercontent.com" `
    --attribute-condition="assertion.repository_owner == '$GitHubOwner'"
}

$projectNumber = gcloud projects describe $ProjectId --format="value(projectNumber)"
$repoBinding = "principalSet://iam.googleapis.com/projects/$projectNumber/locations/global/workloadIdentityPools/gh-actions/attribute.repository/$GitHubOwner/$GitHubRepo"
Write-Host "  Binding repo to impersonate $saEmail ..."
gcloud iam service-accounts add-iam-policy-binding $saEmail --member=$repoBinding --role="roles/iam.workloadIdentityUser" --quiet

Write-Host ""
Write-Host "=== DONE. Add these to GitHub (Settings > Secrets and variables > Actions) ==="
Write-Host ""
Write-Host "SECRETS:"
Write-Host "  WIF_PROVIDER = projects/$projectNumber/locations/global/workloadIdentityPools/gh-actions/providers/github"
Write-Host "  GCP_SERVICE_ACCOUNT = $saEmail"
Write-Host ""
Write-Host "VARIABLES:"
Write-Host "  GCP_PROJECT_ID = $ProjectId"
Write-Host "  GCP_REGION = $Region"
Write-Host "  CLIENT_ORIGIN = $($vars[""CLIENT_ORIGIN""])"
Write-Host "  JWT_ACCESS_EXPIRES_IN = $($vars[""JWT_ACCESS_EXPIRES_IN""])"
Write-Host "  JWT_REFRESH_EXPIRES_IN = $($vars[""JWT_REFRESH_EXPIRES_IN""])"
Write-Host "  FIREBASE_PROJECT_ID = $($vars[""FIREBASE_PROJECT_ID""])"
Write-Host ""
Write-Host "Secret Manager secrets created: mongodb-uri$secretSuffix, jwt-access-secret$secretSuffix, jwt-refresh-secret$secretSuffix, firebase-service-account-key$secretSuffix"