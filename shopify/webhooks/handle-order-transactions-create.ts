import { ShopifyHookContext } from "./types/ShopifyHookContext.type";

const util = require("util");

export default async (context: ShopifyHookContext, event: any) => {
  const log = (str: string) =>
    console.log(`handle-order-transactions-create(id: ${event.id}): ${str}`);

  log("webhook starting");

  const {
    receipt: { gift_card_id },
  } = event;

  const knex = context.app.get("knexClient");

  if (!gift_card_id) {
    return { success: true, no_gift_card: true };
  }

  const [gift_card_found] = await knex
    .select()
    .from("gifts")
    .where({ shopify_gift_card_id: gift_card_id });

  if (gift_card_found && gift_card_found?.id) {
    const { id } = gift_card_found;

    if (id && id > 0) {
      await knex.raw("UPDATE gifts set redeemed =1 where id = :gift_card_id", {
        gift_card_id: id,
      });
    }
  }

  return { success: true };
};
