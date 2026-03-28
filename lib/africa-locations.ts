import { Country, State, type ICountry, type IState } from "country-state-city";

/**
 * UN-style sovereign states on the African continent (ISO 3166-1 alpha-2).
 * Used to limit onboarding to Africa while using full subdivision data from country-state-city.
 */
const AFRICA_ISO_CODES = new Set([
  "DZ",
  "AO",
  "BJ",
  "BW",
  "BF",
  "BI",
  "CV",
  "CM",
  "CF",
  "TD",
  "KM",
  "CG",
  "CD",
  "CI",
  "DJ",
  "EG",
  "GQ",
  "ER",
  "SZ",
  "ET",
  "GA",
  "GM",
  "GH",
  "GN",
  "GW",
  "KE",
  "LS",
  "LR",
  "LY",
  "MG",
  "MW",
  "ML",
  "MR",
  "MU",
  "MA",
  "MZ",
  "NA",
  "NE",
  "NG",
  "RW",
  "ST",
  "SN",
  "SC",
  "SL",
  "SO",
  "ZA",
  "SS",
  "SD",
  "TZ",
  "TG",
  "TN",
  "UG",
  "ZM",
  "ZW",
]);

let cachedCountries: ICountry[] | null = null;

export function getAfricanCountries(): ICountry[] {
  if (!cachedCountries) {
    cachedCountries = Country.getAllCountries()
      .filter((c) => AFRICA_ISO_CODES.has(c.isoCode))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  return cachedCountries;
}

export function getStatesForCountry(isoCode: string): IState[] {
  if (!isoCode) return [];
  return State.getStatesOfCountry(isoCode);
}

export function findAfricanCountryByName(name: string): ICountry | undefined {
  const t = name.trim().toLowerCase();
  if (!t) return undefined;
  return getAfricanCountries().find((c) => c.name.toLowerCase() === t);
}

export function findStateByName(states: IState[], name: string): IState | undefined {
  const t = name.trim().toLowerCase();
  if (!t) return undefined;
  return states.find((s) => s.name.toLowerCase() === t);
}
