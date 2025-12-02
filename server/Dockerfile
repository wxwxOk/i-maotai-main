FROM node:18-slim

# 安装OpenSSL和其他Prisma依赖
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm install --production

# 复制构建产物
COPY dist ./dist
COPY prisma ./prisma

# 生成Prisma客户端
RUN npx prisma generate

EXPOSE 3000

CMD ["node", "dist/main.js"]
