import type { Bounds } from "../math/types";

export type ID = string;

interface Element {
  id: ID;
  bounds: Bounds;
  transparency?: number;
  name?: string;
}

export interface ShapeViewBox {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

export interface ShapeStroke {
  color: string;
  weight: number;
  dasharray?: [number, number];
}

export type ShapeFill = { color: string };

export interface ShapePath {
  d: string;
  stroke?: ShapeStroke;
  strokeCache?: ShapeStroke;
  fill?: ShapeFill;
  fillCache?: ShapeFill;
}

export interface ShapeDef extends Element {
  type: "shape";
  paths: ShapePath[];
  viewBox: ShapeViewBox;
}

export type ElementDef = ShapeDef;

export interface DesignValue {
  elements: Record<ID, ElementDef>;
  attributes: {
    width: number;
    height: number;
  };
}
