'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'

// iOS Safari에서 홈 화면에 추가 안 된 경우 감지
function useIsInstallable() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isStandalone = ('standalone' in navigator) && (navigator as any).standalone === true
    if (isIOS && !isStandalone) setShow(true)
  }, [])
  return show
}

// ── 타입 ──────────────────────────────────────────────────────
type Tab = 'radar' | 'ideas' | 'pipeline'
type NewsItem = { headline: string; summary: string; pe_implication: string; sentiment: string; sector_tags: string[]; urgency: string; source?: string; url?: string }
type Idea = { id: string; title: string; sector: string; stage: string; ev: string; thesis: string; nextAction: string; date: string; url: string }
type Deal = { id: string; name: string; status: string; amount: number | null; type: string[]; sourcingType: string; sourcer: string; date: string; involvementSourcing?: string; involvementValueUp?: string; involvementExit?: string; url: string }

const SECTORS = ['AI반도체', 'AI에이전트', '바이오', '방산', '2차전지', '로보틱스', 'SaaS', '데이터센터', '소비재']
const STAGES = ['아이디어', '초기검토', '딜진행', '보류']
const STATUS_COLORS: Record<string, string> = { 'On-going': '#1D9E75', 'Drop': '#888780', 'Closed': '#534AB7' }
const SECTOR_COLORS: Record<string, string> = { 'AI반도체': '#3C3489', 'AI에이전트': '#712B13', '바이오': '#27500A', '방산': '#791F1F', '2차전지': '#633806', '로보틱스': '#085041', 'SaaS': '#0C447C', '데이터센터': '#444441', '소비재': '#3C3489' }

function formatAmountEok(amountWon: number): string {
  const eok = amountWon / 100_000_000
  if (eok >= 10000) return `${Math.round(eok / 1000).toLocaleString('ko-KR')}천억`
  if (eok >= 100) return `${Math.round(eok).toLocaleString('ko-KR')}억`
  if (eok >= 1) return `${(Math.round(eok * 10) / 10).toLocaleString('ko-KR')}억`
  const chun = amountWon / 10_000
  return `${Math.round(chun).toLocaleString('ko-KR')}만원`
}

// ── 유틸 컴포넌트 ──────────────────────────────────────────────
function Tag({ label, color = '#444', bg = '#f0eee8' }: { label: string; color?: string; bg?: string }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 99, background: bg, color }}>{label}</span>
}

function Btn({ children, onClick, disabled, variant = 'primary', style: s }: any) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--accent)', color: '#fff' },
    secondary: { background: 'var(--bg2)', color: 'var(--text2)', border: '0.5px solid var(--border2)' },
    ai: { background: 'var(--accent-light)', color: 'var(--accent)', border: '0.5px solid rgba(83,74,183,0.3)' },
    ghost: { background: 'transparent', color: 'var(--text2)', border: '0.5px solid var(--border2)' },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 14px', fontSize: 12, fontWeight: 500, borderRadius: 8, transition: 'opacity 0.15s', opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer', ...styles[variant], ...s }}
    >{children}</button>
  )
}

function Spinner() {
  return <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
    {[0, 0.2, 0.4].map((d, i) => (
      <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', animation: `pe-pulse 1.2s ${d}s infinite`, opacity: 0.3 }} />
    ))}
  </span>
}

// ── 메인 앱 ───────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState<Tab>('radar')
  const { data: session } = useSession()
  const showInstallBanner = useIsInstallable()
  const [bannerDismissed, setBannerDismissed] = useState(false)

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', maxWidth: 720, margin: '0 auto' }}>
      <style>{`
        @keyframes pe-pulse { 0%,80%,100%{opacity:0.3;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }
        @keyframes pe-in { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .pe-card { background: var(--bg2); border: 0.5px solid var(--border); border-radius: var(--radius-lg); padding: 14px 16px; margin-bottom: 10px; animation: pe-in 0.2s ease; }
        .pe-input { width: 100%; padding: 9px 12px; font-size: 13px; font-family: inherit; border: 0.5px solid var(--border2); border-radius: 8px; background: var(--bg2); color: var(--text); outline: none; }
        .pe-input:focus { border-color: var(--accent); }
        textarea.pe-input { resize: vertical; min-height: 88px; line-height: 1.6; }
        select.pe-input { cursor: pointer; }
        .pe-label { font-size: 11px; color: var(--text2); margin-bottom: 4px; }
        .pe-section { font-size: 10px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: var(--text3); margin-bottom: 9px; }
        .pe-divider { height: 0.5px; background: var(--border); margin: 12px 0; }
        .pe-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; padding: 5px 11px; border-radius: 99px; border: 0.5px solid var(--border2); background: var(--bg2); color: var(--text2); cursor: pointer; user-select: none; transition: all 0.12s; }
        .pe-chip.sel { background: var(--accent-light); border-color: rgba(83,74,183,0.4); color: var(--accent); font-weight: 500; }
        .pe-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .pe-grid2 { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 9px; }
        .pe-tab { padding: 11px 13px; font-size: 12px; color: var(--text2); cursor: pointer; border-bottom: 2px solid transparent; user-select: none; white-space: nowrap; transition: all 0.15s; }
        .pe-tab.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 500; }
        .pe-stage-btn { padding: 5px 10px; font-size: 12px; border-radius: 6px; border: 0.5px solid var(--border2); background: var(--bg2); color: var(--text2); cursor: pointer; font-family: inherit; transition: all 0.12s; }
        .pe-stage-btn.sel { background: var(--accent-light); border-color: rgba(83,74,183,0.4); color: var(--accent); font-weight: 500; }
        .pe-save-box { background: var(--bg3); border-radius: 10px; padding: 12px 14px; }
        .pe-save-note { font-size: 11px; color: var(--text3); margin-bottom: 7px; }
        /* iOS safe area 대응 */
        .pe-topbar { padding-top: env(safe-area-inset-top); }
        .pe-bottom-safe { padding-bottom: env(safe-area-inset-bottom); }
      `}</style>

      {/* iOS 홈 화면 추가 유도 배너 */}
      {showInstallBanner && !bannerDismissed && (
        <div style={{ background: '#534AB7', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexShrink: 0 }}>
          <div style={{ fontSize: 12, color: 'white', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600 }}>앱으로 설치하기</span>
            <span style={{ opacity: 0.8 }}> — 하단 공유 버튼 → '홈 화면에 추가' 탭</span>
          </div>
          <button onClick={() => setBannerDismissed(true)} style={{ color: 'rgba(255,255,255,0.7)', background: 'transparent', border: 'none', fontSize: 16, padding: '0 4px', cursor: 'pointer', flexShrink: 0 }}>✕</button>
        </div>
      )}

      {/* 탑바 — iOS safe area 대응 */}
      <div className="pe-topbar" style={{ background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 50, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>PE Command Center</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>SV Investment</span>
          {session?.user && (
            <>
              {session.user.image
                ? <img src={session.user.image} alt="profile" style={{ width: 24, height: 24, borderRadius: '50%', border: '0.5px solid var(--border2)' }} />
                : <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 600 }}>{session.user.name?.[0] ?? '?'}</div>
              }
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                style={{ fontSize: 10, color: 'var(--text3)', background: 'transparent', border: '0.5px solid var(--border2)', borderRadius: 6, padding: '3px 7px', cursor: 'pointer', fontFamily: 'inherit' }}
              >로그아웃</button>
            </>
          )}
        </div>
      </div>

      {/* 탭 */}
      <div style={{ background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)', display: 'flex', padding: '0 16px', overflowX: 'auto', flexShrink: 0 }}>
        {([['radar', '📡 News Radar'], ['ideas', '💡 Idea Bank'], ['pipeline', '🔍 Deal Pipeline']] as [Tab, string][]).map(([key, label]) => (
          <div key={key} className={`pe-tab${tab === key ? ' active' : ''}`} onClick={() => setTab(key)}>{label}</div>
        ))}
      </div>

      {/* 컨텐츠 — 탭 전환 시 상태 유지를 위해 display:none 방식 사용 */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ display: tab === 'radar' ? 'block' : 'none', padding: 14 }}><NewsRadar /></div>
        <div style={{ display: tab === 'ideas' ? 'block' : 'none', padding: 14 }}><IdeaBank /></div>
        <div style={{ display: tab === 'pipeline' ? 'block' : 'none', padding: 14 }}><DealPipeline /></div>
      </div>
    </div>
  )
}

// ── NEWS RADAR ──────────────────────────────────────────────────
function NewsRadar() {
  const [kws, setKws] = useState<string[]>([])
  const [kwInput, setKwInput] = useState('')
  const [selSectors, setSelSectors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [news, setNews] = useState<NewsItem[]>([])
  const [scannedAt, setScannedAt] = useState('')
  const [error, setError] = useState('')

  const addKw = () => {
    const v = kwInput.trim()
    if (v && !kws.includes(v)) setKws(p => [...p, v])
    setKwInput('')
  }

  const toggleSector = (s: string) => setSelSectors(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])

  const scan = async () => {
    const all = [...kws, ...selSectors]
    if (!all.length) { alert('키워드 또는 섹터를 선택해주세요.'); return }
    setLoading(true); setError(''); setNews([])
    try {
      const r = await fetch('/api/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keywords: all }) })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      setNews(d.items ?? [])
      setScannedAt(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }))
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const sc: Record<string, { bg: string; color: string }> = {
    positive: { bg: '#E1F5EE', color: '#085041' },
    negative: { bg: '#FCEBEB', color: '#791F1F' },
    neutral: { bg: '#FAEEDA', color: '#633806' },
  }
  const sl: Record<string, string> = { positive: '긍정', negative: '부정', neutral: '중립' }
  const uc: Record<string, { bg: string; color: string }> = {
    high: { bg: '#FAECE7', color: '#712B13' },
    medium: { bg: '#FAEEDA', color: '#633806' },
    low: { bg: '#F1EFE8', color: '#444441' },
  }
  const ul: Record<string, string> = { high: '주목', medium: '관찰', low: '참고' }

  return (
    <div>
      <div className="pe-card">
        <div className="pe-section">모니터링 키워드</div>
        <div className="pe-row" style={{ marginBottom: 10, minHeight: 28 }}>
          {kws.length ? kws.map(k => (
            <span key={k} className="pe-chip sel">{k} <span onClick={() => setKws(p => p.filter(x => x !== k))} style={{ fontSize: 10, cursor: 'pointer', marginLeft: 2 }}>✕</span></span>
          )) : <span style={{ fontSize: 11, color: 'var(--text3)' }}>키워드 추가 또는 아래 섹터 선택</span>}
        </div>
        <div style={{ display: 'flex', gap: 7, marginBottom: 12 }}>
          <input className="pe-input" style={{ flex: 1 }} value={kwInput} onChange={e => setKwInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.nativeEvent.isComposing && addKw()} placeholder="키워드 직접 입력 (엔터)" />
          <Btn variant="secondary" onClick={addKw}>추가</Btn>
        </div>
        <div className="pe-divider" />
        <div className="pe-section">빠른 섹터 선택</div>
        <div className="pe-row" style={{ marginBottom: 12 }}>
          {SECTORS.map(s => (
            <div key={s} className={`pe-chip${selSectors.includes(s) ? ' sel' : ''}`} onClick={() => toggleSector(s)}>{s}</div>
          ))}
        </div>
        <div className="pe-divider" />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Btn onClick={scan} disabled={loading}>{loading ? <><Spinner /> 검색 중...</> : '스캔 시작'}</Btn>
          <Btn variant="ghost" style={{ padding: '5px 9px', fontSize: 11 }} onClick={() => { setNews([]); setScannedAt('') }}>초기화</Btn>
          {scannedAt && <span style={{ fontSize: 11, color: 'var(--text3)' }}>{news.length}건 · {scannedAt}</span>}
        </div>
      </div>

      {loading && (
        <div style={{ background: 'var(--accent-light)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--accent)', display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <Spinner /> Claude가 최신 뉴스를 검색 중...
        </div>
      )}

      {error && <div style={{ color: '#791F1F', background: '#FCEBEB', borderRadius: 8, padding: '10px 14px', fontSize: 12, marginBottom: 10 }}>오류: {error}</div>}

      {news.map((n, i) => (
        <div key={i} className="pe-card">
          <div className="pe-row" style={{ marginBottom: 7 }}>
            {sc[n.sentiment] && <Tag label={sl[n.sentiment] ?? n.sentiment} {...sc[n.sentiment]} />}
            {uc[n.urgency] && <Tag label={ul[n.urgency] ?? n.urgency} {...uc[n.urgency]} />}
            {n.sector_tags?.slice(0, 2).map(t => <Tag key={t} label={t} bg="#E6F1FB" color="#0C447C" />)}
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 5, lineHeight: 1.5 }}>{n.headline}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 8 }}>{n.summary}</div>
          <div style={{ fontSize: 12, color: '#3C3489', background: 'var(--accent-light)', borderRadius: 6, padding: '8px 10px', lineHeight: 1.6, marginBottom: n.source ? 7 : 0 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', marginBottom: 3 }}>PE 시사점</div>
            {n.pe_implication}
          </div>
          {n.source && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 7 }}>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>출처</span>
              {n.url ? (
                <a href={n.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', borderBottom: '0.5px solid rgba(83,74,183,0.4)' }}>
                  {n.source} ↗
                </a>
              ) : (
                <span style={{ fontSize: 11, color: 'var(--text2)' }}>{n.source}</span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── IDEA BANK ──────────────────────────────────────────────────
function IdeaBank() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [form, setForm] = useState({ title: '', extra: '', thesis: '', sector: '', stage: '아이디어', ev: '', nextAction: '', sourcingRoute: '' })

  const loadIdeas = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/ideas')
      const d = await r.json()
      setIdeas(d.ideas ?? [])
    } catch { }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadIdeas() }, [loadIdeas])

  const autoGen = async () => {
    if (!form.title.trim()) { alert('제목을 먼저 입력해주세요.'); return }
    setGenerating(true)
    try {
      const r = await fetch('/api/autogen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: form.title, extra: form.extra }) })
      const d = await r.json()
      if (d.sector) setForm(p => ({ ...p, sector: d.sector }))
      if (d.thesis_bullets?.length) setForm(p => ({ ...p, thesis: d.thesis_bullets.map((b: string) => `• ${b}`).join('\n') }))
    } catch (e: any) { alert('오류: ' + e.message) }
    finally { setGenerating(false) }
  }

  const save = async () => {
    if (!form.title.trim()) { alert('제목을 입력해주세요.'); return }
    setSaving(true); setSaveStatus('Notion에 저장 중...')
    try {
      const r = await fetch('/api/ideas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: form.title, sector: form.sector, stage: form.stage, ev: form.ev, thesis: form.thesis, nextAction: form.nextAction, sourcingRoute: form.sourcingRoute }) })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      setSaveStatus('✓ 저장 완료')
      setForm({ title: '', extra: '', thesis: '', sector: '', stage: '아이디어', ev: '', nextAction: '', sourcingRoute: '' })
      loadIdeas()
      setTimeout(() => setSaveStatus(''), 3000)
    } catch (e: any) { setSaveStatus('오류: ' + e.message) }
    finally { setSaving(false) }
  }

  const stageColors: Record<string, { bg: string; color: string }> = {
    '아이디어': { bg: '#EEEDFE', color: '#3C3489' },
    '초기검토': { bg: '#E6F1FB', color: '#0C447C' },
    '딜진행': { bg: '#E1F5EE', color: '#085041' },
    '보류': { bg: '#F1EFE8', color: '#444441' },
  }

  return (
    <div>
      {/* 입력 폼 */}
      <div className="pe-card">
        <div className="pe-section" style={{ marginBottom: 11 }}>새 아이디어 캡처</div>

        <div style={{ marginBottom: 10 }}>
          <div className="pe-label">투자 대상 / 제목</div>
          <div style={{ display: 'flex', gap: 7 }}>
            <input className="pe-input" style={{ flex: 1 }} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="예: Rebellions, AI 후공정 플레이" />
            <Btn variant="ai" onClick={autoGen} disabled={generating}>{generating ? <><Spinner /> 생성중</> : '✦ 자동 생성'}</Btn>
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <div className="pe-label">추가 컨텍스트 <span style={{ color: 'var(--text3)' }}>(선택 — 자동 생성 시 반영)</span></div>
          <input className="pe-input" value={form.extra} onChange={e => setForm(p => ({ ...p, extra: e.target.value }))} placeholder="예: BW 구조 고려, 경쟁사 대비 차별점 중심으로" />
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div className="pe-label" style={{ marginBottom: 0 }}>핵심 thesis</div>
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>직접 편집 가능</span>
          </div>
          <textarea className="pe-input" value={form.thesis} onChange={e => setForm(p => ({ ...p, thesis: e.target.value }))} placeholder="직접 입력하거나 '✦ 자동 생성'을 눌러보세요." />
        </div>

        <div className="pe-grid2" style={{ marginBottom: 10 }}>
          <div>
            <div className="pe-label">섹터 <span style={{ color: 'var(--text3)' }}>(자동 감지)</span></div>
            <select className="pe-input" value={form.sector} onChange={e => setForm(p => ({ ...p, sector: e.target.value }))}>
              <option value="">선택</option>
              {SECTORS.map(s => <option key={s}>{s}</option>)}
              <option>기타</option>
            </select>
          </div>
          <div>
            <div className="pe-label">단계</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {STAGES.map(s => (
                <button key={s} className={`pe-stage-btn${form.stage === s ? ' sel' : ''}`} onClick={() => setForm(p => ({ ...p, stage: s }))}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="pe-grid2" style={{ marginBottom: 12 }}>
          <div>
            <div className="pe-label">예상 EV (억원)</div>
            <input className="pe-input" value={form.ev} onChange={e => setForm(p => ({ ...p, ev: e.target.value }))} placeholder="예: 500~1,000" />
          </div>
          <div>
            <div className="pe-label">다음 액션</div>
            <input className="pe-input" value={form.nextAction} onChange={e => setForm(p => ({ ...p, nextAction: e.target.value }))} placeholder="예: IR 요청, 대표 미팅 세팅" />
          </div>
        </div>

        <div className="pe-save-box">
          <div className="pe-save-note">저장 즉시 Notion Idea Bank에 자동 싱크됨</div>
          <Btn onClick={save} disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
            {saving ? <><Spinner /> 저장 중...</> : '💾 저장 + Notion 싱크'}
          </Btn>
          {saveStatus && <div style={{ marginTop: 7, fontSize: 11, color: saveStatus.startsWith('오류') ? '#791F1F' : '#085041', textAlign: 'center' }}>{saveStatus}</div>}
        </div>
      </div>

      {/* 목록 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600 }}>저장된 아이디어 {ideas.length > 0 && <span style={{ color: 'var(--text3)', fontWeight: 400 }}>({ideas.length}개)</span>}</div>
        <Btn variant="ghost" style={{ padding: '4px 9px', fontSize: 11 }} onClick={loadIdeas}>↻ 새로고침</Btn>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 24, color: 'var(--text3)', fontSize: 13 }}><Spinner /> 불러오는 중...</div>}

      {!loading && ideas.length === 0 && (
        <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text3)', fontSize: 13, lineHeight: 1.8 }}>저장된 아이디어가 없습니다.<br />위 폼에서 첫 아이디어를 캡처해보세요.</div>
      )}

      {ideas.map(idea => (
        <div key={idea.id} className="pe-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{idea.title}</div>
            <a href={idea.url} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: 'var(--accent)', marginLeft: 8, flexShrink: 0, opacity: 0.7 }}>Notion ↗</a>
          </div>
          {idea.thesis && <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 9, whiteSpace: 'pre-wrap' }}>{idea.thesis}</div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 5 }}>
            <div className="pe-row" style={{ gap: 4 }}>
              {stageColors[idea.stage] && <Tag label={idea.stage} {...stageColors[idea.stage]} />}
              {idea.sector && <Tag label={idea.sector} bg="#E6F1FB" color="#0C447C" />}
              {idea.ev && <Tag label={`EV ${idea.ev}억`} bg="#FAEEDA" color="#633806" />}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{idea.date}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── DEAL PIPELINE ───────────────────────────────────────────────
const DEAL_STATUSES = ['On-going', 'Closed', 'Drop']
const DEAL_TYPES = ['PE', 'VC', 'M&A', 'IPO', 'Pre-IPO', '기타']
const SOURCING_TYPES = ['직접소싱', 'IB소개', 'LP소개', '네트워크', '기타']

function DealPipeline() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<string>('전체')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [form, setForm] = useState({
    name: '',
    status: 'On-going',
    amount: '',
    type: [] as string[],
    sourcingType: '',
    sourcer: '',
    date: new Date().toISOString().slice(0, 10),
  })

  const loadDeals = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/deals')
      const d = await r.json()
      setDeals(d.deals ?? [])
    } catch { }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadDeals() }, [loadDeals])

  const toggleType = (t: string) => setForm(p => ({
    ...p,
    type: p.type.includes(t) ? p.type.filter(x => x !== t) : [...p.type, t]
  }))

  const saveDeal = async () => {
    if (!form.name.trim()) { alert('딜 이름을 입력해주세요.'); return }
    setSaving(true); setSaveStatus('Notion에 저장 중...')
    try {
      const r = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          status: form.status,
          amount: form.amount ? Number(form.amount) * 100_000_000 : null,
          type: form.type,
          sourcingType: form.sourcingType,
          sourcer: form.sourcer,
          date: form.date,
        }),
      })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      setSaveStatus('✓ 저장 완료')
      setForm({ name: '', status: 'On-going', amount: '', type: [], sourcingType: '', sourcer: '', date: new Date().toISOString().slice(0, 10) })
      setShowForm(false)
      loadDeals()
      setTimeout(() => setSaveStatus(''), 3000)
    } catch (e: any) { setSaveStatus('오류: ' + e.message) }
    finally { setSaving(false) }
  }

  const statuses = ['전체', 'On-going', 'Closed', 'Drop']
  const filtered = filter === '전체' ? deals : deals.filter(d => d.status === filter)

  const ongoing = deals.filter(d => d.status === 'On-going').length
  const closed = deals.filter(d => d.status === 'Closed').length

  return (
    <div>
      {/* 요약 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
        {[['전체', deals.length, '#534AB7'], ['On-going', ongoing, '#1D9E75'], ['Closed', closed, '#888780']].map(([label, val, color]) => (
          <div key={label as string} style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: color as string }}>{val}</div>
          </div>
        ))}
      </div>

      {/* 필터 + 신규 추가 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="pe-row" style={{ gap: 5 }}>
          {statuses.map(s => (
            <div key={s} className={`pe-chip${filter === s ? ' sel' : ''}`} style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setFilter(s)}>{s}</div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Btn variant="ghost" style={{ padding: '4px 9px', fontSize: 11 }} onClick={loadDeals}>↻</Btn>
          <Btn variant="primary" style={{ padding: '5px 11px', fontSize: 11 }} onClick={() => setShowForm(v => !v)}>
            {showForm ? '✕ 닫기' : '+ 딜 추가'}
          </Btn>
        </div>
      </div>

      {/* 신규 딜 입력 폼 */}
      {showForm && (
        <div className="pe-card" style={{ marginBottom: 14, border: '0.5px solid rgba(83,74,183,0.35)' }}>
          <div className="pe-section" style={{ marginBottom: 11 }}>신규 딜 추가</div>

          {/* 딜 이름 */}
          <div style={{ marginBottom: 10 }}>
            <div className="pe-label">딜 이름 *</div>
            <input className="pe-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="예: ABC 물류, XYZ 바이오" />
          </div>

          {/* 상태 + 딜 구분 */}
          <div className="pe-grid2" style={{ marginBottom: 10 }}>
            <div>
              <div className="pe-label">딜 상태</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {DEAL_STATUSES.map(s => (
                  <button key={s} className={`pe-stage-btn${form.status === s ? ' sel' : ''}`} onClick={() => setForm(p => ({ ...p, status: s }))}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="pe-label">소싱구분</div>
              <select className="pe-input" value={form.sourcingType} onChange={e => setForm(p => ({ ...p, sourcingType: e.target.value }))}>
                <option value="">선택</option>
                {SOURCING_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* 딜 구분 멀티셀렉트 */}
          <div style={{ marginBottom: 10 }}>
            <div className="pe-label">딜 구분 (복수 선택 가능)</div>
            <div className="pe-row" style={{ gap: 5 }}>
              {DEAL_TYPES.map(t => (
                <div key={t} className={`pe-chip${form.type.includes(t) ? ' sel' : ''}`} style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => toggleType(t)}>{t}</div>
              ))}
            </div>
          </div>

          {/* 금액 + 소싱자 */}
          <div className="pe-grid2" style={{ marginBottom: 10 }}>
            <div>
              <div className="pe-label">딜 금액 (억원)</div>
              <input className="pe-input" type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="예: 500" />
            </div>
            <div>
              <div className="pe-label">소싱자</div>
              <input className="pe-input" value={form.sourcer} onChange={e => setForm(p => ({ ...p, sourcer: e.target.value }))} placeholder="예: 김OO" />
            </div>
          </div>

          {/* 날짜 */}
          <div style={{ marginBottom: 12 }}>
            <div className="pe-label">날짜</div>
            <input className="pe-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
          </div>

          <div className="pe-save-box">
            <div className="pe-save-note">저장 즉시 Notion Deal Sheet에 자동 싱크됨</div>
            <Btn onClick={saveDeal} disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
              {saving ? <><Spinner /> 저장 중...</> : '💾 저장 + Notion 싱크'}
            </Btn>
            {saveStatus && <div style={{ marginTop: 7, fontSize: 11, color: saveStatus.startsWith('오류') ? '#791F1F' : '#085041', textAlign: 'center' }}>{saveStatus}</div>}
          </div>
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: 24, color: 'var(--text3)', fontSize: 13 }}><Spinner /> 불러오는 중...</div>}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text3)', fontSize: 13, lineHeight: 1.8 }}>딜 없음.<br />위 '+ 딜 추가' 버튼으로 신규 딜을 등록하거나<br />Notion Deal Sheet에서 데이터를 확인해주세요.</div>
      )}

      {filtered.map(deal => (
        <DealCard key={deal.id} deal={deal} onUpdated={loadDeals} />
      ))}
    </div>
  )
}

function DealCard({ deal, onUpdated }: { deal: Deal; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')

  const buildFormFromDeal = (d: Deal) => ({
    name: d.name,
    status: d.status || 'On-going',
    amount: d.amount != null ? String(d.amount / 100_000_000) : '',
    type: d.type || [],
    sourcingType: d.sourcingType || '',
    sourcer: d.sourcer || '',
    date: d.date || new Date().toISOString().slice(0, 10),
    involvementSourcing: d.involvementSourcing || '',
    involvementValueUp: d.involvementValueUp || '',
    involvementExit: d.involvementExit || '',
  })

  const [form, setForm] = useState(() => buildFormFromDeal(deal))

  useEffect(() => { if (!editing) setForm(buildFormFromDeal(deal)) }, [deal, editing])

  const toggleType = (t: string) => setForm(p => ({
    ...p,
    type: p.type.includes(t) ? p.type.filter(x => x !== t) : [...p.type, t],
  }))

  const quickSetStatus = async (newStatus: string) => {
    if (newStatus === deal.status || statusUpdating) return
    setStatusUpdating(true)
    try {
      const r = await fetch('/api/deals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deal.id, status: newStatus }),
      })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      onUpdated()
    } catch (e: any) { alert('상태 변경 실패: ' + e.message) }
    finally { setStatusUpdating(false) }
  }

  const save = async () => {
    if (!form.name.trim()) { alert('딜 이름을 입력해주세요.'); return }
    setSaving(true); setSaveStatus('저장 중...')
    try {
      const r = await fetch('/api/deals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: deal.id,
          name: form.name,
          status: form.status,
          amount: form.amount ? Number(form.amount) * 100_000_000 : null,
          type: form.type,
          sourcingType: form.sourcingType,
          sourcer: form.sourcer,
          date: form.date,
          involvementSourcing: form.involvementSourcing,
          involvementValueUp: form.involvementValueUp,
          involvementExit: form.involvementExit,
        }),
      })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      setSaveStatus('✓ 저장 완료')
      setEditing(false)
      onUpdated()
      setTimeout(() => setSaveStatus(''), 2000)
    } catch (e: any) { setSaveStatus('오류: ' + e.message) }
    finally { setSaving(false) }
  }

  if (editing) {
    return (
      <div className="pe-card" style={{ border: '0.5px solid rgba(83,74,183,0.35)' }}>
        <div className="pe-section" style={{ marginBottom: 11 }}>딜 편집</div>

        <div style={{ marginBottom: 10 }}>
          <div className="pe-label">딜 이름 *</div>
          <input className="pe-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        </div>

        <div className="pe-grid2" style={{ marginBottom: 10 }}>
          <div>
            <div className="pe-label">딜 상태</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {DEAL_STATUSES.map(s => (
                <button key={s} className={`pe-stage-btn${form.status === s ? ' sel' : ''}`} onClick={() => setForm(p => ({ ...p, status: s }))}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="pe-label">소싱구분</div>
            <select className="pe-input" value={form.sourcingType} onChange={e => setForm(p => ({ ...p, sourcingType: e.target.value }))}>
              <option value="">선택</option>
              {SOURCING_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <div className="pe-label">딜 구분 (복수 선택 가능)</div>
          <div className="pe-row" style={{ gap: 5 }}>
            {DEAL_TYPES.map(t => (
              <div key={t} className={`pe-chip${form.type.includes(t) ? ' sel' : ''}`} style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => toggleType(t)}>{t}</div>
            ))}
          </div>
        </div>

        <div className="pe-grid2" style={{ marginBottom: 10 }}>
          <div>
            <div className="pe-label">딜 금액 (억원)</div>
            <input className="pe-input" type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
          </div>
          <div>
            <div className="pe-label">소싱자</div>
            <input className="pe-input" value={form.sourcer} onChange={e => setForm(p => ({ ...p, sourcer: e.target.value }))} />
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <div className="pe-label">날짜</div>
          <input className="pe-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
        </div>

        <div style={{ marginBottom: 10 }}>
          <div className="pe-label">Involvement — 소싱</div>
          <textarea className="pe-input" value={form.involvementSourcing} onChange={e => setForm(p => ({ ...p, involvementSourcing: e.target.value }))} placeholder="소싱 단계 관여 내용" />
        </div>
        <div style={{ marginBottom: 10 }}>
          <div className="pe-label">Involvement — Value-up</div>
          <textarea className="pe-input" value={form.involvementValueUp} onChange={e => setForm(p => ({ ...p, involvementValueUp: e.target.value }))} placeholder="Value-up 단계 관여 내용" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <div className="pe-label">Involvement — Exit</div>
          <textarea className="pe-input" value={form.involvementExit} onChange={e => setForm(p => ({ ...p, involvementExit: e.target.value }))} placeholder="Exit 단계 관여 내용" />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Btn onClick={save} disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
            {saving ? <><Spinner /> 저장 중...</> : '💾 저장'}
          </Btn>
          <Btn variant="ghost" onClick={() => { setEditing(false); setForm(buildFormFromDeal(deal)) }} disabled={saving}>취소</Btn>
        </div>
        {saveStatus && <div style={{ marginTop: 7, fontSize: 11, color: saveStatus.startsWith('오류') ? '#791F1F' : '#085041', textAlign: 'center' }}>{saveStatus}</div>}
      </div>
    )
  }

  return (
    <div className="pe-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 7 }}>
        <div style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{deal.name}</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0, marginLeft: 8 }}>
          <button onClick={() => setEditing(true)} style={{ fontSize: 11, color: 'var(--accent)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>✏️ 편집</button>
          <a href={deal.url} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: 'var(--accent)', opacity: 0.7 }}>Notion ↗</a>
        </div>
      </div>

      {/* 빠른 상태 변경 */}
      <div className="pe-row" style={{ gap: 4, marginBottom: 6 }}>
        {DEAL_STATUSES.map(s => {
          const active = deal.status === s
          return (
            <button
              key={s}
              onClick={() => quickSetStatus(s)}
              disabled={statusUpdating || active}
              style={{
                fontSize: 11, padding: '3px 9px', borderRadius: 99, cursor: active ? 'default' : 'pointer', fontFamily: 'inherit',
                border: `0.5px solid ${active ? (STATUS_COLORS[s] ?? '#444') : 'var(--border2)'}`,
                background: active ? (s === 'On-going' ? '#E1F5EE' : s === 'Drop' ? '#F1EFE8' : '#EEEDFE') : 'var(--bg2)',
                color: active ? (STATUS_COLORS[s] ?? '#444') : 'var(--text3)',
                fontWeight: active ? 600 : 400,
                opacity: statusUpdating ? 0.5 : 1,
              }}
            >{s}</button>
          )
        })}
        {statusUpdating && <Spinner />}
      </div>

      <div className="pe-row" style={{ gap: 4 }}>
        {deal.type.map(t => <Tag key={t} label={t} bg="#E6F1FB" color="#0C447C" />)}
        {deal.sourcingType && <Tag label={deal.sourcingType} bg="#FAEEDA" color="#633806" />}
        {deal.amount != null && <Tag label={formatAmountEok(deal.amount)} bg="#F1EFE8" color="#444441" />}
      </div>
      {(deal.sourcer || deal.date) && (
        <div style={{ marginTop: 7, fontSize: 11, color: 'var(--text3)' }}>
          {deal.sourcer && `소싱: ${deal.sourcer}`}{deal.sourcer && deal.date && ' · '}{deal.date}
        </div>
      )}
    </div>
  )
}
