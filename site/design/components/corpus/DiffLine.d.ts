import * as React from "react";

/** DiffLine — one row of a precomputed line diff (mono). */
export interface DiffLineProps {
  /** Row semantics. @default "context" */
  kind?: "add" | "del" | "mod" | "context";
  /** Old-side line number. */
  oldNo?: number | null;
  /** New-side line number. */
  newNo?: number | null;
  /** Show the two-column line-number gutter. @default false */
  showNumbers?: boolean;
  /** Word-level segments for intra-line highlight (from the build's
   *  modified-pair marker). When set, overrides `children`. */
  segs?: Array<{ text: string; hl?: boolean }> | null;
  /** Verbatim line content. */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function DiffLine(props: DiffLineProps): JSX.Element;
