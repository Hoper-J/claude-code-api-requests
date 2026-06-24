import React from "react";
import { Badge } from "../core/Badge.jsx";
import { CodeBlock } from "./CodeBlock.jsx";

/**
 * ToolCard — an expandable tool definition: name, description, and
 * pretty-printed input_schema. `change` marks add/remove/modify in
 * a diff/compare context.
 */
export function ToolCard({
  name,
  description = "",
  schema = null,
  change = null,
  changeLabels = null,
  labels = null,
  defaultOpen = false,
  style,
  ...rest
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  const CL = { added: "added", removed: "removed", modified: "modified", ...(changeLabels || {}) };
  const changeBadge = {
    added: <Badge tone="add">{CL.added}</Badge>,
    removed: <Badge tone="del">{CL.removed}</Badge>,
    modified: <Badge tone="mod">{CL.modified}</Badge>,
  }[change];

  const accent = {
    added: "var(--add-edge)",
    removed: "var(--del-edge)",
    modified: "var(--mod-edge)",
  }[change] || "var(--line-hairline)";

  const schemaText = schema != null
    ? (typeof schema === "string" ? schema : JSON.stringify(schema, null, 2))
    : null;

  return (
    <div
      style={{
        border: "1px solid var(--line-hairline)",
        borderLeft: `2px solid ${accent}`,
        borderRadius: "var(--radius-3)",
        background: "var(--surface-card)",
        overflow: "hidden",
        opacity: change === "removed" ? 0.82 : 1,
        ...style,
      }}
      {...rest}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex", alignItems: "center", gap: "10px", width: "100%",
          padding: "12px 14px", border: "none", background: "none",
          cursor: "pointer", textAlign: "left",
        }}
      >
        <Chevron open={open} />
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: "var(--t-code)",
          fontWeight: "var(--w-semibold)", color: "var(--text-strong)",
          textDecoration: change === "removed" ? "line-through" : "none",
        }}>{name}</span>
        {changeBadge}
        <span style={{ flex: 1 }} />
        {!open && description ? (
          <span style={{
            fontFamily: "var(--font-ui)", fontSize: "var(--t-sm)",
            color: "var(--text-faint)", whiteSpace: "nowrap",
            overflow: "hidden", textOverflow: "ellipsis", maxWidth: "46%",
          }}>{firstLine(description)}</span>
        ) : null}
      </button>

      {open && (
        <div style={{ padding: "0 14px 14px", display: "grid", gap: "12px" }}>
          {description ? (
            <p style={{
              margin: 0, fontFamily: "var(--font-mono)", fontSize: "var(--t-code-sm)",
              lineHeight: "var(--lh-code)", color: "var(--text-body)",
              whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>{description}</p>
          ) : null}
          {schemaText ? (
            <CodeBlock label="input_schema" dense copyText={schemaText} labels={labels}>
              {schemaText}
            </CodeBlock>
          ) : null}
        </div>
      )}
    </div>
  );
}

function firstLine(s) {
  const line = String(s).split("\n")[0];
  return line.length > 90 ? line.slice(0, 90) + "…" : line;
}

function Chevron({ open }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
         stroke="var(--text-faint)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
         style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform var(--dur-2) var(--ease-standard)", flex: "0 0 auto" }}>
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}
