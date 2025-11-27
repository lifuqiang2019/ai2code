import { isBoundsHitLayout } from "../../math/hitTests";
import type { Bounds } from "../../math/types";
import type { ElementDef } from "../../value";

export const isBoundsHitNode = ({
  element,
  bounds,
}: {
  element: ElementDef;
  bounds: Bounds;
}) => {
  return isBoundsHitLayout({ target: element, bounds });
};
