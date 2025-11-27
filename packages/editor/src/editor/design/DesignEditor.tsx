import { type StoreApi, createStore } from "zustand/vanilla";

import { compactMap, uniqued } from "../../utils";
import { createNodeId } from "../node/node/createNodeId";
import { type Selection } from "../selection";
import type { ReadonlyStoreApi } from "../types/store";
import type {
  DesignValue,
  ElementDef,
  ID,
  ShapeDef,
  ShapeFill,
  ShapePath,
  ShapeViewBox,
} from "../value";

interface EditorState {
  value: DesignValue;
  selection: Selection | null;
  history: DesignValue[];
  historyIndex: number;
}

export interface DesignEditorOptions {
  value: DesignValue;
}

class DesignEditor {
  #stateStore: StoreApi<EditorState>;
  #isUndoingOrRedoing = false;
  #nextElementNumber = 1;

  constructor(options: DesignEditorOptions) {
    const { value } = options;
    // 计算初始元素编号
    const existingElements = Object.values(value.elements);
    existingElements.forEach((el) => {
      if (el.name?.startsWith("图层 ")) {
        const num = parseInt(el.name.substring(3));
        if (!isNaN(num) && num >= this.#nextElementNumber) {
          this.#nextElementNumber = num + 1;
        }
      }
    });
    this.#stateStore = createStore<EditorState>()(() => ({
      value,
      selection: null,
      history: [value],
      historyIndex: 0,
    }));
  }

  get stateStore(): ReadonlyStoreApi<EditorState> {
    return this.#stateStore;
  }

  get state() {
    return this.#stateStore.getState();
  }

  setSelection(newSelection: Selection | null) {
    this.#stateStore.setState({ selection: newSelection });
  }

  #addToHistory(newValue: DesignValue) {
    if (this.#isUndoingOrRedoing) return;

    const { history, historyIndex } = this.state;
    // 删除当前索引之后的所有历史记录（如果用户撤销后进行了新操作）
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newValue);
    
    // 限制历史记录数量，避免内存过大（保留最近50个状态）
    const maxHistorySize = 50;
    const trimmedHistory =
      newHistory.length > maxHistorySize
        ? newHistory.slice(newHistory.length - maxHistorySize)
        : newHistory;

    this.#stateStore.setState({
      history: trimmedHistory,
      historyIndex: trimmedHistory.length - 1,
    });
  }

  canUndo(): boolean {
    return this.state.historyIndex > 0;
  }

  canRedo(): boolean {
    return this.state.historyIndex < this.state.history.length - 1;
  }

  undo() {
    if (!this.canUndo()) return;

    this.#isUndoingOrRedoing = true;
    const { history, historyIndex } = this.state;
    const newIndex = historyIndex - 1;
    const previousValue = history[newIndex];

    if (previousValue) {
      this.#stateStore.setState({
        value: previousValue,
        historyIndex: newIndex,
        selection: null, // 清除选择
      });
    }

    this.#isUndoingOrRedoing = false;
  }

  redo() {
    if (!this.canRedo()) return;

    this.#isUndoingOrRedoing = true;
    const { history, historyIndex } = this.state;
    const newIndex = historyIndex + 1;
    const nextValue = history[newIndex];

    if (nextValue) {
      this.#stateStore.setState({
        value: nextValue,
        historyIndex: newIndex,
        selection: null, // 清除选择
      });
    }

    this.#isUndoingOrRedoing = false;
  }

  #getElementBoundsInCenter(
    size: { width: number; height: number },
    value: DesignValue,
  ): ElementDef["bounds"] {
    return {
      left: value.attributes.width / 2 - size.width / 2,
      top: value.attributes.height / 2 - size.height / 2,
      width: size.width,
      height: size.height,
    };
  }

  #updateShapes(
    value: DesignValue,
    ids: string[],
    updater: (shape: ShapeDef) => ShapeDef,
  ): { nextValue: DesignValue; updatedIds: string[] } {
    const shapeElements = compactMap(ids, (id) => {
      const element = value.elements[id];

      if (element?.type !== "shape") return null;

      const newElement = updater(element);

      return newElement === element ? null : newElement;
    });

    const newValue = {
      ...value,
      elements: {
        ...value.elements,
        ...Object.fromEntries(shapeElements.map((node) => [node.id, node])),
      },
    };

    return {
      nextValue: newValue,
      updatedIds: shapeElements.map((node) => node.id),
    };
  }

  replaceElements(payload: {
    elements: ElementDef[];
    addToHistory?: boolean;
  }) {
    const { elements, addToHistory = true } = payload;
    const updatedIds = elements.map((node) => node.id);

    const nextValue = {
      ...this.state.value,
      elements: {
        ...this.state.value.elements,
        ...Object.fromEntries(elements.map((element) => [element.id, element])),
      },
    };

    this.#stateStore.setState({ value: nextValue });
    if (addToHistory) {
      this.#addToHistory(nextValue);
    }
    return updatedIds;
  }

  // 手动添加当前状态到历史记录（用于拖动结束等场景）
  addCurrentStateToHistory() {
    this.#addToHistory(this.state.value);
  }

  updateElementAttributes(payload: { ids: ID[]; transparency?: number }) {
    const { ids, ...attributes } = payload;

    const nextValue = {
      ...this.state.value,
      elements: {
        ...this.state.value.elements,
        ...Object.fromEntries(
          compactMap(ids, (id) => {
            const element = this.state.value.elements[id];
            if (!element) return null;

            return [
              id,
              {
                ...element,
                ...attributes,
              },
            ];
          }),
        ),
      },
    };

    this.#stateStore.setState({ value: nextValue });
    this.#addToHistory(nextValue);
    return ids;
  }

  createShapeElement(payload: {
    left?: number;
    top?: number;
    width: number;
    height: number;
    viewBox: ShapeViewBox;
    paths: ShapePath[];
  }): ID {
    const nodeId = createNodeId();
    const elementName = `图层 ${this.#nextElementNumber}`;
    this.#nextElementNumber++;
    
    const nextValue = {
      ...this.state.value,
      elements: {
        ...this.state.value.elements,
        [nodeId]: {
          type: "shape" as const,
          id: nodeId,
          name: elementName,
          bounds: {
            ...this.#getElementBoundsInCenter(payload, this.state.value),
            ...(payload.left ? { left: payload.left } : null),
            ...(payload.top ? { top: payload.top } : null),
          },
          viewBox: {
            minX: payload.viewBox.minX,
            minY: payload.viewBox.minY,
            width: payload.viewBox.width,
            height: payload.viewBox.height,
          },
          paths: payload.paths.slice(),
        },
      },
    };

    this.#stateStore.setState({
      selection: { ids: [nodeId] },
      value: nextValue,
    });
    this.#addToHistory(nextValue);
    return nodeId;
  }

  deleteElements(nodeIds: ID[]) {
    const value = this.state.value;
    const uniqueIds = uniqued(nodeIds);
    const deleteIds = uniqueIds.filter((id) => value.elements[id]);

    if (deleteIds.length === 0) {
      return [];
    }

    const nextValue = {
      ...value,
      elements: Object.fromEntries(
        Object.entries(value.elements).filter(
          ([id]) => !deleteIds.includes(id),
        ),
      ),
    };

    this.#stateStore.setState({
      selection: null,
      value: nextValue,
    });
    this.#addToHistory(nextValue);
    return deleteIds;
  }

  clearCanvas() {
    const { value } = this.state;
    if (Object.keys(value.elements).length === 0) return;

    const nextValue: DesignValue = {
      ...value,
      elements: {},
    };

    this.#stateStore.setState({
      selection: null,
      value: nextValue,
      history: [nextValue],
      historyIndex: 0,
    });
  }

  exportToJSON(): string {
    const { value } = this.state;
    const exportData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      design: value,
    };
    return JSON.stringify(exportData, null, 2);
  }

  importFromJSON(jsonString: string): { success: boolean; error?: string } {
    try {
      const data = JSON.parse(jsonString);

      // 验证数据结构
      if (!data.design) {
        return { success: false, error: "缺少 design 字段" };
      }

      if (!data.design.elements || typeof data.design.elements !== "object") {
        return { success: false, error: "无效的 elements 数据" };
      }

      if (
        !data.design.attributes ||
        typeof data.design.attributes.width !== "number" ||
        typeof data.design.attributes.height !== "number"
      ) {
        return { success: false, error: "无效的画布属性" };
      }

      // 验证每个元素
      const elements = data.design.elements;
      for (const [id, element] of Object.entries(elements)) {
        if (!element || typeof element !== "object") {
          return { success: false, error: `元素 ${id} 数据无效` };
        }
        const el = element as any;
        if (!el.type || !el.id || !el.bounds) {
          return {
            success: false,
            error: `元素 ${id} 缺少必要字段 (type, id, bounds)`,
          };
        }
      }

      // 更新元素编号计数器
      const importedElements = Object.values(elements) as ElementDef[];
      importedElements.forEach((el) => {
        if (el.name?.startsWith("图层 ")) {
          const num = parseInt(el.name.substring(3));
          if (!isNaN(num) && num >= this.#nextElementNumber) {
            this.#nextElementNumber = num + 1;
          }
        }
      });

      const nextValue: DesignValue = data.design;

      this.#stateStore.setState({
        value: nextValue,
        selection: null,
        history: [nextValue],
        historyIndex: 0,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "JSON 解析失败",
      };
    }
  }

  reorderElements(newOrder: ID[]) {
    const { value } = this.state;
    const elements = value.elements;
    const existingIds = Object.keys(elements);

    if (existingIds.length <= 1) return;

    const normalizedOrder = [
      ...newOrder.filter((id) => elements[id]),
      ...existingIds.filter((id) => !newOrder.includes(id)),
    ];

    const orderedEntries = normalizedOrder.map((id) => [id, elements[id]]);

    const nextValue: DesignValue = {
      ...value,
      elements: Object.fromEntries(orderedEntries),
    };

    this.#stateStore.setState({
      value: nextValue,
    });
    this.#addToHistory(nextValue);
  }

  updateShapePaths(payload: {
    ids: string[];
    attributes: {
      stroke?: {
        color?: string;
        weight?: number;
        dasharray?: [number, number] | null;
      } | null;
      fill?: ShapeFill | null;
      strokeEnabled?: boolean;
      fillEnabled?: boolean;
    };
  }) {
    const { ids, attributes } = payload;

    const defaultStroke = {
      color: "#000000",
      weight: 4,
    };
    const defaultFill: ShapeFill = {
      color: "#000000",
    };

    const { nextValue } = this.#updateShapes(
      this.state.value,
      ids,
      (shape) => ({
        ...shape,
        paths: shape.paths.map((path) => {
          let nextStroke = path.stroke;
          let nextStrokeCache = path.strokeCache ?? path.stroke;
          let nextFill = path.fill;
          let nextFillCache = path.fillCache ?? path.fill;

          if (attributes.strokeEnabled !== undefined) {
            if (attributes.strokeEnabled) {
              const restoredStroke =
                path.strokeCache ?? path.stroke ?? defaultStroke;
              nextStroke = {
                ...defaultStroke,
                ...restoredStroke,
              };
              nextStrokeCache = nextStroke;
            } else {
              const cacheSource =
                path.stroke ?? path.strokeCache ?? defaultStroke;
              nextStrokeCache = {
                ...defaultStroke,
                ...cacheSource,
              };
              nextStroke = undefined;
            }
          }

          if (attributes.fillEnabled !== undefined) {
            if (attributes.fillEnabled) {
              const restoredFill = path.fillCache ?? path.fill ?? defaultFill;
              nextFill = {
                ...defaultFill,
                ...restoredFill,
              };
              nextFillCache = nextFill;
            } else {
              const cacheSource = path.fill ?? path.fillCache ?? defaultFill;
              nextFillCache = {
                ...defaultFill,
                ...cacheSource,
              };
              nextFill = undefined;
            }
          }

          if (attributes.stroke !== undefined) {
            if (attributes.stroke == null) {
              const cacheSource =
                nextStroke ?? nextStrokeCache ?? defaultStroke;
              nextStrokeCache = {
                ...defaultStroke,
                ...cacheSource,
              };
              nextStroke = undefined;
            } else {
              nextStroke = {
                ...defaultStroke,
                ...nextStroke,
                ...attributes.stroke,
                dasharray:
                  attributes.stroke.dasharray === undefined
                    ? nextStroke?.dasharray
                    : (attributes.stroke.dasharray ?? undefined),
              };
              nextStrokeCache = nextStroke;
            }
          }

          if (attributes.fill !== undefined) {
            if (attributes.fill == null) {
              const cacheSource = nextFill ?? nextFillCache ?? defaultFill;
              nextFillCache = {
                ...defaultFill,
                ...cacheSource,
              };
              nextFill = undefined;
            } else {
              nextFill = {
                ...defaultFill,
                ...nextFill,
                ...attributes.fill,
              };
              nextFillCache = nextFill;
            }
          }

          return {
            ...path,
            fill: nextFill,
            stroke: nextStroke,
            strokeCache: nextStrokeCache,
            fillCache: nextFillCache,
          };
        }),
      }),
    );
    this.#stateStore.setState({ value: nextValue });
    this.#addToHistory(nextValue);
  }
}

export default DesignEditor;
