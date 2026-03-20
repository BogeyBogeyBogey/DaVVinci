'use client'

import { useState } from 'react'

type NewsItem = {
  headline: string
  vv_hook: string
  waarom_nu: string
  episode_belofte: string
  score: number
}

type SocialContent = {
  instagram_carousel: { slides: string[]; caption: string }
  instagram_snippets: { clip_beschrijving: string; caption: string; hashtags: string }[]
  tiktok: { clip_beschrijving: string; hook_eerste_3_sec: string; caption: string; format_suggestie: string }[]
  facebook: { post: string; discussievraag: string }
  newsletter: { onderwerp: string; preview_tekst: string; body: string; cta_tekst: string }
}

type Step = 'home' | 'scanning' | 'results' | 'setup' | 'generating' | 'script' | 'social'

export default function Home() {
  const [step, setStep] = useState<Step>('home')
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null)
  const [hosts, setHosts] = useState<string>('ewoud-kristof')
  const [extraContext, setExtraContext] = useState('')
  const [script, setScript] = useState('')
  const [social, setSocial] = useState<SocialContent | null>(null)
  const [error, setError] = useState('')
  const [copiedField, setCopiedField] = useState('')

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(''), 2000)
  }

  const scanNews = async () => {
    setStep('scanning')
    setError('')
    try {
      const res = await fetch('/api/scrape-news', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setNewsItems(data.items || [])
        setStep('results')
      } else {
        setError(data.error || 'Er ging iets mis bij het scannen')
        setStep('home')
      }
    } catch (e: any) {
      setError(e.message)
      setStep('home')
    }
  }

  const generateScript = async () => {
    if (!selectedItem) return
    setStep('generating')
    setError('')
    try {
      const res = await fetch('/api/generate-episode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: selectedItem.headline,
          hook: selectedItem.vv_hook,
          hosts,
          extraContext,
          generateType: 'script',
        }),
      })
      const data = await res.json()
      if (data.success) {
        setScript(data.script)
        setStep('script')
      } else {
        setError(data.error || 'Scriptgeneratie mislukt')
        setStep('setup')
      }
    } catch (e: any) {
      setError(e.message)
      setStep('setup')
    }
  }

  const generateSocial = async () => {
    if (!selectedItem || !script) return
    setStep('generating')
    try {
      const res = await fetch('/api/generate-episode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: selectedItem.headline,
          hook: selectedItem.vv_hook,
          script,
          generateType: 'social',
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSocial(data.social)
        setStep('social')
      } else {
        setError(data.error || 'Social content generatie mislukt')
        setStep('script')
      }
    } catch (e: any) {
      setError(e.message)
      setStep('script')
    }
  }

  return (
    <div className="min-h-screen bg-vv-dark">
      {/* Header */}
      <header className="border-b border-white/10 bg-vv-dark/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => { setStep('home'); setError('') }} className="flex items-center gap-3 hover:opacity-80 transition">
            <span className="text-2xl">💰</span>
            <div>
              <h1 className="font-display font-bold text-lg text-vv-cream leading-tight">Vrolijke Vrekken</h1>
              <p className="text-xs text-vv-lime/60">Episode Creator</p>
            </div>
          </button>
          <div className="flex items-center gap-2 text-sm text-white/40">
            {['Nieuws', 'Setup', 'Script', 'Social'].map((s, i) => {
              const stepMap: Step[] = ['results', 'setup', 'script', 'social']
              const isActive = stepMap.indexOf(step as any) >= i || step === 'scanning' && i === 0 || step === 'generating'
              return (
                <div key={s} className="flex items-center gap-2">
                  {i > 0 && <span className="text-white/20">→</span>}
                  <span className={isActive ? 'text-vv-lime font-medium' : ''}>{s}</span>
                </div>
              )
            })}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {error && (
          <div className="mb-8 bg-vv-coral/20 border border-vv-coral/40 rounded-xl p-4 text-vv-coral">
            ⚠️ {error}
            <button onClick={() => setError('')} className="ml-3 underline text-sm">Sluiten</button>
          </div>
        )}

        {/* HOME */}
        {step === 'home' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="text-7xl mb-6">🎙️</div>
            <h2 className="font-display text-4xl font-bold text-vv-cream mb-4">
              Van nieuws tot <span className="text-gradient">podcast</span>
            </h2>
            <p className="text-white/50 text-lg max-w-lg mb-10">
              Scan Nieuwsblad.be, kies een onderwerp, en krijg een volledig uitgeschreven script + social content.
            </p>
            <button
              onClick={scanNews}
              className="bg-vv-green hover:bg-vv-green/80 text-white font-display font-bold text-xl px-10 py-5 rounded-2xl transition-all hover:scale-105 active:scale-95 pulse-glow"
            >
              🔍 Scan Nieuwsblad.be
            </button>
            <p className="text-white/30 text-sm mt-4">Duurt ~15 seconden</p>
          </div>
        )}

        {/* SCANNING */}
        {step === 'scanning' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="text-6xl mb-6 animate-bounce">📡</div>
            <h2 className="font-display text-2xl font-bold text-vv-cream mb-3">Nieuwsblad.be scannen...</h2>
            <p className="text-white/50 mb-8">AI filtert op VV-waardige onderwerpen</p>
            <div className="flex gap-2">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-3 h-3 bg-vv-lime rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.3}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* RESULTS */}
        {step === 'results' && (
          <div>
            <div className="mb-8">
              <h2 className="font-display text-3xl font-bold text-vv-cream mb-2">
                📰 {newsItems.length} VV-waardige items gevonden
              </h2>
              <p className="text-white/50">Kies een onderwerp voor je volgende aflevering</p>
            </div>
            <div className="grid gap-4">
              {newsItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedItem(item); setStep('setup') }}
                  className="text-left bg-white/5 hover:bg-vv-green/20 border border-white/10 hover:border-vv-green/50 rounded-xl p-6 transition-all group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-white/40 text-sm mb-1">📰 {item.headline}</p>
                      <h3 className="font-display text-xl font-bold text-vv-cream mb-2 group-hover:text-vv-lime transition">
                        🎙️ {item.vv_hook}
                      </h3>
                      <p className="text-white/50 text-sm mb-2">⏰ {item.waarom_nu}</p>
                      <p className="text-vv-lime/70 text-sm">💡 {item.episode_belofte}</p>
                    </div>
                    <div className="flex-shrink-0 bg-vv-green/20 text-vv-lime font-bold rounded-lg px-3 py-1 text-sm">
                      {item.score}/10
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SETUP */}
        {step === 'setup' && selectedItem && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h2 className="font-display text-3xl font-bold text-vv-cream mb-2">⚙️ Episode Setup</h2>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-vv-lime font-medium">{selectedItem.vv_hook}</p>
                <p className="text-white/40 text-sm mt-1">{selectedItem.headline}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-3">Wie presenteert?</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setHosts('ewoud-kristof')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      hosts === 'ewoud-kristof'
                        ? 'border-vv-green bg-vv-green/20 text-vv-cream'
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30'
                    }`}
                  >
                    <div className="text-2xl mb-2">👨‍👨‍👦</div>
                    <div className="font-bold">Ewoud & Kristof</div>
                    <div className="text-sm opacity-60">Humor + data</div>
                  </button>
                  <button
                    onClick={() => setHosts('ewoud-elke')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      hosts === 'ewoud-elke'
                        ? 'border-vv-green bg-vv-green/20 text-vv-cream'
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30'
                    }`}
                  >
                    <div className="text-2xl mb-2">👫</div>
                    <div className="font-bold">Ewoud & Elke</div>
                    <div className="text-sm opacity-60">Scherp + pragmatisch</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Extra context of eigen twist (optioneel)
                </label>
                <textarea
                  value={extraContext}
                  onChange={(e) => setExtraContext(e.target.value)}
                  placeholder="Bv. 'Focus op jonge gezinnen', 'Vergelijk met vorig jaar', 'Neem er de Belgische cijfers bij'..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-vv-cream placeholder-white/30 focus:border-vv-green focus:outline-none focus:ring-1 focus:ring-vv-green resize-none h-28"
                />
              </div>

              <button
                onClick={generateScript}
                className="w-full bg-vv-green hover:bg-vv-green/80 text-white font-display font-bold text-lg px-8 py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-95"
              >
                ✍️ Genereer Volledig Script
              </button>
              <p className="text-center text-white/30 text-sm">Duurt ~30-60 seconden</p>
            </div>
          </div>
        )}

        {/* GENERATING */}
        {step === 'generating' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="text-6xl mb-6 animate-spin" style={{ animationDuration: '3s' }}>✍️</div>
            <h2 className="font-display text-2xl font-bold text-vv-cream mb-3">Script wordt geschreven...</h2>
            <p className="text-white/50 mb-2">De AI schrijft een volledig uitgeschreven dialoog</p>
            <p className="text-white/30 text-sm">Even geduld, dit duurt ~45 seconden</p>
            <div className="flex gap-2 mt-8">
              {[0, 1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 bg-vv-gold rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* SCRIPT VIEW */}
        {step === 'script' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-display text-3xl font-bold text-vv-cream mb-1">📜 Script</h2>
                <p className="text-white/50">{selectedItem?.vv_hook}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => copyToClipboard(script, 'script')}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition text-sm"
                >
                  {copiedField === 'script' ? '✅ Gekopieerd!' : '📋 Kopieer alles'}
                </button>
                <button
                  onClick={generateSocial}
                  className="bg-vv-gold hover:bg-vv-gold/80 text-vv-dark font-bold px-6 py-2 rounded-lg transition text-sm"
                >
                  📱 Genereer Social Content →
                </button>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
              <div className="prose prose-invert max-w-none">
                {script.split('\n').map((line, i) => {
                  // Highlight host names
                  if (line.match(/^(EWOUD|KRISTOF|ELKE):/)) {
                    const [name, ...rest] = line.split(':')
                    return (
                      <p key={i} className="mb-2">
                        <span className={`font-bold ${
                          name === 'EWOUD' ? 'text-vv-lime' :
                          name === 'KRISTOF' ? 'text-vv-gold' :
                          'text-vv-coral'
                        }`}>{name}:</span>
                        <span className="text-vv-cream/90">{rest.join(':')}</span>
                      </p>
                    )
                  }
                  // Highlight clip moments
                  if (line.includes('🎬') || line.includes('CLIP-MOMENT') || line.includes('CLIP MOMENT')) {
                    return (
                      <div key={i} className="my-4 bg-vv-coral/20 border border-vv-coral/40 rounded-lg p-3 text-vv-coral font-bold">
                        {line}
                      </div>
                    )
                  }
                  // Highlight section headers
                  if (line.match(/^(#{1,3}\s|COLD OPEN|BLOK \d|RUBRIEK|OUTRO|TEASER|---)/i)) {
                    return (
                      <h3 key={i} className="font-display text-xl font-bold text-vv-lime mt-8 mb-4 border-b border-vv-green/30 pb-2">
                        {line.replace(/^#+\s*/, '')}
                      </h3>
                    )
                  }
                  // Stage directions
                  if (line.match(/^\(.*\)$/)) {
                    return <p key={i} className="text-white/30 italic text-sm mb-2">{line}</p>
                  }
                  // Empty lines
                  if (!line.trim()) return <br key={i} />
                  // Normal text
                  return <p key={i} className="text-white/70 mb-2">{line}</p>
                })}
              </div>
            </div>
          </div>
        )}

        {/* SOCIAL CONTENT */}
        {step === 'social' && social && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-display text-3xl font-bold text-vv-cream mb-1">📱 Social Content</h2>
                <p className="text-white/50">{selectedItem?.vv_hook}</p>
              </div>
              <button
                onClick={() => setStep('script')}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition text-sm"
              >
                ← Terug naar Script
              </button>
            </div>

            <div className="grid gap-8">
              {/* Instagram Carousel */}
              <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-xl font-bold text-pink-400">📸 Instagram Carousel</h3>
                  <button
                    onClick={() => copyToClipboard(
                      social.instagram_carousel.slides.map((s, i) => `Slide ${i + 1}: ${s}`).join('\n\n') + '\n\nCaption: ' + social.instagram_carousel.caption,
                      'ig-carousel'
                    )}
                    className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition"
                  >
                    {copiedField === 'ig-carousel' ? '✅' : '📋'} Kopieer
                  </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-3">
                  {social.instagram_carousel.slides.map((slide, i) => (
                    <div key={i} className="flex-shrink-0 w-48 h-48 bg-gradient-to-br from-vv-green/30 to-vv-dark border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                      <span className="text-xs text-white/40">Slide {i + 1}</span>
                      <p className="text-sm text-vv-cream leading-snug">{slide}</p>
                    </div>
                  ))}
                </div>
                <p className="text-white/50 text-sm mt-3"><strong>Caption:</strong> {social.instagram_carousel.caption}</p>
              </section>

              {/* Instagram Snippets */}
              <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-display text-xl font-bold text-pink-400 mb-4">🎬 Instagram Video Snippets</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {social.instagram_snippets.map((snippet, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-vv-coral">CLIP {i + 1}</span>
                        <button
                          onClick={() => copyToClipboard(
                            `Clip: ${snippet.clip_beschrijving}\n\nCaption: ${snippet.caption}\n\n${snippet.hashtags}`,
                            `ig-snippet-${i}`
                          )}
                          className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition"
                        >
                          {copiedField === `ig-snippet-${i}` ? '✅' : '📋'}
                        </button>
                      </div>
                      <p className="text-vv-cream text-sm mb-2">{snippet.clip_beschrijving}</p>
                      <p className="text-white/50 text-sm">{snippet.caption}</p>
                      <p className="text-vv-lime/50 text-xs mt-2">{snippet.hashtags}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* TikTok */}
              <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="font-display text-xl font-bold text-cyan-400 mb-4">🎵 TikTok</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {social.tiktok.map((tt, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-cyan-400">VIDEO {i + 1}</span>
                        <button
                          onClick={() => copyToClipboard(
                            `Hook: ${tt.hook_eerste_3_sec}\n\nClip: ${tt.clip_beschrijving}\n\nCaption: ${tt.caption}\n\nFormat: ${tt.format_suggestie}`,
                            `tiktok-${i}`
                          )}
                          className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition"
                        >
                          {copiedField === `tiktok-${i}` ? '✅' : '📋'}
                        </button>
                      </div>
                      <p className="text-vv-gold font-bold text-sm mb-1">Hook: &quot;{tt.hook_eerste_3_sec}&quot;</p>
                      <p className="text-vv-cream text-sm mb-2">{tt.clip_beschrijving}</p>
                      <p className="text-white/50 text-sm">{tt.caption}</p>
                      <p className="text-cyan-400/50 text-xs mt-2">Format: {tt.format_suggestie}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Facebook */}
              <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-xl font-bold text-blue-400">👍 Facebook</h3>
                  <button
                    onClick={() => copyToClipboard(
                      social.facebook.post + '\n\n' + social.facebook.discussievraag,
                      'facebook'
                    )}
                    className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition"
                  >
                    {copiedField === 'facebook' ? '✅' : '📋'} Kopieer
                  </button>
                </div>
                <div className="bg-white/5 rounded-xl p-4 mb-3">
                  <p className="text-vv-cream text-sm whitespace-pre-wrap">{social.facebook.post}</p>
                </div>
                <p className="text-blue-400/70 text-sm font-medium">💬 {social.facebook.discussievraag}</p>
              </section>

              {/* Newsletter */}
              <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-xl font-bold text-vv-gold">📧 Newsletter</h3>
                  <button
                    onClick={() => copyToClipboard(
                      `Onderwerp: ${social.newsletter.onderwerp}\n\n${social.newsletter.body}\n\nCTA: ${social.newsletter.cta_tekst}`,
                      'newsletter'
                    )}
                    className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition"
                  >
                    {copiedField === 'newsletter' ? '✅' : '📋'} Kopieer
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/5 rounded-lg p-3">
                    <span className="text-xs text-white/40">Onderwerp:</span>
                    <p className="text-vv-cream font-bold">{social.newsletter.onderwerp}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-vv-cream text-sm whitespace-pre-wrap">{social.newsletter.body}</p>
                  </div>
                  <div className="bg-vv-gold/20 rounded-lg p-3 text-center">
                    <span className="text-vv-gold font-bold">{social.newsletter.cta_tekst}</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 mt-16">
        <p className="text-center text-white/20 text-sm">
          Vrolijke Vrekken Episode Creator — Besparen zonder je goede luim te verliezen 💰
        </p>
      </footer>
    </div>
  )
}
