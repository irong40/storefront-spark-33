// Mirror of src/lib/delivery-zones.ts — keep in sync when changing the list.
// Server-side enforcement so client-side bypass can't slip an out-of-zone
// delivery order through process-payment.

export const HAMPTON_ROADS_ZIPS: ReadonlySet<string> = new Set([
  // Portsmouth
  "23701", "23702", "23703", "23704", "23707", "23708", "23709",
  // Norfolk
  "23502", "23503", "23504", "23505", "23507", "23508", "23509",
  "23510", "23511", "23513", "23517", "23518", "23523",
  // Virginia Beach
  "23451", "23452", "23453", "23454", "23455", "23456", "23457",
  "23459", "23460", "23461", "23462", "23463", "23464", "23465",
  // Chesapeake
  "23320", "23321", "23322", "23323", "23324", "23325", "23326",
  "23327", "23328",
  // Suffolk
  "23432", "23433", "23434", "23435", "23436", "23437", "23438", "23439",
  // Newport News
  "23601", "23602", "23603", "23604", "23605", "23606", "23607",
  "23608", "23609", "23612",
  // Hampton
  "23661", "23663", "23664", "23665", "23666", "23667", "23668",
  "23669", "23670", "23681",
  // Poquoson
  "23662",
  // Yorktown / York County
  "23690", "23691", "23692", "23693", "23694",
  // Williamsburg / James City
  "23185", "23186", "23187", "23188", "23168",
  // Smithfield / Isle of Wight
  "23430", "23431",
  // Gloucester / Mathews
  "23061", "23062", "23072", "23128",
]);

export function isInDeliveryZone(zip: string | null | undefined): boolean {
  if (!zip) return false;
  const five = zip.trim().slice(0, 5);
  return HAMPTON_ROADS_ZIPS.has(five);
}
