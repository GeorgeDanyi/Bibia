# Therapist Page Improvements - Complete Refactor

## Změněné soubory

### Nové komponenty:

1. **`app/pro-terapeuty/page.tsx`** (PŘEPSÁNO)
   - Server component (bez "use client")
   - Pouze layout a sekce
   - Importuje všechny sekce a formulář

2. **`app/pro-terapeuty/TherapistApplyForm.tsx`** (NOVÝ)
   - Client component ("use client")
   - Kompletní formulář s validací
   - Error handling (network errors, server errors)
   - Honeypot field
   - Success/error stavy

3. **`app/pro-terapeuty/sections/Hero.tsx`** (NOVÝ)
   - Hero sekce s H1, popisem, mikrocopy
   - Primární CTA: `<a href="#form">` (scroll, ne submit)
   - Sekundární CTA: link na `/contact`

4. **`app/pro-terapeuty/sections/Benefits.tsx`** (NOVÝ)
   - 4 benefit karty s ikonami

5. **`app/pro-terapeuty/sections/Steps.tsx`** (NOVÝ)
   - 5 kroků v timeline formátu

6. **`app/pro-terapeuty/sections/Requirements.tsx`** (NOVÝ)
   - Bullet list s požadavky

7. **`components/ui/label.tsx`** (NOVÝ)
   - shadcn/ui Label komponenta

### Upravené soubory:

8. **`app/api/therapists/apply/route.ts`** (PŘEPSÁNO)
   - Zod validace (sdílené schema)
   - Rate limiting (5 requests / 10 min / IP)
   - Soft dedupe (update pokud stejný email v posledních 24h)
   - Honeypot kontrola
   - Normalizace phone (odstranění mezer)
   - Email lowercase + trim

9. **`app/api/therapists/apply/schema.ts`** (NOVÝ)
   - Zod schema pro validaci
   - Transformace phone (odstranění mezer)
   - Email lowercase + trim

---

## Klíčové vylepšení

### A) UI/UX

✅ **CTA funguje správně:**
- Primární CTA: `<a href="#form">` - pouze scroll, nikdy neodesílá form
- Sekundární CTA: link na `/contact`
- Mikrocopy: "Odpovídáme obvykle do 2 pracovních dnů."

✅ **Formulář:**
- `scroll-mt-24` na form sekci pro správný scroll pod sticky header
- Desktop: 2 sloupce (kontakt vlevo, formulář vpravo)
- Mobil: 1 sloupec
- shadcn/ui komponenty (Card, Input, Label, Button)
- Validace a chyby pod každým inputem
- Success/error stavy s čitelnými hláškami

### B) Form logika

✅ **Fetch:**
- Relativní cesta: `/api/therapists/apply`
- Žádné localhost, žádná absolutní URL

✅ **Error handling:**
- Network errors: "Nepodařilo se spojit se serverem..."
- Server errors: zobrazí `{ error }` z API
- Loading state: disable submit button

✅ **Honeypot:**
- Skryté pole "website" (sr-only)
- Člověk ho nevyplní, boti často ano

### C) API Route

✅ **Validace:**
- Zod schema pro type-safe validaci
- Email: lowercase + trim
- Phone: normalizace (odstranění mezer), min 9 číslic

✅ **Rate limiting:**
- In-memory Map (IP -> { count, resetAt })
- Max 5 requests / 10 minut / IP
- 429 response při překročení

✅ **Soft dedupe:**
- Pokud stejný email v posledních 24h → UPDATE místo INSERT
- Aktualizuje: phone, full_name, city, note, status = 'new'
- Vrací `{ ok: true }` (bez email notifikace)

✅ **Honeypot:**
- Pokud `website` není prázdné → return `200 { ok: true }` bez uložení

✅ **Email notifikace:**
- Pouze pro nové žádosti (ne pro updates)
- Pouze pokud `THERAPIST_LEADS_NOTIFY_TO` je nastaveno

---

## Test Checklist

### ✅ Test 1: CTA Scroll
**Kroky:**
1. Jdi na `/pro-terapeuty`
2. Klikni na "Chci spolupracovat" v HERO sekci
3. **Očekávaný výsledek:**
   - Smooth scroll na formulář (#form)
   - Formulář je viditelný
   - Žádný submit, žádný reload

**Ověření:**
- Network tab: žádný request
- URL: zůstává `/pro-terapeuty` (ne `/pro-terapeuty#form` s reload)

---

### ✅ Test 2: Submit Success
**Kroky:**
1. Vyplň formulář:
   - Email: `test@example.com`
   - Telefon: `+420 123 456 789`
   - Osvědčení: `Ano`
   - Studuje: `Ne`
2. Klikni "Odeslat přihlášku"
3. **Očekávaný výsledek:**
   - Success hláška: "Děkujeme, ozveme se do 2 pracovních dnů."
   - Formulář se vyprázdní
   - V DB je nový záznam

**Ověření:**
- Network tab: POST `/api/therapists/apply` → 200 { ok: true }
- DB: `SELECT * FROM therapist_applications ORDER BY created_at DESC LIMIT 1;`

---

### ✅ Test 3: Network Fail
**Kroky:**
1. Vypni internet / zablokuj `/api/therapists/apply` v DevTools
2. Vyplň a odešli formulář
3. **Očekávaný výsledek:**
   - Error hláška: "Nepodařilo se spojit se serverem. Zkontrolujte připojení k internetu a zkuste to znovu."
   - Formulář zůstane vyplněný

**Ověření:**
- Network tab: request failed (red)
- Error message je čitelná

---

### ✅ Test 4: Server Error
**Kroky:**
1. Dočasně zablokuj DB (nebo použij neplatná data)
2. Vyplň a odešli formulář
3. **Očekávaný výsledek:**
   - Error hláška zobrazí server error message
   - Formulář zůstane vyplněný

**Ověření:**
- Network tab: POST → 400/500 s { error: "..." }
- Error message se zobrazí

---

### ✅ Test 5: Honeypot
**Kroky:**
1. Otevři DevTools → Console
2. Spusť: `document.getElementById('website').value = 'spam'`
3. Vyplň a odešli formulář
4. **Očekávaný výsledek:**
   - Success hláška se zobrazí (bot si myslí, že to prošlo)
   - V DB není žádný záznam

**Ověření:**
- Network tab: POST → 200 { ok: true }
- DB: `SELECT * FROM therapist_applications WHERE email = 'test@example.com';` → žádné výsledky

---

### ✅ Test 6: Rate Limit
**Kroky:**
1. Odešli formulář 5x rychle za sebou (stejná IP)
2. 6. pokus
3. **Očekávaný výsledek:**
   - Error: "Zkuste to prosím později."
   - Status: 429

**Ověření:**
- Network tab: POST → 429 { error: "Zkuste to prosím později." }
- Po 10 minutách by mělo znovu fungovat

---

### ✅ Test 7: Dedupe
**Kroky:**
1. Odešli formulář s emailem `test@example.com`
2. Počkej < 24h
3. Odešli znovu se stejným emailem, ale jiným telefonem
4. **Očekávaný výsledek:**
   - Success hláška
   - V DB je pouze 1 záznam (ne 2)
   - Telefon je aktualizován

**Ověření:**
- DB: `SELECT * FROM therapist_applications WHERE email = 'test@example.com';` → 1 řádek
- `phone` obsahuje nový telefon
- `created_at` zůstává původní

---

## Seznam změněných souborů

### Nové soubory (8):
1. `app/pro-terapeuty/TherapistApplyForm.tsx` - Client komponenta formuláře
2. `app/pro-terapeuty/sections/Hero.tsx` - Hero sekce
3. `app/pro-terapeuty/sections/Benefits.tsx` - Benefity sekce
4. `app/pro-terapeuty/sections/Steps.tsx` - Jak to funguje sekce
5. `app/pro-terapeuty/sections/Requirements.tsx` - Požadavky sekce
6. `app/api/therapists/apply/schema.ts` - Zod validace schema
7. `components/ui/label.tsx` - shadcn/ui Label komponenta
8. `THERAPIST_PAGE_IMPROVEMENTS.md` - Tato dokumentace

### Přepsané soubory (2):
1. `app/pro-terapeuty/page.tsx` - Server component, pouze layout
2. `app/api/therapists/apply/route.ts` - Vylepšená API route s validací, rate limiting, dedupe

---

## Shrnutí změn

✅ **Struktura:**
- Rozděleno na čisté komponenty (page, form, sections)
- Server/Client komponenty správně oddělené

✅ **UI/UX:**
- CTA funguje správně (scroll, ne submit)
- Konzistentní design (shadcn/ui + Tailwind)
- Responsive layout
- Validace pod inputy

✅ **Technika:**
- Zod validace (type-safe)
- Rate limiting (anti-spam)
- Soft dedupe (prevence duplikátů)
- Honeypot (anti-bot)
- Error handling (network + server errors)

✅ **Bezpečnost:**
- Honeypot kontrola
- Rate limiting
- Server-side validace
- SQL injection prevence (parametrizované dotazy)

---

## Poznámky

- **Rate limiting:** In-memory Map (není persistentní přes restart serveru)
- **Dedupe:** Aktualizuje pouze pokud stejný email v posledních 24h
- **Email notifikace:** Pouze pro nové žádosti, ne pro updates
- **Honeypot:** Silent rejection (bot si myslí, že to prošlo)

