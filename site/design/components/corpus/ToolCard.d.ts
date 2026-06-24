import * as React from "react";

/**
 * ToolCard — expandable tool definition (name, description, input_schema).
 *
 * @startingPoint section="Corpus" subtitle="Expandable tool definition card" viewport="700x150"
 */
export interface ToolCardProps {
  /** Tool name, rendered verbatim in mono (e.g. "Bash"). */
  name: string;
  /** Verbatim tool description (mono, whitespace preserved). */
  description?: string;
  /** input_schema object or pre-stringified JSON. */
  schema?: object | string | null;
  /** Change marker for diff/compare context. */
  change?: "added" | "removed" | "modified" | null;
  /** Localized change-badge words (defaults to English). */
  changeLabels?: { added?: string; removed?: string; modified?: string } | null;
  /** Localized chrome for the nested schema CodeBlock (copy/collapse buttons). */
  labels?: { copy?: string; copied?: string; collapse?: string; expand?: string } | null;
  /** Start expanded. @default false */
  defaultOpen?: boolean;
  style?: React.CSSProperties;
}

export function ToolCard(props: ToolCardProps): JSX.Element;
