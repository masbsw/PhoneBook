# Этап 1: Сборка
FROM gradle:8.14.3-jdk21-alpine AS builder
WORKDIR /app
COPY . .
RUN gradle clean build -x test --no-daemon


FROM openjdk:21-jdk-slim
WORKDIR /app

# Копируем собранный JAR из этапа сборки
COPY --from=builder /app/build/libs/phonebook.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=render"]