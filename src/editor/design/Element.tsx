import { type PointerEvent, type ReactElement } from "react";

import ShapeNode from "../node/shape/ShapeNode";
import type { ElementDef } from "../value";

interface ElementProps {
  element: ElementDef;
  onPointerDown: (e: PointerEvent) => void;
}

const Element = ({ element, onPointerDown }: ElementProps) => {
  let content: ReactElement | null = null;
  if (element.type === "shape") {
    content = <ShapeNode node={element} />;
  }

  if (!content) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        translate: `${element.bounds.left}px ${element.bounds.top}px`,
        width: element.bounds.width,
        height: element.bounds.height,
        opacity: 1 - (element.transparency ?? 0),
        pointerEvents: "auto",
        userSelect: "none",
      }}
      onPointerDown={onPointerDown}
    >
      {content}
    </div>
  );
};

export default Element;
