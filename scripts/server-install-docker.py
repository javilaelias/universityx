#!/usr/bin/env python3
"""
Universidad X — Instala Docker en el servidor de pruebas (RHEL 10)
Ejecutar UNA sola vez para preparar el servidor.

Uso:
    py -3 scripts/server-install-docker.py "<sudo_password>"

Requiere: paramiko (ya disponible en D:\\UniversidadX)
"""
import io
import os
import sys
import paramiko

# Forzar UTF-8 en stdout para caracteres Unicode del servidor (box-drawing, ANSI)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

HOST   = "10.118.67.55"
USER   = "usr_admin"
KEY    = os.path.expanduser(r"~\.ssh\id_ed25519_ux")
SCRIPT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "server-setup.sh")


def _print_output(stdout, stderr):
    out = stdout.read().decode(errors="replace").strip()
    err = stderr.read().decode(errors="replace").strip()
    rc  = stdout.channel.recv_exit_status()
    if out:
        print(out)
    filtered = "\n".join(
        l for l in err.splitlines()
        if l.strip() and "[sudo]" not in l and "password for" not in l.lower()
    )
    if filtered:
        print("ERR:", filtered, file=sys.stderr)
    return rc


def main():
    if len(sys.argv) < 2:
        print("Uso: py -3 scripts/server-install-docker.py \"<sudo_password>\"")
        sys.exit(1)

    password = sys.argv[1]

    print(f"\nConectando a {USER}@{HOST} con clave SSH...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, key_filename=KEY, timeout=15)
    print("Conectado.\n")

    # ── Paso 1: Configurar sudo NOPASSWD ──────────────────────────────────────
    print("=== 1/3  Configurando sudo NOPASSWD ===")
    sudoers_cmd = (
        'echo "usr_admin ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/99-ux-nopasswd '
        '&& chmod 440 /etc/sudoers.d/99-ux-nopasswd '
        '&& echo SUDO_OK'
    )
    stdin_ch, stdout, stderr = client.exec_command(
        f"sudo -S sh -c {repr(sudoers_cmd)}", timeout=30
    )
    stdin_ch.write(password + "\n")
    stdin_ch.flush()
    stdin_ch.close()

    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    rc  = stdout.channel.recv_exit_status()

    if rc != 0 or "SUDO_OK" not in out:
        print(f"ERROR al configurar sudo (rc={rc})")
        print(f"stdout: {out!r}")
        filtered_err = "\n".join(
            l for l in err.splitlines()
            if "[sudo]" not in l and "password for" not in l.lower()
        )
        print(f"stderr: {filtered_err!r}")
        client.close()
        sys.exit(1)

    print("sudo NOPASSWD configurado en /etc/sudoers.d/99-ux-nopasswd\n")

    # ── Paso 2: Copiar server-setup.sh ────────────────────────────────────────
    print("=== 2/3  Copiando script de setup ===")
    sftp = client.open_sftp()
    sftp.put(SCRIPT, "/tmp/server-setup.sh")
    sftp.close()
    _, stdout_ch, _ = client.exec_command("chmod +x /tmp/server-setup.sh")
    stdout_ch.channel.recv_exit_status()
    print("Script copiado a /tmp/server-setup.sh\n")

    # ── Paso 3: Ejecutar setup (puede tardar ~5 min) ──────────────────────────
    print("=== 3/3  Ejecutando server-setup.sh ===")
    print("(puede tardar 3-5 minutos mientras instala Docker...)\n")

    _, stdout_setup, _ = client.exec_command("bash /tmp/server-setup.sh 2>&1", timeout=600)
    for line in stdout_setup:
        print(line.rstrip())
    rc = stdout_setup.channel.recv_exit_status()
    client.close()

    if rc != 0:
        print(f"\nERROR en server-setup.sh (rc={rc})")
        sys.exit(1)

    print("\n═══════════════════════════════════════════════════════")
    print("  Setup completado. Docker instalado en RHEL 10.")
    print("")
    print("  Próximo paso — desplegar la aplicación:")
    print("    .\\scripts\\deploy-test.ps1")
    print("═══════════════════════════════════════════════════════\n")


if __name__ == "__main__":
    main()
