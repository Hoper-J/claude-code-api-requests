import React from "react";

/**
 * Tag — a small outlined pill for categorical labels
 * (tool groups, header families, regimes). Quieter than Badge.
 */
export function Tag({ children, onRemove, interactive = false, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  return (
    <span
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        height: "22px",
        padding: "0 9px",
        fontFamily: "var(--font-ui)",
        fontSize: "var(--t-caption)",
        fontWeight: "var(--w-medium)",
        letterSpacing: "var(--track-ui)",
        lineHeight: 1,
        color: "var(--text-muted)",
        background: interactive && hover ? "var(--surface-well)" : "transparent",
        border: "1px solid var(--line-strong)",
        borderRadius: "var(--radius-pill)",
        cursor: interactive ? "pointer" : "default",
        transition: "var(--transition-ui)",
        whiteSpace: "nowrap",
        ...style,
      }}
      {...rest}
    >
      {children}
      {onRemove ? (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(e); }}
          aria-label="Remove"
          style={{
            display: "inline-flex", border: "none", background: "none",
            padding: 0, margin: 0, cursor: "pointer", color: "var(--text-faint)",
            fontFamily: "var(--font-mono)", fontSize: "12px", lineHeight: 1,
          }}
        >×</button>
      ) : null}
    </span>
  );
}
