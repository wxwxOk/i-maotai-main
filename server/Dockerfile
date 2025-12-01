FROM node:18-alpine

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
