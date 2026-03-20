'use client'

import { useState } from 'react'

type NewsItem = {
  headline: string
  vv_vraag: string
  twist: string
  payoff: string
  score: number
}

type SocialContent = {
  instagram_carousel: { slides: string[]; caption: string }
  instagram_snippets: { dialoog: string; caption: string; hashtags: string }[]
  tiktok: { hook_eerste_3_sec: string; dialoog: string; caption: string; format_suggestie: string }[]
  facebook: { post: string; discussievraag: string }
  newsletter: { onderwerp: string; preview_tekst: string; body: string; tip: string; cta_tekst: string }
}

type MachinePhase = 'idle' | 'scanning' | 'filtered' | 'selected' | 'configuring' | 'writing' | 'script-done' | 'social-generating' | 'complete'

export default function Home() {
  const [phase, setPhase] = useState<MachinePhase>('idle')
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null)
  const [hosts, setHosts] = useState<string>('ewoud-kristof')
  const [extraContext, setExtraContext] = useState('')
  const [script, setScript] = useState('')
  const [social, setSocial] = useState<SocialContent | null>(null)
  const [error, setError] = useState('')
  const [copiedField, setCopiedField] = useState('')
  const [rawCount, setRawCount] = useState(0)
  const [socialTab, setSocialTab] = useState<'ig' | 'video' | 'tiktok' | 'fb' | 'newsletter'>('ig')

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(''), 2000)
  }

  const scanNews = async () => {
    setPhase('scanning')
    setError('')
    try {
      const res = await fetch('/api/scrape-news', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setNewsItems(data.items || [])
        setRawCount(data.rawCount || 0)
        setPhase('filtered')
      } else {
        setError(data.error || 'Scannen mislukt')
        setPhase('idle')
      }
    } catch (e: any) {
      setError(e.message)
      setPhase('idle')
    }
  }

  const selectItem = (item: NewsItem) => {
    setSelectedItem(item)
    setPhase('selected')
  }

  const generateScript = async () => {
    if (!selectedItem) return
    setPhase('writing')
    setError('')
    try {
      const res = await fetch('/api/generate-episode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: selectedItem.headline,
          hook: selectedItem.vv_vraag,
          hosts,
          extraContext,
          generateType: 'script',
        }),
      })
      const data = await res.json()
      if (data.success) {
        setScript(data.script)
        setPhase('script-done')
      } else {
        setError(data.error || 'Scriptgeneratie mislukt')
        setPhase('selected')
      }
    } catch (e: any) {
      setError(e.message)
      setPhase('selected')
    }
  }

  const generateSocial = async () => {
    if (!selectedItem || !script) return
    setPhase('social-generating')
    try {
      const res = await fetch('/api/generate-episode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: selectedItem.headline,
          hook: selectedItem.vv_vraag,
          script,
          generateType: 'social',
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSocial(data.social)
        setPhase('complete')
      } else {
        setError(data.error || 'Social generatie mislukt')
        setPhase('script-done')
      }
    } catch (e: any) {
      setError(e.message)
      setPhase('script-done')
    }
  }

  const resetMachine = () => {
    setPhase('idle')
    setNewsItems([])
    setSelectedItem(null)
    setScript('')
    setSocial(null)
    setError('')
    setExtraContext('')
  }

  const steps = [
    { id: 'scan', label: 'Scan', icon: '📡', phases: ['scanning'] },
    { id: 'filter', label: 'Filter', icon: '🧠', phases: ['filtered'] },
    { id: 'select', label: 'Kies', icon: '🎯', phases: ['selected', 'configuring'] },
    { id: 'write', label: 'Schrijf', icon: '✍️', phases: ['writing'] },
    { id: 'script', label: 'Script', icon: '📜', phases: ['script-done'] },
    { id: 'social', label: 'Social', icon: '📱', phases: ['social-generating', 'complete'] },
  ]

  const isStepActive = (stepPhases: string[]) => stepPhases.includes(phase)
  const isStepDone = (stepPhases: string[], stepIndex: number) => {
    const maxDonePhase = steps.findIndex(s => s.phases.includes(phase))
    return stepIndex < maxDonePhase
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#0A1628' }}>
      {/* Ambient background orbs */}
      <div className="orb orb-yellow" style={{ top: '-10%', left: '-5%' }} />
      <div className="orb orb-pink" style={{ top: '40%', right: '-8%' }} />
      <div className="orb orb-blue" style={{ bottom: '-15%', left: '30%' }} />

      {/* ===== NAVIGATION ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-glass border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <button onClick={resetMachine} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-lg shadow-lg shadow-yellow-500/20 group-hover:scale-105 transition">
              🐷
            </div>
            <div>
              <h1 className="font-['Space_Grotesk'] font-bold text-[15px] text-white leading-none tracking-tight">
                VROLIJKE <span className="text-yellow-400">VREKKEN</span>
              </h1>
              <p className="text-[10px] text-white/30 font-medium tracking-[0.2em] uppercase">Episode Machine</p>
            </div>
          </button>

          {/* Pipeline mini-dots (nav) */}
          {phase !== 'idle' && (
            <div className="flex items-center gap-1.5">
              {steps.map((step, i) => {
                const active = isStepActive(step.phases)
                const done = isStepDone(step.phases, i)
                return (
                  <div key={step.id} className="flex items-center gap-1.5">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold transition-all duration-500 ${
                      active ? 'bg-yellow-400/15 text-yellow-400 ring-1 ring-yellow-400/30' :
                      done ? 'bg-emerald-400/10 text-emerald-400' :
                      'text-white/20'
                    }`}>
                      <span className={`text-xs ${active ? 'animate-pulse' : ''}`}>{done ? '✓' : step.icon}</span>
                      <span className="hidden sm:inline">{step.label}</span>
                    </div>
                    {i < steps.length - 1 && (
                      <div className={`w-3 h-px ${done ? 'bg-emerald-400/40' : active ? 'bg-yellow-400/30' : 'bg-white/[0.06]'}`} />
                    )}
                  </div>
                )
              })}
              <button onClick={resetMachine} className="ml-3 text-[10px] text-white/20 hover:text-white/50 transition px-2 py-1 rounded-full hover:bg-white/5">
                Reset
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Error toast */}
      {error && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-red-500/10 border border-red-500/30 backdrop-blur-xl rounded-2xl px-6 py-3 flex items-center gap-3 reveal-scale max-w-lg">
          <span className="text-red-400 text-sm flex-1">{error}</span>
          <button onClick={() => setError('')} className="text-red-400/50 hover:text-red-400 text-xs">✕</button>
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main className="relative z-10 pt-20 min-h-screen">

        {/* ═══════════ IDLE ═══════════ */}
        {phase === 'idle' && (
          <div className="flex flex-col items-center justify-center min-h-[85vh] text-center px-6">
            <div className="animate-float mb-8">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center text-5xl shadow-2xl shadow-yellow-500/20">
                🐷
              </div>
            </div>
            <h2 className="font-['Space_Grotesk'] text-5xl sm:text-6xl md:text-7xl font-extrabold text-white mb-4 tracking-tight leading-[1.05]">
              Episode<br />
              <span className="text-gradient">Machine</span>
            </h2>
            <p className="text-white/35 text-lg max-w-md mb-2 leading-relaxed">
              Van nieuws tot volledig uitgeschreven podcast + social content.
            </p>
            <p className="text-yellow-400/30 text-sm mb-12 italic font-medium">
              "Besparen zonder je goede luim te verliezen"
            </p>
            <button
              onClick={scanNews}
              className="group relative bg-gradient-to-r from-yellow-400 to-yellow-500 text-[#0A1628] font-['Space_Grotesk'] font-extrabold text-xl px-14 py-5 rounded-2xl transition-all hover:scale-[1.03] active:scale-95 pulse-glow"
            >
              <span className="relative z-10 flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start de machine
              </span>
            </button>
            <div className="flex items-center gap-6 mt-10 text-white/15 text-xs">
              <span className="flex items-center gap-1.5">📡 10 RSS feeds</span>
              <span className="w-1 h-1 rounded-full bg-white/10" />
              <span className="flex items-center gap-1.5">🧠 AI filter</span>
              <span className="w-1 h-1 rounded-full bg-white/10" />
              <span className="flex items-center gap-1.5">⚡ ~15 sec</span>
            </div>
          </div>
        )}

        {/* ═══════════ SCANNING ═══════════ */}
        {phase === 'scanning' && (
          <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
            <div className="w-20 h-20 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center mb-8">
              <span className="text-4xl animate-gear">⚙️</span>
            </div>
            <h2 className="font-['Space_Grotesk'] text-3xl font-bold text-white mb-3">Machine draait</h2>
            <p className="text-white/30 text-sm mb-1">RSS feeds scannen + AI filter actief</p>
            <p className="text-yellow-400/25 text-xs mb-10">Zoekt het onverwachte, niet het voor de hand liggende</p>
            <div className="w-64 h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="w-1/3 h-full bg-gradient-to-r from-yellow-400 to-yellow-400/0 rounded-full animate-progress" />
            </div>
            <div className="flex gap-2 mt-8">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        )}

        {/* ═══════════ FILTERED ═══════════ */}
        {phase === 'filtered' && (
          <div className="max-w-4xl mx-auto px-6 py-8 reveal-up">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">{rawCount} artikelen gescand</span>
                </div>
                <h2 className="font-['Space_Grotesk'] text-3xl font-bold text-white">
                  {newsItems.length} onderwerpen
                </h2>
                <p className="text-white/25 text-sm mt-1">Kies een onderwerp om er een aflevering van te maken</p>
              </div>
              <button onClick={scanNews} className="text-xs text-white/20 hover:text-white/50 px-3 py-1.5 rounded-lg hover:bg-white/5 transition border border-white/[0.06]">
                Opnieuw scannen
              </button>
            </div>

            <div className="space-y-3">
              {newsItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => selectItem(item)}
                  className="news-card w-full text-left bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-yellow-400/30 rounded-2xl p-5 group"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="score-ring flex-shrink-0 w-12 h-12" style={{ '--score': `${item.score * 10}` } as React.CSSProperties}>
                      <div className="score-ring-inner bg-[#0A1628]">
                        <span className="text-yellow-400 font-['Space_Grotesk'] font-bold text-sm">{item.score}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/20 text-xs mb-1.5 truncate">{item.headline}</p>
                      <h3 className="font-['Space_Grotesk'] text-lg font-bold text-white group-hover:text-yellow-400 transition leading-snug mb-2">
                        {item.vv_vraag}
                      </h3>
                      <div className="flex gap-4 text-xs">
                        <span className="text-yellow-400/50">💡 {item.twist}</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/[0.03] group-hover:bg-yellow-400/10 flex items-center justify-center transition">
                      <svg className="w-5 h-5 text-white/15 group-hover:text-yellow-400 transition" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════ SELECTED ═══════════ */}
        {(phase === 'selected' || phase === 'configuring') && selectedItem && (
          <div className="max-w-2xl mx-auto px-6 py-8 reveal-up">
            {/* Selected topic card */}
            <div className="relative bg-gradient-to-br from-yellow-400/[0.08] to-transparent border border-yellow-400/20 rounded-3xl p-8 mb-8 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
              <button onClick={() => setPhase('filtered')} className="text-xs text-white/20 hover:text-white/50 mb-4 flex items-center gap-1 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Ander onderwerp
              </button>
              <div className="text-yellow-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Gekozen onderwerp</div>
              <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-white mb-2 leading-tight">{selectedItem.vv_vraag}</h2>
              <p className="text-white/30 text-sm">{selectedItem.twist}</p>
            </div>

            {/* Config */}
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-white/30 uppercase tracking-[0.15em] mb-3">Hosts</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'ewoud-kristof', name: 'Ewoud & Kristof', vibe: 'Humor + data + skepticisme', emoji: '🎙️' },
                    { id: 'ewoud-elke', name: 'Ewoud & Elke', vibe: 'Scherp + pragmatisch + direct', emoji: '🎯' },
                  ].map(h => (
                    <button
                      key={h.id}
                      onClick={() => setHosts(h.id)}
                      className={`p-5 rounded-2xl border transition-all text-left ${
                        hosts === h.id
                          ? 'border-yellow-400/40 bg-yellow-400/[0.06] ring-1 ring-yellow-400/20'
                          : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10'
                      }`}
                    >
                      <span className="text-2xl">{h.emoji}</span>
                      <div className={`font-['Space_Grotesk'] font-bold mt-2 ${hosts === h.id ? 'text-yellow-400' : 'text-white/60'}`}>
                        {h.name}
                      </div>
                      <div className="text-xs text-white/20 mt-0.5">{h.vibe}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-white/30 uppercase tracking-[0.15em] mb-2">Extra sturing <span className="text-white/15">(optioneel)</span></label>
                <textarea
                  value={extraContext}
                  onChange={(e) => setExtraContext(e.target.value)}
                  placeholder="Bv. 'Focus op jonge gezinnen', 'Vergelijk met Nederland', 'Neem Belgische cijfers'..."
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-white placeholder-white/15 focus:border-yellow-400/30 focus:outline-none focus:ring-1 focus:ring-yellow-400/20 resize-none h-24 text-sm transition"
                />
              </div>

              <button
                onClick={generateScript}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-[#0A1628] font-['Space_Grotesk'] font-extrabold text-lg px-8 py-4 rounded-2xl transition-all hover:scale-[1.01] active:scale-95 shadow-lg shadow-yellow-400/20"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Genereer Script
                </span>
              </button>
              <p className="text-center text-white/15 text-xs">~30-60 seconden</p>
            </div>
          </div>
        )}

        {/* ═══════════ WRITING ═══════════ */}
        {phase === 'writing' && (
          <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
            <div className="w-20 h-20 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center mb-8">
              <span className="text-4xl animate-gear">✍️</span>
            </div>
            <h2 className="font-['Space_Grotesk'] text-3xl font-bold text-white mb-3">Script wordt gesmeed</h2>
            <p className="text-white/30 text-sm mb-1">Volledig uitgeschreven dialoog • 15-20 min</p>
            <p className="text-yellow-400/25 text-xs mb-10 max-w-md">{selectedItem?.vv_vraag}</p>
            <div className="w-64 h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="w-1/3 h-full bg-gradient-to-r from-yellow-400 to-yellow-400/0 rounded-full animate-progress" />
            </div>
          </div>
        )}

        {/* ═══════════ SCRIPT DONE ═══════════ */}
        {phase === 'script-done' && (
          <div className="max-w-4xl mx-auto px-6 py-8 reveal-up">
            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
              <div>
                <div className="text-emerald-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Script klaar</div>
                <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-white">{selectedItem?.vv_vraag}</h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(script, 'script')}
                  className="text-sm px-4 py-2.5 rounded-xl border border-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.04] transition flex items-center gap-2"
                >
                  {copiedField === 'script' ? (
                    <><span className="text-emerald-400">✓</span> Gekopieerd</>
                  ) : (
                    <>📋 Kopieer</>
                  )}
                </button>
                <button
                  onClick={generateSocial}
                  className="text-sm px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 text-[#0A1628] font-bold transition hover:scale-[1.02] active:scale-95 shadow-lg shadow-yellow-400/20 flex items-center gap-2"
                >
                  📱 Genereer Social
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6 md:p-10">
              <div className="space-y-0.5">
                {script.split('\n').map((line, i) => {
                  if (line.match(/^(EWOUD|KRISTOF|ELKE):/)) {
                    const [name, ...rest] = line.split(':')
                    return (
                      <p key={i} className="mb-2 leading-relaxed">
                        <span className={`inline-block font-['Space_Grotesk'] font-bold text-[11px] px-2 py-0.5 rounded-md mr-2 uppercase tracking-wider ${
                          name === 'EWOUD' ? 'bg-emerald-400/15 text-emerald-400' :
                          name === 'KRISTOF' ? 'bg-yellow-400/15 text-yellow-400' :
                          'bg-pink-400/15 text-pink-400'
                        }`}>{name}</span>
                        <span className="text-white/80 text-[15px]">{rest.join(':')}</span>
                      </p>
                    )
                  }
                  if (line.includes('🎬')) {
                    return (
                      <div key={i} className="clip-marker my-4 py-2.5 px-5 rounded-r-xl">
                        <span className="text-orange-400 font-['Space_Grotesk'] font-bold text-sm">{line}</span>
                      </div>
                    )
                  }
                  if (line.match(/^(#{1,3}\s|COLD OPEN|BLOK|RUBRIEK|OUTRO|TEASER|AFSLUITER|---)/i)) {
                    return (
                      <h3 key={i} className="font-['Space_Grotesk'] text-lg font-bold text-yellow-400 mt-10 mb-4 pb-3 border-b border-yellow-400/10">
                        {line.replace(/^#+\s*/, '')}
                      </h3>
                    )
                  }
                  if (line.match(/^\(.*\)$/)) {
                    return <p key={i} className="text-white/15 italic text-xs ml-6 mb-1">{line}</p>
                  }
                  if (!line.trim()) return <div key={i} className="h-4" />
                  return <p key={i} className="text-white/50 mb-1.5 text-sm leading-relaxed">{line}</p>
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ SOCIAL GENERATING ═══════════ */}
        {phase === 'social-generating' && (
          <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
            <div className="w-20 h-20 rounded-2xl bg-pink-400/10 border border-pink-400/20 flex items-center justify-center mb-8">
              <span className="text-4xl animate-gear">📱</span>
            </div>
            <h2 className="font-['Space_Grotesk'] text-3xl font-bold text-white mb-3">Social content genereren</h2>
            <p className="text-white/30 text-sm">Instagram • TikTok • Facebook • Newsletter</p>
            <div className="w-64 h-1 bg-white/[0.06] rounded-full overflow-hidden mt-10">
              <div className="w-1/3 h-full bg-gradient-to-r from-pink-400 to-pink-400/0 rounded-full animate-progress" />
            </div>
          </div>
        )}

        {/* ═══════════ COMPLETE ═══════════ */}
        {phase === 'complete' && social && (
          <div className="max-w-4xl mx-auto px-6 py-8 reveal-up">
            <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
              <div>
                <div className="text-emerald-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Alles klaar</div>
                <h2 className="font-['Space_Grotesk'] text-2xl font-bold text-white">{selectedItem?.vv_vraag}</h2>
              </div>
              <button onClick={() => setPhase('script-done')} className="text-xs text-white/20 hover:text-white/50 px-3 py-1.5 rounded-lg hover:bg-white/5 transition border border-white/[0.06] flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Script bekijken
              </button>
            </div>

            {/* Tab navigation */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {[
                { id: 'ig' as const, label: 'Carousel', icon: '📸', color: 'from-purple-500 to-pink-500' },
                { id: 'video' as const, label: 'Video Clips', icon: '🎬', color: 'from-orange-500 to-red-500' },
                { id: 'tiktok' as const, label: 'TikTok', icon: '🎵', color: 'from-cyan-500 to-blue-500' },
                { id: 'fb' as const, label: 'Facebook', icon: '👍', color: 'from-blue-500 to-blue-600' },
                { id: 'newsletter' as const, label: 'Newsletter', icon: '📧', color: 'from-yellow-500 to-orange-500' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSocialTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border ${
                    socialTab === tab.id
                      ? 'tab-active'
                      : 'border-white/[0.06] text-white/30 hover:text-white/50 hover:bg-white/[0.03]'
                  }`}
                >
                  <span>{tab.icon}</span>{tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="reveal-scale">
              {/* IG Carousel */}
              {socialTab === 'ig' && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-['Space_Grotesk'] font-bold text-pink-400">Instagram Carousel</h3>
                    <button onClick={() => copyToClipboard(
                      social.instagram_carousel.slides.map((s, i) => `Slide ${i+1}: ${s}`).join('\n\n') + '\n\nCaption:\n' + social.instagram_carousel.caption,
                      'ig-c'
                    )} className="text-xs text-white/20 hover:text-white/50 px-3 py-1 rounded-lg hover:bg-white/5 transition">
                      {copiedField === 'ig-c' ? '✓ Gekopieerd' : '📋 Kopieer'}
                    </button>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-4">
                    {social.instagram_carousel.slides.map((slide, i) => (
                      <div key={i} className={`flex-shrink-0 w-48 h-48 rounded-2xl p-4 flex flex-col justify-between border transition-all hover:scale-[1.02] ${
                        i === 0 ? 'bg-gradient-to-br from-yellow-400/10 to-transparent border-yellow-400/20' :
                        i === social.instagram_carousel.slides.length - 1 ? 'bg-gradient-to-br from-pink-400/10 to-transparent border-pink-400/20' :
                        'bg-white/[0.03] border-white/[0.06]'
                      }`}>
                        <span className="text-[10px] text-white/20 font-bold font-['Space_Grotesk'] tracking-wider">SLIDE {i+1}</span>
                        <p className="text-xs text-white/70 leading-relaxed">{slide}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-white/25 text-xs mt-4 leading-relaxed">{social.instagram_carousel.caption}</p>
                </div>
              )}

              {/* Video Clips */}
              {socialTab === 'video' && (
                <div className="grid md:grid-cols-2 gap-4">
                  {social.instagram_snippets.map((snippet, i) => (
                    <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-orange-400 bg-orange-400/10 px-3 py-1 rounded-full font-['Space_Grotesk']">CLIP {i+1}</span>
                        <button onClick={() => copyToClipboard(
                          `${snippet.dialoog}\n\nCaption: ${snippet.caption}\n${snippet.hashtags}`, `ig-s-${i}`
                        )} className="text-xs text-white/20 hover:text-white/50 transition">
                          {copiedField === `ig-s-${i}` ? '✓' : '📋'}
                        </button>
                      </div>
                      <div className="bg-black/30 rounded-2xl p-4 mb-4 space-y-1.5">
                        {snippet.dialoog.split('\\n').flatMap(l => l.split('\n')).map((line, j) => {
                          if (line.match(/^(EWOUD|KRISTOF|ELKE):/)) {
                            const [name, ...rest] = line.split(':')
                            return (
                              <p key={j} className="text-xs leading-relaxed">
                                <span className={`font-bold ${
                                  name === 'EWOUD' ? 'text-emerald-400' : name === 'KRISTOF' ? 'text-yellow-400' : 'text-pink-400'
                                }`}>{name}:</span>
                                <span className="text-white/60 ml-1">{rest.join(':')}</span>
                              </p>
                            )
                          }
                          if (line.trim()) return <p key={j} className="text-xs text-white/30">{line}</p>
                          return null
                        })}
                      </div>
                      <p className="text-white/35 text-xs mb-1">{snippet.caption}</p>
                      <p className="text-pink-400/30 text-[10px]">{snippet.hashtags}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* TikTok */}
              {socialTab === 'tiktok' && (
                <div className="grid md:grid-cols-2 gap-4">
                  {social.tiktok.map((tt, i) => (
                    <div key={i} className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full font-['Space_Grotesk']">VIDEO {i+1}</span>
                        <button onClick={() => copyToClipboard(
                          `Hook: ${tt.hook_eerste_3_sec}\n\n${tt.dialoog}\n\nCaption: ${tt.caption}`, `tt-${i}`
                        )} className="text-xs text-white/20 hover:text-white/50 transition">
                          {copiedField === `tt-${i}` ? '✓' : '📋'}
                        </button>
                      </div>
                      <div className="bg-yellow-400/[0.06] border border-yellow-400/10 rounded-xl px-4 py-2.5 mb-4">
                        <span className="text-[10px] text-yellow-400/50 uppercase font-bold">Hook — eerste 3 sec</span>
                        <p className="text-yellow-400 font-bold text-sm mt-0.5">"{tt.hook_eerste_3_sec}"</p>
                      </div>
                      <div className="bg-black/30 rounded-2xl p-4 mb-4 space-y-1.5">
                        {tt.dialoog.split('\\n').flatMap(l => l.split('\n')).map((line, j) => {
                          if (line.match(/^(EWOUD|KRISTOF|ELKE):/)) {
                            const [name, ...rest] = line.split(':')
                            return (
                              <p key={j} className="text-xs leading-relaxed">
                                <span className={`font-bold ${
                                  name === 'EWOUD' ? 'text-emerald-400' : name === 'KRISTOF' ? 'text-yellow-400' : 'text-pink-400'
                                }`}>{name}:</span>
                                <span className="text-white/60 ml-1">{rest.join(':')}</span>
                              </p>
                            )
                          }
                          if (line.trim()) return <p key={j} className="text-xs text-white/30">{line}</p>
                          return null
                        })}
                      </div>
                      <p className="text-white/35 text-xs">{tt.caption}</p>
                      <p className="text-cyan-400/25 text-[10px] mt-1">Format: {tt.format_suggestie}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Facebook */}
              {socialTab === 'fb' && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-['Space_Grotesk'] font-bold text-blue-400">Facebook Post</h3>
                    <button onClick={() => copyToClipboard(
                      social.facebook.post + '\n\n' + social.facebook.discussievraag, 'fb'
                    )} className="text-xs text-white/20 hover:text-white/50 transition">
                      {copiedField === 'fb' ? '✓ Gekopieerd' : '📋 Kopieer'}
                    </button>
                  </div>
                  <div className="bg-black/20 rounded-2xl p-5 mb-4">
                    <p className="text-white/60 text-sm whitespace-pre-wrap leading-relaxed">{social.facebook.post}</p>
                  </div>
                  <div className="bg-blue-400/[0.06] border border-blue-400/10 rounded-xl px-4 py-3">
                    <span className="text-[10px] text-blue-400/50 uppercase font-bold">Discussievraag</span>
                    <p className="text-blue-400 text-sm font-medium mt-0.5">{social.facebook.discussievraag}</p>
                  </div>
                </div>
              )}

              {/* Newsletter */}
              {socialTab === 'newsletter' && (
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-['Space_Grotesk'] font-bold text-yellow-500">Newsletter Blok</h3>
                    <button onClick={() => copyToClipboard(
                      `Onderwerp: ${social.newsletter.onderwerp}\nPreview: ${social.newsletter.preview_tekst}\n\n${social.newsletter.body}\n\nTip: ${social.newsletter.tip}\n\nCTA: ${social.newsletter.cta_tekst}`, 'nl'
                    )} className="text-xs text-white/20 hover:text-white/50 transition">
                      {copiedField === 'nl' ? '✓ Gekopieerd' : '📋 Kopieer'}
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-black/20 rounded-xl p-4">
                      <span className="text-[10px] text-white/20 uppercase font-bold">Onderwerp</span>
                      <p className="text-white font-bold text-sm mt-0.5">{social.newsletter.onderwerp}</p>
                    </div>
                    <div className="bg-black/20 rounded-xl p-4">
                      <span className="text-[10px] text-white/20 uppercase font-bold">Preview tekst</span>
                      <p className="text-white/50 text-sm mt-0.5">{social.newsletter.preview_tekst}</p>
                    </div>
                    <div className="bg-black/20 rounded-xl p-4">
                      <p className="text-white/60 text-sm whitespace-pre-wrap leading-relaxed">{social.newsletter.body}</p>
                    </div>
                    {social.newsletter.tip && (
                      <div className="bg-yellow-400/[0.06] border border-yellow-400/10 rounded-xl p-4">
                        <span className="text-[10px] text-yellow-400/50 uppercase font-bold">Tip teaser</span>
                        <p className="text-yellow-400 text-sm mt-0.5">{social.newsletter.tip}</p>
                      </div>
                    )}
                    <div className="bg-gradient-to-r from-yellow-400/10 to-orange-400/10 border border-yellow-400/20 rounded-xl p-4 text-center">
                      <span className="text-yellow-400 font-bold text-sm">{social.newsletter.cta_tekst}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.04] py-5 mt-16">
        <p className="text-center text-white/10 text-xs font-medium">
          Vrolijke Vrekken Episode Machine — Het Nieuwsblad
        </p>
      </footer>
    </div>
  )
}
