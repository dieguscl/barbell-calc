// Stable per-name color: same name always maps to the same color (so a person
// keeps their color across the tabs and the results page), but the assignment
// looks random across different names.

const PALETTE = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f43f5e", // rose
]

export function nameColor(name: string, index = 0): string {
  const key = name.trim().toLowerCase()
  if (!key) return PALETTE[index % PALETTE.length]
  let h = 0
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) | 0
  }
  return PALETTE[Math.abs(h) % PALETTE.length]
}
