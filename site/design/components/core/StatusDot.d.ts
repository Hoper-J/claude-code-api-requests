import * as React from "react";

/** StatusDot — small capture-status indicator. */
export interface StatusDotProps {
  /** ok = captured, fail = no capture, aux = auxiliary, active = selected. @default "ok" */
  status?: "ok" | "fail" | "aux" | "active";
  /** Diameter in px. @default 8 */
  size?: number;
  /** Render a soft halo ring. @default false */
  pulse?: boolean;
  style?: React.CSSProperties;
}

export function StatusDot(props: StatusDotProps): JSX.Element;
