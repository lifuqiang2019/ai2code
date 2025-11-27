import { Box, Flex, IconButton, Popover } from "@radix-ui/themes";
import { Shapes } from "lucide-react";
import { useState } from "react";

import type { DesignEditor, ShapePath, ShapeViewBox } from "../editor";
import { ShapePanel } from "./ShapePanel";

export type ToolId = "shape" | null;

interface Tool {
  id: ToolId;
  icon: React.ElementType;
  label: string;
}

interface ToolPanelProps {
  currentToolId: ToolId;
  onCurrentToolIdChange: (id: ToolId) => void;
  editor: DesignEditor;
}

export const ToolPanel = ({
  currentToolId,
  onCurrentToolIdChange,
  editor,
}: ToolPanelProps) => {
  const [isShapePopoverOpen, setIsShapePopoverOpen] = useState(false);

  const tools: Tool[] = [{ id: "shape", icon: Shapes, label: "Shapes" }];

  const handleShapeSelect = (shapeDef: {
    paths: ShapePath[];
    viewBox: ShapeViewBox;
  }) => {
    const width = 100;
    const height = width * (shapeDef.viewBox.height / shapeDef.viewBox.width);
    editor.createShapeElement({
      ...shapeDef,
      width,
      height,
    });
    setIsShapePopoverOpen(false);
    onCurrentToolIdChange(null);
  };

  return (
    <Flex direction="column" p="2" gap="2">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = currentToolId === tool.id;

        if (tool.id === "shape") {
          return (
            <Popover.Root
              key={tool.id}
              open={isShapePopoverOpen}
              onOpenChange={setIsShapePopoverOpen}
            >
              <Popover.Trigger>
                <Box
                  style={{
                    width: "48px",
                    height: "48px",
                    padding: "2px",
                  }}
                >
                  <IconButton
                    size="2"
                    variant={isShapePopoverOpen ? "soft" : "surface"}
                    color={isShapePopoverOpen ? "blue" : "gray"}
                    highContrast={!isShapePopoverOpen}
                    style={{
                      width: "100%",
                      height: "100%",
                      flexDirection: "column",
                      gap: "4px",
                      padding: "8px",
                    }}
                  >
                    <Icon size={20} strokeWidth={1.5} />
                    <Box as="span" style={{ fontSize: "10px", lineHeight: 1 }}>
                      {tool.label}
                    </Box>
                  </IconButton>
                </Box>
              </Popover.Trigger>
              <Popover.Content side="right" sideOffset={8}>
                <ShapePanel
                  currentColor="#000000"
                  onSelect={handleShapeSelect}
                />
              </Popover.Content>
            </Popover.Root>
          );
        }

        return (
          <Box
            key={tool.id}
            style={{
              width: "48px",
              height: "48px",
              padding: "2px",
            }}
          >
            <IconButton
              size="2"
              variant={isActive ? "soft" : "surface"}
              color={isActive ? "blue" : "gray"}
              highContrast={!isActive}
              onClick={() => {
                if (tool.id === currentToolId) {
                  onCurrentToolIdChange(null);
                } else {
                  onCurrentToolIdChange(tool.id);
                }
              }}
              style={{
                width: "100%",
                height: "100%",
                flexDirection: "column",
                gap: "4px",
                padding: "8px",
              }}
            >
              <Icon size={20} strokeWidth={1.5} />
              <Box as="span" style={{ fontSize: "10px", lineHeight: 1 }}>
                {tool.label}
              </Box>
            </IconButton>
          </Box>
        );
      })}
    </Flex>
  );
};
