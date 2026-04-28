# Local Run Notes

## Backend

Run from:

```powershell
cd "C:\Users\saket\OneDrive\ドキュメント\New project\backend"
```

Set:

```powershell
$env:PORT="5001"
$env:DB_HOST="localhost"
$env:DB_PORT="3306"
$env:DB_NAME="relief_db"
$env:DB_USER="root"
$env:DB_PASS="your_mysql_password"
$env:EMAIL_ENABLED="false"
$env:FRONTEND_ORIGIN="http://localhost:5173"
```

Then start:

```powershell
mvn spring-boot:run
```

## Frontend

Run from:

```powershell
cd "C:\Users\saket\OneDrive\ドキュメント\New project\frontend"
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

The frontend will use the Vite proxy for `/api` in development, and same-origin API calls in production.
