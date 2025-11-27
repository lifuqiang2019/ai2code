import { Box, Flex, Heading, Slider, Switch, Text } from "@radix-ui/themes";
import type { ReactNode } from "react";
import { useStore } from "zustand";

import type { DesignEditor, ShapeFill } from "../editor";
import { LayerPanel } from "./LayerPanel";
import { RightPanelSection } from "./RightPanelSection";

interface RightPanelProps {
  editor: DesignEditor;
}

interface ControlRowProps {
  label: string;
  children: ReactNode;
}

const ControlRow = ({ label, children }: ControlRowProps) => (
  <Box
    style={{
      display: "grid",
      gridTemplateColumns: "60px 1fr",
      gap: "12px",
      alignItems: "center",
      marginBottom: "8px",
    }}
  >
    <Text size="2" color="gray">
      {label}
    </Text>
    <Box>{children}</Box>
  </Box>
);

export const RightPanel = ({ editor }: RightPanelProps) => {
  const { value, selection } = useStore(editor.stateStore);

  const selectedNode =
    selection?.ids.length === 1 && selection.ids[0]
      ? value.elements[selection.ids[0]]
      : null;

  const path = selectedNode?.type === "shape" ? selectedNode.paths[0] : null;
  const hasStroke = !!path?.stroke;
  const hasFill = !!path?.fill;
  const strokeColor = path?.stroke?.color || "#000000";
  const strokeWeight = path?.stroke?.weight || 2;
  const fillColor = path?.fill?.color || "#000000";

  const updateShapeProperties = (updates: {
    stroke?: { color?: string; weight?: number } | null;
    fill?: ShapeFill | null;
    strokeEnabled?: boolean;
    fillEnabled?: boolean;
  }) => {
    if (!selectedNode || selectedNode.type !== "shape") return;
    editor.updateShapePaths({
      ids: [selectedNode.id],
      attributes: updates,
    });
  };

  const shapeProperties =
    !selectedNode || selectedNode.type !== "shape" ? (
      <Text size="2" color="gray">
        请选择一个图形以编辑属性。
      </Text>
    ) : (
      <Flex direction="column" gap="3" mt="3">
        <RightPanelSection title="Fill">
          <ControlRow label="Enabled">
            <Switch
              checked={hasFill}
              onCheckedChange={(isChecked) => {
                updateShapeProperties({
                  fillEnabled: isChecked,
                });
              }}
            />
          </ControlRow>
          {hasFill && (
            <ControlRow label="Color">
              <input
                type="color"
                value={fillColor}
                onChange={(e) => {
                  updateShapeProperties({
                    fill: { color: e.target.value },
                  });
                }}
                style={{
                  width: "100%",
                  height: 28,
                  border: "1px solid var(--gray-6)",
                  borderRadius: "var(--radius-2)",
                  cursor: "pointer",
                }}
              />
            </ControlRow>
          )}
        </RightPanelSection>

        <RightPanelSection title="Stroke">
          <ControlRow label="Enabled">
            <Switch
              checked={hasStroke}
              onCheckedChange={(isChecked) => {
                updateShapeProperties({
                  strokeEnabled: isChecked,
                });
              }}
            />
          </ControlRow>
          {hasStroke && (
            <>
              <ControlRow label="Color">
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => {
                    updateShapeProperties({
                      stroke: { color: e.target.value, weight: strokeWeight },
                    });
                  }}
                  style={{
                    width: "100%",
                    height: 28,
                    border: "1px solid var(--gray-6)",
                    borderRadius: "var(--radius-2)",
                    cursor: "pointer",
                  }}
                />
              </ControlRow>
              <ControlRow label="Weight">
                <Flex align="center" gap="2">
                  <Box style={{ flex: 1 }}>
                    <Slider
                      min={1}
                      max={20}
                      value={[strokeWeight]}
                      onValueChange={(value) => {
                        updateShapeProperties({
                          stroke: {
                            color: strokeColor,
                            weight: value[0] ?? strokeWeight,
                          },
                        });
                      }}
                    />
                  </Box>
                </Flex>
              </ControlRow>
            </>
          )}
        </RightPanelSection>

        <RightPanelSection title="Transparency">
          <ControlRow label="Value">
            <Flex align="center" gap="2">
              <Box style={{ flex: 1 }}>
                <Slider
                  min={0}
                  max={100}
                  value={[
                    selectedNode?.transparency
                      ? selectedNode.transparency * 100
                      : 0,
                  ]}
                  onValueChange={(value) => {
                    if (!selectedNode) return;
                    editor.updateElementAttributes({
                      ids: [selectedNode.id],
                      transparency: (value[0] ?? 0) / 100,
                    });
                  }}
                />
              </Box>
            </Flex>
          </ControlRow>
        </RightPanelSection>
      </Flex>
    );

  return (
    <Box
      p="4"
      style={{
        height: "100%",
        overflowY: "auto",
      }}
    >
      <Heading size="3" mb="3">
        Layers
      </Heading>
      <LayerPanel editor={editor} />

      <Heading size="3" mt="5" mb="3">
        Shape Properties
      </Heading>
      {shapeProperties}
    </Box>
  );
};
