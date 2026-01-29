# Levý sloupec "Doporučení" - Design a UX logika

## Filozofie

**Bibia jako asistent, ne katalog:**
- Levý sloupec není seznam produktů, ale doporučení od asistenta
- První terapeut je "nejlepší shoda" - Bibia ho doporučuje jako první volbu
- Ostatní terapeuti jsou "vhodné alternativy" - další možnosti, pokud první nevyhovuje
- Žádná čísla, procenta, skóre - pouze lidské doporučení

## Struktura komponenty

### RecommendationsColumn
**Úloha:** Zobrazit seznam doporučených terapeutů s jasnou hierarchií

**Props:**
```typescript
interface RecommendationsColumnProps {
  therapists: Therapist[]  // Seřazení podle match_score (nejlepší první)
  selectedTherapistId: string | null
  onTherapistSelect: (id: string) => void
}
```

**Logika:**
- První terapeut v seznamu = index 0 = "Nejlepší shoda"
- Všichni ostatní = "Vhodná alternativa"
- Automaticky se vybere první terapeut při načtení
- Kliknutí na kartu pouze aktualizuje `selectedTherapistId`

---

## Struktura karty terapeuta

### RecommendationCard
**Úloha:** Kompaktní karta pro přepínání mezi terapeuty

**Props:**
```typescript
interface RecommendationCardProps {
  therapist: Therapist
  index: number  // 0 = nejlepší shoda, >0 = alternativa
  isSelected: boolean
  onClick: () => void
}
```

**Obsah karty (shora dolů):**

1. **Badge doporučení** (volitelné, pouze pokud index === 0)
   - Text: "Nejlepší shoda"
   - Styl: jemný, nenápadný
   - Zobrazuje se pouze u prvního terapeuta

2. **Jméno terapeuta**
   - Formát: "MUDr. Jan Novák" (bez čárek po titulech)
   - Velikost: střední, čitelné
   - Hlavní identifikátor

3. **Specializace** (1 řádek)
   - Formát: "Fyzioterapie – bolest zad, sportovní zranění"
   - Zkrácení: pokud je delší, použít `line-clamp-1` nebo zkrácení
   - Lidský, srozumitelný text (ne technické názvy)

4. **Vizuální indikátor výběru**
   - Aktivní karta: jemné barevné pozadí (např. seafoam-50)
   - Neaktivní: bílé pozadí
   - Border: aktivní karta má jemnější border nebo zvýraznění

**Žádné:**
- ❌ Procenta shody
- ❌ Match score
- ❌ Čísla, skóre
- ❌ Vzdálenost (ta je v detailu)
- ❌ Availability badge (ta je v detailu)
- ❌ Avatar (zbytečné pro přepínání)

---

## UX logika

### Automatický výběr
```typescript
// Po načtení výsledků
const sortedTherapists = [...therapists].sort((a, b) => {
  const scoreA = a.match_score || 0
  const scoreB = b.match_score || 0
  return scoreB - scoreA  // Nejlepší první
})

// Automaticky vybrat první
setSelectedTherapistId(sortedTherapists[0].id)
```

### Přepínání
```typescript
// Kliknutí na kartu
const handleCardClick = (therapistId: string) => {
  setSelectedTherapistId(therapistId)
  // Žádná navigace, žádný reload
  // Pouze aktualizace state → aktualizace hlavního panelu
}
```

### Badge logika
```typescript
const getRecommendationBadge = (index: number) => {
  if (index === 0) {
    return { text: 'Nejlepší shoda', type: 'best' }
  }
  return { text: 'Vhodná alternativa', type: 'alternative' }
}
```

---

## Data flow

```
1. Načtení výsledků z API
   ↓
2. Seřazení podle match_score (nejlepší první)
   ↓
3. Automatický výběr prvního terapeuta
   ↓
4. Zobrazení seznamu karet:
   - Karta 0: Badge "Nejlepší shoda" + zvýraznění
   - Karty 1+: Badge "Vhodná alternativa" (volitelné)
   ↓
5. User klikne na jinou kartu
   ↓
6. Aktualizace selectedTherapistId
   ↓
7. Aktualizace zvýraznění karet
   ↓
8. Aktualizace hlavního panelu (detail terapeuta)
```

---

## Formátování specializace

### Funkce pro formátování
```typescript
function getCompactSpecialization(therapist: Therapist): string {
  const specialties = therapist.specialties || therapist.modalities || []
  
  if (specialties.length === 0) {
    return 'Fyzioterapeut'
  }
  
  // Použít existující formatSpecializations, ale zkrátit na 1 řádek
  const formatted = formatSpecializations(specialties)
  
  // Zkrácení pokud je příliš dlouhé (např. max 50 znaků)
  if (formatted.length > 50) {
    return formatted.substring(0, 47) + '...'
  }
  
  return formatted
}
```

**Příklady:**
- "Fyzioterapie – bolest zad, sportovní zranění"
- "Manuální terapie – krční páteř"
- "Fyzioterapeut" (fallback)

---

## Vizuální hierarchie

### Aktivní karta
- Pozadí: `bg-seafoam-50` (jemná seafoam barva)
- Border: `border-seafoam-200` nebo `border-seafoam-300`
- Stín: jemný shadow-sm
- Zvýraznění: jemné, ne agresivní

### Neaktivní karta
- Pozadí: `bg-white`
- Border: `border-gray-200`
- Hover: `hover:bg-gray-50` nebo `hover:border-gray-300`

### Badge "Nejlepší shoda"
- Styl: jemný, nenápadný
- Barva: seafoam nebo zelená (pozitivní, ale ne agresivní)
- Velikost: malá, ne dominantní

### Badge "Vhodná alternativa"
- Styl: ještě jemnější než "Nejlepší shoda"
- Barva: šedá nebo neutrální
- Volitelné: může být skrytý, pokud je to příliš rušivé

---

## Interakce

### Kliknutí
- Karta je kliknutelná celá
- Cursor: pointer
- Žádná navigace, žádný reload
- Okamžitá aktualizace (pokud jsou data již načtená)

### Scrollování
- Seznam je scrollovatelný
- Aktivní karta zůstává viditelná (volitelné: auto-scroll k aktivní kartě)

### Keyboard navigation (volitelné)
- Arrow keys pro přepínání
- Enter pro výběr
- Tab pro navigaci mezi kartami

---

## Empty states

### Žádní terapeuti
- Zobrazit zprávu: "Nenašli jsme žádné terapeuty"
- CTA: "Zkusit znovu" nebo "Upravit dotazník"

### Loading
- Skeleton cards nebo loading spinner
- Počet skeletonů: 3-5

---

## Responsive chování

### Desktop (>1024px)
- Fixní šířka levého sloupce (např. 320px nebo 30% šířky)
- Scrollovatelný seznam

### Tablet (768px - 1024px)
- Možnost skrýt/zobrazit levý sloupec (toggle button)
- Nebo zůstat split layout

### Mobile (<768px)
- Stack layout: seznam nahoře, detail dole
- Nebo modal overlay pro detail

---

## Implementační poznámky

### Komponenty
- `RecommendationsColumn` - hlavní komponenta sloupce
- `RecommendationCard` - karta jednoho terapeuta
- `RecommendationBadge` - badge "Nejlepší shoda" / "Vhodná alternativa"

### State management
- Použít React useState pro `selectedTherapistId`
- State je v parent komponentě (`ResultsPageSplit`)

### Performance
- Virtualizace pro dlouhé seznamy (volitelné, pokud >50 terapeutů)
- Memoizace karet pro optimalizaci re-renderů

---

## Příklady textů

### Badge
- "Nejlepší shoda" (pro první terapeuta)
- "Vhodná alternativa" (pro ostatní, volitelné)

### Specializace
- "Fyzioterapie – bolest zad, sportovní zranění"
- "Manuální terapie – krční páteř, rameno"
- "Fyzioterapie" (fallback)

### Empty state
- "Nenašli jsme žádné terapeuty, kteří by odpovídali vašim kritériím"
- "Zkuste upravit dotazník nebo rozšířit vyhledávání"



