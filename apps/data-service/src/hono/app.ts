import { getDestinationForCountry, getRoutingDestinations } from '@/helpers/route-ops';
import { cloudflareInfoSchema } from '@repo/data-ops/zod-schema/links';
import { LinkClickMessageType } from '@repo/data-ops/zod-schema/queue';
import { Hono } from 'hono';


export const app = new Hono<{ Bindings: Env }>();

app.get('/:id', async (c) => {
  const id = c.req.param('id');

  const linkInfoFromDB = await getRoutingDestinations(c.env, id);

  if (!linkInfoFromDB) {
    return c.json({ error: 'Destination not found' }, 404);
  }

  const cfHeaders = cloudflareInfoSchema.safeParse(c.req.raw.cf);
  if (!cfHeaders.success) {
    return c.text('Invalid Cloudflare headers', 400);
  }

  const headers = cfHeaders.data;
  const destination = getDestinationForCountry(linkInfoFromDB, headers.country);

  const queueMessage: LinkClickMessageType = {
    type: "LINK_CLICK",
    data: {
      id,
      country: headers.country,
      destination,
      accountId: linkInfoFromDB.accountId,
      latitude: headers.latitude,
      longitude: headers.longitude,
      timestamp: new Date().toISOString(),
    },
  };

  c.executionCtx.waitUntil(c.env.QUEUE.send(queueMessage));
  return c.redirect(destination);
});



export default app;