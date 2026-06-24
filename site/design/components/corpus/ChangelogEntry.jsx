import React from "react";

/**
 * ChangelogEntry — renders one version's official release notes,
 * quoted verbatim from anthropics/claude-code CHANGELOG.md.
 *
 * The bullets are third-party source material: the English originals
 * are authoritative in every locale (like the corpus, they are the
 * object of study). The zh locale may pass reviewed build-time
 * translations as `bullets`; untranslated bullets simply stay English.
 * The digest line is generated from category counts at build time and
 * localized via `labels` — the same "generated, never written" rule
 * as DeltaSummary.
 * Mirrors ../../public/kit-lib.jsx — the runtime source of truth.
 */
export function ChangelogEntry({ bullets = null, counts = null, labels = EN, source = null, actions = null, style, ...rest }) {
  const L = { ...EN, ...labels };

  /* ---- missing state: calm, archival ---- */
  if (!bullets || bullets.length === 0) {
    return (
      <div style={{ border: "1px solid var(--line-hairline)", borderRadius: "var(--radius-3)", background: "var(--surface-card)",
        padding: "36px 32px", textAlign: "center", ...style }} {...rest}>
        <div style={{ fontFamily: "var(--font-ui)", fontWeight: "var(--w-semibold)", fontSize: "var(--t-ui)", color: "var(--text-body)", marginBottom: 6 }}>{L.missing}</div>
        <p style={{ margin: "0 auto", fontFamily: "var(--font-ui)", fontSize: "var(--t-sm)", color: "var(--text-faint)", maxWidth: "46ch" }}>{L.missingBody}</p>
      </div>
    );
  }

  const order = [["add", L.added], ["fix", L.fixed], ["imp", L.improved], ["chg", L.changed], ["oth", L.other]];
  const digest = counts ? order.filter(([k]) => counts[k] > 0) : [];

  return (
    <div style={{ display: "grid", gap: 14, ...style }} {...rest}>
      {(digest.length > 0 || source || actions) && (
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "8px 14px", paddingBottom: 12, borderBottom: "1px solid var(--line-hairline)" }}>
          <span style={{ display: "inline-flex", flexWrap: "wrap", alignItems: "baseline", gap: 8, fontFamily: "var(--font-ui)", fontSize: "var(--t-sm)", color: "var(--text-muted)" }}>
            {digest.map(([k, word], i) => (
              <React.Fragment key={k}>
                {i > 0 && <span style={{ color: "var(--text-faint)" }}>·</span>}
                <span>
                  {L.wordFirst && <>{word}{" "}</>}
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: "var(--w-semibold)", color: "var(--text-strong)" }}>{counts[k]}</span>
                  {!L.wordFirst && <>{" "}{word}</>}
                </span>
              </React.Fragment>
            ))}
          </span>
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 12 }}>
            {actions}
            {source && (
              <span style={{ fontFamily: "var(--font-ui)", fontSize: "var(--t-caption)", color: "var(--text-faint)" }}>
                {L.source}{" "}
                <a href={source.url} target="_blank" rel="noreferrer"
                  style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", textDecoration: "underline", textDecorationColor: "var(--line-strong)", textUnderlineOffset: "2px" }}>
                  {source.name}
                </a>
              </span>
            )}
          </span>
        </div>
      )}

      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 9 }}>
        {bullets.map((b, i) => (
          <li key={i} style={{ display: "grid", gridTemplateColumns: "16px 1fr", alignItems: "baseline" }}>
            <span aria-hidden="true" style={{ fontFamily: "var(--font-mono)", fontSize: "var(--t-sm)", color: "var(--text-faint)" }}>–</span>
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "var(--t-sm)", lineHeight: "var(--lh-ui)", color: "var(--text-body)", maxWidth: "78ch", overflowWrap: "break-word" }}>
              {renderChangelogInline(b)}
            </span>
          </li>
        ))}
      </ul>

      {L.verbatimNote && (
        <p style={{ margin: 0, fontFamily: "var(--font-ui)", fontSize: "var(--t-caption)", color: "var(--text-faint)" }}>{L.verbatimNote}</p>
      )}
    </div>
  );
}

/* Minimal inline-markdown for changelog bullets:
   `code` · **bold** · [text](url) · bare https:// URLs · line breaks.
   Anything else renders as plain text — never a full markdown engine. */
export function renderChangelogInline(text) {
  const nodes = [];
  let key = 0;
  const codeStyle = { fontFamily: "var(--font-mono)", fontSize: "0.92em", background: "var(--surface-well)",
    border: "1px solid var(--line-hairline)", borderRadius: "var(--radius-1)", padding: "0 4px", whiteSpace: "pre-wrap" };
  const linkStyle = { color: "var(--brand)", textDecoration: "underline", textDecorationColor: "var(--line-strong)", textUnderlineOffset: "2px", overflowWrap: "anywhere" };
  const re = /(`[^`]+`)|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)\]（）【】「」、，。；：一-鿿]+)|(\*\*[^*]+\*\*)/g;
  String(text).split("\n").forEach((line, li) => {
    if (li > 0) nodes.push(<br key={"br" + key++} />);
    let last = 0; let m;
    re.lastIndex = 0;
    while ((m = re.exec(line)) !== null) {
      if (m.index > last) nodes.push(line.slice(last, m.index));
      if (m[1]) nodes.push(<code key={"c" + key++} style={codeStyle}>{m[1].slice(1, -1)}</code>);
      else if (m[2]) nodes.push(<a key={"l" + key++} href={m[3]} target="_blank" rel="noreferrer" style={linkStyle}>{m[2]}</a>);
      else if (m[4]) nodes.push(<a key={"u" + key++} href={m[4]} target="_blank" rel="noreferrer" style={linkStyle}>{m[4]}</a>);
      else if (m[5]) nodes.push(<strong key={"b" + key++} style={{ fontWeight: "var(--w-semibold)" }}>{m[5].slice(2, -2)}</strong>);
      last = re.lastIndex;
    }
    if (last < line.length) nodes.push(line.slice(last));
  });
  return nodes;
}

/** Default English label pack. A locale file supplies its own. */
const EN = {
  added: "added", fixed: "fixed", improved: "improved", changed: "changed", other: "notes",
  missing: "No changelog entry for this version",
  missingBody: "The official changelog has no entry for this release number. The capture is unaffected.",
  source: "Quoted verbatim from",
  verbatimNote: null,
  wordFirst: false,
};

export const ChangelogLabelsEN = EN;
