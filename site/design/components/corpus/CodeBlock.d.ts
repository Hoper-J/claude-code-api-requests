import * as React from "react";

/**
 * CodeBlock — canonical container for verbatim corpus (system prompt
 * blocks, pretty-printed schemas). Mono, sunken well, copy + collapse.
 *
 * @startingPoint section="Corpus" subtitle="Mono well for verbatim payload" viewport="700x260"
 */
export interface CodeBlockProps {
  /** Corpus content — rendered as-is in mono with preserved whitespace. */
  children?: React.ReactNode;
  /** Optional overline label (e.g. "System prompt · block 2"). */
  label?: React.ReactNode;
  /** When set, shows a copy button that writes this exact string. */
  copyText?: string | null;
  /** Allow collapse with a fade + "show full block". @default false */
  collapsible?: boolean;
  /** Collapsed pixel height. @default 240 */
  collapsedHeight?: number;
  /** Tighter padding + 12px mono for dense schemas. @default false */
  dense?: boolean;
  /** Localized chrome for the copy/collapse buttons (defaults to English). */
  labels?: { copy?: string; copied?: string; collapse?: string; expand?: string } | null;
  style?: React.CSSProperties;
}

export function CodeBlock(props: CodeBlockProps): JSX.Element;
