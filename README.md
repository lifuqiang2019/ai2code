# Adastralab AI Interview Project - Monorepo

Welcome to the Adastralab AI interview project! 🎉 This is a design editor application organized as a monorepo.

## Monorepo Structure

This project uses pnpm workspaces for monorepo management:

```
/
├── packages/
│   ├── editor/         - Core editor logic and state management
│   ├── ui/             - React UI components
│   ├── app/            - Main application
│   └── ai-background/  - AI backend service (NestJS)
├── pnpm-workspace.yaml
└── package.json
```

### Packages

- **@voyager/editor** - Core design editor functionality
  - State management with Zustand
  - Canvas logic and math utilities
  - Element manipulation and history

- **@voyager/ui** - UI Components
  - Toolbar components
  - Panels (Shape, Layer, Properties)
  - Context menus

- **@voyager/app** - Main Application
  - Entry point and app composition
  - Vite configuration
  - Development server

- **@voyager/ai-background** - AI Backend Service
  - NestJS framework
  - LangChain integration
  - DeepSeek API for text chat
  - GLM-4V API for image recognition
  - RESTful API endpoints

## Prerequisites

- Node.js >= 22.19.0
- pnpm >= 10.0.0

## Getting Started

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Run the app**
   ```bash
   pnpm dev
   ```
   This will start the development server for the main app. Open your browser and navigate to http://localhost:3000.

3. **Build all packages**
   ```bash
   pnpm build
   ```

## Development Commands

```bash
# Run frontend dev server (default)
pnpm dev
# or
pnpm dev:app

# Run backend service
pnpm dev:backend

# Run both frontend and backend simultaneously
pnpm dev:all

# Build all packages
pnpm build

# Run specific package script
pnpm --filter @voyager/app dev
pnpm --filter @voyager/ai-background dev
pnpm --filter @voyager/editor build

# Lint
pnpm lint

# Format
pnpm format
```

## Backend Service Setup

The AI backend service requires additional configuration:

### 1. Create environment file

Copy the example file and add your API keys:

```bash
cd packages/ai-background
cp .env.example .env
```

### 2. Configure API keys in `.env`

```env
# DeepSeek API 配置（用于文本对话）
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1

# 智谱 GLM-4V API 配置（用于图片识别）
GLM_API_KEY=your_glm_api_key_here

# 服务器配置
PORT=8080
```

### 3. Start the backend

```bash
pnpm dev:backend
```

The backend service will be available at `http://localhost:8080/api`

### Backend API Endpoints

- `GET /api/health` - Health check
- `POST /api/langchain/chat` - Text chat with DeepSeek
- `POST /api/langchain/analyze-image-url` - Analyze image from URL
- `POST /api/langchain/analyze-image-upload` - Analyze uploaded image
- `POST /api/langchain/ocr` - Extract text from image
- `POST /api/langchain/detect-objects` - Detect objects in image

For detailed API documentation, see `packages/ai-background/README.md`

## Features

### ✅ Task A1: Add Useful Shapes
- 10 shapes: Rectangle, Triangle, Circle, Ellipse, Diamond, Pentagon, Hexagon, Star, Arrow, Heart
- Click or drag to add shapes
- Drag preview effect

### ✅ Task A2: Undo/Redo
- Toolbar buttons
- Keyboard shortcuts (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z)
- Smart grouping (drag/resize as single operation)
- 50 states history limit

### ✅ Task A3: Settings Persistence
- Stroke and fill settings persistence
- Toggle on/off without losing configurations
- Cache mechanism for settings

### ✅ Bonus Task A4: Layers Panel
- Right panel displays all elements
- Drag to reorder layers
- Unique fixed names for each element
- Right-click menu for layer operations

### ✅ Bonus Task A5: Export/Import
- Export design as JSON
- Import saved designs
- Data validation
- Clear canvas functionality

## Interview Tasks

See [INTERVIEW_TASKS.md](./INTERVIEW_TASKS.md) for detailed task requirements.

Good luck with your interview! 🚀
