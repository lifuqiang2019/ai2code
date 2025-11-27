import { ContextMenu } from "@radix-ui/themes";
import { useStore } from "zustand";

import type { DesignEditor, ID } from "../editor";

interface EditorContextMenuProps {
  editor: DesignEditor;
  children: React.ReactNode;
}

export const EditorContextMenu = ({
  editor,
  children,
}: EditorContextMenuProps) => {
  const { selection, value } = useStore(editor.stateStore);
  const hasSelection = selection && selection.ids.length > 0;

  const handleDelete = () => {
    if (selection) {
      editor.deleteElements(selection.ids);
      editor.setSelection(null);
    }
  };

  const reorder = (newOrder: ID[]) => {
    editor.reorderElements(newOrder);
  };

  const getElementOrder = () => Object.keys(value.elements);
  const getSelectedItemsInOrder = () => {
    if (!selection) return [];
    const order = getElementOrder();
    const selectedSet = new Set(selection.ids);
    return order.filter((id) => selectedSet.has(id));
  };

  const handleBringForward = () => {
    if (!selection) return;
    const order = getElementOrder();
    const orderedSelected = getSelectedItemsInOrder();
    const selectedSet = new Set(orderedSelected);
    for (let i = order.length - 2; i >= 0; i--) {
      if (selectedSet.has(order[i]) && !selectedSet.has(order[i + 1])) {
        [order[i], order[i + 1]] = [order[i + 1], order[i]];
      }
    }
    reorder(order);
  };

  const handleSendBackward = () => {
    if (!selection) return;
    const order = getElementOrder();
    const orderedSelected = getSelectedItemsInOrder();
    const selectedSet = new Set(orderedSelected);
    for (let i = 1; i < order.length; i++) {
      if (selectedSet.has(order[i]) && !selectedSet.has(order[i - 1])) {
        [order[i], order[i - 1]] = [order[i - 1], order[i]];
      }
    }
    reorder(order);
  };

  const handleBringToFront = () => {
    if (!selection) return;
    const order = getElementOrder();
    const orderedSelected = getSelectedItemsInOrder();
    const selectedSet = new Set(orderedSelected);
    const remaining = order.filter((id) => !selectedSet.has(id));
    const nextOrder = [...remaining, ...orderedSelected];
    reorder(nextOrder);
  };

  const handleSendToBack = () => {
    if (!selection) return;
    const order = getElementOrder();
    const orderedSelected = getSelectedItemsInOrder();
    const selectedSet = new Set(orderedSelected);
    const remaining = order.filter((id) => !selectedSet.has(id));
    const nextOrder = [...orderedSelected, ...remaining];
    reorder(nextOrder);
  };

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>
        <div style={{ display: "inline-block" }}>{children}</div>
      </ContextMenu.Trigger>
      <ContextMenu.Content>
        <ContextMenu.Item
          disabled={!hasSelection}
          onClick={handleDelete}
          shortcut="⌫"
        >
          Delete
        </ContextMenu.Item>
        <ContextMenu.Separator />
        <ContextMenu.Item disabled={!hasSelection} onClick={handleBringForward}>
          Bring Forward
        </ContextMenu.Item>
        <ContextMenu.Item disabled={!hasSelection} onClick={handleSendBackward}>
          Send Backward
        </ContextMenu.Item>
        <ContextMenu.Item disabled={!hasSelection} onClick={handleBringToFront}>
          Bring to Front
        </ContextMenu.Item>
        <ContextMenu.Item disabled={!hasSelection} onClick={handleSendToBack}>
          Send to Back
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
};
