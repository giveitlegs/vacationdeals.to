#!/usr/bin/env python3
"""Quick redeploy: pull, build, restart"""
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
        print(out.strip()[-1200:])
    if err.strip():
        print(f"STDERR: {err.strip()[-500:]}")
    print(f"[exit: {exit_code}]")
    return out, err, exit_code

def main():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS, timeout=30)
    print("Connected!\n")

    run_cmd(ssh, "cd /var/www/vacationdeals && git pull origin main", timeout=30)
    run_cmd(ssh, "cd /var/www/vacationdeals && pnpm build 2>&1 | tail -30", timeout=300)

    # If build succeeds, restart PM2
    run_cmd(ssh, "pm2 restart vacationdeals-web 2>/dev/null || (cd /var/www/vacationdeals/apps/web && pm2 start 'pnpm start' --name vacationdeals-web)")
    run_cmd(ssh, "sleep 5 && curl -s -o /dev/null -w '%{http_code}' http://localhost:3000")
    run_cmd(ssh, "pm2 list")

    ssh.close()

if __name__ == "__main__":
    main()
