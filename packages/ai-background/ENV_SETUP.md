# 环境配置说明

## 环境变量配置

本项目使用环境变量来配置敏感信息和应用设置。请按照以下步骤配置您的环境变量。

## 配置步骤

### 1. 创建 .env 文件

在项目根目录下创建 `.env` 文件：

```bash
touch .env
```

### 2. 添加环境变量

将以下内容复制到 `.env` 文件中：

```env
# DeepSeek API 配置
DEEPSEEK_API_KEY=sk-c09361e4b60c403083cf542d5ebe756b
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# 服务器配置
PORT=3000
```

## 环境变量说明

### DEEPSEEK_API_KEY
- **类型**: 字符串
- **必填**: 是
- **说明**: DeepSeek API 的密钥，用于调用 DeepSeek AI 服务
- **获取方式**: 
  1. 访问 [DeepSeek 官网](https://platform.deepseek.com/)
  2. 注册并登录账号
  3. 在控制台中创建 API 密钥
- **当前值**: `sk-c09361e4b60c403083cf542d5ebe756b`（已提供）

### DEEPSEEK_BASE_URL
- **类型**: 字符串
- **必填**: 是
- **说明**: DeepSeek API 的基础 URL
- **默认值**: `https://api.deepseek.com/v1`
- **注意**: 通常不需要修改此值

### PORT
- **类型**: 数字
- **必填**: 否
- **说明**: 应用服务器监听的端口号
- **默认值**: `3000`
- **示例**: 如果要使用 8080 端口，设置为 `PORT=8080`

## 安全提示

⚠️ **重要安全提示**:

1. **不要提交 .env 文件到版本控制系统**
   - `.env` 文件已被 `.gitignore` 排除
   - 确保不要使用 `git add -f .env` 强制添加

2. **保护您的 API 密钥**
   - 不要在公开场合分享您的 API 密钥
   - 不要将 API 密钥硬编码在代码中
   - 定期轮换 API 密钥

3. **使用不同的密钥**
   - 开发环境和生产环境使用不同的 API 密钥
   - 为不同的项目使用不同的 API 密钥

## 验证配置

配置完成后，您可以通过以下方式验证配置是否正确：

### 1. 启动应用

```bash
npm run start:dev
```

### 2. 检查健康状态

```bash
curl http://localhost:3000/api/health
```

如果看到以下响应，说明基础配置正确：

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "message": "LangChain + NestJS + DeepSeek 服务运行正常"
}
```

### 3. 测试 DeepSeek API 连接

```bash
curl -X POST http://localhost:3000/api/langchain/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "你好"}'
```

如果收到 AI 的回复，说明 DeepSeek API 配置正确。

## 故障排除

### 问题 1: API 密钥无效

**错误信息**: `Unauthorized` 或 `Invalid API key`

**解决方案**:
1. 检查 `.env` 文件中的 `DEEPSEEK_API_KEY` 是否正确
2. 确认 API 密钥在 DeepSeek 控制台中是否有效
3. 检查 API 密钥是否有足够的配额

### 问题 2: 无法连接到 DeepSeek API

**错误信息**: `ECONNREFUSED` 或 `Network error`

**解决方案**:
1. 检查网络连接是否正常
2. 确认 `DEEPSEEK_BASE_URL` 是否正确
3. 检查防火墙或代理设置

### 问题 3: 端口被占用

**错误信息**: `Port 3000 is already in use`

**解决方案**:
1. 更改 `.env` 中的 `PORT` 值
2. 或者关闭占用 3000 端口的其他应用

```bash
# 查找占用端口的进程
lsof -i :3000

# 结束该进程（将 PID 替换为实际进程 ID）
kill -9 PID
```

## 高级配置

### 添加更多环境变量

如果您需要添加更多配置，请在 `.env` 文件中添加，例如：

```env
# 数据库配置（示例）
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=myapp
DATABASE_USER=admin
DATABASE_PASSWORD=secret

# Redis 配置（示例）
REDIS_HOST=localhost
REDIS_PORT=6379

# 日志配置
LOG_LEVEL=debug

# 文件上传限制
MAX_FILE_SIZE=10485760  # 10MB

# CORS 配置
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

然后在代码中使用：

```typescript
// src/config/database.config.ts
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (configService: ConfigService) => ({
  host: configService.get('DATABASE_HOST'),
  port: configService.get('DATABASE_PORT'),
  database: configService.get('DATABASE_NAME'),
  username: configService.get('DATABASE_USER'),
  password: configService.get('DATABASE_PASSWORD'),
});
```

## 生产环境配置

在生产环境中，建议使用环境变量管理服务：

### 选项 1: 使用 Docker

```dockerfile
# Dockerfile
ENV DEEPSEEK_API_KEY=${DEEPSEEK_API_KEY}
ENV PORT=${PORT}
```

### 选项 2: 使用云服务提供商

- **AWS**: 使用 AWS Systems Manager Parameter Store 或 Secrets Manager
- **Azure**: 使用 Azure Key Vault
- **Google Cloud**: 使用 Secret Manager
- **Heroku**: 使用 Config Vars
- **Vercel**: 使用 Environment Variables

### 选项 3: 使用 PM2

```bash
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'langchain-app',
    script: './dist/main.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    env_production: {
      DEEPSEEK_API_KEY: 'your-production-key',
      DEEPSEEK_BASE_URL: 'https://api.deepseek.com/v1',
    }
  }]
};
```

## 相关文档

- [NestJS 配置文档](https://docs.nestjs.com/techniques/configuration)
- [DeepSeek API 文档](https://platform.deepseek.com/api-docs/)
- [dotenv 文档](https://github.com/motdotla/dotenv)

## 支持

如果您在配置过程中遇到问题，请：
1. 查看本文档的故障排除部分
2. 检查应用日志获取详细错误信息
3. 在 GitHub Issues 中提问

