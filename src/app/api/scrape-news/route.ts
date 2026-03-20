import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

// Nieuwsblad RSS feeds per categorie
const RSS_FEEDS = [
  'https://www.nieuwsblad.be/rss/section/55178e67-15a8-4ddd-a3d8-bfe5708f8932', // Binnenland
  'https://www.nieuwsblad.be/rss/section/7f1ea2fe-40c3-4534-bc08-87cc5b642307', // Buitenland
]

// Google News RSS als fallback (Belgisch consumentennieuws)
const GOOGLE_NEWS_FEEDS = [
  'https://news.google.com/rss/search?q=besparen+OR+consument+OR+prijzen+OR+koopkracht+OR+supermarkt+OR+energie+OR+verzekering+site:nieuwsblad.be&hl=nl&gl=BE&ceid=BE:nl',
  'https://news.google.com/rss/search?q=geld+OR+besparen+OR+koopkracht+OR+consument+OR+scam+OR+prijs&hl=nl&gl=BE&ceid=BE:nl',
]

function parseRSSItems(xml: string): string[] {
  const items: string[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1]

    // Extract title
    const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : ''

    // Extract description
    const descMatch = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)
    const desc = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : ''

    if (title && title.length > 15) {
      const combined = desc && desc.length > 20 ? `${title} — ${desc.substring(0, 150)}` : title
      items.push(combined)
    }
  }

  return items
}

async function fetchFeed(url: string): Promise<string[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'VrolijkeVrekken-EpisodeCreator/1.0 (podcast research bot)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
    })
    if (!response.ok) return []
    const xml = await response.text()
    return parseRSSItems(xml)
  } catch {
    return []
  }
}

export async function POST() {
  try {
    // Stap 1: Probeer Nieuwsblad RSS feeds
    let allArticles: string[] = []

    // Probeer alle Nieuwsblad feeds parallel
    const nieuwsbladResults = await Promise.all(RSS_FEEDS.map(fetchFeed))
    allArticles = nieuwsbladResults.flat()

    // Fallback: Google News RSS (zoekt specifiek naar Belgisch consumentennieuws)
    if (allArticles.length < 5) {
      const googleResults = await Promise.all(GOOGLE_NEWS_FEEDS.map(fetchFeed))
      allArticles = [...allArticles, ...googleResults.flat()]
    }

    // Fallback 2: Direct de Nieuwsblad homepage proberen met andere headers
    if (allArticles.length < 5) {
      try {
        const response = await fetch('https://www.nieuwsblad.be/', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'nl-BE,nl;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
          },
        })
        if (response.ok) {
          const html = await response.text()
          const titleRegex = /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi
          let match
          while ((match = titleRegex.exec(html)) !== null && allArticles.length < 40) {
            const text = match[1].replace(/<[^>]+>/g, '').trim()
            if (text.length > 20 && text.length < 200) {
              allArticles.push(text)
            }
          }
        }
      } catch { /* ignore fallback errors */ }
    }

    const uniqueArticles = [...new Set(allArticles)].slice(0, 30)

    if (uniqueArticles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Geen nieuwsartikelen kunnen ophalen. Probeer het later opnieuw.',
      }, { status: 500 })
    }

    // Stap 2: Claude filtert op VV-waardige items
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const filterResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Je bent de redactiebot van "Vrolijke Vrekken", een Vlaamse podcast over slim besparen zonder je goede humeur te verliezen. De hosts zijn Ewoud en Kristof (of soms Ewoud en Elke).

Hieronder staan headlines/artikelen van Belgische nieuwsbronnen. Selecteer de 5-8 BESTE items die geschikt zijn voor een VV-aflevering.

SELECTIECRITERIA:
- Consumentgericht: raakt het de portemonnee van gewone mensen?
- Herkenbaarheid: herkent een Vlaamse luisteraar zich hierin?
- Payoff: kunnen we iets nuttigs/verrassends/grappigs brengen?
- Actualiteit: waarom nu? Wat is de urgentie?
- GEEN droog politiek/sport/celebrities tenzij er een geldhoek aan zit
- GEEN deprimerend nieuws zonder bruikbare hoek
- WEL: consumentenzaken, prijzen, koopkracht, scams, supermarkt, energie, wonen, verzekeringen, beleggen, psychologie van geld, statusconsumptie, weird pricing

HEADLINES/ARTIKELEN VAN VANDAAG:
${uniqueArticles.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Geef voor elk geselecteerd item EXACT dit JSON format:
[
  {
    "headline": "originele headline (kort)",
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
