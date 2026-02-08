# 404 Links Fixes Summary

## Vytvořené placeholder stránky

### 1. `/terms` - Obchodní podmínky
- **Soubor**: `app/terms/page.tsx`
- **Obsah**: Nadpis, text o přípravě, CTA na kontakt

### 2. `/privacy` - Zásady ochrany osobních údajů
- **Soubor**: `app/privacy/page.tsx`
- **Obsah**: Nadpis, text o přípravě, CTA na kontakt

### 3. `/pricing` - Ceník
- **Soubor**: `app/pricing/page.tsx`
- **Obsah**: Nadpis, text o přípravě, CTA na kontakt

### 4. `/contact` - Kontakt
- **Soubor**: `app/contact/page.tsx`
- **Obsah**: Nadpis, email a telefon, text o přípravě formuláře, CTA zpět

### 5. `/about` - O nás
- **Soubor**: `app/about/page.tsx`
- **Obsah**: Nadpis, text o přípravě, CTA zpět

### 6. `/how-it-works` - Jak to funguje
- **Soubor**: `app/how-it-works/page.tsx`
- **Obsah**: Nadpis, text o přípravě, CTA na dotazník

### 7. `/team` - Náš tým
- **Soubor**: `app/team/page.tsx`
- **Obsah**: Nadpis, text o přípravě, CTA zpět

### 8. `/careers` - Kariéra
- **Soubor**: `app/careers/page.tsx`
- **Obsah**: Nadpis, text o přípravě, CTA na kontakt

### 9. `/faq` - Často kladené otázky
- **Soubor**: `app/faq/page.tsx`
- **Obsah**: Nadpis, text o přípravě, CTA na kontakt

### 10. `/insurance` - Pojištění
- **Soubor**: `app/insurance/page.tsx`
- **Obsah**: Nadpis, text o přípravě, CTA zpět

### 11. `/blog` - Blog
- **Soubor**: `app/blog/page.tsx`
- **Obsah**: Nadpis, text o přípravě, CTA zpět

---

## Opravené odkazy (přesměrování na existující stránky)

### 1. `components/site/footer.tsx`
- `/therapist-registration` → `/pro-terapeuty` (řádek 51)
- `/therapist-dashboard` → `/login` (řádek 54)
- `/therapist-benefits` → `/pro-terapeuty` (řádek 57)
- `/therapist-support` → `/contact` (řádek 60)
- `/support` → `/contact` (řádek 78)

### 2. `components/site/sections/InsuranceContribution.tsx`
- `/prispevek` → `/insurance` (řádek 65)
- `/pojistovny` → `/insurance` (řádek 75)

---

## Seznam všech změn

### Nové soubory (11 placeholder stránek):
1. `app/terms/page.tsx`
2. `app/privacy/page.tsx`
3. `app/pricing/page.tsx`
4. `app/contact/page.tsx`
5. `app/about/page.tsx`
6. `app/how-it-works/page.tsx`
7. `app/team/page.tsx`
8. `app/careers/page.tsx`
9. `app/faq/page.tsx`
10. `app/insurance/page.tsx`
11. `app/blog/page.tsx`

### Upravené soubory (2):
1. `components/site/footer.tsx` - 5 odkazů opraveno
2. `components/site/sections/InsuranceContribution.tsx` - 2 odkazy opraveno

---

## Výsledek

✅ **Všechny 404 odkazy opraveny:**
- 11 placeholder stránek vytvořeno
- 7 odkazů přesměrováno na existující stránky
- Žádné 404 chyby při klikání z UI

**Všechny stránky mají:**
- Konzistentní design (seafoam barvy, rounded corners)
- Nadpis a krátký text
- CTA tlačítko (zpět na hlavní stránku nebo kontakt)
- Responsive layout

**Build status:** ✅ `npm run build` prošel úspěšně

