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