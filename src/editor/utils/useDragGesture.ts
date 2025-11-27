import { type PointerEvent, type PointerEventHandler, useRef } from "react";

interface DragState<Snapshot> {
  startX: number;
  startY: number;
  snapshot: Snapshot;
}

interface UseDragGestureProps<Snapshot> {
  onMove: (options: {
    deltaX: number;
    deltaY: number;
    snapshot: Snapshot;
  }) => void;
  onEnd?: () => void;
}

const useDragGesture = <Snapshot>({
  onMove,
  onEnd,
}: UseDragGestureProps<Snapshot>) => {
  const dragStateRef = useRef<DragState<Snapshot> | null>(null);

  const onDragEnd = () => {
    if (!dragStateRef.current) {
      return;
    }

    dragStateRef.current = null;
    onEnd?.();
  };

  const onDragStart = (e: PointerEvent<Element>, snapshot: Snapshot) => {
    // In drag scenarios, typically we should only consider the primary mouse button or touch events, in both cases buttons equals 1
    if (e.buttons !== 1) {
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);

    dragStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      snapshot,
    };
  };

  // Events tracked using pointer capture should use the corresponding lostpointercapture event to listen for end events,
  // rather than using pointerup or pointercancel.
  // https://developer.mozilla.org/en-US/docs/Web/API/Element/lostpointercapture_event
  const onLostPointerCapture: PointerEventHandler<Element> = () => {
    onDragEnd();
  };

  const onPointerMove: PointerEventHandler<Element> = (e) => {
    const dragState = dragStateRef.current;

    if (!dragState) {
      return;
    }
    if (e.buttons !== 1) {
      onDragEnd();
      return;
    }

    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;

    onMove({ deltaX, deltaY, snapshot: dragState.snapshot });
  };

  return {
    onDragStart,
    onDragEnd,
    dragProps: { onPointerMove, onLostPointerCapture },
  };
};

export default useDragGesture;
