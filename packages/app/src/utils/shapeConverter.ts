import type { ShapeDef } from "../editor";
import { createNodeId } from "../editor/node/node/createNodeId";
import type { ShapeRecognitionResult } from "../services/aiService";
import { getShapePathTemplate } from "./shapePaths";

/**
 * 将 AI 识别结果转换为 ShapeDef
 */
export function convertRecognizedShapeToShapeDef(
  aiShape: ShapeRecognitionResult,
  canvasSize: { width: number; height: number },
): ShapeDef {
  // 1. 获取该形状的 SVG Path 模板
  const pathTemplate = getShapePathTemplate(aiShape.shapeType);

  // 2. 计算实际像素坐标（从百分比转换）
  const actualX = (aiShape.position.x / 100) * canvasSize.width;
  const actualY = (aiShape.position.y / 100) * canvasSize.height;
  const actualWidth = (aiShape.size.width / 100) * canvasSize.width;
  const actualHeight = (aiShape.size.height / 100) * canvasSize.height;

  // 3. 应用形变（缩放）
  const transformedWidth = actualWidth * aiShape.transform.scaleX;
  const transformedHeight = actualHeight * aiShape.transform.scaleY;

  // 4. 计算左上角位置（position 是中心点）
  const left = actualX - transformedWidth / 2;
  const top = actualY - transformedHeight / 2;

  // 5. 构建 ShapeDef
  const shapeDef: ShapeDef = {
    type: "shape",
    id: createNodeId(),
    name: `AI-${aiShape.shapeType}`,
    bounds: {
      left,
      top,
      width: transformedWidth,
      height: transformedHeight,
    },
    viewBox: pathTemplate.viewBox,
    paths: [
      {
        d: pathTemplate.path,
        fill: { color: aiShape.fill.color },
        stroke: aiShape.fill.hasStroke
          ? {
              color: aiShape.fill.strokeColor!,
              weight: aiShape.fill.strokeWidth!,
            }
          : undefined,
      },
    ],
    transparency: 1 - aiShape.opacity,
  };

  return shapeDef;
}

/**
 * 批量转换形状
 */
export function convertRecognizedShapes(
  shapes: ShapeRecognitionResult[],
  canvasSize: { width: number; height: number },
): ShapeDef[] {
  // 按 zIndex 排序（从小到大，底层先创建）
  const sortedShapes = [...shapes].sort((a, b) => a.zIndex - b.zIndex);

  // 转换为 ShapeDef
  return sortedShapes.map((shape) =>
    convertRecognizedShapeToShapeDef(shape, canvasSize)
  );
}

/**
 * 压缩图片（如果太大）
 */
export async function optimizeImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    // 如果文件小于 2MB，直接返回
    if (file.size < 2 * 1024 * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;

      img.onload = () => {
        const maxSize = 2048;
        let { width, height } = img;

        // 如果图片太大，等比缩放
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }

        // 创建 canvas 进行压缩
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // 转换为 Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(optimizedFile);
            } else {
              resolve(file); // 压缩失败，返回原文件
            }
          },
          "image/jpeg",
          0.85
        );
      };

      img.onerror = () => {
        resolve(file);
      };
    };

    reader.onerror = () => {
      resolve(file);
    };

    reader.readAsDataURL(file);
  });
}

