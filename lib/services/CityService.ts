/**
 * CityService - Handles city normalization and resolution for Czech cities
 * 
 * Features:
 * - normalize(input) → trim, collapse spaces, Title Case (ČJ safe), strip digits except PSČ
 * - resolve(input) → fuzzy prefix match against CZ cities dataset
 * - Support for Czech diacritics and postal codes
 */

export interface CityData {
  name: string
  lat: number
  lng: number
  zip?: string
}

export interface CityResolution {
  city: string
  lat: number
  lng: number
}

// Czech cities dataset with coordinates
const CZECH_CITIES: CityData[] = [
  { name: "Praha", lat: 50.0755, lng: 14.4378, zip: "11000" },
  { name: "Brno", lat: 49.1951, lng: 16.6068, zip: "60200" },
  { name: "Ostrava", lat: 49.8209, lng: 18.2625, zip: "70200" },
  { name: "Plzeň", lat: 49.7384, lng: 13.3736, zip: "30100" },
  { name: "Liberec", lat: 50.7671, lng: 15.0562, zip: "46001" },
  { name: "Olomouc", lat: 49.5938, lng: 17.2509, zip: "77900" },
  { name: "Ústí nad Labem", lat: 50.6600, lng: 14.0360, zip: "40001" },
  { name: "Hradec Králové", lat: 50.2104, lng: 15.8252, zip: "50002" },
  { name: "Pardubice", lat: 50.0343, lng: 15.7812, zip: "53002" },
  { name: "České Budějovice", lat: 48.9747, lng: 14.4743, zip: "37001" },
  { name: "Příbram", lat: 49.6900, lng: 14.0100, zip: "26101" },
  { name: "Kladno", lat: 50.1470, lng: 14.1030, zip: "27201" },
  { name: "Mladá Boleslav", lat: 50.4110, lng: 14.9030, zip: "29301" },
  { name: "Zlín", lat: 49.2264, lng: 17.6707, zip: "76001" },
  { name: "Opava", lat: 49.9400, lng: 17.8900, zip: "74601" },
  { name: "Karviná", lat: 49.8540, lng: 18.5417, zip: "73301" },
  { name: "Most", lat: 50.5030, lng: 13.6360, zip: "43401" },
  { name: "Teplice", lat: 50.6400, lng: 13.8200, zip: "41501" },
  { name: "Jihlava", lat: 49.3961, lng: 15.5912, zip: "58601" },
  { name: "Frýdek-Místek", lat: 49.6853, lng: 18.3503, zip: "73801" },
  { name: "Havířov", lat: 49.7800, lng: 18.4360, zip: "73601" },
  { name: "Karlovy Vary", lat: 50.2310, lng: 12.8712, zip: "36001" },
  { name: "Znojmo", lat: 49.2070, lng: 16.1580, zip: "67571" },
  { name: "Prostějov", lat: 49.4700, lng: 17.1100, zip: "79601" },
  { name: "Přerov", lat: 49.4550, lng: 17.4500, zip: "75002" },
  { name: "Třinec", lat: 49.6770, lng: 18.6700, zip: "73961" },
  { name: "Trutnov", lat: 50.5610, lng: 15.9130, zip: "54101" },
  { name: "Kolín", lat: 50.0270, lng: 15.2010, zip: "28002" },
  { name: "Tábor", lat: 49.4140, lng: 14.6580, zip: "39001" },
  { name: "Uherské Hradiště", lat: 49.0700, lng: 17.4600, zip: "68601" },
  { name: "Děčín", lat: 50.7820, lng: 14.2140, zip: "40501" },
  { name: "Jablonec nad Nisou", lat: 50.7240, lng: 15.1700, zip: "46601" },
  { name: "Kutná Hora", lat: 49.9490, lng: 15.2680, zip: "28401" },
  { name: "Nymburk", lat: 50.1860, lng: 15.0410, zip: "28802" },
  { name: "Mělník", lat: 50.3500, lng: 14.4740, zip: "27601" },
  { name: "Benešov", lat: 49.7820, lng: 14.6870, zip: "25601" },
  { name: "Rokycany", lat: 49.7420, lng: 13.5950, zip: "33701" },
  { name: "Domažlice", lat: 49.4400, lng: 12.9300, zip: "34401" },
  { name: "Klatovy", lat: 49.3950, lng: 13.2930, zip: "33901" },
  { name: "Sušice", lat: 49.2310, lng: 13.5200, zip: "34201" },
  { name: "Strakonice", lat: 49.2610, lng: 13.9010, zip: "38601" },
  { name: "Písek", lat: 49.3080, lng: 14.1470, zip: "39701" },
  { name: "Pelhřimov", lat: 49.4310, lng: 15.2230, zip: "39301" },
  { name: "Havlíčkův Brod", lat: 49.6060, lng: 15.5800, zip: "58001" },
  { name: "Třebíč", lat: 49.2140, lng: 15.8810, zip: "67401" },
  { name: "Žďár nad Sázavou", lat: 49.5620, lng: 15.9390, zip: "59101" },
  { name: "Nové Město na Moravě", lat: 49.5610, lng: 16.0750, zip: "59231" },
  { name: "Bystřice nad Pernštejnem", lat: 49.5220, lng: 16.2610, zip: "59301" },
  { name: "Velké Meziříčí", lat: 49.3550, lng: 16.0120, zip: "59401" },
  { name: "Moravské Budějovice", lat: 49.0520, lng: 15.8080, zip: "67602" },
  { name: "Jaroměřice nad Rokytnou", lat: 49.0940, lng: 15.8930, zip: "67551" },
  { name: "Náměšť nad Oslavou", lat: 49.2070, lng: 16.1580, zip: "67571" },
  { name: "Hrotovice", lat: 49.1070, lng: 16.0600, zip: "67555" },
  { name: "Konice", lat: 49.5900, lng: 16.8880, zip: "79852" },
  { name: "Litovel", lat: 49.7010, lng: 17.0750, zip: "78401" },
  { name: "Uničov", lat: 49.7700, lng: 17.1210, zip: "78391" },
  { name: "Šumperk", lat: 49.9650, lng: 16.9700, zip: "78701" },
  { name: "Jeseník", lat: 50.2290, lng: 17.2040, zip: "79001" },
  { name: "Krnov", lat: 50.0890, lng: 17.7030, zip: "79401" },
  { name: "Bruntál", lat: 49.9880, lng: 17.4640, zip: "79201" },
  { name: "Vítkov", lat: 49.7740, lng: 17.7500, zip: "74901" },
  { name: "Odry", lat: 49.6620, lng: 17.8300, zip: "74235" },
  { name: "Nový Jičín", lat: 49.5940, lng: 18.0100, zip: "74101" },
  { name: "Kopřivnice", lat: 49.5990, lng: 18.1440, zip: "74221" },
  { name: "Frenštát pod Radhoštěm", lat: 49.5480, lng: 18.2100, zip: "74401" },
  { name: "Valašské Meziříčí", lat: 49.4710, lng: 17.9710, zip: "75701" },
  { name: "Vsetín", lat: 49.3380, lng: 17.9960, zip: "75501" },
  { name: "Rožnov pod Radhoštěm", lat: 49.4580, lng: 18.1430, zip: "75661" },
  { name: "Bystřice pod Hostýnem", lat: 49.3990, lng: 17.6740, zip: "76861" },
  { name: "Holešov", lat: 49.3330, lng: 17.5780, zip: "76901" },
  { name: "Uherský Brod", lat: 49.0250, lng: 17.6470, zip: "68801" },
  { name: "Veselí nad Moravou", lat: 48.9530, lng: 17.3760, zip: "69801" },
  { name: "Strážnice", lat: 48.9010, lng: 17.3160, zip: "69662" },
  { name: "Kyjov", lat: 49.0100, lng: 17.1220, zip: "69701" },
  { name: "Veselí nad Lužnicí", lat: 49.1850, lng: 14.6970, zip: "39181" },
  { name: "Soběslav", lat: 49.2600, lng: 14.7180, zip: "39201" },
  { name: "Sezimovo Ústí", lat: 49.3850, lng: 14.6840, zip: "39102" },
  { name: "Planá nad Lužnicí", lat: 49.3540, lng: 14.7010, zip: "39111" },
  { name: "Bechyně", lat: 49.2950, lng: 14.4680, zip: "39165" },
  { name: "Milevsko", lat: 49.4500, lng: 14.3600, zip: "39901" },
  { name: "Blatná", lat: 49.4240, lng: 13.8810, zip: "38801" },
  { name: "Vodňany", lat: 49.1470, lng: 14.1750, zip: "38901" },
  { name: "Netolice", lat: 49.0490, lng: 14.1970, zip: "38411" },
  { name: "Prachatice", lat: 49.0130, lng: 13.9970, zip: "38301" },
  { name: "Vimperk", lat: 49.0550, lng: 13.7740, zip: "38501" },
  { name: "Volary", lat: 48.9100, lng: 13.8860, zip: "38451" },
  { name: "Kaplice", lat: 48.7380, lng: 14.4960, zip: "38241" },
  { name: "Trhové Sviny", lat: 48.8420, lng: 14.6390, zip: "37401" },
  { name: "Borovany", lat: 48.8980, lng: 14.6420, zip: "37312" },
  { name: "Lomnice nad Lužnicí", lat: 49.0850, lng: 14.7170, zip: "37816" },
  { name: "Suchdol nad Lužnicí", lat: 48.8900, lng: 14.8770, zip: "37806" },
  { name: "Třeboň", lat: 49.0030, lng: 14.7700, zip: "37901" },
  { name: "Dačice", lat: 49.0810, lng: 15.4370, zip: "38001" },
  { name: "Slavonice", lat: 48.9970, lng: 15.3510, zip: "37881" },
  { name: "Nové Hrady", lat: 48.7890, lng: 14.7780, zip: "37333" },
  { name: "Velešín", lat: 48.8290, lng: 14.4620, zip: "38232" },
  { name: "Frymburk", lat: 48.6600, lng: 14.1650, zip: "38279" },
  { name: "Lipno nad Vltavou", lat: 48.6400, lng: 14.2360, zip: "38278" },
  { name: "Vyšší Brod", lat: 48.6160, lng: 14.3110, zip: "38273" },
  { name: "Rožmberk nad Vltavou", lat: 48.6550, lng: 14.3650, zip: "38218" },
  { name: "Horní Planá", lat: 48.7670, lng: 14.0320, zip: "38226" },
  { name: "Černá v Pošumaví", lat: 48.7380, lng: 14.1100, zip: "38223" },
  { name: "Horní Dvořiště", lat: 48.6160, lng: 14.4100, zip: "38293" },
  { name: "Dolní Dvořiště", lat: 48.6560, lng: 14.4510, zip: "38272" },
  { name: "Malonty", lat: 48.6860, lng: 14.5760, zip: "38241" },
  { name: "Benešov nad Černou", lat: 48.7290, lng: 14.6270, zip: "38282" },
  { name: "Besednice", lat: 48.7890, lng: 14.5560, zip: "38281" },
  { name: "Chvalšiny", lat: 48.8540, lng: 14.2110, zip: "38208" },
  { name: "Křemže", lat: 48.9040, lng: 14.3060, zip: "38203" },
  { name: "Zlatá Koruna", lat: 48.8540, lng: 14.3690, zip: "38101" },
  { name: "Zubčice", lat: 48.8290, lng: 14.4620, zip: "38232" },
  { name: "Kájov", lat: 48.8100, lng: 14.2580, zip: "38101" },
  { name: "Plešovice", lat: 48.8670, lng: 14.3110, zip: "38101" },
  { name: "Přídolí", lat: 48.7830, lng: 14.3500, zip: "38101" },
  { name: "Přísečná", lat: 48.7960, lng: 14.3110, zip: "38101" },
  { name: "Slupenec", lat: 48.8330, lng: 14.3110, zip: "38101" },
  { name: "Větřní", lat: 48.7830, lng: 14.2860, zip: "38101" },
  { name: "Všemyslice", lat: 48.8670, lng: 14.3110, zip: "38101" }
]

export class CityService {
  /**
   * Normalize city input: trim, collapse spaces, Title Case (ČJ safe), strip digits except PSČ
   */
  static normalize(input: string): string {
    if (!input || typeof input !== 'string') {
      return ''
    }

    // Trim and collapse multiple spaces into single space
    let normalized = input.trim().replace(/\s+/g, ' ')
    
    // Remove all digits except postal codes (5-digit numbers)
    // Keep postal codes (5 digits) but remove other numbers
    normalized = normalized.replace(/\b\d{1,4}\b/g, '') // Remove 1-4 digit numbers
    normalized = normalized.replace(/\b\d{6,}\b/g, '')  // Remove 6+ digit numbers
    normalized = normalized.replace(/\s+/g, ' ')         // Clean up extra spaces again
    
    // Title Case with Czech diacritics support
    // First, preserve Czech diacritics by mapping them temporarily
    const czechDiacritics: { [key: string]: string } = {
      'ú': '___U___', 'Ú': '___U_CAP___',
      'é': '___E___', 'É': '___E_CAP___', 
      'í': '___I___', 'Í': '___I_CAP___',
      'ó': '___O___', 'Ó': '___O_CAP___',
      'á': '___A___', 'Á': '___A_CAP___',
      'ý': '___Y___', 'Ý': '___Y_CAP___',
      'č': '___C___', 'Č': '___C_CAP___',
      'ď': '___D___', 'Ď': '___D_CAP___',
      'ě': '___E2___', 'Ě': '___E2_CAP___',
      'ň': '___N___', 'Ň': '___N_CAP___',
      'ř': '___R___', 'Ř': '___R_CAP___',
      'š': '___S___', 'Š': '___S_CAP___',
      'ť': '___T___', 'Ť': '___T_CAP___',
      'ů': '___U2___', 'Ů': '___U2_CAP___',
      'ž': '___Z___', 'Ž': '___Z_CAP___'
    }
    
    // Replace Czech diacritics with placeholders
    for (const [diacritic, placeholder] of Object.entries(czechDiacritics)) {
      normalized = normalized.replace(new RegExp(diacritic, 'g'), placeholder)
    }
    
    // Apply title case
    normalized = normalized.replace(/\b\w/g, (char) => char.toUpperCase())
    
    // Restore Czech diacritics
    for (const [diacritic, placeholder] of Object.entries(czechDiacritics)) {
      normalized = normalized.replace(new RegExp(placeholder, 'g'), diacritic)
    }
    
    return normalized.trim()
  }

  /**
   * Resolve city input to coordinates using fuzzy prefix matching
   * Returns {city, lat, lng} or null if no match found
   */
  static resolve(input: string): CityResolution | null {
    if (!input || typeof input !== 'string') {
      return null
    }
    try {
      // Prefer new gazetteer-based normalization if available (sync wrapper)
      // Note: normalizePlace is async; provide a minimal sync fallback here using existing list
      const normalizedInput = this.normalize(input).toLowerCase()
      let match = CZECH_CITIES.find(city => city.name.toLowerCase() === normalizedInput)
      if (!match) {
        match = CZECH_CITIES.find(city => city.name.toLowerCase().startsWith(normalizedInput))
          || CZECH_CITIES.find(city => normalizedInput.startsWith(city.name.toLowerCase()))
          || CZECH_CITIES.find(city => city.name.toLowerCase().includes(normalizedInput))
          || null as any
      }
      if (match) {
        return { city: match.name, lat: match.lat, lng: match.lng }
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Get all cities for autocomplete suggestions
   */
  static getAllCities(): CityData[] {
    return [...CZECH_CITIES]
  }

  /**
   * Search cities for autocomplete (returns max 8 results)
   */
  static searchCities(query: string, limit: number = 8): CityData[] {
    if (!query || query.length < 1) {
      return CZECH_CITIES.slice(0, limit)
    }

    const normalizedQuery = query.toLowerCase()
    
    const matches = CZECH_CITIES.filter(city => 
      city.name.toLowerCase().includes(normalizedQuery)
    ).slice(0, limit)

    return matches
  }

  /**
   * Find nearest city to given coordinates
   */
  static findNearestCity(lat: number, lng: number): CityResolution | null {
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return null
    }

    let nearestCity: CityData | null = null
    let minDistance = Infinity

    for (const city of CZECH_CITIES) {
      const distance = Math.sqrt(
        Math.pow(city.lat - lat, 2) + Math.pow(city.lng - lng, 2)
      )
      
      if (distance < minDistance) {
        minDistance = distance
        nearestCity = city
      }
    }

    if (nearestCity) {
      return {
        city: nearestCity.name,
        lat: nearestCity.lat,
        lng: nearestCity.lng
      }
    }

    return null
  }
}
