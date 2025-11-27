# 使用示例

## 快速开始

### 1. 安装依赖并启动服务

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run start:dev
```

服务将在 `http://localhost:3000` 启动。

## API 使用示例

### 基础健康检查

```bash
curl http://localhost:3000/api/health
```

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "message": "LangChain + NestJS + DeepSeek 服务运行正常"
}
```

### 1. 智能对话

```bash
curl -X POST http://localhost:3000/api/langchain/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "你好，请用一句话介绍 DeepSeek"
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "message": "DeepSeek 是一个强大的人工智能大语言模型..."
  }
}
```

### 2. 图片识别（使用 URL）

```bash
curl -X POST http://localhost:3000/api/langchain/analyze-image-url \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/cat.jpg",
    "question": "这张图片里有什么动物？"
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "analysis": "这张图片中有一只可爱的橘猫，它正坐在窗台上..."
  }
}
```

### 3. 图片识别（上传文件）

```bash
curl -X POST http://localhost:3000/api/langchain/analyze-image-upload \
  -F "image=@/path/to/your/image.jpg" \
  -F "question=请描述这张图片的内容"
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "filename": "abc123def456.jpg",
    "analysis": "这是一张城市风景照，可以看到高楼大厦和繁忙的街道..."
  }
}
```

### 4. OCR 文字提取

```bash
curl -X POST http://localhost:3000/api/langchain/ocr \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/document.jpg"
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "text": "识别到的文字内容：\n这是一份重要文件\n日期：2024年1月15日\n..."
  }
}
```

### 5. 对象检测

```bash
curl -X POST http://localhost:3000/api/langchain/detect-objects \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/room.jpg"
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "objects": "检测到的对象：\n1. 桌子\n2. 椅子\n3. 台灯\n4. 书籍\n5. 笔记本电脑\n..."
  }
}
```

### 6. 使用 Agent 进行复杂分析

```bash
curl -X POST http://localhost:3000/api/langchain/analyze-with-agent \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/artwork.jpg",
    "task": "分析这幅画作的艺术风格、色彩运用和情感表达"
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "result": "这是一幅印象派风格的作品...\n\n色彩运用：...\n\n情感表达：..."
  }
}
```

## JavaScript/TypeScript 客户端示例

### 安装 Axios（推荐）

```bash
npm install axios
```

### 完整示例代码

```typescript
import axios from 'axios';
import * as fs from 'fs';
import FormData from 'form-data';

const API_BASE_URL = 'http://localhost:3000/api';

// 1. 聊天示例
async function chatExample() {
  try {
    const response = await axios.post(`${API_BASE_URL}/langchain/chat`, {
      message: '你好，请介绍一下 LangChain',
    });
    console.log('聊天响应:', response.data.data.message);
  } catch (error) {
    console.error('聊天失败:', error.message);
  }
}

// 2. 图片识别（URL）示例
async function analyzeImageUrl() {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/langchain/analyze-image-url`,
      {
        imageUrl: 'https://example.com/image.jpg',
        question: '请详细描述这张图片',
      }
    );
    console.log('图片分析结果:', response.data.data.analysis);
  } catch (error) {
    console.error('图片分析失败:', error.message);
  }
}

// 3. 图片上传识别示例
async function uploadAndAnalyzeImage(imagePath: string) {
  try {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));
    formData.append('question', '这张图片里有什么？');

    const response = await axios.post(
      `${API_BASE_URL}/langchain/analyze-image-upload`,
      formData,
      {
        headers: formData.getHeaders(),
      }
    );
    
    console.log('上传的文件名:', response.data.data.filename);
    console.log('分析结果:', response.data.data.analysis);
  } catch (error) {
    console.error('上传失败:', error.message);
  }
}

// 4. OCR 文字提取示例
async function extractTextExample() {
  try {
    const response = await axios.post(`${API_BASE_URL}/langchain/ocr`, {
      imageUrl: 'https://example.com/document.jpg',
    });
    console.log('提取的文字:', response.data.data.text);
  } catch (error) {
    console.error('文字提取失败:', error.message);
  }
}

// 5. 对象检测示例
async function detectObjectsExample() {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/langchain/detect-objects`,
      {
        imageUrl: 'https://example.com/scene.jpg',
      }
    );
    console.log('检测到的对象:', response.data.data.objects);
  } catch (error) {
    console.error('对象检测失败:', error.message);
  }
}

// 运行所有示例
async function runAllExamples() {
  console.log('=== 开始测试 ===\n');
  
  await chatExample();
  console.log('\n---\n');
  
  await analyzeImageUrl();
  console.log('\n---\n');
  
  // 替换为实际的图片路径
  // await uploadAndAnalyzeImage('./test-image.jpg');
  // console.log('\n---\n');
  
  await extractTextExample();
  console.log('\n---\n');
  
  await detectObjectsExample();
  
  console.log('\n=== 测试完成 ===');
}

// 执行示例
runAllExamples();
```

## Python 客户端示例

```python
import requests
import json

API_BASE_URL = 'http://localhost:3000/api'

# 1. 聊天示例
def chat_example():
    response = requests.post(
        f'{API_BASE_URL}/langchain/chat',
        json={'message': '你好，请介绍一下 DeepSeek'}
    )
    data = response.json()
    print('聊天响应:', data['data']['message'])

# 2. 图片识别（URL）示例
def analyze_image_url():
    response = requests.post(
        f'{API_BASE_URL}/langchain/analyze-image-url',
        json={
            'imageUrl': 'https://example.com/image.jpg',
            'question': '请描述这张图片'
        }
    )
    data = response.json()
    print('图片分析结果:', data['data']['analysis'])

# 3. 图片上传识别示例
def upload_and_analyze_image(image_path):
    with open(image_path, 'rb') as f:
        files = {'image': f}
        data = {'question': '这张图片里有什么？'}
        response = requests.post(
            f'{API_BASE_URL}/langchain/analyze-image-upload',
            files=files,
            data=data
        )
    result = response.json()
    print('上传的文件名:', result['data']['filename'])
    print('分析结果:', result['data']['analysis'])

# 4. OCR 文字提取示例
def extract_text_example():
    response = requests.post(
        f'{API_BASE_URL}/langchain/ocr',
        json={'imageUrl': 'https://example.com/document.jpg'}
    )
    data = response.json()
    print('提取的文字:', data['data']['text'])

# 5. 对象检测示例
def detect_objects_example():
    response = requests.post(
        f'{API_BASE_URL}/langchain/detect-objects',
        json={'imageUrl': 'https://example.com/scene.jpg'}
    )
    data = response.json()
    print('检测到的对象:', data['data']['objects'])

# 运行所有示例
if __name__ == '__main__':
    print('=== 开始测试 ===\n')
    
    chat_example()
    print('\n---\n')
    
    analyze_image_url()
    print('\n---\n')
    
    # 替换为实际的图片路径
    # upload_and_analyze_image('./test-image.jpg')
    # print('\n---\n')
    
    extract_text_example()
    print('\n---\n')
    
    detect_objects_example()
    
    print('\n=== 测试完成 ===')
```

## 前端 HTML + JavaScript 示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>图片识别服务测试</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
        }
        .section {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        input, textarea, button {
            margin: 10px 0;
            padding: 10px;
            width: 100%;
            box-sizing: border-box;
        }
        button {
            background-color: #4CAF50;
            color: white;
            border: none;
            cursor: pointer;
        }
        button:hover {
            background-color: #45a049;
        }
        .result {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            margin-top: 10px;
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    <h1>LangChain + DeepSeek 图片识别服务</h1>

    <!-- 聊天功能 -->
    <div class="section">
        <h2>1. 智能对话</h2>
        <input type="text" id="chatMessage" placeholder="输入您的消息">
        <button onclick="sendChat()">发送</button>
        <div id="chatResult" class="result"></div>
    </div>

    <!-- 图片 URL 识别 -->
    <div class="section">
        <h2>2. 图片识别（URL）</h2>
        <input type="text" id="imageUrl" placeholder="输入图片 URL">
        <input type="text" id="imageQuestion" placeholder="对图片的提问（可选）">
        <button onclick="analyzeImageUrl()">分析图片</button>
        <div id="urlResult" class="result"></div>
    </div>

    <!-- 图片上传识别 -->
    <div class="section">
        <h2>3. 图片上传识别</h2>
        <input type="file" id="imageFile" accept="image/*">
        <input type="text" id="uploadQuestion" placeholder="对图片的提问（可选）">
        <button onclick="uploadAndAnalyze()">上传并分析</button>
        <div id="uploadResult" class="result"></div>
    </div>

    <script>
        const API_BASE_URL = 'http://localhost:3000/api';

        // 聊天功能
        async function sendChat() {
            const message = document.getElementById('chatMessage').value;
            const resultDiv = document.getElementById('chatResult');
            
            resultDiv.textContent = '处理中...';
            
            try {
                const response = await fetch(`${API_BASE_URL}/langchain/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message }),
                });
                
                const data = await response.json();
                resultDiv.textContent = data.data.message;
            } catch (error) {
                resultDiv.textContent = `错误: ${error.message}`;
            }
        }

        // 图片 URL 识别
        async function analyzeImageUrl() {
            const imageUrl = document.getElementById('imageUrl').value;
            const question = document.getElementById('imageQuestion').value;
            const resultDiv = document.getElementById('urlResult');
            
            resultDiv.textContent = '分析中...';
            
            try {
                const response = await fetch(`${API_BASE_URL}/langchain/analyze-image-url`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ imageUrl, question }),
                });
                
                const data = await response.json();
                resultDiv.textContent = data.data.analysis;
            } catch (error) {
                resultDiv.textContent = `错误: ${error.message}`;
            }
        }

        // 图片上传识别
        async function uploadAndAnalyze() {
            const fileInput = document.getElementById('imageFile');
            const question = document.getElementById('uploadQuestion').value;
            const resultDiv = document.getElementById('uploadResult');
            
            if (!fileInput.files[0]) {
                resultDiv.textContent = '请先选择图片文件';
                return;
            }
            
            resultDiv.textContent = '上传并分析中...';
            
            const formData = new FormData();
            formData.append('image', fileInput.files[0]);
            if (question) {
                formData.append('question', question);
            }
            
            try {
                const response = await fetch(`${API_BASE_URL}/langchain/analyze-image-upload`, {
                    method: 'POST',
                    body: formData,
                });
                
                const data = await response.json();
                resultDiv.textContent = `文件名: ${data.data.filename}\n\n分析结果:\n${data.data.analysis}`;
            } catch (error) {
                resultDiv.textContent = `错误: ${error.message}`;
            }
        }
    </script>
</body>
</html>
```

## 常见问题

### Q: 为什么图片识别失败？
A: 请检查：
1. DeepSeek API 密钥是否正确
2. 图片 URL 是否可访问
3. 图片格式是否支持（JPEG, PNG, GIF, WebP, BMP）
4. 图片大小是否超过 10MB

### Q: 如何提高识别准确度？
A: 
1. 使用高质量的图片
2. 提供具体明确的问题
3. 确保图片内容清晰可见

### Q: 支持批量处理吗？
A: 当前版本支持单张图片处理。如需批量处理，可以循环调用 API。

## 进一步开发

可以基于此项目扩展以下功能：

1. **批量图片处理**: 添加批量上传和处理功能
2. **异步任务队列**: 使用 Bull 或 RabbitMQ 处理长时间任务
3. **结果缓存**: 使用 Redis 缓存常见查询结果
4. **用户认证**: 添加 JWT 认证保护 API
5. **前端界面**: 开发完整的 Web 界面
6. **更多 AI 工具**: 集成更多 LangChain 工具和 Agent

## 技术支持

如有问题，请查看：
- [NestJS 文档](https://docs.nestjs.com/)
- [LangChain 文档](https://js.langchain.com/)
- [DeepSeek API 文档](https://platform.deepseek.com/api-docs/)

