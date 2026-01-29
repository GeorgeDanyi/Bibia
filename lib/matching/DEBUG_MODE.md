# Matching Engine Debug Mode

## Overview

The matching engine includes an optional debug mode that logs detailed information about why therapists are included or excluded from search results. This is **development-only** and does not affect production performance.

## Enabling Debug Mode

Debug mode is automatically enabled when:
- `NODE_ENV === 'development'` (default in development), OR
- `NEXT_PUBLIC_MATCHING_DEBUG === 'true'` (environment variable)

### Option 1: Automatic (Development Mode)
When running `npm run dev`, debug mode is automatically enabled.

### Option 2: Manual (Environment Variable)
Set the environment variable in your `.env.local` file:
```bash
NEXT_PUBLIC_MATCHING_DEBUG=true
```

## Where to See Logs

### Browser Console (Client-Side)
When the matching engine runs in the browser (e.g., during search), logs appear in the **browser's developer console**:
1. Open your browser's developer tools (F12 or Cmd+Option+I)
2. Go to the **Console** tab
3. Perform a search
4. Look for logs prefixed with 🔍

### Server Logs (Server-Side)
When the matching engine runs on the server (e.g., API routes), logs appear in the **terminal where you're running the dev server**:
1. Check the terminal where you ran `npm run dev`
2. Look for logs prefixed with 🔍

## What Gets Logged

For each therapist, the debug mode logs:

### 1. Key Attributes
- ID and name
- Gender
- City
- Meeting types supported
- Age groups supported
- Barrier-free status
- Languages spoken

### 2. Hard Filter Results
Detailed pass/fail status for each hard filter:
- ✅ Meeting type match
- ✅ Service radius (for dojíždění)
- ✅ Barrier-free requirement
- ✅ Age group capability
- ✅ Gender preference (strict mode)
- ✅ Therapist status (accepting clients, active profile)

### 3. Soft Score Breakdown
Points awarded for each scoring component:
- Diagnosis/Issues match (0-40 pts)
- Availability fit (0-15 pts)
- Distance (0-15 pts)
- Language match (0-10 pts)
- Age specialization (0-5 pts)
- Gender preference (0-10 pts)
- Insurance preference (0-5 pts)
- Profile quality (0-5 pts)
- **Total score** (0-100 pts)

### 4. Inclusion Status
- ✅ INCLUDED - Therapist passed all filters and is in results
- ❌ EXCLUDED - Therapist failed a hard filter and was removed

## Example Log Output

```
🔍 Matching Engine Debug - Search Inputs
  Location: { city: 'Praha', coords: { lat: 50.0755, lon: 14.4378 } }
  Meeting Type: ordinace
  Gender Preference: female (STRICT)
  ...

📊 Processing 10 therapists...

🔍 Therapist: Anna Nováková (therapist-123)
📋 Attributes: { id: 'therapist-123', name: 'Anna Nováková', gender: 'female', ... }
✅ INCLUDED
🚫 Hard Filters:
  Meeting Type: ✅
  Barrier-Free: ✅
  Age Group: ✅
  Gender: ✅
  Status: ✅
📊 Score Breakdown:
  Diagnosis: 40 pts
  Availability: 15 pts
  Distance: 12 pts
  Language: 10 pts
  Age: 5 pts
  Gender: 10 pts
  Insurance: 5 pts
  Quality: 5 pts
  TOTAL: 102 pts (capped at 100)

🔍 Therapist: Jan Svoboda (therapist-456)
📋 Attributes: { id: 'therapist-456', name: 'Jan Svoboda', gender: 'male', ... }
❌ EXCLUDED
🚫 Hard Filters:
  Meeting Type: ✅
  Gender: ❌ Therapist is male, but required female (strict mode)
  ...

✅ Matching complete: 5 therapists included out of 10 total
```

## Disabling Debug Mode

To disable debug mode:
1. Ensure `NODE_ENV` is set to `production`, OR
2. Remove or set `NEXT_PUBLIC_MATCHING_DEBUG=false` in your environment variables

## Performance Impact

- **Development mode**: Minimal impact, logs are only generated when enabled
- **Production mode**: Zero impact, all debug code is conditionally compiled/executed
- Debug checks use simple boolean checks and are optimized for performance

## Notes

- Debug mode does **not** affect the matching logic or results
- All logs are informational only
- No user-facing UI changes are made
- All Czech UI text remains unchanged

