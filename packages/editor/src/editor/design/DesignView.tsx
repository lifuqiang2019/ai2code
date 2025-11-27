import { useDroppable } from "@dnd-kit/core";
import { useRef, useState } from "react";
import { useStore } from "zustand";

import { compactMap } from "../../utils";
import { findPointHitTarget, isPointHitLayout } from "../math/hitTests";
import { mergeLayoutBounds } from "../math/multi";
import type { Bounds, Point } from "../math/types";
import { isBoundsHitNode } from "../node/node/hit";
import { type Selection, SelectionArea } from "../selection";
import useDragGesture from "../utils/useDragGesture";
import type { ElementDef, ID } from "../value";
import Canvas from "./Canvas";
import DesignEditor from "./DesignEditor";

export interface DesignViewProps {
  editor: DesignEditor;
}

const DesignView = ({ editor }: DesignViewProps) => {
  const { value, selection } = useStore(editor.stateStore);

  const { attributes } = value;

  const { setNodeRef, isOver } = useDroppable({
    id: "canvas-drop-area",
  });

  const { onDragStart, dragProps } = useDragGesture<ElementDef[]>({
    onMove: ({ deltaX, deltaY, snapshot }) => {
      const newElements = snapshot.map((element) => {
        return {
          ...element,
          bounds: {
            ...element.bounds,
            left: element.bounds.left + deltaX,
            top: element.bounds.top + deltaY,
          },
        };
      });
      // 拖动过程中不记录历史，避免每个像素都创建一个历史记录
      editor.replaceElements({
        elements: newElements,
        addToHistory: false,
      });
    },
    onEnd: () => {
      // 拖动结束时，将最终状态添加到历史记录
      editor.addCurrentStateToHistory();
    },
  });

  // When clicking on canvas and selected elements in multi-selection area, dragging conflicts with other operations,
  // so selection needs to be deferred to pointerup. If dragging occurs during this time, cancel the selection operation
  const deferredSelectedRef = useRef<Selection>(null);
  const pointerDownTargetNodeRef = useRef<ElementDef | null>(null);
  const dragSelectionStartPointRef = useRef<Point | null>(null);

  const [draggingBounds, setDraggingBounds] = useState<Bounds | null>(null);

  return (
    <div
      ref={setNodeRef}
      tabIndex={-1}
      style={{
        width: attributes.width,
        height: attributes.height,
        position: "relative",
        userSelect: "none",
        background: isOver ? "rgba(99, 102, 241, 0.05)" : "transparent",
        transition: "background 0.2s ease",
      }}
      onKeyDown={(e) => {
        const { key, metaKey, ctrlKey, shiftKey } = e;

        // 撤销/重做快捷键（优先处理，不需要选中元素）
        if ((metaKey || ctrlKey) && key === "z") {
          e.preventDefault();
          if (shiftKey) {
            editor.redo();
          } else {
            editor.undo();
          }
          return;
        }

        // Cmd/Ctrl + Y 也可以重做（Windows 习惯）
        if ((metaKey || ctrlKey) && key === "y") {
          e.preventDefault();
          editor.redo();
          return;
        }

        // 其他需要选中元素的快捷键
        switch (key) {
          case "Escape": {
            editor.setSelection(null);
            break;
          }
          case "Delete":
          case "Backspace": {
            if (selection) {
              editor.deleteElements(selection?.ids ?? []);
              editor.setSelection(null);
            }
            break;
          }
          case "a": {
            if (metaKey || ctrlKey) {
              e.preventDefault();
              editor.setSelection({
                ids: Object.keys(value.elements),
              });
            }
            break;
          }
          default:
            break;
        }
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          overflow: "clip",
        }}
        {...dragProps}
        onPointerDown={(e) => {
          if (e.button !== 0) return;

          const relativeRect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - relativeRect.left;
          const y = e.clientY - relativeRect.top;

          const selectedIds = selection?.ids ?? [];

          const selectedNodes = compactMap(
            selectedIds,
            (id) => value.elements[id],
          );

          const targetNode = pointerDownTargetNodeRef.current;
          pointerDownTargetNodeRef.current = null;

          if (targetNode) {
            let newSelected: ID[];

            if (e.shiftKey) {
              newSelected = selectedIds.includes(targetNode.id)
                ? selectedIds.filter((id) => id !== targetNode.id)
                : [...selectedIds, targetNode.id];
            } else {
              newSelected = [targetNode.id];
            }

            // 1. Clicking on selected elements needs to be deferred to pointerup, otherwise it conflicts with dragging
            // 2. Because selectedNodes might be occluded, we need to use hitTest for this check
            const shouldDeferSelecting = !!findPointHitTarget({
              search: selectedNodes,
              point: { x, y },
            });

            const newSelection: Selection = {
              ids: newSelected,
            };

            if (shouldDeferSelecting) {
              deferredSelectedRef.current = newSelection;
            } else {
              editor.setSelection(newSelection);
            }

            onDragStart(
              e,
              compactMap(
                shouldDeferSelecting ? selectedIds : newSelected,
                (id) => value.elements[id],
              ),
            );
            return;
          }

          const selectionBounds = mergeLayoutBounds(selectedNodes);

          if (
            isPointHitLayout({
              target: { bounds: selectionBounds },
              point: { x, y },
            })
          ) {
            deferredSelectedRef.current = null;

            onDragStart(
              e,
              compactMap(selectedIds, (id) => value.elements[id]),
            );
          } else {
            editor.setSelection(null);
            dragSelectionStartPointRef.current = { x, y };
          }
        }}
        onPointerMove={(e) => {
          if (dragSelectionStartPointRef.current) {
            const { currentTarget, pointerId } = e;

            currentTarget.setPointerCapture(pointerId);
            const { x: startX, y: startY } = dragSelectionStartPointRef.current;
            const relativeRect = currentTarget.getBoundingClientRect();
            const currentX = e.clientX - relativeRect.left;
            const currentY = e.clientY - relativeRect.top;
            const bounds = {
              left: Math.min(startX, currentX),
              top: Math.min(startY, currentY),
              width: Math.abs(currentX - startX),
              height: Math.abs(currentY - startY),
            };

            const selectedNodes = Object.values(value.elements).filter((node) =>
              isBoundsHitNode({
                element: node,
                bounds,
              }),
            );

            setDraggingBounds(bounds);
            editor.setSelection(
              selectedNodes.length
                ? {
                    ids: selectedNodes.map((node) => node.id),
                  }
                : null,
            );
          }

          deferredSelectedRef.current = null;
          dragProps.onPointerMove(e);
        }}
        onPointerUp={(e) => {
          if (dragSelectionStartPointRef.current) {
            dragSelectionStartPointRef.current = null;
            setDraggingBounds(null);
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
          if (deferredSelectedRef.current) {
            const newSelected = deferredSelectedRef.current;
            deferredSelectedRef.current = null;
            editor.setSelection(newSelected);
          }
        }}
        onLostPointerCapture={(e) => {
          if (dragSelectionStartPointRef.current) {
            setDraggingBounds(null);
            dragSelectionStartPointRef.current = null;
          }
          dragProps.onLostPointerCapture(e);
        }}
      >
        <Canvas
          value={value}
          onNodePointerDown={(node) => {
            pointerDownTargetNodeRef.current = node;
          }}
        />
      </div>
      {selection && (
        <SelectionArea
          selection={selection}
          onSelectionChange={(newSelection) =>
            editor.setSelection(newSelection)
          }
          value={value}
          onElementsChange={(elements) =>
            editor.replaceElements({ elements, addToHistory: false })
          }
          onResizeEnd={() => {
            // 调整大小结束时，将最终状态添加到历史记录
            editor.addCurrentStateToHistory();
          }}
          isEditable={!draggingBounds}
        />
      )}
      {draggingBounds && (
        <div
          style={{
            position: "absolute",
            transform: `translate(${draggingBounds.left}px, ${draggingBounds.top}px)`,
            left: 0,
            top: 0,
            width: draggingBounds.width,
            height: draggingBounds.height,
            border: "1px dashed blue",
            pointerEvents: "none",
            background: "rgba(0, 0, 255, 0.1)",
          }}
        />
      )}
    </div>
  );
};

export default DesignView;
