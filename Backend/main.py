from flask import Flask, request, jsonify, make_response, render_template_string
from flask_cors import CORS
import sqlite3
import datetime
import time
import ipaddress, json, urllib.request

app = Flask(__name__)
CORS(app)

DB_NAME = "shadowtrap.db"
DECOY_SITE = "ShadowTrap Decoy Server"

# ---------------------------------------------------------
# قيم الطُعم (كلها وهمية) - تتكرر عبر الفخاخ لربطها ببعض
# ---------------------------------------------------------
DECOY_EMAIL = "admin.backup@techcorp-internal.com"   # فخ 7
DECOY_USER = "sysadmin_backup"                       # فخ 9
DECOY_PASS = "Backup@2026!"
DECOY_API_KEY = "sk_live_ST_9f3a1c77d2e84b60a5c1"    # فخ 10

_geo = {}
def locate(ip):
    """موقع الـ IP: الشبكة المحلية تُعرف مباشرة، والعام يُستعلم عنه ويُخزَّن"""
    try:
        a = ipaddress.ip_address(ip)
        if a.is_private or a.is_loopback:
            return "Local Network"
    except ValueError:
        return "Unknown"
    if ip in _geo:
        return _geo[ip]
    try:
        with urllib.request.urlopen(f"http://ip-api.com/json/{ip}?fields=status,country,city", timeout=2) as r:
            d = json.load(r)
        if d.get("status") == "success":
            _geo[ip] = f"{d['city']}, {d['country']}"
            return _geo[ip]
    except Exception:
        pass
    return "Unknown"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    conn.execute('''CREATE TABLE IF NOT EXISTS attacks (
        id INTEGER PRIMARY KEY AUTOINCREMENT, target_site TEXT,
        honeytoken_type TEXT, hacker_ip TEXT, timestamp TEXT, details TEXT)''')
    conn.commit(); conn.close()

init_db()

_recent = {}  # منع تكرار نفس الإنذار من نفس الـ IP خلال 5 ثواني

def log_attack(site, trap, details=""):
    ip = request.remote_addr
    now = time.time()
    if now - _recent.get((ip, trap), 0) < 5:
        return
    _recent[(ip, trap)] = now
    conn = sqlite3.connect(DB_NAME)
    conn.execute('INSERT INTO attacks (target_site, honeytoken_type, hacker_ip, timestamp, details) VALUES (?,?,?,?,?)',
                 (str(site)[:100], str(trap)[:200], ip,
                  datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), str(details)[:300]))
    conn.commit(); conn.close()
    print(f"🚨 [ALERT] {trap} | IP: {ip}")

# ---------------------------------------------------------
# واجهات ShadowTrap الأساسية
# ---------------------------------------------------------
@app.route('/api/alert', methods=['POST'])
def receive_alert():
    if request.headers.get('X-API-Key') != "ST-DEMO-KEY-2026":
        return jsonify({"status": "error", "message": "Unauthorized"}), 403
    data = request.get_json(silent=True) or {}
    log_attack(data.get('target_site', 'Unknown Site'), data.get('honeytoken_type', 'Unknown Trap'),
               "Suspicious Activity Logged")
    return jsonify({"status": "success", "message": "Trap triggered successfully!"}), 200

@app.route('/api/logs', methods=['GET'])
def get_logs():
    conn = sqlite3.connect(DB_NAME)
    rows = conn.execute('SELECT target_site, honeytoken_type, hacker_ip, timestamp FROM attacks ORDER BY id DESC').fetchall()
    conn.close()
    return jsonify([{"target_site": r[0], "honeytoken_type": r[1], "hacker_ip": r[2], "timestamp": r[3], "location": locate(r[2])} for r in rows]), 200

@app.route('/api/stats', methods=['GET'])
def get_attack_stats():
    conn = sqlite3.connect(DB_NAME)
    data = conn.execute('SELECT honeytoken_type, COUNT(*) FROM attacks GROUP BY honeytoken_type').fetchall()
    conn.close()
    return jsonify({"labels": [r[0] for r in data], "counts": [r[1] for r in data]}), 200

# ---------------------------------------------------------
# فخاخ الملفات القديمة (Canary Files)
# ---------------------------------------------------------
@app.route('/database_backup_2026.zip')
@app.route('/.env')
@app.route('/config.bak')
def canary_file_trap():
    log_attack("متجر الملابس (E-Commerce)", f"Canary File Access ({request.path})", f"Attempted to download {request.path}")
    return jsonify({"error": "403 Forbidden: Access to sensitive backup files is restricted."}), 403

# =========================================================
# فخ 8: Decoy Configuration File (config_backup.json)
# =========================================================
@app.route('/config_backup.json')
def decoy_config():
    log_attack(DECOY_SITE, "Decoy Configuration File (config_backup.json)", "Fake config downloaded")
    return jsonify({
        "app": "techcorp-portal", "env": "production",
        "admin_email": DECOY_EMAIL,
        "admin_user": DECOY_USER, "admin_password": DECOY_PASS,
        "internal_api_key": DECOY_API_KEY,
        "database": {"host": "10.0.0.15", "user": "portal_admin", "password": "Tr@p-Fake-2026"}
    })

# =========================================================
# فخ 6: Decoy Database Credentials
# =========================================================
@app.route('/db_credentials.txt')
@app.route('/database.yml')
def decoy_db_credentials():
    log_attack(DECOY_SITE, f"Decoy Database Credentials ({request.path})", "Fake DB credentials downloaded")
    body = "DB_HOST=10.0.0.15\nDB_PORT=5432\nDB_NAME=portal_prod\nDB_USER=portal_admin\nDB_PASS=Tr@p-Fake-2026\n"
    return body, 200, {"Content-Type": "text/plain"}

# =========================================================
# فخ 5 + 9 + 7 + 4: صفحة الأدمن الوهمية
# =========================================================
LOGIN_HTML = """<!DOCTYPE html><html><head><title>Admin Panel</title>
<style>body{font-family:Segoe UI,sans-serif;background:#f0f2f5;display:grid;place-items:center;height:100vh;margin:0}
form{background:#fff;padding:35px;border-radius:10px;box-shadow:0 4px 20px #0001;width:320px}
input,button{width:100%;padding:11px;margin:8px 0;box-sizing:border-box}button{background:#1a73e8;color:#fff;border:0;border-radius:5px}
.e{color:#c00;font-size:13px}</style></head><body>
<form method="post"><h3>Administrator Login</h3>
<input name="username" placeholder="Username or Email"><input name="password" type="password" placeholder="Password">
<button>Sign in</button>{% if error %}<div class="e">{{ error }}</div>{% endif %}</form></body></html>"""

def check_session_tamper():
    """فخ 4: كوكي admin_session المفروض 'guest' - أي قيمة ثانية = تلاعب"""
    v = request.cookies.get('admin_session')
    if v and v.lower() != 'guest':
        log_attack(DECOY_SITE, "Decoy Session Cookie Tampered (admin_session)", f"value={v[:30]}")

@app.route('/admin-dashboard-login', methods=['GET', 'POST'])
@app.route('/admin', methods=['GET', 'POST'])
@app.route('/wp-login.php', methods=['GET', 'POST'])
@app.route('/phpmyadmin', methods=['GET', 'POST'])
def decoy_admin_login():
    check_session_tamper()
    error, status = None, 200
    if request.method == 'POST':
        user = (request.form.get('username') or '').strip()[:100]
        if user.lower() == DECOY_USER:
            log_attack(DECOY_SITE, "Decoy User Account Login (sysadmin_backup)", "Used credentials found in fake config")
        elif user.lower() == DECOY_EMAIL:
            log_attack(DECOY_SITE, "Fake Admin Email Used (admin login)", f"email={user}")
        else:
            log_attack(DECOY_SITE, f"Decoy Admin Login Attempt ({request.path})", f"username={user}")  # كلمة السر لا تُحفظ
        error, status = "Invalid credentials. This incident has been logged.", 401
    else:
        log_attack(DECOY_SITE, f"Decoy Admin Login Page Visit ({request.path})", "Hidden admin page opened")
    resp = make_response(render_template_string(LOGIN_HTML, error=error), status)
    resp.set_cookie('admin_session', 'guest', samesite='Lax')   # الطُعم: كوكي يغري بتغييره لـ admin
    return resp

# فخ 7: البريد الإداري الوهمي عبر "نسيت كلمة السر"
@app.route('/api/v1/auth/forgot-password', methods=['POST'])
def decoy_forgot_password():
    data = request.get_json(silent=True) or request.form
    email = str(data.get('email', '')).strip().lower()[:100]
    if email == DECOY_EMAIL:
        log_attack(DECOY_SITE, "Fake Admin Email Used (password reset)", f"email={email}")
    return jsonify({"message": "If the account exists, a reset link was sent."}), 200

# =========================================================
# فخ 10: Decoy API Endpoint
# =========================================================
@app.route('/api/v1/internal/users')
def decoy_api_users():
    check_session_tamper()
    if DECOY_API_KEY in request.headers.get('Authorization', ''):
        log_attack(DECOY_SITE, "Decoy API Key Used (/api/v1/internal/users)", "Key stolen from fake config")
        return jsonify([{"id": 1, "user": DECOY_USER, "role": "superadmin"},
                        {"id": 2, "user": "j.salem", "role": "editor"}])
    log_attack(DECOY_SITE, "Decoy API Endpoint Access (/api/v1/internal/users)", "No valid key")
    return jsonify({"error": "401 Unauthorized"}), 401

if __name__ == '__main__':
    print("🚀 ShadowTrap Server V2.1 is Running...")
    app.run(host='127.0.0.1', port=5000, debug=False)