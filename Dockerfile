FROM gradle:8.14.3-jdk21-alpine AS builder

WORKDIR /app
COPY . .
RUN gradle clean build -x test --no-daemon

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Копируем JAR файл
COPY --from=builder /app/build/libs/phonebook.jar app.jar

# Для отладки: создаем скрипт который покажет переменные окружения
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'echo "=== ENVIRONMENT VARIABLES ==="' >> /app/entrypoint.sh && \
    echo 'env | grep -E "(DATABASE|DB_|JWT|SUPERADMIN)"' >> /app/entrypoint.sh && \
    echo 'echo "============================="' >> /app/entrypoint.sh && \
    echo 'exec java -jar app.jar' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

# Открываем порт
EXPOSE 10000

# Используем shell форму чтобы переменные окружения подхватились
ENTRYPOINT ["/app/entrypoint.sh"]