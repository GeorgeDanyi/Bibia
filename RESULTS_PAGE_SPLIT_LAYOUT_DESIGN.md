# Results Page - Split Layout Design

## Struktura stránky

### Hlavní layout
```
┌─────────────────────────────────────────────────────────┐
│                    Results Page                          │
│  ┌──────────────┐  ┌────────────────────────────────┐ │
│  │              │  │                                  │ │
│  │  Levý sloupec │  │    Hlavní panel (Detail)        │ │
│  │  (Seznam)     │  │                                  │ │
│  │              │  │                                  │ │
│  │  - Terapeut 1 │  │  [Detail vybraného terapeuta]   │ │
│  │  - Terapeut 2 │  │                                  │ │
│  │  - Terapeut 3 │  │                                  │ │
│  │  ...          │  │                                  │ │
│  │              │  │                                  │ │
│  └──────────────┘  └────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Komponenty

### 1. ResultsPageSplit (hlavní komponenta)
**Úloha:** Orchestrace split layoutu a state managementu

**State:**
- `therapists: Therapist[]` - seznam všech terapeutů z výsledků
- `selectedTherapistId: string | null` - ID aktuálně vybraného terapeuta
- `results: SearchResult | null` - kompletní výsledky z API

**Logika:**
- Po načtení výsledků automaticky vybere terapeuta s nejvyšším `match_score`
- Při změně `selectedTherapistId` se aktualizuje obsah hlavního panelu
- Žádná navigace - vše se děje na jedné stránce

**Props/Data flow:**
- Načte výsledky z API (stejně jako současná results page)
- Předá data do levého sloupce (seznam) a hlavního panelu (detail)

---

### 2. TherapistListColumn (levý sloupec)
**Úloha:** Zobrazit kompaktní seznam terapeutů

**Props:**
- `therapists: Therapist[]`
- `selectedTherapistId: string | null`
- `onTherapistSelect: (id: string) => void`

**Obsah:**
- Kompaktní karty terapeutů (vertikální seznam)
- Každá karta obsahuje:
  - Avatar/initials
  - Jméno
  - Město + vzdálenost
  - Match score badge (nenápadný)
  - Availability badge
  - Indikátor výběru (highlight když je vybraný)

**Interakce:**
- Kliknutí na kartu → zavolá `onTherapistSelect(therapist.id)`
- Žádná navigace, pouze změna state

**Styling (koncept):**
- Kompaktní karty (menší než současné)
- Scrollovatelný seznam
- Highlight vybrané karty
- Hover efekty

---

### 3. TherapistDetailPanel (hlavní panel)
**Úloha:** Zobrazit detail vybraného terapeuta

**Props:**
- `therapist: Therapist | null`
- `matchScore: number | null`

**Obsah:**
- Stejný obsah jako současná detail stránka (`/therapists/[id]`):
  - Hero card (jméno, specializace, lokace)
  - Stats card (praxe, pacienti, recenze)
  - About card (bio)
  - InfoTabsCard (Dostupnost s kalendářem)
  - SideInfoCard slider (Praktické informace, Cena, Jazyky, Pojišťovny)

**Stavy:**
- `therapist === null` → Empty state ("Vyberte terapeuta ze seznamu")
- `therapist !== null` → Zobrazí detail

**Interakce:**
- Všechny interakce zůstávají stejné jako na detail stránce
- CTA "Požádat o termín" funguje stejně
- Žádná navigace mimo stránku

---

## Data flow

```
1. User dokončí dotazník
   ↓
2. ResultsPageSplit načte výsledky z API
   ↓
3. Automaticky vybere terapeuta s nejvyšším match_score
   ↓
4. TherapistListColumn zobrazí seznam (s highlightem na prvním)
   ↓
5. TherapistDetailPanel zobrazí detail prvního terapeuta
   ↓
6. User klikne na jiného terapeuta v seznamu
   ↓
7. onTherapistSelect aktualizuje selectedTherapistId
   ↓
8. TherapistDetailPanel se aktualizuje s novým terapeutem
   ↓
9. TherapistListColumn aktualizuje highlight
```

---

## UX logika

### Automatický výběr
- Po načtení: `selectedTherapistId = therapists[0].id` (nejlepší match)
- Pokud není žádný terapeut: `selectedTherapistId = null`

### Přepínání terapeutů
- Kliknutí na kartu → okamžitá změna (bez loading state, pokud jsou data již načtená)
- Smooth transition v hlavním panelu (volitelné)

### Empty states
- Žádní terapeuti → zobrazit zprávu "Nenašli jsme žádné terapeuty"
- Nevybraný terapeut → zobrazit "Vyberte terapeuta ze seznamu vlevo"

### Responsive chování
- Desktop: Split layout (30% / 70% nebo 35% / 65%)
- Tablet: Split layout s možností skrýt levý sloupec
- Mobile: Stack layout (seznam nahoře, detail dole) nebo modal overlay

---

## Komponenty k převzetí/reuse

### Z existující detail stránky:
- `TherapistHeroCard`
- `StatsCard`
- `AboutCard`
- `InfoTabsCard`
- `InfoSlider` (pro side info cards)
- `RequestAppointmentModal`

### Nové komponenty:
- `TherapistListColumn` - nová komponenta pro seznam
- `TherapistCompactCard` - kompaktní verze karty pro seznam
- `ResultsPageSplit` - hlavní orchestrátor

---

## State management

```typescript
interface ResultsPageState {
  // Data
  therapists: Therapist[]
  results: SearchResult | null
  loading: boolean
  error: string | null
  
  // Selection
  selectedTherapistId: string | null
  
  // UI state (volitelné)
  sidebarCollapsed?: boolean // pro responsive
}
```

---

## API integrace

- Stejné API endpointy jako současná results page
- Načtení výsledků při mount komponenty
- Žádné další API volání při přepínání terapeutů (data jsou již načtená)

---

## Navigace

- **Žádná navigace** na nové stránky
- Všechny interakce probíhají na jedné stránce
- URL může obsahovat query param `?therapist=id` pro deep linking (volitelné)
- Browser back/forward může fungovat s URL state (volitelné)

---

## Výhody tohoto přístupu

1. **Jednotný kontext** - uživatel vidí seznam i detail současně
2. **Rychlé přepínání** - žádné načítání nových stránek
3. **Lepší orientace** - vidí, kde se nachází v seznamu
4. **Méně navigace** - jednodušší UX flow
5. **Lepší pro porovnávání** - může rychle přepínat mezi terapeuty

---

## Implementační poznámky

- Použít React state (useState) pro selectedTherapistId
- Komponenty z detail stránky lze převzít s minimálními úpravami
- TherapistListColumn může být scrollovatelný pro dlouhé seznamy
- Hlavní panel může mít fixní výšku s overflow pro scrollování
- Responsive breakpoint: ~1024px (desktop split, mobile stack)



