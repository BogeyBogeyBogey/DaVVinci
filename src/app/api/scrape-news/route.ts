import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

// Brede set RSS feeds — niet alleen consument, alles waar een geldhoek aan zit
const RSS_FEEDS = [
  'https://www.nieuwsblad.be/rss/section/55178e67-15a8-4ddd-a3d8-bfe5708f8932', // Binnenland
  'https://www.nieuwsblad.be/rss/section/7f1ea2fe-40c3-4534-bc08-87cc5b642307', // Buitenland
  'https://www.nieuwsblad.be/rss/section/d3c1abe8-3780-4ad1-a5d8-a4a7a76ed12b', // Economie
  'https://www.nieuwsblad.be/rss/section/a6566e0e-1584-4bfe-92c4-3b40e9af3b40', // Wetenschap
]

// Google News — breed zoeken, niet alleen "besparen"
const GOOGLE_NEWS_FEEDS = [
  'https://news.google.com/rss/search?q=besparen+OR+consument+OR+prijzen+OR+koopkracht+OR+supermarkt+OR+energie+OR+verzekering+site:nieuwsblad.be&hl=nl&gl=BE&ceid=BE:nl',
  'https://news.google.com/rss/search?q=geld+OR+beleggen+OR+inflatie+OR+lonen+OR+beurs+OR+bitcoin+OR+vastgoed+OR+huur&hl=nl&gl=BE&ceid=BE:nl',
  'https://news.google.com/rss/search?q=scam+OR+fraude+OR+boete+OR+subsidie+OR+premie+OR+belasting+OR+BTW+Belgium&hl=nl&gl=BE&ceid=BE:nl',
  'https://news.google.com/rss/search?q=McDonalds+OR+Aldi+OR+Lidl+OR+Colruyt+OR+IKEA+OR+Ryanair+OR+Temu+OR+Shein+Belgium&hl=nl&gl=BE&ceid=BE:nl',
  'https://news.google.com/rss/search?q=wonen+OR+huurprijs+OR+hypotheek+OR+renovatie+OR+zonnepanelen+OR+warmtepomp+Belgium&hl=nl&gl=BE&ceid=BE:nl',
  'https://news.google.com/rss/search?q=gezondheid+OR+ziekenfonds+OR+doktersbezoek+OR+tandarts+OR+terugbetaling+Belgium&hl=nl&gl=BE&ceid=BE:nl',
]

function parseRSSItems(xml: string): string[] {
  const items: string[] = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1]
    const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : ''
    const descMatch = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)
    const desc = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : ''

    if (title && title.length > 15) {
      const combined = desc && desc.length > 20 ? `${title} — ${desc.substring(0, 200)}` : title
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
    // Stap 1: Haal alles op — breed net uitwerpen
    const allFeeds = [...RSS_FEEDS, ...GOOGLE_NEWS_FEEDS]
    const results = await Promise.all(allFeeds.map(fetchFeed))
    let allArticles = results.flat()

    // Fallback: direct Nieuwsblad homepage
    if (allArticles.length < 10) {
      try {
        const response = await fetch('https://www.nieuwsblad.be/', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'nl-BE,nl;q=0.9',
          },
        })
        if (response.ok) {
          const html = await response.text()
          const titleRegex = /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi
          let match
          while ((match = titleRegex.exec(html)) !== null && allArticles.length < 60) {
            const text = match[1].replace(/<[^>]+>/g, '').trim()
            if (text.length > 20 && text.length < 200) allArticles.push(text)
          }
        }
      } catch { /* ignore */ }
    }

    const uniqueArticles = [...new Set(allArticles)].slice(0, 50)

    if (uniqueArticles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Geen nieuwsartikelen kunnen ophalen. Probeer het later opnieuw.',
      }, { status: 500 })
    }

    // Stap 2: Claude filtert — BREED denken, niet alleen consumentennieuws
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const filterResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `Je bent de actua-jager van "Vrolijke Vrekken" (VV), een Vlaamse podcast: "besparen zonder je goede luim te verliezen."

VV is GEEN saaie consumentenpodcast. VV vindt de geldhoek in ALLES — van beurs tot aardappelen koken, van datingapps tot rouwkosten, van TikTok-hypes tot zonnepanelen.

Hieronder staan headlines van Belgische nieuwsbronnen. Selecteer de 15-20 STERKSTE items.

## WAT WE ZOEKEN
- Alles waar een verrassende geldhoek aan zit
- Niet het voor de hand liggende — de TWIST, het onverwachte
- "Hoeveel kost een date via een relatiebureau?" > "Inflatie stijgt"
- "Is 1 euro voor een maximenu bij McDonalds echt zijn geld waard?" > "McDonalds verlaagt prijzen"
- "Waarom is ontdooide vis duurder dan diepvriesvis?" > "Visprijzen stijgen"
- Rare consumentencases, scams, statusconsumptie, wellnesshypes, vreemde prijsverhalen
- Politiek/sport/showbiz/tech/gezondheid — ALLES kan als je de portemonnee-link vindt
- Denk ook aan: psychologie van geld, statusgedrag, FOMO-aankopen, guilty pleasures, verborgen kosten

## WAT WE NIET ZOEKEN
- Droge nieuwssamenvattingen zonder twist
- Deprimerend nieuws zonder actie of payoff
- Puur academisch of te niche
- Items waar de luisteraar NIETS aan heeft

## PER ITEM LEVER JE:
- headline: korte versie van het origineel
- vv_vraag: de VV-episodevraag — ALTIJD als vraag geformuleerd die een luisteraar meteen snapt
- twist: wat is de VERRASSENDE hoek die VV eraan geeft? (1 zin)
- payoff: wat leert/bespaart/ontdekt de luisteraar?
- score: 1-10 (alleen items met score >= 6)

HEADLINES/ARTIKELEN VAN VANDAAG:
${uniqueArticles.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Geef 15-20 items in dit EXACT JSON format:
[
  {
    "headline": "originele headline (kort)",
    "vv_vraag": "de episodevraag als pakkende vraag",
    "twist": "de verrassende VV-hoek",
    "payoff": "wat de luisteraar eraan heeft",
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
