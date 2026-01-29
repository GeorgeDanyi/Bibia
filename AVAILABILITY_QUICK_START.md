# Rychlý start - Časové možnosti terapeutů

## 🚀 Okamžité spuštění

```bash
# 1. Aktualizovat časové možnosti pro všechny terapeuty
npm run availability:update

# 2. Otestovat data
npm run availability:test

# 3. Postup časových možností o týden dopředu
npm run availability:advance
```

## 📊 Aktuální stav

- ✅ **1,500 terapeutů** s časovými možnostmi
- ✅ **35,000+ časových slotů** na 4 týdny dopředu
- ✅ **Různé typy terapeutů**: zaneprázdnění, částečný úvazek, víkendoví, večerní
- ✅ **Realistické rozložení**: všední dny vs víkendy, ranní vs odpolední

## 🧪 Testovací scénáře

### Scénář 1: Rychlé vyhledávání
```bash
# Najít terapeuta co nejdříve
# Očekávání: 1,240 terapeutů dostupných v příštích 3 dnech
```

### Scénář 2: Víkendové vyhledávání  
```bash
# Najít terapeuta na víkend
# Očekávání: 4 terapeuti s víkendovou dostupností
```

### Scénář 3: Večerní vyhledávání
```bash
# Najít terapeuta na večer (po 17:00)
# Očekávání: 4 terapeuti s večerní dostupností
```

## 📅 Automatizace

### Denní aktualizace
```bash
# Spustit denní aktualizaci (odstraní staré, přidá nové sloty)
npm run availability:daily
```

### Cron job
```bash
# Přidat do crontab pro denní spuštění v 6:00
0 6 * * * cd /path/to/project && npm run availability:daily
```

## 🔧 Údržba

### Kompletní reset
```bash
# Vygenerovat nové časové možnosti pro všechny terapeuty
npm run availability:update
```

### Postup o týden
```bash
# Posunout dostupnost o týden dopředu
npm run availability:advance
```

### Ověření dat
```bash
# Otestovat kvalitu a rozložení časových možností
npm run availability:test
```

## 📈 Statistiky

- **Celkové sloty**: ~35,000
- **Průměr na terapeuta**: 24 slotů
- **Časové rozmezí**: 4 týdny
- **Rozložení**: 50% ranní, 50% odpolední, 1% večerní
- **Dny**: 99% všední dny, 1% víkendy

## 🎯 Typy terapeutů

| Typ | Dostupnost | Časové sloty | Pravděpodobnost |
|-----|------------|--------------|-----------------|
| Zaneprázdněný | Všední + víkendy | 8:00-11:00, 14:00-17:00 | 80% |
| Částečný úvazek | Pouze všední | 9:00, 15:00 | 40% |
| Víkendový | Pouze víkendy | 9:00-11:00, 14:00-15:00 | 60% |
| Večerní | Všední, večer | 17:00-19:00 | 70% |
| Standardní | Všední, standard | 8:00-10:00, 14:00-16:00 | 60% |

## 🚨 Troubleshooting

### Problém: Žádné dostupné sloty
```bash
npm run availability:update
```

### Problém: Staré sloty v minulosti
```bash
npm run availability:advance
```

### Problém: Nerealistické rozložení
```bash
# Upravit parametry v scripts/update-therapist-availability.ts
npm run availability:update
```

## 📝 Logy

- Console výstup při spuštění scriptů
- `logs/availability-updates.log` - Denní aktualizace
- Statistiky dostupnosti v reálném čase

## 🔄 Workflow

1. **Inicializace**: `npm run availability:update`
2. **Testování**: `npm run availability:test`
3. **Denní údržba**: `npm run availability:daily`
4. **Monitoring**: Sledovat logy a statistiky

