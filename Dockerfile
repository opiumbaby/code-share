FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/codeshare
ARG BETTER_AUTH_URL=http://localhost:3000
ARG BETTER_AUTH_SECRET=BUILD_TIME_ONLY_SECRET_CHANGE_IN_RUNTIME_ENV_1234567890
ENV DATABASE_URL=${DATABASE_URL}
ENV BETTER_AUTH_URL=${BETTER_AUTH_URL}
ENV BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
RUN npm run build
RUN chmod +x ./scripts/docker-entrypoint.sh

EXPOSE 3000

CMD ["sh", "./scripts/docker-entrypoint.sh"]
