import React from "react";

/**
 * SegmentedControl — a compact pill group for binary/few-way
 * switches: locale (EN / 中文), theme (sun / moon), diff mode.
 */
export function SegmentedControl({ options = [], value, onChange, size = "md", style, ...rest }) {
  const [internal, setInternal] = React.useState(options[0] && options[0].value);
  const active = value !== undefined ? value : internal;
  const select = (v) => { if (value === undefined) setInternal(v); onChange && onChange(v); };

  const h = size === "sm" ? "26px" : "32px";
  const fs = size === "sm" ? "var(--t-sm)" : "var(--t-ui)";

  return (
    <div
      role="group"
      style={{
        display: "inline-flex", padding: "2px", gap: "2px",
        background: "var(--surface-well)",
        border: "1px solid var(--line-hairline)",
        borderRadius: "var(--radius-2)",
        ...style,
      }}
      {...rest}
    >
      {options.map((o) => {
        const on = o.value === active;
        return (
          <button
            key={o.value}
            aria-pressed={on}
            title={o.title || undefined}
            onClick={() => select(o.value)}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              gap: "6px", height: h, padding: "0 12px",
              border: "1px solid " + (on ? "var(--line-hairline)" : "transparent"),
              borderRadius: "var(--radius-1)",
              background: on ? "var(--surface-card)" : "transparent",
              boxShadow: on ? "var(--shadow-sm)" : "none",
              cursor: "pointer",
              fontFamily: "var(--font-ui)", fontSize: fs,
              fontWeight: on ? "var(--w-semibold)" : "var(--w-medium)",
              letterSpacing: "var(--track-ui)",
              color: on ? "var(--text-strong)" : "var(--text-faint)",
              transition: "var(--transition-ui)",
            }}
          >
            {o.icon ? <span style={{ display: "inline-flex" }}>{o.icon}</span> : null}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
