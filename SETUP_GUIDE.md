# Relief Connection Setup Guide

This project is now split into two parts:

- `frontend/` - React + Vite app
- `backend/` - Spring Boot REST API connected to MySQL

The old JavaScript backend from the ZIP is not used by the clean setup.

## 1. Install Required Software

Install these first:

- JDK 17 or newer
- Maven
- MySQL Server 8.x
- Node.js and npm

Check them in PowerShell:

```powershell
java -version
mvn -version
mysql --version
node -v
npm -v
```

If `java -version` shows Java 8, install JDK 17 and make sure `JAVA_HOME` points to JDK 17.

## 2. Create the MySQL Database

Open MySQL:

```powershell
mysql -u root -p
```

Then run:

```sql
CREATE DATABASE IF NOT EXISTS relief_db;
```

You can use your root account during development. If you want a separate user:

```sql
CREATE USER IF NOT EXISTS 'relief_user'@'localhost' IDENTIFIED BY 'change_this_password';
GRANT ALL PRIVILEGES ON relief_db.* TO 'relief_user'@'localhost';
FLUSH PRIVILEGES;
```

The Spring Boot app will create/update these tables automatically:

- `users`
- `relief_records`

## 3. Configure the Backend

In a new PowerShell terminal:

```powershell
cd "C:\Users\saket\OneDrive\ドキュメント\New project\backend"

$env:PORT="5001"
$env:DB_HOST="localhost"
$env:DB_PORT="3306"
$env:DB_NAME="relief_db"
$env:DB_USER="root"
$env:DB_PASS="your_mysql_password"
$env:EMAIL_ENABLED="true"
$env:EMAIL_USER="your_email@gmail.com"
$env:EMAIL_PASS="your_gmail_app_password"

mvn spring-boot:run
```

If you created `relief_user`, use:

```powershell
$env:DB_USER="relief_user"
$env:DB_PASS="change_this_password"
```

Test the backend:

```text
http://localhost:5001/api/health
```

You should see a JSON response with `status: "ok"`.

## 4. Gmail OTP Email

Forgot password sends the OTP to the registered email address. For Gmail, create a Gmail app password and run the backend with:

```powershell
$env:EMAIL_ENABLED="true"
$env:EMAIL_USER="your_email@gmail.com"
$env:EMAIL_PASS="your_gmail_app_password"
```

`EMAIL_PASS` must be a Gmail app password, not your normal Gmail login password. If `EMAIL_USER` or `EMAIL_PASS` is missing, the backend returns "Email delivery is currently unavailable" instead of pretending the OTP was sent.

Do not put real passwords in frontend `.env` files.

## 5. Configure and Run the Frontend

In a second PowerShell terminal:

```powershell
cd "C:\Users\saket\OneDrive\ドキュメント\New project\frontend"
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

The frontend uses:

```text
VITE_API_BASE_URL=http://localhost:5001
```

That is already set in `frontend/.env`.

## 6. API Routes Connected

The React app is connected to these Spring Boot endpoints:

- `POST /api/signup`
- `POST /api/login`
- `PUT /api/auth/me`
- `POST /api/forgot-password`
- `POST /api/verify-otp`
- `GET /api/database?userEmail=...`
- `POST /api/database`
- `POST /api/notify-order`
- `POST /api/notify-receipt`
- `GET /api/health`

## 7. Notes Before Production

This backend intentionally matches your existing app behavior, including simple email/password login and flexible record storage. Before using it in production, add password hashing, authentication tokens, validation, and role checks for admin/logistics actions.
