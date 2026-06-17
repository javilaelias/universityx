"""Copia la clave pública SSH al servidor usando paramiko."""
import paramiko, os, sys

HOST = "10.118.67.55"
USER = "usr_admin"
PASS = sys.argv[1] if len(sys.argv) > 1 else ""
KEY_PATH = os.path.expanduser(r"~\.ssh\id_ed25519_ux.pub")

with open(KEY_PATH) as f:
    pub_key = f.read().strip()

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=15)

cmd = (
    "mkdir -p ~/.ssh && chmod 700 ~/.ssh && "
    f"grep -qF '{pub_key}' ~/.ssh/authorized_keys 2>/dev/null || "
    f"echo '{pub_key}' >> ~/.ssh/authorized_keys && "
    "chmod 600 ~/.ssh/authorized_keys && echo 'CLAVE_OK'"
)
_, stdout, stderr = client.exec_command(cmd)
out = stdout.read().decode().strip()
err = stderr.read().decode().strip()
client.close()

if "CLAVE_OK" in out or "authorized_keys" in out:
    print("OK: clave pública instalada en el servidor")
else:
    print(f"Salida: {out}")
    if err:
        print(f"Error: {err}")
