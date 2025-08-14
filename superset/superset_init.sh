#!/bin/bash

echo "🚀 Starting Superset initialization..."

# Install required packages
pip install trino sqlalchemy-trino requests

# Run database migrations
superset db upgrade

# Create admin user if it doesn't exist
superset fab create-admin \
    --username admin \
    --firstname Superset \
    --lastname Admin \
    --email admin@superset.com \
    --password admin || echo "Admin user might already exist"

# Initialize Superset
superset init

echo "✅ Superset initialization complete!"

# Start Superset server
echo "🚀 Starting Superset server on http://localhost:8088"
echo "Admin credentials: admin/admin"
echo "Debug mode: ENABLED"

# Start Superset with debug mode (this will run in foreground and keep container alive)
exec superset run -p 8088 -h 0.0.0.0 --debug
