import * as React from "react";

export interface ChangeDelta {
  tools_added?: string[];
  tools_removed?: string[];
  tools_modified?: string[];
  betas_added?: string[];
  betas_removed?: string[];
  /** Injected-context reminder kinds that appeared/disappeared (e.g. "auto-memory"). */
  reminders_added?: string[];
  reminders_removed?: string[];
  /** Injected-context body changed without a reminder-kind change. */
  context_body_changed?: boolean;
  system_chars_delta?: number;
  max_tokens_changed?: { from: number | null; to: number | null } | null;
  effort_changed?: { from: string | null; to: string | null } | null;
  model_changed?: { from: string; to: string } | null;
  /** Top-level request body keys that appeared/disappeared — the NEW-field tripwire. */
  body_keys_added?: string[];
  body_keys_removed?: string[];
  /** system block COUNT changed (a structural block added/removed). */
  system_blocks_changed?: { from: number; to: number } | null;
}

export interface DeltaLabels {
  tool?: string; tools?: string; modified?: string; chars?: string;
  beta?: string; betas?: string; maxTokens?: string;
  modelChanged?: string; noChange?: string; first?: string; context?: string; systemBlocks?: string;
  /** Localized display names for reminder kinds (key = kind id). */
  reminderNames?: Record<string, string>;
}

/**
 * DeltaSummary — renders a structured change_delta into a localized
 * "what changed" line. Words come from `labels`; the delta is data.
 */
export interface DeltaSummaryProps {
  /** Build-time structured delta. Null/undefined ⇒ "first version". */
  delta?: ChangeDelta | null;
  /** Locale label pack (defaults to English). */
  labels?: DeltaLabels;
  /** "inline" (sans, timeline rows) or "editorial" (serif, headers). @default "inline" */
  tone?: "inline" | "editorial";
  style?: React.CSSProperties;
}

export function DeltaSummary(props: DeltaSummaryProps): JSX.Element;
export const DeltaSummaryLabelsEN: Required<DeltaLabels>;
