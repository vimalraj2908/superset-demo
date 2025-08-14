# Brand Dashboard + Superset Reports

This project is a full-stack web application that provides a brand-specific dashboard populated with pre-built Business Intelligence (BI) reports. It uses Next.js for the frontend, Spring Boot for the backend, MongoDB as the primary data store, and Trino and Apache Superset for BI and report embedding. The entire stack is orchestrated with Docker Compose for a developer-friendly setup.

## Architecture

The application consists of the following services:

-   **Frontend:** A Next.js (React) application that provides the user interface.
-   **Backend:** A Spring Boot (Java) application that handles authentication, data access, and generates secure tokens for embedding reports.
-   **Database:** A MongoDB instance for storing user and brand data.
-   **Query Engine:** A Trino instance that connects to MongoDB, allowing for federated queries.
-   **BI Tool:** An Apache Superset instance that connects to Trino to build and visualize dashboards.

All services are containerized and managed by `docker-compose.yml`.

## Features

-   JWT-based authentication for the web application.
-   Secure, token-based embedding of Superset dashboards.
-   Users can only view dashboards for brands they are authorized to see.
-   Row-Level Security (RLS) is enforced via the guest token to filter data at the Superset level.
-   A sample data loader to get started quickly.

## Prerequisites

-   [Docker](https://docs.docker.com/get-docker/)
-   [Docker Compose](https://docs.docker.com/compose/install/)

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Environment Configuration:**
    While most configuration is baked into the `docker-compose.yml` and application property files, you should review and change the default secrets.
    -   **Backend JWT Secret:** `backend/src/main/resources/application.properties` -> `jwt.secret`
    -   **Superset Guest Token Secret:** This secret must be identical in two places:
        -   `backend/src/main/resources/application.properties` -> `superset.guest_token.secret`
        -   `docker-compose.yml` -> `services.superset.environment.SUPERSET_GUEST_TOKEN_JWT_SECRET`
    -   **Superset Secret Key:** `docker-compose.yml` -> `services.superset.environment.SUPERSET_SECRET_KEY`

3.  **Build and run the application:**
    From the root of the project, run:
    ```bash
    docker-compose up --build
    ```
    This will build the images for the frontend and backend services and start all containers. It may take a few minutes on the first run.

## Accessing the Services

-   **Frontend Application:** [http://localhost:3000](http://localhost:3000)
-   **Backend API:** [http://localhost:8080](http://localhost:8080)
-   **Superset:** [http://localhost:8088](http://localhost:8088)
-   **Trino UI:** [http://localhost:8090](http://localhost:8090)

## Credentials

-   **Web Application:**
    -   **Username:** `om-stage@ausmit.in`
    -   **Password:** `password`
-   **Superset:**
    -   **Username:** `admin`
    -   **Password:** `admin`

## Superset Configuration (Manual Steps)

After starting the application, you need to perform a one-time setup in Superset to create and embed a dashboard.

### Automated Setup (Recommended)

For easier setup, you can use the provided Python script:

1. **Install Python dependencies:**
   ```bash
   pip install requests
   ```

2. **Run the setup script:**
   ```bash
   python setup_superset_db.py
   ```

This script will automatically:
- Wait for Superset to be ready
- Login to Superset
- Add the MongoDB connection via Trino
- Configure the database connection

### Manual Setup

If you prefer to set up manually or the automated script doesn't work:

#### Step 1: Create a "Guest" Role

The application uses Superset's guest token mechanism for secure embedding. This requires a dedicated role with specific, limited permissions.

1.  Log in to Superset at [http://localhost:8088](http://localhost:8088) with the `admin`/`admin` credentials.
2.  Navigate to **Settings** > **List Roles**.
3.  Click the **+ ROLE** button.
4.  Name the role `Guest`.
5.  Find and add the following permissions:
    -   `can read on Dashboard`
    -   `can read on Chart`
    -   `can read on Dataset`
    -   `datasource access on [your_dataset_name]` (You will add this permission after creating your dataset in Step 3).
6.  Click **Save**.

#### Step 2: Connect MongoDB via Trino as a Data Source

1.  Navigate to **Data** > **Databases**.
2.  Click the **+ DATABASE** button.
3.  Select **Trino** as the database engine.
4.  Set the **SQLALCHEMY URI** to: `trino://admin@trino:8080/mongodb/default`
5.  Set the **Database Name** to: `MongoDB via Trino`
6.  Click the **Advanced** tab, then the **Security** sub-tab.
7.  Check the box for **Enable template processing**. This is crucial for row-level security to work.
8.  Click **Connect**.

**Note:** If you don't see Trino as an option, you may need to restart the Superset container to ensure the Trino connector is properly loaded.

#### Step 3: Create a Dataset

1.  Navigate to **Data** > **Datasets**.
2.  Click the **+ DATASET** button.
3.  Select your "MongoDB via Trino" database as the **DATABASE**.
4.  Select `mongodb` as the **SCHEMA** (this should now be visible).
5.  Select `brands` as the **TABLE**.
6.  Click **Create Dataset and Create Chart**. After creating the dataset, go back to the "Guest" role and grant it datasource access as mentioned in Step 1.

**Troubleshooting MongoDB Schema Visibility:**
If the `mongodb` schema is still not showing up:
1. Ensure Trino is running and accessible
2. Check that the MongoDB container is running and has data
3. Verify the Trino MongoDB connector configuration in `trino/catalog/mongodb.properties`
4. Restart the Superset container to refresh connections
5. Check Superset logs for any connection errors

#### Step 4: Create a Dashboard and Get its ID

1.  Create one or more charts using the dataset you just created.
2.  Assemble these charts into a new dashboard.
3.  View your dashboard. The URL will look like this: `http://localhost:8088/superset/dashboard/1/`. The `1` is the ID of the dashboard.
    *(Note: For dashboards created via the UI, the ID is usually an integer. For imported dashboards or newer Superset versions, this might be a UUID like `d8a83471-4a86-4595-88b8-738836523fa9`)*.

#### Step 5: Update Backend Configuration

The backend needs to know the ID of the dashboard and the dataset to generate the correct guest token.

1.  **Update Dashboard ID:**
    -   Open `backend/src/main/java/com/branddashboard/controller/ReportController.java`.
    -   Change the value of the `SUPERSET_DASHBOARD_ID` constant to the ID you found in the previous step.
2.  **Update Dataset ID:**
    -   In the same file, locate the `generateGuestToken` method.
    -   Find the line `rlsRule.put("dataset", 1);`.
    -   You need to replace `1` with the ID of the dataset you created in Step 3. You can find this ID by navigating to your dataset in Superset and looking at its URL.
3.  **Rebuild the backend:**
    -   After making these changes, you need to rebuild the backend service:
        ```bash
        docker-compose up --build -d backend
        ```

After completing these steps, logging into the application and navigating to a brand's detail page should now display the securely embedded Superset dashboard, filtered for that specific brand.
