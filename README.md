# Adastralab AI Interview Project - Monorepo

Welcome to the Adastralab AI interview project! 🎉 This is a design editor application organized as a monorepo.

## Monorepo Structure

This project uses pnpm workspaces for monorepo management:

```
/
├── packages/
│   ├── editor/       - Core editor logic and state management
│   ├── ui/           - React UI components
│   └── app/          - Main application
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
# Run dev server
pnpm dev

# Build all packages
pnpm build

# Run specific package script
pnpm --filter @voyager/app dev
pnpm --filter @voyager/editor build

# Lint
pnpm lint

# Format
pnpm format
```

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
