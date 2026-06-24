import * as React from "react";

/** Tag — quiet outlined pill for categorical labels. */
export interface TagProps {
  children?: React.ReactNode;
  /** Show hover affordance. @default false */
  interactive?: boolean;
  /** When provided, renders a × remove affordance. */
  onRemove?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

export function Tag(props: TagProps): JSX.Element;
