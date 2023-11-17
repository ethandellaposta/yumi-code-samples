// assume you have user id and address id

import { query } from "../src/utils/query";
import { ShopifyHookContext } from "./types/ShopifyHookContext.type";
const crypto = require("crypto");

export default async (context: ShopifyHookContext, event: any) => {
  const log = (str: string) =>
    console.log(`handle-create-customer(id: ${event.id}): ${str}`);

  log("webhook starting");

  return {
    success: true,
  };
}

