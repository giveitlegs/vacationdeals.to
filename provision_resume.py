#!/usr/bin/env python3
"""Resume VPS provisioning from step 7 (after PostgreSQL install)"""
import paramiko
import time
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

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
        print(out.strip()[-500:])
    if err.strip() and exit_code != 0:
        print(f"STDERR: {err.strip()[-300:]}")
    print(f"[exit: {exit_code}]")
    return out, err, exit_code

def main():
    print(f"Connecting to {HOST}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS, timeout=30)
    print("Connected! Resuming from step 7...\n")

    # Step 7: Create database and user
    print("=== Creating database ===")
    run_cmd(ssh, """sudo -u postgres psql -c "CREATE USER vacdeals WITH PASSWORD 'REDACTED';" 2>&1 || echo 'User may already exist'""")
    run_cmd(ssh, """sudo -u postgres psql -c "CREATE DATABASE vacationdeals OWNER vacdeals;" 2>&1 || echo 'DB may already exist'""")
    run_cmd(ssh, """sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE vacationdeals TO vacdeals;" """)

    # Step 8: Install Nginx
    print("\n=== Installing Nginx ===")
    run_cmd(ssh, "apt-get install -y nginx", timeout=60)
    run_cmd(ssh, "systemctl enable nginx")

    # Step 9: Configure Nginx
    print("\n=== Configuring Nginx ===")
    nginx_conf = """server {
    listen 80;
    server_name vacationdeals.to www.vacationdeals.to;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}"""
    run_cmd(ssh, f"""cat > /etc/nginx/sites-available/vacationdeals << 'NGINXEOF'
{nginx_conf}
NGINXEOF""")
    run_cmd(ssh, "ln -sf /etc/nginx/sites-available/vacationdeals /etc/nginx/sites-enabled/")
    run_cmd(ssh, "rm -f /etc/nginx/sites-enabled/default")
    run_cmd(ssh, "nginx -t && systemctl reload nginx")

    # Step 10: Firewall
    print("\n=== Configuring firewall ===")
    run_cmd(ssh, "ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw --force enable")

    # Step 11: Install Certbot
    print("\n=== Installing Certbot ===")
    run_cmd(ssh, "apt-get install -y python3 python3-venv libaugeas0", timeout=60)
    run_cmd(ssh, "python3 -m venv /opt/certbot/ 2>&1 || echo 'venv exists'", timeout=30)
    run_cmd(ssh, "/opt/certbot/bin/pip install certbot certbot-nginx 2>&1 | tail -3", timeout=120)
    run_cmd(ssh, "ln -sf /opt/certbot/bin/certbot /usr/bin/certbot")

    # Step 12: Clone repo
    print("\n=== Cloning repository ===")
    run_cmd(ssh, "mkdir -p /var/www")
    run_cmd(ssh, "cd /var/www && git clone https://github.com/giveitlegs/vacationdeals.to.git vacationdeals 2>&1 || (cd /var/www/vacationdeals && git pull origin main)", timeout=60)

    # Step 13: Install dependencies
    print("\n=== Installing project dependencies ===")
    run_cmd(ssh, "cd /var/www/vacationdeals && pnpm install 2>&1 | tail -10", timeout=300)

    # Step 14: Create .env on server
    print("\n=== Creating .env ===")
    secret = f"vacdeals-prod-{int(time.time())}"
    run_cmd(ssh, f"""cat > /var/www/vacationdeals/.env << 'ENVEOF'
DATABASE_URL=postgresql://vacdeals:REDACTED@localhost:5432/vacationdeals
PAYLOAD_SECRET={secret}
NODE_ENV=production
ENVEOF""")

    # Step 15: Setup PM2 startup
    print("\n=== Configuring PM2 startup ===")
    run_cmd(ssh, "pm2 startup systemd -u root --hp /root 2>&1 | tail -3")

    # Check DNS propagation
    print("\n=== Checking DNS for vacationdeals.to ===")
    run_cmd(ssh, "dig +short vacationdeals.to A 2>/dev/null || nslookup vacationdeals.to 2>&1 | tail -5 || echo 'dig/nslookup not available'")

    # Verification
    print("\n=== VERIFICATION ===")
    run_cmd(ssh, "node -v")
    run_cmd(ssh, "pnpm -v")
    run_cmd(ssh, "systemctl is-active postgresql")
    run_cmd(ssh, "systemctl is-active nginx")
    run_cmd(ssh, """sudo -u postgres psql -d vacationdeals -c "SELECT 1 as connected;" """)
    run_cmd(ssh, "ls /var/www/vacationdeals/ | head -15")

    print("\n========================================")
    print("VPS PROVISIONING COMPLETE!")
    print("========================================")

    ssh.close()

if __name__ == "__main__":
    main()
