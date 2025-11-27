# 快速启动指南 🚀

这是一个 5 分钟快速启动指南，帮助您快速运行项目。

## 前置要求

- Node.js >= 16.0.0
- npm 或 yarn

## 3 步启动

### 步骤 1: 安装依赖 📦

```bash
npm install
```

或使用 yarn:

```bash
yarn install
```

### 步骤 2: 配置环境变量 ⚙️

环境变量配置文件已经自动创建，无需额外配置！

您的 DeepSeek API 密钥已配置为：`sk-c09361e4b60c403083cf542d5ebe756b`

> 如需修改配置，请参考 [ENV_SETUP.md](ENV_SETUP.md)

### 步骤 3: 启动服务 🎉

```bash
npm run start:dev
```

看到以下输出表示启动成功：

```
应用正在运行于: http://localhost:3000/api
```

## 立即测试

### 测试 1: 健康检查 ✅

在浏览器中访问或使用 curl：

```bash
curl http://localhost:3000/api/health
```

**预期响应**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "message": "LangChain + NestJS + DeepSeek 服务运行正常"
}
```

### 测试 2: 智能对话 💬

```bash
curl -X POST http://localhost:3000/api/langchain/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "你好，请介绍一下自己"}'
```

### 测试 3: 图片识别 🖼️

使用在线图片 URL：

```bash
curl -X POST http://localhost:3000/api/langchain/analyze-image-url \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://images.unsplash.com/photo-1574158622682-e40e69881006",
    "question": "这张图片里有什么动物？"
  }'
```

## 可用的 API 接口

一旦服务启动，您可以访问以下接口：

| 接口 | 方法 | 路径 | 功能 |
|------|------|------|------|
| 健康检查 | GET | `/api/health` | 检查服务状态 |
| 智能对话 | POST | `/api/langchain/chat` | 与 AI 对话 |
| 图片识别(URL) | POST | `/api/langchain/analyze-image-url` | 识别图片内容 |
| 图片识别(上传) | POST | `/api/langchain/analyze-image-upload` | 上传并识别图片 |
| OCR 文字提取 | POST | `/api/langchain/ocr` | 提取图片中的文字 |
| 对象检测 | POST | `/api/langchain/detect-objects` | 检测图片中的对象 |
| Agent 分析 | POST | `/api/langchain/analyze-with-agent` | 复杂任务分析 |

## 使用示例

详细的使用示例请查看：
- [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md) - 完整的 API 使用示例
- [README.md](README.md) - 项目详细文档

## 测试前端界面

我们提供了一个简单的 HTML 测试页面，复制以下内容保存为 `test.html` 并在浏览器中打开：

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>图片识别测试</title>
    <style>
        body { font-family: Arial; max-width: 600px; margin: 50px auto; padding: 20px; }
        input, button { margin: 10px 0; padding: 10px; width: 100%; }
        button { background: #4CAF50; color: white; border: none; cursor: pointer; }
        .result { background: #f9f9f9; padding: 15px; margin-top: 10px; }
    </style>
</head>
<body>
    <h1>🎨 图片识别测试</h1>
    <input type="text" id="msg" placeholder="输入消息" value="你好">
    <button onclick="test()">发送</button>
    <div id="result" class="result">结果将显示在这里...</div>
    
    <script>
        async function test() {
            const msg = document.getElementById('msg').value;
            const result = document.getElementById('result');
            result.textContent = '处理中...';
            
            try {
                const res = await fetch('http://localhost:3000/api/langchain/chat', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({message: msg})
                });
                const data = await res.json();
                result.textContent = data.data.message;
            } catch (e) {
                result.textContent = '错误: ' + e.message;
            }
        }
    </script>
</body>
</html>
```

## 常见问题

### Q: 安装依赖时出错？

```bash
# 清理缓存后重试
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Q: 端口 3000 被占用？

修改 `.env` 文件中的端口：
```env
PORT=8080
```

### Q: API 调用失败？

1. 确认服务已启动
2. 检查 API 密钥是否有效
3. 查看服务器日志获取错误详情

## 下一步

✅ 服务已启动？试试以下操作：

1. 📖 阅读 [完整文档](README.md)
2. 💻 查看 [使用示例](USAGE_EXAMPLES.md)
3. ⚙️ 了解 [环境配置](ENV_SETUP.md)
4. 🔧 开始开发您的功能

## 开发模式特性

- ✨ 热重载：代码修改后自动重启
- 📝 详细日志：查看请求和错误信息
- 🐛 调试模式：使用 `npm run start:debug`

## 生产部署

准备部署到生产环境？

```bash
# 构建项目
npm run build

# 启动生产服务
npm run start:prod
```

## 需要帮助？

- 📘 查看 [README.md](README.md)
- 📧 提交 GitHub Issue
- 💬 查看项目文档

---

**祝您使用愉快！** 🎉

如果遇到任何问题，请参考完整文档或联系技术支持。

