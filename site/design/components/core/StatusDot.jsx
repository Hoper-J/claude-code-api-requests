import React from "react";

/**
 * StatusDot — a small capture-status indicator.
 * ok = captured, fail = no capture, aux = auxiliary inference.
 */
export function StatusDot({ status = "ok", size = 8, pulse = false, style, ...rest }) {
  const colors = {
    ok: "var(--add-marker)",
    fail: "var(--text-faint)",
    aux: "var(--accent)",
    active: "var(--brand)",
  };
  const ring = {
    ok: "var(--add-edge)",
    fail: "var(--line-strong)",
    aux: "var(--amber-100)",
    active: "var(--brand-tint)",
  };
  const c = colors[status] || colors.ok;
  const filled = status !== "fail";

  return (
    <span
      role="img"
      aria-label={status}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "var(--radius-pill)",
        background: filled ? c : "transparent",
        border: filled ? "none" : `1.5px solid ${ring[status]}`,
        boxShadow: pulse ? `0 0 0 3px ${ring[status]}` : "none",
        flex: "0 0 auto",
        ...style,
      }}
      {...rest}
    />
  );
}
