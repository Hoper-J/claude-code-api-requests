import * as React from "react";

/** Tooltip — lightweight hover/focus popover for a terse label's explanation. */
export interface TooltipProps {
  /** Tooltip body; when empty the trigger renders bare (no popover, no wrapper). */
  tip?: React.ReactNode;
  /** Which side of the trigger the popover sits on. @default "top" */
  placement?: "top" | "bottom";
  /** The trigger element (e.g. a Badge). */
  children?: React.ReactNode;
  /** Merged onto the inline-flex trigger wrapper. */
  style?: React.CSSProperties;
}

export function Tooltip(props: TooltipProps): JSX.Element;
