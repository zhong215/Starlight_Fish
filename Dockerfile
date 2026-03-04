# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 构建项目
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 安装 envsubst 用于环境变量替换
RUN apk add --no-cache gettext

# 复制构建产物到 nginx 目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置模板
COPY nginx.conf /etc/nginx/templates/default.conf.template

# 创建启动脚本
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'export PORT=${PORT:-8080}' >> /docker-entrypoint.sh && \
    echo 'envsubst '\''$PORT'\'' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# 暴露端口（Zeabur 会使用 PORT 环境变量）
EXPOSE 8080

# 使用自定义启动脚本
CMD ["/docker-entrypoint.sh"]
