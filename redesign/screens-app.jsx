// Hireflow "Atlas" — Dashboard, Pipeline, Wizard, CVs screens.

const DashboardScreen = () => {
  const recentApps = [
    { co: 'Stripe', role: 'Frontend Developer', status: 'interview', score: 88, when: 'vor 2 Tagen', color: '#635BFF' },
    { co: 'Figma', role: 'Senior Frontend Engineer', status: 'applied', score: 76, when: 'vorgestern', color: '#F24E1E' },
    { co: 'Linear', role: 'Product Designer', status: 'draft', score: null, when: 'heute', color: '#5E6AD2' },
    { co: 'Notion', role: 'Engineer · Web', status: 'offer', score: 92, when: 'letzte Woche', color: '#000' },
    { co: 'Vercel', role: 'DX Engineer', status: 'applied', score: 84, when: 'vor 3 Tagen', color: '#000' },
  ];
  return (
    <Frame>
      <div style={{ display: 'flex', height: '100%' }}>
        <Sidebar active="dashboard"/>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <AppTopBar
            crumbs={['Workspace', 'Dashboard']}
            actions={<Btn variant="cta" icon={<I.Plus size={14}/>}>Neue Bewerbung</Btn>}
          />
          <div style={{ flex: 1, padding: 28, overflow: 'auto', background: TOKENS.bg }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 22 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.4, margin: 0 }}>Guten Morgen, Lina</h1>
                <p style={{ fontSize: 13.5, color: TOKENS.ink3, margin: '4px 0 0' }}>5 Bewerbungen aktiv · 2 erwarten dein Follow-up</p>
              </div>
              <div style={{ display: 'flex', gap: 8, fontSize: 12, color: TOKENS.ink3 }}>
                <span>Zeitraum:</span>
                <button style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 6, padding: '3px 10px', fontSize: 12, color: TOKENS.ink, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  Letzte 30 Tage <I.ChevronDown size={12}/>
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 22 }}>
              {[
                { k: 'Aktive Bewerbungen', v: '5', d: '+2 diese Woche', tone: TOKENS.applied,   bg: 'oklch(97% 0.030 240)', icon: <I.Briefcase size={14}/>, trend: true },
                { k: 'Antwortquote',       v: '40%', d: '2 von 5',         tone: TOKENS.interview, bg: 'oklch(97% 0.025 295)', icon: <I.Mail size={14}/> },
                { k: 'Ø Match-Score',      v: '83', s: '%', d: 'Top 12 % der Kohorte', tone: TOKENS.offer, bg: 'oklch(97% 0.030 155)', icon: <I.Target size={14}/>, trend: true },
                { k: 'Nächste Erinnerung', v: 'Mo', s: '16:00', d: 'Stripe nachfassen', tone: TOKENS.warn, bg: 'oklch(97% 0.030 60)',  icon: <I.Bell size={14}/> },
              ].map((s, i) => (
                <div key={i} style={{
                  background: TOKENS.surface, border: `1px solid ${TOKENS.line}`,
                  borderRadius: 12, padding: '14px 18px 16px', position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.tone, opacity: 0.85 }}/>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: 2 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: 7, background: s.bg, color: s.tone,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>{s.icon}</div>
                    <span style={{ fontSize: 11.5, fontFamily: TOKENS.mono, letterSpacing: 0.06, textTransform: 'uppercase', color: TOKENS.ink3 }}>{s.k}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.6, color: TOKENS.ink }} className="num">{s.v}</span>
                    {s.s && <span style={{ fontSize: 13, color: TOKENS.ink3 }}>{s.s}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: s.tone, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                    {s.trend && <I.TrendUp size={12}/>}
                    {s.d}
                  </div>
                </div>
              ))}
            </div>

            {/* Pipeline preview */}
            <Panel
              title="Pipeline"
              padding={0}
              action={<a style={{ fontSize: 12.5, color: TOKENS.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>Alle anzeigen <I.ChevronRight size={12}/></a>}
              style={{ marginBottom: 22 }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderTop: `1px solid ${TOKENS.line2}` }}>
                {['draft', 'applied', 'interview', 'offer', 'rejected'].map((st, i, arr) => {
                  const s = STATUS_MAP[st];
                  const counts = { draft: 1, applied: 2, interview: 1, offer: 1, rejected: 0 }[st];
                  return (
                    <div key={st} style={{
                      padding: '14px 14px 16px', borderRight: i < arr.length - 1 ? `1px solid ${TOKENS.line2}` : 'none',
                      minHeight: 110, position: 'relative', background: s.bg,
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: s.color }}/>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                        <span style={{ width: 7, height: 7, borderRadius: 3.5, background: s.color }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{s.label}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: s.color, fontFamily: TOKENS.mono, opacity: 0.7 }} className="num">{counts}</span>
                      </div>
                      {counts === 0 ? (
                        <div style={{ fontSize: 11.5, color: TOKENS.ink4, padding: '4px 0' }}>Leer</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {Array.from({ length: counts }).slice(0, 2).map((_, idx) => (
                            <div key={idx} style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.line2}`, borderRadius: 6, padding: '7px 9px', fontSize: 11.5 }}>
                              <div style={{ fontWeight: 500, color: TOKENS.ink, marginBottom: 2 }}>{['Stripe', 'Figma', 'Linear', 'Notion', 'Vercel'][(i + idx) % 5]}</div>
                              <div style={{ color: TOKENS.ink3, fontSize: 10.5 }}>Frontend · 88%</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Panel>

            {/* Two-col: recent activity + reminders */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
              <Panel
                title="Letzte Aktivität"
                padding={0}
                action={<a style={{ fontSize: 12.5, color: TOKENS.ink3, cursor: 'pointer' }}>Alle Bewerbungen</a>}
              >
                <div>
                  {recentApps.map((a, i) => {
                    const sm = STATUS_MAP[a.status];
                    return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px 12px 18px',
                      borderBottom: i < recentApps.length - 1 ? `1px solid ${TOKENS.line2}` : 'none',
                      position: 'relative',
                    }}>
                      <div style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2, background: sm.color }}/>
                      <CompanyLogo name={a.co} color={a.color} size={34}/>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: TOKENS.ink }}>{a.role}</div>
                        <div style={{ fontSize: 12, color: TOKENS.ink3 }}>{a.co} · {a.when}</div>
                      </div>
                      <StatusPill status={a.status}/>
                      <div style={{ width: 40, textAlign: 'right' }} className="num">
                        {a.score ? <span style={{ fontSize: 13, fontWeight: 600, color: TOKENS.ink2 }}>{a.score}%</span> : <span style={{ color: TOKENS.ink4 }}>—</span>}
                      </div>
                      <button style={{ background: 'transparent', border: 'none', color: TOKENS.ink3, cursor: 'pointer', padding: 4 }}><I.More size={16}/></button>
                    </div>
                  );})}
                </div>
              </Panel>

              <Panel title="Anstehend" padding={0}>
                <div>
                  {[
                    { co: 'Stripe', role: 'Frontend Developer', date: 'Mo, 19. Mai', time: '16:00', kind: 'Follow-up', icon: <I.Mail size={14}/>, color: TOKENS.applied },
                    { co: 'Figma', role: 'Senior FE', date: 'Mi, 21. Mai', time: '10:30', kind: 'Interview', icon: <I.Calendar size={14}/>, color: TOKENS.interview },
                    { co: 'Notion', role: 'Engineer', date: 'Fr, 23. Mai', time: '14:00', kind: 'Antwort', icon: <I.Bell size={14}/>, color: TOKENS.offer },
                  ].map((r, i, arr) => (
                    <div key={i} style={{ padding: '12px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${TOKENS.line2}` : 'none', display: 'flex', gap: 12 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 7, background: r.color + '15', color: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{r.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ fontSize: 12.5, fontWeight: 500 }}>{r.kind}: {r.co}</span>
                          <span style={{ fontSize: 11, color: TOKENS.ink3, whiteSpace: 'nowrap' }} className="num">{r.time}</span>
                        </div>
                        <div style={{ fontSize: 12, color: TOKENS.ink3 }}>{r.role} · <span className="num">{r.date}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
};

// PIPELINE — full kanban view
const PipelineScreen = () => {
  const data = {
    draft:     [{ co: 'Linear', role: 'Product Designer', when: 'heute', color: '#5E6AD2' }],
    applied:   [
      { co: 'Figma', role: 'Senior Frontend', score: 76, when: 'vor 2 T.', color: '#F24E1E', reminder: 'Mo' },
      { co: 'Vercel', role: 'DX Engineer', score: 84, when: 'vor 3 T.', color: '#000' },
    ],
    interview: [{ co: 'Stripe', role: 'Frontend Developer', score: 88, when: 'Mi 10:30', color: '#635BFF', reminder: 'morgen' }],
    offer:     [{ co: 'Notion', role: 'Engineer · Web', score: 92, when: 'Antwort bis 23.5.', color: '#000' }],
    rejected:  [{ co: 'Cal.com', role: 'Eng', score: 64, when: 'vor 1 Wo.', color: '#292929' }],
  };

  return (
    <Frame>
      <div style={{ display: 'flex', height: '100%' }}>
        <Sidebar active="pipeline"/>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <AppTopBar crumbs={['Workspace', 'Pipeline']}/>
          <div style={{ padding: '20px 28px 16px', borderBottom: `1px solid ${TOKENS.line}`, background: TOKENS.surface }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: -0.3, margin: 0, flex: 1 }}>Bewerbungen</h1>
              <div style={{ display: 'flex', background: TOKENS.surface2, borderRadius: 8, padding: 3, border: `1px solid ${TOKENS.line2}` }}>
                {[{ k: 'Liste', i: <I.Layers size={14}/> }, { k: 'Pipeline', i: <I.Columns size={14}/>, on: true }].map(v => (
                  <button key={v.k} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 5,
                    background: v.on ? TOKENS.surface : 'transparent', color: v.on ? TOKENS.ink : TOKENS.ink3,
                    border: 'none', fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: v.on ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
                  }}>{v.i}{v.k}</button>
                ))}
              </div>
              <Btn variant="cta" icon={<I.Plus size={14}/>}>Neue Bewerbung</Btn>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: TOKENS.ink2, background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}><I.Filter size={12}/> Filter</button>
              {['Alle Stati', 'Score ≥ 80', 'Mit Erinnerung'].map(f => (
                <button key={f} style={{ fontSize: 12, color: TOKENS.ink3, background: TOKENS.surface2, border: `1px solid ${TOKENS.line2}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>{f}</button>
              ))}
              <div style={{ flex: 1 }}/>
              <div style={{ fontSize: 12, color: TOKENS.ink3 }}>5 Bewerbungen</div>
            </div>
          </div>

          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, padding: 16, background: TOKENS.bg, overflow: 'auto' }}>
            {['draft', 'applied', 'interview', 'offer', 'rejected'].map(st => {
              const s = STATUS_MAP[st];
              const items = data[st];
              return (
                <div key={st} style={{ display: 'flex', flexDirection: 'column', minWidth: 0, background: s.bg, borderRadius: 12, padding: '0 8px 8px', border: `1px solid ${s.color}22` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 6px 12px', borderBottom: `1px solid ${s.color}25`, marginBottom: 10, position: 'relative' }}>
                    <div style={{ position: 'absolute', top: -1, left: -8, right: -8, height: 3, background: s.color, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}/>
                    <span style={{ width: 7, height: 7, borderRadius: 3.5, background: s.color, marginTop: 2 }}/>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: s.color }}>{s.label}</span>
                    <span style={{ fontSize: 11, color: s.color, fontFamily: TOKENS.mono, opacity: 0.7 }} className="num">{items.length}</span>
                    <button style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: s.color, cursor: 'pointer', padding: 2, opacity: 0.7 }}><I.Plus size={14}/></button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                    {items.map((a, i) => (
                      <div key={i} style={{
                        background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 10, padding: 12,
                        cursor: 'grab', boxShadow: '0 1px 2px rgba(15,18,32,0.03)',
                        borderLeft: `3px solid ${s.color}`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
                          <CompanyLogo name={a.co} color={a.color} size={28}/>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: TOKENS.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.co}</div>
                            <div style={{ fontSize: 10.5, color: TOKENS.ink3, fontFamily: TOKENS.mono, letterSpacing: 0.04 }}>{a.when}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: TOKENS.ink2, marginBottom: 10, lineHeight: 1.4 }}>{a.role}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {a.score && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: a.score >= 80 ? TOKENS.offer : a.score >= 60 ? TOKENS.applied : TOKENS.warn, background: a.score >= 80 ? 'oklch(95% 0.04 155)' : a.score >= 60 ? 'oklch(95% 0.025 240)' : 'oklch(96% 0.03 60)', padding: '1px 7px', borderRadius: 4, fontWeight: 500 }} className="num">
                            <I.Target size={10}/><span>{a.score}%</span>
                          </div>}
                          {a.reminder && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: TOKENS.warn, background: 'oklch(95% 0.025 60)', padding: '1px 7px', borderRadius: 4, fontWeight: 500 }}>
                            <I.Bell size={10}/><span>{a.reminder}</span>
                          </div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Frame>
  );
};

// WIZARD — focused single-task layout
const WizardScreen = () => {
  return (
    <Frame>
      <div style={{ display: 'flex', height: '100%' }}>
        {/* Slim left rail with vertical steps */}
        <aside style={{ width: 280, background: TOKENS.surface, borderRight: `1px solid ${TOKENS.line}`, padding: '24px 20px', display: 'flex', flexDirection: 'column' }}>
          <a style={{ display: 'flex', alignItems: 'center', gap: 8, color: TOKENS.ink3, fontSize: 13, marginBottom: 28, cursor: 'pointer' }}>
            <I.ChevronLeft size={14}/> Zurück zum Dashboard
          </a>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontFamily: TOKENS.mono, letterSpacing: 0.08, textTransform: 'uppercase', color: TOKENS.ink3, marginBottom: 4 }}>Neue Bewerbung</div>
            <h1 style={{ fontSize: 18, fontWeight: 600, margin: 0, letterSpacing: -0.2 }}>In 3 Schritten optimieren</h1>
          </div>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { n: 1, t: 'Lebenslauf', d: 'Datei oder Vorlage', state: 'done' },
              { n: 2, t: 'Stellenanzeige', d: 'Text oder Link', state: 'active' },
              { n: 3, t: 'Generieren', d: 'Ton & Optionen', state: 'todo' },
            ].map((s, i) => (
              <li key={s.n} style={{ position: 'relative', paddingLeft: 36, paddingBottom: 18 }}>
                {i < 2 && <div style={{ position: 'absolute', left: 13, top: 26, bottom: 0, width: 1, background: s.state === 'done' ? TOKENS.accent : TOKENS.line }}/>}
                <div style={{
                  position: 'absolute', left: 0, top: 0, width: 26, height: 26, borderRadius: 13,
                  background: s.state === 'done' ? TOKENS.accent : s.state === 'active' ? TOKENS.surface : TOKENS.surface2,
                  border: s.state === 'active' ? `2px solid ${TOKENS.accent}` : s.state === 'done' ? 'none' : `1px solid ${TOKENS.line}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: s.state === 'done' ? '#fff' : s.state === 'active' ? TOKENS.accent : TOKENS.ink3,
                  fontSize: 12, fontWeight: 600,
                }}>{s.state === 'done' ? <I.Check size={14}/> : s.n}</div>
                <div style={{ fontSize: 14, fontWeight: s.state === 'active' ? 600 : 500, color: s.state === 'todo' ? TOKENS.ink3 : TOKENS.ink }}>{s.t}</div>
                <div style={{ fontSize: 12, color: TOKENS.ink3, marginTop: 2 }}>{s.d}</div>
              </li>
            ))}
          </ol>

          <div style={{ marginTop: 'auto', padding: 14, background: TOKENS.surface2, borderRadius: 10, fontSize: 12, color: TOKENS.ink2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: TOKENS.ink }}>
              <I.Sparkles size={14}/><strong style={{ fontWeight: 600 }}>Dauert ~60 Sek.</strong>
            </div>
            Wir analysieren beide Texte, optimieren Keywords und erstellen 3 Anschreiben-Varianten.
          </div>
        </aside>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: TOKENS.bg }}>
          <div style={{ flex: 1, padding: '40px 56px', overflow: 'auto', maxWidth: 720, margin: '0 auto', width: '100%' }}>
            <h2 style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.4, margin: '0 0 8px' }}>Welche Stelle möchtest du anschreiben?</h2>
            <p style={{ fontSize: 14.5, color: TOKENS.ink3, margin: '0 0 28px' }}>Wir extrahieren Anforderungen, Pflicht-Keywords und Tonfall — und nutzen sie als Briefing für die KI.</p>

            <div style={{ display: 'flex', background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 10, padding: 4, marginBottom: 18, width: 'fit-content', gap: 2 }}>
              {[
                { k: 'Text einfügen', i: <I.Doc size={14}/>, on: true },
                { k: 'Link', i: <I.Link size={14}/> },
                { k: 'PDF', i: <I.Upload size={14}/>, soon: true },
                { k: 'Screenshot', i: <I.Eye size={14}/>, soon: true },
              ].map(t => (
                <button key={t.k} style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px',
                  background: t.on ? TOKENS.surface2 : 'transparent', color: t.soon ? TOKENS.ink4 : t.on ? TOKENS.ink : TOKENS.ink2,
                  border: 'none', borderRadius: 7, fontFamily: 'inherit', fontSize: 12.5, cursor: t.soon ? 'not-allowed' : 'pointer', fontWeight: t.on ? 500 : 400,
                }}>
                  {t.i}{t.k}
                  {t.soon && <span style={{ fontSize: 9, fontFamily: TOKENS.mono, color: TOKENS.ink4, background: TOKENS.surface, padding: '1px 5px', borderRadius: 3, letterSpacing: 0.05 }}>BALD</span>}
                </button>
              ))}
            </div>

            <div style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${TOKENS.line2}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <I.Doc size={14}/>
                <span style={{ fontSize: 12.5, color: TOKENS.ink2 }}>Stellenanzeige</span>
                <div style={{ flex: 1 }}/>
                <span style={{ fontSize: 11, color: TOKENS.ink3, fontFamily: TOKENS.mono }} className="num">847 / 50 min.</span>
              </div>
              <div style={{ padding: 16, height: 220, fontSize: 13, color: TOKENS.ink2, lineHeight: 1.55, overflow: 'auto' }}>
                <div style={{ marginBottom: 8 }}><strong style={{ color: TOKENS.ink }}>Frontend Developer (m/w/d)</strong> · Stripe · Remote (EU)</div>
                Du arbeitest mit <mark style={{ background: 'oklch(95% 0.035 268)', color: TOKENS.accent, padding: '0 3px', borderRadius: 2 }}>React</mark>, <mark style={{ background: 'oklch(95% 0.035 268)', color: TOKENS.accent, padding: '0 3px', borderRadius: 2 }}>TypeScript</mark> und unserem Design-System. Wir legen Wert auf <mark style={{ background: 'oklch(95% 0.035 268)', color: TOKENS.accent, padding: '0 3px', borderRadius: 2 }}>Accessibility</mark> und automatisierte Tests.<br/><br/>
                Anforderungen:<br/>
                · 3+ Jahre Erfahrung in produktnaher Frontend-Entwicklung<br/>
                · Sehr gute Englischkenntnisse<br/>
                · Erfahrung mit React Server Components von Vorteil
              </div>
              <div style={{ padding: '10px 14px', borderTop: `1px solid ${TOKENS.line2}`, display: 'flex', alignItems: 'center', gap: 12, background: TOKENS.surface2, fontSize: 11.5, color: TOKENS.ink3 }}>
                <I.Sparkles size={12} style={{ color: TOKENS.accent }}/>
                <span><strong style={{ color: TOKENS.ink2, fontWeight: 600 }}>14 Keywords</strong> erkannt · React, TypeScript, Accessibility, +11</span>
              </div>
            </div>

            <div style={{ marginTop: 28, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Btn variant="default" size="lg">Zurück</Btn>
              <Btn variant="cta" size="lg" iconRight={<I.ArrowRight size={14}/>}>Weiter zu Optionen</Btn>
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
};

// CVs page — grid of master CVs with mini preview
const CvsScreen = () => {
  const cvs = [
    { name: 'Frontend Developer · Master', meta: 'Geist Layout · DE', primary: true, updated: 'vor 2 Tagen', template: 'modern', accent: TOKENS.accent,    accentBg: 'oklch(96% 0.025 268)' },
    { name: 'Senior FE (English)',         meta: 'Sleek Layout · EN',                  updated: 'vor 1 Woche', template: 'classic', accent: TOKENS.offer,  accentBg: 'oklch(96% 0.030 155)' },
    { name: 'Product Designer Skeleton',   meta: 'Modern Layout · DE',                 updated: 'heute',        template: 'editorial', accent: TOKENS.interview, accentBg: 'oklch(96% 0.025 295)' },
  ];
  return (
    <Frame>
      <div style={{ display: 'flex', height: '100%' }}>
        <Sidebar active="cvs"/>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <AppTopBar crumbs={['Workspace', 'Lebensläufe']}/>
          <div style={{ padding: 28, overflow: 'auto', background: TOKENS.bg, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 22 }}>
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.3, margin: 0 }}>Lebensläufe</h1>
                <p style={{ fontSize: 13, color: TOKENS.ink3, margin: '4px 0 0' }}>Verwende denselben CV für mehrere Bewerbungen — die KI passt ihn pro Stelle an.</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="default" icon={<I.Doc size={14}/>}>Text einfügen</Btn>
                <Btn variant="cta" icon={<I.Upload size={14}/>}>Lebenslauf hochladen</Btn>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {cvs.map((cv, i) => (
                <article key={i} style={{
                  background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 12, overflow: 'hidden',
                  display: 'flex', flexDirection: 'column', position: 'relative',
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: cv.accent, zIndex: 1 }}/>
                  <div style={{ height: 200, background: cv.accentBg, padding: 18, position: 'relative', borderBottom: `1px solid ${TOKENS.line2}` }}>
                    {/* mini preview */}
                    <div style={{ background: '#fff', height: '100%', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderRadius: 3, padding: '12px 14px', fontSize: 6.5, color: TOKENS.ink2, lineHeight: 1.5, overflow: 'hidden' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: TOKENS.ink, marginBottom: 2 }}>Lina Bachmann</div>
                      <div style={{ fontSize: 6, color: TOKENS.ink3, marginBottom: 8 }}>Frontend Developer · Berlin</div>
                      <div style={{ height: 0.5, background: TOKENS.line, marginBottom: 5 }}/>
                      <div style={{ fontWeight: 600, color: TOKENS.ink, marginBottom: 2, fontSize: 7 }}>Erfahrung</div>
                      <div>Mediahaus GmbH · 2023–heute</div>
                      <div style={{ color: TOKENS.ink3, marginBottom: 4 }}>Frontend Developer · Berlin</div>
                      <div style={{ height: 0.5, width: '80%', background: TOKENS.line2, marginBottom: 2 }}/>
                      <div style={{ height: 0.5, width: '95%', background: TOKENS.line2, marginBottom: 2 }}/>
                      <div style={{ height: 0.5, width: '70%', background: TOKENS.line2, marginBottom: 6 }}/>
                      <div>Stripe Open Source · 2022–2023</div>
                      <div style={{ color: TOKENS.ink3, marginBottom: 4 }}>Contributor</div>
                      <div style={{ height: 0.5, width: '85%', background: TOKENS.line2, marginBottom: 2 }}/>
                      <div style={{ height: 0.5, width: '60%', background: TOKENS.line2 }}/>
                    </div>
                    {cv.primary && (
                      <div style={{ position: 'absolute', top: 12, left: 12, display: 'inline-flex', alignItems: 'center', gap: 4, background: cv.accent, color: '#fff', fontSize: 10.5, fontWeight: 600, padding: '3px 8px', borderRadius: 4, boxShadow: '0 2px 6px rgba(0,0,0,0.10)' }}>
                        <I.Star size={10} fill="currentColor"/> Primär
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: TOKENS.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cv.name}</div>
                      <button style={{ background: 'transparent', border: 'none', color: TOKENS.ink3, cursor: 'pointer', padding: 2 }}><I.More size={15}/></button>
                    </div>
                    <div style={{ fontSize: 12, color: TOKENS.ink3, marginTop: 3 }}>{cv.meta} · Aktualisiert {cv.updated}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                      <Btn size="sm" variant="default" style={{ flex: 1 }}>Bearbeiten</Btn>
                      <Btn size="sm" variant="primary" style={{ flex: 1 }} icon={<I.Sparkles size={12}/>}>Anwenden</Btn>
                    </div>
                  </div>
                </article>
              ))}
              {/* New CV tile */}
              <article style={{
                background: 'transparent', border: `1.5px dashed ${TOKENS.line}`, borderRadius: 12,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: 320, color: TOKENS.ink3, gap: 10, cursor: 'pointer',
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 20, background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TOKENS.ink2 }}>
                  <I.Plus size={20}/>
                </div>
                <div style={{ fontSize: 13.5, color: TOKENS.ink2, fontWeight: 500 }}>Neuen Lebenslauf hinzufügen</div>
                <div style={{ fontSize: 12, color: TOKENS.ink3 }}>PDF · DOCX · Text · Quickstart</div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
};

Object.assign(window, { DashboardScreen, PipelineScreen, WizardScreen, CvsScreen });
