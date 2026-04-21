FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first (cached layer)
COPY package.json package-lock.json ./
RUN npm install --omit=dev

# Copy Prisma schema and generate client (pinned to project version)
COPY prisma ./prisma
RUN npx prisma@5.10.2 generate

# Install tsx for running TypeScript directly and pm2 for process management
RUN npm install -g tsx pm2

# Copy source code and PM2 config
COPY src ./src
COPY ecosystem.config.cjs ./

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["pm2-runtime", "ecosystem.config.cjs"]
