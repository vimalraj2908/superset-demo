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
}

# The following secret is for signing guest tokens.
# Make sure it's long, complex, and stored securely.
GUEST_TOKEN_JWT_SECRET = os.environ.get("SUPERSET_GUEST_TOKEN_JWT_SECRET", "hiUasToS3ihDkBhBTyRB3trC1v9SzWH_nWJehi5B2tI")

# Allow the frontend application to embed dashboards
TALISMAN_CONFIG = {
    "content_security_policy": {
        "frame-ancestors": ["'self'", "http://localhost:3000"],
    },
    "force_https": False,
    "strict_transport_security": False,
}

# This is needed to run behind a reverse proxy
ENABLE_PROXY_FIX = True

# Define the role name for guest users in Superset.
# This role needs to be created manually in the Superset UI
# and given access to the specific datasources and dashboards.
GUEST_ROLE_NAME = "Guest"

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

# Security settings
WTF_CSRF_ENABLED = True
WTF_CSRF_TIME_LIMIT = None

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
