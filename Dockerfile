FROM gradle:8.14.3-jdk21-alpine

WORKDIR /app
COPY . .

RUN gradle clean build -x test --no-daemon

EXPOSE 8080

CMD ["java", "-jar", "build/libs/phonebook.jar", "--spring.profiles.active=render"]