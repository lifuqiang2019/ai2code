# LangChain + NestJS + DeepSeek 图片识别项目

这是一个基于 NestJS 框架，集成 LangChain 和 DeepSeek API 的图片识别服务项目。

## 功能特性

- 🤖 集成 DeepSeek AI 模型
- 🖼️ 图片识别和分析
- 📝 OCR 文字提取
- 🔍 对象检测
- 💬 智能对话
- 🛠️ LangChain 工具链集成

## 技术栈

- **后端框架**: NestJS
- **AI 框架**: LangChain
- **文本对话**: DeepSeek API
- **图片识别**: 智谱 GLM-4V API
- **语言**: TypeScript
- **图片处理**: Multer, Axios

## 项目结构

```
ai2code/
├── src/
│   ├── main.ts                           # 应用入口
│   ├── app.module.ts                     # 根模块
│   ├── app.controller.ts                 # 根控制器
│   ├── app.service.ts                    # 根服务
│   └── langchain/                        # LangChain 模块
│       ├── langchain.module.ts           # LangChain 模块定义
│       ├── langchain.controller.ts       # API 控制器
│       ├── langchain.service.ts          # LangChain 服务
│       ├── dto/                          # 数据传输对象
│       │   └── chat.dto.ts
│       ├── services/                     # 业务服务
│       │   └── image-analysis.service.ts # 图片分析服务
│       └── tools/                        # LangChain 工具
│           └── image-recognition.tool.ts # 图片识别工具
├── uploads/                              # 上传文件目录
├── package.json                          # 项目依赖
├── tsconfig.json                         # TypeScript 配置
├── nest-cli.json                         # NestJS CLI 配置
└── .gitignore                            # Git 忽略文件
```

## 安装步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件（已包含在项目中）：

```env
# DeepSeek API 配置（用于文本对话）
DEEPSEEK_API_KEY=sk-c09361e4b60c403083cf542d5ebe756b
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# 智谱 GLM-4V API 配置（用于图片识别）
GLM_API_KEY=your_glm_api_key

# 服务器配置
PORT=8080
```

### 3. 创建上传目录

```bash
mkdir uploads
```

### 4. 启动应用

开发模式：
```bash
npm run start:dev
```

生产模式：
```bash
npm run build
npm run start:prod
```

应用将在 `http://localhost:3000` 启动。

## API 接口

### 基础接口

#### 健康检查
```http
GET /api/health
```

#### 欢迎页面
```http
GET /api
```

### LangChain 接口

#### 1. 智能对话
```http
POST /api/langchain/chat
Content-Type: application/json

{
  "message": "你好，请介绍一下自己"
}
```

#### 2. 图片识别（URL）
```http
POST /api/langchain/analyze-image-url
Content-Type: application/json

{
  "imageUrl": "https://example.com/image.jpg",
  "question": "这张图片里有什么？"
}
```

#### 3. 图片识别（上传文件）
```http
POST /api/langchain/analyze-image-upload
Content-Type: multipart/form-data

image: [文件]
question: 这张图片里有什么？
```

#### 4. OCR 文字提取
```http
POST /api/langchain/ocr
Content-Type: application/json

{
  "imageUrl": "https://example.com/document.jpg"
}
```

#### 5. 对象检测
```http
POST /api/langchain/detect-objects
Content-Type: application/json

{
  "imageUrl": "https://example.com/scene.jpg"
}
```

#### 6. 使用 Agent 分析
```http
POST /api/langchain/analyze-with-agent
Content-Type: application/json

{
  "imageUrl": "https://example.com/image.jpg",
  "task": "分析这张图片的构图和色彩"
}
```

## 使用示例

### 使用 cURL

```bash
# 聊天
curl -X POST http://localhost:3000/api/langchain/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "你好"}'

# 图片识别（URL）
curl -X POST http://localhost:3000/api/langchain/analyze-image-url \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://example.com/image.jpg", "question": "描述这张图片"}'

# 图片上传识别
curl -X POST http://localhost:3000/api/langchain/analyze-image-upload \
  -F "image=@/path/to/your/image.jpg" \
  -F "question=这张图片里有什么？"
```

### 使用 JavaScript/TypeScript

```typescript
// 聊天
const chatResponse = await fetch('http://localhost:3000/api/langchain/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: '你好，请介绍一下自己',
  }),
});
const chatData = await chatResponse.json();
console.log(chatData.data.message);

// 图片识别
const imageResponse = await fetch('http://localhost:3000/api/langchain/analyze-image-url', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    imageUrl: 'https://example.com/image.jpg',
    question: '这张图片里有什么？',
  }),
});
const imageData = await imageResponse.json();
console.log(imageData.data.analysis);
```

## 支持的图片格式

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- BMP (.bmp)

最大文件大小：10MB

## LangChain 工具

项目中实现了以下 LangChain 工具：

1. **image_recognition**: 通用图片识别工具
2. **ocr_text_extraction**: OCR 文字提取工具
3. **object_detection**: 对象检测工具

这些工具可以在 LangChain Agent 中使用，实现更复杂的 AI 任务。

## 开发

### 代码格式化
```bash
npm run format
```

### 代码检查
```bash
npm run lint
```

## 注意事项

1. **API 密钥安全**: 请妥善保管您的 DeepSeek API 密钥，不要将其提交到版本控制系统。
2. **图片大小限制**: 上传的图片不应超过 10MB。
3. **网络访问**: 使用 URL 方式识别图片时，确保服务器可以访问该 URL。
4. **存储空间**: 上传的图片会保存在 `uploads` 目录，请定期清理。

## 故障排除

### 问题：无法连接到 DeepSeek API

**解决方案**:
- 检查 `.env` 文件中的 API 密钥是否正确
- 检查网络连接
- 确认 DeepSeek API 服务状态

### 问题：图片上传失败

**解决方案**:
- 确保 `uploads` 目录存在且有写入权限
- 检查图片格式是否支持
- 确认图片大小不超过 10MB

### 问题：图片识别失败

**解决方案**:
- 确认图片 URL 可访问
- 检查图片格式是否正确
- 查看服务器日志获取详细错误信息

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题或建议，请通过 GitHub Issues 联系我们。

