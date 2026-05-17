// Hireflow "Atlas" — Editor screen (the most important view).
// 1440×900 artboard. 3-pane: outline · CV editor · letter+analytics.

const EditorScreen = () => {
  const sections = [
    { id: 'profile', label: 'Profil', items: 1, active: true },
    { id: 'experience', label: 'Erfahrung', items: 3 },
    { id: 'projects', label: 'Projekte', items: 2 },
    { id: 'skills', label: 'Skills', items: 1 },
    { id: 'education', label: 'Ausbildung', items: 2 },
    { id: 'languages', label: 'Sprachen', items: 3 },
  ];

  return (
    <Frame>
      <div style={{ display: 'flex', height: '100%' }}>
        <Sidebar active="applications"/>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Top bar */}
          <AppTopBar
            crumbs={['Bewerbungen', 'Stripe · Frontend Developer']}
            actions={
              <>
                <span style={{ fontSize: 12, color: TOKENS.ink3, display: 'flex', alignItems: 'center', gap: 5, marginRight: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: TOKENS.offer }}/>Gespeichert
                </span>
                <Btn variant="default" size="md" icon={<I.Eye size={14}/>}>Vorschau</Btn>
                <Btn variant="primary" size="md" icon={<I.Download size={14}/>} iconRight={<I.ChevronDown size={12}/>}>Exportieren</Btn>
              </>
            }
          />

          {/* Header strip */}
          <header style={{
            padding: '16px 24px', background: TOKENS.surface, borderBottom: `1px solid ${TOKENS.line}`,
            display: 'flex', alignItems: 'center', gap: 18,
          }}>
            <CompanyLogo name="Stripe" color="#635BFF" size={44}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: 18, fontWeight: 600, letterSpacing: -0.3, margin: 0 }}>Frontend Developer</h1>
              <div style={{ fontSize: 12.5, color: TOKENS.ink3, marginTop: 2, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><I.Building size={11}/>Stripe</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><I.Globe size={11}/>Remote · EU</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><I.Calendar size={11}/>Erstellt 17. Mai</span>
              </div>
            </div>

            {/* Status select */}
            <button style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px 6px 12px',
              background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <StatusPill status="interview" size="md"/>
              <I.ChevronDown size={14} style={{ color: TOKENS.ink3 }}/>
            </button>

            {/* ATS score */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '6px 14px 6px 8px',
              background: TOKENS.surface2, border: `1px solid ${TOKENS.line2}`, borderRadius: 10,
            }}>
              <ScoreRing score={88} size={42}/>
              <div>
                <div style={{ fontSize: 11, fontFamily: TOKENS.mono, color: TOKENS.ink3, letterSpacing: 0.06, textTransform: 'uppercase' }}>ATS-Match</div>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: TOKENS.offer }}>Stark · 14/16 Keywords</div>
              </div>
            </div>
          </header>

          {/* 3-pane body */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: TOKENS.bg }}>
            {/* Outline rail */}
            <aside style={{ width: 220, borderRight: `1px solid ${TOKENS.line}`, background: TOKENS.surface, padding: '16px 12px', overflow: 'auto' }}>
              <div style={{ fontSize: 10.5, fontFamily: TOKENS.mono, letterSpacing: 0.08, textTransform: 'uppercase', color: TOKENS.ink3, padding: '4px 10px 8px' }}>Lebenslauf</div>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {sections.map(s => (
                  <a key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6,
                    background: s.active ? TOKENS.accentSoft : 'transparent',
                    color: s.active ? TOKENS.accent : TOKENS.ink2, fontSize: 13,
                    fontWeight: s.active ? 500 : 400, cursor: 'pointer', position: 'relative',
                  }}>
                    {s.active && <span style={{ position: 'absolute', left: -12, top: 7, bottom: 7, width: 2, background: TOKENS.accent, borderRadius: 1 }}/>}
                    <span style={{ flex: 1 }}>{s.label}</span>
                    <span style={{ fontSize: 11, color: s.active ? TOKENS.accent : TOKENS.ink3, fontFamily: TOKENS.mono }} className="num">{s.items}</span>
                  </a>
                ))}
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 6, background: 'transparent', border: 'none', color: TOKENS.ink3, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                  <I.Plus size={12}/>Sektion
                </button>
              </nav>

              <div style={{ marginTop: 22, padding: '12px 10px 10px', borderTop: `1px solid ${TOKENS.line2}` }}>
                <div style={{ fontSize: 10.5, fontFamily: TOKENS.mono, letterSpacing: 0.08, textTransform: 'uppercase', color: TOKENS.ink3, marginBottom: 8 }}>Template</div>
                <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <div style={{ width: 20, height: 26, background: '#fff', border: `1px solid ${TOKENS.line}`, borderRadius: 2, flexShrink: 0, padding: '3px 2px' }}>
                    <div style={{ width: '60%', height: 2, background: TOKENS.ink2, marginBottom: 1.5 }}/>
                    <div style={{ width: '80%', height: 1, background: TOKENS.line }}/>
                    <div style={{ width: '70%', height: 1, background: TOKENS.line, marginTop: 1 }}/>
                    <div style={{ width: '85%', height: 1, background: TOKENS.line, marginTop: 1 }}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: TOKENS.ink }}>Modern</div>
                    <div style={{ fontSize: 10.5, color: TOKENS.ink3 }}>1 Spalte · Geist</div>
                  </div>
                  <I.ChevronDown size={12} style={{ color: TOKENS.ink3 }}/>
                </button>
              </div>
            </aside>

            {/* CV editor center */}
            <main style={{ flex: 1, overflow: 'auto', padding: '24px 32px', minWidth: 0 }}>
              {/* Section: Profil */}
              <article style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 12, marginBottom: 16, overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: TOKENS.accent }}/>
                <header style={{ padding: '12px 18px 12px 22px', borderBottom: `1px solid ${TOKENS.line2}`, display: 'flex', alignItems: 'center', gap: 10, background: 'oklch(98.5% 0.014 268)' }}>
                  <span style={{ color: TOKENS.ink3, cursor: 'grab' }}><I.Drag size={14}/></span>
                  <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0, color: TOKENS.accent }}>Profil</h3>
                  <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#fff', background: TOKENS.accent, padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>
                    <I.Sparkles size={10}/>KI-optimiert
                  </span>
                </header>
                <div style={{ padding: '14px 18px 14px 22px' }}>
                  <p style={{ margin: 0, fontSize: 13.5, color: TOKENS.ink, lineHeight: 1.65 }}>
                    Frontend-Entwicklerin mit 4 Jahren Erfahrung in <mark style={{ background: 'oklch(95% 0.04 155)', color: TOKENS.offer, padding: '0 3px', borderRadius: 2 }}>React</mark> und <mark style={{ background: 'oklch(95% 0.04 155)', color: TOKENS.offer, padding: '0 3px', borderRadius: 2 }}>TypeScript</mark>. Fokus auf barrierefreie SaaS-Oberflächen, Design-System-Architektur und messbare Conversion-Verbesserungen. Erfahrung mit React Server Components und automatisierten <mark style={{ background: 'oklch(95% 0.04 155)', color: TOKENS.offer, padding: '0 3px', borderRadius: 2 }}>Tests</mark>.
                  </p>
                </div>
              </article>

              {/* Section: Erfahrung */}
              <article style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 12, marginBottom: 16, overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: TOKENS.applied }}/>
                <header style={{ padding: '12px 18px 12px 22px', borderBottom: `1px solid ${TOKENS.line2}`, display: 'flex', alignItems: 'center', gap: 10, background: 'oklch(98.5% 0.012 240)' }}>
                  <span style={{ color: TOKENS.ink3, cursor: 'grab' }}><I.Drag size={14}/></span>
                  <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0, color: TOKENS.applied }}>Erfahrung</h3>
                  <span style={{ fontSize: 11, color: TOKENS.ink3 }} className="num">3 Einträge</span>
                  <button style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', color: TOKENS.applied, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}><I.Plus size={12}/>Eintrag</button>
                </header>
                <div>
                  {[
                    { role: 'Frontend Developer', co: 'Mediahaus GmbH', period: '2023 – heute', city: 'Berlin', bullets: [
                      'Checkout-Flow mit Angular, NestJS und Webhooks produktionsreif ausgeliefert.',
                      'Design-System-Komponenten auf WCAG 2.2 AAA-Kontrast geprüft.',
                    ]},
                    { role: 'Junior Frontend Engineer', co: 'Stripe Open Source', period: '2022 – 2023', city: 'Remote', bullets: [
                      'Migration von 12 internen Tools auf React Server Components.',
                    ]},
                  ].map((j, i, arr) => (
                    <div key={i} style={{ padding: '14px 18px', borderBottom: i < arr.length - 1 ? `1px solid ${TOKENS.line2}` : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{j.role}</div>
                        <div style={{ fontSize: 12.5, color: TOKENS.ink3 }}>· {j.co}</div>
                        <div style={{ marginLeft: 'auto', fontSize: 11.5, color: TOKENS.ink3, fontFamily: TOKENS.mono }} className="num">{j.period}</div>
                      </div>
                      <div style={{ fontSize: 12, color: TOKENS.ink3, marginBottom: 8 }}>{j.city}</div>
                      <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {j.bullets.map((b, bi) => (
                          <li key={bi} style={{ fontSize: 13, color: TOKENS.ink2, lineHeight: 1.55 }}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </article>

              {/* Section: Skills */}
              <article style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 12, marginBottom: 16, overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: TOKENS.offer }}/>
                <header style={{ padding: '12px 18px 12px 22px', borderBottom: `1px solid ${TOKENS.line2}`, display: 'flex', alignItems: 'center', gap: 10, background: 'oklch(98.5% 0.012 155)' }}>
                  <span style={{ color: TOKENS.ink3, cursor: 'grab' }}><I.Drag size={14}/></span>
                  <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0, color: TOKENS.offer }}>Skills</h3>
                  <span style={{ fontSize: 11, color: TOKENS.ink3, marginLeft: 4 }} className="num">6 / 8 matchen</span>
                </header>
                <div style={{ padding: '14px 18px 14px 22px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    { l: 'React', match: true }, { l: 'TypeScript', match: true }, { l: 'Accessibility', match: true },
                    { l: 'NestJS', match: true }, { l: 'Angular', match: false }, { l: 'Testing Library', match: true },
                    { l: 'Tailwind', match: false }, { l: 'Storybook', match: false },
                  ].map(s => (
                    <span key={s.l} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12,
                      padding: '4px 10px', borderRadius: 6,
                      background: s.match ? 'oklch(95% 0.04 155)' : TOKENS.surface2,
                      color: s.match ? TOKENS.offer : TOKENS.ink2,
                      border: `1px solid ${s.match ? 'oklch(88% 0.06 155)' : TOKENS.line}`,
                    }}>
                      {s.match && <I.Check size={11}/>}
                      {s.l}
                    </span>
                  ))}
                  <button style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, padding: '4px 10px', borderRadius: 6, background: 'transparent', color: TOKENS.ink3, border: `1px dashed ${TOKENS.line}`, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <I.Plus size={11}/>Skill
                  </button>
                </div>
              </article>
            </main>

            {/* Right pane: tabs */}
            <aside style={{ width: 440, borderLeft: `1px solid ${TOKENS.line}`, background: TOKENS.surface, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', borderBottom: `1px solid ${TOKENS.line}`, padding: '0 8px', gap: 0 }}>
                {[
                  { k: 'Anschreiben', i: <I.Mail size={14}/>, on: true },
                  { k: 'Analyse', i: <I.Target size={14}/> },
                  { k: 'Nachfassen', i: <I.Send size={14}/> },
                ].map(t => (
                  <button key={t.k} style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '12px 14px',
                    background: 'transparent', color: t.on ? TOKENS.ink : TOKENS.ink3, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: t.on ? 600 : 400, fontFamily: 'inherit',
                    borderBottom: t.on ? `2px solid ${TOKENS.accent}` : '2px solid transparent',
                    marginBottom: -1,
                  }}>{t.i}{t.k}</button>
                ))}
              </div>

              {/* Letter variant tabs */}
              <div style={{ padding: '14px 16px 0', display: 'flex', gap: 6 }}>
                {[
                  { k: 'Formal', selected: true },
                  { k: 'Warm' },
                  { k: 'Kurz' },
                ].map(v => (
                  <button key={v.k} style={{
                    flex: 1, padding: '7px 10px', fontSize: 12, borderRadius: 7,
                    background: v.selected ? TOKENS.surface2 : 'transparent',
                    color: v.selected ? TOKENS.ink : TOKENS.ink3,
                    border: `1px solid ${v.selected ? TOKENS.line : 'transparent'}`,
                    fontWeight: v.selected ? 500 : 400, cursor: 'pointer', fontFamily: 'inherit',
                    position: 'relative',
                  }}>
                    {v.selected && <span style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: 3, background: TOKENS.accent }}/>}
                    {v.k}
                  </button>
                ))}
              </div>

              {/* Letter content */}
              <div style={{ padding: '14px 16px', flex: 1, overflow: 'auto', fontSize: 13, color: TOKENS.ink2, lineHeight: 1.65 }}>
                <div style={{ marginBottom: 12, color: TOKENS.ink, fontWeight: 500 }}>Sehr geehrtes Stripe-Team,</div>
                <p style={{ margin: '0 0 12px' }}>als Frontend-Entwicklerin mit Fokus auf barrierefreie SaaS-Oberflächen verfolge ich Ihre Arbeit am Stripe Dashboard seit der Migration zu React Server Components.</p>
                <p style={{ margin: '0 0 12px' }}>In den letzten zwei Jahren habe ich bei Mediahaus einen Checkout-Flow mit Angular, NestJS und Webhooks produktionsreif ausgeliefert und unser Design-System auf WCAG 2.2&nbsp;AAA-Kontrast geprüft.</p>
                <p style={{ margin: 0 }}>Ich freue mich auf die Möglichkeit, gemeinsam an…</p>
              </div>

              {/* Send row */}
              <div style={{ borderTop: `1px solid ${TOKENS.line}`, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, background: TOKENS.surface2 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 7 }}>
                    <I.Mail size={13} style={{ color: TOKENS.ink3 }}/>
                    <span style={{ fontSize: 12.5, color: TOKENS.ink2 }}>recruiting@stripe.com</span>
                  </div>
                  <Btn size="md" variant="primary" icon={<I.Send size={13}/>}>Senden</Btn>
                </div>
                <div style={{ display: 'flex', gap: 8, fontSize: 11.5, color: TOKENS.ink3, alignItems: 'center' }}>
                  <I.Pin size={11}/>PDF-Anhang wird automatisch beigefügt
                  <span style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
                    <button style={{ background: 'transparent', border: 'none', color: TOKENS.ink3, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 4 }}><I.Refresh size={11}/>Neu generieren</button>
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Frame>
  );
};

Object.assign(window, { EditorScreen });
