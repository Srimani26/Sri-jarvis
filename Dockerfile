FROM node:20-slim AS base
WORKDIR /app

RUN apt-get update && apt-get install -y python3 python3-pip curl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build
RUN npm run build:server

EXPOSE 3001
ENV PORT=3001
ENV NODE_ENV=production

CMD ["node", "server.mjs"]
