FROM oven/bun:latest AS base
WORKDIR /app

COPY package.json ./
RUN bun install --production

COPY . .
RUN bun run build

EXPOSE 3001
ENV PORT=3001
ENV NODE_ENV=production

CMD ["bun", "run", "server.tsx"]
