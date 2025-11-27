import { type CSSProperties } from "react";

import { compactMap, singleOrNull } from "../../utils";
import { mergeLayoutBounds } from "../math/multi";
import type { Layout } from "../math/types";
import type { DesignValue, ElementDef } from "../value";
import SelectionResize from "./SelectionResize";
import { type Selection } from "./selectionState";

const outlineStyles: CSSProperties = {
  outline: "2px solid blue",
};

const dashedOutlineStyles: CSSProperties = {
  backgroundImage:
    "linear-gradient(90deg, #fff 60%, rgba(53, 71, 90, .2) 0), linear-gradient(180deg, #fff 60%, rgba(53, 71, 90, .2) 0), linear-gradient(90deg, #fff 60%, rgba(53, 71, 90, .2) 0), linear-gradient(180deg, #fff 60%, rgba(53, 71, 90, .2) 0), linear-gradient(90deg, rgba(57, 76, 96, .15), rgba(57, 76, 96, .15)), linear-gradient(180deg, rgba(57, 76, 96, .15), rgba(57, 76, 96, .15)), linear-gradient(90deg, rgba(57, 76, 96, .15), rgba(57, 76, 96, .15)), linear-gradient(180deg, rgba(57, 76, 96, .15), rgba(57, 76, 96, .15))",
  backgroundPosition:
    "top, 100%, bottom, 0, center 2px, calc(100% - 2px), center calc(100% - 2px), 2px",
  backgroundRepeat:
    "repeat-x, repeat-y, repeat-x, repeat-y, no-repeat, no-repeat, no-repeat, no-repeat",
  backgroundSize:
    "6px 2px, 2px 6px, 6px 2px, 2px 6px, calc(100% - 6px) 1px, 1px calc(100% - 4px), calc(100% - 6px) 1px, 1px calc(100% - 4px)",
  boxShadow: "0 0 0 1px rgba(57, 76, 96, .15)",
};

interface SelectionAreaProps {
  selection: Selection;
  value: DesignValue;
  onSelectionChange: (newSelection: Selection | null) => void;
  onElementsChange: (elements: ElementDef[]) => void;
  onResizeEnd?: () => void;
  isEditable: boolean;
}

function resolveSelection(elements: ElementDef[]): {
  layout: Layout;
  style: "node" | "area";
  elements: ElementDef[];
} {
  let selectedNodes: ElementDef[] = [];
  // Multiple nodes and single nodes need different selection styles
  let selectedStyle: "node" | "area";

  const onlyChild = singleOrNull(elements);

  // If a single node is selected, use that node's layout information
  if (onlyChild) {
    selectedNodes = [onlyChild];
    selectedStyle = "node";
  } else {
    selectedNodes = elements;
    selectedStyle = "area";
  }

  return {
    layout: {
      bounds: mergeLayoutBounds(selectedNodes),
    },
    style: selectedStyle,
    elements: selectedNodes,
  };
}

const SelectionArea = ({
  selection,
  value,
  onElementsChange,
  onResizeEnd,
  isEditable,
}: SelectionAreaProps) => {
  const { ids } = selection;
  const elements = compactMap(ids, (id) => value.elements[id]);

  if (!elements.length) {
    return null;
  }

  const {
    style: selectionStyle,
    layout: { bounds: selectionBounds },
    elements: selectedNodes,
  } = resolveSelection(elements);

  return (
    <>
      {elements.map(({ id, bounds }) => {
        return (
          <div
            key={id}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              translate: `${bounds.left}px ${bounds.top}px`,
              width: bounds.width,
              height: bounds.height,
              pointerEvents: "none",
              ...outlineStyles,
            }}
          />
        );
      })}
      {selectionStyle === "area" && isEditable ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            translate: `${selectionBounds.left}px ${selectionBounds.top}px`,
            width: selectionBounds.width,
            height: selectionBounds.height,
            pointerEvents: "none",
            ...dashedOutlineStyles,
          }}
        />
      ) : null}
      {isEditable && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            translate: `${selectionBounds.left}px ${selectionBounds.top}px`,
            width: selectionBounds.width,
            height: selectionBounds.height,
            pointerEvents: "none",
          }}
        >
          <SelectionResize
            elements={selectedNodes}
            onElementsChange={onElementsChange}
            onResizeEnd={onResizeEnd}
          />
        </div>
      )}
    </>
  );
};

export default SelectionArea;
