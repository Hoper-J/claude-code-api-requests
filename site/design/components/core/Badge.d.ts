import * as React from "react";

/** Badge — compact count/label; tone follows diff semantics. */
export interface BadgeProps {
  /** @default "neutral" */
  tone?: "neutral" | "brand" | "add" | "del" | "mod" | "accent";
  /** Use mono family (for counts like "+1,284"). @default false */
  mono?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Badge(props: BadgeProps): JSX.Element;
