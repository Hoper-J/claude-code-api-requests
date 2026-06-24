import React from "react";
import { Badge } from "../core/Badge.jsx";

/**
 * DeltaSummary — renders a structured, locale-agnostic change_delta
 * into a localized "what changed" line. The delta is data from the
 * build; all words come from `labels` (the locale file). This is how
 * Lineage adds a language without re-running the data build.
 * Mirrors ../../public/kit-lib.jsx — the runtime source of truth.
 */
export function DeltaSummary({ delta, labels = EN, tone = "inline", style, ...rest }) {
  const L = { ...EN, ...labels };
  if (!delta) {
    return <span style={faint}>{L.first}</span>;
  }
  const added = (delta.tools_added || []).length;
  const removed = (delta.tools_removed || []).length;
  const modified = (delta.tools_modified || []).length;
  const betaAdd = (delta.betas_added || []).length;
  const betaRem = (delta.betas_removed || []).length;
  const remAdd = delta.reminders_added || [];
  const remRem = delta.reminders_removed || [];
  const rn = (k) => (L.reminderNames && L.reminderNames[k]) || k;
  const chars = delta.system_chars_delta || 0;
  const model = delta.model_changed || null;
  const maxc = delta.max_tokens_changed || null;
  const effc = delta.effort_changed || null;

  const parts = [];
  if (added) parts.push(<Badge key="a" tone="add" mono>+{added} {plural(added, L.tool, L.tools)}</Badge>);
  if (removed) parts.push(<Badge key="r" tone="del" mono>−{removed} {plural(removed, L.tool, L.tools)}</Badge>);
  if (modified) parts.push(<Badge key="m" tone="mod" mono>~{modified} {plural(modified, L.tool, L.tools)}</Badge>);
  if (betaAdd) parts.push(<Badge key="ba" tone="brand" mono>+{betaAdd} {plural(betaAdd, L.beta, L.betas)}</Badge>);
  if (betaRem) parts.push(<Badge key="br" tone="del" mono>−{betaRem} {plural(betaRem, L.beta, L.betas)}</Badge>);
  remAdd.forEach(k => parts.push(<Badge key={"cxa" + k} tone="add">+{rn(k)}</Badge>));
  remRem.forEach(k => parts.push(<Badge key={"cxr" + k} tone="del">−{rn(k)}</Badge>));
  (delta.body_keys_added || []).forEach(k => parts.push(<Badge key={"bka" + k} tone="add" mono>+body.{k}</Badge>));
  (delta.body_keys_removed || []).forEach(k => parts.push(<Badge key={"bkr" + k} tone="del" mono>−body.{k}</Badge>));
  if (delta.system_blocks_changed) parts.push(<Badge key="sb" tone="mod" mono>{L.systemBlocks} {delta.system_blocks_changed.from}→{delta.system_blocks_changed.to}</Badge>);
  if (delta.context_body_changed && !remAdd.length && !remRem.length) parts.push(<Badge key="cxm" tone="mod">~{L.context}</Badge>);
  if (chars) parts.push(<Badge key="c" tone="neutral" mono>{chars > 0 ? "+" : ""}{formatNum(chars)} {L.chars}</Badge>);
  if (maxc) parts.push(<Badge key="mx" tone="mod" mono>{L.maxTokens} {formatNum(maxc.to != null ? maxc.to : 0)}</Badge>);
  if (effc) parts.push(<Badge key="ef" tone="accent" mono>effort {effc.to != null ? effc.to : "—"}</Badge>);
  if (model) parts.push(<Badge key="o" tone="accent">{L.modelChanged}</Badge>);

  if (parts.length === 0) {
    return <span style={faint}>{L.noChange}</span>;
  }

  const editorial = tone === "editorial";
  return (
    <span
      style={{
        display: "inline-flex", flexWrap: "wrap", alignItems: "center", gap: "6px",
        fontFamily: editorial ? "var(--font-editorial)" : "var(--font-ui)",
        fontSize: editorial ? "var(--t-h3)" : "var(--t-sm)",
        color: "var(--text-body)",
        ...style,
      }}
      {...rest}
    >
      {parts.reduce((acc, el, i) => {
        if (i > 0) acc.push(<span key={"s" + i} style={{ color: "var(--text-faint)" }}>·</span>);
        acc.push(el);
        return acc;
      }, [])}
    </span>
  );
}

const faint = { color: "var(--text-faint)", fontFamily: "var(--font-ui)", fontSize: "var(--t-sm)" };
function plural(n, one, many) { return n === 1 ? one : many; }
function formatNum(n) { return n.toLocaleString("en-US"); }

/** Default English label pack. A locale file supplies its own. */
const EN = {
  tool: "tool", tools: "tools", modified: "modified",
  chars: "chars", beta: "beta", betas: "betas", maxTokens: "max_tokens", modelChanged: "model changed",
  noChange: "No payload change", first: "First captured version", context: "context",
  systemBlocks: "system blocks",
  reminderNames: {},
};

export const DeltaSummaryLabelsEN = EN;
