"""
Security Module
Xavfsizlik va autentifikatsiya funksiyalari
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
import bcrypt
import secrets
import hashlib
import re
from .config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class SecurityManager:
    """Xavfsizlik menejeri"""
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Parolni tekshirish"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """Parolni hash qilish"""
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """JWT token yaratish"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> Optional[Dict[str, Any]]:
        """JWT tokenni tekshirish"""
        try:
            payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
            return payload
        except JWTError:
            return None
    
    @staticmethod
    def generate_api_key() -> str:
        """API kalit yaratish"""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def hash_api_key(api_key: str) -> str:
        """API kalitni hash qilish"""
        return hashlib.sha256(api_key.encode()).hexdigest()
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Email manzilini validatsiya qilish"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None
    
    @staticmethod
    def validate_password_strength(password: str) -> Dict[str, Any]:
        """Parol kuchini tekshirish"""
        result = {
            "is_valid": True,
            "errors": [],
            "score": 0
        }
        
        # Minimal uzunlik
        if len(password) < 8:
            result["is_valid"] = False
            result["errors"].append("Parol kamida 8 ta belgidan iborat bo'lishi kerak")
        else:
            result["score"] += 25
        
        # Katta harf
        if not re.search(r'[A-Z]', password):
            result["is_valid"] = False
            result["errors"].append("Parolda kamida bitta katta harf bo'lishi kerak")
        else:
            result["score"] += 25
        
        # Kichik harf
        if not re.search(r'[a-z]', password):
            result["is_valid"] = False
            result["errors"].append("Parolda kamida bitta kichik harf bo'lishi kerak")
        else:
            result["score"] += 25
        
        # Raqam
        if not re.search(r'\d', password):
            result["is_valid"] = False
            result["errors"].append("Parolda kamida bitta raqam bo'lishi kerak")
        else:
            result["score"] += 25
        
        return result
    
    @staticmethod
    def sanitize_input(text: str) -> str:
        """Kiritilgan matnni tozalash"""
        # XSS himoyasi
        text = re.sub(r'<script.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
        text = re.sub(r'<.*?>', '', text)
        
        # SQL injection himoyasi
        text = re.sub(r'["\';\\]', '', text)
        
        return text.strip()
    
    @staticmethod
    def rate_limit_check(user_id: str, action: str, limit: int = 10, window: int = 3600) -> bool:
        """Rate limit tekshiruvi"""
        # Bu funksiya Redis yoki database bilan ishlashi kerak
        # Hozircha oddiy misol
        return True
    
    @staticmethod
    def log_security_event(event_type: str, user_id: Optional[str] = None, details: Dict[str, Any] = None):
        """Xavfsizlik hodisasini log qilish"""
        log_data = {
            "event_type": event_type,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat(),
            "details": details or {}
        }
        
        # Bu funksiya log fayliga yoki databasega yozishi kerak
        print(f"Security Event: {log_data}")

class PermissionManager:
    """Ruxsatlar menejeri"""
    
    PERMISSIONS = {
        "student": [
            "irac:analyze",
            "court:participate",
            "decision_tree:use",
            "document:generate",
            "profile:view",
            "profile:update"
        ],
        "teacher": [
            "irac:analyze",
            "irac:evaluate",
            "court:participate",
            "court:create_scenario",
            "decision_tree:use",
            "decision_tree:create",
            "document:generate",
            "document:create_template",
            "profile:view",
            "profile:update",
            "students:view",
            "students:evaluate"
        ],
        "lawyer": [
            "irac:analyze",
            "irac:evaluate",
            "court:participate",
            "court:create_scenario",
            "court:judge",
            "decision_tree:use",
            "decision_tree:create",
            "document:generate",
            "document:create_template",
            "legal_database:search",
            "legal_database:advanced_search",
            "profile:view",
            "profile:update"
        ],
        "judge": [
            "irac:analyze",
            "irac:evaluate",
            "court:participate",
            "court:create_scenario",
            "court:judge",
            "court:admin",
            "decision_tree:use",
            "decision_tree:create",
            "decision_tree:evaluate",
            "document:generate",
            "document:create_template",
            "legal_database:search",
            "legal_database:advanced_search",
            "legal_database:admin",
            "profile:view",
            "profile:update",
            "users:view",
            "system:admin"
        ],
        "admin": [
            "*"  # Barcha ruxsatlar
        ]
    }
    
    @classmethod
    def has_permission(cls, user_role: str, permission: str) -> bool:
        """Ruxsat borligini tekshirish"""
        if user_role == "admin":
            return True
        
        permissions = cls.PERMISSIONS.get(user_role, [])
        return permission in permissions
    
    @classmethod
    def get_user_permissions(cls, user_role: str) -> list:
        """Foydalanuvchi ruxsatlarini olish"""
        return cls.PERMISSIONS.get(user_role, [])

class AuditLogger:
    """Audit loger"""
    
    @staticmethod
    def log_action(user_id: str, action: str, resource_type: str, resource_id: str, details: Dict[str, Any] = None):
        """Amalni log qilish"""
        log_entry = {
            "user_id": user_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "timestamp": datetime.utcnow().isoformat(),
            "details": details or {}
        }
        
        # Bu funksiya databasega yozishi kerak
        print(f"Audit Log: {log_entry}")

# Global security instance
security = SecurityManager()
permissions = PermissionManager()
audit = AuditLogger()
