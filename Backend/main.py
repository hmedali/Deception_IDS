from flask import Flask, request, jsonify
from flask_cors import CORS
from crypto import encrypt_log, decrypt_log
from datetime import datetime
import requests




app = Flask(__name__)
CORS(app) 

db_logs = []

# --- الخطوة 4: قاعدة بيانات العملاء المصرح لهم (SaaS API Keys) ---
VALID_API_KEYS = {
    "ST-DEMO-KEY-2026": "موقع متجر الأناقة (الضحية التجريبي)"
}

def get_geo_info(ip_address):
    if ip_address == '127.0.0.1':
        return {"country": "Localhost", "city": "Local Device", "isp": "None"}
    try:
        response = requests.get(f'http://ip-api.com/json/{ip_address}').json()
        if response['status'] == 'success':
            return {
                "country": response.get('country', 'Unknown'),
                "city": response.get('city', 'Unknown'),
                "isp": response.get('isp', 'Unknown')
            }
    except:
        pass
    return {"country": "Unknown", "city": "Unknown", "isp": "Unknown"}

@app.route('/api/alert', methods=['POST'])
def receive_alert():
    # التحقق من الجدار الأمني (API Key Validation)
    api_key = request.headers.get('X-API-Key')
    if not api_key or api_key not in VALID_API_KEYS:
        print(f"\n[❌ BLOCKED] Unauthorized attempt from IP: {request.remote_addr}")
        return jsonify({"error": "Unauthorized! Invalid API Key."}), 403

    data = request.json
    if not data:
        return jsonify({"error": "No payload data"}), 400

    attacker_ip = request.remote_addr
    geo_info = get_geo_info(attacker_ip)

    log_entry = {
        "trap_id": data.get("trap_id", "Unknown"),
        "client_name": VALID_API_KEYS[api_key], # تسجيل اسم العميل المستهدف
        "attacker_ip": attacker_ip,
        "country": geo_info["country"],
        "city": geo_info["city"],
        "isp": geo_info["isp"],
        "user_agent": request.headers.get('User-Agent'),
        "timestamp": datetime.now().isoformat()
    }

    encrypted_log = encrypt_log(log_entry)
    db_logs.append({
        "trap_id": log_entry["trap_id"],
        "encrypted_data": encrypted_log
    })

    print(f"\n[🚨 ShadowTrap ALERT] Intrusion detected at {VALID_API_KEYS[api_key]}!")
    print(f"Origin: {geo_info['country']} - {geo_info['city']}")
    
    return jsonify({"status": "success"}), 200

# --- فخ الـ .env (لاصطياد برامج الفحص الآلي) ---
@app.route('/.env', methods=['GET'])
def fake_env_trap():
    attacker_ip = request.remote_addr
    geo_info = get_geo_info(attacker_ip)

    # تجهيز سجل الهجمة
    log_entry = {
        "trap_id": "HT-BACKEND-ENV-SCAN",
        "client_name": "ShadowTrap Server (Direct Attack)", # الهجوم هنا على سيرفركم مباشرة
        "attacker_ip": attacker_ip,
        "country": geo_info["country"],
        "city": geo_info["city"],
        "isp": geo_info["isp"],
        "user_agent": request.headers.get('User-Agent'),
        "timestamp": datetime.now().isoformat()
    }

    # تشفير السجل وحفظه
    encrypted_log = encrypt_log(log_entry)
    db_logs.append({
        "trap_id": log_entry["trap_id"],
        "encrypted_data": encrypted_log
    })

    print(f"\n[🚨 ShadowTrap ALERT] Automated Scanner detected looking for .env file!")
    
    # الرد ببيانات داتا بيس وهمية حتى نعطل الهاكر ونخليه يضيع وقته بيها
    fake_env_content = """
    # Security Configuration
    DB_HOST=127.0.0.1
    DB_USER=root
    DB_PASS=SuperSecret_Fake_Password_9988
    API_KEY=ST-FAKE-KEY-0000
    DEBUG=True
    """
    
    # نرجعله الملف على شكل نص (Text)
    return fake_env_content, 200, {'Content-Type': 'text/plain'}

# ========================================================
# 🚨 فخ الروبوتات المسموم (Poisoned robots.txt) 🚨
# ========================================================

# الجزء الأول: الطُعم (ملف الروبوتات اللي راح يقراه الهاكر)
@app.route('/robots.txt', methods=['GET'])
def robots_txt():
    # نكتبله تعليمات تمنع الدخول لمسار الداتا بيس، حتى نثير فضوله!
    content = "User-agent: *\nDisallow: /api/v1/database-backup.sql\n"
    return content, 200, {'Content-Type': 'text/plain'}

# الجزء الثاني: المصيدة (الرابط اللي راح يركض عليه الهاكر)
@app.route('/api/v1/database-backup.sql', methods=['GET'])
def fake_sql_backup():
    attacker_ip = request.remote_addr
    geo_info = get_geo_info(attacker_ip)

    # تجهيز سجل الهجمة
    log_entry = {
        "trap_id": "HT-ROBOTS-SQL-STEAL", # اسم الفخ اللي راح يظهر بالداشبورد
        "client_name": "ShadowTrap Server",
        "attacker_ip": attacker_ip,
        "country": geo_info["country"],
        "city": geo_info["city"],
        "isp": geo_info["isp"],
        "user_agent": request.headers.get('User-Agent'),
        "timestamp": datetime.now().isoformat()
    }

    # تشفير السجل وحفظه
    encrypted_log = encrypt_log(log_entry)
    db_logs.append({
        "trap_id": log_entry["trap_id"],
        "encrypted_data": encrypted_log
    })

    print(f"\n[🚨 ShadowTrap ALERT] Hacker fell for the robots.txt trap!")
    
    # الرد بملف داتا بيس وهمي للتمويه وتضييع وقت الهاكر
    fake_sql = """-- MySQL dump 10.13  Distrib 8.0.26, for Linux (x86_64)
-- Host: localhost    Database: shadowtrap_admin
-- ------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
);
INSERT INTO `users` VALUES (1,'admin','e10adc3949ba59abbe56e057f20f883e');
-- Dump completed
    """
    
    return fake_sql, 200, {'Content-Type': 'text/plain'}

@app.route('/api/logs', methods=['GET'])
def get_logs():
    decrypted_list = []
    for entry in db_logs:
        try:
            clear_data = decrypt_log(entry["encrypted_data"])
            decrypted_list.append(clear_data)
        except Exception as e:
            print(f"[Error] Decryption failed: {e}")
    return jsonify(decrypted_list), 200

if __name__ == '__main__':
    print("🛡️ ShadowTrap API is Running with strict Key validation...")
    app.run(debug=True, port=5000)