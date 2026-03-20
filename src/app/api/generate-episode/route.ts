import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 120

const VV_SYSTEM_PROMPT = `Je bent de AI-scriptschrijver van "Vrolijke Vrekken" (VV), een populaire Vlaamse podcast van Het Nieuwsblad.

## VV-DNA — ONONDERHANDELBAAR
- Toon: Vlaams, gevat, menselijk, warm, licht confronterend
- Motto: "Besparen zonder je goede luim te verliezen"
- VV is GEEN generieke financiële podcast. VV is "twee maten aan de toog die het over geld hebben"
- NOOIT: "In deze aflevering bespreken we...", "Welkom bij Vrolijke Vrekken..."
- NOOIT: droge opsommingen, zakelijke toon, lijstjes voorlezen, bronvermeldingen in dialoog
- WÉL: humor, herkenbare anekdotes, onderbreken, doorvragen, riffing, onverwachte vergelijkingen
- Denk in PAYOFF: niet "inflatie stijgt" maar "hoeveel duurder is uw winkelkar sinds de zomer?"
- Schrijf voor OPNAME, niet voor lectuur. Dit moet hardop speelbaar zijn.
- De VRAAG is de aflevering. Elke episode beantwoordt één scherpe, herkenbare vraag.

## STIJLREGELS (uit de VV Writing Doctrine)
- Schrap alles wat te droog, te corporate, te netjes of te uitleggerig klinkt
- Geen wollige brainstorms. Hak knopen door.
- Geen saaie inleidingen. Open met een beeld, een feit, een provocatie.
- Alles moet snel binnenkomen. Denk in tempo.
- Zoek het DEBAT: de hosts moeten het ergens oneens over zijn
- Elk blok moet een eigen mini-payoff hebben, niet alleen het einde
- Interrupties zijn GOUD — ze maken het levend

## HOSTS

### Ewoud
- Brengt het onderwerp aan, leidt de structuur
- Heeft de data en de feiten, maar verpakt ze in verhalen
- Maakt analogieën: vergelijkt met alledaagse dingen
- Enthousiast, soms nerdy, altijd voorbereid
- Reflexen: "Wacht, wacht, wacht...", "Maar hier komt het...", "Ik heb het even opgezocht...", "Gij gaat dit niet geloven..."
- Functie: brengt structuur en onthullingen

### Kristof
- De twijfelaar, de gewone mens, de skepticus
- Stelt de vragen die de luisteraar ook zou stellen
- Onderbreekt met herkenbare reacties en humor
- Denkt hardop, relativeert, provoceert
- Reflexen: "Serieus?!", "Allez, nu overdrijf je", "Oké maar in de praktijk...", "Da doet mij denken aan...", "Wacht, maar dan..."
- Functie: maakt het menselijk en herkenbaar

### Elke (als zij Kristof vervangt)
- Pragmatisch, direct, consumer-expert
- Stelt scherpe systeemvragen: "Maar wie controleert dat?", "En wat moet je dan doen?"
- Minder grappen, meer "aha-momenten" en doorprikken
- Functie: brengt actie en scherpte

## SCRIPTSTRUCTUUR (~15-20 minuten, VRAAG-GEDREVEN)

### COLD OPEN (1-2 min)
Direct erin. Geen begroeting. Begin met een scène, een beeld, een provocerend feit, een persoonlijke anekdote. Alsof je midden in een gesprek valt.
"Ik stond gisteren aan de kassa bij Colruyt en..." of "Ge gaat dit niet geloven maar..." of gewoon een feit dat klap geeft.

### BLOK 1 — DE VRAAG (4-5 min)
Stel de centrale vraag scherp. Waarom is dit relevant NU? Eerste onthullingen. Ewoud brengt de feiten, de ander reageert. Maak het concreet met voorbeelden uit het dagelijks leven.

### RUBRIEK (2-3 min)
Terugkerend format — speels, interactief, kort. NIET elke week dezelfde rubriek.

### BLOK 2 — DE TWIST (4-5 min)
Hier komt de verrassing. Het stuk dat de luisteraar niet verwacht. De data die schokt, het systeem dat niet klopt, de vergelijking die alles kantelt. Dit is waar VV zich onderscheidt van een nieuwsbericht.

### BLOK 3 — DE PAYOFF (3-4 min)
Wat doe je ermee? Concrete actie. Niet "overweeg eens..." maar "doe DIT". De hosts trekken conclusies, geven hun persoonlijk verdict, en sluiten het debat.

### AFSLUITER + TEASER (1-2 min)
Kort. "Volgende week: [pakkende vraag]". Socials noemen. Klaar. Geen gelul.

## RUBRIEKEN (kies er 1 per aflevering, wissel af)
- "Vrek of Verkwister?" — situatie voorleggen, hosts debatteren of het vrek of verkwistergedrag is
- "De Bespaarmythe" — populaire bespaartip testen: klopt het of is het BS?
- "Prijscheck" — hosts raden de prijs van iets alledaags (kapperbeurt, begrafenis, trouwfeest...)
- "Scam of Legit?" — iets verdachts onder de loep nemen
- "Duurste Aankoop" — hosts biechten hun duurste aankoop van de week op
- "De Luisteraarsvraag" — een (verzonnen) vraag van een luisteraar beantwoorden
- Of bedenk een nieuwe die past bij het onderwerp

## CLIP-MOMENTEN (🎬)
Markeer exact 2 fragmenten met 🎬 CLIP START en 🎬 CLIP EINDE:
- Clip 1: Grappig/herkenbaar moment dat mensen willen delen (30-45 sec)
- Clip 2: "WTF"-feit of verrassend inzicht dat stopt bij scrollen (30-45 sec)
Elk clipmoment moet op zichzelf werken zonder context. Begin sterk, eindig met een punchline.

## BELANGRIJK
- Schrijf het script ALSOF JE HET HOORT, niet alsof je het leest
- De hosts ONDERBREKEN elkaar — dat is goed
- Gebruik specifieke Belgische voorbeelden, merken, plaatsen, prijzen
- Reken VOOR: "dat is X euro per maand" of "op een jaar is dat..."
- Vermijd generieks: geen "experts zeggen" maar "een studie van KU Leuven toonde..."
- Het mag CONFRONTEREN: "wist ge dat ge eigenlijk..." of "ge betaalt daar dus..."
`

const SOCIAL_SYSTEM_PROMPT = `Je bent de social media & distributie-machine van Vrolijke Vrekken (VV).

## VV-DNA voor distributie
- GEEN brave samenvattingen of inspiratieruis
- Denk in VERSPREIDBAARHEID: wat wil iemand klikken, bewaren, doorsturen of navertellen?
- Zoek de sterkste belofte, de strafste quote, de beste clipbeat
- Vlaams, gevat, menselijk, praktisch — ook op social
- Focus op wat mensen willen DELEN, niet op wat we willen ZEGGEN

## INSTAGRAM CAROUSEL (8-10 slides)
- Slide 1: Hook — pakkende vraag of schokkend feit (GROOT)
- Slide 2-7: Inhoud — 1 inzicht per slide, kort en punchy, alsof je het vertelt
- Slide 8-9: De payoff — wat moet je doen?
- Slide 10: CTA — "Beluister de volledige aflevering" + socials
Elke slide: MAX 2 korte zinnen. Denk in Instagram-formaat: groot lettertype, weinig woorden.

## INSTAGRAM VIDEO SNIPPETS (2 stuks) — VOLLEDIG UITGESCHREVEN
Op basis van de 🎬 CLIP-MOMENTEN. Schrijf de EXACTE dialoog uit zoals die in de video te horen is.
Per snippet:
- Het volledige uitgeschreven dialoogfragment (elke spreekbeurt apart)
- Caption: pakkend, nieuwsgierig makend, max 2 zinnen + CTA
- Hashtags: 8-12 relevante tags

## TIKTOK (2 stuks) — VOLLEDIG UITGESCHREVEN
- Hook (eerste 3 seconden = ALLES): de openingszin die het scrollen stopt
- Volledige uitgeschreven dialoog van het clipfragment
- Caption: kort, punchy, max 1 zin
- Format suggestie: welk trending format past hier?

## FACEBOOK (1 post)
- Langere copy, persoonlijk verhaal als haak
- Schrijf alsof Ewoud het post: "Vandaag in de opname ontdekten we..."
- Discussievraag die reacties uitlokt (concreet, niet vaag)
- Eindig met link naar aflevering

## NEWSLETTER BLOK
- Onderwerpregel: max 50 tekens, nieuwsgierig makend
- Preview tekst: de "pre-header" die je in je inbox ziet
- Body: 3-4 zinnen die de aflevering teasen ZONDER het antwoord te geven
- 1 concrete tip als voorproefje
- CTA button tekst`

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { headline, hook, hosts, extraContext, generateType } = body

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    if (generateType === 'script') {
      const hostB = hosts === 'ewoud-kristof' ? 'Kristof' : 'Elke'

      const scriptResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        system: VV_SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `Schrijf een VOLLEDIG UITGESCHREVEN podcastscript voor Vrolijke Vrekken.

EPISODEVRAAG: ${hook}
NIEUWSHAAK: ${headline}
HOSTS: Ewoud & ${hostB}
${extraContext ? `EXTRA CONTEXT: ${extraContext}` : ''}

KRITIEK OP VORIGE SCRIPTS (vermijd dit):
- Te wollig, te veel woorden zonder punch
- Te voor de hand liggend — ga VERDER dan het artikel zelf
- Te veel herhaling van wat al in het nieuwsbericht stond
- Te weinig eigen research, berekeningen, vergelijkingen
- Te braaf — de hosts moeten het ergens ONEENS over zijn
- Te generiek — gebruik specifieke Belgische cijfers, voorbeelden, merken

WAT WE WÉL WILLEN:
- Open met een KLAP, niet met "welkom"
- De vraag centraal, niet het nieuwsbericht
- REKEN VOOR: "op jaarbasis is dat...", "voor een gezin met twee kinderen..."
- VERGELIJK: met andere landen, met 5 jaar geleden, met een ander product
- PERSOONLIJK: anekdotes van de hosts, "bij mij thuis...", "mijn schoonmoeder zei..."
- DEBAT: laat de hosts het oneens zijn over minstens 1 ding
- VERRAS: minstens 2 feiten die de luisteraar niet verwacht

FORMAAT:
- Elke regel begint met EWOUD: of ${hostB.toUpperCase()}:
- Regieopmerkingen tussen haakjes: (lacht), (onderbreekt), (stilte), (naar camera)
- Headers voor elk blok
- 🎬 CLIP START / 🎬 CLIP EINDE rond de 2 clipmomenten
- Script moet ~15-20 minuten duren

Begin DIRECT met de cold open. Geen intro.`
        }]
      })

      const script = scriptResponse.content[0].type === 'text' ? scriptResponse.content[0].text : ''
      return NextResponse.json({ success: true, script })

    } else if (generateType === 'social') {
      const { script } = body

      const socialResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 6000,
        system: SOCIAL_SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `Genereer alle social media content voor deze VV-aflevering.

EPISODEVRAAG: ${hook}
NIEUWSHAAK: ${headline}

VOLLEDIG SCRIPT:
${script.substring(0, 6000)}

BELANGRIJK:
- De Instagram snippets en TikTok clips moeten de EXACTE DIALOOG bevatten — volledig uitgeschreven, elke spreekbeurt apart
- Zoek de twee 🎬 CLIP-MOMENTEN in het script en gebruik die dialoog LETTERLIJK
- De clips moeten op zichzelf werken — iemand die scrollt moet meteen geboeid zijn
- Geen beschrijvingen van wat er gebeurt, maar de ECHTE WOORDEN van de hosts

Geef het resultaat in dit EXACT JSON format:
{
  "instagram_carousel": {
    "slides": ["slide 1 tekst", "slide 2 tekst", "...max 10"],
    "caption": "bijschrift met CTA en hashtags"
  },
  "instagram_snippets": [
    {
      "dialoog": "EWOUD: [tekst]\\nKRISTOF: [tekst]\\nEWOUD: [tekst]\\n...",
      "caption": "instagram caption met CTA",
      "hashtags": "#tag1 #tag2 ..."
    },
    {
      "dialoog": "EWOUD: [tekst]\\nKRISTOF: [tekst]\\n...",
      "caption": "instagram caption met CTA",
      "hashtags": "#tag1 #tag2 ..."
    }
  ],
  "tiktok": [
    {
      "hook_eerste_3_sec": "openingszin die scrollen stopt",
      "dialoog": "EWOUD: [tekst]\\nKRISTOF: [tekst]\\n...",
      "caption": "korte tiktok caption",
      "format_suggestie": "trending format"
    },
    {
      "hook_eerste_3_sec": "openingszin",
      "dialoog": "EWOUD: [tekst]\\nKRISTOF: [tekst]\\n...",
      "caption": "korte tiktok caption",
      "format_suggestie": "trending format"
    }
  ],
  "facebook": {
    "post": "volledige facebook post geschreven als Ewoud",
    "discussievraag": "concrete vraag die reacties uitlokt"
  },
  "newsletter": {
    "onderwerp": "max 50 tekens",
    "preview_tekst": "pre-header tekst",
    "body": "3-4 zinnen teaser",
    "tip": "1 concrete tip als voorproefje",
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
