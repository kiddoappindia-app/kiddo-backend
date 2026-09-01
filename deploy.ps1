param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectId,

  [string]$Region = "asia-south1",
  [string]$ServiceName = "kiddo-backend",
  [string]$EnvFile = ".env",
  [string]$Image = ""
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
  Write-Error "gcloud CLI is not installed. Install it from https://cloud.google.com/sdk"
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Write-Error "Docker is not installed or not on PATH."
}

if (-not $Image) {
  $Image = "gcr.io/$ProjectId/$ServiceName"
}

if (-not (Test-Path $EnvFile)) {
  Write-Error "Env file '$EnvFile' not found. Copy .env.example to .env and fill in values first."
}

$envVars = @{}
Get-Content $EnvFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
    $key, $value = $line -split "=", 2
    $envVars[$key.Trim()] = $value.Trim()
  }
}

$yamlFile = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) ".cloud-run.env.yaml"
$yamlLines = foreach ($entry in $envVars.GetEnumerator() | Sort-Object Key) {
  $value = $entry.Value -replace '"', '\"'
  "$($entry.Key): `"$value`""
}
Set-Content -Path $yamlFile -Value $yamlLines -Encoding UTF8
Write-Host "Wrote $envVars.Count env vars to $yamlFile"

Write-Host "Building image $Image ..."
docker build -t $Image .
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Pushing image $Image ..."
docker push $Image
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Deploying $ServiceName to Cloud Run ($Region) ..."
gcloud run deploy $ServiceName `
  --project=$ProjectId `
  --image=$Image `
  --platform=managed `
  --region=$Region `
  --allow-unauthenticated `
  --memory=512Mi `
  --cpu=1 `
  --min-instances=0 `
  --max-instances=10 `
  --timeout=300 `
  --env-vars-file=$yamlFile
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Deployment complete. Service URL: https://$ServiceName-$ProjectId-uc.a.run.app"