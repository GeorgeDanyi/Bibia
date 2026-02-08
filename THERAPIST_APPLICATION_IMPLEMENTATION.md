# Therapist Application Implementation

## Změněné soubory

### 1. `lib/database/migrations/007_create_therapist_applications.sql` (NOVÝ)
**Změny:**
- Vytváří tabulku `therapist_applications` s poli:
  - `id` (UUID PK)
  - `created_at` (TIMESTAMP)
  - `email` (TEXT NOT NULL)
  - `phone` (TEXT NOT NULL)
  - `full_name` (TEXT NULL)
  - `city` (TEXT NULL)
  - `is_certified` (BOOLEAN NOT NULL)
  - `is_in_training` (BOOLEAN NOT NULL)
  - `how_did_you_hear` (TEXT NULL)
  - `note` (TEXT NULL)
  - `status` (TEXT NOT NULL DEFAULT 'new')
- Indexy na `created_at`, `email`, `status`

### 2. `app/pro-terapeuty/page.tsx` (PŘEPSÁNO)
**Změny:**
- Kompletní redesign stránky s 5 sekcemi:
  - **HERO**: Nadpis, popis, CTA tlačítko (scroll na formulář)
  - **BENEFITY**: 4 karty s ikonami (Více klientů, Flexibilní rozvrh, Růst praxe, Důvěryhodnost)
  - **JAK TO FUNGUJE**: 5 kroků v timeline formátu
  - **POŽADAVKY**: Bullet list s požadavky
  - **KONTAKT + FORMULÁŘ**: Kontaktní karta + formulář
- Formulář s validací:
  - Email (required, format validation)
  - Phone (required, min 9 znaků)
  - Full Name (optional)
  - City (optional)
  - Is Certified (required select: ano/ne)
  - Is In Training (required select: ano/ne)
  - How Did You Hear (select: Google / Doporučení / Sociální sítě / Jinak)
  - Note (textarea optional)
- Success/error stavy
- Disable submit při odesílání

### 3. `app/api/therapists/apply/route.ts` (NOVÝ)
**Změny:**
- POST endpoint pro zpracování přihlášky
- Server-side validace (stejná pravidla jako client-side)
- Ukládání do DB přes `query()` z `@/lib/db`
- Volitelné odeslání email notifikace (pokud je `THERAPIST_LEADS_NOTIFY_TO` nastaveno)
- Vrací `{ ok: true }` při úspěchu

### 4. `lib/utils/email.ts` (UPRAVENO)
**Změny:**
- Přidána funkce `sendTherapistApplicationNotification()`
- Odesílá email na `THERAPIST_LEADS_NOTIFY_TO` s shrnutím přihlášky
- HTML a plain text verze

---

## Jak spustit migraci

```bash
psql $DATABASE_URL -f lib/database/migrations/007_create_therapist_applications.sql
```

Nebo:
```bash
psql -d your_database_name -f lib/database/migrations/007_create_therapist_applications.sql
```

---

## Environment Variables

Pro email notifikace přidej do `.env.local`:

```env
# SMTP Configuration (pokud ještě není)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@bibia.cz

# Therapist leads notification
THERAPIST_LEADS_NOTIFY_TO=team@bibia.cz
```

**Poznámka:** Email notifikace je volitelná. Pokud `THERAPIST_LEADS_NOTIFY_TO` není nastaveno, přihláška se uloží do DB, ale email se nepošle.

---

## Jak otestovat

### Test 1: Otevření stránky

**Kroky:**
1. Jdi na `http://localhost:3000/pro-terapeuty`
2. **Očekávaný výsledek:**
   - Zobrazí se HERO sekce s nadpisem a CTA tlačítkem
   - Scroll dolů → zobrazí se BENEFITY (4 karty)
   - Scroll dolů → zobrazí se JAK TO FUNGUJE (5 kroků)
   - Scroll dolů → zobrazí se POŽADAVKY (bullet list)
   - Scroll dolů → zobrazí se KONTAKT + FORMULÁŘ

### Test 2: Vyplnění a odeslání formuláře

**Kroky:**
1. Jdi na `http://localhost:3000/pro-terapeuty`
2. Scroll dolů na formulář
3. Vyplň:
   - Email: `test@example.com`
   - Telefon: `+420123456789`
   - Jméno: `Jan Novák` (volitelné)
   - Město: `Praha` (volitelné)
   - Osvědčení: `Ano`
   - Studuje: `Ne`
   - Jak se dozvěděl/a: `Google` (volitelné)
   - Poznámka: `Test přihlášky` (volitelné)
4. Klikni "Odeslat přihlášku"
5. **Očekávaný výsledek:**
   - Success hláška: "Děkujeme, ozveme se do 2 pracovních dnů."
   - Formulář se vyprázdní
   - V DB je nový záznam v `therapist_applications`

**Ověření v DB:**
```sql
SELECT * FROM therapist_applications 
ORDER BY created_at DESC 
LIMIT 1;
```

**Očekávaný výsledek:**
- `email` = `test@example.com`
- `phone` = `+420123456789`
- `full_name` = `Jan Novák`
- `city` = `Praha`
- `is_certified` = `true`
- `is_in_training` = `false`
- `how_did_you_hear` = `Google`
- `note` = `Test přihlášky`
- `status` = `new`

### Test 3: Validace formuláře

**A) Prázdný email:**
1. Nevyplň email, vyplň ostatní povinná pole
2. Klikni "Odeslat přihlášku"
3. **Očekávaný výsledek:**
   - Error: "Email je povinný"

**B) Neplatný email:**
1. Zadej `invalid-email` do email pole
2. Klikni "Odeslat přihlášku"
3. **Očekávaný výsledek:**
   - Error: "Zadejte platný email"

**C) Krátký telefon:**
1. Zadej `123` do telefon pole
2. Klikni "Odeslat přihlášku"
3. **Očekávaný výsledek:**
   - Error: "Telefon musí mít alespoň 9 znaků"

**D) Chybějící odpověď na osvědčení:**
1. Nevyber odpověď na "Máš osvědčení/diplom?"
2. Klikni "Odeslat přihlášku"
3. **Očekávaný výsledek:**
   - Error: "Odpověď je povinná"

### Test 4: Email notifikace (volitelné)

**Kroky:**
1. Nastav `THERAPIST_LEADS_NOTIFY_TO=team@bibia.cz` v `.env.local`
2. Odesli přihlášku (viz Test 2)
3. **Očekávaný výsledek:**
   - Email přijde na `team@bibia.cz`
   - Subject: "Nová přihláška terapeuta - BIBIA"
   - Obsah: Shrnutí přihlášky (email, phone, certified, training, city, atd.)

**Poznámka:** Pokud `THERAPIST_LEADS_NOTIFY_TO` není nastaveno, přihláška se uloží do DB, ale email se nepošle (bez chyby).

### Test 5: Scroll na formulář

**Kroky:**
1. Jdi na `http://localhost:3000/pro-terapeuty`
2. Klikni na CTA tlačítko "Chci spolupracovat" v HERO sekci
3. **Očekávaný výsledek:**
   - Smooth scroll na formulář
   - Formulář je viditelný

---

## Shrnutí

✅ **UI:**
- Kompletní stránka s 5 sekcemi (HERO, BENEFITY, JAK TO FUNGUJE, POŽADAVKY, KONTAKT + FORMULÁŘ)
- Formulář s validací a success/error stavy
- Responsive design
- Smooth scroll na formulář

✅ **Backend:**
- SQL migrace pro `therapist_applications` tabulku
- API route `/api/therapists/apply` s server-side validací
- Ukládání do DB

✅ **Email (volitelné):**
- Notifikace na `THERAPIST_LEADS_NOTIFY_TO` s shrnutím přihlášky
- HTML a plain text verze

✅ **Bezpečnost:**
- Server-side validace
- SQL injection prevence (parametrizované dotazy)
- Email format validation
- Phone length validation

---

## Poznámky

- **Unique constraint:** Není přidán na `(email, phone)`, aby bylo možné odeslat více přihlášek (např. pro aktualizaci informací)
- **Status:** Default `'new'` - může být později rozšířeno o workflow (např. `'reviewed'`, `'approved'`, `'rejected'`)
- **Email notifikace:** Je volitelná - pokud není `THERAPIST_LEADS_NOTIFY_TO` nastaveno, přihláška se uloží, ale email se nepošle

