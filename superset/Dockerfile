FROM apache/superset:latest

# Switch to root to install packages and set permissions
USER root

# Install system dependencies for PostgreSQL and other packages
RUN apt-get update && \
    apt-get install -y curl libpq-dev python3-dev gcc && \
    apt-get clean

# Install Python packages including flask-cors, PostgreSQL driver, and other dependencies
RUN pip install --no-cache-dir flask-cors trino sqlalchemy-trino requests psycopg2-binary && \
    pip list | grep -E "(flask-cors|psycopg2)" && \
    pip install --upgrade pip

# Copy the initialization script and set permissions
COPY superset_init.sh /app/superset_init.sh
RUN chown superset:superset /app/superset_init.sh && chmod +x /app/superset_init.sh

# Copy the Superset configuration
COPY superset_config.py /app/superset_config.py
RUN chown superset:superset /app/superset_config.py

# Switch back to superset user
USER superset

# Set the entrypoint to use bash explicitly
ENTRYPOINT ["bash", "/app/superset_init.sh"]
