'use client'

import { useState, useEffect, useRef } from 'react'

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

// Lottie animation URLs
const LOTTIE = {
  radar: 'https://assets-v2.lottiefiles.com/a/0132d994-1171-11ee-b80a-8f713c03366d/Pa46GwVovH.lottie',
  brain: 'https://assets-v2.lottiefiles.com/a/d5543bc0-a8a5-11ee-a44f-7bc5f99a0a60/r9bSO6NIOd.lottie',
  pen: 'https://assets-v2.lottiefiles.com/a/7a754088-1187-11ee-96ce-1b80a1a80dd1/npZCl6daoz.lottie',
  mic: 'https://assets-v2.lottiefiles.com/a/cc00c3fe-116a-11ee-9b35-e341d01cbb17/DX0bmmPPPN.lottie',
  megaphone: 'https://assets-v2.lottiefiles.com/a/5cd7216c-1174-11ee-915b-8bf3348ea891/MUxKPELVQD.lottie',
  gears: 'https://assets-v2.lottiefiles.com/a/d5f0cecc-1151-11ee-b2d8-8f9b80bf914a/o4sT8bFzny.lottie',
}

function LottiePlayer({ src, className = '', style = {} }: { src: string; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Load dotlottie player web component
    if (typeof window !== 'undefined' && !customElements.get('dotlottie-player')) {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/@dotlottie/player-component@2.7.12/dist/dotlottie-player.mjs'
      script.type = 'module'
      document.head.appendChild(script)
    }
    setLoaded(true)
  }, [])

  if (!loaded) return <div className={className} style={style} />

  return (
    <div className={className} style={style} ref={ref}>
      {/* @ts-ignore - web component */}
      <dotlottie-player
        src={src}
        background="transparent"
        speed="1"
        style={{ width: '100%', height: '100%' }}
        loop
        autoplay
      />
    </div>
  )
}

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
  const [pigCount, setPigCount] = useState(0)

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(''), 2000)
  }

  // Easter egg: pig oink
  const handlePigClick = () => {
    setPigCount(prev => prev + 1)
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
    { id: 'scan', label: 'Scan', icon: '📡', lottie: LOTTIE.radar, phases: ['scanning'] },
    { id: 'filter', label: 'Filter', icon: '🧠', lottie: LOTTIE.brain, phases: ['filtered'] },
    { id: 'select', label: 'Kies', icon: '🎯', lottie: LOTTIE.pen, phases: ['selected', 'configuring'] },
    { id: 'write', label: 'Schrijf', icon: '✍️', lottie: LOTTIE.mic, phases: ['writing'] },
    { id: 'script', label: 'Script', icon: '📜', lottie: LOTTIE.mic, phases: ['script-done'] },
    { id: 'social', label: 'Social', icon: '📱', lottie: LOTTIE.megaphone, phases: ['social-generating', 'complete'] },
  ]

  const isStepActive = (stepPhases: string[]) => stepPhases.includes(phase)
  const isStepDone = (stepPhases: string[], stepIndex: number) => {
    const maxDonePhase = steps.findIndex(s => s.phases.includes(phase))
    return stepIndex < maxDonePhase
  }

  const pigMessages = [
    '', 'Oink!', 'Oink oink!', 'OINK OINK OINK!', '🐷🐷🐷 VREKKENPARTY! 🐷🐷🐷',
    'Je bent een echte vrek!', 'Stop met klikken, vrek!', 'Ok je wint. Hier is een gratis oink.',
  ]

  return (
    <div className="min-h-screen relative overflow-hidden bg-vv-dark">
      {/* Kraft paper texture overlay */}
      <div className="kraft-overlay" />

      {/* Ambient background orbs */}
      <div className="orb orb-yellow" style={{ top: '-10%', left: '-5%' }} />
      <div className="orb orb-pink" style={{ top: '40%', right: '-8%' }} />
      <div className="orb orb-blue" style={{ bottom: '-15%', left: '30%' }} />

      {/* Decorative gears - top right */}
      <div className="fixed top-20 right-4 w-20 h-20 opacity-[0.06] pointer-events-none z-0 hidden lg:block">
        <LottiePlayer src={LOTTIE.gears} className="w-full h-full" />
      </div>

      {/* ===== NAVIGATION ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 nav-glass border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 py-2.5 flex items-center justify-between">
          <button onClick={resetMachine} className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl overflow-hidden shadow-lg shadow-yellow-500/10 group-hover:scale-105 transition ring-1 ring-yellow-400/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.webp" alt="VV Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-display font-bold text-[15px] text-white leading-none tracking-tight">
                VROLIJKE <span className="text-vv-yellow">VREKKEN</span>
              </h1>
              <p className="text-[10px] text-white/25 font-medium tracking-[0.2em] uppercase">Episode Machine</p>
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
                      <div className={`w-4 h-0.5 rounded-full transition-all duration-700 ${done ? 'bg-emerald-400/40 pipeline-done' : active ? 'bg-yellow-400/30 animate-pipe-dot' : 'bg-white/[0.06]'}`} />
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

      {/* Pig easter egg toast */}
      {pigCount > 0 && pigCount < pigMessages.length && (
        <div className="fixed bottom-6 right-6 z-50 bg-vv-yellow/10 border border-vv-yellow/30 backdrop-blur-xl rounded-2xl px-5 py-3 text-vv-yellow text-sm font-bold reveal-scale">
          {pigMessages[pigCount]}
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main className="relative z-10 pt-20 min-h-screen">

        {/* ═══════════ IDLE — Premium Landing ═══════════ */}
        {phase === 'idle' && (
          <div className="flex flex-col items-center justify-center min-h-[85vh] text-center px-6">
            {/* Lottie gears background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
              <LottiePlayer src={LOTTIE.gears} className="w-[600px] h-[600px]" />
            </div>

            {/* Logo + pig easter egg */}
            <div className="animate-float mb-6 relative">
              <button onClick={handlePigClick} className="focus:outline-none group">
                <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-2xl shadow-yellow-500/20 ring-2 ring-yellow-400/20 group-hover:ring-yellow-400/40 transition-all group-active:scale-95">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.webp" alt="Vrolijke Vrekken" className="w-full h-full object-cover" />
                </div>
              </button>
              {/* Floating pig */}
              <div className="absolute -top-2 -right-3 text-2xl animate-wiggle">🐷</div>
            </div>

            <h2 className="font-display text-5xl sm:text-6xl md:text-7xl font-extrabold text-white mb-4 tracking-tight leading-[1.05]">
              Episode<br />
              <span className="text-gradient">Machine</span>
            </h2>
            <p className="text-white/30 text-lg max-w-md mb-2 leading-relaxed">
              Van nieuws tot volledig uitgeschreven podcast + social content.
            </p>
            <p className="text-vv-yellow/25 text-sm mb-8 italic font-medium">
              &ldquo;Besparen zonder je goede luim te verliezen&rdquo;
            </p>

            {/* Pipeline steps preview */}
            <div className="flex items-center gap-3 mb-10 flex-wrap justify-center">
              {[
                { icon: '📡', label: 'Scannen', lottie: LOTTIE.radar },
                { icon: '🧠', label: 'AI Filter', lottie: LOTTIE.brain },
                { icon: '✍️', label: 'Schrijven', lottie: LOTTIE.pen },
                { icon: '🎙️', label: 'Script', lottie: LOTTIE.mic },
                { icon: '📣', label: 'Social', lottie: LOTTIE.megaphone },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="pipeline-step group">
                    <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:border-yellow-400/20 group-hover:bg-yellow-400/[0.05] transition-all relative overflow-hidden">
                      <LottiePlayer src={step.lottie} className="w-10 h-10 opacity-60 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[10px] text-white/20 mt-1 block text-center font-medium">{step.label}</span>
                  </div>
                  {i < 4 && (
                    <div className="w-6 h-0.5 bg-white/[0.06] rounded-full mt-[-12px]" />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={scanNews}
              className="group relative bg-gradient-to-r from-yellow-400 to-yellow-500 text-[#0A1628] font-display font-extrabold text-xl px-14 py-5 rounded-2xl transition-all hover:scale-[1.03] active:scale-95 pulse-glow"
            >
              <span className="relative z-10 flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Start de machine
              </span>
            </button>

            {/* Host avatars */}
            <div className="flex items-center gap-4 mt-12">
              <div className="flex -space-x-3">
                {[
                  { src: '/ewoud.webp', name: 'Ewoud' },
                  { src: '/kristof.webp', name: 'Kristof' },
                  { src: '/elke.webp', name: 'Elke' },
                ].map((host, i) => (
                  <div key={i} className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#0A1628] hover:ring-yellow-400/30 transition-all hover:scale-110 hover:z-10 relative" title={host.name}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={host.src} alt={host.name} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <span className="text-white/15 text-xs">Ewoud • Kristof • Elke</span>
            </div>
          </div>
        )}

        {/* ═══════════ SCANNING — met Lottie radar ═══════════ */}
        {phase === 'scanning' && (
          <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-3xl bg-yellow-400/[0.06] border border-yellow-400/15 flex items-center justify-center overflow-hidden">
                <LottiePlayer src={LOTTIE.radar} className="w-28 h-28" />
              </div>
              {/* Scanning ring */}
              <div className="absolute inset-0 rounded-3xl ring-2 ring-yellow-400/20 animate-ping-slow" />
            </div>
            <h2 className="font-display text-3xl font-bold text-white mb-3">Machine draait</h2>
            <p className="text-white/30 text-sm mb-1">10 RSS feeds scannen + AI filter actief</p>
            <p className="text-vv-yellow/20 text-xs mb-10 italic">Zoekt het onverwachte, niet het voor de hand liggende</p>

            {/* Animated pipeline bar */}
            <div className="w-80 h-1.5 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.04]">
              <div className="w-1/3 h-full bg-gradient-to-r from-yellow-400 to-yellow-400/0 rounded-full animate-progress" />
            </div>
            <div className="flex gap-2 mt-8">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        )}

        {/* ═══════════ FILTERED — News cards met kraft accenten ═══════════ */}
        {phase === 'filtered' && (
          <div className="max-w-4xl mx-auto px-6 py-8 reveal-up">
            <div className="flex items-end justify-between mb-8">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-400/[0.06] border border-emerald-400/15 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <LottiePlayer src={LOTTIE.brain} className="w-12 h-12" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">{rawCount} artikelen gescand</span>
                  </div>
                  <h2 className="font-display text-3xl font-bold text-white">
                    {newsItems.length} onderwerpen
                  </h2>
                  <p className="text-white/25 text-sm mt-1">Kies een onderwerp om er een aflevering van te maken</p>
                </div>
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
                  className="news-card w-full text-left bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.06] hover:border-yellow-400/30 rounded-2xl p-5 group"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="score-ring flex-shrink-0 w-12 h-12" style={{ '--score': `${item.score * 10}` } as React.CSSProperties}>
                      <div className="score-ring-inner bg-[#0A1628]">
                        <span className="text-yellow-400 font-display font-bold text-sm">{item.score}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/15 text-xs mb-1.5 truncate">{item.headline}</p>
                      <h3 className="font-display text-lg font-bold text-white group-hover:text-yellow-400 transition leading-snug mb-2">
                        {item.vv_vraag}
                      </h3>
                      <div className="flex gap-4 text-xs">
                        <span className="text-yellow-400/40 flex items-center gap-1">
                          <span className="text-yellow-400/60">💡</span> {item.twist}
                        </span>
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

        {/* ═══════════ SELECTED — Host picker met foto's ═══════════ */}
        {(phase === 'selected' || phase === 'configuring') && selectedItem && (
          <div className="max-w-2xl mx-auto px-6 py-8 reveal-up">
            {/* Selected topic card with kraft accent */}
            <div className="relative bg-gradient-to-br from-yellow-400/[0.08] to-transparent border border-yellow-400/20 rounded-3xl p-8 mb-8 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-400/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-20 h-20 opacity-[0.03] pointer-events-none">
                <LottiePlayer src={LOTTIE.pen} className="w-full h-full" />
              </div>
              <button onClick={() => setPhase('filtered')} className="text-xs text-white/20 hover:text-white/50 mb-4 flex items-center gap-1 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Ander onderwerp
              </button>
              <div className="text-yellow-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                <span className="w-4 h-px bg-yellow-400/30" />
                Gekozen onderwerp
              </div>
              <h2 className="font-display text-2xl font-bold text-white mb-2 leading-tight">{selectedItem.vv_vraag}</h2>
              <p className="text-white/30 text-sm">{selectedItem.twist}</p>
              <p className="text-white/15 text-xs mt-2 italic">{selectedItem.payoff}</p>
            </div>

            {/* Config */}
            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-white/30 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
                  <span className="w-3 h-px bg-white/10" />
                  Hosts
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'ewoud-kristof', names: ['Ewoud', 'Kristof'], photos: ['/ewoud.webp', '/kristof.webp'], vibe: 'Humor + data + skepticisme' },
                    { id: 'ewoud-elke', names: ['Ewoud', 'Elke'], photos: ['/ewoud.webp', '/elke.webp'], vibe: 'Scherp + pragmatisch + direct' },
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
                      {/* Host avatars */}
                      <div className="flex -space-x-2 mb-3">
                        {h.photos.map((photo, j) => (
                          <div key={j} className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#0A1628]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={photo} alt={h.names[j]} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                      <div className={`font-display font-bold ${hosts === h.id ? 'text-yellow-400' : 'text-white/60'}`}>
                        {h.names.join(' & ')}
                      </div>
                      <div className="text-xs text-white/20 mt-0.5">{h.vibe}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-white/30 uppercase tracking-[0.15em] mb-2 flex items-center gap-2">
                  <span className="w-3 h-px bg-white/10" />
                  Extra sturing <span className="text-white/15 normal-case tracking-normal">(optioneel)</span>
                </label>
                <textarea
                  value={extraContext}
                  onChange={(e) => setExtraContext(e.target.value)}
                  placeholder="Bv. 'Focus op jonge gezinnen', 'Vergelijk met Nederland', 'Neem Belgische cijfers'..."
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 text-white placeholder-white/12 focus:border-yellow-400/30 focus:outline-none focus:ring-1 focus:ring-yellow-400/20 resize-none h-24 text-sm transition"
                />
              </div>

              <button
                onClick={generateScript}
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-[#0A1628] font-display font-extrabold text-lg px-8 py-4 rounded-2xl transition-all hover:scale-[1.01] active:scale-95 shadow-lg shadow-yellow-400/20 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Genereer Script
              </button>
              <p className="text-center text-white/15 text-xs">~30-60 seconden</p>
            </div>
          </div>
        )}

        {/* ═══════════ WRITING — Lottie pen animatie ═══════════ */}
        {phase === 'writing' && (
          <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-3xl bg-yellow-400/[0.06] border border-yellow-400/15 flex items-center justify-center overflow-hidden">
                <LottiePlayer src={LOTTIE.pen} className="w-28 h-28" />
              </div>
            </div>
            <h2 className="font-display text-3xl font-bold text-white mb-3">Script wordt gesmeed</h2>
            <p className="text-white/30 text-sm mb-1">Volledig uitgeschreven dialoog • 15-20 min</p>
            <p className="text-vv-yellow/20 text-xs mb-10 max-w-md italic">{selectedItem?.vv_vraag}</p>
            <div className="w-80 h-1.5 bg-white/[0.04] rounded-full overflow-hidden border border-white/[0.04]">
              <div className="w-1/3 h-full bg-gradient-to-r from-yellow-400 to-yellow-400/0 rounded-full animate-progress" />
            </div>

            {/* Decorative pig */}
            <div className="mt-12 text-3xl animate-wiggle opacity-30">🐷</div>
          </div>
        )}

        {/* ═══════════ SCRIPT DONE ═══════════ */}
        {phase === 'script-done' && (
          <div className="max-w-4xl mx-auto px-6 py-8 reveal-up">
            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-400/[0.06] border border-emerald-400/15 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <LottiePlayer src={LOTTIE.mic} className="w-10 h-10" />
                </div>
                <div>
                  <div className="text-emerald-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Script klaar
                  </div>
                  <h2 className="font-display text-2xl font-bold text-white">{selectedItem?.vv_vraag}</h2>
                </div>
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

            {/* Script content with kraft paper feel */}
            <div className="script-paper rounded-3xl p-6 md:p-10">
              <div className="space-y-0.5">
                {script.split('\n').map((line, i) => {
                  if (line.match(/^(EWOUD|KRISTOF|ELKE):/)) {
                    const [name, ...rest] = line.split(':')
                    return (
                      <p key={i} className="mb-2 leading-relaxed">
                        <span className={`inline-block font-display font-bold text-[11px] px-2.5 py-0.5 rounded-md mr-2 uppercase tracking-wider ${
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
                        <span className="text-orange-400 font-display font-bold text-sm">{line}</span>
                      </div>
                    )
                  }
                  if (line.match(/^(#{1,3}\s|COLD OPEN|BLOK|RUBRIEK|OUTRO|TEASER|AFSLUITER|---)/i)) {
                    return (
                      <h3 key={i} className="font-display text-lg font-bold text-yellow-400 mt-10 mb-4 pb-3 border-b border-yellow-400/10 flex items-center gap-3">
                        <span className="w-1.5 h-5 bg-yellow-400/30 rounded-full" />
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

        {/* ═══════════ SOCIAL GENERATING — Lottie megaphone ═══════════ */}
        {phase === 'social-generating' && (
          <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-3xl bg-pink-400/[0.06] border border-pink-400/15 flex items-center justify-center overflow-hidden">
                <LottiePlayer src={LOTTIE.megaphone} className="w-28 h-28" />
              </div>
            </div>
            <h2 className="font-display text-3xl font-bold text-white mb-3">Social content genereren</h2>
            <p className="text-white/30 text-sm">Instagram • TikTok • Facebook • Newsletter</p>
            <div className="w-80 h-1.5 bg-white/[0.04] rounded-full overflow-hidden mt-10 border border-white/[0.04]">
              <div className="w-1/3 h-full bg-gradient-to-r from-pink-400 to-pink-400/0 rounded-full animate-progress" />
            </div>
          </div>
        )}

        {/* ═══════════ COMPLETE — Social tabs ═══════════ */}
        {phase === 'complete' && social && (
          <div className="max-w-4xl mx-auto px-6 py-8 reveal-up">
            <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-400/[0.06] border border-emerald-400/15 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <LottiePlayer src={LOTTIE.megaphone} className="w-10 h-10" />
                </div>
                <div>
                  <div className="text-emerald-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Alles klaar
                  </div>
                  <h2 className="font-display text-2xl font-bold text-white">{selectedItem?.vv_vraag}</h2>
                </div>
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
                { id: 'ig' as const, label: 'Carousel', icon: '📸' },
                { id: 'video' as const, label: 'Video Clips', icon: '🎬' },
                { id: 'tiktok' as const, label: 'TikTok', icon: '🎵' },
                { id: 'fb' as const, label: 'Facebook', icon: '👍' },
                { id: 'newsletter' as const, label: 'Newsletter', icon: '📧' },
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
                <div className="social-card rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-display font-bold text-pink-400">Instagram Carousel</h3>
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
                        <span className="text-[10px] text-white/20 font-bold font-display tracking-wider">SLIDE {i+1}</span>
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
                    <div key={i} className="social-card rounded-3xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-orange-400 bg-orange-400/10 px-3 py-1 rounded-full font-display">CLIP {i+1}</span>
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
                    <div key={i} className="social-card rounded-3xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full font-display">VIDEO {i+1}</span>
                        <button onClick={() => copyToClipboard(
                          `Hook: ${tt.hook_eerste_3_sec}\n\n${tt.dialoog}\n\nCaption: ${tt.caption}`, `tt-${i}`
                        )} className="text-xs text-white/20 hover:text-white/50 transition">
                          {copiedField === `tt-${i}` ? '✓' : '📋'}
                        </button>
                      </div>
                      <div className="bg-yellow-400/[0.06] border border-yellow-400/10 rounded-xl px-4 py-2.5 mb-4">
                        <span className="text-[10px] text-yellow-400/50 uppercase font-bold">Hook — eerste 3 sec</span>
                        <p className="text-yellow-400 font-bold text-sm mt-0.5">&ldquo;{tt.hook_eerste_3_sec}&rdquo;</p>
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
                <div className="social-card rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-display font-bold text-blue-400">Facebook Post</h3>
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
                <div className="social-card rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-display font-bold text-yellow-500">Newsletter Blok</h3>
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
      <footer className="relative z-10 border-t border-white/[0.04] py-6 mt-16">
        <div className="flex items-center justify-center gap-3">
          <div className="w-6 h-6 rounded-md overflow-hidden opacity-40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.webp" alt="" className="w-full h-full object-cover" />
          </div>
          <p className="text-white/10 text-xs font-medium">
            Vrolijke Vrekken Episode Machine
          </p>
          <span className="text-white/[0.06]">•</span>
          <p className="text-white/[0.06] text-xs">
            Besparen zonder je goede luim te verliezen
          </p>
        </div>
      </footer>
    </div>
  )
}
