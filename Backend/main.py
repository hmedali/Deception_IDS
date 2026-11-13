from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import datetime

app = Flask(__name__)
CORS(app) # للسماح باستقبال الهجمات من المواقع الخارجية

# ---------------------------------------------------------
# 1. إعداد قاعدة البيانات (تعديل رقم 3)             
# ---------------------------------------------------------
DB_NAME = "shadowtrap.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    # إنشاء جدول الهجمات مع فصل الموقع عن نوع الفخ (تعديل رقم 1)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS attacks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            target_site TEXT,
            honeytoken_type TEXT,
            hacker_ip TEXT,
            timestamp TEXT,
            details TEXT
        )
    ''')
    conn.commit()
    conn.close()

# تشغيل دالة بناء قاعدة البيانات عند بدء السيرفر
init_db()

# ---------------------------------------------------------
# 2. واجهة استقبال الهجمات (API)
# ---------------------------------------------------------
@app.route('/api/alert', methods=['POST'])
def receive_alert():
    data = request.json
    
    # التحقق من المفتاح السري (لضمان أن التنبيه من موقعنا)
    api_key = request.headers.get('X-API-Key')
    if api_key != "ST-DEMO-KEY-2026":
        return jsonify({"status": "error", "message": "Unauthorized"}), 403

    # استلام البيانات مفصلة
    target_site = data.get('target_site', 'Unknown Site')
    honeytoken_type = data.get('honeytoken_type', 'Unknown Trap')
    
    # سحب IP الهاكر (لو كان على سيرفر حقيقي، نستخدم request.remote_addr)
    hacker_ip = request.remote_addr
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # حفظ الهجمة في قاعدة البيانات الدائمة
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO attacks (target_site, honeytoken_type, hacker_ip, timestamp, details)
        VALUES (?, ?, ?, ?, ?)
    ''', (target_site, honeytoken_type, hacker_ip, timestamp, "Suspicious Activity Logged"))
    conn.commit()
    conn.close()

    print(f"🚨 [ALERT] الهجوم على: {target_site} | نوع الفخ: {honeytoken_type} | من الـ IP: {hacker_ip}")
    
    return jsonify({"status": "success", "message": "Trap triggered successfully!"}), 200

# ---------------------------------------------------------
# 3. واجهة قراءة الهجمات (لعرضها في الداشبورد)
# ---------------------------------------------------------
@app.route('/api/logs', methods=['GET'])
def get_logs():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('SELECT target_site, honeytoken_type, hacker_ip, timestamp FROM attacks ORDER BY id DESC')
    rows = cursor.fetchall()
    conn.close()

    # تحويل البيانات إلى صيغة JSON للداشبورد
    logs = []
    for row in rows:
        logs.append({
            "target_site": row[0],
            "honeytoken_type": row[1],
            "hacker_ip": row[2],
            "timestamp": row[3]
        })
    return jsonify(logs), 200

if __name__ == '__main__':
    print("🚀 ShadowTrap Server V2.0 is Running...")
    app.run(host='0.0.0.0', port=5000, debug=True)