// assume you have user id and address id

import { handlePatchedSalesOrderAttributes } from "../src/utils/handlePatchedSalesOrderAttributes";
import { query } from "../src/utils/query";
import { ShopifyHookContext } from "./types/ShopifyHookContext.type";

export default async (context: ShopifyHookContext, event: any) => {
  const log = (str: string) =>
    console.log(`handle-update-order(id: ${event.id}): ${str}`);

  log("webhook starting");

  try {
    const [{ id: user_id }] = await query(
      context.app.get("knexClient"),
      `select id from users where shopify_customer_id = :shopify_customer_id`,
      {
        shopify_customer_id: event.customer
          ? event.customer.id
          : event.customer_id,
      }
    );

    const user_sales_orders: any = await context.app
      .service("sales-orders")
      .find({
        query: {
          user_id,
          deleted_at: null,
          delivery_date: {
            $gt: new Date(),
          },
        },
        paginate: false,
      });

    if (event.cancelled_at) {
      log(`deleting line items sales order attributes for order ${event.id}`);

      await context.app.service("sales-order-attributes").patch(
        null,
        {
          deleted_at: new Date(event.cancelled_at),
        },
        {
          query: {
            shopify_order_id: event.id,
            sales_order_id: {
              $in: user_sales_orders.map((so: any) => so.id),
            },
          },
        }
      );

      const unique_delivery_dates: string[] = Array.from(
        new Set(
          user_sales_orders.map((so: any) => {
            return so.delivery_date;
          })
        )
      );

      for (const delivery_date of unique_delivery_dates) {
        await handlePatchedSalesOrderAttributes(
          context.app,
          user_id,
          delivery_date
        );
      }
    }

    return { success: true };
  } catch (error) {
    log(JSON.stringify(error));
    log("There was an issue handling order update.");
    return { success: false, error: JSON.stringify(error) };
  }
};
