// Hireflow "Atlas" — Landing hero + Login screens.

const LandingScreen = () => {
  return (
    <Frame bg={TOKENS.bg}>
      {/* Subtle radial accent */}
      <div style={{
        position: 'absolute', top: -120, left: '50%', transform: 'translateX(-50%)',
        width: 800, height: 800, borderRadius: '50%',
        background: `radial-gradient(circle, ${TOKENS.accentSoft} 0%, transparent 60%)`,
        pointerEvents: 'none', opacity: 0.7,
      }}/>
      <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>

        {/* Nav */}
        <header style={{
          padding: '20px 56px', display: 'flex', alignItems: 'center', gap: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: `linear-gradient(135deg, ${TOKENS.accent}, ${TOKENS.accent2})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 14,
            }}>H</div>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.2 }}>Hireflow</div>
          </div>
          <nav style={{ display: 'flex', gap: 22, marginLeft: 16, fontSize: 13.5 }}>
            {['Features', 'Workflow', 'Beispiel', 'Preise', 'FAQ'].map(l => (
              <a key={l} style={{ color: TOKENS.ink2, cursor: 'pointer' }}>{l}</a>
            ))}
          </nav>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <Btn variant="ghost" size="md">Anmelden</Btn>
            <Btn variant="primary" size="md" iconRight={<I.ArrowRight size={13}/>}>Kostenlos starten</Btn>
          </div>
        </header>

        {/* Hero */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, padding: '40px 56px 0', alignItems: 'center' }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 999,
              padding: '5px 12px 5px 8px', marginBottom: 22, fontSize: 12.5, color: TOKENS.ink2,
              boxShadow: '0 1px 2px rgba(15,18,32,0.03)',
            }}>
              <span style={{ width: 18, height: 18, borderRadius: 9, background: TOKENS.accentSoft, color: TOKENS.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <I.Sparkles size={11}/>
              </span>
              KI-Bewerbungsagent · Beta
            </div>
            <h1 style={{
              fontSize: 60, fontWeight: 600, letterSpacing: -1.6, lineHeight: 1.04, margin: 0, color: TOKENS.ink,
            }}>Bewerbungen,<br/>die zur <span style={{ color: TOKENS.accent, fontStyle: 'italic', fontWeight: 500 }}>Stelle</span> passen.</h1>
            <p style={{ fontSize: 17, color: TOKENS.ink2, lineHeight: 1.5, margin: '22px 0 32px', maxWidth: 500 }}>
              Lade deinen Lebenslauf hoch, füge die Stellenanzeige an — bekomme in 60 Sekunden eine maßgeschneiderte Bewerbung mit passenden Keywords, poliertem Anschreiben und ATS-tauglichem Layout.
            </p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
              <Btn variant="cta" size="lg" iconRight={<I.ArrowRight size={15}/>}>Bewerbung optimieren</Btn>
              <Btn variant="default" size="lg">So funktioniert's</Btn>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12.5, color: TOKENS.ink3 }}>
              <div style={{ display: 'flex' }}>
                {['#5B6CFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'].map((c, i) => (
                  <div key={i} style={{
                    width: 28, height: 28, borderRadius: 14, background: c,
                    border: '2px solid ' + TOKENS.bg, marginLeft: i ? -8 : 0,
                  }}/>
                ))}
              </div>
              <div>
                <div style={{ color: TOKENS.ink, fontWeight: 500, fontSize: 13 }}>4.900+ Bewerbungen optimiert</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{ color: TOKENS.warn, fontSize: 12 }}>★★★★★</span>
                  <span>4,7 / 5 · 312 Bewertungen</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: stylized product peek */}
          <div style={{ position: 'relative', height: 540, marginRight: -56 }}>
            {/* Editor card */}
            <div style={{
              position: 'absolute', inset: 0, background: TOKENS.surface,
              border: `1px solid ${TOKENS.line}`, borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 30px 60px -25px rgba(15,18,32,0.18), 0 8px 24px -8px rgba(15,18,32,0.10)',
              transform: 'rotate(0.4deg)',
            }}>
              {/* tab bar */}
              <div style={{ padding: '10px 14px', borderBottom: `1px solid ${TOKENS.line}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  <div style={{ width: 9, height: 9, borderRadius: 5, background: '#FF5F57' }}/>
                  <div style={{ width: 9, height: 9, borderRadius: 5, background: '#FFBD2E' }}/>
                  <div style={{ width: 9, height: 9, borderRadius: 5, background: '#28C940' }}/>
                </div>
                <div style={{ marginLeft: 10, fontSize: 11.5, color: TOKENS.ink3 }}>Stripe — Frontend Developer</div>
                <div style={{ marginLeft: 'auto' }}><ScorePill score={88} label="ATS"/></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', height: 'calc(100% - 41px)' }}>
                <div style={{ padding: '18px 20px', borderRight: `1px solid ${TOKENS.line2}`, overflow: 'hidden' }}>
                  <div style={{ fontSize: 11, color: TOKENS.ink3, fontFamily: TOKENS.mono, textTransform: 'uppercase', letterSpacing: 0.06, marginBottom: 8 }}>Profil</div>
                  <div style={{ fontSize: 13, color: TOKENS.ink, lineHeight: 1.6, marginBottom: 16 }}>
                    Frontend-Entwicklerin mit Fokus auf <mark style={{ background: 'oklch(95% 0.04 155)', color: TOKENS.offer, padding: '0 3px', borderRadius: 2 }}>React</mark> und <mark style={{ background: 'oklch(95% 0.04 155)', color: TOKENS.offer, padding: '0 3px', borderRadius: 2 }}>TypeScript</mark>. Erfahrung mit <mark style={{ background: 'oklch(95% 0.04 155)', color: TOKENS.offer, padding: '0 3px', borderRadius: 2 }}>Accessibility</mark> und automatisierten Tests.
                  </div>

                  <div style={{ fontSize: 11, color: TOKENS.ink3, fontFamily: TOKENS.mono, textTransform: 'uppercase', letterSpacing: 0.06, marginBottom: 8 }}>Erfahrung</div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 3 }}>
                      <strong style={{ fontWeight: 600 }}>Frontend Developer</strong>
                      <span style={{ color: TOKENS.ink3, fontFamily: TOKENS.mono }} className="num">2023 – heute</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: TOKENS.ink3, marginBottom: 6 }}>Mediahaus GmbH · Berlin</div>
                    <ul style={{ margin: 0, paddingLeft: 14, fontSize: 11.5, color: TOKENS.ink2, lineHeight: 1.5 }}>
                      <li>Checkout-Flow produktionsreif ausgeliefert</li>
                      <li>WCAG 2.2 AAA-Audit durchgeführt</li>
                    </ul>
                  </div>
                </div>

                <div style={{ padding: '16px 14px', background: TOKENS.surface2, fontSize: 11 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={{ fontSize: 11, color: TOKENS.ink3, fontFamily: TOKENS.mono, textTransform: 'uppercase', letterSpacing: 0.06 }}>Match</span>
                    <ScoreRing score={88} size={42}/>
                  </div>
                  <div style={{ fontSize: 10.5, color: TOKENS.ink3, fontFamily: TOKENS.mono, textTransform: 'uppercase', letterSpacing: 0.06, marginBottom: 6 }}>Treffer</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
                    {['React', 'TypeScript', 'a11y', 'Tests'].map(k => (
                      <span key={k} style={{ background: 'oklch(95% 0.04 155)', color: TOKENS.offer, fontSize: 10, padding: '2px 6px', borderRadius: 3 }}>{k}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 10.5, color: TOKENS.ink3, fontFamily: TOKENS.mono, textTransform: 'uppercase', letterSpacing: 0.06, marginBottom: 6 }}>Lücken</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
                    {['RxJS', 'GraphQL'].map(k => (
                      <span key={k} style={{ background: 'oklch(96% 0.02 25)', color: TOKENS.rejected, fontSize: 10, padding: '2px 6px', borderRadius: 3 }}>{k}</span>
                    ))}
                  </div>
                  <div style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.line2}`, borderRadius: 6, padding: 8, fontSize: 10.5, color: TOKENS.ink2 }}>
                    <div style={{ color: TOKENS.accent, fontWeight: 600, marginBottom: 3 }}>Vorschlag</div>
                    Füge RxJS in deiner Erfahrung ein — die Stelle nennt es als Muss.
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Anschreiben card */}
            <div style={{
              position: 'absolute', bottom: -40, left: -60, width: 280,
              background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 12,
              boxShadow: '0 24px 48px -20px rgba(15,18,32,0.25)', padding: 16,
              transform: 'rotate(-2deg)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <I.Mail size={14} style={{ color: TOKENS.accent }}/>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Anschreiben · Formal</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: TOKENS.ink3, fontFamily: TOKENS.mono }}>3 Varianten</span>
              </div>
              <div style={{ fontSize: 11.5, color: TOKENS.ink2, lineHeight: 1.5 }}>
                Sehr geehrtes Stripe-Team,<br/><br/>
                als Frontend-Entwicklerin mit Fokus auf barrierefreie SaaS-Oberflächen verfolge ich Ihre Arbeit am Stripe Dashboard…
              </div>
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
};

// LOGIN — split screen with brand pattern
const LoginScreen = () => {
  return (
    <Frame>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%' }}>
        {/* Left brand panel */}
        <div style={{
          background: TOKENS.ink, color: '#fff', padding: 48, position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Decorative grid pattern */}
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.04 }} aria-hidden="true">
            <defs>
              <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M32 0 L0 0 0 32" fill="none" stroke="#fff" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)"/>
          </svg>
          {/* Accent glow */}
          <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: TOKENS.accent, filter: 'blur(120px)', opacity: 0.4 }}/>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg, ${TOKENS.accent}, ${TOKENS.accent2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>H</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Hireflow</div>
          </div>

          <div style={{ position: 'relative', marginTop: 'auto' }}>
            <div style={{ fontSize: 11, fontFamily: TOKENS.mono, letterSpacing: 0.1, textTransform: 'uppercase', opacity: 0.6, marginBottom: 14 }}>Was unsere Nutzer sagen</div>
            <blockquote style={{ fontSize: 22, lineHeight: 1.35, letterSpacing: -0.4, margin: 0, fontWeight: 500, maxWidth: 440 }}>
              „In 90 Sekunden hatte ich eine Bewerbung, für die ich sonst zwei Stunden gebraucht hätte. Der Match-Report ist Gold wert."
            </blockquote>
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, background: '#5B6CFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600 }}>LB</div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>Lina Bachmann</div>
                <div style={{ fontSize: 12, opacity: 0.65 }}>Frontend Developer · jetzt bei Stripe</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right form */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
          <div style={{ width: '100%', maxWidth: 380 }}>
            <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.5, margin: '0 0 6px' }}>Willkommen zurück</h1>
            <p style={{ fontSize: 14, color: TOKENS.ink3, margin: '0 0 32px' }}>Melde dich an, um deine Bewerbungen zu verwalten.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 500, color: TOKENS.ink2, display: 'block', marginBottom: 6 }}>E-Mail</label>
                <input type="email" placeholder="lina@example.de" defaultValue="lina@example.de" style={{
                  width: '100%', height: 40, padding: '0 12px', fontSize: 13.5,
                  background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 8,
                  fontFamily: 'inherit', color: TOKENS.ink, outline: 'none',
                }}/>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 500, color: TOKENS.ink2 }}>Passwort</label>
                  <a style={{ fontSize: 12, color: TOKENS.accent, cursor: 'pointer' }}>Vergessen?</a>
                </div>
                <input type="password" defaultValue="••••••••••••" style={{
                  width: '100%', height: 40, padding: '0 12px', fontSize: 13.5,
                  background: TOKENS.surface, border: `1px solid ${TOKENS.line}`, borderRadius: 8,
                  fontFamily: 'inherit', color: TOKENS.ink, outline: 'none', letterSpacing: 2,
                }}/>
              </div>
              <Btn variant="primary" size="lg" style={{ marginTop: 6, width: '100%' }} iconRight={<I.ArrowRight size={14}/>}>Anmelden</Btn>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0', color: TOKENS.ink4, fontSize: 11.5 }}>
                <div style={{ flex: 1, height: 1, background: TOKENS.line }}/>
                <span>oder</span>
                <div style={{ flex: 1, height: 1, background: TOKENS.line }}/>
              </div>

              <Btn variant="default" size="lg" style={{ width: '100%' }} icon={
                <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.6c-.2 1.3-1 2.4-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3.1-7.5z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.6c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.6C4.7 19.7 8.1 22 12 22z"/><path fill="#FBBC04" d="M6.4 13.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V7.5H3a10 10 0 0 0 0 9z"/><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 3 14.7 2 12 2 8.1 2 4.7 4.3 3 7.5l3.4 2.6C7.2 7.8 9.4 6 12 6z"/></svg>
              }>Mit Google fortfahren</Btn>
            </div>

            <p style={{ fontSize: 12.5, color: TOKENS.ink3, textAlign: 'center', marginTop: 24 }}>
              Noch keinen Account? <a style={{ color: TOKENS.accent, fontWeight: 500, cursor: 'pointer' }}>Kostenlos registrieren</a>
            </p>
          </div>
        </div>
      </div>
    </Frame>
  );
};

Object.assign(window, { LandingScreen, LoginScreen });
