#!/usr/bin/env python3
"""Pull latest, rebuild, restart, and retry SSL"""
import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

HOST = "72.60.126.82"
USER = "root"
PASS = "REDACTED"

def run_cmd(ssh, cmd, timeout=120):
    print(f"\n>>> {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    exit_code = stdout.channel.recv_exit_status()
    if out.strip():
        print(out.strip()[-1000:])
    if err.strip():
        print(f"STDERR: {err.strip()[-500:]}")
    print(f"[exit: {exit_code}]")
    return out, err, exit_code

def main():
    print(f"Connecting to {HOST}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS, timeout=30)
    print("Connected!\n")

    # Pull latest
    print("=== Pulling latest code ===")
    run_cmd(ssh, "cd /var/www/vacationdeals && git pull origin main", timeout=30)
    run_cmd(ssh, "cd /var/www/vacationdeals && pnpm install 2>&1 | tail -5", timeout=120)

    # Stop any docker containers on port 80 that interfere
    print("\n=== Clearing port 80 conflicts ===")
    run_cmd(ssh, "docker stop $(docker ps -q) 2>/dev/null; echo 'docker containers stopped or none running'")
    run_cmd(ssh, "systemctl restart nginx")
    run_cmd(ssh, "systemctl is-active nginx")

    # Build
    print("\n=== Building Next.js ===")
    run_cmd(ssh, "cd /var/www/vacationdeals && pnpm build 2>&1 | tail -30", timeout=300)

    # Restart PM2
    print("\n=== Restarting app ===")
    run_cmd(ssh, "pm2 delete vacationdeals-web 2>/dev/null; echo 'cleared'")
    run_cmd(ssh, "cd /var/www/vacationdeals/apps/web && pm2 start 'pnpm start' --name vacationdeals-web --cwd /var/www/vacationdeals/apps/web")
    run_cmd(ssh, "sleep 5 && curl -s -o /dev/null -w '%{http_code}' http://localhost:3000")

    # Retry SSL
    print("\n=== Retrying SSL ===")
    run_cmd(ssh, "certbot --nginx -d vacationdeals.to -d www.vacationdeals.to --non-interactive --agree-tos --email admin@vacationdeals.to --redirect 2>&1", timeout=120)

    # Final check
    print("\n=== Status ===")
    run_cmd(ssh, "pm2 list")
    run_cmd(ssh, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000")
    run_cmd(ssh, "curl -sI https://vacationdeals.to 2>&1 | head -5 || echo 'HTTPS not available yet'")

    print("\nDone!")
    ssh.close()

if __name__ == "__main__":
    main()
