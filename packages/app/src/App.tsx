import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Box, Flex } from "@radix-ui/themes";
import { useState } from "react";

import { CanvasToolbar, EditorContextMenu, RightPanel, ToolPanel, type ToolId } from "@voyager/ui";
import { DesignEditor, type DesignValue, DesignView, type ShapePath, type ShapeViewBox } from "@voyager/editor";

const DEFAULT_EDITOR_VALUE: DesignValue = {
  elements: {},
  attributes: {
    width: 800,
    height: 600,
  },
};

function App() {
  const [currentToolId, setCurrentToolId] = useState<ToolId>(null);
  const [editor] = useState(
    () => new DesignEditor({ value: DEFAULT_EDITOR_VALUE }),
  );
  const [activeShape, setActiveShape] = useState<{
    label?: string;
    paths: ShapePath[];
    viewBox: ShapeViewBox;
  } | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as
      | {
          type?: string;
          shape?: {
            paths: ShapePath[];
            viewBox: ShapeViewBox;
            label?: string;
          };
        }
      | undefined;

    if (data?.type === "shape" && data.shape) {
      setActiveShape(data.shape);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    const data = event.active.data.current as
      | {
          type?: string;
          shape?: {
            paths: ShapePath[];
            viewBox: ShapeViewBox;
          };
        }
      | undefined;

    if (data?.type === "layer") {
      setActiveShape(null);
      if (!over || active.id === over.id) return;
      const orderedIds = Object.keys(editor.state.value.elements);
      const displayOrder = orderedIds.slice().reverse();
      const oldIndex = displayOrder.indexOf(active.id as string);
      const newIndex = displayOrder.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return;
      if (oldIndex === newIndex) return;
      const newDisplayOrder = arrayMove(displayOrder, oldIndex, newIndex);
      editor.reorderElements(newDisplayOrder.slice().reverse());
      return;
    }

    if (data?.type !== "shape" || !data.shape) {
      setActiveShape(null);
      return;
    }

    setActiveShape(null);

    if (!over || over.id !== "canvas-drop-area") return;

    // 获取画布的位置信息
    const canvasElement = document.querySelector(
      ".design-canvas",
    ) as HTMLElement;
    if (!canvasElement) return;

    const designViewElement = canvasElement.querySelector(
      "[tabindex='-1']",
    ) as HTMLElement;
    if (!designViewElement) return;

    const designViewRect = designViewElement.getBoundingClientRect();

    // 计算相对于画布的位置
    const relativeX = event.activatorEvent
      ? (event.activatorEvent as PointerEvent).clientX + delta.x - designViewRect.left
      : designViewRect.width / 2;
    const relativeY = event.activatorEvent
      ? (event.activatorEvent as PointerEvent).clientY + delta.y - designViewRect.top
      : designViewRect.height / 2;

    const width = 100;
    const height =
      width * (data.shape.viewBox.height / data.shape.viewBox.width);

    // 创建形状，位置为鼠标释放的位置
    editor.createShapeElement({
      ...data.shape,
      width,
      height,
      left: relativeX - width / 2,
      top: relativeY - height / 2,
    });
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Flex height="100vh" style={{ background: "var(--gray-2)" }}>
        <Box
          width="64px"
          style={{
            background: "var(--color-background)",
            borderRight: "1px solid var(--gray-5)",
          }}
        >
          <ToolPanel
            currentToolId={currentToolId}
            onCurrentToolIdChange={setCurrentToolId}
            editor={editor}
          />
        </Box>

        <Flex flexGrow="1" align="center" justify="center" position="relative">
          <Flex direction="column" align="center" gap="3">
            <CanvasToolbar editor={editor} />
            <Box
              className="design-canvas"
              style={{
                background: "var(--color-background)",
                boxShadow: "var(--shadow-4)",
                borderRadius: "var(--radius-2)",
              }}
            >
              <EditorContextMenu editor={editor}>
                <DesignView editor={editor} />
              </EditorContextMenu>
            </Box>
          </Flex>
        </Flex>

        <Box
          width="280px"
          style={{
            background: "var(--color-background)",
            borderLeft: "1px solid var(--gray-5)",
          }}
        >
          <RightPanel editor={editor} />
        </Box>
      </Flex>

      <DragOverlay>
        {activeShape ? (
          <Box
            style={{
              width: "80px",
              height: "80px",
              padding: "12px",
              background: "var(--color-background)",
              border: "2px solid var(--blue-9)",
              borderRadius: "var(--radius-2)",
              boxShadow: "var(--shadow-5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "grabbing",
            }}
          >
            <svg
              viewBox={`${activeShape.viewBox.minX} ${activeShape.viewBox.minY} ${activeShape.viewBox.width} ${activeShape.viewBox.height}`}
              style={{ width: "100%", height: "100%" }}
            >
              <path
                d={activeShape.paths[0]?.d}
                stroke="none"
                fill="var(--blue-9)"
              />
            </svg>
          </Box>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default App;
