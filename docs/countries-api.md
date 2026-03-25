# Countries API Integration

## Overview

The app now uses the **REST Countries API** (https://restcountries.com) to fetch country data dynamically instead of using a hardcoded list.

## Implementation

### Service: `frontend/src/services/countries.ts`

The countries service provides:

- **`fetchCountries()`** - Async function that fetches countries from REST Countries API
- **`getCountriesSync()`** - Returns cached countries or fallback data (no network call)
- **`clearCountriesCache()`** - Clears the cache for testing

### Features

1. **API-first with fallback**: Always tries to fetch from the API first, falls back to hardcoded data on error
2. **Caching**: Results are cached in memory to avoid repeated API calls
3. **Fast initial load**: Uses `getCountriesSync()` to show fallback data immediately, then updates with API data
4. **Timeout protection**: 10-second timeout on API requests
5. **Error resilience**: Never fails — always returns valid data (API or fallback)

### API Details

- **Endpoint**: `https://restcountries.com/v3.1/all`
- **Parameters**: 
  - `fields`: Only fetch needed fields (`name,idd,flag,cca2`)
- **Response**: ~250 countries worldwide
- **Rate limits**: Free tier, reasonable limits for production use
- **CORS**: Enabled
- **Auth**: None required

### Data Structure

```typescript
interface Country {
  flag: string;      // Emoji flag (e.g., "🇨🇴")
  name: string;      // Country name (e.g., "Colombia")
  dial: string;      // Dial code (e.g., "+57")
  code: string;      // ISO alpha-2 code (e.g., "CO")
}
```

### Usage Example

```typescript
import {fetchCountries, getCountriesSync} from "../services/countries";
import type {Country} from "@lavaca/types";

// Immediate (sync) - returns cached or fallback
const countries = getCountriesSync();

// Async - fetches from API
const countries = await fetchCountries();
```

### Countries Included

**All countries worldwide** (~250 countries)

The API automatically fetches every country available, including:
- All Latin American countries
- North American countries (US, Canada, Mexico)
- European countries
- Asian countries
- African countries
- Oceanian countries
- Caribbean nations

Countries without valid dial codes are filtered out automatically.

## Benefits

1. **Complete global coverage**: All ~250 countries available
2. **Data freshness**: Country names and dial codes stay up-to-date
3. **Maintainability**: No need to manually update hardcoded lists
4. **Localization**: API provides native names (e.g., "México" instead of "Mexico")
5. **Extensibility**: Automatically includes new countries as they're added to the API

## Alternative APIs

If REST Countries API becomes unavailable, consider these alternatives:

1. **Countries Now API** (https://countriesnow.space)
2. **Country State City API** (https://countrystatecity.in)
3. Fall back to the hardcoded `FALLBACK_COUNTRIES` array (already in the code)

## Testing

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Manual test - fetch all countries
curl "https://restcountries.com/v3.1/all?fields=name,idd,flag,cca2" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'Total countries: {len(data)}')
for c in data[:5]:
    print(f'{c[\"flag\"]} {c[\"name\"][\"common\"]}')"
```

## Future Enhancements

- [ ] Add loading state indicator in country picker
- [ ] Cache countries in AsyncStorage for offline support
- [ ] Add ability to search by dial code in picker
- [ ] Show most recently used countries at the top
- [ ] Group countries by region (Africa, Americas, Asia, Europe, Oceania)
