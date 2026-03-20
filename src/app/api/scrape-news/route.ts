import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

export async function POST() {
  try {
    // Stap 1: Haal de Nieuwsblad.be homepage op
    const response = await fetch('https://www.nieuwsblad.be/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'nl-BE,nl;q=0.9',
      },
    })

    if (!response.ok) {
      throw new Error(`Nieuwsblad fetch failed: ${response.status}`)
    }

    const html = await response.text()

    // Stap 2: Extraheer artikelen uit de HTML (headlines + teasers)
    const articleRegex = /<article[^>]*>([\s\S]*?)<\/article>/gi
    const titleRegex = /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi
    const linkRegex = /href="(\/[^"]*?)"/gi

    const articles: string[] = []
    let match

    // Extract headlines from the page
    const headlineRegex = /<(?:h[1-4]|a)[^>]*class="[^"]*(?:title|headline|teaser)[^"]*"[^>]*>([\s\S]*?)<\/(?:h[1-4]|a)>/gi
    while ((match = headlineRegex.exec(html)) !== null && articles.length < 40) {
      const text = match[1].replace(/<[^>]+>/g, '').trim()
      if (text.length > 20 && text.length < 200) {
        articles.push(text)
      }
    }

    // Fallback: extract all heading text
    if (articles.length < 10) {
      while ((match = titleRegex.exec(html)) !== null && articles.length < 40) {
        const text = match[1].replace(/<[^>]+>/g, '').trim()
        if (text.length > 20 && text.length < 200 && !articles.includes(text)) {
          articles.push(text)
        }
      }
    }

    // Fallback: extract from meta/og tags or just get raw text blocks
    if (articles.length < 5) {
      const textBlocks = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, '\n')
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 30 && s.length < 200)
        .slice(0, 40)
      articles.push(...textBlocks)
    }

    const uniqueArticles = [...new Set(articles)].slice(0, 30)

    // Stap 3: Claude filtert op VV-waardige items
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const filterResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Je bent de redactiebot van "Vrolijke Vrekken", een Vlaamse podcast over slim besparen zonder je goede humeur te verliezen. De hosts zijn Ewoud en Kristof (of soms Ewoud en Elke).

Hieronder staan headlines van Nieuwsblad.be van vandaag. Selecteer de 5-8 BESTE items die geschikt zijn voor een VV-aflevering.

SELECTIECRITERIA:
- Consumentgericht: raakt het de portemonnee van gewone mensen?
- Herkenbaarheid: herkent een Vlaamse luisteraar zich hierin?
- Payoff: kunnen we iets nuttigs/verrassends/grappigs brengen?
- Actualiteit: waarom nu? Wat is de urgentie?
- GEEN droog politiek/sport/celebrities tenzij er een geldhoek aan zit
- GEEN deprimerend nieuws zonder bruikbare hoek
- WEL: consumentenzaken, prijzen, koopkracht, scams, supermarkt, energie, wonen, verzekeringen, beleggen, psychologie van geld, statusconsumptie, weird pricing

HEADLINES VAN VANDAAG:
${uniqueArticles.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Geef voor elk geselecteerd item EXACT dit JSON format:
[
  {
    "headline": "originele headline",
    "vv_hook": "de VV-invalshoek in 1 pakkende zin",
    "waarom_nu": "waarom dit nu relevant is",
    "episode_belofte": "wat de luisteraar gaat leren/ontdekken",
    "score": 8
  }
]

Antwoord ALLEEN met valid JSON. Geen tekst ervoor of erna.`
      }]
    })

    const filterText = filterResponse.content[0].type === 'text' ? filterResponse.content[0].text : ''

    let filteredItems
    try {
      filteredItems = JSON.parse(filterText)
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = filterText.match(/\[[\s\S]*\]/)
      filteredItems = jsonMatch ? JSON.parse(jsonMatch[0]) : []
    }

    return NextResponse.json({
      success: true,
      rawCount: uniqueArticles.length,
      items: filteredItems,
    })
  } catch (error: any) {
    console.error('Scrape error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
