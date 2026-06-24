import React from "react";
import { StatusDot } from "./StatusDot.jsx";

/**
 * VersionChip — a semver token, set in mono. The signature
 * navigation atom of Lineage. Optional capture-status dot.
 */
export function VersionChip({
  version,
  status = "ok",
  selected = false,
  showDot = true,
  size = "md",
  as = null,
  onClick,
  style,
  ...rest
}) {
  const sizes = {
    sm: { height: "20px", padding: "0 7px", font: "var(--t-micro)" },
    md: { height: "24px", padding: "0 9px", font: "var(--t-caption)" },
    lg: { height: "30px", padding: "0 12px", font: "var(--t-sm)" },
  };
  const s = sizes[size] || sizes.md;
  const Tag = as || (onClick ? "button" : "span");
  const isFail = status === "fail";

  const [hover, setHover] = React.useState(false);

  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    height: s.height,
    padding: s.padding,
    fontFamily: "var(--font-mono)",
    fontSize: s.font,
    fontWeight: "var(--w-medium)",
    letterSpacing: "var(--track-wide)",
    lineHeight: 1,
    borderRadius: "var(--radius-pill)",
    border: selected ? "1px solid var(--brand)" : "1px solid var(--line-strong)",
    background: selected ? "var(--brand-tint)" : hover ? "var(--surface-well)" : "var(--surface-card)",
    color: isFail ? "var(--text-faint)" : selected ? "var(--brand-press)" : "var(--text-strong)",
    cursor: onClick ? "pointer" : "default",
    transition: "var(--transition-ui)",
    whiteSpace: "nowrap",
    userSelect: "none",
    ...style,
  };

  return (
    <Tag
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={base}
      {...rest}
    >
      {showDot ? <StatusDot status={selected ? "active" : status} size={6} /> : null}
      <span>{version}</span>
    </Tag>
  );
}
