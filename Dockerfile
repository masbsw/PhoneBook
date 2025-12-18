FROM eclipse-temurin:21-jdk-alpine

WORKDIR /app

# Копируем собранный JAR (локально соберите сначала)
COPY build/libs/phonebook.jar app.jar

EXPOSE 10000

CMD ["java", "-jar", "app.jar"]