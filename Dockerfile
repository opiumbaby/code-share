FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN chmod +x ./scripts/docker-entrypoint.sh

EXPOSE 3000

CMD ["sh", "./scripts/docker-entrypoint.sh"]
