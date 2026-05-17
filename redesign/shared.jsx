// Hireflow "Atlas" redesign — shared tokens, primitives, chrome.
// Inline-styled so each artboard is self-contained (no CSS escape).

const TOKENS = {
  bg:        'oklch(98.2% 0.004 80)',
  surface:   '#ffffff',
  surface2:  'oklch(96.8% 0.005 80)',
  ink:       'oklch(16% 0.012 270)',
  ink2:      'oklch(38% 0.010 270)',
  ink3:      'oklch(56% 0.008 270)',
  ink4:      'oklch(70% 0.006 270)',
  line:      'oklch(92% 0.004 270)',
  line2:     'oklch(95.5% 0.003 270)',
  accent:    'oklch(48% 0.17 268)',
  accent2:   'oklch(58% 0.14 268)',
  accentSoft:'oklch(95% 0.035 268)',
  accentInk: 'oklch(98% 0.01 268)',
  draft:     'oklch(58% 0.02 270)',
  applied:   'oklch(54% 0.14 240)',
  interview: 'oklch(54% 0.16 295)',
  offer:     'oklch(54% 0.14 155)',
  rejected:  'oklch(58% 0.16 25)',
  warn:      'oklch(60% 0.14 60)',
  font:      "'Geist', ui-sans-serif, system-ui, sans-serif",
  mono:      "'Geist Mono', ui-monospace, monospace",
};

// Frame: every screen wraps with this. Sets font + bg + box-sizing reset.
const Frame = ({ children, bg = TOKENS.bg, style }) => (
  <div style={{
    width: '100%', height: '100%', background: bg, color: TOKENS.ink,
    fontFamily: TOKENS.font, fontSize: 14, lineHeight: 1.5,
    boxSizing: 'border-box', overflow: 'hidden', position: 'relative',
    fontFeatureSettings: '"cv11" 1, "ss01" 1',
    ...style,
  }}>
    <style>{`
      * { box-sizing: border-box; }
      .num { font-variant-numeric: tabular-nums; }
      .mono { font-family: ${TOKENS.mono}; }
    `}</style>
    {children}
  </div>
);

// Sidebar — used in all /app screens
const Sidebar = ({ active = 'dashboard' }) => {
  const items = [
    { key: 'dashboard', label: 'Dashboard', icon: <I.Home size={18}/>, route: '/app' },
    { key: 'applications', label: 'Bewerbungen', icon: <I.Briefcase size={18}/>, route: '/app/applications', count: 12 },
    { key: 'pipeline', label: 'Pipeline', icon: <I.Columns size={18}/>, route: '/app/pipeline' },
    { key: 'cvs', label: 'Lebensläufe', icon: <I.File size={18}/>, route: '/app/cvs', count: 4 },
    { key: 'linkedin', label: 'LinkedIn', icon: <I.Linkedin size={18}/>, route: '/app/linkedin', pro: true },
  ];
  const bottomItems = [
    { key: 'settings', label: 'Einstellungen', icon: <I.Settings size={18}/> },
  ];

  return (
    <aside style={{
      width: 240, height: '100%', flex: '0 0 240px',
      background: TOKENS.surface, borderRight: `1px solid ${TOKENS.line}`,
      display: 'flex', flexDirection: 'column', padding: '20px 12px',
    }}>
      {/* Brand */}
      <div style={{ padding: '6px 10px 22px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: `linear-gradient(135deg, ${TOKENS.accent}, ${TOKENS.accent2})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 13,
        }}>H</div>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>Hireflow</div>
        <div style={{ marginLeft: 'auto', padding: '2px 6px', fontSize: 10, fontFamily: TOKENS.mono, color: TOKENS.ink3, background: TOKENS.surface2, borderRadius: 4, letterSpacing: 0.04 }}>BETA</div>
      </div>

      {/* Workspace switcher */}
      <button style={{
        margin: '0 4px 14px', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 10,
        background: TOKENS.surface2, border: `1px solid ${TOKENS.line2}`, borderRadius: 8, cursor: 'pointer',
        textAlign: 'left', width: 'calc(100% - 8px)', color: TOKENS.ink, fontFamily: 'inherit',
      }}>
        <div style={{ width: 22, height: 22, borderRadius: 5, background: TOKENS.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>LB</div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>Lina Bachmann</span>
          <span style={{ fontSize: 11, color: TOKENS.ink3 }}>Frontend · DE</span>
        </div>
        <I.ChevronDown size={14} />
      </button>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        <div style={{ fontSize: 10.5, color: TOKENS.ink3, fontFamily: TOKENS.mono, letterSpacing: 0.08, padding: '8px 12px 6px', textTransform: 'uppercase' }}>Workspace</div>
        {items.map(it => (
          <a key={it.key} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 7,
            color: it.key === active ? TOKENS.ink : TOKENS.ink2,
            background: it.key === active ? TOKENS.surface2 : 'transparent',
            fontSize: 13.5, fontWeight: it.key === active ? 500 : 400,
            cursor: 'pointer', textDecoration: 'none',
            position: 'relative',
          }}>
            {it.key === active && <div style={{ position: 'absolute', left: -12, top: 8, bottom: 8, width: 2, background: TOKENS.accent, borderRadius: 1 }} />}
            <span style={{ color: it.key === active ? TOKENS.accent : TOKENS.ink3, display: 'flex' }}>{it.icon}</span>
            <span>{it.label}</span>
            {it.count != null && <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: TOKENS.mono, color: TOKENS.ink3, background: TOKENS.surface2, padding: '1px 6px', borderRadius: 4 }} className="num">{it.count}</span>}
            {it.pro && <span style={{ marginLeft: 'auto', fontSize: 9.5, fontFamily: TOKENS.mono, letterSpacing: 0.08, color: TOKENS.warn, background: 'oklch(94% 0.04 60)', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', fontWeight: 600 }}>Pro</span>}
          </a>
        ))}
      </nav>

      {/* Bottom: usage + settings */}
      <div style={{ borderTop: `1px solid ${TOKENS.line2}`, paddingTop: 12, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ padding: '8px 10px', background: TOKENS.surface2, borderRadius: 8, marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontFamily: TOKENS.mono, color: TOKENS.ink3, textTransform: 'uppercase', letterSpacing: 0.06 }}>Plan</span>
            <span style={{ fontSize: 11, color: TOKENS.ink2 }} className="num">3 / 5</span>
          </div>
          <div style={{ height: 4, background: TOKENS.line, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: '60%', height: '100%', background: TOKENS.accent }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 12, color: TOKENS.ink }}>Free</span>
            <a style={{ fontSize: 11.5, color: TOKENS.accent, fontWeight: 500 }}>Upgrade →</a>
          </div>
        </div>
        {bottomItems.map(it => (
          <a key={it.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 7, color: TOKENS.ink2, fontSize: 13.5, cursor: 'pointer' }}>
            <span style={{ color: TOKENS.ink3, display: 'flex' }}>{it.icon}</span>
            <span>{it.label}</span>
          </a>
        ))}
      </div>
    </aside>
  );
};

// Top app bar with breadcrumb + command + actions
const AppTopBar = ({ crumbs = [], actions, search = true }) => (
  <header style={{
    height: 56, flex: '0 0 56px', borderBottom: `1px solid ${TOKENS.line}`,
    display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, background: TOKENS.surface,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color: TOKENS.ink4 }}><I.ChevronRight size={14}/></span>}
          <span style={{
            fontSize: 13.5,
            color: i === crumbs.length - 1 ? TOKENS.ink : TOKENS.ink3,
            fontWeight: i === crumbs.length - 1 ? 500 : 400,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{c}</span>
        </React.Fragment>
      ))}
    </div>

    {search && (
      <button style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px 6px 8px',
        background: TOKENS.surface2, border: `1px solid ${TOKENS.line2}`, borderRadius: 8,
        color: TOKENS.ink3, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12.5,
        minWidth: 200,
      }}>
        <I.Search size={14}/>
        <span style={{ flex: 1, textAlign: 'left' }}>Suchen oder springen zu…</span>
        <kbd style={{ fontSize: 10.5, fontFamily: TOKENS.mono, color: TOKENS.ink3, background: TOKENS.surface, padding: '1px 5px', borderRadius: 3, border: `1px solid ${TOKENS.line}` }}>⌘ K</kbd>
      </button>
    )}

    <button style={{ width: 32, height: 32, borderRadius: 7, border: `1px solid ${TOKENS.line2}`, background: TOKENS.surface, color: TOKENS.ink2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
      <I.Bell size={16}/>
      <span style={{ position: 'absolute', top: 6, right: 7, width: 6, height: 6, borderRadius: 3, background: TOKENS.accent }} />
    </button>

    {actions}
  </header>
);

// Buttons
const Btn = ({ children, variant = 'default', size = 'md', icon, iconRight, style, ...rest }) => {
  const variants = {
    primary: { background: TOKENS.ink, color: '#fff', border: '1px solid transparent' },
    cta:     { background: TOKENS.accent, color: '#fff', border: '1px solid transparent', boxShadow: `0 1px 2px ${TOKENS.accent}66` },
    default: { background: TOKENS.surface, color: TOKENS.ink, border: `1px solid ${TOKENS.line}` },
    ghost:   { background: 'transparent', color: TOKENS.ink2, border: '1px solid transparent' },
    danger:  { background: TOKENS.surface, color: TOKENS.rejected, border: `1px solid ${TOKENS.line}` },
  };
  const sizes = {
    sm: { fontSize: 12.5, padding: '5px 10px', height: 28, borderRadius: 6, gap: 6 },
    md: { fontSize: 13.5, padding: '7px 12px', height: 34, borderRadius: 7, gap: 7 },
    lg: { fontSize: 14, padding: '10px 16px', height: 40, borderRadius: 8, gap: 8 },
  };
  return (
    <button style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'inherit', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
      ...sizes[size], ...variants[variant], ...style,
    }} {...rest}>
      {icon}
      {children}
      {iconRight}
    </button>
  );
};

// Status pill
const STATUS_MAP = {
  draft:     { label: 'Entwurf', color: TOKENS.draft,     bg: 'oklch(96% 0.005 270)' },
  applied:   { label: 'Beworben', color: TOKENS.applied,   bg: 'oklch(95% 0.025 240)' },
  interview: { label: 'Interview', color: TOKENS.interview, bg: 'oklch(95% 0.025 295)' },
  offer:     { label: 'Angebot', color: TOKENS.offer,     bg: 'oklch(95% 0.025 155)' },
  rejected:  { label: 'Abgesagt', color: TOKENS.rejected,  bg: 'oklch(96% 0.020 25)' },
};
const StatusPill = ({ status, size = 'sm' }) => {
  const s = STATUS_MAP[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: size === 'sm' ? 11 : 12, fontWeight: 500,
      color: s.color, background: s.bg,
      padding: size === 'sm' ? '2px 7px' : '3px 9px',
      borderRadius: 5, lineHeight: 1.4,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: 3, background: s.color }} />
      {s.label}
    </span>
  );
};

// Match score chip (rectangular for top bars; ring for cards)
const ScorePill = ({ score = 0, label = 'ATS-Match' }) => {
  const tone = score >= 80 ? TOKENS.offer : score >= 60 ? TOKENS.applied : TOKENS.warn;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px 4px 6px',
      background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 7,
    }}>
      <span style={{
        fontSize: 10, fontFamily: TOKENS.mono, letterSpacing: 0.06, textTransform: 'uppercase',
        color: TOKENS.ink3, background: TOKENS.surface2, padding: '2px 6px', borderRadius: 4,
      }}>{label}</span>
      <span className="num" style={{ fontSize: 14, fontWeight: 600, color: tone }}>{score}</span>
      <span style={{ fontSize: 11, color: TOKENS.ink3 }}>%</span>
    </div>
  );
};

const ScoreRing = ({ score = 0, size = 56, label }) => {
  const tone = score >= 80 ? TOKENS.offer : score >= 60 ? TOKENS.applied : TOKENS.warn;
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={TOKENS.line} strokeWidth={4}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={tone} strokeWidth={4}
          strokeDasharray={c} strokeDashoffset={c * (1 - score/100)} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', fontSize: size > 50 ? 14 : 12, fontWeight: 600 }} className="num">{score}</div>
    </div>
  );
};

// Sectioned panel
const Panel = ({ title, action, children, style, padding = 20 }) => (
  <section style={{
    background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 12,
    overflow: 'hidden', ...style,
  }}>
    {title && (
      <header style={{
        padding: '12px 16px', borderBottom: `1px solid ${TOKENS.line2}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: TOKENS.ink, margin: 0, letterSpacing: -0.1 }}>{title}</h3>
        {action}
      </header>
    )}
    <div style={{ padding }}>{children}</div>
  </section>
);

// Company logo placeholder — colored monogram
const CompanyLogo = ({ name = 'A', color, size = 32 }) => {
  const letters = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  // deterministic-ish color
  const palette = ['#5B6CFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];
  const idx = name.length % palette.length;
  const c = color || palette[idx];
  return (
    <div style={{
      width: size, height: size, borderRadius: 7,
      background: c + '22', color: c, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 600, fontFamily: TOKENS.font,
      flexShrink: 0,
    }}>{letters}</div>
  );
};

Object.assign(window, { TOKENS, Frame, Sidebar, AppTopBar, Btn, StatusPill, ScorePill, ScoreRing, Panel, CompanyLogo, STATUS_MAP });
