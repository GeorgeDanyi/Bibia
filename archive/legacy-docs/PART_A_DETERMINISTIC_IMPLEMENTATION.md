# Part A Deterministic Fixtures Implementation

## Overview

This implementation provides deterministic fixtures near Prague, Ostrava, and Brno to guarantee data exists for testing within 30–50 km of these cities.

## Goals Achieved

✅ **Guaranteed data exists for testing within 30–50 km of Prague**  
✅ **Guaranteed data exists for testing within 30–50 km of Ostrava**  
✅ **Guaranteed data exists for testing within 30–50 km of Brno**  
✅ **Deterministic coordinates for consistent testing**

## Implementation Details

### Files Created

1. **`lib/data/part-a-deterministic-fixtures.ts`** - TypeScript implementation of deterministic fixture generation
2. **`scripts/seed-part-a-fixtures.ts`** - TypeScript seeding script
3. **`scripts/seed-part-a-fixtures.js`** - JavaScript seeding script (working version)
4. **`scripts/test-part-a-coverage.js`** - Coverage testing script
5. **`lib/config/fixture.ts`** - Updated fixture configuration

### Fixture Distribution

#### Prague Cluster (15 therapists)
- **Distance range**: 30.1km - 48.9km from city center
- **Average distance**: 38.3km
- **Distribution**:
  - 5 therapists within 30-35km
  - 5 therapists within 35-40km  
  - 5 therapists within 40-50km
- **Specialties**:
  - 3 Bechtěrev specialists
  - 3 Sports specialists
  - 3 Online-only therapists
  - 12 Back pain specialists

#### Ostrava Cluster (12 therapists)
- **Distance range**: 30.2km - 44.4km from city center
- **Average distance**: 37.1km
- **Distribution**:
  - 4 therapists within 30-35km
  - 4 therapists within 35-40km
  - 4 therapists within 40-50km
- **Specialties**:
  - 2 Bechtěrev specialists
  - 2 Sports specialists
  - 3 Online-only therapists
  - 10 Back pain specialists

#### Brno Cluster (12 therapists)
- **Distance range**: 31.3km - 48.7km from city center
- **Average distance**: 37.4km
- **Distribution**:
  - 4 therapists within 30-35km
  - 4 therapists within 35-40km
  - 4 therapists within 40-50km
- **Specialties**:
  - 2 Bechtěrev specialists
  - 3 Sports specialists
  - 3 Online-only therapists
  - 10 Back pain specialists

### Total Coverage
- **39 therapists** across all three cities
- **All therapists** positioned within the required 30-50km range
- **Deterministic coordinates** ensure consistent testing results

## Usage

### Seeding Part A Fixtures

```bash
# Enable fixture mode and seed Part A fixtures
BIBIA_USE_FIXTURES=true node scripts/seed-part-a-fixtures.js
```

### Testing Coverage

```bash
# Test that fixtures meet Part A requirements
node scripts/test-part-a-coverage.js
```

### Environment Variables

- `BIBIA_USE_FIXTURES=true` - Enables fixture mode
- `PART_A_MODE=true` - Enables Part A deterministic mode
- `PART_A_DETERMINISTIC=true` - Alternative Part A mode flag

## Technical Implementation

### Deterministic Coordinate Generation

The system uses a seeded random number generator to ensure consistent coordinates across runs:

```javascript
function generateDeterministicCoordinates(center, minKm, maxKm, seed) {
  function seededRandom(seed) {
    const x = Math.sin(seed) * 10000
    return x - Math.floor(x)
  }
  
  const latDegreesPerKm = 1 / 111.32
  const lngDegreesPerKm = 1 / (111.32 * Math.cos(center.lat * Math.PI / 180))
  
  const angle = seededRandom(seed) * 2 * Math.PI
  const distance = minKm + seededRandom(seed + 1) * (maxKm - minKm)
  
  const latOffset = distance * latDegreesPerKm * Math.cos(angle)
  const lngOffset = distance * lngDegreesPerKm * Math.sin(angle)
  
  return {
    lat: center.lat + latOffset,
    lng: center.lng + lngOffset
  }
}
```

### City Centers

- **Prague**: 50.0755°N, 14.4378°E
- **Ostrava**: 49.8209°N, 18.2625°E  
- **Brno**: 49.1951°N, 16.6068°E

### Validation

The system includes comprehensive validation to ensure:
- All therapists are within the 30-50km range
- Sufficient coverage for each city
- Proper distribution of specialties
- Deterministic behavior across runs

## Results

### Test Results

```
✅ PART A COVERAGE TEST PASSED
   🎯 All cities have guaranteed data within 30-50km range
   🎯 Deterministic coordinates ensure consistent testing
   🎯 Sufficient coverage for geo & scoring validation
```

### Seeding Results

```
✅ ALL PART A REQUIREMENTS MET

💾 Part A fixtures saved to: /Users/george/bibiafyzio/data/fixtures.json
📊 Total therapists seeded: 39
   - Prague: 15 therapists
   - Ostrava: 12 therapists
   - Brno: 12 therapists

🎯 Part A Goals Achieved:
   ✅ Guaranteed data exists for testing within 30–50 km of Prague
   ✅ Guaranteed data exists for testing within 30–50 km of Ostrava
   ✅ Guaranteed data exists for testing within 30–50 km of Brno
   ✅ Deterministic coordinates for consistent testing
```

## Benefits

1. **Guaranteed Test Data**: Ensures test data always exists within the specified range
2. **Consistent Testing**: Deterministic coordinates provide reproducible results
3. **Comprehensive Coverage**: Multiple therapists per city with varied specialties
4. **Easy Integration**: Works with existing fixture system via environment variables
5. **Validation**: Built-in validation ensures requirements are met

## Integration

The Part A fixtures integrate seamlessly with the existing fixture system:

- Uses the same `data/fixtures.json` file
- Respects the `BIBIA_USE_FIXTURES` environment variable
- Maintains compatibility with existing fixture configuration
- Provides additional Part A specific configuration options

This implementation successfully meets all Part A goals while maintaining system compatibility and providing robust testing capabilities.