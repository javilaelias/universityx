#!/usr/bin/env bash
# =============================================================================
# Universidad X — Configuración inicial del servidor (RHEL 10 sin suscripción)
# - Sin Red Hat RHSM → no hay repos base; solo se agrega el repo de Docker CE
# - Podman 5.x ya está instalado; Docker CE se instala sobre el mismo host
# Ejecutado por server-install-docker.py (sudo NOPASSWD ya configurado)
# =============================================================================
set -euo pipefail

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[setup]${NC} $*"; }
warn() { echo -e "${YELLOW}[warn]${NC}  $*"; }
err()  { echo -e "${RED}[error]${NC} $*"; exit 1; }

log "=== Universidad X — Setup Servidor RHEL 10 ==="

# ── 1. Docker CE ──────────────────────────────────────────────────────────────
if command -v docker &>/dev/null; then
    log "1/6 Docker ya instalado: $(docker --version)"
else
    log "1/6 Instalando Docker CE desde repositorio oficial..."

    # Crear repo file manualmente (no necesita dnf-plugins-core)
    sudo tee /etc/yum.repos.d/docker-ce.repo > /dev/null << 'REPO_EOF'
[docker-ce-stable]
name=Docker CE Stable - $basearch
baseurl=https://download.docker.com/linux/rhel/10/$basearch/stable
enabled=1
gpgcheck=1
gpgkey=https://download.docker.com/linux/rhel/gpg
REPO_EOF

    log "   Importando clave GPG de Docker..."
    sudo rpm --import https://download.docker.com/linux/rhel/gpg 2>/dev/null || true

    log "   Instalando paquetes Docker..."
    sudo dnf -y install \
        docker-ce docker-ce-cli containerd.io \
        docker-buildx-plugin docker-compose-plugin

    sudo systemctl enable --now docker
    sudo usermod -aG docker "$USER"
    log "   Docker instalado y habilitado."
fi

# ── 2. Verificar compose ──────────────────────────────────────────────────────
log "2/6 Verificando Docker Compose..."
if ! sudo docker compose version &>/dev/null; then
    err "docker compose plugin no disponible tras la instalación."
fi
log "   $(sudo docker compose version)"

# ── 3. Utilidades opcionales ──────────────────────────────────────────────────
log "3/6 Instalando utilidades (opcional — no falla si no hay repos)..."
sudo dnf -y install curl wget htop jq 2>/dev/null || \
    warn "No se pudieron instalar utilidades extra (sin repos base). Continuando."

# ── 4. SELinux → permissive (servidor de pruebas) ─────────────────────────────
log "4/6 Configurando SELinux..."
SELINUX_STATUS=$(getenforce 2>/dev/null || echo "Disabled")
if [ "$SELINUX_STATUS" = "Enforcing" ]; then
    sudo setenforce 0
    sudo sed -i 's/^SELINUX=enforcing/SELINUX=permissive/' /etc/selinux/config
    log "   SELinux -> permissive (persistente)"
else
    log "   SELinux: $SELINUX_STATUS (sin cambios)"
fi

# ── 5. Firewall (firewalld, NO ufw) ──────────────────────────────────────────
log "5/6 Configurando firewall..."
if systemctl is-active --quiet firewalld 2>/dev/null; then
    for port in 8080 4001 4002 4003 4004 4005 4006 4007 5050 8082; do
        sudo firewall-cmd --permanent --add-port=${port}/tcp -q
    done
    sudo firewall-cmd --reload -q
    log "   Puertos 8080,4001-4007,5050,8082 abiertos."
else
    warn "firewalld no activo — verifica firewall del proveedor."
fi

# ── 6. Directorio de la aplicación ────────────────────────────────────────────
log "6/6 Preparando /opt/universidadx..."
sudo mkdir -p /opt/universidadx/{data,logs}
sudo chown -R "$USER":"$USER" /opt/universidadx

echo ""
log "=== Verificacion final ==="
echo "  Docker:   $(sudo docker --version)"
echo "  Compose:  $(sudo docker compose version)"
echo "  SELinux:  $(getenforce 2>/dev/null)"
echo "  Disco /:  $(df -h / | tail -1 | awk '{print $4\" libres de \"$2}')"
echo ""
log "=== Setup completado. Servidor listo para deploy. ==="
