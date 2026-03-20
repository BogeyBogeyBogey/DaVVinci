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

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(''), 2000)
  }

  const phaseIndex = (p: MachinePhase) => {
    const order: MachinePhase[] = ['idle', 'scanning', 'filtered', 'selected', 'configuring', 'writing', 'script-done', 'social-generating', 'complete']
    return order.indexOf(p)
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

  // Pipeline steps for the visual header
  const steps = [
    { id: 'scan', label: 'SCAN', icon: '📡', phases: ['scanning'] },
    { id: 'filter', label: 'FILTER', icon: '🧠', phases: ['filtered'] },
    { id: 'select', label: 'KIES', icon: '🎯', phases: ['selected', 'configuring'] },
    { id: 'write', label: 'SCHRIJF', icon: '✍️', phases: ['writing'] },
    { id: 'script', label: 'SCRIPT', icon: '📜', phases: ['script-done'] },
    { id: 'social', label: 'SOCIAL', icon: '📱', phases: ['social-generating', 'complete'] },
  ]

  const isStepActive = (stepPhases: string[]) => stepPhases.includes(phase)
  const isStepDone = (stepPhases: string[], stepIndex: number) => {
    const maxDonePhase = steps.findIndex(s => s.phases.includes(phase))
    return stepIndex < maxDonePhase
  }

  return (
    <div className="min-h-screen bg-vv-navy-deep">
      {/* MACHINE HEADER — Pipeline visualisatie */}
      <header className="bg-vv-navy border-b-2 border-vv-yellow/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Logo + Reset */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={resetMachine} className="flex items-center gap-2 hover:opacity-80 transition group">
              <span className="text-3xl">🐷</span>
              <div>
                <h1 className="font-display font-bold text-lg text-white leading-none tracking-tight">
                  VROLIJKE <span className="text-vv-yellow">VREKKEN</span>
                </h1>
                <p className="text-[10px] text-vv-yellow/60 uppercase tracking-widest">Episode Machine</p>
              </div>
            </button>

            {phase !== 'idle' && (
              <button onClick={resetMachine} className="text-xs bg-white/10 hover:bg-white/20 text-white/60 px-3 py-1.5 rounded-lg transition">
                ↩ Reset
              </button>
            )}
          </div>

          {/* Pipeline stappen */}
          <div className="flex items-center gap-1">
            {steps.map((step, i) => {
              const active = isStepActive(step.phases)
              const done = isStepDone(step.phases, i)
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg flex-1 transition-all duration-500 ${
                    active ? 'bg-vv-yellow/20 border border-vv-yellow/50' :
                    done ? 'bg-vv-green/20 border border-vv-green/40' :
                    'bg-white/5 border border-white/10'
                  }`}>
                    <span className={`text-sm ${active ? 'animate-bounce' : ''}`}>
                      {done ? '✅' : step.icon}
                    </span>
                    <span className={`text-[11px] font-bold tracking-wide ${
                      active ? 'text-vv-yellow' : done ? 'text-vv-lime' : 'text-white/30'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-4 h-0.5 mx-0.5 flex-shrink-0 transition-all duration-500 ${
                      done ? 'bg-vv-lime' : active ? 'animate-pipe h-0.5' : 'bg-white/10'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </header>

      {/* ERROR BAR */}
      {error && (
        <div className="bg-vv-coral/20 border-b border-vv-coral/40 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="text-vv-coral text-sm">⚠️ {error}</span>
            <button onClick={() => setError('')} className="text-vv-coral/60 text-xs underline">Sluiten</button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* ═══════════ IDLE — Start de machine ═══════════ */}
        {phase === 'idle' && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
            <div className="text-8xl mb-6">🐷</div>
            <h2 className="font-display text-5xl font-extrabold text-white mb-3">
              De <span className="text-gradient">Episode Machine</span>
            </h2>
            <p className="text-white/40 text-lg max-w-lg mb-3">
              Van nieuws tot volledig uitgeschreven podcast + social content.
            </p>
            <p className="text-vv-yellow/50 text-sm mb-10 italic">
              "Besparen zonder je goede luim te verliezen"
            </p>
            <button
              onClick={scanNews}
              className="bg-vv-yellow hover:bg-vv-yellow-soft text-vv-navy-deep font-display font-extrabold text-xl px-12 py-5 rounded-2xl transition-all hover:scale-105 active:scale-95 pulse-glow"
            >
              ⚡ Start de machine
            </button>
            <p className="text-white/20 text-xs mt-4">Scant RSS feeds → AI filtert → klaar in ~15 sec</p>
          </div>
        )}

        {/* ═══════════ SCANNING ═══════════ */}
        {phase === 'scanning' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="text-7xl mb-4 animate-gear">⚙️</div>
            <h2 className="font-display text-2xl font-bold text-white mb-2">Machine draait...</h2>
            <p className="text-white/40 mb-1">RSS feeds scannen + AI filter actief</p>
            <p className="text-vv-yellow/40 text-sm">Zoekt het onverwachte, niet het voor de hand liggende</p>
            <div className="flex gap-1.5 mt-8">
              {[0,1,2,3,4,5,6].map(i => (
                <div key={i} className="w-2 h-6 bg-vv-yellow/30 rounded-full animate-pulse" style={{
                  animationDelay: `${i * 0.15}s`,
                  height: `${12 + Math.sin(i) * 8}px`
                }} />
              ))}
            </div>
          </div>
        )}

        {/* ═══════════ FILTERED — Onderwerpen kiezen ═══════════ */}
        {phase === 'filtered' && (
          <div>
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">
                  {newsItems.length} onderwerpen gevonden
                </h2>
                <p className="text-white/40 text-sm">{rawCount} artikelen gescand → AI filterde de beste eruit</p>
              </div>
              <button onClick={scanNews} className="text-xs bg-white/10 hover:bg-white/20 text-white/50 px-3 py-1.5 rounded-lg">
                🔄 Opnieuw scannen
              </button>
            </div>
            <div className="grid gap-3">
              {newsItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => selectItem(item)}
                  className="text-left bg-vv-navy hover:bg-vv-navy-light/30 border border-white/10 hover:border-vv-yellow/50 rounded-xl p-5 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-vv-yellow/10 flex items-center justify-center text-vv-yellow font-bold text-sm border border-vv-yellow/20">
                      {item.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/30 text-xs mb-1 truncate">📰 {item.headline}</p>
                      <h3 className="font-display text-lg font-bold text-white group-hover:text-vv-yellow transition mb-1.5 leading-snug">
                        {item.vv_vraag}
                      </h3>
                      <p className="text-vv-yellow/60 text-sm mb-1">💡 {item.twist}</p>
                      <p className="text-white/40 text-xs">🎯 {item.payoff}</p>
                    </div>
                    <span className="text-white/20 group-hover:text-vv-yellow transition text-xl flex-shrink-0">→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════ SELECTED / CONFIGURING ═══════════ */}
        {(phase === 'selected' || phase === 'configuring') && selectedItem && (
          <div className="max-w-2xl mx-auto">
            {/* Gekozen onderwerp */}
            <div className="bg-vv-navy border-2 border-vv-yellow/30 rounded-2xl p-6 mb-6">
              <p className="text-vv-yellow/50 text-xs font-bold uppercase tracking-wider mb-2">Gekozen onderwerp</p>
              <h2 className="font-display text-2xl font-bold text-white mb-2">{selectedItem.vv_vraag}</h2>
              <p className="text-white/40 text-sm">{selectedItem.twist}</p>
              <button onClick={() => setPhase('filtered')} className="text-xs text-white/30 hover:text-white/60 mt-3 underline">
                ← Ander onderwerp kiezen
              </button>
            </div>

            {/* Config */}
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Hosts</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'ewoud-kristof', name: 'Ewoud & Kristof', vibe: 'Humor + data + skepticisme', emoji: '🎙️' },
                    { id: 'ewoud-elke', name: 'Ewoud & Elke', vibe: 'Scherp + pragmatisch + direct', emoji: '🎯' },
                  ].map(h => (
                    <button
                      key={h.id}
                      onClick={() => setHosts(h.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        hosts === h.id
                          ? 'border-vv-yellow bg-vv-yellow/10 text-white'
                          : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'
                      }`}
                    >
                      <span className="text-xl">{h.emoji}</span>
                      <div className="font-bold mt-1">{h.name}</div>
                      <div className="text-xs opacity-50 mt-0.5">{h.vibe}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Extra sturing (optioneel)</label>
                <textarea
                  value={extraContext}
                  onChange={(e) => setExtraContext(e.target.value)}
                  placeholder="Bv. 'Focus op jonge gezinnen', 'Maak de vergelijking met Nederland', 'Neem de Belgische cijfers erbij'..."
                  className="w-full bg-vv-navy border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:border-vv-yellow focus:outline-none focus:ring-1 focus:ring-vv-yellow/50 resize-none h-24 text-sm"
                />
              </div>

              <button
                onClick={generateScript}
                className="w-full bg-vv-yellow hover:bg-vv-yellow-soft text-vv-navy-deep font-display font-extrabold text-lg px-8 py-4 rounded-xl transition-all hover:scale-[1.01] active:scale-95"
              >
                ⚡ Genereer Script
              </button>
              <p className="text-center text-white/20 text-xs">~30-60 seconden</p>
            </div>
          </div>
        )}

        {/* ═══════════ WRITING — Script wordt geschreven ═══════════ */}
        {phase === 'writing' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="text-7xl mb-4 animate-gear">✍️</div>
            <h2 className="font-display text-2xl font-bold text-white mb-2">Script wordt gesmeed...</h2>
            <p className="text-white/40 text-sm mb-1">Volledig uitgeschreven dialoog • 15-20 min</p>
            <p className="text-vv-yellow/40 text-xs">{selectedItem?.vv_vraag}</p>
            <div className="mt-8 w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-vv-yellow rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        )}

        {/* ═══════════ SCRIPT DONE ═══════════ */}
        {phase === 'script-done' && (
          <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">📜 Script klaar</h2>
                <p className="text-white/40 text-sm">{selectedItem?.vv_vraag}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(script, 'script')}
                  className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-lg transition"
                >
                  {copiedField === 'script' ? '✅ Gekopieerd!' : '📋 Kopieer script'}
                </button>
                <button
                  onClick={generateSocial}
                  className="bg-vv-yellow hover:bg-vv-yellow-soft text-vv-navy-deep font-bold text-sm px-5 py-2 rounded-lg transition"
                >
                  📱 Genereer Social →
                </button>
              </div>
            </div>

            <div className="bg-vv-navy border border-white/10 rounded-2xl p-6 md:p-8">
              <div className="max-w-none space-y-0.5">
                {script.split('\n').map((line, i) => {
                  if (line.match(/^(EWOUD|KRISTOF|ELKE):/)) {
                    const [name, ...rest] = line.split(':')
                    return (
                      <p key={i} className="mb-1.5 leading-relaxed">
                        <span className={`font-bold text-sm px-1.5 py-0.5 rounded mr-1 ${
                          name === 'EWOUD' ? 'bg-vv-lime/20 text-vv-lime' :
                          name === 'KRISTOF' ? 'bg-vv-yellow/20 text-vv-yellow' :
                          'bg-vv-coral/20 text-vv-coral'
                        }`}>{name}</span>
                        <span className="text-white/85">{rest.join(':')}</span>
                      </p>
                    )
                  }
                  if (line.includes('🎬 CLIP START') || line.includes('🎬 CLIP EINDE')) {
                    return (
                      <div key={i} className="clip-marker my-3 py-2 px-4 rounded-r-lg">
                        <span className="text-vv-coral font-bold text-sm">{line}</span>
                      </div>
                    )
                  }
                  if (line.includes('🎬')) {
                    return (
                      <div key={i} className="clip-marker my-3 py-2 px-4 rounded-r-lg">
                        <span className="text-vv-coral font-bold text-sm">{line}</span>
                      </div>
                    )
                  }
                  if (line.match(/^(#{1,3}\s|COLD OPEN|BLOK|RUBRIEK|OUTRO|TEASER|AFSLUITER|---)/i)) {
                    return (
                      <h3 key={i} className="font-display text-lg font-bold text-vv-yellow mt-8 mb-3 pb-2 border-b border-vv-yellow/20">
                        {line.replace(/^#+\s*/, '')}
                      </h3>
                    )
                  }
                  if (line.match(/^\(.*\)$/)) {
                    return <p key={i} className="text-white/25 italic text-xs ml-4 mb-1">{line}</p>
                  }
                  if (!line.trim()) return <div key={i} className="h-3" />
                  return <p key={i} className="text-white/60 mb-1.5 text-sm leading-relaxed">{line}</p>
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ SOCIAL GENERATING ═══════════ */}
        {phase === 'social-generating' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="text-7xl mb-4 animate-gear">📱</div>
            <h2 className="font-display text-2xl font-bold text-white mb-2">Social content genereren...</h2>
            <p className="text-white/40 text-sm">Instagram • TikTok • Facebook • Newsletter</p>
            <div className="mt-8 w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-vv-yellow rounded-full animate-pulse" style={{ width: '40%' }} />
            </div>
          </div>
        )}

        {/* ═══════════ COMPLETE — Alles klaar ═══════════ */}
        {phase === 'complete' && social && (
          <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">📱 Social Content</h2>
                <p className="text-white/40 text-sm">{selectedItem?.vv_vraag}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPhase('script-done')} className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-lg transition">
                  ← Script bekijken
                </button>
              </div>
            </div>

            <div className="grid gap-6">
              {/* IG Carousel */}
              <section className="bg-vv-navy border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-pink-400 flex items-center gap-2">
                    <span className="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-xs">📸</span>
                    Instagram Carousel
                  </h3>
                  <button onClick={() => copyToClipboard(
                    social.instagram_carousel.slides.map((s, i) => `Slide ${i+1}: ${s}`).join('\n\n') + '\n\nCaption:\n' + social.instagram_carousel.caption,
                    'ig-c'
                  )} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition text-white/50">
                    {copiedField === 'ig-c' ? '✅' : '📋'}
                  </button>
                </div>
                <div className="flex gap-2.5 overflow-x-auto pb-3 -mx-1 px-1">
                  {social.instagram_carousel.slides.map((slide, i) => (
                    <div key={i} className={`flex-shrink-0 w-44 h-44 rounded-xl p-3 flex flex-col justify-between border ${
                      i === 0 ? 'bg-gradient-to-br from-vv-yellow/20 to-vv-navy border-vv-yellow/30' :
                      i === social.instagram_carousel.slides.length - 1 ? 'bg-gradient-to-br from-pink-500/20 to-vv-navy border-pink-500/30' :
                      'bg-white/5 border-white/10'
                    }`}>
                      <span className="text-[10px] text-white/30 font-bold">SLIDE {i+1}</span>
                      <p className="text-xs text-white/80 leading-snug">{slide}</p>
                    </div>
                  ))}
                </div>
                <p className="text-white/40 text-xs mt-3">{social.instagram_carousel.caption}</p>
              </section>

              {/* IG Video Snippets — VOLLEDIG UITGESCHREVEN */}
              <section className="bg-vv-navy border border-white/10 rounded-2xl p-5">
                <h3 className="font-display font-bold text-vv-coral flex items-center gap-2 mb-4">
                  <span className="w-7 h-7 bg-vv-coral/20 rounded-lg flex items-center justify-center text-xs">🎬</span>
                  Video Snippets (Instagram + TikTok)
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {social.instagram_snippets.map((snippet, i) => (
                    <div key={i} className="bg-vv-navy-deep border border-vv-coral/20 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-vv-coral bg-vv-coral/10 px-2 py-0.5 rounded">CLIP {i+1}</span>
                        <button onClick={() => copyToClipboard(
                          `${snippet.dialoog}\n\nCaption: ${snippet.caption}\n${snippet.hashtags}`, `ig-s-${i}`
                        )} className="text-xs bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition text-white/50">
                          {copiedField === `ig-s-${i}` ? '✅' : '📋'}
                        </button>
                      </div>
                      {/* Uitgeschreven dialoog */}
                      <div className="bg-black/20 rounded-lg p-3 mb-3 space-y-1">
                        {snippet.dialoog.split('\\n').flatMap(l => l.split('\n')).map((line, j) => {
                          if (line.match(/^(EWOUD|KRISTOF|ELKE):/)) {
                            const [name, ...rest] = line.split(':')
                            return (
                              <p key={j} className="text-xs leading-relaxed">
                                <span className={`font-bold ${
                                  name === 'EWOUD' ? 'text-vv-lime' : name === 'KRISTOF' ? 'text-vv-yellow' : 'text-vv-coral'
                                }`}>{name}:</span>
                                <span className="text-white/70">{rest.join(':')}</span>
                              </p>
                            )
                          }
                          if (line.trim()) return <p key={j} className="text-xs text-white/50">{line}</p>
                          return null
                        })}
                      </div>
                      <p className="text-white/50 text-xs mb-1">{snippet.caption}</p>
                      <p className="text-pink-400/40 text-[10px]">{snippet.hashtags}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* TikTok */}
              <section className="bg-vv-navy border border-white/10 rounded-2xl p-5">
                <h3 className="font-display font-bold text-cyan-400 flex items-center gap-2 mb-4">
                  <span className="w-7 h-7 bg-cyan-500/20 rounded-lg flex items-center justify-center text-xs">🎵</span>
                  TikTok
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {social.tiktok.map((tt, i) => (
                    <div key={i} className="bg-vv-navy-deep border border-cyan-500/20 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">VIDEO {i+1}</span>
                        <button onClick={() => copyToClipboard(
                          `Hook: ${tt.hook_eerste_3_sec}\n\n${tt.dialoog}\n\nCaption: ${tt.caption}`, `tt-${i}`
                        )} className="text-xs bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition text-white/50">
                          {copiedField === `tt-${i}` ? '✅' : '📋'}
                        </button>
                      </div>
                      <p className="text-vv-yellow font-bold text-sm mb-2">⚡ &ldquo;{tt.hook_eerste_3_sec}&rdquo;</p>
                      <div className="bg-black/20 rounded-lg p-3 mb-3 space-y-1">
                        {tt.dialoog.split('\\n').flatMap(l => l.split('\n')).map((line, j) => {
                          if (line.match(/^(EWOUD|KRISTOF|ELKE):/)) {
                            const [name, ...rest] = line.split(':')
                            return (
                              <p key={j} className="text-xs leading-relaxed">
                                <span className={`font-bold ${
                                  name === 'EWOUD' ? 'text-vv-lime' : name === 'KRISTOF' ? 'text-vv-yellow' : 'text-vv-coral'
                                }`}>{name}:</span>
                                <span className="text-white/70">{rest.join(':')}</span>
                              </p>
                            )
                          }
                          if (line.trim()) return <p key={j} className="text-xs text-white/50">{line}</p>
                          return null
                        })}
                      </div>
                      <p className="text-white/50 text-xs">{tt.caption}</p>
                      <p className="text-cyan-400/40 text-[10px] mt-1">Format: {tt.format_suggestie}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Facebook */}
              <section className="bg-vv-navy border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-blue-400 flex items-center gap-2">
                    <span className="w-7 h-7 bg-blue-500/20 rounded-lg flex items-center justify-center text-xs">👍</span>
                    Facebook
                  </h3>
                  <button onClick={() => copyToClipboard(
                    social.facebook.post + '\n\n' + social.facebook.discussievraag, 'fb'
                  )} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition text-white/50">
                    {copiedField === 'fb' ? '✅' : '📋'}
                  </button>
                </div>
                <div className="bg-vv-navy-deep rounded-xl p-4 mb-3">
                  <p className="text-white/70 text-sm whitespace-pre-wrap leading-relaxed">{social.facebook.post}</p>
                </div>
                <p className="text-blue-400/70 text-sm font-medium">💬 {social.facebook.discussievraag}</p>
              </section>

              {/* Newsletter */}
              <section className="bg-vv-navy border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-vv-gold flex items-center gap-2">
                    <span className="w-7 h-7 bg-vv-gold/20 rounded-lg flex items-center justify-center text-xs">📧</span>
                    Newsletter
                  </h3>
                  <button onClick={() => copyToClipboard(
                    `Onderwerp: ${social.newsletter.onderwerp}\nPreview: ${social.newsletter.preview_tekst}\n\n${social.newsletter.body}\n\nTip: ${social.newsletter.tip}\n\nCTA: ${social.newsletter.cta_tekst}`, 'nl'
                  )} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition text-white/50">
                    {copiedField === 'nl' ? '✅' : '📋'}
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="bg-vv-navy-deep rounded-lg p-3">
                    <span className="text-[10px] text-white/30 uppercase">Onderwerp</span>
                    <p className="text-white font-bold text-sm">{social.newsletter.onderwerp}</p>
                  </div>
                  <div className="bg-vv-navy-deep rounded-lg p-3">
                    <span className="text-[10px] text-white/30 uppercase">Preview</span>
                    <p className="text-white/60 text-sm">{social.newsletter.preview_tekst}</p>
                  </div>
                  <div className="bg-vv-navy-deep rounded-lg p-3">
                    <p className="text-white/70 text-sm whitespace-pre-wrap">{social.newsletter.body}</p>
                  </div>
                  {social.newsletter.tip && (
                    <div className="bg-vv-yellow/10 border border-vv-yellow/20 rounded-lg p-3">
                      <span className="text-[10px] text-vv-yellow/60 uppercase">Tip teaser</span>
                      <p className="text-vv-yellow text-sm">{social.newsletter.tip}</p>
                    </div>
                  )}
                  <div className="bg-vv-gold/20 rounded-lg p-3 text-center">
                    <span className="text-vv-gold font-bold text-sm">{social.newsletter.cta_tekst}</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 py-4 mt-12">
        <p className="text-center text-white/15 text-xs">
          Vrolijke Vrekken Episode Machine — Het Nieuwsblad 🐷
        </p>
      </footer>
    </div>
  )
}
