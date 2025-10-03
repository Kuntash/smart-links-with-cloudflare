import { getLink } from "@repo/data-ops/queries/links";
import { linkSchema, LinkSchemaType } from "@repo/data-ops/zod-schema/links";

async function getLinkInfoFromCache(env: Env, linkId: string) {
  const linkInfo = await env.CACHE.get(linkId);
  if (!linkInfo) {
    return null;
  }

  try {
    const parsedLinkInfo = JSON.parse(linkInfo);
    return linkSchema.parse(parsedLinkInfo);
  } catch (error) {
    return null;
  }
}

const TTL_TIME = 60 * 60 * 24 // 1 day

async function saveLinkInfoToKv(env: Env, linkId: string, linkInfo: LinkSchemaType) {
	try {
		await env.CACHE.put(linkId, JSON.stringify(linkInfo),
        {
            expirationTtl: TTL_TIME
        }
    );
	} catch (error) {
		console.error('Error saving link info to KV:', error);
	}
}

export async function getRoutingDestinations(env: Env, linkId: string) {
  const linkInfo = await getLinkInfoFromCache(env, linkId);
  if (linkInfo) return linkInfo;
  const linkInfoFromDb = await getLink(linkId);
  if (!linkInfoFromDb) return null;
  await saveLinkInfoToKv(env, linkId, linkInfoFromDb);
  return linkInfoFromDb
}

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