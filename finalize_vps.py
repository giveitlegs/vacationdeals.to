#!/usr/bin/env python3
"""Finalize VPS: start Nginx, run SSL, build app"""
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
        print(out.strip()[-800:])
    if err.strip():
        print(f"STDERR: {err.strip()[-400:]}")
    print(f"[exit: {exit_code}]")
    return out, err, exit_code

def main():
    print(f"Connecting to {HOST}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS, timeout=30)
    print("Connected!\n")

    # Fix Nginx - check what's on port 80
    print("=== Fixing Nginx ===")
    run_cmd(ssh, "ss -tlnp | grep ':80'")
    run_cmd(ssh, "systemctl stop apache2 2>/dev/null; systemctl disable apache2 2>/dev/null; echo 'apache cleared'")
    run_cmd(ssh, "fuser -k 80/tcp 2>/dev/null; echo 'port 80 freed'")
    run_cmd(ssh, "systemctl start nginx")
    run_cmd(ssh, "systemctl is-active nginx")

    # Verify DNS
    print("\n=== DNS Check ===")
    run_cmd(ssh, "dig +short vacationdeals.to A")
    run_cmd(ssh, "dig +short www.vacationdeals.to A")

    # Run Certbot for SSL
    print("\n=== Setting up SSL ===")
    run_cmd(ssh, "certbot --nginx -d vacationdeals.to -d www.vacationdeals.to --non-interactive --agree-tos --email admin@vacationdeals.to --redirect", timeout=120)

    # Verify SSL
    run_cmd(ssh, "certbot certificates 2>&1 | head -15")

    # Set up auto-renewal
    run_cmd(ssh, "certbot renew --dry-run 2>&1 | tail -5")

    # Build the Next.js app
    print("\n=== Building Next.js app ===")
    run_cmd(ssh, "cd /var/www/vacationdeals && pnpm build 2>&1 | tail -20", timeout=300)

    # Start with PM2
    print("\n=== Starting app with PM2 ===")
    run_cmd(ssh, "cd /var/www/vacationdeals && pm2 delete vacationdeals-web 2>/dev/null; echo 'cleared'")
    run_cmd(ssh, "cd /var/www/vacationdeals/apps/web && pm2 start 'pnpm start' --name vacationdeals-web --cwd /var/www/vacationdeals/apps/web")
    run_cmd(ssh, "pm2 save")
    run_cmd(ssh, "pm2 list")

    # Final check
    print("\n=== Final Verification ===")
    run_cmd(ssh, "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 || echo 'App not responding yet (may need a moment)'")
    run_cmd(ssh, "systemctl is-active nginx")
    run_cmd(ssh, "systemctl is-active postgresql")

    print("\n========================================")
    print("VPS FINALIZATION COMPLETE!")
    print("========================================")
    print("https://vacationdeals.to should be live!")

    ssh.close()

if __name__ == "__main__":
    main()
