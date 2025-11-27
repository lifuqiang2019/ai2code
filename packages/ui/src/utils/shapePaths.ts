export interface ShapeViewBox {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

export interface ShapePathTemplate {
  viewBox: ShapeViewBox;
  path: string;
}

/**
 * 10 种形状的 SVG Path 模板
 */
export const SHAPE_PATH_TEMPLATES: Record<string, ShapePathTemplate> = {
  Rectangle: {
    viewBox: { minX: 0, minY: 0, width: 100, height: 100 },
    path: "M 0 0 L 100 0 L 100 100 L 0 100 Z",
  },

  Triangle: {
    viewBox: { minX: 0, minY: 0, width: 100, height: 100 },
    path: "M 50 0 L 100 100 L 0 100 Z",
  },

  Circle: {
    viewBox: { minX: 0, minY: 0, width: 100, height: 100 },
    path: "M 50 0 A 50 50 0 1 1 50 100 A 50 50 0 1 1 50 0 Z",
  },

  Ellipse: {
    viewBox: { minX: 0, minY: 0, width: 100, height: 100 },
    path: "M 50 0 A 50 50 0 1 1 50 100 A 50 50 0 1 1 50 0 Z",
  },

  Diamond: {
    viewBox: { minX: 0, minY: 0, width: 100, height: 100 },
    path: "M 50 0 L 100 50 L 50 100 L 0 50 Z",
  },

  Pentagon: {
    viewBox: { minX: 0, minY: 0, width: 100, height: 100 },
    path: "M 50 0 L 98 35 L 80 95 L 20 95 L 2 35 Z",
  },

  Hexagon: {
    viewBox: { minX: 0, minY: 0, width: 100, height: 100 },
    path: "M 50 0 L 93 25 L 93 75 L 50 100 L 7 75 L 7 25 Z",
  },

  Star: {
    viewBox: { minX: 0, minY: 0, width: 100, height: 100 },
    path: "M 50 0 L 61 35 L 98 35 L 68 57 L 79 91 L 50 70 L 21 91 L 32 57 L 2 35 L 39 35 Z",
  },

  Arrow: {
    viewBox: { minX: 0, minY: 0, width: 100, height: 100 },
    path: "M 0 30 L 60 30 L 60 0 L 100 50 L 60 100 L 60 70 L 0 70 Z",
  },

  Heart: {
    viewBox: { minX: 0, minY: 0, width: 100, height: 100 },
    path: "M 50 90 C 20 70 0 50 0 30 C 0 15 10 0 25 0 C 35 0 45 5 50 15 C 55 5 65 0 75 0 C 90 0 100 15 100 30 C 100 50 80 70 50 90 Z",
  },
};

/**
 * 获取形状模板
 */
export function getShapePathTemplate(shapeType: string): ShapePathTemplate {
  const template = SHAPE_PATH_TEMPLATES[shapeType];
  
  if (!template) {
    throw new Error(`未知的形状类型: ${shapeType}`);
  }
  
  return template;
}

