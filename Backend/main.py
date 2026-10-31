from flask import Flask, request, jsonify
from flask_cors import CORS
from crypto import encrypt_log
from datetime import datetime

app = Flask(__name__)
# السماح لموقع الضحية بإرسال البيانات للسيرفر
CORS(app) 

# قاعدة بيانات وهمية مؤقتة (سنربطها بـ PostgreSQL في المرحلة القادمة)
db_logs = []

@app.route('/api/alert', methods=['POST'])
def receive_alert():
    """هذا الرابط يستقبل التنبيهات من الفخاخ (Honeytokens)"""
    data = request.json
    
    if not data:
        return jsonify({"error": "No data"}), 400

    # 1. تجميع بيانات المهاجم
    log_entry = {
        "trap_id": data.get("trap_id", "Unknown"),
        "attacker_ip": request.remote_addr,
        "user_agent": request.headers.get('User-Agent'),
        "timestamp": datetime.now().isoformat()
    }

    # 2. تشفير السجل بالكامل باستخدام AES-128-GCM
    encrypted_log = encrypt_log(log_entry)
    
    # 3. حفظ السجل المشفر
    db_logs.append({
        "trap_id": log_entry["trap_id"],
        "encrypted_data": encrypted_log
    })

    print(f"\n[🚨 ShadowTrap ALERT] تم اصطياد مهاجم وتشفير بياناته!")
    print(f"بيانات مشفرة: {encrypted_log[:40]}...\n")

    # 4. الرد على موقع الضحية بنجاح (دون كشف تفاصيل للمهاجم)
    return jsonify({"status": "success"}), 200

@app.route('/api/logs', methods=['GET'])
def get_logs():
    """هذا الرابط يرسل السجلات المشفرة للوحة التحكم لعرضها"""
    return jsonify(db_logs), 200

if __name__ == '__main__':
    print("🛡️ ShadowTrap API is Running on: http://localhost:5000")
    app.run(debug=True, port=5000)