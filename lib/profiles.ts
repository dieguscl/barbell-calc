// Multi-person profiles. The device owner ("Me") keeps using the existing
// single-user storage; profiles here are *other people* imported via share
// link / QR. A virtual "Me" profile is synthesized on demand so side-by-side
// calculations can treat everyone uniformly.

export type Gender = "M" | "F"
export type Units = "KG" | "LB"

export interface Profile {
  id: string
  name: string
  gender: Gender
  units: Units
  /** movement name (lowercased) -> personal record */
  movements: { [movement: string]: { pr: string } }
}

/** Subset that travels in a share link. */
export interface SharedProfile {
  name: string
  gender: Gender
  units: Units
  movements: { [movement: string]: { pr: string } }
}

const PROFILES_KEY = "barbell-calc-profiles"
// Reuse the existing single-user keys to synthesize the "Me" profile.
const LEGACY_PRS_KEY = "barbell-calc-movement-prs"
const UNITS_KEY = "barbell-calc-units"
const BAR_KEY = "barbell-calc-bar-weight"

export const ME_ID = "me"

/** Default bar weight (as a string, matching form values) for a gender. */
export function genderToBar(gender: Gender, units: Units): string {
  if (units === "KG") return gender === "F" ? "15" : "20"
  return gender === "F" ? "35" : "45"
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "profile"
}

function isBrowser() {
  return typeof window !== "undefined"
}

export function loadProfiles(): Profile[] {
  if (!isBrowser()) return []
  try {
    const raw = localStorage.getItem(PROFILES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((p): p is Profile => p && typeof p.name === "string")
  } catch {
    return []
  }
}

export function saveProfiles(profiles: Profile[]): void {
  if (!isBrowser()) return
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
}

export function getProfile(id: string): Profile | undefined {
  if (id === ME_ID) return buildMeProfile()
  return loadProfiles().find((p) => p.id === id)
}

/** Insert or replace a profile (matched by id), returning the new list. */
export function upsertProfile(profile: Profile): Profile[] {
  const profiles = loadProfiles()
  const idx = profiles.findIndex((p) => p.id === profile.id)
  if (idx >= 0) profiles[idx] = profile
  else profiles.push(profile)
  saveProfiles(profiles)
  return profiles
}

export function deleteProfile(id: string): Profile[] {
  const profiles = loadProfiles().filter((p) => p.id !== id)
  saveProfiles(profiles)
  return profiles
}

/** Rename a profile (id stays stable to keep references intact). */
export function renameProfile(id: string, newName: string): Profile[] {
  const name = newName.trim()
  if (!name) return loadProfiles()
  const profiles = loadProfiles().map((p) =>
    p.id === id ? { ...p, name } : p
  )
  saveProfiles(profiles)
  return profiles
}

/**
 * Build the device owner's profile from the existing single-user storage so it
 * can be listed alongside imported profiles. Gender is unknown for "Me", so we
 * leave the bar to the form's current selection (handled by the caller); we
 * still return a best-effort gender guess from the stored bar weight.
 */
export function buildMeProfile(meName = "Me"): Profile {
  const units: Units = isBrowser()
    ? ((localStorage.getItem(UNITS_KEY) as Units) || "KG")
    : "KG"
  const movements: Profile["movements"] = {}
  if (isBrowser()) {
    try {
      const stored = JSON.parse(localStorage.getItem(LEGACY_PRS_KEY) || "{}")
      for (const [movement, data] of Object.entries(stored)) {
        if (typeof data === "object" && data !== null && "pr" in (data as any)) {
          movements[movement] = { pr: String((data as any).pr) }
        } else if (typeof data === "string") {
          movements[movement] = { pr: data }
        }
      }
    } catch {
      // ignore malformed legacy data
    }
  }
  const bar = isBrowser() ? localStorage.getItem(BAR_KEY) : null
  const gender: Gender = bar === "15" || bar === "35" ? "F" : "M"
  return { id: ME_ID, name: meName, gender, units, movements }
}

// --- Sharing -----------------------------------------------------------------

function toBase64Url(str: string): string {
  const b64 = isBrowser()
    ? btoa(unescape(encodeURIComponent(str)))
    : Buffer.from(str, "utf-8").toString("base64")
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(payload: string): string {
  const b64 = payload.replace(/-/g, "+").replace(/_/g, "/")
  if (isBrowser()) return decodeURIComponent(escape(atob(b64)))
  return Buffer.from(b64, "base64").toString("utf-8")
}

export function encodeProfileShare(profile: Profile | SharedProfile): string {
  const shared: SharedProfile = {
    name: profile.name,
    gender: profile.gender,
    units: profile.units,
    movements: profile.movements,
  }
  return toBase64Url(JSON.stringify(shared))
}

export function decodeProfileShare(payload: string): SharedProfile | null {
  try {
    const parsed = JSON.parse(fromBase64Url(payload))
    if (
      !parsed ||
      typeof parsed.name !== "string" ||
      (parsed.gender !== "M" && parsed.gender !== "F") ||
      (parsed.units !== "KG" && parsed.units !== "LB") ||
      typeof parsed.movements !== "object"
    ) {
      return null
    }
    // sanitize movements
    const movements: SharedProfile["movements"] = {}
    for (const [k, v] of Object.entries(parsed.movements)) {
      if (v && typeof v === "object" && "pr" in (v as any)) {
        movements[k] = { pr: String((v as any).pr) }
      }
    }
    return {
      name: parsed.name,
      gender: parsed.gender,
      units: parsed.units,
      movements,
    }
  } catch {
    return null
  }
}

/** Turn a decoded shared profile into a storable Profile with a stable id. */
export function sharedToProfile(shared: SharedProfile): Profile {
  return { id: slugify(shared.name), ...shared }
}

export function buildShareUrl(origin: string, profile: Profile | SharedProfile): string {
  return `${origin}/import?p=${encodeProfileShare(profile)}`
}
