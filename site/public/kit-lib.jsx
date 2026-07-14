/* ============================================================
   Lineage UI kit — local primitive library
   Mirrors ../design/components 1:1 (Button, VersionChip, Badge,
   Tag, StatusDot, Tabs, SegmentedControl, CodeBlock, ToolCard,
   DiffLine, DeltaSummary) so this kit renders standalone in any
   context — the site AND the design cards both load this file.
   Production (DESIGN.md §7) precompiles it instead of in-browser
   Babel. Exports to window at the end.
   ============================================================ */

function Icon({ name, size = 18, stroke = 2, style }) {
  const P = ICONS[name] || ICONS.dot;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={stroke} strokeLinecap="round"
         strokeLinejoin="round" style={{ display: "block", flex: "0 0 auto", ...style }}>
      {P}
    </svg>
  );
}
const ICONS = {
  dot: <circle cx="12" cy="12" r="3" />,
  github: <><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></>,
  branch: <><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></>,
  compare: <><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><path d="M11 18H8a2 2 0 0 1-2-2V9"/></>,
  search: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
  rss: <><path d="M4 11a9 9 0 0 1 9 9"/><path d="M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/></>,
  copy: <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  check: <polyline points="20 6 9 17 4 12"/>,
  arrowR: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
  arrowL: <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
  chevR: <polyline points="9 6 15 12 9 18"/>,
  chevLeft: <polyline points="15 18 9 12 15 6"/>,
  list: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
  languages: <><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>,
  x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  link: <><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5"/></>,
  slash: <><circle cx="12" cy="12" r="10"/><line x1="4.9" y1="4.9" x2="19.1" y2="19.1"/></>,
  external: <><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></>,
};

/* ---- StatusDot ---- */
function StatusDot({ status = "ok", size = 8, pulse = false, style }) {
  const colors = { ok: "var(--add-marker)", fail: "var(--text-faint)", aux: "var(--accent)", active: "var(--brand)" };
  const ring = { ok: "var(--add-edge)", fail: "var(--line-strong)", aux: "var(--amber-100)", active: "var(--brand-tint)" };
  const filled = status !== "fail";
  return <span style={{ display:"inline-block", width:size, height:size, borderRadius:"var(--radius-pill)",
    background: filled ? colors[status] : "transparent", border: filled ? "none" : `1.5px solid ${ring[status]}`,
    boxShadow: pulse ? `0 0 0 3px ${ring[status]}` : "none", flex:"0 0 auto", ...style }} />;
}

/* ---- Button ---- */
function Button({ variant="primary", size="md", iconLeft, iconRight, block, disabled, type="button", onClick, children, style, ...rest }) {
  const sizes = { sm:{height:"26px",padding:"0 10px",font:"var(--t-sm)",gap:"5px"}, md:{height:"34px",padding:"0 14px",font:"var(--t-ui)",gap:"7px"}, lg:{height:"42px",padding:"0 18px",font:"var(--t-body)",gap:"8px"} };
  const s = sizes[size]||sizes.md;
  const variants = {
    primary:{background:"var(--brand)",color:"var(--text-on-brand)",border:"1px solid var(--brand)"},
    secondary:{background:"var(--surface-card)",color:"var(--text-strong)",border:"1px solid var(--line-strong)"},
    ghost:{background:"transparent",color:"var(--text-body)",border:"1px solid transparent"},
    danger:{background:"var(--surface-card)",color:"var(--del-text)",border:"1px solid var(--del-edge)"},
  };
  const [hover,setHover]=React.useState(false); const [press,setPress]=React.useState(false);
  const hv = { primary:{background:"var(--brand-hover)",borderColor:"var(--brand-hover)"}, secondary:{background:"var(--surface-well)"}, ghost:{background:"var(--surface-well)"}, danger:{background:"var(--del-surface)"} };
  return (
    <button type={type} disabled={disabled} onClick={disabled?undefined:onClick}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>{setHover(false);setPress(false);}}
      onMouseDown={()=>setPress(true)} onMouseUp={()=>setPress(false)}
      style={{ display:block?"flex":"inline-flex", width:block?"100%":undefined, alignItems:"center", justifyContent:"center",
        gap:s.gap, height:s.height, padding:s.padding, fontFamily:"var(--font-ui)", fontSize:s.font, fontWeight:"var(--w-medium)",
        letterSpacing:"var(--track-ui)", lineHeight:1, borderRadius:"var(--radius-2)", cursor:disabled?"not-allowed":"pointer",
        opacity:disabled?0.5:1, whiteSpace:"nowrap", userSelect:"none",
        transition:"var(--transition-ui), transform var(--dur-1) var(--ease-standard)",
        ...variants[variant], ...(hover&&!disabled?hv[variant]:{}), ...(press&&!disabled?{transform:"translateY(0.5px)"}:{}), ...style }}
      {...rest}>
      {iconLeft}{children}{iconRight}
    </button>
  );
}

/* ---- VersionChip ---- */
function VersionChip({ version, status="ok", selected=false, showDot=true, size="md", as=null, onClick, style, ...rest }) {
  const sizes={ sm:{height:"20px",padding:"0 7px",font:"var(--t-micro)"}, md:{height:"24px",padding:"0 9px",font:"var(--t-caption)"}, lg:{height:"30px",padding:"0 12px",font:"var(--t-sm)"} };
  const s=sizes[size]||sizes.md; const isFail=status==="fail"; const [hover,setHover]=React.useState(false);
  const Tag = as || (onClick ? "button" : "span");
  return (
    <Tag onClick={onClick} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{ display:"inline-flex", alignItems:"center", gap:"6px", height:s.height, padding:s.padding,
        fontFamily:"var(--font-mono)", fontSize:s.font, fontWeight:"var(--w-medium)", letterSpacing:"var(--track-wide)",
        lineHeight:1, borderRadius:"var(--radius-pill)", border:selected?"1px solid var(--brand)":"1px solid var(--line-strong)",
        background:selected?"var(--brand-tint)":hover?"var(--surface-well)":"var(--surface-card)",
        color:isFail?"var(--text-faint)":selected?"var(--brand-press)":"var(--text-strong)",
        cursor:onClick?"pointer":"default", whiteSpace:"nowrap", userSelect:"none", transition:"var(--transition-ui)", ...style }}
      {...rest}>
      {showDot && <StatusDot status={selected?"active":status} size={6} />}<span>{version}</span>
    </Tag>
  );
}

/* ---- Badge ---- */
function Badge({ tone="neutral", mono=false, children, style, ...rest }) {
  const tones={ neutral:{bg:"var(--surface-well)",fg:"var(--text-muted)",bd:"var(--line-hairline)"},
    brand:{bg:"var(--brand-tint)",fg:"var(--brand-press)",bd:"transparent"},
    add:{bg:"var(--add-surface)",fg:"var(--add-text)",bd:"transparent"},
    del:{bg:"var(--del-surface)",fg:"var(--del-text)",bd:"transparent"},
    mod:{bg:"var(--mod-surface)",fg:"var(--mod-text)",bd:"transparent"},
    accent:{bg:"var(--amber-100)",fg:"var(--amber-600)",bd:"transparent"} };
  const t=tones[tone]||tones.neutral;
  return <span style={{ display:"inline-flex", alignItems:"center", gap:"4px", height:"20px", padding:"0 7px",
    fontFamily:mono?"var(--font-mono)":"var(--font-ui)", fontSize:mono?"var(--t-micro)":"var(--t-caption)",
    fontWeight:"var(--w-semibold)", letterSpacing:mono?"var(--track-wide)":"var(--track-ui)", lineHeight:1,
    borderRadius:"var(--radius-2)", background:t.bg, color:t.fg, border:`1px solid ${t.bd}`, whiteSpace:"nowrap", ...style }} {...rest}>{children}</span>;
}

/* ---- Tag ---- */
function Tag({ children, onRemove, interactive=false, style, ...rest }) {
  const [hover,setHover]=React.useState(false);
  return <span onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
    style={{ display:"inline-flex", alignItems:"center", gap:"5px", height:"22px", padding:"0 9px",
    fontFamily:"var(--font-ui)", fontSize:"var(--t-caption)", fontWeight:"var(--w-medium)", letterSpacing:"var(--track-ui)",
    lineHeight:1, color:"var(--text-muted)", background: interactive&&hover ? "var(--surface-well)" : "transparent",
    border:"1px solid var(--line-strong)", borderRadius:"var(--radius-pill)",
    cursor: interactive ? "pointer" : "default", transition:"var(--transition-ui)", whiteSpace:"nowrap", ...style }} {...rest}>
    {children}
    {onRemove ? <button onClick={(e)=>{ e.stopPropagation(); onRemove(e); }} aria-label="Remove"
      style={{ display:"inline-flex", border:"none", background:"none", padding:0, margin:0, cursor:"pointer",
      color:"var(--text-faint)", fontFamily:"var(--font-mono)", fontSize:"12px", lineHeight:1 }}>×</button> : null}
  </span>;
}

/* ---- Tooltip ---- */
function Tooltip({ tip, placement="top", children, style, ...rest }) {
  const [open,setOpen]=React.useState(false);
  if (tip==null || tip==="") return children;
  const place = placement==="bottom" ? { top:"calc(100% + 7px)" } : { bottom:"calc(100% + 7px)" };
  return <span style={{ position:"relative", display:"inline-flex", ...style }}
    onMouseEnter={()=>setOpen(true)} onMouseLeave={()=>setOpen(false)}
    onFocus={()=>setOpen(true)} onBlur={()=>setOpen(false)} tabIndex={0} {...rest}>
    {children}
    {open && <span role="tooltip" style={{ position:"absolute", left:"50%", transform:"translateX(-50%)", ...place,
      zIndex:40, width:"max-content", maxWidth:"248px", padding:"7px 10px",
      fontFamily:"var(--font-ui)", fontSize:"var(--t-caption)", fontWeight:"var(--w-medium)",
      lineHeight:1.5, letterSpacing:"var(--track-ui)", textAlign:"left", whiteSpace:"normal",
      color:"var(--text-body)", background:"var(--surface-card)", border:"1px solid var(--line-strong)",
      borderRadius:"var(--radius-2)", boxShadow:"var(--shadow-pop)", pointerEvents:"none" }}>{tip}</span>}
  </span>;
}

/* ---- Tabs ---- */
function Tabs({ items=[], value, onChange, style }) {
  return (
    <div role="tablist" style={{ display:"flex", gap:"2px", alignItems:"flex-end", borderBottom:"1px solid var(--line-hairline)", ...style }}>
      {items.map(it=>{ const on=it.id===value; return (
        <button key={it.id} role="tab" aria-selected={on} onClick={()=>onChange&&onChange(it.id)} style={{ display:"inline-flex", alignItems:"center", gap:"7px",
          padding:"9px 13px", border:"none", background:"none", cursor:"pointer", position:"relative", top:"1px",
          fontFamily:"var(--font-ui)", fontSize:"var(--t-ui)", fontWeight:on?"var(--w-semibold)":"var(--w-medium)", letterSpacing:"var(--track-ui)",
          color:on?"var(--text-strong)":"var(--text-faint)", borderBottom:`2px solid ${on?"var(--brand)":"transparent"}`, transition:"var(--transition-ui)" }}>
          {it.label}{it.count!=null && <span style={{ fontFamily:"var(--font-mono)", fontSize:"var(--t-micro)", color:on?"var(--brand)":"var(--text-faint)",
            background:on?"var(--brand-tint)":"var(--surface-well)", borderRadius:"var(--radius-pill)", padding:"1px 6px" }}>{it.count}</span>}
        </button> ); })}
    </div>
  );
}

/* ---- SegmentedControl ---- */
function SegmentedControl({ options=[], value, onChange, size="md", style }) {
  const h=size==="sm"?"26px":"32px"; const fs=size==="sm"?"var(--t-sm)":"var(--t-ui)";
  return (
    <div role="group" style={{ display:"inline-flex", padding:"2px", gap:"2px", background:"var(--surface-well)",
      border:"1px solid var(--line-hairline)", borderRadius:"var(--radius-2)", ...style }}>
      {options.map(o=>{ const on=o.value===value; return (
        <button key={o.value} title={o.title} onClick={()=>onChange&&onChange(o.value)} style={{ display:"inline-flex", alignItems:"center",
          justifyContent:"center", gap:"6px", height:h, padding:"0 12px", border:"1px solid "+(on?"var(--line-hairline)":"transparent"),
          borderRadius:"var(--radius-1)", background:on?"var(--surface-card)":"transparent", boxShadow:on?"var(--shadow-sm)":"none", cursor:"pointer",
          fontFamily:"var(--font-ui)", fontSize:fs, fontWeight:on?"var(--w-semibold)":"var(--w-medium)", letterSpacing:"var(--track-ui)",
          color:on?"var(--text-strong)":"var(--text-faint)", transition:"var(--transition-ui)" }}>
          {o.icon}{o.label}
        </button> ); })}
    </div>
  );
}

/* ---- CodeBlock ---- */
function CodeBlock({ children, label, copyText, collapsible=false, collapsedHeight=240, dense=false, labels, style }) {
  const L={ copy:"copy", copied:"copied", collapse:"Collapse", expand:"Show full block", ...(labels||{}) };
  const [open,setOpen]=React.useState(!collapsible); const [copied,setCopied]=React.useState(false);
  const onCopy=()=>{
    const t=copyText!=null?copyText:(typeof children==="string"?children:"");
    const done=()=>{ setCopied(true); setTimeout(()=>setCopied(false),1400); };
    const fallback=()=>{ try{ const ta=document.createElement("textarea"); ta.value=t; ta.style.position="fixed"; ta.style.top="-9999px"; document.body.appendChild(ta); ta.focus(); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); done(); }catch(e){} };
    if(navigator.clipboard&&navigator.clipboard.writeText){ navigator.clipboard.writeText(t).then(done).catch(fallback); }
    else fallback();
  };
  return (
    <div style={{ border:"1px solid var(--line-hairline)", borderRadius:"var(--radius-3)", background:"var(--surface-well)", overflow:"hidden", ...style }}>
      {(label||copyText!=null) && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", borderBottom:"1px solid var(--line-hairline)", background:"var(--surface-card)" }}>
          <span style={{ fontFamily:"var(--font-ui)", fontSize:"var(--t-micro)", textTransform:"uppercase", letterSpacing:"var(--track-over)", fontWeight:"var(--w-semibold)", color:"var(--text-faint)" }}>{label}</span>
          {copyText!=null && <button onClick={onCopy} style={{ display:"inline-flex", alignItems:"center", gap:"4px", border:"none", background:"none", cursor:"pointer", padding:"2px 4px", fontFamily:"var(--font-mono)", fontSize:"var(--t-micro)", letterSpacing:"var(--track-wide)", color:copied?"var(--add-text)":"var(--brand)" }}><Icon name={copied?"check":"copy"} size={12} stroke={2.4} />{copied?L.copied:L.copy}</button>}
        </div>
      )}
      <div className="lin-scroll" style={{ position:"relative", maxHeight:collapsible&&!open?collapsedHeight:"none", overflow:collapsible&&!open?"hidden":"auto",
        padding:dense?"12px 14px":"16px 18px", fontFamily:"var(--font-mono)", fontSize:dense?"var(--t-code-sm)":"var(--t-code)", lineHeight:"var(--lh-code)",
        color:"var(--text-body)", whiteSpace:"pre-wrap", wordBreak:"break-word", tabSize:2 }}>
        {children}
        {collapsible&&!open && <div style={{ position:"absolute", left:0, right:0, bottom:0, height:64, background:"linear-gradient(to bottom, transparent, var(--surface-well))", pointerEvents:"none" }} />}
      </div>
      {collapsible && <button onClick={()=>setOpen(o=>!o)} style={{ display:"block", width:"100%", textAlign:"center", padding:"8px", borderTop:"1px solid var(--line-hairline)",
        borderLeft:0, borderRight:0, borderBottom:0, background:"var(--surface-card)", cursor:"pointer", fontFamily:"var(--font-ui)", fontSize:"var(--t-sm)", fontWeight:"var(--w-medium)", color:"var(--brand)" }}>{open?L.collapse:L.expand}</button>}
    </div>
  );
}

/* ---- ToolCard ---- */
function ToolCard({ name, description="", schema=null, change=null, changeLabels, labels, defaultOpen=false, style }) {
  const [open,setOpen]=React.useState(defaultOpen);
  const CL={ added:"added", removed:"removed", modified:"modified", ...(changeLabels||{}) };
  const changeBadge={ added:<Badge tone="add">{CL.added}</Badge>, removed:<Badge tone="del">{CL.removed}</Badge>, modified:<Badge tone="mod">{CL.modified}</Badge> }[change];
  const accent={ added:"var(--add-edge)", removed:"var(--del-edge)", modified:"var(--mod-edge)" }[change]||"var(--line-hairline)";
  const schemaText=schema!=null?(typeof schema==="string"?schema:JSON.stringify(schema,null,2)):null;
  const fl=String(description).split("\n")[0];
  return (
    <div style={{ border:"1px solid var(--line-hairline)", borderLeft:`2px solid ${accent}`, borderRadius:"var(--radius-3)", background:"var(--surface-card)", overflow:"hidden", opacity:change==="removed"?0.82:1, ...style }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:"10px", width:"100%", padding:"12px 14px", border:"none", background:"none", cursor:"pointer", textAlign:"left" }}>
        <Icon name="chevR" size={14} stroke={2.4} style={{ color:"var(--text-faint)", transform:open?"rotate(90deg)":"none", transition:"transform var(--dur-2) var(--ease-standard)" }} />
        <span style={{ fontFamily:"var(--font-mono)", fontSize:"var(--t-code)", fontWeight:"var(--w-semibold)", color:"var(--text-strong)", textDecoration:change==="removed"?"line-through":"none" }}>{name}</span>
        {changeBadge}<span style={{ flex:1 }} />
        {!open&&description && <span style={{ fontFamily:"var(--font-ui)", fontSize:"var(--t-sm)", color:"var(--text-faint)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:"46%" }}>{fl.length>90?fl.slice(0,90)+"…":fl}</span>}
      </button>
      {open && (
        <div style={{ padding:"0 14px 14px", display:"grid", gap:"12px" }}>
          {description && <p style={{ margin:0, fontFamily:"var(--font-mono)", fontSize:"var(--t-code-sm)", lineHeight:"var(--lh-code)", color:"var(--text-body)", whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{description}</p>}
          {schemaText && <CodeBlock label="input_schema" dense copyText={schemaText} labels={labels}>{schemaText}</CodeBlock>}
        </div>
      )}
    </div>
  );
}

/* ---- DiffLine ---- */
function DiffLine({ kind="context", oldNo=null, newNo=null, showNumbers=false, segs=null, children, style }) {
  const palette={ add:{bg:"var(--add-surface)",fg:"var(--add-text)",mark:"var(--add-marker)",glyph:"+",hl:"var(--add-edge)"},
    del:{bg:"var(--del-surface)",fg:"var(--del-text)",mark:"var(--del-marker)",glyph:"−",hl:"var(--del-edge)"},
    mod:{bg:"var(--mod-surface)",fg:"var(--mod-text)",mark:"var(--mod-text)",glyph:"~",hl:"var(--mod-edge)"},
    context:{bg:"transparent",fg:"var(--text-muted)",mark:"var(--text-faint)",glyph:" ",hl:"transparent"} };
  const p=palette[kind]||palette.context;
  const num=(n)=> <span style={{ width:38, flex:"0 0 38px", textAlign:"right", paddingRight:8, color:"var(--text-faint)", userSelect:"none", fontSize:"var(--t-code-sm)" }}>{n!=null?n:""}</span>;
  const body = segs
    ? segs.map((s,i)=> s.hl
        ? <span key={i} style={{ background:p.hl, borderRadius:2, color:kind==="del"?"var(--del-text)":kind==="add"?"var(--add-text)":p.fg, fontWeight:"var(--w-medium)" }}>{s.text}</span>
        : <span key={i}>{s.text}</span>)
    : children;
  return (
    <div style={{ display:"flex", alignItems:"flex-start", background:p.bg, fontFamily:"var(--font-mono)", fontSize:"var(--t-code)", lineHeight:"var(--lh-code)", ...style }}>
      {showNumbers && <div style={{ display:"flex", borderRight:"1px solid var(--line-faint)" }}>{num(kind!=="add"?oldNo:null)}{num(kind!=="del"?newNo:null)}</div>}
      <span style={{ width:26, flex:"0 0 26px", textAlign:"center", userSelect:"none", fontWeight:"var(--w-semibold)", color:p.mark }}>{p.glyph}</span>
      <span style={{ flex:"1 1 auto", color:p.fg, whiteSpace:"pre-wrap", wordBreak:"break-word", paddingRight:12 }}>{body}</span>
    </div>
  );
}

/* ---- DeltaSummary ---- */
const DELTA_EN = { tool:"tool", tools:"tools", modified:"modified", chars:"chars", beta:"beta", betas:"betas", maxTokens:"max_tokens", modelChanged:"model changed", noChange:"No payload change", first:"First captured version", context:"context", systemBlocks:"system blocks", reminderNames:{} };
function DeltaSummary({ delta, labels=DELTA_EN, tone="inline", style }) {
  const L={ ...DELTA_EN, ...labels };
  if (!delta) return <span style={{ color:"var(--text-faint)", fontFamily:"var(--font-ui)", fontSize:"var(--t-sm)" }}>{L.first}</span>;
  const added=(delta.tools_added||[]).length, removed=(delta.tools_removed||[]).length, modified=(delta.tools_modified||[]).length;
  const betaAdd=(delta.betas_added||[]).length, betaRem=(delta.betas_removed||[]).length;
  const remAdd=delta.reminders_added||[], remRem=delta.reminders_removed||[];
  const rn=(k)=>(L.reminderNames&&L.reminderNames[k])||k;
  const chars=delta.system_chars_delta||0, model=delta.model_changed||null, maxc=delta.max_tokens_changed||null;
  const effc=delta.effort_changed||null;
  const pl=(n,a,b)=>n===1?a:b;
  const parts=[];
  if(added) parts.push(<Badge key="a" tone="add" mono>+{added} {pl(added,L.tool,L.tools)}</Badge>);
  if(removed) parts.push(<Badge key="r" tone="del" mono>−{removed} {pl(removed,L.tool,L.tools)}</Badge>);
  if(modified) parts.push(<Badge key="m" tone="mod" mono>~{modified} {pl(modified,L.tool,L.tools)}</Badge>);
  if(betaAdd) parts.push(<Badge key="ba" tone="brand" mono>+{betaAdd} {pl(betaAdd,L.beta,L.betas)}</Badge>);
  if(betaRem) parts.push(<Badge key="br" tone="del" mono>−{betaRem} {pl(betaRem,L.beta,L.betas)}</Badge>);
  remAdd.forEach(k=>parts.push(<Badge key={"cxa"+k} tone="add">+{rn(k)}</Badge>));
  remRem.forEach(k=>parts.push(<Badge key={"cxr"+k} tone="del">−{rn(k)}</Badge>));
  (delta.body_keys_added||[]).forEach(k=>parts.push(<Badge key={"bka"+k} tone="add" mono>+body.{k}</Badge>));
  (delta.body_keys_removed||[]).forEach(k=>parts.push(<Badge key={"bkr"+k} tone="del" mono>−body.{k}</Badge>));
  if(delta.system_blocks_changed) parts.push(<Badge key="sb" tone="mod" mono>{L.systemBlocks} {delta.system_blocks_changed.from}→{delta.system_blocks_changed.to}</Badge>);
  if(delta.context_body_changed && !remAdd.length && !remRem.length) parts.push(<Badge key="cxm" tone="mod">~{L.context}</Badge>);
  if(chars) parts.push(<Badge key="c" tone="neutral" mono>{chars>0?"+":""}{chars.toLocaleString("en-US")} {L.chars}</Badge>);
  if(maxc) parts.push(<Badge key="mx" tone="mod" mono>{L.maxTokens} {(maxc.to!=null?maxc.to:0).toLocaleString("en-US")}</Badge>);
  if(effc) parts.push(<Badge key="ef" tone="accent" mono>effort {effc.to!=null?effc.to:"—"}</Badge>);
  if(model) parts.push(<Badge key="o" tone="accent">{L.modelChanged}</Badge>);
  if(!parts.length) return <span style={{ color:"var(--text-faint)", fontFamily:"var(--font-ui)", fontSize:"var(--t-sm)" }}>{L.noChange}</span>;
  const ed=tone==="editorial";
  return <span style={{ display:"inline-flex", flexWrap:"wrap", alignItems:"center", gap:"6px", fontFamily:ed?"var(--font-editorial)":"var(--font-ui)", fontSize:ed?"var(--t-h3)":"var(--t-sm)", color:"var(--text-body)", ...style }}>
    {parts.reduce((acc,el,i)=>{ if(i>0) acc.push(<span key={"s"+i} style={{ color:"var(--text-faint)" }}>·</span>); acc.push(el); return acc; },[])}
  </span>;
}

/* ---- ChangelogEntry (official release notes, quoted verbatim) ---- */
const CHANGELOG_EN = { added:"added", fixed:"fixed", improved:"improved", changed:"changed", other:"notes",
  missing:"No changelog entry for this version",
  missingBody:"The official changelog has no entry for this release number. The capture is unaffected.",
  source:"Quoted verbatim from", verbatimNote:null, wordFirst:false };
/* Minimal inline-markdown for changelog bullets: `code` · **bold** · [text](url) ·
   bare https:// URLs · line breaks. Anything else renders as plain text. */
function renderChangelogInline(text) {
  const nodes=[]; let key=0;
  const codeStyle={ fontFamily:"var(--font-mono)", fontSize:"0.92em", background:"var(--surface-well)", border:"1px solid var(--line-hairline)", borderRadius:"var(--radius-1)", padding:"0 4px", whiteSpace:"pre-wrap" };
  const linkStyle={ color:"var(--brand)", textDecoration:"underline", textDecorationColor:"var(--line-strong)", textUnderlineOffset:"2px", overflowWrap:"anywhere" };
  const re=/(`[^`]+`)|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s)\]（）【】「」、，。；：一-鿿]+)|(\*\*[^*]+\*\*)/g;
  String(text).split("\n").forEach((line, li)=>{
    if(li>0) nodes.push(<br key={"br"+key++} />);
    let last=0; let m; re.lastIndex=0;
    while((m=re.exec(line))!==null){
      if(m.index>last) nodes.push(line.slice(last, m.index));
      if(m[1]) nodes.push(<code key={"c"+key++} style={codeStyle}>{m[1].slice(1,-1)}</code>);
      else if(m[2]) nodes.push(<a key={"l"+key++} href={m[3]} target="_blank" rel="noreferrer" style={linkStyle}>{m[2]}</a>);
      else if(m[4]) nodes.push(<a key={"u"+key++} href={m[4]} target="_blank" rel="noreferrer" style={linkStyle}>{m[4]}</a>);
      else if(m[5]) nodes.push(<strong key={"b"+key++} style={{ fontWeight:"var(--w-semibold)" }}>{m[5].slice(2,-2)}</strong>);
      last=re.lastIndex;
    }
    if(last<line.length) nodes.push(line.slice(last));
  });
  return nodes;
}
function ChangelogEntry({ bullets=null, counts=null, labels=CHANGELOG_EN, source=null, actions=null, style, ...rest }) {
  const L={ ...CHANGELOG_EN, ...labels };
  if(!bullets || bullets.length===0){
    return (
      <div style={{ border:"1px solid var(--line-hairline)", borderRadius:"var(--radius-3)", background:"var(--surface-card)", padding:"36px 32px", textAlign:"center", ...style }} {...rest}>
        <div style={{ fontFamily:"var(--font-ui)", fontWeight:"var(--w-semibold)", fontSize:"var(--t-ui)", color:"var(--text-body)", marginBottom:6 }}>{L.missing}</div>
        <p style={{ margin:"0 auto", fontFamily:"var(--font-ui)", fontSize:"var(--t-sm)", color:"var(--text-faint)", maxWidth:"46ch" }}>{L.missingBody}</p>
      </div>
    );
  }
  const order=[["add",L.added],["fix",L.fixed],["imp",L.improved],["chg",L.changed],["oth",L.other]];
  const digest=counts ? order.filter(([k])=>counts[k]>0) : [];
  return (
    <div style={{ display:"grid", gap:14, ...style }} {...rest}>
      {(digest.length>0 || source || actions) && (
        <div style={{ display:"flex", flexWrap:"wrap", alignItems:"baseline", gap:"8px 14px", paddingBottom:12, borderBottom:"1px solid var(--line-hairline)" }}>
          <span style={{ display:"inline-flex", flexWrap:"wrap", alignItems:"baseline", gap:8, fontFamily:"var(--font-ui)", fontSize:"var(--t-sm)", color:"var(--text-muted)" }}>
            {digest.map(([k, word], i)=>(
              <React.Fragment key={k}>
                {i>0 && <span style={{ color:"var(--text-faint)" }}>·</span>}
                <span>
                  {L.wordFirst && <>{word}{" "}</>}
                  <span style={{ fontFamily:"var(--font-mono)", fontWeight:"var(--w-semibold)", color:"var(--text-strong)" }}>{counts[k]}</span>
                  {!L.wordFirst && <>{" "}{word}</>}
                </span>
              </React.Fragment>
            ))}
          </span>
          <span style={{ marginLeft:"auto", display:"inline-flex", alignItems:"center", gap:12 }}>
            {actions}
            {source && (
              <span style={{ fontFamily:"var(--font-ui)", fontSize:"var(--t-caption)", color:"var(--text-faint)" }}>
                {L.source}{" "}
                <a href={source.url} target="_blank" rel="noreferrer" style={{ color:"var(--text-muted)", fontFamily:"var(--font-mono)", textDecoration:"underline", textDecorationColor:"var(--line-strong)", textUnderlineOffset:"2px" }}>{source.name}</a>
              </span>
            )}
          </span>
        </div>
      )}
      <ul style={{ listStyle:"none", margin:0, padding:0, display:"grid", gap:9 }}>
        {bullets.map((b,i)=>(
          <li key={i} style={{ display:"grid", gridTemplateColumns:"16px 1fr", alignItems:"baseline" }}>
            <span aria-hidden="true" style={{ fontFamily:"var(--font-mono)", fontSize:"var(--t-sm)", color:"var(--text-faint)" }}>–</span>
            <span style={{ fontFamily:"var(--font-ui)", fontSize:"var(--t-sm)", lineHeight:"var(--lh-ui)", color:"var(--text-body)", maxWidth:"78ch", overflowWrap:"break-word" }}>{renderChangelogInline(b)}</span>
          </li>
        ))}
      </ul>
      {L.verbatimNote && <p style={{ margin:0, fontFamily:"var(--font-ui)", fontSize:"var(--t-caption)", color:"var(--text-faint)" }}>{L.verbatimNote}</p>}
    </div>
  );
}

Object.assign(window, { Icon, StatusDot, Button, VersionChip, Badge, Tag, Tabs, SegmentedControl, CodeBlock, ToolCard, DiffLine, DeltaSummary, ChangelogEntry, renderChangelogInline });
