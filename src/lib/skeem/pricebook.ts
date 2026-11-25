/**
 * Pricing and commission, as confirmed by the product owner (Nate, super admin).
 *
 * CONFIRMED: the three regional price points and the 15% commission rate.
 * NOT YET RECORDED: what each price buys (package/scope) and whether it is
 * once-off or recurring. Until that is recorded, MOSES must state the amount
 * and region only and must not describe inclusions or billing frequency.
 */
export const PRICEBOOK_VERSION = 1;
export const COMMISSION_RATE = 0.15;
export const PRICE_SCOPE_RECORDED = false;

export type PriceRegion = 'SOUTH_AFRICA' | 'AFRICA' | 'INTERNATIONAL';

export interface PricePoint {
  region: PriceRegion;
  label: string;
  currency: 'ZAR' | 'USD';
  amount: number;
  display: string;
}

export const PRICE_REGIONS: readonly PriceRegion[] = ['SOUTH_AFRICA', 'AFRICA', 'INTERNATIONAL'];

export const PRICEBOOK: Record<PriceRegion, PricePoint> = {
  SOUTH_AFRICA: { region: 'SOUTH_AFRICA', label: 'Local (South Africa)', currency: 'ZAR', amount: 1600, display: 'R1,600' },
  AFRICA: { region: 'AFRICA', label: 'Africa (outside South Africa)', currency: 'USD', amount: 100, display: '$100' },
  INTERNATIONAL: { region: 'INTERNATIONAL', label: 'International (outside Africa)', currency: 'USD', amount: 1000, display: '$1,000' }
};

export function isPriceRegion(value: unknown): value is PriceRegion {
  return typeof value === 'string' && (PRICE_REGIONS as readonly string[]).includes(value);
}

export function priceFor(region?: PriceRegion | null): PricePoint | null {
  return region && isPriceRegion(region) ? PRICEBOOK[region] : null;
}

const SA = /\b(south africa|s\.?a\.?|gauteng|johannesburg|joburg|pretoria|tshwane|cape town|western cape|durban|kwazulu|kzn|eastern cape|port elizabeth|gqeberha|bloemfontein|free state|limpopo|mpumalanga|north west|northern cape|polokwane|nelspruit|mbombela|centurion|sandton|soweto)\b/i;
const AFRICA = /\b(zimbabwe|harare|bulawayo|botswana|gaborone|namibia|windhoek|zambia|lusaka|mozambique|maputo|malawi|lilongwe|lesotho|maseru|eswatini|swaziland|mbabane|kenya|nairobi|tanzania|dar es salaam|uganda|kampala|rwanda|kigali|nigeria|lagos|abuja|ghana|accra|ethiopia|addis|egypt|cairo|morocco|casablanca|angola|luanda|cameroon|senegal|dakar|ivory coast|c[oô]te d.ivoire|drc|congo|kinshasa|mauritius|africa)\b/i;
const INTL = /\b(uk|united kingdom|england|london|usa|united states|u\.s\.|new york|canada|toronto|australia|sydney|new zealand|germany|france|netherlands|ireland|uae|dubai|saudi|india|singapore|europe|europe)\b/i;

/** A suggestion only. The lead's saved `priceRegion` is the source of truth. */
export function suggestPriceRegion(location?: string): PriceRegion | null {
  const text = (location || '').trim();
  if (!text) return null;
  if (SA.test(text)) return 'SOUTH_AFRICA';
  if (AFRICA.test(text)) return 'AFRICA';
  if (INTL.test(text)) return 'INTERNATIONAL';
  return null;
}
