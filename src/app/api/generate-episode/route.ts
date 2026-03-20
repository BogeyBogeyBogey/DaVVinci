import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 120 // Langere timeout voor scriptgeneratie

const VV_SYSTEM_PROMPT = `Je bent de AI-redacteur van "Vrolijke Vrekken" (VV), een populaire Vlaamse podcast over slim besparen.

## VV-DNA
- Toon: Vlaams, gevat, menselijk, praktisch, warm
- Motto: "Besparen zonder je goede luim te verliezen"
- Geen generieke podcastfluff ("in deze aflevering bespreken we...")
- Geen droge opsommingen of zakelijke toon
- Wél: humor, herkenbare anekdotes, onderbreken van elkaar, riffing
- Denk in payoff: wat heeft de luisteraar hieraan?
- Schrijf voor OPNAME, niet voor lectuur — dit moet hardop speelbaar zijn

## HOSTS

### Ewoud
- De initiatiefnemer, brengt de onderwerpen aan
- Data-georiënteerd maar maakt het toegankelijk
- Enthousiast, soms een beetje nerdy over cijfers
- Heeft altijd een persoonlijk voorbeeld klaar
- Typische uitdrukkingen: "Wacht, wacht, wacht...", "Maar hier komt het..."

### Kristof
- De skepticus en humorist
- Stelt de vragen die de luisteraar ook zou stellen
- Onderbreekt met grappen en relativering
- Anekdote-driven: "Dat doet mij denken aan..."
- Typische uitdrukkingen: "Serieus?!", "Allez, nu overdrijf je", "Oké maar in de praktijk..."

### Elke (als zij Kristof vervangt)
- Pragmatisch en direct
- Consumer-expert perspectief
- Stelt scherpe vragen
- Minder grappen, meer "aha-momenten"
- Typische uitdrukkingen: "Maar wie controleert dat?", "En wat moet je dan doen?"

## TAALGEBRUIK
- Vlaams Nederlands (niet te dialect, wel herkenbaar)
- Informeel, alsof je met vrienden praat
- "Hè", "alé", "zenne", "jong" — maar niet overdrijven
- Afkortingen en spreektaal: "'t", "da's", "ge" naast "je"
- Interrumperen is GOED — maakt het levend

## SCRIPTSTRUCTUUR (~30 minuten)
1. COLD OPEN (2-3 min): Hook, grapje, persoonlijke anekdote die naar het thema leidt
2. BLOK 1 - INTRO HOOFDTHEMA (7-8 min): Wat is het probleem? Waarom nu? Eerste onthullingen
3. RUBRIEK 1 (3-4 min): Terugkerende rubriek (apart format)
4. BLOK 2 - VERDIEPING (7-8 min): Dieper in het thema, de verrassende feiten, expert-info
5. RUBRIEK 2 (3-4 min): Tweede terugkerende rubriek
6. BLOK 3 - FINALE (5-6 min): Payoff, concrete tips, "wat moet je nu doen?"
7. OUTRO (1-2 min): Afscheid, waar te vinden, socials
8. TEASER (30 sec): Wat komt volgende week?

## CLIP-MOMENTEN
Markeer exact 2 fragmenten in het script met 🎬 CLIP-MOMENT die zich perfect lenen voor social media video snippets:
- Fragment 1: Social proof / grappig moment (iets dat mensen willen delen)
- Fragment 2: Opvallend feit of "WTF"-moment (clickworthy)
Elk clipmoment moet 30-60 seconden zijn als het voorgelezen wordt.`

const SOCIAL_SYSTEM_PROMPT = `Je bent de social media redacteur van Vrolijke Vrekken (VV).

## VV-DNA voor social
- Pakkend, nieuwsgierig makend, nooit clickbait zonder payoff
- Vlaams, informeel, herkenbaar
- Denk in: wat wil iemand bewaren, doorsturen of navertellen?

## Instagram Carousel (10 slides max)
- Slide 1: Hook (pakkende vraag of stelling)
- Slide 2-8: Inhoud (feiten, tips, onthullingen — 1 per slide)
- Slide 9: Payoff / samenvatting
- Slide 10: CTA (luister de aflevering, volg ons)
Elke slide: max 2 zinnen, groot en leesbaar

## Instagram Snippet Posts (2 stuks)
Op basis van de 🎬 CLIP-MOMENTEN uit het script:
- Caption die nieuwsgierig maakt
- Context voor de viewer
- CTA naar volledige aflevering
- Relevante hashtags

## TikTok (2 stuks, op basis van clip-momenten)
- Hook (eerste 3 seconden = alles)
- Caption: kort, punchy
- Trending format suggestie

## Facebook (1 post)
- Langere copy, meer context
- Persoonlijk verhaal als haak
- Discussievraag aan het einde
- Link naar aflevering

## Newsletter blok
- Pakkende onderwerpregel
- 3-4 zinnen samenvatting die nieuwsgierig maakt
- 1 concrete tip als teaser
- CTA button tekst`

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { headline, hook, hosts, extraContext, generateType } = body

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    if (generateType === 'script') {
      // Genereer het volledige script
      const scriptResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        system: VV_SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `Schrijf een VOLLEDIG UITGESCHREVEN podcastscript voor Vrolijke Vrekken.

ONDERWERP: ${headline}
VV-HOOK: ${hook}
HOSTS: ${hosts === 'ewoud-kristof' ? 'Ewoud & Kristof' : 'Ewoud & Elke'}
${extraContext ? `EXTRA CONTEXT: ${extraContext}` : ''}

BELANGRIJK:
- Schrijf VOLLEDIG uitgeschreven dialoog, niet alleen opsommingen
- Elke regel begint met de naam van de spreker (EWOUD: / ${hosts === 'ewoud-kristof' ? 'KRISTOF' : 'ELKE'}:)
- Voeg regieopmerkingen toe tussen haakjes: (lacht), (onderbreekt), (stilte), etc.
- Markeer de 2 beste 🎬 CLIP-MOMENTEN voor social video snippets
- Markeer blokken duidelijk met headers
- Het script moet ~30 minuten duren als het voorgelezen wordt
- Bedenk ook 2 RUBRIEKEN die passen bij het thema. Mogelijke formats:
  * "Vrek of Verkwister" — situatie voorleggen, hosts debatteren
  * "De Bespaarmythe" — populair bespaartip ontkrachten of bevestigen
  * "Luisteraarsvraag" — typische vraag van een luisteraar beantwoorden
  * "Het Prijsexperiment" — prijzen raden van alledaagse producten
  * "Scam of Legit?" — iets verdachts onderzoeken
  * Of bedenk een nieuwe rubriek die past bij het onderwerp

Schrijf het volledige script nu. Begin direct met de COLD OPEN.`
        }]
      })

      const script = scriptResponse.content[0].type === 'text' ? scriptResponse.content[0].text : ''

      return NextResponse.json({ success: true, script })

    } else if (generateType === 'social') {
      // Genereer social content op basis van het script
      const { script } = body

      const socialResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: SOCIAL_SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `Genereer alle social media content voor deze VV-aflevering.

ONDERWERP: ${headline}
VV-HOOK: ${hook}

SCRIPT (voor context en clip-momenten):
${script.substring(0, 4000)}

Geef het resultaat in dit EXACT JSON format:
{
  "instagram_carousel": {
    "slides": ["slide 1 tekst", "slide 2 tekst", "..."],
    "caption": "bijschrift voor de carousel post"
  },
  "instagram_snippets": [
    {
      "clip_beschrijving": "welk fragment uit de podcast",
      "caption": "instagram caption",
      "hashtags": "#tag1 #tag2"
    },
    {
      "clip_beschrijving": "welk fragment uit de podcast",
      "caption": "instagram caption",
      "hashtags": "#tag1 #tag2"
    }
  ],
  "tiktok": [
    {
      "clip_beschrijving": "welk fragment",
      "hook_eerste_3_sec": "openingszin",
      "caption": "tiktok caption",
      "format_suggestie": "trending format"
    },
    {
      "clip_beschrijving": "welk fragment",
      "hook_eerste_3_sec": "openingszin",
      "caption": "tiktok caption",
      "format_suggestie": "trending format"
    }
  ],
  "facebook": {
    "post": "volledige facebook post",
    "discussievraag": "vraag voor engagement"
  },
  "newsletter": {
    "onderwerp": "email subject line",
    "preview_tekst": "preview tekst",
    "body": "newsletter inhoud",
    "cta_tekst": "button tekst"
  }
}

Antwoord ALLEEN met valid JSON.`
        }]
      })

      const socialText = socialResponse.content[0].type === 'text' ? socialResponse.content[0].text : ''

      let socialContent
      try {
        socialContent = JSON.parse(socialText)
      } catch {
        const jsonMatch = socialText.match(/\{[\s\S]*\}/)
        socialContent = jsonMatch ? JSON.parse(jsonMatch[0]) : null
      }

      return NextResponse.json({ success: true, social: socialContent })
    }

    return NextResponse.json({ success: false, error: 'Invalid generateType' }, { status: 400 })

  } catch (error: any) {
    console.error('Generate error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
