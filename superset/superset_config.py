# superset_config.py
import os
from typing import Dict, Any

# Your App's Secret Key
SECRET_KEY = os.environ.get("SUPERSET_SECRET_KEY", "your_super_secret_key_for_superset")

# Configuration for embedded dashboards and guest token authentication
FEATURE_FLAGS = {
    "EMBEDDED_SUPERSET": True,
    "DASHBOARD_NATIVE_FILTERS": True,
    "DASHBOARD_CROSS_FILTERS": True,
    "DASHBOARD_RBAC": True,
    "ENABLE_TEMPLATE_PROCESSING": True,
    "EMBEDDED_CHARTS": True,
    "EMBEDDED_DASHBOARDS": True,
}

# The following secret is for signing guest tokens.
# Make sure it's long, complex, and stored securely.
GUEST_TOKEN_JWT_SECRET = os.environ.get("SUPERSET_GUEST_TOKEN_JWT_SECRET", "hiUasToS3ihDkBhBTyRB3trC1v9SzWH_nWJehi5B2trC1v9SzWH_nWJehi5B2tI")

# Guest token configuration
GUEST_ROLE_NAME = "Guest"
GUEST_TOKEN_JWT_ALGO = "HS256"
GUEST_TOKEN_JWT_EXP_SECONDS = 300  # 5 minutes

# Allow the frontend application to embed dashboards
TALISMAN_CONFIG = {
    "content_security_policy": {
        "frame-ancestors": ["'self'", "http://localhost:3000", "http://localhost:3001"],
    },
    "force_https": False,
    "strict_transport_security": False,
}

# This is needed to run behind a reverse proxy
ENABLE_PROXY_FIX = True

# Security settings for guest tokens
WTF_CSRF_ENABLED = True
WTF_CSRF_TIME_LIMIT = None

# Guest token authentication settings
AUTH_TYPE = "AUTH_DB"
AUTH_USER_REGISTRATION = False
AUTH_USER_REGISTRATION_ROLE = "Guest"

# Enable guest token authentication
ENABLE_GUEST_TOKEN_AUTH = True

# CORS settings for embedded dashboards
CORS_OPTIONS = {
    'supports_credentials': True,
    'allow_headers': ['*'],
    'resources': ['*'],
    'origins': ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000']
}

# Additional CORS configuration for Superset
CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000']
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = ['*']
CORS_ALLOW_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']

# Enable CORS for all routes
ENABLE_CORS = True

# Flask-CORS configuration
CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000']
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = ['*']
CORS_ALLOW_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']

# Additional CORS settings for API endpoints
CORS_EXPOSE_HEADERS = ['Content-Type', 'Authorization']
CORS_MAX_AGE = 86400

# Enable CORS for specific routes
CORS_ROUTES = {
    r"/superset/dashboard/*": {
        "origins": ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["*"],
        "supports_credentials": True
    },
    r"/superset/dashboard/list/*": {
        "origins": ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"],
        "methods": ["GET", "OPTIONS"],
        "allow_headers": ["*"],
        "supports_credentials": True
    }
}

# Enable SQL Lab
FEATURE_FLAGS["SQL_VALIDATORS_BY_ENGINE"] = {
    "trino": "TrinoNativeSQLValidator"
}

# Cache configuration
CACHE_CONFIG = {
    'CACHE_TYPE': 'SimpleCache',
    'CACHE_DEFAULT_TIMEOUT': 300
}

# Timeout configuration
SQLLAB_TIMEOUT = 300
SQLLAB_DEFAULT_DBID = None

# Database engine configurations
ENGINE_CONFIG = {
    'trino': {
        'sqlalchemy_uri': 'trino://trino:8080',
        'connect_args': {
            'host': 'trino',
            'port': 8080,
            'catalog': 'mongodb',
            'schema': 'default',
            'user': 'admin'
        }
    }
}

# Logging configuration
LOGGING_CONFIG = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'standard': {
            'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
        },
    },
    'handlers': {
        'default': {
            'level': 'INFO',
            'formatter': 'standard',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        '': {
            'handlers': ['default'],
            'level': 'INFO',
            'propagate': False
        },
    }
}
