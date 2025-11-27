import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Box, Button, Grid, Text } from "@radix-ui/themes";

import type { ShapePath, ShapeViewBox } from "../editor";

const shapes: {
  label: string;
  paths: ShapePath[];
  viewBox: ShapeViewBox;
}[] = [
  {
    label: "Rectangle",
    paths: [{ d: "M0,0L64,0L64,64L0,64Z" }],
    viewBox: { minX: 0, minY: 0, width: 64, height: 64 },
  },
  {
    label: "Triangle",
    paths: [{ d: "M32 0L64 56H0L32 0Z" }],
    viewBox: { minX: 0, minY: 0, width: 64, height: 56 },
  },
  {
    label: "Circle",
    paths: [{ d: "M32,0A32,32,0,1,1,32,64A32,32,0,1,1,32,0Z" }],
    viewBox: { minX: 0, minY: 0, width: 64, height: 64 },
  },
  {
    label: "Ellipse",
    paths: [{ d: "M32,0A32,20,0,1,1,32,40A32,20,0,1,1,32,0Z" }],
    viewBox: { minX: 0, minY: 0, width: 64, height: 40 },
  },
  {
    label: "Diamond",
    paths: [{ d: "M32,0L64,32L32,64L0,32Z" }],
    viewBox: { minX: 0, minY: 0, width: 64, height: 64 },
  },
  {
    label: "Pentagon",
    paths: [{ d: "M32,0L64,24L52,64L12,64L0,24Z" }],
    viewBox: { minX: 0, minY: 0, width: 64, height: 64 },
  },
  {
    label: "Hexagon",
    paths: [{ d: "M16,0L48,0L64,28L48,56L16,56L0,28Z" }],
    viewBox: { minX: 0, minY: 0, width: 64, height: 56 },
  },
  {
    label: "Star",
    paths: [{ d: "M32,0L39,22L64,22L44,36L51,58L32,44L13,58L20,36L0,22L25,22Z" }],
    viewBox: { minX: 0, minY: 0, width: 64, height: 58 },
  },
  {
    label: "Arrow",
    paths: [{ d: "M0,24L40,24L40,8L64,32L40,56L40,40L0,40Z" }],
    viewBox: { minX: 0, minY: 0, width: 64, height: 64 },
  },
  {
    label: "Heart",
    paths: [{ d: "M32,56L8,32C0,24,0,12,8,4C16,-4,24,-4,32,8C40,-4,48,-4,56,4C64,12,64,24,56,32Z" }],
    viewBox: { minX: 0, minY: 0, width: 64, height: 56 },
  },
];

interface ShapePanelProps {
  currentColor: string;
  onSelect: (shape: { paths: ShapePath[]; viewBox: ShapeViewBox }) => void;
}

const DraggableShapeButton = ({
  shape,
  currentColor,
  onSelect,
}: {
  shape: { label: string; paths: ShapePath[]; viewBox: ShapeViewBox };
  currentColor: string;
  onSelect: (shape: { paths: ShapePath[]; viewBox: ShapeViewBox }) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `shape-${shape.label}`,
      data: {
        type: "shape",
        shape: {
          label: shape.label,
          paths: shape.paths.map((path) => ({
            ...path,
            stroke: { color: currentColor, weight: 2 },
          })),
          viewBox: shape.viewBox,
        },
      },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <Button
      ref={setNodeRef}
      variant="outline"
      color="gray"
      style={{
        height: "auto",
        padding: "12px",
        flexDirection: "column",
        gap: "8px",
        ...style,
      }}
      onClick={() =>
        onSelect({
          paths: shape.paths.map((path) => ({
            ...path,
            stroke: { color: currentColor, weight: 2 },
          })),
          viewBox: shape.viewBox,
        })
      }
      {...listeners}
      {...attributes}
    >
      <Box
        style={{
          width: "40px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          viewBox={`${shape.viewBox.minX} ${shape.viewBox.minY} ${shape.viewBox.width} ${shape.viewBox.height}`}
          style={{ width: "100%", height: "100%" }}
        >
          <path d={shape.paths[0]?.d} stroke="none" fill="currentColor" />
        </svg>
      </Box>
      <Text size="1">{shape.label}</Text>
    </Button>
  );
};

export const ShapePanel = ({ currentColor, onSelect }: ShapePanelProps) => {
  return (
    <Box style={{ width: "200px" }}>
      <Grid columns="2" gap="2">
        {shapes.map((shape) => (
          <DraggableShapeButton
            key={shape.label}
            shape={shape}
            currentColor={currentColor}
            onSelect={onSelect}
          />
        ))}
      </Grid>
    </Box>
  );
};
