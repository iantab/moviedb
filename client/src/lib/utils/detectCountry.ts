export function detectCountry(): string {
  try {
    const locale = navigator.language
    if (locale && locale.includes("-")) {
      const region = locale.split("-")[1].toUpperCase()
      if (region.length === 2) return region
    }
  } catch {
    // SSR or test environment
  }
  return "US"
}
