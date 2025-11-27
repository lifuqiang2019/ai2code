import { type DesignValue, type ElementDef } from "../value";
import Element from "./Element";

interface CanvasProps {
  value: DesignValue;
  onNodePointerDown: (node: ElementDef) => void;
}

const Canvas = ({ value, onNodePointerDown }: CanvasProps) => {
  // 按照 Object.keys 的顺序渲染，确保图层顺序正确
  // 在 SVG/HTML 中，后渲染的元素会显示在上层
  const elementIds = Object.keys(value.elements);
  
  return elementIds.map((id) => {
    const node = value.elements[id];
    if (!node) return null;
    
    return (
      <Element
        key={node.id}
        element={node}
        onPointerDown={() => onNodePointerDown(node)}
      />
    );
  });
};

export default Canvas;
