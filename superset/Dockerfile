FROM apache/superset:latest

# Switch to root to install packages and set permissions
USER root

# Install additional packages
RUN pip install trino sqlalchemy-trino requests

# Copy the initialization script and set permissions in one step
COPY superset_init.sh /app/superset_init.sh
RUN chown superset:superset /app/superset_init.sh && chmod +x /app/superset_init.sh

# Copy the Superset configuration
COPY superset_config.py /app/superset_config.py
RUN chown superset:superset /app/superset_config.py

# Switch back to superset user
USER superset

# Set the entrypoint to use bash explicitly
ENTRYPOINT ["bash", "/app/superset_init.sh"]
