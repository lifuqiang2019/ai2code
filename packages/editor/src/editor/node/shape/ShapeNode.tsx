import type { ShapeDef } from "../../value";
import PathFill from "./PathFill";
import PathStroke from "./PathStroke";
import normalizeShape from "./normalizeShape";

interface ShapeNodeProps {
  node: ShapeDef;
}

const ShapeNode = ({ node }: ShapeNodeProps) => {
  const normalizedNode = normalizeShape(node);

  const pathsWithStroke = normalizedNode.paths.filter((path) => path.stroke);

  return (
    <>
      {normalizedNode.paths.map((path, index) => (
        <PathFill key={index} path={path} />
      ))}
      {pathsWithStroke.length > 0 && (
        <svg
          viewBox={`${normalizedNode.viewBox.minX} ${normalizedNode.viewBox.minY} ${normalizedNode.viewBox.width} ${normalizedNode.viewBox.height}`}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
          }}
        >
          {pathsWithStroke.map((path, index) => (
            <PathStroke key={index} path={path} />
          ))}
        </svg>
      )}
    </>
  );
};

export default ShapeNode;
