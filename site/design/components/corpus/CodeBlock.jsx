import React from "react";

/**
 * CodeBlock — the canonical container for verbatim corpus
 * (system prompt blocks, pretty-printed schemas). Mono, sunken
 * well, optional copy affordance and collapse for long content.
 * Mirrors ../../public/kit-lib.jsx — the runtime source of truth.
 */
export function CodeBlock({
  children,
  label = null,
  copyText = null,
  collapsible = false,
  collapsedHeight = 240,
  dense = false,
  labels = null,
  style,
  ...rest
}) {
  const L = { copy: "copy", copied: "copied", collapse: "Collapse", expand: "Show full block", ...(labels || {}) };
  const [open, setOpen] = React.useState(!collapsible);
  const [copied, setCopied] = React.useState(false);

  const onCopy = () => {
    const text = copyText != null ? copyText : (typeof children === "string" ? children : "");
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1400); };
    const fallback = () => {
      try {
        const ta = document.createElement("textarea");
        ta.value = text; ta.style.position = "fixed"; ta.style.top = "-9999px";
        document.body.appendChild(ta); ta.focus(); ta.select();
        document.execCommand("copy"); document.body.removeChild(ta); done();
      } catch (e) { /* noop */ }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(fallback);
    } else { fallback(); }
  };

  return (
    <div
      style={{
        border: "1px solid var(--line-hairline)",
        borderRadius: "var(--radius-3)",
        background: "var(--surface-well)",
        overflow: "hidden",
        ...style,
      }}
      {...rest}
    >
      {(label || copyText != null) && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 12px", borderBottom: "1px solid var(--line-hairline)",
          background: "var(--surface-card)",
        }}>
          <span style={{
            fontFamily: "var(--font-ui)", fontSize: "var(--t-micro)",
            textTransform: "uppercase", letterSpacing: "var(--track-over)",
            fontWeight: "var(--w-semibold)", color: "var(--text-faint)",
          }}>{label}</span>
          {copyText != null && (
            <button onClick={onCopy} style={{ ...copyBtn, color: copied ? "var(--add-text)" : "var(--brand)" }}>
              <CopyGlyph check={copied} />
              {copied ? L.copied : L.copy}
            </button>
          )}
        </div>
      )}
      <div
        className="lin-scroll"
        style={{
          position: "relative",
          maxHeight: collapsible && !open ? collapsedHeight : "none",
          overflow: collapsible && !open ? "hidden" : "auto",
          padding: dense ? "12px 14px" : "16px 18px",
          fontFamily: "var(--font-mono)",
          fontSize: dense ? "var(--t-code-sm)" : "var(--t-code)",
          lineHeight: "var(--lh-code)",
          color: "var(--text-body)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          tabSize: 2,
        }}
      >
        {children}
        {collapsible && !open && (
          <div style={fadeMask} />
        )}
      </div>
      {collapsible && (
        <button onClick={() => setOpen((o) => !o)} style={expandBtn}>
          {open ? L.collapse : L.expand}
        </button>
      )}
    </div>
  );
}

function CopyGlyph({ check }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flex: "0 0 auto" }}>
      {check
        ? <polyline points="20 6 9 17 4 12" />
        : <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>}
    </svg>
  );
}

const copyBtn = {
  display: "inline-flex", alignItems: "center", gap: "4px",
  border: "none", background: "none", cursor: "pointer", padding: "2px 4px",
  fontFamily: "var(--font-mono)", fontSize: "var(--t-micro)",
  letterSpacing: "var(--track-wide)",
};
const expandBtn = {
  display: "block", width: "100%", textAlign: "center",
  padding: "8px", borderTop: "1px solid var(--line-hairline)",
  borderLeft: 0, borderRight: 0, borderBottom: 0,
  background: "var(--surface-card)", cursor: "pointer",
  fontFamily: "var(--font-ui)", fontSize: "var(--t-sm)", fontWeight: "var(--w-medium)",
  color: "var(--brand)",
};
const fadeMask = {
  position: "absolute", left: 0, right: 0, bottom: 0, height: 64,
  background: "linear-gradient(to bottom, transparent, var(--surface-well))",
  pointerEvents: "none",
};
