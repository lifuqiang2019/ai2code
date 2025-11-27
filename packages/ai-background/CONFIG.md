# 项目配置说明

## 简洁配置

本项目采用简洁的双服务配置：

### 🔑 API 配置

#### 1. DeepSeek（文本对话）
- **用途**: 智能文本对话、问答、分析
- **优势**: 免费配额充足，响应快速
- **API Key**: `sk-c09361e4b60c403083cf542d5ebe756b`

#### 2. 智谱 GLM-4V（图片识别）
- **用途**: 图片识别、OCR、对象检测
- **优势**: 中国服务，稳定快速，免费配额
- **API Key**: `2efd65c73f9e45468e8113557063155b.WJH3umRZTDrTqTbj`

## 环境变量配置

`.env` 文件内容：

```env
# DeepSeek API 配置（用于文本对话）
DEEPSEEK_API_KEY=sk-c09361e4b60c403083cf542d5ebe756b
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# 智谱 GLM-4V API 配置（用于图片识别）
GLM_API_KEY=2efd65c73f9e45468e8113557063155b.WJH3umRZTDrTqTbj

# 服务器配置
PORT=8080
```

## 功能清单

### ✅ 已实现功能

1. **智能对话** - 使用 DeepSeek
   - 文本问答
   - 内容生成
   - 信息分析

2. **图片识别** - 使用 GLM-4V
   - 图片内容描述
   - OCR 文字提取
   - 对象检测
   - 场景分析

3. **文件上传**
   - 支持本地图片上传
   - 支持图片 URL 识别
   - 支持 base64 图片

## API 端点

### 基础接口

```http
GET  /api              # 欢迎页面
GET  /api/health       # 健康检查
```

### 文本对话

```http
POST /api/langchain/chat
Content-Type: application/json

{
  "message": "你好"
}
```

### 图片识别

```http
POST /api/langchain/analyze-image-url
Content-Type: application/json

{
  "imageUrl": "https://example.com/image.jpg",
  "question": "这张图片里有什么？"
}
```

```http
POST /api/langchain/analyze-image-upload
Content-Type: multipart/form-data

image: [文件]
question: 这张图片里有什么？
```

### OCR 文字提取

```http
POST /api/langchain/ocr
Content-Type: application/json

{
  "imageUrl": "https://example.com/document.jpg"
}
```

### 对象检测

```http
POST /api/langchain/detect-objects
Content-Type: application/json

{
  "imageUrl": "https://example.com/scene.jpg"
}
```

## 依赖包

### 主要依赖

```json
{
  "@nestjs/common": "^10.3.0",
  "@nestjs/core": "^10.3.0",
  "@nestjs/config": "^3.1.1",
  "langchain": "^0.1.0",
  "@langchain/core": "^0.1.0",
  "@langchain/openai": "^0.0.14",
  "axios": "^1.6.5",
  "multer": "^1.4.5-lts.1"
}
```

### 为什么这样配置？

1. **性能优化** - 两个服务都有良好的响应速度
2. **成本控制** - 都有免费配额，适合开发和小规模使用
3. **稳定可靠** - 中国服务（GLM-4V）访问更稳定
4. **简单明了** - 只有两个 API 配置，易于管理

## 注意事项

1. **API 密钥安全**
   - 不要将 `.env` 文件提交到 Git
   - 生产环境使用环境变量或密钥管理服务

2. **配额管理**
   - 定期检查 API 使用情况
   - DeepSeek: https://platform.deepseek.com/
   - 智谱AI: https://open.bigmodel.cn/

3. **错误处理**
   - 服务会自动处理常见错误
   - 查看日志获取详细错误信息

## 获取 API Key

### DeepSeek
1. 访问 https://platform.deepseek.com/
2. 注册并登录
3. 在控制台创建 API Key

### 智谱 GLM-4V
1. 访问 https://open.bigmodel.cn/
2. 注册并登录
3. 在控制台创建 API Key
4. 选择 GLM-4V 模型

## 扩展建议

如果将来需要添加更多功能：

1. **添加数据库** - 存储对话历史
2. **用户认证** - JWT 或 OAuth
3. **速率限制** - 防止滥用
4. **日志系统** - 记录请求和错误
5. **监控告警** - 跟踪 API 使用情况

## 技术支持

- GitHub Issues
- 项目文档：README.md
- 快速开始：QUICK_START.md

