# Deploy Relief Connection on Render

This repo deploys to Render as one Docker web service. The root `Dockerfile`
builds the React frontend, copies it into Spring Boot static resources, and
runs the Spring Boot app.

## Delete the Previous Wrong Deployment

If `https://relief-connection.onrender.com` shows only `Not Found`, delete that
old Render service first:

1. Open the Render Dashboard.
2. Click the old `relief-connection` service.
3. Go to Settings.
4. Scroll to the bottom.
5. Click Delete Service.
6. Type the service name to confirm.

After deleting it, create a fresh deployment using the steps below.

## 1. Prepare a MySQL Database

Render does not provide managed MySQL. Use an external MySQL provider such as
Railway, Aiven, PlanetScale, Clever Cloud, or your own MySQL server.

Create a database and keep these values ready:

```text
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASS
```

## 2. Push This Project to GitHub

Render deploys from a Git repository. Push the full project folder, including:

```text
Dockerfile
render.yaml
backend/
frontend/
pom.xml
```

## 3. Create the Render Service

Recommended path:

1. Open Render Dashboard.
2. New > Blueprint.
3. Connect your GitHub repository.
4. Render will detect `render.yaml`.
5. Fill the secret environment variables when Render asks.

Manual path:

1. New > Web Service.
2. Connect your GitHub repository.
3. Root directory: leave empty. Do not set it to `backend` or `frontend`.
4. Runtime: Docker.
5. Dockerfile path: `./Dockerfile`.
6. Health check path: `/api/health`.

Important: this project must deploy from the repository root. If Render uses
`backend/` as the root directory, the React website will not be included.

## 4. Environment Variables

Set these on the Render service:

```text
EMAIL_ENABLED=true
MAIL_PROVIDER=smtp
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

DB_HOST=your_mysql_host
DB_PORT=3306
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASS=your_database_password
```

For Gmail OTP delivery, `EMAIL_PASS` must be a Gmail app password, not your
normal Gmail password.

## 5. Open the Deployed App

After the deploy finishes, open the Render service URL:

```text
https://your-service-name.onrender.com
```

Test the backend health endpoint:

```text
https://your-service-name.onrender.com/api/health
```

If `/api/health` works but `/` says `Not Found`, Render is using the wrong
service configuration. Delete the service and redeploy from the repository root
with Docker.
