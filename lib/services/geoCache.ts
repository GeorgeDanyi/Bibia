import fs from 'fs'
import path from 'path'

export type GeoCacheEntry = { lat: number; lng: number; source: 'saas'|'gazetteer'|'fallback'; confidence?: number; ts: number }

const MEMORY: Map<string, GeoCacheEntry> = new Map()
const CACHE_FILE = path.resolve(process.cwd(), 'data', 'geo_cache.json')
const TTL_MS = 1000 * 60 * 60 * 24 * 30

// Lazy-loaded disk cache to avoid reading on every getGeoCache call
let diskCache: Record<string, GeoCacheEntry> | null = null
let diskCacheLoaded = false

// Debounced disk write to avoid blocking on every setGeoCache call
let saveTimeout: NodeJS.Timeout | null = null
const SAVE_DEBOUNCE_MS = 1000 // Save to disk max once per second

function loadDisk(): Record<string, GeoCacheEntry> {
  if (diskCacheLoaded && diskCache !== null) {
    return diskCache as Record<string, GeoCacheEntry>
  }
  try {
    const raw = fs.readFileSync(CACHE_FILE, 'utf8')
    const parsed = JSON.parse(raw)
    diskCache = (typeof parsed === 'object' && parsed ? parsed : {}) as Record<string, GeoCacheEntry>
    diskCacheLoaded = true
    return diskCache as Record<string, GeoCacheEntry>
  } catch {
    diskCache = {} as Record<string, GeoCacheEntry>
    diskCacheLoaded = true
    return diskCache as Record<string, GeoCacheEntry>
  }
}

function saveDisk(obj: Record<string, GeoCacheEntry>) {
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true })
    fs.writeFileSync(CACHE_FILE, JSON.stringify(obj))
  } catch {
  }
}

// Debounced save function
function debouncedSave() {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  saveTimeout = setTimeout(() => {
    if (diskCache !== null) {
      saveDisk(diskCache)
    }
    saveTimeout = null
  }, SAVE_DEBOUNCE_MS)
}

export function getGeoCache(key: string): GeoCacheEntry | null {
  const k = (key || '').toLowerCase()
  const mem = MEMORY.get(k)
  const now = Date.now()
  if (mem && (now - mem.ts) < TTL_MS) return mem
  
  // Only load disk cache if memory cache miss
  const disk = loadDisk()
  const hit = disk[k]
  if (hit && (now - hit.ts) < TTL_MS) {
    MEMORY.set(k, hit)
    return hit
  }
  return null
}

export function setGeoCache(key: string, value: Omit<GeoCacheEntry, 'ts'>): void {
  const k = (key || '').toLowerCase()
  const entry: GeoCacheEntry = { ...value, ts: Date.now() }
  MEMORY.set(k, entry)
  
  // Update in-memory disk cache without reading from disk
  if (diskCache === null) {
    diskCache = loadDisk()
  }
  diskCache[k] = entry
  
  // Debounced save to avoid blocking
  debouncedSave()
}
