import React from "react";

/**
 * DiffLine — one row of a precomputed line diff. Renders the
 * add/remove/modify gutter marker, optional dual line numbers, and
 * the verbatim content in mono. `segs` (from the build's modified-
 * pair marker) enables word-level intra-line highlight.
 * Mirrors ../../public/kit-lib.jsx — the runtime source of truth.
 */
export function DiffLine({
  kind = "context",
  oldNo = null,
  newNo = null,
  showNumbers = false,
  segs = null,
  children,
  style,
  ...rest
}) {
  const palette = {
    add:     { bg: "var(--add-surface)", fg: "var(--add-text)", mark: "var(--add-marker)", glyph: "+", hl: "var(--add-edge)" },
    del:     { bg: "var(--del-surface)", fg: "var(--del-text)", mark: "var(--del-marker)", glyph: "−", hl: "var(--del-edge)" },
    mod:     { bg: "var(--mod-surface)", fg: "var(--mod-text)", mark: "var(--mod-text)", glyph: "~", hl: "var(--mod-edge)" },
    context: { bg: "transparent", fg: "var(--text-muted)", mark: "var(--text-faint)", glyph: " ", hl: "transparent" },
  };
  const p = palette[kind] || palette.context;

  const num = (n) => (
    <span style={{
      width: 38, flex: "0 0 38px", textAlign: "right", paddingRight: 8,
      color: "var(--text-faint)", userSelect: "none",
      fontSize: "var(--t-code-sm)",
    }}>{n != null ? n : ""}</span>
  );

  const body = segs
    ? segs.map((s, i) => s.hl
        ? <span key={i} style={{ background: p.hl, borderRadius: 2, color: kind === "del" ? "var(--del-text)" : kind === "add" ? "var(--add-text)" : p.fg, fontWeight: "var(--w-medium)" }}>{s.text}</span>
        : <span key={i}>{s.text}</span>)
    : children;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        background: p.bg,
        fontFamily: "var(--font-mono)",
        fontSize: "var(--t-code)",
        lineHeight: "var(--lh-code)",
        ...style,
      }}
      {...rest}
    >
      {showNumbers && (
        <div style={{ display: "flex", borderRight: "1px solid var(--line-faint)" }}>
          {num(kind !== "add" ? oldNo : null)}
          {num(kind !== "del" ? newNo : null)}
        </div>
      )}
      <span style={{
        width: 26, flex: "0 0 26px", textAlign: "center", userSelect: "none",
        fontWeight: "var(--w-semibold)", color: p.mark,
      }}>{p.glyph}</span>
      <span style={{
        flex: "1 1 auto", color: p.fg, whiteSpace: "pre-wrap",
        wordBreak: "break-word", paddingRight: 12,
      }}>{body}</span>
    </div>
  );
}
