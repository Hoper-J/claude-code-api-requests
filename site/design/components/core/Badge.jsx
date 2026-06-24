import React from "react";

/**
 * Badge — a compact count or label. Tone maps to diff semantics
 * so "+2", "−1", "15 tools" read consistently across the app.
 */
export function Badge({ tone = "neutral", mono = false, children, style, ...rest }) {
  const tones = {
    neutral: { bg: "var(--surface-well)", fg: "var(--text-muted)", bd: "var(--line-hairline)" },
    brand:   { bg: "var(--brand-tint)", fg: "var(--brand-press)", bd: "transparent" },
    add:     { bg: "var(--add-surface)", fg: "var(--add-text)", bd: "transparent" },
    del:     { bg: "var(--del-surface)", fg: "var(--del-text)", bd: "transparent" },
    mod:     { bg: "var(--mod-surface)", fg: "var(--mod-text)", bd: "transparent" },
    accent:  { bg: "var(--amber-100)", fg: "var(--amber-600)", bd: "transparent" },
  };
  const t = tones[tone] || tones.neutral;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        height: "20px",
        padding: "0 7px",
        fontFamily: mono ? "var(--font-mono)" : "var(--font-ui)",
        fontSize: mono ? "var(--t-micro)" : "var(--t-caption)",
        fontWeight: "var(--w-semibold)",
        letterSpacing: mono ? "var(--track-wide)" : "var(--track-ui)",
        lineHeight: 1,
        borderRadius: "var(--radius-2)",
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.bd}`,
        whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
