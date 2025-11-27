# 图片识别功能配置说明

## 重要提示 ⚠️

**DeepSeek 目前不支持图片识别功能**，它是一个纯文本的大语言模型。

## 解决方案

要使用图片识别功能，您需要配置 OpenAI API（支持 GPT-4 Vision）。

### 方案 1: 配置 OpenAI API（推荐）

#### 1. 获取 OpenAI API Key

1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册或登录账号
3. 前往 [API Keys](https://platform.openai.com/api-keys)
4. 创建新的 API Key

#### 2. 配置环境变量

在 `.env` 文件中添加：

```env
# DeepSeek API（用于文本对话）
DEEPSEEK_API_KEY=sk-c09361e4b60c403083cf542d5ebe756b
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# OpenAI API（用于图片识别）
OPENAI_API_KEY=sk-your-openai-api-key-here

# 服务器配置
PORT=8080
```

#### 3. 重启服务

```bash
# 停止当前服务
pkill -f "nest start"

# 重新启动
cd /Users/lfq/Desktop/ai2code
pnpm run start:dev
```

### 方案 2: 使用其他视觉 AI 服务

如果您不想使用 OpenAI，也可以选择：

1. **Google Gemini Pro Vision** - Google 的多模态模型
2. **Anthropic Claude 3** - 支持图片识别
3. **Azure Computer Vision** - 微软的图像分析服务
4. **本地模型** - 如 LLaVA、MiniGPT-4 等

需要修改 `src/langchain/services/image-analysis.service.ts` 来集成这些服务。

## 功能说明

### 配置 OpenAI 后可用的功能

✅ **图片识别** - 分析图片内容  
✅ **OCR 文字提取** - 从图片中提取文字  
✅ **对象检测** - 识别图片中的物体  
✅ **场景分析** - 描述图片场景和氛围  
✅ **图片问答** - 针对图片内容回答问题

### 未配置 OpenAI 时

❌ 图片识别功能不可用  
✅ DeepSeek 文本对话功能正常  
✅ 其他文本处理功能正常

## 成本说明

### OpenAI GPT-4 Vision 定价

- **GPT-4o**: $2.50 / 1M input tokens, $10.00 / 1M output tokens
- **GPT-4o-mini**: $0.15 / 1M input tokens, $0.60 / 1M output tokens
- 图片输入成本取决于图片大小和分辨率

详细价格请查看：https://openai.com/api/pricing/

### DeepSeek 定价

- **DeepSeek Chat**: 更经济实惠的文本模型
- 具体价格请查看：https://platform.deepseek.com/

## 测试配置

配置完成后，测试图片识别功能：

```bash
# 测试图片识别
curl -X POST http://localhost:8080/api/langchain/analyze-image-url \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400",
    "question": "这张图片里有什么？"
  }'
```

或使用浏览器打开 `test-client.html` 进行可视化测试。

## 常见问题

### Q: 为什么选择 OpenAI 而不是其他服务？

A: OpenAI GPT-4 Vision 具有：
- 强大的图片理解能力
- 支持中文
- API 稳定可靠
- 与现有代码兼容性好

### Q: 有免费的替代方案吗？

A: 可以考虑：
1. **Hugging Face 上的开源模型** - 如 LLaVA
2. **Google Gemini** - 有一定的免费额度
3. **本地部署的视觉模型** - 但需要较强的计算资源

### Q: 可以同时使用 DeepSeek 和 OpenAI 吗？

A: 可以！当前配置就是这样：
- **DeepSeek** 处理文本对话（成本低）
- **OpenAI GPT-4 Vision** 处理图片识别（功能强）

这样可以在保持成本优化的同时获得最佳功能。

## 技术支持

如需帮助：
1. 查看 [OpenAI 文档](https://platform.openai.com/docs/guides/vision)
2. 查看 [DeepSeek 文档](https://platform.deepseek.com/docs)
3. 提交 GitHub Issue

---

**建议**: 对于生产环境，建议设置 API 使用限额和监控，避免意外高额费用。

