import * as React from "react";

/**
 * Button — the primary action control for Lineage chrome.
 *
 * @startingPoint section="Core" subtitle="Action control · 4 variants, 3 sizes" viewport="700x150"
 */
export interface ButtonProps {
  /** Visual weight. @default "primary" */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  /** Control height. @default "md" */
  size?: "sm" | "md" | "lg";
  /** Leading icon node (e.g. a Lucide <svg>). */
  iconLeft?: React.ReactNode;
  /** Trailing icon node. */
  iconRight?: React.ReactNode;
  /** Stretch to fill container width. @default false */
  block?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export function Button(props: ButtonProps): JSX.Element;
