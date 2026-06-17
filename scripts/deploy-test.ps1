# =============================================================================
# Universidad X -- Deploy al servidor de pruebas (RHEL 10)
# Uso normal:         .\scripts\deploy-test.ps1
# Solo reiniciar:     .\scripts\deploy-test.ps1 -Restart
#
# Primera vez, instalar Docker primero:
#   py -3 scripts/server-install-docker.py "<sudo_password>"
# =============================================================================

param(
    [string]$Server  = "10.118.67.55",
    [string]$User    = "usr_admin",
    [string]$AppDir  = "/opt/universidadx",
    [switch]$Restart
)

$ErrorActionPreference = "Stop"
$SshKey = "$env:USERPROFILE\.ssh\id_ed25519_ux"

function Log-Info  { param($msg) Write-Host "[deploy] $msg" -ForegroundColor Green  }
function Log-Warn  { param($msg) Write-Host "[warn]   $msg" -ForegroundColor Yellow }
function Log-Error { param($msg) Write-Host "[error]  $msg" -ForegroundColor Red    }

$ProjectRoot = Split-Path $PSScriptRoot -Parent

Log-Info "============================================================"
Log-Info "  Universidad X -- Deploy a $Server"
Log-Info "============================================================"

# -- 0. Verificar SSH ---------------------------------------------------------
if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
    Log-Error "ssh no encontrado. Instala OpenSSH: Settings > Apps > Optional features"
    exit 1
}
if (-not (Test-Path $SshKey)) {
    Log-Error "Clave SSH no encontrada: $SshKey"
    Log-Error "Ejecuta primero: py -3 scripts/_ssh_setup.py '<password>'"
    exit 1
}

# -- 1. Verificar Docker en el servidor ---------------------------------------
Log-Info "Paso 1/4: Verificando Docker en el servidor..."

$dockerOut = & ssh -i $SshKey -o StrictHostKeyChecking=accept-new -o BatchMode=yes `
    "${User}@${Server}" "command -v docker && sudo docker --version || echo DOCKER_NOT_FOUND" 2>&1

if ("$dockerOut" -match "DOCKER_NOT_FOUND") {
    Log-Warn "Docker no instalado. Ejecuta primero:"
    Log-Warn "  py -3 scripts/server-install-docker.py '<sudo_password>'"
    exit 1
}
Log-Info "Docker OK: $dockerOut"

# -- 2. Preparar variables de entorno -----------------------------------------
$EnvLocal = "$ProjectRoot\.env.test-server"
if (-not (Test-Path $EnvLocal)) { $EnvLocal = "$ProjectRoot\.env" }
if (-not (Test-Path $EnvLocal)) {
    Log-Error "No encontrado: .env.test-server ni .env en $ProjectRoot"
    exit 1
}
Log-Info "Usando variables de: $EnvLocal"

# -- 3. Empaquetar y transferir proyecto -------------------------------------
if (-not $Restart) {
    Log-Info "Paso 3/4: Transfiriendo archivos del proyecto..."

    $TarFile = "$env:TEMP\universidadx-deploy.tar.gz"

    $excludes = @(
        "--exclude=./node_modules",
        "--exclude=./.next",
        "--exclude=./dist",
        "--exclude=./__pycache__",
        "--exclude=./.venv",
        "--exclude=./venv",
        "--exclude=./android/.gradle",
        "--exclude=./android/build",
        "--exclude=./android/app/build",
        "--exclude=./*.log",
        "--exclude=./scripts/_ssh_setup.py"
    )

    $tarArgs = @("-czf", $TarFile) + $excludes + @("-C", $ProjectRoot, ".")
    & tar @tarArgs
    $sizeMB = [math]::Round((Get-Item $TarFile).Length / 1MB, 1)
    Log-Info "Paquete: $sizeMB MB -- transfiriendo..."

    & scp -i $SshKey -o StrictHostKeyChecking=accept-new `
        $TarFile "${User}@${Server}:/tmp/ux-deploy.tar.gz"

    $extractCmd = "set -e; mkdir -p ${AppDir}; tar -xzf /tmp/ux-deploy.tar.gz -C ${AppDir}; rm /tmp/ux-deploy.tar.gz; echo 'OK extraido'"
    & ssh -i $SshKey -o StrictHostKeyChecking=accept-new -o BatchMode=yes `
        "${User}@${Server}" $extractCmd

    Remove-Item $TarFile -ErrorAction SilentlyContinue

    # Sobreescribir .env raiz con la version del servidor de pruebas
    Log-Info "Aplicando .env del servidor de pruebas..."
    & scp -i $SshKey -o StrictHostKeyChecking=accept-new `
        $EnvLocal "${User}@${Server}:${AppDir}/.env"
}

# -- En modo -Restart, solo copiar .env y reiniciar (sin retransferir archivos)
if ($Restart) {
    Log-Info "Modo -Restart: actualizando .env y reiniciando servicios..."
    & ssh -i $SshKey -o StrictHostKeyChecking=accept-new -o BatchMode=yes `
        "${User}@${Server}" "mkdir -p ${AppDir}"
    & scp -i $SshKey -o StrictHostKeyChecking=accept-new `
        $EnvLocal "${User}@${Server}:${AppDir}/.env"
}

# -- 4. Build y arrancar servicios -------------------------------------------
Log-Info "Paso 4/4: Construyendo imagenes y arrancando servicios (5-10 min)..."

$deployCmd = @"
set -e
cd ${AppDir}
echo '>>> docker compose build...'
sudo docker compose build --parallel 2>&1 | tail -30
echo '>>> docker compose up -d...'
sudo docker compose up -d --remove-orphans
echo '>>> Esperando 25 seg...'
sleep 25
echo '>>> Estado:'
sudo docker compose ps
echo ''
echo '>>> Logs clave (5 lineas por servicio):'
for svc in auth-service lms-service web; do
  echo "--- `$svc ---"
  sudo docker compose logs --tail=5 "`$svc" 2>&1 || true
done
"@

& ssh -i $SshKey -o StrictHostKeyChecking=accept-new -o BatchMode=yes `
    "${User}@${Server}" $deployCmd

Write-Host ""
Log-Info "============================================================"
Log-Info "  Deploy completado"
Log-Info ""
Log-Info "  Web:           http://${Server}:8080"
Log-Info "  pgAdmin:       http://${Server}:5050"
Log-Info "  Mongo Express: http://${Server}:8082"
Log-Info ""
Log-Info "  Logs:    ssh -i $SshKey ${User}@${Server} 'cd ${AppDir} && sudo docker compose logs -f web'"
Log-Info "  Detener: ssh -i $SshKey ${User}@${Server} 'cd ${AppDir} && sudo docker compose down'"
Log-Info "============================================================"
