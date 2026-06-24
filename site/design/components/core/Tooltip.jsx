import React from "react";

/**
 * Tooltip — a lightweight hover/focus popover that gives a terse label the one
 * line of context it needs (a status badge, an abbreviated chip). Light card
 * surface + pop shadow, matched to the design tokens; reveals on hover and on
 * keyboard focus, and renders the trigger bare when `tip` is empty.
 */
export function Tooltip({ tip, placement = "top", children, style, ...rest }) {
  const [open, setOpen] = React.useState(false);
  if (tip == null || tip === "") return children;
  const place = placement === "bottom"
    ? { top: "calc(100% + 7px)" }
    : { bottom: "calc(100% + 7px)" };

  return (
    <span
      style={{ position: "relative", display: "inline-flex", ...style }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
      {...rest}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            ...place,
            zIndex: 40,
            width: "max-content",
            maxWidth: "248px",
            padding: "7px 10px",
            fontFamily: "var(--font-ui)",
            fontSize: "var(--t-caption)",
            fontWeight: "var(--w-medium)",
            lineHeight: 1.5,
            letterSpacing: "var(--track-ui)",
            textAlign: "left",
            whiteSpace: "normal",
            color: "var(--text-body)",
            background: "var(--surface-card)",
            border: "1px solid var(--line-strong)",
            borderRadius: "var(--radius-2)",
            boxShadow: "var(--shadow-pop)",
            pointerEvents: "none",
          }}
        >
          {tip}
        </span>
      )}
    </span>
  );
}
