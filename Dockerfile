# Используем образ с JDK для сборки
FROM eclipse-temurin:21-jdk-alpine as builder

WORKDIR /app

# 1. Копируем файлы для сборки
COPY . .

# 1.1. ДАВАЙТЕ ПРАВА НА ВЫПОЛНЕНИЕ gradlew!
RUN chmod +x gradlew

# 2. Собираем проект
RUN ./gradlew clean build -x test --no-daemon

# 3. Финальный образ (используем JRE для запуска)
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# 4. Копируем готовый JAR из стадии сборки
COPY --from=builder /app/build/libs/phonebook.jar app.jar

EXPOSE 10000

# 5. Запускаем приложение
CMD ["java", "-jar", "app.jar"]