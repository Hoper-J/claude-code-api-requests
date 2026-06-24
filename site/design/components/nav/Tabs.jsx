import React from "react";

/**
 * Tabs — underline tab bar for switching panels within a view
 * (e.g. System prompt / Tools / Metadata on the explorer).
 */
export function Tabs({ items = [], value, onChange, style, ...rest }) {
  const [internal, setInternal] = React.useState(items[0] && items[0].id);
  const active = value !== undefined ? value : internal;
  const select = (id) => { if (value === undefined) setInternal(id); onChange && onChange(id); };

  return (
    <div
      role="tablist"
      style={{
        display: "flex", gap: "2px", alignItems: "flex-end",
        borderBottom: "1px solid var(--line-hairline)",
        ...style,
      }}
      {...rest}
    >
      {items.map((it) => {
        const on = it.id === active;
        return (
          <button
            key={it.id}
            role="tab"
            aria-selected={on}
            onClick={() => select(it.id)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              padding: "9px 13px", border: "none", background: "none",
              cursor: "pointer", position: "relative", top: "1px",
              fontFamily: "var(--font-ui)", fontSize: "var(--t-ui)",
              fontWeight: on ? "var(--w-semibold)" : "var(--w-medium)",
              letterSpacing: "var(--track-ui)",
              color: on ? "var(--text-strong)" : "var(--text-faint)",
              borderBottom: `2px solid ${on ? "var(--brand)" : "transparent"}`,
              transition: "var(--transition-ui)",
            }}
          >
            {it.label}
            {it.count != null && (
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: "var(--t-micro)",
                color: on ? "var(--brand)" : "var(--text-faint)",
                background: on ? "var(--brand-tint)" : "var(--surface-well)",
                borderRadius: "var(--radius-pill)", padding: "1px 6px",
              }}>{it.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
