import { Box, Flex, Text } from "@radix-ui/themes";
import { GripVertical } from "lucide-react";
import { useMemo } from "react";
import { useStore } from "zustand";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import type { DesignEditor } from "../editor";

interface LayerPanelProps {
  editor: DesignEditor;
}

interface LayerItemProps {
  id: string;
  label: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const LayerItem = ({ id, label, isSelected, onSelect }: LayerItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id,
      data: {
        type: "layer",
      },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    border: `1px solid ${
      isSelected ? "var(--blue-8)" : "var(--gray-5)"
    }`,
    backgroundColor: isSelected
      ? "var(--blue-3)"
      : "var(--color-background)",
  };

  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(id)}
      style={{
        ...style,
        borderRadius: "var(--radius-2)",
        padding: "8px",
        cursor: "grab",
        userSelect: "none",
        marginBottom: "6px",
      }}
    >
      <Flex align="center" gap="2">
        <GripVertical size={16} />
        <Box style={{ flex: 1 }}>
          <Text size="2" weight="medium">
            {label}
          </Text>
        </Box>
      </Flex>
    </Box>
  );
};

export const LayerPanel = ({ editor }: LayerPanelProps) => {
  const { value, selection } = useStore(editor.stateStore);
  const selectedIds = selection?.ids ?? [];

  const orderedIds = useMemo(
    () => Object.keys(value.elements),
    [value.elements],
  );

  if (orderedIds.length === 0) {
    return (
      <Box
        style={{
          border: "1px dashed var(--gray-5)",
          borderRadius: "var(--radius-2)",
          padding: "12px",
        }}
      >
        <Text size="2" color="gray">
          暂无元素，添加形状后将在此显示。
        </Text>
      </Box>
    );
  }

  const displayOrder = orderedIds.slice().reverse();

  return (
    <SortableContext
      items={displayOrder}
      strategy={verticalListSortingStrategy}
    >
      {displayOrder.map((id) => {
        const element = value.elements[id];
        if (!element) return null;
        
        const label = element.name || `图层 ${id.substring(0, 8)}`;
        return (
          <LayerItem
            key={id}
            id={id}
            label={label}
            isSelected={selectedIds.includes(id)}
            onSelect={(targetId) => {
              editor.setSelection({ ids: [targetId] });
            }}
          />
        );
      })}
    </SortableContext>
  );
};

export default LayerPanel;

