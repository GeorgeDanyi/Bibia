# Testování časových možností terapeutů

## Přehled

Systém pro testování časových možností terapeutů byl aktualizován, aby poskytoval realistická data pro testování v průběhu několika týdnů.

## Aktuální stav

- **Počet terapeutů**: 1,500
- **Celkový počet časových slotů**: ~35,000
- **Průměrný počet slotů na terapeuta**: 24
- **Časové rozmezí**: 4 týdny dopředu

## Typy terapeutů a jejich dostupnost

### 1. Zaneprázdněný terapeut (busy)
- **Dostupnost**: Všední dny + víkendy
- **Časové sloty**: 8:00-11:00, 14:00-17:00
- **Pravděpodobnost**: 80% šance na slot v daný den
- **Příklad**: therapist_0001, therapist_0002

### 2. Částečný úvazek (parttime)
- **Dostupnost**: Pouze všední dny
- **Časové sloty**: 9:00, 15:00
- **Pravděpodobnost**: 40% šance na slot v daný den
- **Příklad**: therapist_0003, therapist_0004

### 3. Víkendový terapeut (weekend)
- **Dostupnost**: Pouze víkendy
- **Časové sloty**: 9:00-11:00, 14:00-15:00
- **Pravděpodobnost**: 60% šance na slot v daný den
- **Příklad**: therapist_0005, therapist_0006

### 4. Večerní terapeut (evening)
- **Dostupnost**: Všední dny, večerní hodiny
- **Časové sloty**: 17:00-19:00
- **Pravděpodobnost**: 70% šance na slot v daný den
- **Příklad**: therapist_0007, therapist_0008

### 5. Standardní terapeut (standard)
- **Dostupnost**: Všední dny, standardní hodiny
- **Časové sloty**: 8:00-10:00, 14:00-16:00
- **Pravděpodobnost**: 60% šance na slot v daný den
- **Příklad**: Všichni ostatní terapeuti

## Scripty pro správu

### 1. Aktualizace časových možností
```bash
# Spustit kompletní aktualizaci (generuje nové sloty pro 4 týdny)
npx ts-node scripts/update-therapist-availability.ts
```

### 2. Postup časových možností
```bash
# Posunout dostupnost o týden dopředu (odstraní staré, přidá nové)
npx ts-node scripts/advance-availability.ts
```

### 3. Denní aktualizace
```bash
# Spustit denní aktualizaci
./scripts/daily-availability-update.sh
```

## Testovací scénáře

### Scénář 1: Rychlé vyhledávání
- **Cíl**: Najít terapeuta co nejdříve
- **Očekávání**: Měl by najít terapeuty s dostupností v příštích 1-3 dnech

### Scénář 2: Víkendové vyhledávání
- **Cíl**: Najít terapeuta na víkend
- **Očekávání**: Měl by najít víkendové terapeuty (therapist_0005, therapist_0006)

### Scénář 3: Večerní vyhledávání
- **Cíl**: Najít terapeuta na večer
- **Očekávání**: Měl by najít večerní terapeuty (therapist_0007, therapist_0008)

### Scénář 4: Dlouhodobé plánování
- **Cíl**: Najít terapeuta za 2-3 týdny
- **Očekávání**: Měl by najít terapeuty s dostupností v pozdějších termínech

## Monitoring a logování

### Statistiky dostupnosti
- Celkový počet slotů
- Průměrný počet slotů na terapeuta
- Časové rozmezí dostupnosti
- Rozdělení podle typů terapeutů

### Log soubory
- `logs/availability-updates.log` - Denní aktualizace
- Console výstup při spuštění scriptů

## Automatizace

### Cron job pro denní aktualizace
```bash
# Přidat do crontab pro denní spuštění v 6:00
0 6 * * * /path/to/project/scripts/daily-availability-update.sh
```

### GitHub Actions (volitelné)
```yaml
name: Daily Availability Update
on:
  schedule:
    - cron: '0 6 * * *'  # Každý den v 6:00
jobs:
  update-availability:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Update availability
        run: ./scripts/daily-availability-update.sh
```

## Troubleshooting

### Problém: Žádné dostupné sloty
- **Řešení**: Spustit `update-therapist-availability.ts` pro generování nových slotů

### Problém: Staré sloty v minulosti
- **Řešení**: Spustit `advance-availability.ts` pro odstranění starých slotů

### Problém: Nerealistické časové rozložení
- **Řešení**: Upravit parametry v `generateTherapistAvailability()` funkci

## Budoucí vylepšení

1. **Inteligentní generování**: Použít AI pro realistické rozložení dostupnosti
2. **Sezónní vzory**: Různé vzory pro různé roční období
3. **Geografické rozdíly**: Různé vzory pro různá města
4. **Integrace s kalendářem**: Synchronizace s reálnými kalendáři terapeutů
5. **Analytika**: Sledování využití časových slotů a optimalizace

