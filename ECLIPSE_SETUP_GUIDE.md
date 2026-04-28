# Eclipse Setup Guide

Use this project ZIP as one connected project:

- `backend/` - Spring Boot API for Eclipse
- `frontend/` - React app
- MySQL database - `relief_db`

## 1. Import Backend In Eclipse

1. Open Eclipse.
2. Go to `File` -> `Import`.
3. Select `Maven` -> `Existing Maven Projects`.
4. Choose this folder:

```text
backend
```

5. Tick `pom.xml`.
6. Click `Finish`.

## 2. Check JDK 17 In Eclipse

1. Go to `Window` -> `Preferences`.
2. Go to `Java` -> `Installed JREs`.
3. Tick your JDK 17 entry, for example:

```text
jdk-17.0.18...
```

4. Click `Apply and Close`.

## 3. Create MySQL Database

Open MySQL and run:

```sql
CREATE DATABASE IF NOT EXISTS relief_db;
```

## 4. Add Backend Run Environment Variables

In Eclipse:

1. Right click `ReliefConnectionApplication.java`.
2. Choose `Run As` -> `Run Configurations...`.
3. Select your Java Application run config.
4. Open the `Environment` tab.
5. Add these variables:

```text
DB_HOST=localhost
DB_PORT=3306
DB_NAME=relief_db
DB_USER=root
DB_PASS=your_mysql_password
PORT=5001
EMAIL_ENABLED=false
```

6. Click `Apply`.
7. Click `Run`.

Test backend in browser:

```text
http://localhost:5001/api/health
```

## 5. Run Frontend

In Eclipse:

1. Go to `Window` -> `Show View` -> `Terminal`.
2. Run:

```powershell
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

The frontend connects to Spring Boot through:

```text
VITE_API_BASE_URL=http://localhost:5001
```

## 6. Important

Do not run the old JavaScript backend. Use only:

- Spring Boot backend from `backend/`
- React frontend from `frontend/`
