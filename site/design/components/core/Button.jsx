import React from "react";

/**
 * Button — the primary action control.
 * Hanken Grotesk, low radius, restrained press feedback.
 */
export function Button({
  variant = "primary",
  size = "md",
  iconLeft = null,
  iconRight = null,
  block = false,
  disabled = false,
  type = "button",
  onClick,
  children,
  style,
  ...rest
}) {
  const sizes = {
    sm: { height: "var(--control-h-sm)", padding: "0 10px", font: "var(--t-sm)", gap: "5px" },
    md: { height: "var(--control-h)", padding: "0 14px", font: "var(--t-ui)", gap: "7px" },
    lg: { height: "var(--control-h-lg)", padding: "0 18px", font: "var(--t-body)", gap: "8px" },
  };
  const s = sizes[size] || sizes.md;

  const variants = {
    primary: {
      background: "var(--brand)",
      color: "var(--text-on-brand)",
      border: "1px solid var(--brand)",
    },
    secondary: {
      background: "var(--surface-card)",
      color: "var(--text-strong)",
      border: "1px solid var(--line-strong)",
    },
    ghost: {
      background: "transparent",
      color: "var(--text-body)",
      border: "1px solid transparent",
    },
    danger: {
      background: "var(--surface-card)",
      color: "var(--del-text)",
      border: "1px solid var(--del-edge)",
    },
  };
  const v = variants[variant] || variants.primary;

  const base = {
    display: block ? "flex" : "inline-flex",
    width: block ? "100%" : undefined,
    alignItems: "center",
    justifyContent: "center",
    gap: s.gap,
    height: s.height,
    padding: s.padding,
    fontFamily: "var(--font-ui)",
    fontSize: s.font,
    fontWeight: "var(--w-medium)",
    letterSpacing: "var(--track-ui)",
    lineHeight: 1,
    borderRadius: "var(--radius-2)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "var(--transition-ui), transform var(--dur-1) var(--ease-standard)",
    userSelect: "none",
    whiteSpace: "nowrap",
    ...v,
    ...style,
  };

  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);

  const interact = !disabled
    ? {
        onMouseEnter: () => setHover(true),
        onMouseLeave: () => { setHover(false); setPress(false); },
        onMouseDown: () => setPress(true),
        onMouseUp: () => setPress(false),
      }
    : {};

  const hoverStyle = hover && !disabled ? hoverFor(variant) : {};
  const pressStyle = press && !disabled ? { transform: "translateY(0.5px)" } : {};

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...hoverStyle, ...pressStyle }}
      {...interact}
      {...rest}
    >
      {iconLeft ? <span style={iconWrap}>{iconLeft}</span> : null}
      {children}
      {iconRight ? <span style={iconWrap}>{iconRight}</span> : null}
    </button>
  );
}

const iconWrap = {
  display: "inline-flex",
  alignItems: "center",
  flex: "0 0 auto",
};

function hoverFor(variant) {
  switch (variant) {
    case "primary":
      return { background: "var(--brand-hover)", borderColor: "var(--brand-hover)" };
    case "secondary":
      return { background: "var(--surface-well)", borderColor: "var(--line-strong)" };
    case "ghost":
      return { background: "var(--surface-well)" };
    case "danger":
      return { background: "var(--del-surface)" };
    default:
      return {};
  }
}
