# AI 图片识别功能使用指南

## 🎯 功能概述

本项目新增了 **AI 图片识别**功能，可以从图片中识别几何形状，并自动生成到画布上。

### 支持识别的形状
- ✅ Rectangle（矩形）
- ✅ Triangle（三角形）
- ✅ Circle（圆形）
- ✅ Ellipse（椭圆）
- ✅ Diamond（菱形）
- ✅ Pentagon（五边形）
- ✅ Hexagon（六边形）
- ✅ Star（五角星）
- ✅ Arrow（箭头）
- ✅ Heart（心形）

### 识别内容
- 📍 **形状类型**：识别上述 10 种几何形状
- 📐 **位置和大小**：准确识别形状在画布中的位置和尺寸
- 🎨 **颜色**：识别填充色（HEX 格式）
- 🖼️ **边框**：识别是否有描边、描边颜色和粗细（1-10）
- 🔄 **形变**：识别旋转、缩放等变换
- 📊 **层级关系**：根据遮挡关系判断层级
- 💧 **透明度**：识别形状的不透明度

---

## 🚀 快速开始

### 1. 启动后端服务

确保已配置 `.env` 文件：

```bash
# 进入后端目录
cd packages/ai-background

# 安装依赖（如果还没安装）
npm install

# 启动服务
npm run start:dev
```

**必需配置：** `.env` 文件中的 `GLM_API_KEY`

```env
GLM_API_KEY=your_glm_api_key_here
DEEPSEEK_API_KEY=your_deepseek_key  # 可选
DEEPSEEK_BASE_URL=https://api.deepseek.com  # 可选
```

### 2. 启动前端应用

```bash
# 进入前端目录
cd packages/app

# 安装依赖（如果还没安装）
npm install

# 启动开发服务器
npm run dev
```

---

## 📖 使用方法

### 方式一：文件上传

1. 点击画布工具栏的 **"AI 识别"** 按钮（蓝色星星图标 ✨）
2. 选择 **"本地上传"** 标签
3. 上传图片的方式：
   - 📁 **点击上传区域** 选择文件
   - 🖱️ **拖拽图片** 到上传区域
   - ⌨️ **按 Ctrl+V**（Mac: Cmd+V）粘贴剪贴板中的图片
4. 预览图片
5. 点击 **"开始识别"**
6. 等待 AI 分析（通常 2-5 秒）
7. 查看识别结果，可以删除不需要的形状
8. 点击 **"导入到画布"**

### 方式二：URL 导入

1. 点击画布工具栏的 **"AI 识别"** 按钮
2. 选择 **"URL 导入"** 标签
3. 输入图片 URL（如：`https://example.com/shapes.png`）
4. 点击 **"加载"**
5. 预览图片
6. 点击 **"开始识别"**
7. 等待 AI 分析
8. 点击 **"导入到画布"**

---

## 🎨 使用示例

### 示例 1：识别简单几何图形

**上传图片：** 包含圆形、矩形、三角形的图片

**AI 识别结果：**
```json
{
  "shapes": [
    {
      "shapeType": "Circle",
      "position": { "x": 25, "y": 30 },
      "size": { "width": 20, "height": 20 },
      "fill": {
        "color": "#FF5733",
        "hasStroke": true,
        "strokeColor": "#000000",
        "strokeWidth": 3
      },
      "zIndex": 1
    }
  ]
}
```

**画布效果：** 自动创建一个红色圆形，带黑色边框

### 示例 2：识别多层重叠形状

**上传图片：** 包含多个重叠的形状

**AI 识别：**
- 自动判断层级关系（根据遮挡）
- 底层形状先创建，顶层形状后创建
- 保持视觉上的正确层级

---

## ⚙️ 技术实现

### 后端架构

```
ai-background/
├── src/langchain/
│   ├── services/
│   │   └── shape-recognition.service.ts  ← 核心识别逻辑
│   ├── langchain.controller.ts           ← API 接口
│   └── langchain.module.ts               ← 模块注册
```

**API 接口：**

1. **POST** `/langchain/recognize-canvas-shapes`
   - 文件上传方式
   - FormData: `image`, `canvasWidth`, `canvasHeight`

2. **POST** `/langchain/recognize-canvas-shapes-url`
   - URL 方式
   - JSON: `{ imageUrl, canvasWidth, canvasHeight }`

### 前端架构

```
app/src/
├── components/
│   ├── ImageRecognitionDialog.tsx    ← 识别对话框
│   └── CanvasToolbar.tsx             ← 工具栏（集成入口）
├── services/
│   └── aiService.ts                  ← API 调用层
└── utils/
    ├── shapePaths.ts                 ← 形状 SVG 模板
    └── shapeConverter.ts             ← 数据转换工具
```

**数据流：**

```
用户上传图片
    ↓
前端调用 API
    ↓
后端 GLM-4V 识别
    ↓
返回结构化 JSON
    ↓
前端转换为 ShapeDef
    ↓
批量创建到画布
    ↓
用户可编辑
```

---

## 🛠️ 配置说明

### 环境变量

**后端：** `packages/ai-background/.env`

```env
# 必需 - 智谱 GLM-4V API Key（用于图片识别）
GLM_API_KEY=your_api_key_here

# 可选 - DeepSeek API（用于文本对话）
DEEPSEEK_API_KEY=your_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
```

### 获取 API Key

1. **智谱 GLM-4V**：访问 [https://open.bigmodel.cn/](https://open.bigmodel.cn/)
   - 注册账号
   - 创建 API Key
   - 每月有免费额度

---

## 📝 注意事项

### 识别效果相关

1. **图片质量**
   - ✅ 推荐：清晰的几何图形截图
   - ✅ 推荐：简单的形状组合
   - ⚠️ 避免：复杂的照片、模糊的图片

2. **形状限制**
   - 只识别 10 种预定义形状
   - 不识别文字、照片、复杂图案
   - 如果图片中无相关形状，会提示"未识别到相关形状"

3. **识别精度**
   - 位置和大小：较准确（误差 ±5%）
   - 颜色：较准确（会归类到最接近的颜色）
   - 层级关系：基于遮挡判断（简单场景准确）

### 性能相关

1. **图片大小**
   - 最大 10MB
   - 超过 2MB 会自动压缩
   - 建议上传适中大小的图片（500KB - 2MB）

2. **识别时间**
   - 通常 2-5 秒
   - 取决于图片复杂度和网络速度

3. **API 调用**
   - 每次识别消耗 1 次 API 调用
   - 注意 API 配额限制

---

## 🐛 常见问题

### Q1: 提示"未配置 GLM API Key"

**解决方案：**
1. 检查 `packages/ai-background/.env` 文件
2. 确保包含 `GLM_API_KEY=your_key`
3. 重启后端服务

### Q2: 识别失败或返回空结果

**可能原因：**
- 图片中没有支持的几何形状
- 图片质量太差
- API Key 无效或额度不足

**解决方案：**
1. 使用包含清晰几何形状的图片
2. 检查 API Key 是否有效
3. 查看后端控制台的详细错误日志

### Q3: 识别结果不准确

**解决方案：**
1. 使用更清晰的图片
2. 简化图片内容（减少形状数量）
3. 在导入前删除错误识别的形状
4. 导入后手动调整位置和样式

### Q4: 网络错误

**解决方案：**
1. 确保后端服务已启动（默认 `http://localhost:3000`）
2. 检查前端 API 配置：`packages/app/src/services/aiService.ts`
3. 确保网络可以访问智谱 API

---

## 🔧 开发调试

### 查看后端日志

```bash
cd packages/ai-background
npm run start:dev

# 日志会显示：
# - API 调用详情
# - AI 返回的原始内容
# - 错误信息
```

### 前端调试

1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签页
3. 查看 Network 标签页的 API 请求

### 测试 API

使用 Postman 或 curl 测试：

```bash
# 文件上传方式
curl -X POST http://localhost:3000/langchain/recognize-canvas-shapes \
  -F "image=@test.png" \
  -F "canvasWidth=800" \
  -F "canvasHeight=600"

# URL 方式
curl -X POST http://localhost:3000/langchain/recognize-canvas-shapes-url \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/test.png",
    "canvasWidth": 800,
    "canvasHeight": 600
  }'
```

---

## 🎉 功能特性总结

✅ **4 种上传方式**
- 点击选择文件
- 拖拽上传
- Ctrl+V 粘贴
- URL 输入

✅ **完整属性识别**
- 形状类型
- 位置和大小
- 填充颜色
- 边框样式
- 层级关系
- 透明度

✅ **智能交互**
- 实时预览
- 结果预览和编辑
- 错误提示
- 加载状态

✅ **性能优化**
- 自动图片压缩
- 批量创建（单次历史记录）
- 数据验证和错误处理

---

## 📚 相关文档

- [后端 API 文档](packages/ai-background/README.md)
- [前端开发文档](packages/app/README.md)
- [智谱 GLM-4V API 文档](https://open.bigmodel.cn/dev/api)

---

## 💡 使用技巧

1. **最佳实践**
   - 使用简单、清晰的几何图形
   - 避免过多重叠和复杂背景
   - 先测试简单场景，再尝试复杂场景

2. **提高准确性**
   - 使用高对比度的图片
   - 确保形状边界清晰
   - 避免手绘或不规则形状

3. **效率技巧**
   - 使用 Ctrl+V 快速粘贴截图
   - 批量识别多个形状，一次导入
   - 导入后使用编辑器的撤销/重做功能

---

**祝你使用愉快！** 🎨✨

如有问题，请查看控制台日志或联系开发团队。

