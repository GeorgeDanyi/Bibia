# Bibiafyzio - Product Scope & Success Metrics

## 🎯 Cíl
Spojit lidi s fyzioterapeuty, kteří rozumí jejich problému. Rychle, jednoduše a efektivně.

---

## 👥 Uživatelé a jejich potřeby

### Primární uživatelé (Pacienti)

#### 1. **Rychlé nalezení fyzio** 
- **Kdo:** Lidé s akutní bolestí, kteří potřebují rychlou pomoc
- **Potřeba:** Najít dostupného terapeuta co nejdříve, ideálně dnes/zítra
- **Cíl:** Získat úlevu od bolesti rychle a bez komplikací
- **Typické scénáře:** 
  - "Bolí mě záda, potřebuju to vyřešit do víkendu"
  - "Mám zítra důležitou schůzku, potřebuju se rychle dostat do formy"

#### 2. **Specializace na konkrétní potíž**
- **Kdo:** Lidé s chronickými problémy nebo specifickými diagnózami
- **Potřeba:** Najít experta na svůj konkrétní problém
- **Cíl:** Dlouhodobé řešení s odborníkem, který rozumí jejich situaci
- **Typické scénáře:**
  - "Mám skoliózu, potřebuju někoho, kdo s tím má zkušenosti"
  - "Jsem sportovec, potřebuju terapeuta, který rozumí sportovním úrazům"

#### 3. **Online konzultace**
- **Kdo:** Lidé s časovými omezeními, obavami z cestování, nebo preferencí pohodlí
- **Potřeba:** Získat odbornou pomoc z domova
- **Cíl:** Efektivní terapie bez nutnosti cestovat
- **Typické scénáře:**
  - "Mám malé děti, nemůžu nikam jezdit"
  - "Chci si nejdřív promluvit s odborníkem, než se rozhodnu"

### Sekundární uživatelé (Terapeuti)

#### 1. **Správa profilu fyzio**
- **Kdo:** Fyzioterapeuti, kteří chtějí získat nové klienty
- **Potřeba:** Prezentovat své služby a specializace
- **Cíl:** Přilákat vhodné klienty a naplnit kalendář
- **Klíčové funkce:**
  - Aktualizace dostupnosti
  - Správa specializací a cen
  - Přidávání recenzí a referencí

#### 2. **Úprava skórovacích vah**
- **Kdo:** Administrátoři platformy
- **Potřeba:** Optimalizovat algoritmus pro lepší shody
- **Cíl:** Zlepšit kvalitu doporučení a spokojenost uživatelů
- **Klíčové funkce:**
  - Nastavení vah pro různé faktory (vzdálenost, specializace, dostupnost)
  - A/B testování různých algoritmů
  - Monitoring výkonnosti doporučení

---

## 📊 Success Metrics (První verze)

### Hlavní metriky

#### ⏱️ **Time-to-first-relevant-result < 30 sekund**
- **Měření:** Od spuštění dotazníku po zobrazení prvního relevantního výsledku
- **Cíl:** < 30 sekund
- **Proč:** Uživatelé s akutní bolestí potřebují rychlou odpověď
- **Jak měřit:** Tracking času od `questionnaire_start` po `first_result_displayed`

#### 🎯 **80% uživatelů klikne na 1 z prvních 3 výsledků**
- **Měření:** Procento uživatelů, kteří kliknou na některý z top 3 výsledků
- **Cíl:** ≥ 80%
- **Proč:** Kvalitní algoritmus by měl najít vhodné terapeuty hned na začátku
- **Jak měřit:** `clicks_on_top3_results / total_users_who_saw_results`

#### 🚫 **<5% zero-result sessions (po uvolnění soft filtrů)**
- **Měření:** Procento relací, které skončí bez jakýchkoliv výsledků
- **Cíl:** < 5%
- **Proč:** Každý uživatel by měl najít alespoň nějakou možnost
- **Jak měřit:** `sessions_with_zero_results / total_sessions` (po aplikaci fallback logiky)

### Podpůrné metriky

#### 📈 **Conversion Rate**
- **Měření:** Procento uživatelů, kteří dokončí dotazník a zobrazí výsledky
- **Cíl:** > 70%
- **Proč:** Dotazník musí být dostatečně jednoduchý

#### ⭐ **User Satisfaction**
- **Měření:** Hodnocení kvality výsledků (1-5 hvězdiček)
- **Cíl:** > 4.0/5.0
- **Proč:** Spokojenost je klíčová pro retenci

#### 🔄 **Return Rate**
- **Měření:** Procento uživatelů, kteří se vrátí do 30 dnů
- **Cíl:** > 25%
- **Proč:** Dobrý zážitek vede k opakovanému použití

---

## 🎨 Tone & Style Guide (CZ)

### Základní principy

#### **Krátké věty**
- ✅ "Najdi si fyzioterapeuta za pár minut"
- ❌ "Naše platforma vám umožní najít si kvalifikovaného fyzioterapeuta v krátkém čase"

#### **Bez žargonu**
- ✅ "Bolest zad", "krční páteř", "sportovní úrazy"
- ❌ "Myofasciální syndrom", "cervikální dysfunkce", "sportovní traumatologie"

#### **Tykání**
- ✅ "Potřebuješ pomoc s bolestí zad?"
- ❌ "Potřebujete pomoc s bolestí zad?"

#### **Laskavý a jasný tón**
- ✅ "Spojíme tě s odborníky, kteří rozumí tvému problému"
- ❌ "Naše algoritmy najdou optimálního terapeuta pro tvé potřeby"

### Konkrétní příklady

#### **Call-to-Action**
- ✅ "Spustit test zdarma"
- ✅ "Najít terapeuta"
- ❌ "Inicializovat vyhledávací proces"

#### **Chybové zprávy**
- ✅ "Omlouváme se, nenašli jsme terapeuty v tvé oblasti. Zkus rozšířit vyhledávání."
- ❌ "Chyba: Žádní terapeuti nebyli nalezeni v zadaném poloměru."

#### **Popis terapeuta**
- ✅ "Specializuje se na bolesti zad a sportovní úrazy. Má 8 let zkušeností."
- ❌ "Certifikovaný odborník s rozsáhlými zkušenostmi v oblasti muskuloskeletální rehabilitace."

### Emocionální tón

#### **Důvěra a bezpečí**
- "Ověřený terapeut"
- "Bezpečné a ověřené"
- "Spolehliví odborníci"

#### **Naděje a řešení**
- "Úleva od bolesti"
- "Návrat k plné kondici"
- "Cílené řešení"

#### **Jednoduchost a přístupnost**
- "Za pár minut"
- "Stačí vyplnit dotazník"
- "Hned uvidíš možnosti"

---

## 🎯 Klíčové funkce platformy

### Pro pacienty
1. **Inteligentní dotazník** - 6 kroků, mapování na SearchCriteria
2. **Pokročilé vyhledávání** - algoritmus s fallback logikou
3. **Filtrování výsledků** - podle vzdálenosti, specializace, dostupnosti
4. **Detailní profily** - informace o terapeutech, recenze, ceny
5. **Online konzultace** - možnost domluvit si online sezení

### Pro terapeuty
1. **Správa profilu** - aktualizace informací a dostupnosti
2. **Analytika** - přehled o zobrazeních a konverzích
3. **Správa recenzí** - odpovědi na hodnocení klientů

### Pro administrátory
1. **Dashboard kvality** - monitoring výkonnosti algoritmu
2. **Správa skórovacích vah** - optimalizace doporučení
3. **A/B testování** - testování různých přístupů

---

## 📋 Acceptance Criteria

- [x] **One-pager sepsaný v repu** - tento dokument
- [ ] **Všichni členové týmu se na něm shodnou** - vyžaduje review a schválení
- [ ] **Implementace metrik** - tracking a dashboard pro monitoring
- [ ] **A/B testování** - možnost testovat různé verze algoritmu
- [ ] **Dokumentace pro vývojáře** - jak implementovat nové metriky

---

*Poslední aktualizace: $(date)*
*Verze: 1.0*
