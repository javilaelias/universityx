# =============================================================================
# Verifica el estado del servidor de pruebas
# Uso: .\scripts\status-test.ps1
# =============================================================================

param(
    [string]$Server = "10.118.67.55",
    [string]$User   = "usr_admin"
)

Write-Host "`n[status] Verificando servidor $Server...`n" -ForegroundColor Cyan

# Contenedores
Write-Host "── Contenedores ─────────────────────────────────" -ForegroundColor DarkGray
& ssh -o StrictHostKeyChecking=accept-new "${User}@${Server}" "cd /opt/universidadx && docker compose ps"

# Health de servicios HTTP
Write-Host "`n── Health checks (HTTP) ──────────────────────────" -ForegroundColor DarkGray
$endpoints = @(
    @{ name = "web";                 url = "http://${Server}:3000" },
    @{ name = "auth-service";        url = "http://${Server}:4001/health" },
    @{ name = "lms-service";         url = "http://${Server}:4002/health" },
    @{ name = "notification-service"; url = "http://${Server}:4003/health" },
    @{ name = "helpdesk-service";    url = "http://${Server}:4004/health" },
    @{ name = "sync-service";        url = "http://${Server}:4005/health" },
    @{ name = "ai-service";          url = "http://${Server}:4006/health" },
    @{ name = "credentials-service"; url = "http://${Server}:4007/health" },
)

foreach ($ep in $endpoints) {
    try {
        $r = Invoke-WebRequest -Uri $ep.url -TimeoutSec 5 -ErrorAction Stop
        Write-Host "  ✓ $($ep.name.PadRight(24)) $($ep.url)" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ $($ep.name.PadRight(24)) $($ep.url) — $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "── URLs de acceso ───────────────────────────────" -ForegroundColor DarkGray
Write-Host "  Web:           http://${Server}:3000" -ForegroundColor Cyan
Write-Host "  pgAdmin:       http://${Server}:5050   (admin@universidadx.com / admin1234)" -ForegroundColor Cyan
Write-Host "  MongoExpress:  http://${Server}:8082   (admin / admin1234)" -ForegroundColor Cyan
Write-Host ""
