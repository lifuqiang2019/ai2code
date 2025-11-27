import { Box, Button, Flex, IconButton, Text } from "@radix-ui/themes";
import { Download, Redo, Trash2, Undo, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useStore } from "zustand";

import type { DesignEditor } from "../editor";

interface CanvasToolbarProps {
  editor: DesignEditor;
}

export const CanvasToolbar = ({ editor }: CanvasToolbarProps) => {
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const clearButtonWrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { historyIndex, history, value } = useStore(editor.stateStore);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const hasElements = Object.keys(value.elements).length > 0;

  const canvasWidth = value.attributes.width;

  const handleExport = () => {
    const jsonString = editor.exportToJSON();
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `design-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const jsonString = event.target?.result as string;
      const result = editor.importFromJSON(jsonString);

      if (!result.success) {
        alert(`导入失败: ${result.error}`);
      }
    };
    reader.readAsText(file);

    // 重置 input 以允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!isConfirmingClear) return;

    const handlePointerDown = (event: MouseEvent) => {
      const overlayArea = clearButtonWrapperRef.current;
      if (!overlayArea) return;

      if (!overlayArea.contains(event.target as Node)) {
        setIsConfirmingClear(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsConfirmingClear(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isConfirmingClear]);

  useEffect(() => {
    if (!hasElements) {
      setIsConfirmingClear(false);
    }
  }, [hasElements]);

  return (
    <Box
      ref={containerRef}
      style={{
        width: canvasWidth,
        maxWidth: "100%",
        position: "relative",
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <Flex
        align="center"
        justify="space-between"
        style={{
          background: "var(--color-background)",
          border: "1px solid var(--gray-5)",
          borderRadius: "var(--radius-3)",
          padding: "8px 12px",
          boxShadow: "var(--shadow-3)",
          gap: "8px",
        }}
      >
        <Flex gap="2">
          <IconButton
            size="2"
            variant="soft"
            color="gray"
            disabled={!canUndo}
            highContrast
            onClick={() => editor.undo()}
            title="撤销 (Ctrl/Cmd+Z)"
            style={{
              cursor: canUndo ? "pointer" : "not-allowed",
            }}
          >
            <Undo size={18} strokeWidth={1.5} />
          </IconButton>
          <IconButton
            size="2"
            variant="soft"
            color="gray"
            disabled={!canRedo}
            highContrast
            onClick={() => editor.redo()}
            title="重做 (Ctrl/Cmd+Shift+Z)"
            style={{
              cursor: canRedo ? "pointer" : "not-allowed",
            }}
          >
            <Redo size={18} strokeWidth={1.5} />
          </IconButton>
        </Flex>

        <Flex gap="2">
          <Button
            size="2"
            variant="soft"
            color="gray"
            onClick={handleImport}
            title="导入设计"
            style={{
              cursor: "pointer",
            }}
          >
            <Upload size={18} strokeWidth={1.5} />
            导入
          </Button>
          <Button
            size="2"
            variant="soft"
            color="gray"
            disabled={!hasElements}
            onClick={handleExport}
            title="导出设计"
            style={{
              cursor: hasElements ? "pointer" : "not-allowed",
            }}
          >
            <Download size={18} strokeWidth={1.5} />
            导出
          </Button>
        </Flex>
        <Box
          ref={clearButtonWrapperRef}
          style={{
            position: "relative",
            display: "inline-flex",
          }}
        >
          <IconButton
            size="2"
            variant="soft"
            color="red"
            highContrast
            disabled={!hasElements}
            title="清空画布"
            onClick={() => {
              if (!hasElements) return;
              setIsConfirmingClear((prev) => !prev);
            }}
            style={{
              cursor: hasElements ? "pointer" : "not-allowed",
            }}
          >
            <Trash2 size={18} strokeWidth={1.5} />
          </IconButton>

          {isConfirmingClear && (
            <Box
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                background: "var(--color-background)",
                border: "1px solid var(--gray-4)",
                borderRadius: "var(--radius-3)",
                boxShadow: "var(--shadow-3)",
                padding: "10px 12px",
                width: "240px",
                zIndex: 10,
              }}
            >
              <Text
                size="2"
                weight="medium"
                style={{ color: "var(--gray-12)" }}
              >
                清空画布？
              </Text>
              <Text size="1" style={{ color: "var(--gray-11)" }}>
                所有元素将被移除且无法恢复，请确认。
              </Text>
              <Flex gap="2" mt="3" justify="end">
                <Button
                  size="1"
                  variant="surface"
                  color="gray"
                  onClick={() => setIsConfirmingClear(false)}
                >
                  取消
                </Button>
                <Button
                  size="1"
                  color="red"
                  variant="soft"
                  onClick={() => {
                    editor.clearCanvas();
                    setIsConfirmingClear(false);
                  }}
                >
                  确认清空
                </Button>
              </Flex>
            </Box>
          )}
        </Box>
      </Flex>
    </Box>
  );
};

export default CanvasToolbar;

