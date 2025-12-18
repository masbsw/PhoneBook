# Этап 1: Сборка
FROM gradle:8.14.3-jdk21-alpine AS builder
WORKDIR /app

COPY build.gradle gradlew ./
COPY gradle/wrapper gradle/wrapper/

RUN ./gradlew dependencies --no-daemon

COPY src src

RUN ./gradlew clean build -x test --no-daemon

# Этап 2: Запуск
FROM openjdk:21-jdk-slim
WORKDIR /app

COPY --from=builder /app/build/libs/*.jar app.jar

RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=render"]