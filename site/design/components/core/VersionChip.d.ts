import * as React from "react";

/**
 * VersionChip — a semver token (mono pill) with capture-status dot.
 * The core navigation atom of the timeline, explorer, and compare views.
 *
 * @startingPoint section="Core" subtitle="Semver token with status dot" viewport="700x150"
 */
export interface VersionChipProps {
  /** The semver string, rendered verbatim (e.g. "2.1.38"). */
  version: string;
  /** Capture status — drives the dot + dimming. @default "ok" */
  status?: "ok" | "fail" | "aux";
  /** Selected/active styling (sapphire). @default false */
  selected?: boolean;
  /** Show the leading status dot. @default true */
  showDot?: boolean;
  /** @default "md" */
  size?: "sm" | "md" | "lg";
  /** Element/component to render as. @default "button" */
  as?: any;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

export function VersionChip(props: VersionChipProps): JSX.Element;
