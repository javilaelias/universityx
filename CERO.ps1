# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
#  CERO.ps1 â€” Universidad X  |  Arranque Completo de Infraestructura
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
#
#  PROPÃ“SITO:
#    Script maestro de arranque. Verifica prerequisitos, levanta toda la
#    infraestructura Docker y deja el entorno listo para desarrollar.
#
#  USO:
#    PowerShell> .\CERO.ps1           # Arranque normal
#    PowerShell> .\CERO.ps1 -Stop     # Detener todos los servicios
#    PowerShell> .\CERO.ps1 -Reset    # Detener + borrar volÃºmenes (reset total)
#    PowerShell> .\CERO.ps1 -Status   # Ver estado de servicios
#
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
#
#  STACK TECNOLÃ“GICO COMPLETO â€” Universidad X
#  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
#
#  FRONTEND WEB
#  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
#  â”‚  Next.js 14     â€” Framework React con SSR y App Dir  â”‚
#  â”‚  React 18       â€” UI con Server + Client Components  â”‚
#  â”‚  TypeScript 5   â€” Tipado estÃ¡tico end-to-end         â”‚
#  â”‚  Tailwind CSS 3 â€” Utilidades CSS, dark mode          â”‚
#  â”‚  Puerto: 3000   http://localhost:3000                 â”‚
#  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
#
#  FRONTEND ANDROID (desarrollo externo)
#  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
#  â”‚  Kotlin (Nativo)     â€” Lenguaje principal Android    â”‚
#  â”‚  Jetpack Compose     â€” UI declarativa Android        â”‚
#  â”‚  WorkManager         â€” Tareas en background y sync   â”‚
#  â”‚  ExoPlayer / Media3  â€” ReproducciÃ³n de video offline â”‚
#  â”‚  BiometricPrompt     â€” AutenticaciÃ³n biomÃ©trica      â”‚
#  â”‚  Android Keystore    â€” Almacenamiento seguro de keys â”‚
#  â”‚  EncryptedSharedPref â€” Almacenamiento seguro tokens  â”‚
#  â”‚  Retrofit 2          â€” Cliente HTTP                  â”‚
#  â”‚  Coil 2              â€” Carga de imÃ¡genes async       â”‚
#  â”‚  minSdk: 26 (Android 8.0+)                           â”‚
#  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
#
#  BACKEND â€” MICROSERVICIOS (por implementar)
#  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
#  â”‚  auth-service       â€” Node.js / Express + Passport   â”‚
#  â”‚  lms-service        â€” Node.js / FastAPI (Python)     â”‚
#  â”‚  sync-service       â€” Node.js (idempotency + merge)  â”‚
#  â”‚  notification-svc   â€” Node.js + BullMQ + FCM         â”‚
#  â”‚  helpdesk-service   â€” Node.js + OpenAI RAG           â”‚
#  â”‚  ai-service         â€” Python FastAPI + Claude API    â”‚
#  â”‚  credentials-svc    â€” Node.js + Polygon/Credly       â”‚
#  â”‚  media-service      â€” Node.js + FFmpeg + HLS         â”‚
#  â”‚  API Gateway        â€” Kong / AWS APIGW               â”‚
#  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
#
#  BASES DE DATOS (levantadas por este script)
#  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
#  â”‚  PostgreSQL 16   localhost:5436   â€” Relacional        â”‚
#  â”‚    DB: universidadx               â€” 12 tablas        â”‚
#  â”‚    Usuario: ux_admin                                 â”‚
#  â”‚  MongoDB 7       localhost:27017  â€” Documental        â”‚
#  â”‚    DB: universidadx               â€” 3 colecciones    â”‚
#  â”‚    Usuario: ux_admin                                 â”‚
#  â”‚  Redis 7         localhost:6379   â€” CachÃ© / Queues    â”‚
#  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
#
#  HERRAMIENTAS DE ADMINISTRACIÃ“N (UIs)
#  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
#  â”‚  pgAdmin 4       http://localhost:5050               â”‚
#  â”‚    Email:    admin@universidadx.com                â”‚
#  â”‚    Password: admin1234                               â”‚
#  â”‚  Mongo Express   http://localhost:8082               â”‚
#  â”‚    User:     admin / Pass: admin1234                 â”‚
#  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
#
#  MCP SERVERS (Claude Code â€” .mcp.json)
#  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
#  â”‚  postgres    â€” Consultas directas a PostgreSQL        â”‚
#  â”‚  context7    â€” Docs en vivo: Next.js, Kotlin, etc.   â”‚
#  â”‚  memory      â€” Grafo de conocimiento del proyecto    â”‚
#  â”‚  filesystem  â€” Operaciones avanzadas de archivos     â”‚
#  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
#
#  INFRAESTRUCTURA CLOUD (target producciÃ³n)
#  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
#  â”‚  AWS / GCP     â€” Cloud provider principal            â”‚
#  â”‚  Kubernetes    â€” OrquestaciÃ³n de microservicios      â”‚
#  â”‚  CloudFront    â€” CDN para videos y assets            â”‚
#  â”‚  RDS/Cloud SQL â€” PostgreSQL gestionado               â”‚
#  â”‚  MongoDB Atlas â€” MongoDB gestionado                  â”‚
#  â”‚  ElastiCache   â€” Redis gestionado                    â”‚
#  â”‚  ECR / GCR     â€” Registro de imÃ¡genes Docker         â”‚
#  â”‚  GitHub Actions â€” CI/CD pipeline                     â”‚
#  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
#
#  SERVICIOS DE TERCEROS
#  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
#  â”‚  OpenAI / Anthropic Claude  â€” IA adaptativa + RAG    â”‚
#  â”‚  Firebase Cloud Messaging   â€” Push notifications     â”‚
#  â”‚  Polygon / Hyperledger      â€” Certificados blockchainâ”‚
#  â”‚  Credly / Acreditta         â€” Open Badges 3.0        â”‚
#  â”‚  Zoom / BigBlueButton       â€” Sesiones en vivo       â”‚
#  â”‚  SAML 2.0 / OpenID Connect  â€” SSO institucional      â”‚
#  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
#
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

param(
    [switch]$Stop,
    [switch]$Reset,
    [switch]$Status,
    [switch]$Logs,
    [switch]$WebOnly
)

Set-Location $PSScriptRoot
$ErrorActionPreference = "Stop"

# â”€â”€ Colores â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Write-Header  { Write-Host "`n$args" -ForegroundColor Cyan }
function Write-OK      { Write-Host "  [OK] $args" -ForegroundColor Green }
function Write-WARN    { Write-Host "  [!]  $args" -ForegroundColor Yellow }
function Write-ERR     { Write-Host "  [X]  $args" -ForegroundColor Red }
function Write-INFO    { Write-Host "  [-]  $args" -ForegroundColor Gray }
function Write-Step    { Write-Host "`n  >>> $args" -ForegroundColor Magenta }

# â”€â”€ Banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Show-Banner {
    Write-Host ""
    Write-Host "  â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—" -ForegroundColor Blue
    Write-Host "  â•‘         U N I V E R S I D A D   X               â•‘" -ForegroundColor Blue
    Write-Host "  â•‘         Plataforma Educativa â€” Dev Stack         â•‘" -ForegroundColor Blue
    Write-Host "  â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•" -ForegroundColor Blue
    Write-Host ""
}

# â”€â”€ Modo: Status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
if ($Status) {
    Show-Banner
    Write-Header "Estado de servicios:"
    docker compose ps
    Write-Host ""
    exit 0
}

# â”€â”€ Modo: Logs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
if ($Logs) {
    docker compose logs --tail=50 --follow
    exit 0
}

# â”€â”€ Modo: Stop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
if ($Stop) {
    Show-Banner
    Write-Step "Deteniendo servicios..."
    docker compose down
    Write-OK "Todos los servicios detenidos."
    exit 0
}

# â”€â”€ Modo: Reset (borra volÃºmenes) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
if ($Reset) {
    Show-Banner
    Write-WARN "ADVERTENCIA: Se eliminarÃ¡n TODOS los datos de las bases de datos."
    $confirm = Read-Host "  Escribe RESET para confirmar"
    if ($confirm -ne "RESET") { Write-INFO "Cancelado."; exit 0 }
    Write-Step "Eliminando contenedores y volÃºmenes..."
    docker compose down -v --remove-orphans
    Write-OK "Reset completo. Ejecuta CERO.ps1 para reiniciar desde cero."
    exit 0
}

# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
# ARRANQUE NORMAL
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

Show-Banner

# â”€â”€ 1. Verificar prerrequisitos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Header "1/5  Verificando prerrequisitos..."

try {
    $dockerVer = docker --version
    Write-OK "Docker: $dockerVer"
} catch {
    Write-ERR "Docker no encontrado. Instala Docker Desktop desde https://www.docker.com"
    exit 1
}

$dockerRunning = docker info 2>$null
if (-not $?) {
    Write-ERR "Docker Desktop no estÃ¡ corriendo. Ãbrelo y vuelve a intentar."
    exit 1
}
Write-OK "Docker Desktop: en ejecuciÃ³n"

try {
    $nodeVer = node --version
    Write-OK "Node.js: $nodeVer"
} catch {
    Write-WARN "Node.js no encontrado. El frontend web no se iniciarÃ¡ automÃ¡ticamente."
    Write-WARN "Descarga desde https://nodejs.org (versiÃ³n 18 LTS o superior)"
}

# Verificar .env
if (-not (Test-Path ".\.env")) {
    Write-WARN ".env no encontrado â€” usando valores por defecto del docker-compose.yml"
} else {
    Write-OK ".env cargado"
}

# â”€â”€ 2. Levantar infraestructura Docker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Header "2/5  Levantando infraestructura Docker..."
Write-INFO "Servicios: PostgreSQL Â· MongoDB Â· Redis Â· pgAdmin Â· Mongo-Express"

docker compose up -d --build
if (-not $?) {
    Write-ERR "Error al iniciar Docker Compose. Revisa los logs: docker compose logs"
    exit 1
}

# â”€â”€ 3. Esperar que PostgreSQL estÃ© saludable â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Header "3/5  Esperando que las bases de datos estÃ©n listas..."

$maxWait = 60
$waited  = 0
Write-INFO "Esperando PostgreSQL..."
do {
    Start-Sleep -Seconds 3
    $waited += 3
    $pgStatus = docker inspect --format='{{.State.Health.Status}}' ux_postgres 2>$null
    if ($waited -ge $maxWait) {
        Write-ERR "PostgreSQL no respondiÃ³ en $maxWait segundos."
        Write-ERR "Revisa: docker logs ux_postgres"
        exit 1
    }
} while ($pgStatus -ne "healthy")
Write-OK "PostgreSQL: saludable (tardÃ³ ${waited}s)"

Write-INFO "Esperando MongoDB..."
$waited = 0
do {
    Start-Sleep -Seconds 3
    $waited += 3
    $mgStatus = docker inspect --format='{{.State.Health.Status}}' ux_mongo 2>$null
    if ($waited -ge $maxWait) {
        Write-WARN "MongoDB no alcanzÃ³ estado healthy â€” puede seguir iniciando en background"
        break
    }
} while ($mgStatus -ne "healthy")
if ($mgStatus -eq "healthy") { Write-OK "MongoDB: saludable (tardÃ³ ${waited}s)" }

# â”€â”€ 4. Instalar dependencias del frontend â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
if (-not $WebOnly) {
    Write-Header "4/5  Frontend Web (Next.js)..."
    if (Test-Path ".\web\package.json") {
        if (-not (Test-Path ".\web\node_modules")) {
            Write-INFO "Instalando dependencias npm del frontend..."
            Push-Location .\web
            npm install --silent
            Pop-Location
            Write-OK "Dependencias instaladas"
        } else {
            Write-OK "Dependencias ya instaladas (node_modules existe)"
        }
    } else {
        Write-WARN "web/package.json no encontrado â€” omitiendo instalaciÃ³n"
    }
}

# â”€â”€ 5. Resumen de servicios â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Header "5/5  Infraestructura lista:"
Write-Host ""
Write-Host "  BASES DE DATOS:" -ForegroundColor White
Write-Host "  â”œâ”€ PostgreSQL  â†’ localhost:5436   (DB: universidadx)" -ForegroundColor Green
Write-Host "  â”œâ”€ MongoDB     â†’ localhost:27017  (DB: universidadx)" -ForegroundColor Green
Write-Host "  â””â”€ Redis       â†’ localhost:6379" -ForegroundColor Green
Write-Host ""
Write-Host "  INTERFACES WEB:" -ForegroundColor White
Write-Host "  â”œâ”€ pgAdmin      â†’ http://localhost:5050  (admin@universidadx.com / admin1234)" -ForegroundColor Cyan
Write-Host "  â””â”€ MongoExpress â†’ http://localhost:8082  (admin / admin1234)" -ForegroundColor Cyan
Write-Host ""
Write-Host "  FRONTEND (iniciar manualmente):" -ForegroundColor White
Write-Host "  â””â”€ cd web && npm run dev  â†’ http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "  MCP SERVERS (Claude Code â€” .mcp.json):" -ForegroundColor White
Write-Host "  â”œâ”€ postgres    â†’ consultas directas a PostgreSQL" -ForegroundColor Blue
Write-Host "  â”œâ”€ context7    â†’ documentaciÃ³n actualizada de librerÃ­as" -ForegroundColor Blue
Write-Host "  â”œâ”€ memory      â†’ grafo de conocimiento del proyecto" -ForegroundColor Blue
Write-Host "  â””â”€ filesystem  â†’ operaciones avanzadas de archivos" -ForegroundColor Blue
Write-Host ""
Write-Host "  COMANDOS ÃšTILES:" -ForegroundColor White
Write-Host "  â”œâ”€ .\CERO.ps1 -Status  â†’ ver estado de contenedores" -ForegroundColor Gray
Write-Host "  â”œâ”€ .\CERO.ps1 -Stop    â†’ detener todos los servicios" -ForegroundColor Gray
Write-Host "  â”œâ”€ .\CERO.ps1 -Logs    â†’ ver logs en tiempo real" -ForegroundColor Gray
Write-Host "  â””â”€ .\CERO.ps1 -Reset   â†’ borrar todo y empezar de cero" -ForegroundColor Gray
Write-Host ""

# Abrir pgAdmin en el navegador
$openBrowser = Read-Host "  Â¿Abrir pgAdmin y Mongo-Express en el navegador? [s/N]"
if ($openBrowser -eq "s" -or $openBrowser -eq "S") {
    Start-Process "http://localhost:5050"
    Start-Sleep -Seconds 1
    Start-Process "http://localhost:8082"
    Write-OK "Navegador abierto"
}

Write-Host ""
Write-Host "  Universidad X â€” Infraestructura activa. Â¡A desarrollar!" -ForegroundColor Green
Write-Host ""
