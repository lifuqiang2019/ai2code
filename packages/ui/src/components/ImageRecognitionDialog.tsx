import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  Tabs,
  Button,
  TextField,
  Text,
  Box,
  Flex,
} from "@radix-ui/themes";
import { Upload, Link as LinkIcon, Loader2, X } from "lucide-react";

import type { ShapeRecognitionResult } from "../services/aiService";
import {
  recognizeShapesFromFile,
  recognizeShapesFromUrl,
  generateShapesFromText,
} from "../services/aiService";
import { convertRecognizedShapes, optimizeImage } from "../utils/shapeConverter";

type UploadMode = "url" | "file" | "text";

// 简化的 DesignEditor 接口
interface DesignEditor {
  state: {
    value: {
      attributes: {
        width: number;
        height: number;
      };
    };
  };
  replaceElements: (options: { elements: any[]; addToHistory: boolean }) => void;
  clearCanvas: () => void;
}

interface ImageRecognitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editor: DesignEditor;
}

export function ImageRecognitionDialog({
  open,
  onOpenChange,
  editor,
}: ImageRecognitionDialogProps) {
  const [uploadMode, setUploadMode] = useState<UploadMode>("text");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognizedShapes, setRecognizedShapes] = useState<
    ShapeRecognitionResult[]
  >([]);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============ 文件上传处理 ============

  const handleFileSelect = async (file: File) => {
    // 验证文件类型
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setError("不支持的文件格式，请上传 JPG、PNG、WebP 或 GIF 图片");
      return;
    }

    // 验证文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      setError("文件太大，请上传小于 10MB 的图片");
      return;
    }

    setError(null);

    // 优化图片
    try {
      const optimizedFile = await optimizeImage(file);
      setImageFile(optimizedFile);

      // 生成预览
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(optimizedFile);
    } catch (err) {
      setError("图片处理失败");
    }
  };

  // 点击选择文件
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // 拖拽处理
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find((file) => file.type.startsWith("image/"));

    if (imageFile) {
      handleFileSelect(imageFile);
    } else {
      setError("请拖拽图片文件");
    }
  };

  // 粘贴处理
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // 只在对话框打开且处于文件上传模式时处理
      if (!open || uploadMode !== "file") return;

      const items = Array.from(e.clipboardData?.items || []);
      const imageItem = items.find((item) => item.type.startsWith("image/"));

      if (imageItem) {
        e.preventDefault();
        const file = imageItem.getAsFile();
        if (file) {
          handleFileSelect(file);
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [open, uploadMode]);

  // ============ URL 加载处理 ============

  const handleLoadFromUrl = () => {
    if (!imageUrl.trim()) {
      setError("请输入图片 URL");
      return;
    }

    // 简单的 URL 验证
    try {
      new URL(imageUrl);
    } catch {
      setError("请输入有效的 URL");
      return;
    }

    setError(null);
    setPreviewUrl(imageUrl);
  };

  // ============ 识别处理 ============

  const handleRecognize = async () => {
    setIsRecognizing(true);
    setError(null);

    try {
      const canvasSize = {
        width: editor.state.value.attributes.width,
        height: editor.state.value.attributes.height,
      };

      let response;

      if (uploadMode === "text") {
        // 文本生成模式
        if (!textInput.trim()) {
          setError("请输入形状描述");
          return;
        }

        response = await generateShapesFromText(
          textInput,
          canvasSize.width,
          canvasSize.height
        );
      } else if (uploadMode === "url") {
        // URL 模式
        response = await recognizeShapesFromUrl(
          imageUrl,
          canvasSize.width,
          canvasSize.height
        );
      } else {
        // 文件上传模式
        if (!imageFile) {
          setError("请先选择图片");
          return;
        }

        response = await recognizeShapesFromFile(
          imageFile,
          canvasSize.width,
          canvasSize.height
        );
      }

      if (!response.success) {
        setError(response.message || "识别失败");
        setRecognizedShapes([]);
        return;
      }

      // 设置识别结果
      setRecognizedShapes(response.data?.shapes || []);
      setImageSize(response.data?.imageSize || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络错误，请重试");
    } finally {
      setIsRecognizing(false);
    }
  };

  // ============ 导入到画布 ============

  const handleImportToCanvas = () => {
    if (recognizedShapes.length === 0) return;

    const canvasSize = {
      width: editor.state.value.attributes.width,
      height: editor.state.value.attributes.height,
    };

    // 先清空画布
    editor.clearCanvas();

    // 转换为 ShapeDef 并批量创建
    const shapeDefs = convertRecognizedShapes(
      recognizedShapes, 
      canvasSize, 
      imageSize || undefined
    );

    // 批量添加到画布
    editor.replaceElements({
      elements: shapeDefs,
      addToHistory: true,
    });

    // 关闭对话框
    onOpenChange(false);
    
    // 重置状态
    handleReset();
  };

  // ============ 重置状态 ============

  const handleReset = () => {
    setImageUrl("");
    setImageFile(null);
    setPreviewUrl(null);
    setRecognizedShapes([]);
    setError(null);
  };

  // ============ 删除单个形状 ============

  const handleDeleteShape = (index: number) => {
    setRecognizedShapes((shapes) => shapes.filter((_, i) => i !== index));
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 600 }}>
        <Dialog.Title>🎨 AI 形状助手</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          ✨ 支持文本生成和图片识别 10 种形状：矩形、三角形、圆形、椭圆、菱形、五边形、六边形、星形、箭头、心形
        </Dialog.Description>

        {/* Tab 切换 */}
        <Tabs.Root
          value={uploadMode}
          onValueChange={(v) => setUploadMode(v as UploadMode)}
        >
          <Tabs.List>
            <Tabs.Trigger value="text">
              ✨ 文本生成
            </Tabs.Trigger>
            <Tabs.Trigger value="file">
              <Upload size={16} />
              本地上传
            </Tabs.Trigger>
            <Tabs.Trigger value="url">
              <LinkIcon size={16} />
              URL 导入
            </Tabs.Trigger>
          </Tabs.List>

          {/* 文本生成模式 */}
          <Tabs.Content value="text">
            <Box mt="4">
              <Text size="2" mb="2" color="gray">
                用自然语言描述想要创建的形状，例如：
              </Text>
              <Text size="1" color="gray" mb="3">
                • "画一个红色的圆形在左上角，一个蓝色的矩形在右下角"<br />
                • "创建3个不同颜色的三角形，从左到右排列"<br />
                • "画一个大的紫色星星在中间"
              </Text>
              <textarea
                placeholder="请描述你想要创建的形状..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                rows={4}
                style={{
                  width: "100%",
                  padding: "var(--space-3)",
                  borderRadius: "var(--radius-2)",
                  border: "1px solid var(--gray-6)",
                  fontFamily: "inherit",
                  fontSize: "var(--font-size-2)",
                  resize: "vertical",
                }}
              />
            </Box>
          </Tabs.Content>

          {/* URL 模式 */}
          <Tabs.Content value="url">
            <Box mt="4">
              <Flex gap="2">
                <TextField.Root
                  placeholder="输入图片 URL，例如：https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  style={{ flex: 1 }}
                />
                <Button onClick={handleLoadFromUrl}>加载</Button>
              </Flex>
            </Box>
          </Tabs.Content>

          {/* 文件上传模式 */}
          <Tabs.Content value="file">
            <Box mt="4">
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${
                    isDragging ? "var(--blue-9)" : "var(--gray-7)"
                  }`,
                  borderRadius: "var(--radius-3)",
                  padding: "32px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: isDragging ? "var(--blue-2)" : "var(--gray-2)",
                  transition: "all 0.2s",
                }}
              >
                <Upload
                  size={48}
                  style={{ margin: "0 auto", color: "var(--gray-9)" }}
                />
                <Text
                  size="3"
                  weight="medium"
                  style={{ display: "block", marginTop: 12 }}
                >
                  拖拽图片到此处
                </Text>
                <Text
                  size="2"
                  color="gray"
                  style={{ display: "block", marginTop: 4 }}
                >
                  或点击选择文件，或按 <kbd>Ctrl+V</kbd> 粘贴图片
                </Text>
                <Text
                  size="1"
                  color="gray"
                  style={{ display: "block", marginTop: 8 }}
                >
                  支持: JPG, PNG, WebP, GIF · 最大 10MB
                </Text>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileInputChange}
                style={{ display: "none" }}
              />
            </Box>
          </Tabs.Content>
        </Tabs.Root>

        {/* 错误提示 */}
        {error && (
          <Box
            mt="3"
            p="3"
            style={{
              background: "var(--red-3)",
              borderRadius: "var(--radius-2)",
            }}
          >
            <Text size="2" color="red">
              {error}
            </Text>
          </Box>
        )}

        {/* 图片预览 */}
        {previewUrl && (
          <Box mt="4">
            <Text size="2" weight="medium" mb="2">
              预览
            </Text>
            <Box style={{ position: "relative" }}>
              <img
                src={previewUrl}
                alt="Preview"
                style={{
                  width: "100%",
                  maxHeight: 300,
                  objectFit: "contain",
                  borderRadius: "var(--radius-2)",
                  border: "1px solid var(--gray-6)",
                }}
              />
              <Button
                size="1"
                color="red"
                variant="soft"
                style={{ position: "absolute", top: 8, right: 8 }}
                onClick={handleReset}
              >
                <X size={16} />
              </Button>
            </Box>
          </Box>
        )}

        {/* 识别结果 */}
        {recognizedShapes.length > 0 && (
          <Box mt="4">
            <Text size="2" weight="medium" mb="2">
              识别到 {recognizedShapes.length} 个形状
            </Text>
            <Box style={{ maxHeight: 150, overflowY: "auto" }}>
              {recognizedShapes.map((shape, index) => (
                <Flex
                  key={index}
                  align="center"
                  justify="between"
                  p="2"
                  style={{
                    borderBottom: "1px solid var(--gray-5)",
                  }}
                >
                  <Flex align="center" gap="2">
                    <Box
                      style={{
                        width: 20,
                        height: 20,
                        background: shape.fill.color,
                        borderRadius: 4,
                        border: shape.fill.hasStroke
                          ? `${shape.fill.strokeWidth}px solid ${shape.fill.strokeColor}`
                          : "1px solid var(--gray-7)",
                      }}
                    />
                    <Text size="2">
                      {shape.shapeType} - 第 {shape.zIndex} 层
                    </Text>
                  </Flex>
                  <Button
                    size="1"
                    variant="ghost"
                    color="red"
                    onClick={() => handleDeleteShape(index)}
                  >
                    删除
                  </Button>
                </Flex>
              ))}
            </Box>
          </Box>
        )}

        {/* 操作按钮 */}
        <Flex gap="3" mt="5" justify="end">
          <Button
            variant="soft"
            color="gray"
            onClick={() => {
              onOpenChange(false);
              handleReset();
            }}
          >
            取消
          </Button>

          {recognizedShapes.length === 0 ? (
            <Button
              onClick={handleRecognize}
              disabled={!previewUrl && uploadMode !== "text" || isRecognizing}
            >
              {isRecognizing && (
                <Loader2
                  size={16}
                  style={{
                    animation: "spin 1s linear infinite",
                  }}
                />
              )}
              {isRecognizing 
                ? (uploadMode === "text" ? "生成中..." : "识别中...") 
                : (uploadMode === "text" ? "生成形状" : "开始识别")}
            </Button>
          ) : (
            <Button onClick={handleImportToCanvas}>
              导入到画布 ({recognizedShapes.length})
            </Button>
          )}
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
