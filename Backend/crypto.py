import os
import json
import base64
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# توليد مفتاح تشفير بحجم 128-bit (في المشاريع الحقيقية يُحفظ هذا المفتاح بسرية)
SECRET_KEY = AESGCM.generate_key(bit_length=128)

def encrypt_log(log_data: dict) -> str:
    """تشفير السجل الأمني (بيانات المهاجم) باستخدام AES-128-GCM"""
    aesgcm = AESGCM(SECRET_KEY)
    # توليد قيمة عشوائية (Nonce) لكل عملية تشفير لضمان عدم تطابق السجلات
    nonce = os.urandom(12) 
    
    # تحويل البيانات إلى نص ثم إلى بايتات
    data_bytes = json.dumps(log_data).encode('utf-8')
    
    # إجراء التشفير
    ciphertext = aesgcm.encrypt(nonce, data_bytes, None)
    
    # دمج الـ Nonce مع النص المشفر (ضروري لفك التشفير لاحقاً) وتحويله لنص يمكن حفظه
    encrypted_payload = nonce + ciphertext
    return base64.b64encode(encrypted_payload).decode('utf-8')

def decrypt_log(encrypted_str: str) -> dict:
    """فك تشفير السجل الأمني لقراءته في لوحة التحكم"""
    aesgcm = AESGCM(SECRET_KEY)
    encrypted_payload = base64.b64decode(encrypted_str.encode('utf-8'))
    
    # فصل الـ Nonce (أول 12 بايت) عن النص المشفر
    nonce = encrypted_payload[:12]
    ciphertext = encrypted_payload[12:]
    
    # فك التشفير وإعادته كقاموس بايثون (Dictionary)
    decrypted_bytes = aesgcm.decrypt(nonce, ciphertext, None)
    return json.loads(decrypted_bytes.decode('utf-8'))