import { LinkSchemaType } from "@repo/data-ops/zod-schema/links";

export function getDestinationForCountry(linkInfo: LinkSchemaType, countryCode?: string) {
  if (!countryCode) {
    return linkInfo.destinations.default;
  }

  // Check if the country code exists in the destinations
  if (linkInfo.destinations[countryCode]) {
    return linkInfo.destinations[countryCode];
  }

  // Fallback to default destination
  return linkInfo.destinations.default;
}