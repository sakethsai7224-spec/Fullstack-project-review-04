FROM node:24-alpine AS frontend-build
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM maven:3.9-eclipse-temurin-17 AS backend-build
WORKDIR /app

COPY pom.xml ./
COPY backend/pom.xml backend/pom.xml
COPY backend/src backend/src
COPY --from=frontend-build /app/frontend/dist/ backend/src/main/resources/static/

RUN mvn -q -pl backend -am -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=backend-build /app/backend/target/*.jar app.jar

EXPOSE 5001

ENTRYPOINT ["java", "-jar", "app.jar"]
