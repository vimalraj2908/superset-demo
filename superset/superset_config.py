# superset_config.py
import os
from typing import Dict, Any

# Your App's Secret Key
SECRET_KEY = os.environ.get("SUPERSET_SECRET_KEY", "your_super_secret_key_for_superset")

# Basic database configuration
SQLALCHEMY_DATABASE_URI = os.environ.get("SUPERSET_DATABASE_URL", "postgresql://superset:superset@superset-db:5432/superset")

# Enable debug mode for detailed logging
DEBUG = True
FLASK_ENV = "development"

# Basic feature flags
FEATURE_FLAGS = {
    "EMBEDDED_SUPERSET": True,
    "DASHBOARD_NATIVE_FILTERS": True,
    "EMBEDDED_CHARTS": True,
    "EMBEDDED_DASHBOARDS": True,
    "EMBEDDED_SUPERSET": True,
    "DASHBOARD_RBAC": True,
    "ENABLE_TEMPLATE_PROCESSING": True,
}

# Guest token configuration for embedded SDK
GUEST_TOKEN_JWT_SECRET = os.environ.get("SUPERSET_GUEST_TOKEN_JWT_SECRET", "hiUasToS3ihDkBhBTyRB3trC1v9SzWH_nWJehi5B2tI")

# Enable guest token authentication for embedded SDK
ENABLE_GUEST_TOKEN_AUTH = True

# Basic CORS settings
ENABLE_CORS = True
CORS_OPTIONS = {
    'supports_credentials': True,
    'allow_headers': ['*'],
    'resources': ['*'],
    'origins': ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000']
}

# Security settings
WTF_CSRF_ENABLED = False  # Disable for development
ENABLE_PROXY_FIX = True

# Allow iframe embedding - use environment variable if available
X_FRAME_OPTIONS = os.environ.get('SUPERSET_X_FRAME_OPTIONS', 'ALLOWALL')

# Additional iframe embedding settings
WTF_CSRF_ENABLED = False
ENABLE_PROXY_FIX = True

# Disable frame protection for development - use environment variable if available
FRAME_PROTECTION = os.environ.get('SUPERSET_FRAME_PROTECTION', 'false').lower() == 'true'

# Enable embedded SDK authentication
ENABLE_EMBEDDED_SDK = True

# JWT settings for embedded SDK
JWT_SECRET_KEY = os.environ.get("SUPERSET_GUEST_TOKEN_JWT_SECRET", "hiUasToS3ihDkBhBTyRB3trC1v9SzWH_nWJehi5B2tI")
JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour

# Logging configuration for debug
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
            'level': 'DEBUG',
            'formatter': 'standard',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        '': {
            'handlers': ['default'],
            'level': 'DEBUG',
            'propagate': False
        },
        'superset': {
            'handlers': ['default'],
            'level': 'DEBUG',
            'propagate': False
        },
        'flask_appbuilder': {
            'handlers': ['default'],
            'level': 'DEBUG',
            'propagate': False
        }
    }
}
