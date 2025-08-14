# Superset Dashboard Setup Guide

## Problem
The Superset dashboard was getting deleted every time the containers were restarted because the initialization was only happening during the first container startup.

## Solution
We've implemented a persistent initialization system that ensures the dashboard is recreated every time the Superset container starts.

## Files Created/Modified

### 1. `superset_init.sh`
- **Purpose**: Persistent initialization script that runs every time the container starts
- **What it does**:
  - Waits for Superset to be ready
  - Installs required packages (trino, sqlalchemy-trino, requests)
  - Runs database migrations
  - Creates admin user
  - Initializes Superset
  - Creates the Brand Dashboard if it doesn't exist
  - Sets up MongoDB database connection via Trino

### 2. `superset/Dockerfile`
- **Purpose**: Custom Docker image for Superset with built-in initialization
- **What it does**:
  - Extends the official Superset image
  - Installs additional packages
  - Sets the entrypoint to our initialization script

### 3. `docker-compose.yml`
- **Changes**:
  - Uses custom Superset Dockerfile instead of official image
  - Adds persistent volumes for Superset data
  - Mounts the initialization script

### 4. `get_dashboard_id.py`
- **Purpose**: Utility script to get the dashboard ID and update backend configuration
- **What it does**:
  - Logs into Superset
  - Finds the Brand Dashboard
  - Updates the backend Java code with the correct dashboard ID

## How to Use

### Initial Setup
1. **Build and start the services**:
   ```bash
   docker compose up --build
   ```

2. **Wait for Superset to be ready** (check logs):
   ```bash
   docker logs superset
   ```

3. **Get the dashboard ID and update backend**:
   ```bash
   python get_dashboard_id.py
   ```

4. **Restart the backend container**:
   ```bash
   docker restart brand-dashboard-backend
   ```

### After Container Restarts
The dashboard will be automatically recreated every time the Superset container starts, so no manual intervention is needed.

## Troubleshooting

### Dashboard Not Loading
1. **Check if Superset is running**:
   ```bash
   docker ps | grep superset
   ```

2. **Check Superset logs**:
   ```bash
   docker logs superset
   ```

3. **Verify dashboard exists**:
   - Open http://localhost:8088
   - Login with admin/admin
   - Check if "Brand Dashboard" exists in the dashboard list

### Backend Configuration Issues
1. **Run the dashboard ID script**:
   ```bash
   python get_dashboard_id.py
   ```

2. **Restart backend container**:
   ```bash
   docker restart brand-dashboard-backend
   ```

### Database Connection Issues
1. **Check Trino logs**:
   ```bash
   docker logs trino
   ```

2. **Verify MongoDB connection**:
   ```bash
   docker logs mongo
   ```

## Manual Dashboard Creation (if needed)

If you need to manually create the dashboard:

1. **Access Superset**: http://localhost:8088 (admin/admin)

2. **Add Database Connection**:
   - Go to Data → Databases → + Database
   - Database Name: `MongoDB via Trino`
   - SQLAlchemy URI: `trino://trino:8080/mongodb/default`
   - Engine: `trino`

3. **Create Dashboard**:
   - Go to Dashboards → + Dashboard
   - Title: `Brand Dashboard`
   - Slug: `brand-dashboard`

4. **Update Backend Configuration**:
   - Note the dashboard ID from the URL
   - Update `ReportController.java` with the correct ID
   - Restart the backend container

## Persistent Data

The following data is persisted across container restarts:
- **Superset database**: `/app/superset.db` (superset-db volume)
- **Superset assets**: `/var/lib/superset` (superset-data volume)
- **MongoDB data**: `/data/db` (mongo-data volume)

## Security Notes

- Admin credentials are hardcoded in the docker-compose.yml
- JWT secrets are configured in environment variables
- In production, use proper secrets management
- Consider using environment-specific configurations

## Next Steps

1. **Add Charts**: Create charts in the dashboard using the MongoDB connection
2. **Configure RLS**: Set up Row Level Security for brand-specific data
3. **Customize UI**: Modify the dashboard appearance and layout
4. **Add More Dashboards**: Create additional dashboards for different use cases
