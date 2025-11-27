import {
  getElementOffset,
  mergeLayoutBounds,
  resizeLayouts,
} from "../math/multi";
import { type ResizeDirection, resizeBounds } from "../math/resizeBounds";
import type { ElementDef } from "../value";
import ResizeHandler from "./ResizeHandler";

const RESIZE_DIRECTIONS: ResizeDirection[] = [
  "left",
  "right",
  "top",
  "bottom",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

interface SelectionResizeProps {
  elements: ElementDef[];
  onElementsChange: (elements: ElementDef[]) => void;
  onResizeEnd?: () => void;
}

const SelectionResize = ({
  elements,
  onElementsChange,
  onResizeEnd,
}: SelectionResizeProps) => {
  return (
    <>
      {RESIZE_DIRECTIONS.map((direction) => {
        return (
          <ResizeHandler
            key={direction}
            direction={direction}
            onStart={() => {
              return {
                layout: {
                  bounds: mergeLayoutBounds(elements),
                  rotation: 0,
                },
                // Collect node data related to this resize operation
                // During resize, we need to adjust child node bounds indirectly by adjusting group bounds
                // So both group and corresponding child node information will be used
                elements,
              };
            }}
            onMove={({ deltaX, deltaY, snapshot }) => {
              const { layout: snapshotLayout, elements: snapshotElements } =
                snapshot;

              // 1. Calculate new bounding box based on snapshot layout information
              const resizedOuterBounds = resizeBounds({
                layout: snapshotLayout,
                direction,
                deltaX,
                deltaY,
                isRatioLocked: false,
              });

              // 2. Based on the new bounding box and layout information of each node in snapshotNodes, calculate new bounds for each node
              const resizedNodesBounds = resizeLayouts({
                direction,
                anchorLayout: snapshotLayout,
                layouts: snapshotElements,
                scale: {
                  x: resizedOuterBounds.width / snapshotLayout.bounds.width,
                  y: resizedOuterBounds.height / snapshotLayout.bounds.height,
                },
              });

              // 3. Some elements need layout recalculation after resize, for example text nodes need to recalculate height based on new width
              let newNodes: ElementDef[] = snapshotElements.map(
                (node, index) => ({
                  ...node,
                  bounds: resizedNodesBounds[index],
                }),
              );

              // 4. After resize, the overall layout may have slight offset, apply alignment adjustment here
              const elementOffset = getElementOffset({
                anchorLayout: {
                  bounds: resizedOuterBounds,
                },
                direction,
                nodesLayouts: newNodes,
              });
              newNodes = newNodes.map((node) => ({
                ...node,
                bounds: {
                  left: node.bounds.left + elementOffset.x,
                  top: node.bounds.top + elementOffset.y,
                  width: node.bounds.width,
                  height: node.bounds.height,
                },
              }));

              onElementsChange(newNodes);
            }}
            onEnd={onResizeEnd}
          />
        );
      })}
    </>
  );
};

export default SelectionResize;
