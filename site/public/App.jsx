/* ============================================================
   Lineage UI kit — App shell, views, router
   Composes the kit primitives (window.*) + data + locales.
   ============================================================ */

/* Primitives (Icon, Button, VersionChip, …) are global function
   declarations from kit-lib.jsx — referenced directly here. */
const DATA = window.LINEAGE_DATA;
const L10N = window.LINEAGE_LOCALES;
const CHANGELOG = window.LINEAGE_CHANGELOG || { entries: {} };
const CL_ZH = (window.LINEAGE_CHANGELOG_ZH && window.LINEAGE_CHANGELOG_ZH.entries) || {};

/* ---------- Wordmark ---------- */
function Wordmark({ size = 28 }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:10, color:"var(--text-strong)" }}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ display:"block" }}>
        <line x1="9" y1="4.5" x2="9" y2="27.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M9 16 C 9 21, 14 20, 23 20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
        <circle cx="9" cy="6.5" r="3.4" fill="var(--bg-app)" stroke="currentColor" strokeWidth="2.2"/>
        <circle cx="9" cy="25.5" r="3.4" fill="var(--bg-app)" stroke="currentColor" strokeWidth="2.2"/>
        <circle cx="24.5" cy="20" r="3.4" fill="var(--brand)"/>
      </svg>
      <span style={{ fontFamily:"var(--font-editorial)", fontSize:size*0.82, fontWeight:600, letterSpacing:"-0.01em" }}>Lineage</span>
    </span>
  );
}

/* ---------- Header ---------- */
function Header({ t, route, go, locale, setLocale, theme, setTheme, onSearch }) {
  return (
    <header style={{ position:"sticky", top:0, zIndex:20, background:"color-mix(in oklch, var(--bg-app) 86%, transparent)",
      backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)", borderBottom:"1px solid var(--line-hairline)" }}>
      <div style={{ maxWidth:"var(--container)", margin:"0 auto", padding:"0 24px", height:60, display:"flex", alignItems:"center", gap:"clamp(8px, 1.6vw, 20px)" }}>
        <button onClick={()=>go({ view:"timeline" })} style={{ border:"none", background:"none", cursor:"pointer", padding:0 }}>
          <Wordmark />
        </button>
        <nav style={{ display:"flex", gap:4, marginLeft:8 }}>
          <NavLink active={route.view==="timeline"} onClick={()=>go({ view:"timeline" })}>{t.timeline}</NavLink>
          <NavLink active={route.view==="compare"} onClick={()=>go({ view:"compare", ...latestChangedPair() })}>{t.compare}</NavLink>
          <NavLink active={route.view==="anatomy"} onClick={()=>go({ view:"anatomy" })}>{t.anatomy.nav}</NavLink>
        </nav>
        <div style={{ flex:1 }} />
        <button onClick={onSearch} style={{ display:"inline-flex", alignItems:"center", gap:8, height:34, padding:"0 10px", width:"clamp(120px, 23vw, 280px)", flexShrink:1, minWidth:0,
          border:"1px solid var(--line-strong)", borderRadius:"var(--radius-2)", background:"var(--surface-card)", cursor:"pointer",
          fontFamily:"var(--font-ui)", fontSize:"var(--t-sm)", color:"var(--text-faint)" }}>
          <Icon name="search" size={15} /><span style={{ whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t.searchPlaceholder}</span>
          <kbd style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"var(--text-faint)", border:"1px solid var(--line-strong)", borderRadius:3, padding:"0 4px", marginLeft:"auto" }}>/</kbd>
        </button>
        <SegmentedControl size="sm" value={locale} onChange={setLocale}
          options={[{ value:"en", label:"EN" }, { value:"zh", label:"中文" }]} />
        <SegmentedControl size="sm" value={theme} onChange={setTheme}
          options={[{ value:"light", icon:<Icon name="sun" size={15} />, title:t.themeLight }, { value:"dark", icon:<Icon name="moon" size={15} />, title:t.themeDark }]} />
        <a href="https://github.com/Hoper-J/claude-code-api-requests" target="_blank" rel="noopener noreferrer" title="GitHub"
          style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:34, height:34, borderRadius:"var(--radius-2)",
            color:"var(--text-muted)", border:"1px solid transparent", transition:"var(--transition-ui)" }}
          onMouseEnter={(e)=>{ e.currentTarget.style.color="var(--text-strong)"; e.currentTarget.style.background="var(--surface-well)"; }}
          onMouseLeave={(e)=>{ e.currentTarget.style.color="var(--text-muted)"; e.currentTarget.style.background="transparent"; }}>
          <Icon name="github" size={17} />
        </a>
      </div>
    </header>
  );
}
function NavLink({ active, onClick, children }) {
  return <button onClick={onClick} style={{ border:"none", background:"none", cursor:"pointer", padding:"6px 10px", borderRadius:"var(--radius-2)",
    fontFamily:"var(--font-ui)", fontSize:"var(--t-ui)", fontWeight:active?"var(--w-semibold)":"var(--w-medium)",
    color:active?"var(--text-strong)":"var(--text-faint)" }}>{children}</button>;
}

/* ---------- helpers ---------- */
function semverKey(v){ return v.split(".").map(n=>String(n).padStart(4,"0")).join("."); }
function shortModel(m){ return m ? m.replace(/^claude-/,"").replace(/-\d{8}$/,"") : "—"; }
/* Render a string with `backtick`-marked spans as <code>. */
function inlineCode(str){
  return String(str).split(/(`[^`]+`)/).map((s, i) => (s.length > 1 && s.startsWith("`") && s.endsWith("`"))
    ? <code key={i} style={{ fontFamily:"var(--font-mono)", fontSize:"0.92em", color:"var(--text-strong)", background:"var(--surface-well)", borderRadius:4, padding:"1px 5px" }}>{s.slice(1, -1)}</code>
    : s);
}
function resolveCapture(v, version){
  return {
    version,
    model: v.model, http_status: v.http_status, result: "ok", regime: v.regime || "js", aux: v.aux,
    max_tokens: v.max_tokens, betas: v.betas || [],
    temperature: v.temperature, stream: v.stream,
    context_management: v.context_management || null, usage: v.usage || null,
    system: (v.blocks || []).map(id => ({ text: DATA.BLOCKS[id] })),
    tools: (v.tools || []).map(id => DATA.TOOLDEFS[id]),
    messages: v.messagesId != null ? (DATA.MESSAGES[v.messagesId] || []) : [],
    msg_shape: v.msg_shape || null,
    mcp_connecting: v.mcp_connecting || false,
    captured_at: v.captured_at || null,
    reply: v.reply != null ? v.reply : null,
    stop_reason: v.stop_reason || null,
    effort: v.effort || null,
    diagnostics: v.diagnostics || null,
    metadata: v.metadata || null,
    header_summary: v.headers || {},
    fallbacks: v.fallbacks || null,
    thinking: v.thinking || null,
    response_model: v.response_model || null,
  };
}
function getDetail(version){
  const at = version.indexOf("@");
  if (at > 0) {
    const baseV = version.slice(0, at), vid = version.slice(at + 1);
    const base = DATA.VERSIONS[baseV];
    const va = base && base.variants ? base.variants.find(x => x.id === vid) : null;
    if (!va) return null;
    const d = resolveCapture(va.detail, version);
    d.displayVersion = `${baseV} ⎇ ${shortModel(va.model_in_request)}`;
    d.variantAxis = va.axis || null;
    d.variants = [];
    return d;
  }
  const v = DATA.VERSIONS[version];
  if (!v) {
    const idx = DATA.INDEX.find(x=>x.version===version);
    if (idx && idx.result === "fail") return { version, result:"fail", error:"timeout-no-request" };
    return null;
  }
  if (v.result === "fail") return { version, result:"fail", error: v.error || "timeout-no-request" };
  const d = resolveCapture(v, version);
  d.variants = (v.variants || []).map(va => ({ id: va.id, pinned_model: va.pinned_model, model_in_request: va.model_in_request, axis: va.axis || null, detail: resolveCapture(va.detail, version) }));
  return d;
}
function prevOf(version){ const k=semverKey(version); const ok=DATA.INDEX.filter(x=>x.result==="ok"); const sorted=[...ok].sort((a,b)=>semverKey(a.version)<semverKey(b.version)?-1:1); const i=sorted.findIndex(x=>semverKey(x.version)>=k); return i>0?sorted[i-1].version:null; }
function neighbors(version){ const sorted=[...DATA.INDEX].sort((a,b)=>semverKey(a.version)<semverKey(b.version)?-1:1); const i=sorted.findIndex(x=>x.version===version); return { prev:i>0?sorted[i-1].version:null, next:i<sorted.length-1?sorted[i+1].version:null }; }
function latestChangedPair(){
  // INDEX is newest-first; find the most recent ok version with a non-empty delta
  const hit = DATA.INDEX.find(x => x.result==="ok" && !x.aux && x.delta && Object.keys(x.delta).length>0);
  if(hit){ const from = prevOf(hit.version); if(from) return { from, to: hit.version }; }
  // fallback: newest two ok versions (degenerate corpora self-pair — no hardcoded versions)
  const ok = DATA.INDEX.filter(x=>x.result==="ok" && !x.aux);
  const to = ok[0] ? ok[0].version : (DATA.INDEX[0] ? DATA.INDEX[0].version : "");
  const from = ok[1] ? ok[1].version : to;
  return { from, to };
}
/* ---------- Timeline ---------- */
function TimelineView({ t, go }) {
  const shown = DATA.INDEX.filter(r => r.result !== "fail" && !r.aux);
  // count hidden (fail/aux) versions between each shown row and the next-older shown row
  const idxPos = new Map(DATA.INDEX.map((r,i)=>[r.version,i]));
  const rows = shown.map((row,i)=>{
    let gap = 0, gapFrom = null, gapTo = null;
    if(i < shown.length-1){
      const a = idxPos.get(row.version), b = idxPos.get(shown[i+1].version);
      if(a!=null && b!=null && b-a>1){
        gap = b-a-1;
        gapFrom = DATA.INDEX[b-1].version; // older end (just above next shown)
        gapTo = DATA.INDEX[a+1].version;   // newer end (just below this shown)
      }
    }
    return { row, gap, gapFrom, gapTo };
  });
  return (
    <div style={{ maxWidth:"var(--container)", margin:"0 auto", padding:"0 24px" }}>
      <section style={{ padding:"64px 0 40px", maxWidth:"var(--measure-prose)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:18 }}>
          <Tag><Icon name="branch" size={13} style={{ marginRight:2 }} /> 2.x line</Tag>
          <span style={{ fontFamily:"var(--font-ui)", fontSize:"var(--t-caption)", color:"var(--text-faint)" }}>{t.versionsCaptured(DATA.COUNTS.ok, DATA.COUNTS.total)}</span>
        </div>
        <h1 style={{ fontSize:"var(--t-display)", lineHeight:1.05, letterSpacing:"var(--track-tight)", marginBottom:18 }}>{t.tagline}</h1>
        <p style={{ fontFamily:"var(--font-editorial)", fontSize:"var(--t-lead)", lineHeight:1.55, color:"var(--text-body)" }}>{t.intro}</p>
        <p style={{ marginTop:14, fontFamily:"var(--font-ui)", fontSize:"var(--t-caption)", color:"var(--text-faint)", lineHeight:1.5 }}>{inlineCode(t.captureBanner)}</p>
      </section>

      <section style={{ paddingBottom:80 }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:8, paddingBottom:12, borderBottom:"1px solid var(--line-hairline)" }}>
          <Eyebrow>{t.timeline}</Eyebrow>
          <span style={{ marginLeft:"auto", fontFamily:"var(--font-ui)", fontSize:"var(--t-caption)", color:"var(--text-faint)" }}>{t.whatChanged} →</span>
        </div>
        <ol style={{ listStyle:"none", margin:0, padding:0 }}>
          {rows.map(({row,gap,gapFrom,gapTo}, i) => (
            <React.Fragment key={row.version}>
              <TimelineRow row={row} t={t} go={go} last={i===rows.length-1 && gap===0} />
              {gap>0 && <TimelineGap count={gap} from={gapFrom} to={gapTo} t={t} />}
            </React.Fragment>
          ))}
        </ol>
      </section>
    </div>
  );
}
function TimelineGap({ count, from, to, t }) {
  return (
    <li style={{ position:"relative", padding:"7px 14px 7px 30px" }}>
      <span style={{ position:"absolute", left:14, top:0, bottom:0, width:2, background:"repeating-linear-gradient(var(--line-strong) 0 3px, transparent 3px 7px)" }} />
      <span style={{ display:"inline-flex", alignItems:"center", gap:8, fontFamily:"var(--font-ui)", fontSize:"var(--t-caption)", color:"var(--text-faint)" }}>
        <Icon name="slash" size={13} />
        {t.gapNote(count, from, to)}
      </span>
    </li>
  );
}
function TimelineRow({ row, t, go, last }) {
  const fail = row.result === "fail";
  const [hover, setHover] = React.useState(false);
  return (
    <li>
      <button disabled={fail} onClick={()=>go({ view:"explorer", version:row.version })}
        onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
        style={{ position:"relative", display:"grid", gridTemplateColumns:"150px 120px 1fr auto", alignItems:"center", gap:18,
          width:"100%", textAlign:"left", padding:"15px 14px 15px 30px", border:"none", borderRadius:"var(--radius-3)",
          background: hover && !fail ? "var(--surface-well)" : "transparent", cursor: fail ? "default" : "pointer",
          opacity: fail ? 0.55 : 1, transition:"background var(--dur-2) var(--ease-standard)" }}>
        {/* spine */}
        <span style={{ position:"absolute", left:14, top:0, bottom: last?"50%":0, width:2, background:"var(--line-hairline)" }} />
        <span style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", width:12, height:12, borderRadius:"50%",
          background:"var(--bg-app)", border:`2px solid ${fail?"var(--line-strong)":"var(--brand)"}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
          {!fail && <span style={{ width:4, height:4, borderRadius:"50%", background:"var(--brand)" }} />}
        </span>
        <span style={{ display:"flex", alignItems:"center", gap:10 }}>
          <VersionChip version={row.version} status={fail?"fail":row.aux?"aux":"ok"} size="md" />
          {row.aux && <Badge tone="accent">{t.auxiliary}</Badge>}
        </span>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:"var(--t-code-sm)", color:"var(--text-faint)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{fail ? "" : shortModel(row.model)}</span>
        <span>
          {fail
            ? <span style={{ display:"inline-flex", alignItems:"center", gap:7, fontFamily:"var(--font-ui)", fontSize:"var(--t-sm)", color:"var(--text-faint)" }}><Icon name="slash" size={14} /> {t.noCapture}</span>
            : <DeltaSummary delta={row.delta} labels={t.delta} />}
        </span>
        <span style={{ display:"flex", alignItems:"center", gap:12, justifySelf:"end" }}>
          {!fail && row.variants && row.variants.length > 0 && (
            <span onClick={(e)=>{ e.stopPropagation(); go({ view:"explorer", version:row.version, capture:row.variants[0] }); }}
              title={`${t.captures} · ${shortModel(((DATA.VERSIONS[row.version]||{}).variants||[{}])[0].model_in_request)}`}
              style={{ cursor:"pointer", display:"inline-flex" }}
              onMouseEnter={(e)=>{ e.currentTarget.style.opacity="0.72"; }}
              onMouseLeave={(e)=>{ e.currentTarget.style.opacity="1"; }}>
              <Badge tone="brand" mono>⎇ {shortModel(((DATA.VERSIONS[row.version]||{}).variants||[{}])[0].model_in_request)}</Badge>
            </span>
          )}
          {!fail && <Badge tone="neutral" mono>{row.tools_count} {t.toolsCount}</Badge>}
          {!fail && <Icon name="chevR" size={16} style={{ color: hover ? "var(--brand)" : "var(--text-faint)" }} />}
        </span>
      </button>
    </li>
  );
}

/* ---------- What changed (explorer, unified) ---------- */
function deltaHasChange(d){
  if(!d) return false;
  const arr=["tools_added","tools_removed","tools_modified","betas_added","betas_removed","reminders_added","reminders_removed","body_keys_added","body_keys_removed"];
  if(arr.some(k=>(d[k]||[]).length)) return true;
  if(d.probe_changed||d.model_changed||d.max_tokens_changed||d.effort_changed||d.fallbacks_changed||d.thinking_changed||d.regime_changed||d.temperature_changed||d.stream_changed||d.context_management_changed||d.diagnostics_changed) return true;
  if(d.system_chars_delta||d.system_blocks_changed) return true;
  if(d.context_body_changed) return true;
  return false;
}
function WhatChanged({ delta, t, version, go, pair }) {
  if (!delta) return <span style={{ fontFamily:"var(--font-editorial)", fontSize:"var(--t-h3)", color:"var(--text-faint)" }}>{t.delta.first}</span>;
  const fromV = pair ? pair.from : prevOf(version);
  const toKey = pair ? pair.to : version;
  const mkJump = (focus) => fromV ? () => go({ view:"compare", from:fromV, to:toKey, focus }) : null;
  const jump = mkJump();
  const rn = (k) => (t.delta.reminderNames && t.delta.reminderNames[k]) || k;
  const tones = {
    add: { fg:"var(--add-text)", edge:"var(--add-edge)", surf:"var(--add-surface)" },
    del: { fg:"var(--del-text)", edge:"var(--del-edge)", surf:"var(--del-surface)" },
    mod: { fg:"var(--mod-text)", edge:"var(--mod-edge)", surf:"var(--mod-surface)" },
    brand: { fg:"var(--brand-press)", edge:"var(--brand-tint)", surf:"var(--surface-tint)" },
  };
  const groups = [
    { label:t.added,        tone:"add", strike:false, items:delta.tools_added,    focus:"tools" },
    { label:t.modifiedLabel,tone:"mod", strike:false, items:delta.tools_modified, focus:"tools" },
    { label:t.removed,      tone:"del", strike:true,  items:delta.tools_removed,  focus:"tools" },
    { label:`${t.added} · ${t.delta.context}`,   tone:"add", strike:false, items:(delta.reminders_added||[]).map(rn),   focus:"context" },
    { label:`${t.removed} · ${t.delta.context}`, tone:"del", strike:true,  items:(delta.reminders_removed||[]).map(rn), focus:"context" },
    { label:`${t.added} · beta`,   tone:"brand", strike:false, items:delta.betas_added,   focus:"beta" },
    { label:`${t.removed} · beta`, tone:"del",   strike:true,  items:delta.betas_removed, focus:"beta" },
  ].filter(g => g.items && g.items.length);

  // scalar (non-named) changes → muted meta line
  const meta = [];
  if (delta.system_chars_delta) meta.push(`${t.systemPrompt} ${delta.system_chars_delta>0?"+":""}${delta.system_chars_delta.toLocaleString("en-US")} ${t.delta.chars}`);
  if (delta.system_blocks_changed) meta.push(`${t.delta.systemBlocks} ${delta.system_blocks_changed.from} → ${delta.system_blocks_changed.to}`);
  if ((delta.body_keys_added||[]).length) meta.push(`body +${delta.body_keys_added.join(" +")}`);
  if ((delta.body_keys_removed||[]).length) meta.push(`body −${delta.body_keys_removed.join(" −")}`);
  if (delta.model_changed) meta.push(`${t.model} ${shortModel(delta.model_changed.from)} → ${shortModel(delta.model_changed.to)}`);
  if (delta.fallbacks_changed) meta.push(`fallbacks ${delta.fallbacks_changed.to ? JSON.stringify(delta.fallbacks_changed.to) : t.absent}`);
  if (delta.max_tokens_changed) meta.push(`max_tokens ${(delta.max_tokens_changed.to!=null?delta.max_tokens_changed.to:0).toLocaleString("en-US")}`);
  if (delta.effort_changed) meta.push(`effort ${delta.effort_changed.to!=null?delta.effort_changed.to:"—"}`);
  if (delta.thinking_changed) meta.push(`thinking ${delta.thinking_changed.from!=null?delta.thinking_changed.from:"—"} → ${delta.thinking_changed.to!=null?delta.thinking_changed.to:"—"}`);
  if (delta.regime_changed) meta.push(`regime ${delta.regime_changed.from} → ${delta.regime_changed.to}`);
  if (delta.temperature_changed) meta.push(`temperature ${delta.temperature_changed.from!=null?delta.temperature_changed.from:"—"} → ${delta.temperature_changed.to!=null?delta.temperature_changed.to:"—"}`);
  if (delta.stream_changed) meta.push(`stream ${delta.stream_changed.from!=null?delta.stream_changed.from:"—"} → ${delta.stream_changed.to!=null?delta.stream_changed.to:"—"}`);
  // Uncounted (boolean) changes use modifiedLabel — t.delta.modified carries the
  // zh measure word ("个修改") and reads broken without a number in front.
  if (delta.context_management_changed) meta.push(`context_management ${delta.context_management_changed.from?"~":"— →"} ${delta.context_management_changed.to?(delta.context_management_changed.from?t.modifiedLabel:"set"):"—"}`);
  if (delta.diagnostics_changed) meta.push(`diagnostics ${delta.diagnostics_changed.from!=null?t.modifiedLabel:"— → set"}`);
  if (delta.probe_changed) meta.push(`${t.probe} ${delta.probe_changed.from} → ${delta.probe_changed.to}`);
  if (delta.context_body_changed && !(delta.reminders_added||[]).length && !(delta.reminders_removed||[]).length) meta.push(`${t.injectedContext} ~ ${t.modifiedLabel}`);

  if (!groups.length && !meta.length) return <span style={{ fontFamily:"var(--font-editorial)", fontSize:"var(--t-h3)", color:"var(--text-faint)" }}>{t.delta.noChange}</span>;

  return (
    <div style={{ display:"grid", gap:10 }}>
      {groups.map((g, gi) => {
        const c = tones[g.tone];
        const gJump = mkJump(g.focus);
        return (
          <div key={gi} style={{ display:"grid", gridTemplateColumns:"max-content 1fr", gap:14, alignItems:"baseline" }}>
            <span style={{ display:"inline-flex", alignItems:"center", gap:6, fontFamily:"var(--font-ui)", fontSize:"var(--t-sm)", fontWeight:"var(--w-semibold)", color:c.fg, whiteSpace:"nowrap" }}>
              {g.label}
              <span style={{ fontFamily:"var(--font-mono)", fontSize:"var(--t-micro)", color:"var(--text-faint)", fontWeight:"var(--w-regular)" }}>{g.items.length}</span>
            </span>
            <span style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {g.items.map((name,i) => (
                <button key={i} onClick={gJump || undefined} title={gJump?t.jumpToDiff:undefined} style={{ fontFamily:"var(--font-mono)", fontSize:"var(--t-micro)", padding:"2px 8px", borderRadius:"var(--radius-pill)",
                  color:c.fg, background:c.surf, border:`1px solid ${c.edge}`, textDecoration:g.strike?"line-through":"none", cursor:gJump?"pointer":"default" }}>{name}</button>
              ))}
            </span>
          </div>
        );
      })}
      {meta.length>0 && (
        <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:8, marginTop: groups.length?4:0, paddingTop: groups.length?10:0, borderTop: groups.length?"1px solid var(--line-hairline)":"none",
          fontFamily:"var(--font-mono)", fontSize:"var(--t-code-sm)", color:"var(--text-muted)" }}>
          {meta.map((s,i) => (<React.Fragment key={i}>{i>0 && <span style={{ color:"var(--text-faint)" }}>·</span>}<span>{s}</span></React.Fragment>))}
        </div>
      )}
      {jump && (
        <button onClick={jump} style={{ justifySelf:"start", display:"inline-flex", alignItems:"center", gap:6, marginTop:6, border:"none", background:"none", padding:0, cursor:"pointer",
          fontFamily:"var(--font-ui)", fontSize:"var(--t-caption)", fontWeight:"var(--w-medium)", color:"var(--brand)" }}>
          <Icon name="compare" size={13} /> {t.jumpToDiff} {fromV} → {pair ? pair.toLabel : version}
        </button>
      )}
    </div>
  );
}

/* ---------- Explorer ---------- */
function ExplorerView({ t, locale, version, capture, go, backRoute }) {
  const detail = getDetail(version);
  const [tab, setTab] = React.useState("system");
  const variantIdx = (capture && detail && detail.variants) ? detail.variants.findIndex(v=>v.id===capture) : -1;
  const setVariantIdx = (i)=>{ const va = (i>=0 && detail && detail.variants) ? detail.variants[i] : null;
    go(va ? { view:"explorer", version, capture: va.id } : { view:"explorer", version }); };
  const idx = DATA.INDEX.find(x=>x.version===version);
  const { prev, next } = neighbors(version);
  const clEntry = CHANGELOG.entries[version] || null;

  if (!detail || detail.result === "fail") {
    return (
      <div style={{ maxWidth:"var(--container)", margin:"0 auto", padding:"40px 24px 80px" }}>
        <BackBar t={t} go={go} prev={prev} next={next} backRoute={backRoute} />
        <div style={{ maxWidth:"var(--container-narrow)", margin:"28px auto 0" }}>
          <div style={{ border:"1px solid var(--line-hairline)", borderRadius:"var(--radius-4)", padding:"48px 40px", textAlign:"center", background:"var(--surface-card)" }}>
            <div style={{ display:"inline-flex", marginBottom:14, color:"var(--text-faint)" }}><Icon name="slash" size={28} /></div>
            <h2 style={{ fontSize:"var(--t-h2)", marginBottom:8 }}><span style={{ fontFamily:"var(--font-mono)", fontSize:"0.8em" }}>{version}</span></h2>
            <div style={{ fontFamily:"var(--font-ui)", fontWeight:600, color:"var(--text-body)", marginBottom:6 }}>{t.noCapture}</div>
            <p style={{ fontFamily:"var(--font-ui)", fontSize:"var(--t-sm)", color:"var(--text-faint)", maxWidth:"42ch", margin:"0 auto" }}>{t.noCaptureBody}</p>
          </div>
          {clEntry && (
            <div style={{ marginTop:28 }}>
              <Eyebrow style={{ marginBottom:14 }}>{t.changelog}</Eyebrow>
              <ChangelogPanel t={t} locale={locale} version={version} entry={clEntry} />
            </div>
          )}
        </div>
      </div>
    );
  }

  const activeVariant = variantIdx>=0 && detail.variants && detail.variants[variantIdx] ? detail.variants[variantIdx] : null;
  const active = activeVariant ? activeVariant.detail : detail;
  const activeChars = (active.system||[]).reduce((a,b)=>a+(b.text||"").length, 0);

  const requestTabs = [
    { id:"system", label:t.systemPrompt },
    { id:"messages", label:t.messages, count: (active.messages||[]).length || null },
    { id:"tools", label:t.tools, count: active.tools.length },
    { id:"request", label:t.params },
  ];
  const responseTabs = [
    { id:"response", label:t.response },
  ];
  const releaseTabs = [
    { id:"changelog", label:t.changelog, count: clEntry ? clEntry.b.length : null },
  ];

  return (
    <div style={{ maxWidth:"var(--container)", margin:"0 auto", padding:"32px 24px 96px" }}>
      <BackBar t={t} go={go} prev={prev} next={next} backRoute={backRoute} />

      <div style={{ marginTop:26, display:"flex", alignItems:"flex-start", gap:16, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:280 }}>
          <h1 style={{ fontFamily:"var(--font-mono)", fontSize:"2.4rem", fontWeight:600, letterSpacing:"-0.01em", color:"var(--text-strong)" }}>{version}</h1>
          <div style={{ marginTop:12, display:"flex", flexWrap:"wrap", gap:8, alignItems:"center" }}>
            <Badge tone="brand" mono>{shortModel(active.model)}</Badge>
            {detail.aux && <Badge tone="accent">{t.auxiliary}</Badge>}
            <Badge tone="neutral" mono>{active.tools.length} {t.toolsCount}</Badge>
            <Badge tone="neutral" mono>{activeChars.toLocaleString("en-US")} {t.systemChars}</Badge>
            {active.mcp_connecting && <Tooltip tip={t.mcpNotConnected.tip} placement="bottom"><Badge tone="accent">{t.mcpNotConnected.label}</Badge></Tooltip>}
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={()=>downloadCapture(active, version, activeVariant ? activeVariant.id : null)} title={t.downloadCapture} aria-label={t.downloadCapture}
            style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:"var(--control-h)", height:"var(--control-h)", borderRadius:"var(--radius-2)",
              border:"1px solid var(--line-hairline)", background:"var(--surface-card)", color:"var(--text-muted)", cursor:"pointer", transition:"var(--transition-ui)" }}
            onMouseEnter={(e)=>{ e.currentTarget.style.color="var(--text-strong)"; e.currentTarget.style.borderColor="var(--line-strong)"; }}
            onMouseLeave={(e)=>{ e.currentTarget.style.color="var(--text-muted)"; e.currentTarget.style.borderColor="var(--line-hairline)"; }}>
            <Icon name="download" size={16} />
          </button>
          <Button variant="secondary" iconLeft={<Icon name="compare" size={16} />} onClick={()=>go({ view:"compare", from: prevOf(version)||version, to: version })}>{t.compareVersions}</Button>
        </div>
      </div>

      {detail.variants && detail.variants.length > 0 && (
        <div style={{ marginTop:20, display:"flex", flexWrap:"wrap", alignItems:"center", gap:14, padding:"12px 16px", border:"1px solid var(--line-hairline)", borderRadius:"var(--radius-3)", background:"var(--surface-card)" }}>
          <Eyebrow>{t.captures}</Eyebrow>
          <SegmentedControl size="sm" value={String(variantIdx)} onChange={v=>setVariantIdx(Number(v))}
            options={[
              { value:"-1", label:`${shortModel(detail.model)} · ${t.defaultCapture}` },
              ...detail.variants.map((va,i)=>({ value:String(i), label: shortModel(va.model_in_request) })),
            ]} />
        </div>
      )}
      {activeVariant && <ModelAxisPanel variant={activeVariant} base={detail} t={t} go={go} version={version} />}

      {!activeVariant && idx && deltaHasChange(idx.delta) && (
        <div style={{ margin:"22px 0 8px", padding:"16px 18px", border:"1px solid var(--line-hairline)", borderRadius:"var(--radius-3)", background:"var(--surface-tint)" }}>
          <Eyebrow style={{ marginBottom:12 }}>{t.whatChanged}</Eyebrow>
          <WhatChanged delta={idx.delta} t={t} version={version} go={go} />
        </div>
      )}

      <div style={{ marginTop:24 }}>
        <div style={{ display:"flex", alignItems:"flex-end", gap:0, borderBottom:"1px solid var(--line-hairline)" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <span style={{ fontFamily:"var(--font-ui)", fontSize:"var(--t-micro)", textTransform:"uppercase", letterSpacing:"var(--track-over)", fontWeight:"var(--w-semibold)", color:"var(--text-faint)", paddingLeft:13 }}>{t.requestGroup}</span>
            <Tabs items={requestTabs} value={tab} onChange={setTab} style={{ borderBottom:"none" }} />
          </div>
          <div style={{ alignSelf:"stretch", width:1, background:"var(--line-hairline)", margin:"0 14px" }} />
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <Tabs items={responseTabs} value={tab} onChange={setTab} style={{ borderBottom:"none" }} />
          </div>
          <div style={{ alignSelf:"stretch", width:1, background:"var(--line-hairline)", margin:"0 14px" }} />
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <Tabs items={releaseTabs} value={tab} onChange={setTab} style={{ borderBottom:"none" }} />
          </div>
        </div>
        <div style={{ marginTop:20 }}>
          {tab === "system" && (
            <div style={{ display:"grid", gap:14 }}>
              {active.system.map((b, i) => (
                <CodeBlock key={i} label={`${t.systemPrompt} · ${t.block} ${i+1}`} copyText={b.text} collapsible={b.text.length > 600} collapsedHeight={260} labels={t.code}>{b.text}</CodeBlock>
              ))}
            </div>
          )}
          {tab === "tools" && (
            <div style={{ display:"grid", gap:8 }}>
              {active.tools.map((tool) => (
                <ToolCard key={tool.name} name={tool.name} description={tool.description} schema={tool.schema} labels={t.code} />
              ))}
            </div>
          )}
          {tab === "messages" && <MessagesPanel t={t} detail={active} />}
          {tab === "request" && <RequestPanel t={t} detail={active} />}
          {tab === "response" && <ResponsePanel t={t} detail={active} />}
          {tab === "changelog" && <ChangelogPanel t={t} locale={locale} version={version} entry={clEntry} />}
        </div>
      </div>
    </div>
  );
}
/* ---------- Compare changelog (official notes across the compared span) ------
   The payload diff says what actually changed in the request; the official
   release notes say what the releases claimed. Rendering the (from, to]
   span — newest first, from itself excluded since its entry describes the
   previous step — puts both narratives on one screen. Variant keys compare
   on their base version (the model axis has no release notes of its own). */
function changelogRangeVersions(from, to) {
  const base = (v) => String(v).split("@")[0];
  const a = semverKey(base(from)), b = semverKey(base(to));
  const lo = a < b ? a : b, hi = a < b ? b : a;
  // DATA.INDEX is newest-first, so the result is already descending
  return DATA.INDEX.map((x) => x.version).filter((v) => { const k = semverKey(v); return k > lo && k <= hi && CHANGELOG.entries[v]; });
}
function CompareChangelog({ t, locale, from, to, go }) {
  const vers = React.useMemo(() => changelogRangeVersions(from, to), [from, to]);
  const zh = locale === "zh";
  const hasZh = zh && vers.some((v) => { const arr = CL_ZH[v]; return arr && arr.some((x) => x); });
  const [mode, setMode] = React.useState("zh");
  React.useEffect(() => { setMode("zh"); }, [from, to, locale]);
  const [showAll, setShowAll] = React.useState(false);
  React.useEffect(() => { setShowAll(false); }, [from, to]);
  if (!vers.length) return null;
  const CAP = 10;
  const shown = showAll ? vers : vers.slice(0, CAP);
  const L = t.changelogLabels;
  const useZh = hasZh && mode === "zh";
  const note = !zh ? null : useZh ? L.mtNote : L.verbatimNote;
  const base = (v) => String(v).split("@")[0];
  return (
    <div id="cmp-changelog" style={{ scrollMarginTop:84 }}>
      <div style={{ display:"flex", flexWrap:"wrap", alignItems:"baseline", gap:"8px 14px", marginBottom:12 }}>
        <Eyebrow>{t.changelog}</Eyebrow>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:"var(--t-caption)", color:"var(--text-faint)" }}>{base(from)} → {base(to)}</span>
        <span style={{ marginLeft:"auto", display:"inline-flex", alignItems:"center", gap:12 }}>
          {hasZh && (
            <button onClick={()=>setMode(mode==="zh"?"en":"zh")} title={mode==="zh"?L.mtOriginal:L.mtTab} aria-pressed={mode==="zh"}
              style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:24, height:24, border:"none", background:"none",
                cursor:"pointer", borderRadius:"var(--radius-1)", color: mode==="zh" ? "var(--brand)" : "var(--text-faint)", transition:"var(--transition-ui)" }}
              onMouseEnter={(e)=>{ e.currentTarget.style.color="var(--text-strong)"; }}
              onMouseLeave={(e)=>{ e.currentTarget.style.color = mode==="zh" ? "var(--brand)" : "var(--text-faint)"; }}>
              <Icon name="languages" size={14} />
            </button>
          )}
          <span style={{ fontFamily:"var(--font-ui)", fontSize:"var(--t-caption)", color:"var(--text-faint)" }}>
            {L.source}{" "}
            <a href={CHANGELOG.url} target="_blank" rel="noreferrer" style={{ color:"var(--text-muted)", fontFamily:"var(--font-mono)", textDecoration:"underline", textDecorationColor:"var(--line-strong)", textUnderlineOffset:"2px" }}>{CHANGELOG.source + " · " + CHANGELOG.file}</a>
          </span>
        </span>
      </div>
      <div style={{ display:"grid", gap:16 }}>
        {shown.map((v) => {
          const e = CHANGELOG.entries[v];
          const zhArr = useZh ? (CL_ZH[v] || null) : null;
          const bullets = zhArr && zhArr.length === e.b.length ? e.b.map((b, i) => zhArr[i] || b) : e.b;
          return (
            <div key={v} style={{ border:"1px solid var(--line-hairline)", borderRadius:"var(--radius-3)", background:"var(--surface-card)", padding:"14px 18px" }}>
              <ChangelogEntry bullets={bullets} counts={e.c} labels={{ ...L, verbatimNote:null }}
                actions={<VersionChip version={v} onClick={()=>go({ view:"explorer", version:v })} />} />
            </div>
          );
        })}
      </div>
      {vers.length > CAP && !showAll && (
        <button onClick={()=>setShowAll(true)} style={{ display:"block", width:"100%", textAlign:"center", marginTop:12, padding:"9px", border:"1px solid var(--line-hairline)", borderRadius:"var(--radius-3)",
          background:"var(--surface-card)", cursor:"pointer", fontFamily:"var(--font-ui)", fontSize:"var(--t-sm)", fontWeight:"var(--w-medium)", color:"var(--brand)" }}>{t.clShowAll(vers.length)}</button>
      )}
      {note && <p style={{ margin:"12px 0 0", fontFamily:"var(--font-ui)", fontSize:"var(--t-caption)", color:"var(--text-faint)" }}>{note}</p>}
    </div>
  );
}
/* ---------- Changelog panel ----------
   Official release notes for one version, quoted verbatim. The zh build
   artifact (changelog-zh.js) carries reviewed translations as arrays
   parallel to entry.b with null for untranslated bullets — those fall
   back to the English original per bullet. No runtime translation. */
function ChangelogPanel({ t, locale, version, entry }) {
  const L = t.changelogLabels;
  const zhArr = locale === "zh" && entry ? (CL_ZH[version] || null) : null;
  const hasZh = !!(zhArr && zhArr.length === entry.b.length && zhArr.some(x=>x));
  const [mode, setMode] = React.useState("zh"); // "zh" | "en" (zh locale only)
  React.useEffect(()=>{ setMode("zh"); }, [version, locale]);
  const useZh = hasZh && mode === "zh";
  const bullets = entry ? (useZh ? entry.b.map((b,i)=>zhArr[i] || b) : entry.b) : null;
  const partial = useZh && zhArr.some(x=>!x);
  const note = !entry ? null : useZh ? (partial ? L.mtPartial : L.mtNote) : L.verbatimNote;
  return (
    <ChangelogEntry
      bullets={bullets}
      counts={entry && entry.c}
      labels={{ ...L, verbatimNote: note }}
      source={entry ? { name: CHANGELOG.source + " · " + CHANGELOG.file, url: CHANGELOG.url } : null}
      actions={hasZh ? (
        <button onClick={()=>setMode(mode==="zh"?"en":"zh")} title={mode==="zh"?L.mtOriginal:L.mtTab} aria-pressed={mode==="zh"}
          style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:24, height:24, border:"none", background:"none",
            cursor:"pointer", borderRadius:"var(--radius-1)", color: mode==="zh" ? "var(--brand)" : "var(--text-faint)", transition:"var(--transition-ui)" }}
          onMouseEnter={(e)=>{ e.currentTarget.style.color="var(--text-strong)"; }}
          onMouseLeave={(e)=>{ e.currentTarget.style.color = mode==="zh" ? "var(--brand)" : "var(--text-faint)"; }}>
          <Icon name="languages" size={14} />
        </button>
      ) : null}
    />
  );
}
/* ---------- Model-axis panel (pinned-model variant vs default capture) ----------
   Renders with the same structured WhatChanged language as the explorer panel:
   delta computed at runtime from the two captures (no prose from status). */
function variantDelta(a, b){
  const d = {};
  const aMap=new Map((a.tools||[]).map(x=>[x.name,x])), bMap=new Map((b.tools||[]).map(x=>[x.name,x]));
  const ta=[...bMap.keys()].filter(n=>!aMap.has(n)); if(ta.length)d.tools_added=ta;
  const tr=[...aMap.keys()].filter(n=>!bMap.has(n)); if(tr.length)d.tools_removed=tr;
  const tm=[...bMap.keys()].filter(n=>aMap.has(n)&&JSON.stringify(aMap.get(n))!==JSON.stringify(bMap.get(n))); if(tm.length)d.tools_modified=tm;
  const pB=new Set(a.betas||[]), cB=new Set(b.betas||[]);
  const ba=(b.betas||[]).filter(x=>!pB.has(x)); if(ba.length)d.betas_added=ba;
  const br=(a.betas||[]).filter(x=>!cB.has(x)); if(br.length)d.betas_removed=br;
  const aR=new Set((a.msg_shape&&a.msg_shape.reminder_kinds)||[]), bR=new Set((b.msg_shape&&b.msg_shape.reminder_kinds)||[]);
  const ra=[...bR].filter(x=>!aR.has(x)); if(ra.length)d.reminders_added=ra;
  const rr=[...aR].filter(x=>!bR.has(x)); if(rr.length)d.reminders_removed=rr;
  const sc=(b.system||[]).reduce((s,x)=>s+x.text.length,0)-(a.system||[]).reduce((s,x)=>s+x.text.length,0); if(sc)d.system_chars_delta=sc;
  if(a.model!==b.model)d.model_changed={from:a.model,to:b.model};
  if(a.max_tokens!==b.max_tokens)d.max_tokens_changed={from:a.max_tokens,to:b.max_tokens};
  if((a.effort||null)!==(b.effort||null))d.effort_changed={from:a.effort||null,to:b.effort||null};
  if(JSON.stringify(a.thinking||null)!==JSON.stringify(b.thinking||null))d.thinking_changed={from:a.thinking?a.thinking.type:null,to:b.thinking?b.thinking.type:null};
  if(JSON.stringify(a.fallbacks||null)!==JSON.stringify(b.fallbacks||null))d.fallbacks_changed={from:a.fallbacks||null,to:b.fallbacks||null};
  if(!ra.length&&!rr.length&&messagesTextOf(a)!==messagesTextOf(b))d.context_body_changed=true;
  return d;
}
function ModelAxisPanel({ variant, base, t, go, version }){
  const delta = React.useMemo(()=>variantDelta(base, variant.detail), [version, variant.id]);
  return (
    <div style={{ margin:"10px 0 8px", padding:"16px 18px", border:"1px solid var(--line-hairline)", borderRadius:"var(--radius-3)", background:"var(--surface-tint)" }}>
      <Eyebrow style={{ marginBottom:12 }}>{t.modelAxis}</Eyebrow>
      <WhatChanged delta={delta} t={t} version={version} go={go}
        pair={{ from:version, to:`${version}@${variant.id}`, toLabel:`${version} ⎇ ${shortModel(variant.model_in_request)}` }} />
    </div>
  );
}

/* ---------- Capture download (single icon — full sanitized request+response) ---------- */
function downloadCapture(detail, version, variantId){
  const body = {
    model: detail.model,
    ...(detail.max_tokens != null ? { max_tokens: detail.max_tokens } : {}),
    ...(detail.temperature != null ? { temperature: detail.temperature } : {}),
    ...(detail.stream != null ? { stream: detail.stream } : {}),
    ...(detail.thinking ? { thinking: detail.thinking } : {}),
    ...(detail.effort != null ? { output_config: { effort: detail.effort } } : {}),
    ...(detail.context_management ? { context_management: detail.context_management } : {}),
    ...(detail.diagnostics ? { diagnostics: detail.diagnostics } : {}),
    ...(detail.metadata ? { metadata: detail.metadata } : {}),
    ...(detail.fallbacks ? { fallbacks: detail.fallbacks } : {}),
    system: detail.system.map(b => ({ type:"text", text: b.text })),
    tools: detail.tools.map(tl => ({ name: tl.name, description: tl.description, input_schema: tl.schema })),
    messages: detail.messages.map(m => ({ role: m.role, content: m.content.map(c => ({ type:"text", text: c.text, ...(c.cache ? { cache_control: c.cache } : {}) })) })),
  };
  const payload = {
    version,
    capture: variantId || "default",
    sanitized: true,
    request: { method:"POST", host:"api.anthropic.com", path:"/v1/messages?beta=true", headers: detail.header_summary, body },
    response: {
      status: detail.http_status,
      body: {
        ...(detail.response_model ? { model: detail.response_model } : {}),
        ...(detail.stop_reason ? { stop_reason: detail.stop_reason } : {}),
        ...(detail.usage ? { usage: detail.usage } : {}),
        ...(detail.reply != null ? { reply_text: detail.reply } : {}),
      },
    },
    meta: { regime: detail.regime, source: "claude-code-api-requests" },
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `claude-code-api-requests-${version}${variantId ? "-"+variantId : ""}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 2000);
}

function BackBar({ t, go, prev, next, backRoute }) {
  // Referrer-aware back: arriving from a compare (the changelog-span chips are
  // the only compare→explorer path today) returns there, focused on the
  // changelog section; otherwise — direct links, refreshes — back to timeline,
  // which also stays one click away in the header nav.
  const back = backRoute
    ? { label: `${t.backToCompare} ${backRoute.from} → ${backRoute.to}`, route: { ...backRoute, focus: backRoute.focus || "changelog" } }
    : { label: t.backToTimeline, route: { view:"timeline" } };
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
      <Button variant="ghost" size="sm" iconLeft={<Icon name="arrowL" size={15} />} onClick={()=>go(back.route)}>{back.label}</Button>
      <div style={{ flex:1 }} />
      {prev && <VersionChip version={prev} size="sm" onClick={()=>go({ view:"explorer", version:prev })} />}
      {next && <VersionChip version={next} size="sm" onClick={()=>go({ view:"explorer", version:next })} />}
    </div>
  );
}
/* ---------- small key/value table ---------- */
function KVTable({ rows, keyWidth = "180px", style }) {
  return (
    <div style={{ border:"1px solid var(--line-hairline)", borderRadius:"var(--radius-3)", overflow:"hidden", ...style }}>
      {rows.map(([k,v],i)=>(
        <div key={k} style={{ display:"grid", gridTemplateColumns:`${keyWidth} 1fr`, borderTop: i?"1px solid var(--line-faint)":"none" }}>
          <div style={{ padding:"10px 14px", background:"var(--surface-well)", fontFamily:"var(--font-mono)", fontSize:"var(--t-code-sm)", color:"var(--text-muted)", minWidth:0, overflowWrap:"anywhere", borderRight:"1px solid var(--line-faint)" }}>{k}</div>
          <div style={{ padding:"10px 14px", fontFamily:"var(--font-mono)", fontSize:"var(--t-code-sm)", color:"var(--text-strong)", minWidth:0, overflowWrap:"anywhere" }}>{typeof v === "number" ? v.toLocaleString("en-US") : v}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Request panel ---------- */
function RequestPanel({ t, detail }) {
  const betas = detail.betas || [];
  const cm = detail.context_management;
  const rows = [
    [t.model, detail.model],
    ["max_tokens", detail.max_tokens != null ? detail.max_tokens.toLocaleString("en-US") : "—"],
    ["temperature", detail.temperature != null ? String(detail.temperature) : "—"],
    ["stream", detail.stream != null ? String(detail.stream) : "—"],
    ["output_config.effort", detail.effort != null ? detail.effort : "—"],
    ["thinking", detail.thinking ? JSON.stringify(detail.thinking) : "—"],
    ...(detail.fallbacks ? [["fallbacks", JSON.stringify(detail.fallbacks)]] : []),
    ["diagnostics", detail.diagnostics ? JSON.stringify(detail.diagnostics) : "—"],
  ];
  return (
    <div>
      <KVTable rows={rows} style={{ marginBottom:22 }} />

      <Eyebrow style={{ marginBottom:10 }}>{t.betaFeatures} {betas.length ? <span style={{ color:"var(--text-faint)" }}>· {betas.length}</span> : null}</Eyebrow>
      {betas.length ? (
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:22 }}>
          {betas.map(b => <Tag key={b} style={{ fontFamily:"var(--font-mono)", fontSize:"var(--t-micro)" }}>{b}</Tag>)}
        </div>
      ) : <p style={{ margin:"0 0 22px", fontFamily:"var(--font-ui)", fontSize:"var(--t-sm)", color:"var(--text-faint)" }}>{t.noBetas}</p>}

      {cm ? (<React.Fragment>
        <Eyebrow style={{ marginBottom:10 }}>{t.contextManagement}</Eyebrow>
        <CodeBlock dense copyText={JSON.stringify(cm, null, 2)} labels={t.code}>{JSON.stringify(cm, null, 2)}</CodeBlock>
      </React.Fragment>) : null}

      {detail.metadata ? (<React.Fragment>
        <Eyebrow style={{ margin:"22px 0 10px" }}>{t.metadataLabel} <span style={{ color:"var(--text-faint)", textTransform:"none", letterSpacing:0, fontWeight:400 }}>· {t.masked}</span></Eyebrow>
        <CodeBlock dense>{JSON.stringify(detail.metadata, null, 2)}</CodeBlock>
      </React.Fragment>) : null}

      <Eyebrow style={{ margin:"22px 0 10px" }}>{t.headers} <span style={{ color:"var(--text-faint)", textTransform:"none", letterSpacing:0, fontWeight:400 }}>· {Object.keys(detail.header_summary).length}</span></Eyebrow>
      <CodeBlock dense copyText={Object.entries(detail.header_summary).map(([k,v])=>`${k}: ${v}`).join("\n")} labels={t.code}>{Object.entries(detail.header_summary).map(([k,v])=>`${k}: ${v}`).join("\n")}</CodeBlock>
    </div>
  );
}

/* ---------- Response panel ---------- */
function ResponsePanel({ t, detail }) {
  const usage = detail.usage;
  const usageRows = usage ? Object.keys(usage).map(k => [k, usage[k]]).filter(([,v]) => v != null) : [];
  return (
    <div>
      <KVTable rows={[["model", detail.response_model || "—"], ["http_status", String(detail.http_status)], ["regime", detail.regime]]} style={{ marginBottom:22 }} />

      <Eyebrow style={{ marginBottom:10 }}>{t.reply}</Eyebrow>
      {detail.reply != null ? (
        <div style={{ marginBottom:22 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <Badge tone="brand">assistant</Badge>
            {detail.stop_reason && <Badge tone="neutral" mono>stop_reason: {detail.stop_reason}</Badge>}
          </div>
          <CodeBlock copyText={detail.reply} labels={t.code}>{detail.reply}</CodeBlock>
        </div>
      ) : <p style={{ margin:"0 0 22px", fontFamily:"var(--font-ui)", fontSize:"var(--t-sm)", color:"var(--text-faint)" }}>{t.noReply}</p>}

      <Eyebrow style={{ marginBottom:10 }}>{t.responseUsage}</Eyebrow>
      {usageRows.length > 0
        ? <KVTable rows={usageRows} keyWidth="280px" style={{ marginBottom:22 }} />
        : <p style={{ margin:"0 0 22px", fontFamily:"var(--font-ui)", fontSize:"var(--t-sm)", color:"var(--text-faint)" }}>{t.noUsage}</p>}
    </div>
  );
}

/* ---------- Messages panel ---------- */
function MessagesPanel({ t, detail }) {
  const messages = detail.messages || [];
  return (
    <div>
      <Eyebrow style={{ marginBottom:10 }}>{t.msgStructure}</Eyebrow>
      <MessageStructure shape={detail.msg_shape} t={t} style={{ marginBottom:22 }} />

      <Eyebrow style={{ marginBottom:10 }}>{t.messages} {messages.length ? <span style={{ color:"var(--text-faint)" }}>· {messages.length}</span> : null}</Eyebrow>
      <div style={{ display:"grid", gap:10 }}>
        {messages.map((m, mi) => (
          <div key={mi}>
            {(m.content || []).map((c, ci) => (
              <CodeBlock key={ci} label={`${m.role}${c.cache ? " · cache_control: " + c.cache.type + (c.cache.ttl ? " · " + c.cache.ttl : "") : ""}`} copyText={c.text}
                collapsible={c.text.length > 600} collapsedHeight={200} labels={t.code} style={{ marginBottom: ci < m.content.length-1 ? 8 : 0 }}>{c.text}</CodeBlock>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Message structure strip (injected-context signature) ---------- */
function MessageStructure({ shape, t, style }) {
  if (!shape) return <p style={{ margin:0, fontFamily:"var(--font-ui)", fontSize:"var(--t-sm)", color:"var(--text-faint)", ...style }}>{t.noInjected}</p>;
  const rn = (k) => (t.delta.reminderNames && t.delta.reminderNames[k]) || k;
  const kinds = shape.reminder_kinds || [];
  const chip = { display:"inline-flex", alignItems:"center", gap:6, height:24, padding:"0 10px", borderRadius:"var(--radius-pill)", fontFamily:"var(--font-ui)", fontSize:"var(--t-caption)", fontWeight:"var(--w-medium)" };
  const stat = (label, val) => (
    <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
      <span style={{ fontFamily:"var(--font-mono)", fontSize:"var(--t-h3)", fontWeight:"var(--w-semibold)", color:"var(--text-strong)" }}>{val}</span>
      <span style={{ fontFamily:"var(--font-ui)", fontSize:"var(--t-micro)", textTransform:"uppercase", letterSpacing:"var(--track-over)", color:"var(--text-faint)" }}>{label}</span>
    </div>
  );
  return (
    <div style={{ border:"1px solid var(--line-hairline)", borderRadius:"var(--radius-3)", background:"var(--surface-card)", padding:"16px 18px", ...style }}>
      <div style={{ display:"flex", gap:28, marginBottom: kinds.length ? 14 : 0, flexWrap:"wrap" }}>
        {stat(t.blocks, shape.block_count)}
        {stat(t.probe, shape.probe)}
        {stat(t.cacheBreaks, shape.cache_breaks)}
      </div>
      {kinds.length > 0 && (
        <div>
          <div style={{ fontFamily:"var(--font-ui)", fontSize:"var(--t-micro)", textTransform:"uppercase", letterSpacing:"var(--track-over)", color:"var(--text-faint)", marginBottom:8 }}>{t.reminderKinds}</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {kinds.map(k => (
              <span key={k} style={{ ...chip, background:"var(--surface-tint)", color:"var(--brand-press)", border:"1px solid var(--brand-tint)" }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--brand)" }} />{rn(k)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- diff engine (kit demo only) ----------
   In production these rows are PRECOMPUTED at build time and the UI
   just renders them. Here we compute on the fly so the picker works
   for any pair in the sample. */
function systemTextOf(detail){ return (detail.system||[]).map(b=>b.text).join("\n\n"); }
function messagesTextOf(detail){ return (detail.messages||[]).map(m=>(m.content||[]).map(c=>c.text).join("\n")).join("\n\n"); }

/* Split a system prompt into `# Heading` sections (h1 boundaries).
   Text before the first heading becomes the "(preamble)" section. */
function splitSections(text){
  const lines = (text||"").split("\n");
  const out = []; let cur = { title:"(preamble)", lines:[] };
  for(const ln of lines){
    const m = ln.match(/^#\s+(.+?)\s*$/);
    if(m){ out.push(cur); cur = { title:m[1], lines:[ln] }; }
    else cur.lines.push(ln);
  }
  out.push(cur);
  return out.filter((s,i)=> !(i===0 && s.title==="(preamble)" && s.lines.join("").trim()===""));
}
/* Section-level diff: classify each section added/removed/modified/unchanged,
   in B's order with removed sections appended. */
function sectionDiff(aText, bText){
  const A=splitSections(aText), B=splitSections(bText);
  const aMap=new Map(), bMap=new Map();
  A.forEach(s=>{ if(!aMap.has(s.title)) aMap.set(s.title,s); });
  B.forEach(s=>{ if(!bMap.has(s.title)) bMap.set(s.title,s); });
  const out=[];
  B.forEach(s=>{
    const a=aMap.get(s.title);
    if(!a){ out.push({ title:s.title, status:"added", bLines:s.lines }); return; }
    const ab=a.lines.join("\n"), bb=s.lines.join("\n");
    if(ab===bb) out.push({ title:s.title, status:"unchanged" });
    else out.push({ title:s.title, status:"modified", aLines:a.lines, bLines:s.lines });
  });
  A.forEach(s=>{ if(!bMap.has(s.title)) out.push({ title:s.title, status:"removed", aLines:s.lines }); });
  return out;
}

function lineDiff(aLines, bLines){
  const n=aLines.length, m=bLines.length;
  const dp=Array.from({length:n+1},()=>new Int32Array(m+1));
  for(let i=n-1;i>=0;i--) for(let j=m-1;j>=0;j--)
    dp[i][j]= aLines[i]===bLines[j] ? dp[i+1][j+1]+1 : Math.max(dp[i+1][j], dp[i][j+1]);
  const rows=[]; let i=0,j=0,oldNo=1,newNo=1;
  while(i<n && j<m){
    if(aLines[i]===bLines[j]){ rows.push({kind:"context",oldNo:oldNo++,newNo:newNo++,text:aLines[i]}); i++; j++; }
    else if(dp[i+1][j] >= dp[i][j+1]){ rows.push({kind:"del",oldNo:oldNo++,text:aLines[i]}); i++; }
    else { rows.push({kind:"add",newNo:newNo++,text:bLines[j]}); j++; }
  }
  while(i<n) rows.push({kind:"del",oldNo:oldNo++,text:aLines[i++]});
  while(j<m) rows.push({kind:"add",newNo:newNo++,text:bLines[j++]});
  return rows;
}
function hunk(rows, ctx=3){
  const keep=new Array(rows.length).fill(false);
  rows.forEach((r,idx)=>{ if(r.kind!=="context"){ for(let k=Math.max(0,idx-ctx);k<=Math.min(rows.length-1,idx+ctx);k++) keep[k]=true; } });
  const out=[]; let gap=0;
  rows.forEach((r,idx)=>{ if(keep[idx]){ if(gap){ out.push({kind:"gap",count:gap}); gap=0; } out.push(r); } else gap++; });
  if(gap) out.push({kind:"gap",count:gap});
  return out;
}
/* Word-level intra-line highlight for adjacent 1:1 del→add "modified" pairs.
   Only triggers when the two lines are similar enough (shared-token ratio),
   so true add/remove lines stay whole. Attaches .segs to both rows. */
function tokenizeLine(s){ return String(s).match(/\s+|[^\s]+/g) || []; }
function wordLCS(a,b){
  const n=a.length,m=b.length;
  const dp=Array.from({length:n+1},()=>new Int32Array(m+1));
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--) dp[i][j]= a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
  const aMark=new Array(n).fill(true), bMark=new Array(m).fill(true);
  let i=0,j=0;
  while(i<n&&j<m){ if(a[i]===b[j]){ aMark[i]=false; bMark[j]=false; i++;j++; } else if(dp[i+1][j]>=dp[i][j+1]) i++; else j++; }
  return { aMark, bMark, common: dp[0][0] };
}
function segsFrom(tokens, marks){
  const segs=[]; for(let i=0;i<tokens.length;i++){ const hl=marks[i]; const last=segs[segs.length-1];
    if(last && last.hl===hl) last.text+=tokens[i]; else segs.push({ text:tokens[i], hl }); }
  return segs;
}
function markPairs(rows){
  for(let i=0;i<rows.length-1;i++){
    const a=rows[i], b=rows[i+1];
    if(a.kind==="del" && b.kind==="add" && (i+2>=rows.length || rows[i+2].kind!=="add") && (i===0 || rows[i-1].kind!=="del")){
      const at=tokenizeLine(a.text), bt=tokenizeLine(b.text);
      const { aMark, bMark, common }=wordLCS(at,bt);
      const ratio = common / Math.max(1, Math.min(at.filter(t=>t.trim()).length, bt.filter(t=>t.trim()).length));
      if(ratio >= 0.34){ a.segs=segsFrom(at,aMark); b.segs=segsFrom(bt,bMark); }
      i++;
    }
  }
  return rows;
}
function toolDiff(aTools, bTools){
  const aMap=new Map((aTools||[]).map(x=>[x.name,x])), bMap=new Map((bTools||[]).map(x=>[x.name,x]));
  const added=[], modified=[], removed=[];
  (bTools||[]).forEach(x=>{ if(!aMap.has(x.name)) added.push({...x,change:"added"});
    else { const o=aMap.get(x.name);
      const descChanged=o.description!==x.description, schemaChanged=JSON.stringify(o.schema)!==JSON.stringify(x.schema);
      if(descChanged||schemaChanged) modified.push({...x, change:"modified",
        mods:[descChanged?"description":null, schemaChanged?"input_schema":null].filter(Boolean),
        prevDescription:o.description, prevSchema:o.schema, descChanged, schemaChanged }); } });
  (aTools||[]).forEach(x=>{ if(!bMap.has(x.name)) removed.push({...x,change:"removed"}); });
  return { added, removed, modified, all:[...added, ...modified, ...removed] };
}

/* Modified-tool card: shows an inline before→after line diff of the
   description and/or input_schema (reuses the line-diff engine). */
function ModifiedToolCard({ tool, t, defaultOpen=false }){
  const [open, setOpen] = React.useState(defaultOpen);
  const descRows = tool.descChanged ? hunk(lineDiff(String(tool.prevDescription||"").split("\n"), String(tool.description||"").split("\n"))) : null;
  const schemaRows = tool.schemaChanged ? hunk(lineDiff(JSON.stringify(tool.prevSchema, null, 2).split("\n"), JSON.stringify(tool.schema, null, 2).split("\n"))) : null;
  const well = { border:"1px solid var(--line-hairline)", borderRadius:"var(--radius-2)", overflow:"hidden", background:"var(--surface-card)" };
  const renderRows = (rows) => markPairs(rows).map((l,i)=> l.kind==="gap"
    ? <GapRow key={i} count={l.count} t={t} />
    : <DiffLine key={i} kind={l.kind} oldNo={l.oldNo} newNo={l.newNo} segs={l.segs} showNumbers>{l.text || " "}</DiffLine>);
  return (
    <div style={{ border:"1px solid var(--line-hairline)", borderLeft:"2px solid var(--mod-edge)", borderRadius:"var(--radius-3)", background:"var(--surface-card)", overflow:"hidden" }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"12px 14px", border:"none", background:"none", cursor:"pointer", textAlign:"left" }}>
        <Icon name="chevR" size={14} stroke={2.4} style={{ color:"var(--text-faint)", transform:open?"rotate(90deg)":"none", transition:"transform var(--dur-2) var(--ease-standard)" }} />
        <span style={{ fontFamily:"var(--font-mono)", fontSize:"var(--t-code)", fontWeight:"var(--w-semibold)", color:"var(--text-strong)" }}>{tool.name}</span>
        <Badge tone="mod">{t.modifiedLabel}</Badge>
        <span style={{ flex:1 }} />
        <span style={{ fontFamily:"var(--font-ui)", fontSize:"var(--t-caption)", color:"var(--mod-text)" }}>{t.changed}: {tool.mods.join(" · ")}</span>
      </button>
      {open && (
        <div style={{ padding:"0 14px 14px", display:"grid", gap:14 }}>
          {descRows && (<div>
            <Eyebrow style={{ marginBottom:8 }}>description</Eyebrow>
            <div style={well}>{renderRows(descRows)}</div>
          </div>)}
          {schemaRows && (<div>
            <Eyebrow style={{ marginBottom:8 }}>input_schema</Eyebrow>
            <div style={well}>{renderRows(schemaRows)}</div>
          </div>)}
        </div>
      )}
    </div>
  );
}

/* ---------- System-prompt diff (section-aware + unified) ---------- */
function SystemDiff({ sections, rows, t }) {
  const [mode, setMode] = React.useState("section");
  const counts = React.useMemo(()=>{
    const c={ added:0, removed:0, modified:0, unchanged:0 };
    sections.forEach(s=>{ c[s.status]++; });
    return c;
  }, [sections]);

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12, flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {counts.added>0 && <Badge tone="add" mono>+{counts.added} {t.added}</Badge>}
          {counts.removed>0 && <Badge tone="del" mono>−{counts.removed} {t.removed}</Badge>}
          {counts.modified>0 && <Badge tone="mod" mono>~{counts.modified} {t.modifiedLabel}</Badge>}
          {counts.unchanged>0 && <Badge tone="neutral" mono>{counts.unchanged} {t.unchangedLabel}</Badge>}
          <span style={{ alignSelf:"center", fontFamily:"var(--font-ui)", fontSize:"var(--t-caption)", color:"var(--text-faint)" }}>{t.sections}</span>
        </div>
        <div style={{ marginLeft:"auto" }}>
          <SegmentedControl size="sm" value={mode} onChange={setMode}
            options={[{ value:"section", label:t.bySection }, { value:"unified", label:t.unified }]} />
        </div>
      </div>

      {mode === "unified" ? (
        <div style={{ border:"1px solid var(--line-hairline)", borderRadius:"var(--radius-3)", overflow:"hidden", background:"var(--surface-card)" }}>
          {markPairs(rows).map((l,i)=> l.kind==="gap"
            ? <GapRow key={i} count={l.count} t={t} />
            : <DiffLine key={i} kind={l.kind} oldNo={l.oldNo} newNo={l.newNo} segs={l.segs} showNumbers>{l.text || " "}</DiffLine>
          )}
        </div>
      ) : (
        <div style={{ display:"grid", gap:8 }}>
          {(function(){ const fc=sections.findIndex(s=>s.status!=="unchanged"); return sections.map((s, i) => <SectionRow key={i} idx={i} section={s} t={t} defaultOpen={i===fc} />); })()}
        </div>
      )}
    </div>
  );
}
function SectionRow({ section, t, idx, defaultOpen=false }) {
  const changed = section.status !== "unchanged";
  const [open, setOpen] = React.useState(changed && defaultOpen);
  const meta = {
    added:     { tone:"add", accent:"var(--add-edge)", label:t.added },
    removed:   { tone:"del", accent:"var(--del-edge)", label:t.removed },
    modified:  { tone:"mod", accent:"var(--mod-edge)", label:t.modifiedLabel },
    unchanged: { tone:"neutral", accent:"var(--line-hairline)", label:t.unchangedLabel },
  }[section.status];

  const innerRows = React.useMemo(()=>{
    if(section.status === "modified") return hunk(lineDiff(section.aLines, section.bLines));
    if(section.status === "added") return section.bLines.map((tx,k)=>({ kind:"add", newNo:k+1, text:tx }));
    if(section.status === "removed") return section.aLines.map((tx,k)=>({ kind:"del", oldNo:k+1, text:tx }));
    return [];
  }, [section]);

  const title = section.title === "(preamble)" ? t.preamble : "# " + section.title;

  return (
    <div id={idx!=null?`sec-${idx}`:undefined} style={{ scrollMarginTop:84, border:"1px solid var(--line-hairline)", borderLeft:`2px solid ${meta.accent}`, borderRadius:"var(--radius-3)", background:"var(--surface-card)", overflow:"hidden", opacity: section.status==="unchanged"?0.7:1 }}>
      <button onClick={()=> changed && setOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"11px 14px", border:"none", background:"none", cursor: changed?"pointer":"default", textAlign:"left" }}>
        {changed ? <Icon name="chevR" size={14} stroke={2.4} style={{ color:"var(--text-faint)", transform:open?"rotate(90deg)":"none", transition:"transform var(--dur-2) var(--ease-standard)" }} /> : <span style={{ width:14, flex:"0 0 14px" }} />}
        <span style={{ fontFamily:"var(--font-mono)", fontSize:"var(--t-code)", fontWeight:"var(--w-semibold)", color: section.status==="removed"?"var(--del-text)":"var(--text-strong)", textDecoration: section.status==="removed"?"line-through":"none" }}>{title}</span>
        <Badge tone={meta.tone}>{meta.label}</Badge>
        <span style={{ flex:1 }} />
        {section.status==="modified" && (()=>{ const a=innerRows.filter(r=>r.kind==="add").length, d=innerRows.filter(r=>r.kind==="del").length; return <span style={{ display:"flex", gap:6 }}>{a>0&&<Badge tone="add" mono>+{a}</Badge>}{d>0&&<Badge tone="del" mono>−{d}</Badge>}</span>; })()}
        {section.status==="added" && <Badge tone="add" mono>+{section.bLines.length}</Badge>}
        {section.status==="removed" && <Badge tone="del" mono>−{section.aLines.length}</Badge>}
      </button>
      {open && changed && (
        <div style={{ borderTop:"1px solid var(--line-hairline)" }}>
          {markPairs(innerRows).map((l,i)=> l.kind==="gap"
            ? <GapRow key={i} count={l.count} t={t} />
            : <DiffLine key={i} kind={l.kind} oldNo={l.oldNo} newNo={l.newNo} segs={l.segs} showNumbers>{l.text || " "}</DiffLine>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Compare ---------- */
function CompareView({ t, locale, from, to, go, focus }) {
  const okVersions = React.useMemo(()=>{
    const out = [];
    DATA.INDEX.filter(x=>x.result==="ok").forEach(x=>{
      out.push({ value: x.version, label: x.version });
      (x.variants||[]).forEach(vid=>{
        const va = ((DATA.VERSIONS[x.version]||{}).variants||[]).find(z=>z.id===vid);
        out.push({ value: `${x.version}@${vid}`, label: `${x.version} ⎇ ${shortModel(va ? va.model_in_request : vid)}` });
      });
    });
    return out;
  }, []);
  const a = getDetail(from), b = getDetail(to);
  const valid = a && b && a.result!=="fail" && b.result!=="fail";

  React.useEffect(()=>{
    if(!focus) return;
    const id = focus==="beta" ? "cmp-context" : "cmp-"+focus;
    let tries = 0, timer;
    const tryScroll = ()=>{
      const el = document.getElementById(id);
      if(el){ const y = el.getBoundingClientRect().top + window.scrollY - 76; window.scrollTo(0, y); document.documentElement.scrollTop = y; return; }
      if(tries++ < 20){ timer = setTimeout(tryScroll, 100); }
    };
    timer = setTimeout(tryScroll, 150);
    return ()=>clearTimeout(timer);
  }, [focus, from, to]);

  const { rows, sections, adds, dels, tools, betaAdded, betaRemoved, maxChange, modelChange, fbChange, thinkingChange, effortChange, tempChange, streamChange, cmChange, diagChange, ctx } = React.useMemo(()=>{
    if(!valid) return { rows:[], sections:[], adds:0, dels:0, tools:[], betaAdded:[], betaRemoved:[], maxChange:null, modelChange:null, fbChange:null, thinkingChange:null, effortChange:null, tempChange:null, streamChange:null, cmChange:null, diagChange:null, ctx:null };
    const raw = lineDiff(systemTextOf(a).split("\n"), systemTextOf(b).split("\n"));
    const pB=new Set(a.betas||[]), cB=new Set(b.betas||[]);
    const sa=a.msg_shape, sb=b.msg_shape;
    const pR=new Set((sa&&sa.reminder_kinds)||[]), cR=new Set((sb&&sb.reminder_kinds)||[]);
    const ctx = (sa&&sb) ? {
      added:(sb.reminder_kinds||[]).filter(x=>!pR.has(x)),
      removed:(sa.reminder_kinds||[]).filter(x=>!cR.has(x)),
      from:sa, to:sb,
      probeChanged: sa.probe!==sb.probe ? { from:sa.probe, to:sb.probe } : null,
      blockChanged: sa.block_count!==sb.block_count ? { from:sa.block_count, to:sb.block_count } : null,
      textRows: (function(){ const at=messagesTextOf(a), bt=messagesTextOf(b); if(at===bt) return null; const raw=lineDiff(at.split("\n"), bt.split("\n")); return { rows:hunk(raw), adds:raw.filter(r=>r.kind==="add").length, dels:raw.filter(r=>r.kind==="del").length }; })(),
    } : null;
    return {
      rows: hunk(raw),
      sections: sectionDiff(systemTextOf(a), systemTextOf(b)),
      adds: raw.filter(r=>r.kind==="add").length,
      dels: raw.filter(r=>r.kind==="del").length,
      tools: toolDiff(a.tools, b.tools),
      betaAdded: (b.betas||[]).filter(x=>!pB.has(x)),
      betaRemoved: (a.betas||[]).filter(x=>!cB.has(x)),
      maxChange: a.max_tokens!==b.max_tokens ? { from:a.max_tokens, to:b.max_tokens } : null,
      modelChange: a.model!==b.model ? { from:a.model, to:b.model } : null,
      fbChange: JSON.stringify(a.fallbacks||null)!==JSON.stringify(b.fallbacks||null) ? { from:a.fallbacks||null, to:b.fallbacks||null } : null,
      thinkingChange: JSON.stringify(a.thinking||null)!==JSON.stringify(b.thinking||null) ? { from:a.thinking||null, to:b.thinking||null } : null,
      effortChange: (a.effort||null)!==(b.effort||null) ? { from:a.effort||null, to:b.effort||null } : null,
      tempChange: JSON.stringify(a.temperature??null)!==JSON.stringify(b.temperature??null) ? { from:a.temperature??null, to:b.temperature??null } : null,
      streamChange: JSON.stringify(a.stream??null)!==JSON.stringify(b.stream??null) ? { from:a.stream??null, to:b.stream??null } : null,
      cmChange: JSON.stringify(a.context_management||null)!==JSON.stringify(b.context_management||null) ? { from:a.context_management||null, to:b.context_management||null } : null,
      diagChange: JSON.stringify(a.diagnostics||null)!==JSON.stringify(b.diagnostics||null) ? { from:a.diagnostics||null, to:b.diagnostics||null } : null,
      ctx,
    };
  }, [from, to]);

  const noSystemChange = valid && adds===0 && dels===0;
  const noToolChange = valid && tools.all.length===0;
  const noBetaChange = valid && !(betaAdded.length || betaRemoved.length || maxChange || modelChange || fbChange || thinkingChange || effortChange || tempChange || streamChange || cmChange || diagChange);
  const noCtxChange = valid && !(ctx && (ctx.added.length || ctx.removed.length || ctx.probeChanged || ctx.blockChanged || ctx.textRows));

  const outline = React.useMemo(()=>{
    if(!valid) return [];
    const out = [];
    if(!noSystemChange){
      const items = sections.map((s,i)=>({ s, i })).filter(({s})=>s.status!=="unchanged")
        .map(({s,i})=>({ id:`sec-${i}`, name: s.title==="(preamble)"?t.preamble:s.title, status:s.status }));
      out.push({ id:"cmp-system", label:t.systemDiff, counts:{ add:adds, del:dels }, items });
    }
    if(!noToolChange){
      out.push({ id:"cmp-tools", label:t.toolChanges, counts:{ add:tools.added.length, mod:tools.modified.length, del:tools.removed.length },
        items: tools.all.map(x=>({ id:`tool-${x.name}`, name:x.name, status:x.change })) });
    }
    if(!noBetaChange) out.push({ id:"cmp-beta", label:t.betaChanges, counts:{ add:betaAdded.length, del:betaRemoved.length }, items:[] });
    if(!noCtxChange){ const ba=ctx.textRows?ctx.textRows.adds:0, bd=ctx.textRows?ctx.textRows.dels:0; const cmod=(ctx.probeChanged?1:0)+(ctx.blockChanged?1:0); out.push({ id:"cmp-context", label:t.injectedChanges, counts:{ add:ctx.added.length+ba, del:ctx.removed.length+bd, mod:cmod }, items:[] }); }
    if(changelogRangeVersions(from, to).length) out.push({ id:"cmp-changelog", label:t.changelog, counts:{}, items:[] });
    return out;
  }, [valid, from, to]);

  const [activeId, setActiveId] = React.useState(null);
  React.useEffect(()=>{
    if(!valid || !outline.length) return;
    const ids = outline.map(o=>o.id);
    const onScroll = ()=>{
      if(window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4){ setActiveId(ids[ids.length-1]); return; }
      const target = 110;
      let best = ids[0], bestDist = Infinity;
      for(const id of ids){ const el=document.getElementById(id); if(!el) continue; const d=Math.abs(el.getBoundingClientRect().top - target); if(d<bestDist){ bestDist=d; best=id; } }
      setActiveId(best);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive:true });
    return ()=>window.removeEventListener("scroll", onScroll);
  }, [outline, from, to]);
  const scrollTo = (id)=>{ const el=document.getElementById(id); if(el){ const y=el.getBoundingClientRect().top+window.scrollY-76; window.scrollTo(0,y); document.documentElement.scrollTop=y; } };
  const [railOpen, setRailOpen] = React.useState(true);

  return (
    <div style={{ maxWidth:"var(--container)", margin:"0 auto", padding:"36px 24px 96px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap", marginBottom: valid?14:0 }}>
        <Eyebrow>{t.compareVersions}</Eyebrow>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginLeft:"auto" }}>
          <Picker label={t.from} value={from} options={okVersions} onChange={(v)=>go({ view:"compare", from:v, to })} />
          <Icon name="arrowR" size={18} style={{ color:"var(--text-faint)" }} />
          <Picker label={t.to} value={to} options={okVersions} onChange={(v)=>go({ view:"compare", from, to:v })} />
        </div>
      </div>
      {valid && (
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <Badge tone="add" mono>+{adds}</Badge><Badge tone="del" mono>−{dels}</Badge>
          <Badge tone={tools.all.length?"mod":"neutral"} mono>{tools.all.length} {t.toolsCount}</Badge>
          {(betaAdded.length+betaRemoved.length)>0 && <Badge tone="brand" mono>{betaAdded.length+betaRemoved.length} {t.delta.betas}</Badge>}
          {(a.mcp_connecting || b.mcp_connecting) && <Tooltip tip={t.mcpNotConnected.tip} placement="bottom"><Badge tone="accent">{t.mcpNotConnected.label}</Badge></Tooltip>}
        </div>
      )}
      {valid && a.captured_at && b.captured_at && a.captured_at !== b.captured_at && (
        <div style={{ marginTop:10, display:"inline-flex", alignItems:"center", padding:"6px 11px", borderRadius:"var(--radius-2)", background:"var(--surface-well)", color:"var(--text-muted)", fontFamily:"var(--font-ui)", fontSize:"var(--t-sm)", lineHeight:1.5 }}>
          {t.captureGap
            .replace("{n}", String(Math.abs(Math.round((new Date(b.captured_at) - new Date(a.captured_at)) / 86400000))))
            .replace("{from}", a.captured_at.slice(5)).replace("{to}", b.captured_at.slice(5))}
        </div>
      )}

      {!valid ? (
        <EmptyNote>{t.cantCompare}</EmptyNote>
      ) : (
        <div style={{ marginTop:28, display:"grid", gridTemplateColumns: railOpen ? "240px minmax(0,1fr)" : "minmax(0,1fr)", gap:36, alignItems:"start" }}>
          {railOpen
            ? <CompareOutline outline={outline} activeId={activeId} onJump={scrollTo} onCollapse={()=>setRailOpen(false)} t={t} />
            : <button onClick={()=>setRailOpen(true)} title={t.changeIndex} aria-label={t.changeIndex} style={{ position:"fixed", left:20, bottom:24, zIndex:15, display:"inline-flex", alignItems:"center", justifyContent:"center", width:44, height:44, border:"1px solid var(--line-hairline)", borderRadius:"var(--radius-pill)", background:"var(--surface-card)", boxShadow:"var(--shadow-md)", cursor:"pointer", color:"var(--text-muted)" }}><Icon name="list" size={18} /></button>}
          <div style={{ display:"grid", gap:26, minWidth:0 }}>
          {(noSystemChange && noToolChange && noBetaChange && noCtxChange) && (
            <EmptyNote subtle>{t.noDiffChange}</EmptyNote>
          )}
          {!noSystemChange && (
          <div id="cmp-system" style={{ scrollMarginTop:84 }}>
            <Eyebrow style={{ marginBottom:12 }}>{t.systemDiff}</Eyebrow>
            <SystemDiff sections={sections} rows={rows} t={t} />
          </div>
          )}
          {!noToolChange && (
          <div id="cmp-tools" style={{ scrollMarginTop:84 }}>
            <Eyebrow style={{ marginBottom:12 }}>{t.toolChanges}</Eyebrow>
            <div style={{ display:"grid", gap:14 }}>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {tools.added.length>0 && <Badge tone="add" mono>+{tools.added.length} {t.added}</Badge>}
                  {tools.removed.length>0 && <Badge tone="del" mono>−{tools.removed.length} {t.removed}</Badge>}
                  {tools.modified.length>0 && <Badge tone="mod" mono>~{tools.modified.length} {t.modifiedLabel}</Badge>}
                </div>
                {["added","modified","removed"].map(group => tools[group].length>0 ? (
                  <div key={group} style={{ display:"grid", gap:8 }}>
                    {tools[group].map(tool => (
                      <div key={tool.name} id={`tool-${tool.name}`} style={{ scrollMarginTop:84 }}>
                        {tool.change==="modified"
                          ? <ModifiedToolCard tool={tool} t={t} defaultOpen={tool===tools.all[0]} />
                          : <ToolCard name={tool.name} change={tool.change} description={tool.description} schema={tool.schema} defaultOpen={tool===tools.all[0]}
                              changeLabels={{ added:t.added, removed:t.removed, modified:t.modifiedLabel }} labels={t.code} />}
                      </div>
                    ))}
                  </div>
                ) : null)}
              </div>
          </div>
          )}
          {!noBetaChange && (
          <div id="cmp-beta" style={{ scrollMarginTop:84 }}>
            <Eyebrow style={{ marginBottom:12 }}>{t.betaChanges}</Eyebrow>
            <div style={{ display:"grid", gap:14 }}>
                {modelChange && (
                  <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", fontFamily:"var(--font-mono)", fontSize:"var(--t-code-sm)" }}>
                    <Badge tone="mod" mono>model</Badge>
                    <span style={{ color:"var(--del-text)" }}>{modelChange.from || "—"}</span>
                    <Icon name="arrowR" size={14} style={{ color:"var(--text-faint)" }} />
                    <span style={{ color:"var(--add-text)" }}>{modelChange.to || "—"}</span>
                  </div>
                )}
                {fbChange && (
                  <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", fontFamily:"var(--font-mono)", fontSize:"var(--t-code-sm)" }}>
                    <Badge tone="mod" mono>fallbacks</Badge>
                    <span style={{ color:"var(--del-text)" }}>{fbChange.from ? JSON.stringify(fbChange.from) : t.absent}</span>
                    <Icon name="arrowR" size={14} style={{ color:"var(--text-faint)" }} />
                    <span style={{ color:"var(--add-text)" }}>{fbChange.to ? JSON.stringify(fbChange.to) : t.absent}</span>
                  </div>
                )}
                {thinkingChange && (
                  <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", fontFamily:"var(--font-mono)", fontSize:"var(--t-code-sm)" }}>
                    <Badge tone="mod" mono>thinking</Badge>
                    <span style={{ color:"var(--del-text)" }}>{thinkingChange.from ? JSON.stringify(thinkingChange.from) : t.absent}</span>
                    <Icon name="arrowR" size={14} style={{ color:"var(--text-faint)" }} />
                    <span style={{ color:"var(--add-text)" }}>{thinkingChange.to ? JSON.stringify(thinkingChange.to) : t.absent}</span>
                  </div>
                )}
                {[["effort", effortChange], ["temperature", tempChange], ["stream", streamChange], ["context_management", cmChange], ["diagnostics", diagChange]].map(([label, ch]) => ch && (
                  <div key={label} style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", fontFamily:"var(--font-mono)", fontSize:"var(--t-code-sm)" }}>
                    <Badge tone="mod" mono>{label}</Badge>
                    <span style={{ color:"var(--del-text)", overflowWrap:"anywhere" }}>{ch.from!=null ? JSON.stringify(ch.from) : t.absent}</span>
                    <Icon name="arrowR" size={14} style={{ color:"var(--text-faint)", flexShrink:0 }} />
                    <span style={{ color:"var(--add-text)", overflowWrap:"anywhere" }}>{ch.to!=null ? JSON.stringify(ch.to) : t.absent}</span>
                  </div>
                ))}
                {maxChange && (
                  <div style={{ display:"flex", alignItems:"center", gap:10, fontFamily:"var(--font-mono)", fontSize:"var(--t-code-sm)" }}>
                    <Badge tone="mod" mono>{t.maxTokens}</Badge>
                    <span style={{ color:"var(--del-text)" }}>{maxChange.from!=null?maxChange.from.toLocaleString("en-US"):"—"}</span>
                    <Icon name="arrowR" size={14} style={{ color:"var(--text-faint)" }} />
                    <span style={{ color:"var(--add-text)" }}>{maxChange.to!=null?maxChange.to.toLocaleString("en-US"):"—"}</span>
                  </div>
                )}
                {(betaAdded.length || betaRemoved.length) ? (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {betaAdded.map(x=><Tag key={"a"+x} style={{ fontFamily:"var(--font-mono)", fontSize:"var(--t-micro)", color:"var(--add-text)", borderColor:"var(--add-edge)", background:"var(--add-surface)" }}>+ {x}</Tag>)}
                    {betaRemoved.map(x=><Tag key={"r"+x} style={{ fontFamily:"var(--font-mono)", fontSize:"var(--t-micro)", color:"var(--del-text)", borderColor:"var(--del-edge)", background:"var(--del-surface)", textDecoration:"line-through" }}>− {x}</Tag>)}
                  </div>
                ) : null}
              </div>
          </div>
          )}
          {!noCtxChange && (
          <div id="cmp-context" style={{ scrollMarginTop:84 }}>
            <Eyebrow style={{ marginBottom:12 }}>{t.injectedChanges}</Eyebrow>
            <div style={{ display:"grid", gap:12 }}>
                {(ctx.added.length || ctx.removed.length) ? (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {ctx.added.map(k=><Tag key={"a"+k} style={{ fontSize:"var(--t-caption)", color:"var(--add-text)", borderColor:"var(--add-edge)", background:"var(--add-surface)" }}>+ {(t.delta.reminderNames&&t.delta.reminderNames[k])||k}</Tag>)}
                    {ctx.removed.map(k=><Tag key={"r"+k} style={{ fontSize:"var(--t-caption)", color:"var(--del-text)", borderColor:"var(--del-edge)", background:"var(--del-surface)", textDecoration:"line-through" }}>− {(t.delta.reminderNames&&t.delta.reminderNames[k])||k}</Tag>)}
                  </div>
                ) : null}
                {ctx.probeChanged && (
                  <div style={{ display:"flex", alignItems:"center", gap:10, fontFamily:"var(--font-mono)", fontSize:"var(--t-code-sm)" }}>
                    <Badge tone="mod" mono>{t.probe}</Badge>
                    <span style={{ color:"var(--del-text)" }}>{ctx.probeChanged.from}</span>
                    <Icon name="arrowR" size={14} style={{ color:"var(--text-faint)" }} />
                    <span style={{ color:"var(--add-text)" }}>{ctx.probeChanged.to}</span>
                  </div>
                )}
                {ctx.blockChanged && (
                  <div style={{ display:"flex", alignItems:"center", gap:10, fontFamily:"var(--font-mono)", fontSize:"var(--t-code-sm)" }}>
                    <Badge tone="mod" mono>{t.blocks}</Badge>
                    <span style={{ color:"var(--del-text)" }}>{ctx.blockChanged.from}</span>
                    <Icon name="arrowR" size={14} style={{ color:"var(--text-faint)" }} />
                    <span style={{ color:"var(--add-text)" }}>{ctx.blockChanged.to}</span>
                  </div>
                )}
                {ctx.textRows && <InjectedContentDiff data={ctx.textRows} t={t} />}
              </div>
          </div>
          )}
          <CompareChangelog t={t} locale={locale} from={from} to={to} go={go} />
          </div>
        </div>
      )}
    </div>
  );
}
function CompareOutline({ outline, activeId, onJump, onCollapse, t }){
  if(!outline.length) return <div />;
  return (
    <nav style={{ position:"sticky", top:84, alignSelf:"start", maxHeight:"calc(100vh - 104px)", overflowY:"auto", display:"grid", gridTemplateColumns:"minmax(0,1fr)", gap:2, paddingRight:4 }} className="lin-scroll">
      <div style={{ display:"flex", alignItems:"center", gap:6, padding:"2px 6px 8px" }}>
        <span style={{ flex:1, fontFamily:"var(--font-ui)", fontSize:"var(--t-micro)", textTransform:"uppercase", letterSpacing:"var(--track-over)", fontWeight:"var(--w-semibold)", color:"var(--text-faint)" }}>{t.changeIndex}</span>
        {onCollapse && <button onClick={onCollapse} title={t.collapse} style={{ display:"inline-flex", border:"none", background:"none", cursor:"pointer", color:"var(--text-faint)", padding:2 }}><Icon name="chevLeft" size={14} /></button>}
      </div>
      {outline.map(g=>{
        const on = g.id===activeId;
        return (
          <button key={g.id} onClick={()=>onJump(g.id)} style={{ display:"grid", gap:5, width:"100%", minWidth:0, textAlign:"left", padding:"9px 12px", border:"none",
            borderLeft:`2px solid ${on?"var(--brand)":"transparent"}`, background:on?"var(--surface-tint)":"transparent", borderRadius:"0 var(--radius-2) var(--radius-2) 0", cursor:"pointer", transition:"var(--transition-ui)" }}>
            <span style={{ minWidth:0, fontFamily:"var(--font-ui)", fontSize:"var(--t-sm)", fontWeight:on?"var(--w-semibold)":"var(--w-medium)", color:on?"var(--brand)":"var(--text-body)", lineHeight:1.3 }}>{g.label}</span>
            <span style={{ display:"flex", gap:8, fontFamily:"var(--font-mono)", fontSize:"var(--t-micro)", whiteSpace:"nowrap" }}>
              {g.counts.add>0 && <span style={{ color:"var(--add-text)" }}>+{g.counts.add}</span>}
              {g.counts.mod>0 && <span style={{ color:"var(--mod-text)" }}>~{g.counts.mod}</span>}
              {g.counts.del>0 && <span style={{ color:"var(--del-text)" }}>−{g.counts.del}</span>}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
function InjectedContentDiff({ data, t }){
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ border:"1px solid var(--line-hairline)", borderRadius:"var(--radius-3)", overflow:"hidden", background:"var(--surface-card)" }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:10, width:"100%", padding:"11px 14px", border:"none", background:"none", cursor:"pointer", textAlign:"left" }}>
        <Icon name="chevR" size={14} stroke={2.4} style={{ color:"var(--text-faint)", transform:open?"rotate(90deg)":"none", transition:"transform var(--dur-2) var(--ease-standard)" }} />
        <span style={{ fontFamily:"var(--font-ui)", fontSize:"var(--t-sm)", fontWeight:"var(--w-semibold)", color:"var(--text-strong)" }}>{t.injectedBody}</span>
        <span style={{ display:"flex", gap:6 }}>
          {data.adds>0 && <Badge tone="add" mono>+{data.adds}</Badge>}
          {data.dels>0 && <Badge tone="del" mono>−{data.dels}</Badge>}
        </span>
        <span style={{ flex:1 }} />
        <span style={{ fontFamily:"var(--font-ui)", fontSize:"var(--t-micro)", color:"var(--text-faint)", fontStyle:"italic" }}>{t.injectedBodyNote}</span>
      </button>
      {open && (
        <div style={{ borderTop:"1px solid var(--line-hairline)" }}>
          {markPairs(data.rows).map((l,i)=> l.kind==="gap"
            ? <GapRow key={i} count={l.count} t={t} />
            : <DiffLine key={i} kind={l.kind} oldNo={l.oldNo} newNo={l.newNo} segs={l.segs} showNumbers>{l.text || " "}</DiffLine>
          )}
        </div>
      )}
    </div>
  );
}
function GapRow({ count, t }){
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"5px 0 5px 64px", background:"var(--surface-well)", borderTop:"1px solid var(--line-faint)", borderBottom:"1px solid var(--line-faint)" }}>
      <span style={{ fontFamily:"var(--font-mono)", fontSize:"var(--t-micro)", color:"var(--text-faint)", letterSpacing:"0.1em" }}>⋯</span>
      <span style={{ fontFamily:"var(--font-ui)", fontSize:"var(--t-caption)", color:"var(--text-faint)" }}>{t.unchanged(count)}</span>
    </div>
  );
}
function EmptyNote({ children, subtle }){
  return <div style={{ marginTop: subtle?0:30, border:`1px ${subtle?"solid":"dashed"} var(--line-strong)`, borderRadius:"var(--radius-3)",
    padding: subtle?"22px":"40px", textAlign:"center", fontFamily:"var(--font-ui)", fontSize:"var(--t-sm)", color:"var(--text-faint)",
    background: subtle?"var(--surface-well)":"transparent" }}>{children}</div>;
}
function Picker({ label, value, options, onChange }) {
  const norm = options.map(o => typeof o === "string" ? { value: o, label: o } : o);
  const cur = norm.find(o => o.value === value);
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const listRef = React.useRef(null);
  React.useEffect(()=>{
    if(!open) return;
    const onDoc = (e)=>{ if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e)=>{ if(e.key==="Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    const list = listRef.current;
    const sel = list && list.querySelector("[data-on='1']");
    if(list && sel){
      const lr = list.getBoundingClientRect(), sr = sel.getBoundingClientRect();
      list.scrollTop += (sr.top - lr.top) - (lr.height - sr.height) / 2;
    }
    return ()=>{ document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <span ref={ref} style={{ display:"inline-flex", alignItems:"center", gap:8, position:"relative" }}>
      <span style={{ fontFamily:"var(--font-ui)", fontSize:"var(--t-caption)", textTransform:"uppercase", letterSpacing:"var(--track-over)", fontWeight:600, color:"var(--text-faint)" }}>{label}</span>
      <button onClick={()=>setOpen(o=>!o)} style={{ display:"inline-flex", alignItems:"center", gap:8, height:32, padding:"0 9px 0 11px",
        border:`1px solid ${open?"var(--brand)":"var(--line-strong)"}`, borderRadius:"var(--radius-2)", background:"var(--surface-card)",
        color:"var(--text-strong)", fontFamily:"var(--font-mono)", fontSize:"var(--t-sm)", cursor:"pointer", transition:"var(--transition-ui)" }}>
        <span>{cur ? cur.label : value}</span>
        <Icon name="chevR" size={14} style={{ color:"var(--text-faint)", transform:open?"rotate(-90deg)":"rotate(90deg)", transition:"transform var(--dur-2) var(--ease-standard)" }} />
      </button>
      {open && (
        <div ref={listRef} className="lin-scroll" style={{ position:"absolute", top:"calc(100% + 6px)", right:0, zIndex:30, width:160, maxHeight:280, overflowY:"auto",
          background:"var(--surface-card)", border:"1px solid var(--line-hairline)", borderRadius:"var(--radius-3)", boxShadow:"var(--shadow-pop)", padding:4 }}>
          {norm.map(o=>{ const on=o.value===value; return (
            <button key={o.value} data-on={on?"1":"0"} onClick={()=>{ onChange(o.value); setOpen(false); }} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", textAlign:"left",
              padding:"6px 9px", border:"none", borderRadius:"var(--radius-1)", cursor:"pointer",
              background:on?"var(--brand-tint)":"transparent", color:on?"var(--brand-press)":"var(--text-body)",
              fontFamily:"var(--font-mono)", fontSize:"var(--t-sm)", fontWeight:on?"var(--w-semibold)":"var(--w-regular)" }}
              onMouseEnter={(e)=>{ if(!on) e.currentTarget.style.background="var(--surface-well)"; }}
              onMouseLeave={(e)=>{ if(!on) e.currentTarget.style.background="transparent"; }}>
              {on && <Icon name="check" size={13} style={{ color:"var(--brand)" }} />}
              <span style={{ marginLeft:on?0:21, whiteSpace:"nowrap" }}>{o.label}</span>
            </button>
          ); })}
        </div>
      )}
    </span>
  );
}

/* ---------- Search overlay ---------- */
function SearchOverlay({ t, onClose, go }) {
  const [q, setQ] = React.useState("");
  const inputRef = React.useRef(null);
  React.useEffect(()=>{ inputRef.current && inputRef.current.focus(); }, []);

  // Reverse index over UNIQUE blocks/tools → newest version using each (built once)
  const usage = React.useMemo(()=>{
    const blockUsers = {}, toolUsers = {};
    DATA.INDEX.forEach(r => {
      if (r.result !== "ok") return;
      const v = DATA.VERSIONS[r.version];
      (v.blocks || []).forEach(id => { (blockUsers[id] = blockUsers[id] || []).push(r.version); });
      (v.tools || []).forEach(id => { (toolUsers[id] = toolUsers[id] || []).push(r.version); });
    });
    return { blockUsers, toolUsers }; // INDEX is newest-first, so [0] is newest
  }, []);

  const results = React.useMemo(()=>{
    const query = q.trim().toLowerCase();
    if (query.length < 2) return [];
    const out = [];
    for (const [id, text] of Object.entries(DATA.BLOCKS)) {
      const i = text.toLowerCase().indexOf(query);
      if (i >= 0) { const vers = usage.blockUsers[id] || []; if (vers.length) out.push({ version: vers[0], count: vers.length, where: t.inSystem, snippet: snip(text, i, query.length) }); }
    }
    for (const [id, tool] of Object.entries(DATA.TOOLDEFS)) {
      const inName = tool.name.toLowerCase().includes(query);
      const di = (tool.description || "").toLowerCase().indexOf(query);
      if (inName || di >= 0) { const vers = usage.toolUsers[id] || []; if (vers.length) out.push({ version: vers[0], count: vers.length, where: t.inTools, snippet: di >= 0 ? snip(tool.description, di, query.length) : tool.name }); }
    }
    return out.slice(0, 16);
  }, [q, usage]);

  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:50, background:"color-mix(in oklch, var(--ink-900) 32%, transparent)",
      backdropFilter:"blur(2px)", display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"12vh 20px 20px" }}>
      <div onClick={(e)=>e.stopPropagation()} style={{ width:"100%", maxWidth:680, background:"var(--surface-card)", border:"1px solid var(--line-hairline)",
        borderRadius:"var(--radius-4)", boxShadow:"var(--shadow-pop)", overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 18px", borderBottom:"1px solid var(--line-hairline)" }}>
          <Icon name="search" size={18} style={{ color:"var(--text-faint)" }} />
          <input ref={inputRef} value={q} onChange={(e)=>setQ(e.target.value)} placeholder={t.searchPlaceholder}
            style={{ flex:1, border:"none", outline:"none", background:"transparent", fontFamily:"var(--font-ui)", fontSize:"var(--t-body)", color:"var(--text-strong)" }} />
          <button onClick={onClose} style={{ border:"none", background:"none", cursor:"pointer", color:"var(--text-faint)", display:"inline-flex" }}><Icon name="x" size={18} /></button>
        </div>
        <div className="lin-scroll" style={{ maxHeight:"52vh", overflowY:"auto" }}>
          {q.trim().length >= 2 && (
            <div style={{ padding:"9px 18px", fontFamily:"var(--font-ui)", fontSize:"var(--t-caption)", color:"var(--text-faint)", borderBottom:"1px solid var(--line-faint)" }}>
              {results.length ? t.results(results.length) : t.noResults}
            </div>
          )}
          {results.map((r,i)=>(
            <button key={i} onClick={()=>{ onClose(); go({ view:"explorer", version:r.version }); }}
              style={{ display:"flex", alignItems:"center", gap:14, width:"100%", textAlign:"left", padding:"13px 18px", border:"none",
                borderTop: i?"1px solid var(--line-faint)":"none", background:"none", cursor:"pointer" }}
              onMouseEnter={(e)=>e.currentTarget.style.background="var(--surface-well)"} onMouseLeave={(e)=>e.currentTarget.style.background="none"}>
              <VersionChip version={r.version} size="sm" showDot={false} />
              <span style={{ flex:1, fontFamily:"var(--font-mono)", fontSize:"var(--t-code-sm)", color:"var(--text-body)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.snippet}</span>
              <span style={{ fontFamily:"var(--font-ui)", fontSize:"var(--t-caption)", color:"var(--text-faint)", whiteSpace:"nowrap" }}>{r.where}{r.count>1 ? ` · ${r.count}v` : ""}</span>
            </button>
          ))}
          {q.trim().length < 2 && (
            <div style={{ padding:"26px 18px", fontFamily:"var(--font-ui)", fontSize:"var(--t-sm)", color:"var(--text-faint)" }}>
              {t.searchHint}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function snip(text, idx, len){ const start=Math.max(0, idx-28); const end=Math.min(text.length, idx+len+40); return (start>0?"…":"")+text.slice(start, end).replace(/\n/g," ")+(end<text.length?"…":""); }

/* ---------- shared bits ---------- */
function Eyebrow({ children, style }) {
  return <div style={{ fontFamily:"var(--font-ui)", fontSize:"var(--t-caption)", textTransform:"uppercase", letterSpacing:"var(--track-over)", fontWeight:600, color:"var(--text-muted)", ...style }}>{children}</div>;
}
function Footer({ t }) {
  return (
    <footer style={{ borderTop:"1px solid var(--line-hairline)", marginTop:20 }}>
      <div style={{ maxWidth:"var(--container)", margin:"0 auto", padding:"26px 24px", display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
        <Wordmark size={20} />
        <span style={{ fontFamily:"var(--font-ui)", fontSize:"var(--t-caption)", color:"var(--text-faint)" }}>{window.LINEAGE_OFFLINE ? t.footerTaglineOffline(DATA.COUNTS.total, window.LINEAGE_OFFLINE.built) : t.footerTagline(DATA.COUNTS.total)}</span>
        <span style={{ flex:1 }} />
        <span style={{ display:"inline-flex", alignItems:"center", gap:12, fontFamily:"var(--font-mono)", fontSize:"var(--t-micro)", color:"var(--text-faint)" }}>
          <span>npm: @anthropic-ai/claude-code</span>
          <span style={{ color:"var(--line-strong)" }}>|</span>
          <a href="https://github.com/Hoper-J/claude-code-api-requests" target="_blank" rel="noopener noreferrer"
            style={{ display:"inline-flex", alignItems:"center", gap:6, color:"var(--text-faint)", textDecoration:"none" }}
            onMouseEnter={(e)=>{ e.currentTarget.style.color="var(--text-strong)"; }}
            onMouseLeave={(e)=>{ e.currentTarget.style.color="var(--text-faint)"; }}>
            <Icon name="github" size={13} /> Hoper-J/claude-code-api-requests
          </a>
        </span>
      </div>
    </footer>
  );
}

/* ---------- Anatomy (editorial, one-time) ---------- */
function AnatomyView({ t }) {
  const A = t.anatomy;
  const skeleton =
`POST /v1/messages?beta=true
{
  "model":      "claude-opus-4-8",
  "max_tokens": 64000,
  "stream":     true,
  "output_config":       { "effort": "xhigh" },
  "context_management":   { "edits": [ … ] },
  "diagnostics":          { "previous_message_id": null },
  "system":   [ { "text": "You are a Claude agent…", "cache_control": {…} }, … ],
  "messages": [ { "role": "user",   "content": [ { "text": "<system-reminder># claudeMd…" },
                                                 { "text": "Reply with the single word: ping" } ] },
                { "role": "system", "content": "…available skills · deferred tools · hooks…" } ],
  "tools":    [ { "name": "Bash", "description": "…", "input_schema": {…} }, … ]
}`;
  return (
    <div style={{ maxWidth:"var(--container-narrow)", margin:"0 auto", padding:"56px 24px 96px" }}>
      <div style={{ maxWidth:"var(--measure-prose)" }}>
        <Eyebrow style={{ marginBottom:16 }}>{A.nav}</Eyebrow>
        <h1 style={{ fontSize:"var(--t-h1)", letterSpacing:"var(--track-tight)", marginBottom:16 }}>{A.title}</h1>
        <p style={{ fontFamily:"var(--font-editorial)", fontSize:"var(--t-lead)", lineHeight:1.55, color:"var(--text-body)" }}>{A.lead}</p>
      </div>

      <div style={{ margin:"32px 0 14px" }}>
        <Eyebrow style={{ marginBottom:10 }}>{A.skeletonNote}</Eyebrow>
        <CodeBlock>{skeleton}</CodeBlock>
      </div>

      <ol style={{ listStyle:"none", margin:"28px 0 0", padding:0, display:"grid", gap:1, background:"var(--line-hairline)", border:"1px solid var(--line-hairline)", borderRadius:"var(--radius-3)", overflow:"hidden" }}>
        {A.parts.map((p) => (
          <li key={p.name} style={{ display:"grid", gridTemplateColumns:"180px 1fr", gap:20, padding:"18px 20px", background:"var(--surface-card)" }}>
            <div>
              <code style={{ fontFamily:"var(--font-mono)", fontSize:"var(--t-code)", fontWeight:"var(--w-semibold)", color:"var(--brand)" }}>{p.name}</code>
              <div style={{ marginTop:8 }}><Tag>{p.where}</Tag></div>
            </div>
            <p style={{ margin:0, fontFamily:"var(--font-ui)", fontSize:"var(--t-body)", lineHeight:1.55, color:"var(--text-body)", textWrap:"pretty" }}>{p.what}</p>
          </li>
        ))}
      </ol>

      <p style={{ marginTop:28, padding:"14px 16px", borderRadius:"var(--radius-2)", background:"var(--surface-well)",
        color:"var(--text-muted)", fontFamily:"var(--font-ui)", fontSize:"var(--t-sm)", lineHeight:1.6, textWrap:"pretty" }}>
        {inlineCode(A.captureNote)}
      </p>
    </div>
  );
}

/* ---------- App ---------- */
/* Hash routing — mirrors the production static paths:
   #/en · #/en/v/2.1.170 · #/en/diff/2.1.169/2.1.170?focus=tools · #/zh/anatomy
   Locale-prefixed, deep-linkable; locale switch preserves the route. */
const VALID_LOCALES = ["en", "zh"];
function routeToHash(route, locale){
  const p = ["", locale];
  if (route.view === "explorer") { p.push("v", encodeURIComponent(route.version)); if (route.capture) p.push(encodeURIComponent(route.capture)); }
  else if (route.view === "compare") p.push("diff", encodeURIComponent(route.from), encodeURIComponent(route.to));
  else if (route.view === "anatomy") p.push("anatomy");
  let h = p.join("/");
  if (route.view === "compare" && route.focus) h += "?focus=" + encodeURIComponent(route.focus);
  return "#" + h;
}
function parseHash(){
  const raw = (window.location.hash || "").replace(/^#/, "");
  const [path, query] = raw.split("?");
  const seg = (path || "").split("/").filter(Boolean).map(decodeURIComponent);
  const locale = VALID_LOCALES.includes(seg[0]) ? seg.shift() : null;
  let route = { view: "timeline" };
  if (seg[0] === "v" && seg[1]) route = { view: "explorer", version: seg[1], ...(seg[2] ? { capture: seg[2] } : {}) };
  else if (seg[0] === "diff" && seg[1] && seg[2]) route = { view: "compare", from: seg[1], to: seg[2] };
  else if (seg[0] === "anatomy") route = { view: "anatomy" };
  if (query && route.view === "compare") { const m = query.match(/focus=([^&]+)/); if (m) route.focus = decodeURIComponent(m[1]); }
  return { locale, route };
}
function App() {
  const init = React.useMemo(parseHash, []);
  const [route, setRoute] = React.useState(init.route);
  // In-session referrer (render-time snapshot: every navigation produces a new
  // route object, so identity change == navigation). Lets the explorer's back
  // bar return to the compare the visitor came from instead of the timeline.
  const navRef = React.useRef({ prev: null, cur: init.route });
  if (navRef.current.cur !== route) navRef.current = { prev: navRef.current.cur, cur: route };
  const cameFromCompare = navRef.current.prev && navRef.current.prev.view === "compare" ? navRef.current.prev : null;
  // localStorage access can throw (e.g. Chromium "block all cookies", some
  // file:// configurations) — reads must be as guarded as the writes below.
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const [locale, setLocale] = React.useState(init.locale || lsGet("lineage-locale") || "en");
  const [theme, setTheme] = React.useState(lsGet("lineage-theme") || "light");
  const [search, setSearch] = React.useState(false);
  const t = L10N[locale];

  React.useEffect(()=>{ document.documentElement.setAttribute("data-theme", theme); try{ localStorage.setItem("lineage-theme", theme); }catch(e){} }, [theme]);
  React.useEffect(()=>{ document.documentElement.setAttribute("lang", locale === "zh" ? "zh-CN" : "en"); try{ localStorage.setItem("lineage-locale", locale); }catch(e){} }, [locale]);
  // route+locale → hash (creates history entries; skip when already in sync)
  React.useEffect(()=>{
    const h = routeToHash(route, locale);
    if (window.location.hash !== h) window.location.hash = h;
  }, [route, locale]);
  // hash → state (back/forward, hand-edited or shared links)
  React.useEffect(()=>{
    const on = ()=>{ const { locale: l, route: r } = parseHash(); setRoute(prev => JSON.stringify(prev)===JSON.stringify(r) ? prev : r); if (l) setLocale(l); };
    window.addEventListener("hashchange", on);
    return ()=>window.removeEventListener("hashchange", on);
  }, []);
  React.useEffect(()=>{
    const h = (e)=>{ if(e.key==="/" && !search && !/input|select|textarea/i.test(e.target.tagName)){ e.preventDefault(); setSearch(true);} if(e.key==="Escape") setSearch(false); };
    window.addEventListener("keydown", h); return ()=>window.removeEventListener("keydown", h);
  }, [search]);
  const go = (r)=>{ setRoute(r); window.scrollTo({ top:0 }); };

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      <Header t={t} route={route} go={go} locale={locale} setLocale={setLocale} theme={theme} setTheme={setTheme} onSearch={()=>setSearch(true)} />
      <main style={{ flex:1 }}>
        {route.view==="timeline" && <TimelineView t={t} go={go} />}
        {route.view==="explorer" && <ExplorerView t={t} locale={locale} version={route.version} capture={route.capture} go={go} backRoute={cameFromCompare} />}
        {route.view==="compare" && <CompareView t={t} locale={locale} from={route.from} to={route.to} go={go} focus={route.focus} />}
        {route.view==="anatomy" && <AnatomyView t={t} />}
      </main>
      <Footer t={t} />
      {search && <SearchOverlay t={t} onClose={()=>setSearch(false)} go={go} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
