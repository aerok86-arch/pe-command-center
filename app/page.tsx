'use client'
import { useState, useEffect, useCallback } from 'react'

// ── 타입 ──────────────────────────────────────────────────────
type Tab = 'radar' | 'ideas' | 'pipeline'
type NewsItem = { headline: string; summary: string; pe_implication: string; sentiment: string; sector_tags: string[]; urgency: string }
type Idea = { id: string; title: string; sector: string; stage: string; ev: string; thesis: string; nextAction: string; date: string; url: string }
type Deal = { id: string; name: string; status: string; amount: number | null; type: string[]; sourcingType: string; sourcer: string; date: string; url: string }

const SECTORS = ['AI반도체', 'AI에이전트', '바이오', '방산', '2차전지', '로보틱스', 'SaaS', '데이터센터', '소비재']
const STAGES = ['아이디어', '초기검토', '딜진행', '보류']
const STATUS_COLORS: Record<string, string> = { 'On-going': '#1D9E75', 'Drop': '#888780', 'Closed': '#534AB7' }
const SECTOR_COLORS: Record<string, string> = { 'AI반도체': '#3C3489', 'AI에이전트': '#712B13', '바이오': '#27500A', '방산': '#791F1F', '2차전지': '#633806', '로보틱스': '#085041', 'SaaS': '#0C447C', '데이터센터': '#444441', '소비재': '#3C3489' }

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
      `}</style>

      {/* 탑바 */}
      <div style={{ background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 50, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>PE Command Center</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>SV Investment</span>
      </div>

      {/* 탭 */}
      <div style={{ background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)', display: 'flex', padding: '0 16px', overflowX: 'auto', flexShrink: 0 }}>
        {([['radar', '📡 News Radar'], ['ideas', '💡 Idea Bank'], ['pipeline', '🔍 Deal Pipeline']] as [Tab, string][]).map(([key, label]) => (
          <div key={key} className={`pe-tab${tab === key ? ' active' : ''}`} onClick={() => setTab(key)}>{label}</div>
        ))}
      </div>

      {/* 컨텐츠 */}
      <div style={{ flex: 1, padding: 14, overflowY: 'auto' }}>
        {tab === 'radar' && <NewsRadar />}
        {tab === 'ideas' && <IdeaBank />}
        {tab === 'pipeline' && <DealPipeline />}
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
          <input className="pe-input" style={{ flex: 1 }} value={kwInput} onChange={e => setKwInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addKw()} placeholder="키워드 직접 입력 (엔터)" />
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
          <div style={{ fontSize: 12, color: '#3C3489', background: 'var(--accent-light)', borderRadius: 6, padding: '8px 10px', lineHeight: 1.6 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', marginBottom: 3 }}>PE 시사점</div>
            {n.pe_implication}
          </div>
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
function DealPipeline() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<string>('전체')

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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="pe-row" style={{ gap: 5 }}>
          {statuses.map(s => (
            <div key={s} className={`pe-chip${filter === s ? ' sel' : ''}`} style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setFilter(s)}>{s}</div>
          ))}
        </div>
        <Btn variant="ghost" style={{ padding: '4px 9px', fontSize: 11 }} onClick={loadDeals}>↻</Btn>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 24, color: 'var(--text3)', fontSize: 13 }}><Spinner /> 불러오는 중...</div>}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text3)', fontSize: 13, lineHeight: 1.8 }}>딜 없음.<br />Notion Deal Sheet에서 데이터를 확인해주세요.</div>
      )}

      {filtered.map(deal => (
        <div key={deal.id} className="pe-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 7 }}>
            <div style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{deal.name}</div>
            <a href={deal.url} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: 'var(--accent)', marginLeft: 8, flexShrink: 0, opacity: 0.7 }}>Notion ↗</a>
          </div>
          <div className="pe-row" style={{ gap: 4 }}>
            {deal.status && (
              <Tag label={deal.status} bg={deal.status === 'On-going' ? '#E1F5EE' : deal.status === 'Drop' ? '#F1EFE8' : '#EEEDFE'} color={STATUS_COLORS[deal.status] ?? '#444'} />
            )}
            {deal.type.map(t => <Tag key={t} label={t} bg="#E6F1FB" color="#0C447C" />)}
            {deal.sourcingType && <Tag label={deal.sourcingType} bg="#FAEEDA" color="#633806" />}
            {deal.amount && <Tag label={`${deal.amount.toLocaleString()}억`} bg="#F1EFE8" color="#444441" />}
          </div>
          {(deal.sourcer || deal.date) && (
            <div style={{ marginTop: 7, fontSize: 11, color: 'var(--text3)' }}>
              {deal.sourcer && `소싱: ${deal.sourcer}`}{deal.sourcer && deal.date && ' · '}{deal.date}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
