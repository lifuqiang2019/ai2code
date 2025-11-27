import { type ResizeDirection } from "./resizeBounds";
import type { Bounds, Layout, Point } from "./types";

export const mergeLayoutBounds = (layouts: Layout[]): Bounds => {
  if (layouts.length === 0) {
    return { left: 0, top: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const { bounds } of layouts) {
    const { left, top, width, height } = bounds;
    const right = left + width;
    const bottom = top + height;

    minX = Math.min(minX, left);
    maxX = Math.max(maxX, right);
    minY = Math.min(minY, top);
    maxY = Math.max(maxY, bottom);
  }

  return {
    left: minX,
    top: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

export const resizeLayouts = ({
  direction,
  anchorLayout,
  layouts,
  scale,
}: {
  direction: ResizeDirection;
  anchorLayout: Layout;
  layouts: Layout[];
  scale: { x: number; y: number };
}): Bounds[] => {
  if (layouts.length === 0) return [];

  const anchor = getAlignAnchor(anchorLayout.bounds, direction);
  const { x: scaleX, y: scaleY } = scale;

  return layouts.map((layout) => {
    const { bounds } = layout;
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;

    const scaledCenterX = anchor.x + (centerX - anchor.x) * scaleX;
    const scaledCenterY = anchor.y + (centerY - anchor.y) * scaleY;

    let newWidth = bounds.width;
    let newHeight = bounds.height;

    if (direction === "left" || direction === "right") {
      newWidth = bounds.width * scaleX;
    } else if (direction === "top" || direction === "bottom") {
      newHeight = bounds.height * scaleY;
    } else {
      // Corner resize
      newWidth = bounds.width * scaleX;
      newHeight = bounds.height * scaleY;
    }

    return {
      left: scaledCenterX - newWidth / 2,
      top: scaledCenterY - newHeight / 2,
      width: newWidth,
      height: newHeight,
    };
  });
};

function getAlignAnchor(bounds: Bounds, direction: ResizeDirection): Point {
  const { left, top, width, height } = bounds;
  switch (direction) {
    case "top-left":
      return { x: left + width, y: top + height };
    case "top-right":
      return { x: left, y: top + height };
    case "bottom-left":
      return { x: left + width, y: top };
    case "bottom-right":
      return { x: left, y: top };

    case "top":
      return {
        x: left + width / 2,
        y: top + height,
      };
    case "bottom":
      return { x: left + width / 2, y: top };
    case "left":
      return {
        x: left + width,
        y: top + height / 2,
      };
    case "right":
      return { x: left, y: top + height / 2 };
  }
}

/**
 * When resizing with scale, the overall bounds of related nodes may shift after calculation.
 * Here we adjust the node positions to align the opposite side to its original position, making the interaction more intuitive
 * (e.g., when adjusting the right edge, the left edge position should remain unchanged)
 */
export const getElementOffset = ({
  direction,
  anchorLayout,
  nodesLayouts,
}: {
  direction: ResizeDirection;
  anchorLayout: Layout;
  nodesLayouts: Layout[];
}): Point => {
  const newOuterBounds = mergeLayoutBounds(nodesLayouts);

  const targetPoint = getAlignAnchor(anchorLayout.bounds, direction);
  const currentPoint = getAlignAnchor(newOuterBounds, direction);

  return {
    x: targetPoint.x - currentPoint.x,
    y: targetPoint.y - currentPoint.y,
  };
};
