# =============================================================================
# Configura autenticación SSH por clave para el servidor de pruebas
# Ejecutar UNA sola vez. Luego ya no necesitas contraseña.
# =============================================================================

param(
    [string]$Server = "10.118.67.55",
    [string]$User   = "usr_admin"
)

$KeyPath = "$env:USERPROFILE\.ssh\id_ed25519_universidadx"

Write-Host "[ssh-key] Configurando acceso sin contraseña a ${User}@${Server}" -ForegroundColor Green

# 1. Generar clave si no existe
if (-not (Test-Path $KeyPath)) {
    Write-Host "[ssh-key] Generando clave ED25519..." -ForegroundColor Green
    ssh-keygen -t ed25519 -C "universidadx-deploy" -f $KeyPath -N '""'
} else {
    Write-Host "[ssh-key] Clave ya existe en $KeyPath" -ForegroundColor Yellow
}

# 2. Copiar clave pública al servidor (pedirá contraseña UNA última vez)
Write-Host "[ssh-key] Copiando clave pública al servidor (se pedirá contraseña por última vez)..." -ForegroundColor Green
$PubKey = Get-Content "$KeyPath.pub"

& ssh -o StrictHostKeyChecking=accept-new "${User}@${Server}" @"
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh
    echo '$PubKey' >> ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/authorized_keys
    echo 'Clave agregada correctamente'
"@

# 3. Agregar al ssh config local
$SshConfig = "$env:USERPROFILE\.ssh\config"
$Entry = @"

Host ux-test
    HostName $Server
    User     $User
    IdentityFile $KeyPath
    StrictHostKeyChecking accept-new
"@

if (-not (Test-Path $SshConfig) -or -not (Select-String -Path $SshConfig -Pattern "ux-test" -Quiet)) {
    Add-Content -Path $SshConfig -Value $Entry
    Write-Host "[ssh-key] Alias 'ux-test' agregado a ~/.ssh/config" -ForegroundColor Green
}

Write-Host ""
Write-Host "[ssh-key] Listo. Ahora puedes conectarte con:" -ForegroundColor Green
Write-Host "  ssh ux-test" -ForegroundColor Cyan
Write-Host "  O ejecutar el deploy sin contraseña:" -ForegroundColor Green
Write-Host "  .\scripts\deploy-test.ps1" -ForegroundColor Cyan
