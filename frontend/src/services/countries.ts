// La Vaca - Countries Service
// Fetches country data from REST Countries API

import type {Country} from "@lavaca/types";

interface RestCountryResponse {
  flag: string;
  name: {
    common: string;
    nativeName?: Record<string, {common: string}>;
  };
  idd: {
    root: string;
    suffixes?: string[];
  };
  cca2: string;
}

// Fallback data (minimal set in case API fails)
const FALLBACK_COUNTRIES: Country[] = [
  {flag: "🇨🇴", name: "Colombia", dial: "+57", code: "CO"},
  {flag: "🇲🇽", name: "México", dial: "+52", code: "MX"},
  {flag: "🇦🇷", name: "Argentina", dial: "+54", code: "AR"},
  {flag: "🇨🇱", name: "Chile", dial: "+56", code: "CL"},
  {flag: "🇵🇪", name: "Perú", dial: "+51", code: "PE"},
  {flag: "🇪🇨", name: "Ecuador", dial: "+593", code: "EC"},
  {flag: "🇻🇪", name: "Venezuela", dial: "+58", code: "VE"},
  {flag: "🇧🇷", name: "Brasil", dial: "+55", code: "BR"},
  {flag: "🇧🇴", name: "Bolivia", dial: "+591", code: "BO"},
  {flag: "🇵🇾", name: "Paraguay", dial: "+595", code: "PY"},
  {flag: "🇺🇾", name: "Uruguay", dial: "+598", code: "UY"},
  {flag: "🇵🇦", name: "Panamá", dial: "+507", code: "PA"},
  {flag: "🇨🇷", name: "Costa Rica", dial: "+506", code: "CR"},
  {flag: "🇬🇹", name: "Guatemala", dial: "+502", code: "GT"},
  {flag: "🇭🇳", name: "Honduras", dial: "+504", code: "HN"},
  {flag: "🇸🇻", name: "El Salvador", dial: "+503", code: "SV"},
  {flag: "🇳🇮", name: "Nicaragua", dial: "+505", code: "NI"},
  {flag: "🇩🇴", name: "Rep. Dominicana", dial: "+1", code: "DO"},
  {flag: "🇨🇺", name: "Cuba", dial: "+53", code: "CU"},
  {flag: "🇺🇸", name: "Estados Unidos", dial: "+1", code: "US"},
  {flag: "🇪🇸", name: "España", dial: "+34", code: "ES"},
];

// Cache
let cachedCountries: Country[] | null = null;

/**
 * Fetches ALL countries from REST Countries API
 * Falls back to minimal hardcoded list on error
 */
export async function fetchCountries(): Promise<Country[]> {
  // Return cached data if available
  if (cachedCountries) {
    return cachedCountries;
  }

  try {
    // Fetch ALL countries
    const url = "https://restcountries.com/v3.1/all?fields=name,idd,flag,cca2";

    const response = await fetch(url, {
      headers: {Accept: "application/json"},
      // 10 second timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data: RestCountryResponse[] = await response.json();

    // Transform to our format
    const countries: Country[] = data
      .map((country) => {
        const dial = country.idd.root + (country.idd.suffixes?.[0] || "");
        // Use native name if available (for Spanish-speaking countries)
        const nativeName = country.name.nativeName?.spa?.common || country.name.common;

        return {
          flag: country.flag,
          name: nativeName,
          dial: dial,
          code: country.cca2,
        };
      })
      // Filter out countries without dial codes
      .filter((country) => country.dial && country.dial !== "+");

    // Sort by name
    countries.sort((a, b) => a.name.localeCompare(b.name));

    // Cache the result
    cachedCountries = countries;

    return countries;
  } catch (error) {
    console.warn("[Countries] Failed to fetch from API, using fallback:", error);
    // Cache the fallback
    cachedCountries = FALLBACK_COUNTRIES;
    return FALLBACK_COUNTRIES;
  }
}

/**
 * Returns countries synchronously (uses cache or fallback)
 */
export function getCountriesSync(): Country[] {
  return cachedCountries || FALLBACK_COUNTRIES;
}

/**
 * Clears the cache (useful for testing)
 */
export function clearCountriesCache(): void {
  cachedCountries = null;
}
