import spacetime from "spacetime";
import { handlePatchedSalesOrderAttributes } from "../src/utils/handlePatchedSalesOrderAttributes";
import { query } from "../src/utils/query";
import { ShopifyHookContext } from "./types/ShopifyHookContext.type";

export default async (context: ShopifyHookContext, event: any) => {
  const log = (str: string) =>
    console.log(`handle-update-subscription-contract(id: ${event.id}): ${str}`);

  log("webhook starting");

  try {
    const [user] = await query(
      context.app.get("knexClient"),
      `select * from users where shopify_customer_id = :shopify_customer_id`,
      {
        shopify_customer_id: event.customer_id,
      }
    );

    const [usp] = (await context.app.service("user-subscription-plans").find({
      query: {
        shopify_subscription_contract_id: event.id,
        user_id: user.id,
      },
      paginate: false,
    })) as any[];

    const uspis: any = await context.app
      .service("user-subscription-plan-items")
      .find({
        query: {
          user_subscription_plan_id: usp.id,
          ends_at: null,
        },
        paginate: false,
      });

    const subscription_lines_res = await context.app
      .service("shopify-partner-graphql-client")
      .create({
        query: `
      query {
        subscriptionContract(id: "gid://shopify/SubscriptionContract/${event.id}")  {
          id
          nextBillingDate
          lines(first: 10) {
            edges {
              node {
                id
                variantId
                sellingPlanId
                quantity
              }
            }
          }
        }
      }
    `,
      });

    interface LineProduct {
      id?: number;
      child_id?: number;
      shopify_subscription_line_id: string;
      product_id: number;
      quantity: number;
    }

    const subscription_line_products: LineProduct[] = (
      await Promise.all(
        subscription_lines_res.body.data.subscriptionContract.lines.edges.map(
          async (l: any) => {
            const selling_plans_res: any = await context.app
              .service("selling-plans")
              .find({
                query: {
                  billing_recurring_interval:
                    event.billing_policy.interval.toUpperCase(),
                  billing_recurring_interval_count:
                    event.billing_policy.interval_count,
                  delivery_recurring_interval:
                    event.delivery_policy.interval.toUpperCase(),
                  delivery_recurring_interval_count:
                    event.delivery_policy.interval_count,
                },
                paginate: false,
              });
            const { id: new_selling_plan_id } = selling_plans_res[0];
            const [product] = await context.app.service("products").find({
              query: {
                selling_plan_id: new_selling_plan_id,
                shopify_variant_id: l.node.variantId.replace(/\D/g, ""),
                deleted_at: null,
              },
              paginate: false,
            });

            return {
              shopify_subscription_line_id: l.node.id.replace(
                "gid://shopify/SubscriptionLine/",
                ""
              ),
              product_id: product.id,
              quantity: l.node.quantity,
            };
          }
        )
      )
    ).sort(
      (a, b) => a.shopify_subscription_line_id - b.shopify_subscription_line_id
    );

    const uspi_products: LineProduct[] = uspis.map((uspi: any) => ({
      id: uspi.id,
      shopify_subscription_line_id: uspi.shopify_subscription_line_id,
      product_id: uspi.product_id,
      quantity: uspi.quantity,
      child_id: uspi.child_id,
    }));

    const uspis_to_update = subscription_line_products.filter((slp) => {
      const uspis = uspi_products.filter(
        (uspi) =>
          uspi.shopify_subscription_line_id === slp.shopify_subscription_line_id
      );

      return (
        uspis.length > 0 &&
        (uspis[uspis.length - 1].product_id !== slp.product_id ||
          uspis[uspis.length - 1].quantity !== slp.quantity)
      );
    });

    const uspis_to_remove = subscription_line_products.filter((slp) => {
      const uspi = uspi_products.find(
        (uspi) =>
          uspi.shopify_subscription_line_id === slp.shopify_subscription_line_id
      );
      return !uspi;
    });

    const uspis_to_create = subscription_line_products.filter((slp) => {
      const uspi = uspi_products.find(
        (uspi) =>
          uspi.shopify_subscription_line_id === slp.shopify_subscription_line_id
      );
      return !uspi;
    });

    const future_user_sales_orders = (await context.app
      .service("sales-orders")
      .find({
        query: {
          user_id: user.id,
          deleted_at: null,
          delivery_date: {
            $gt: new Date(),
          },
        },
        paginate: false,
      })) as any[];

    if (
      uspis_to_update.length > 0 ||
      uspis_to_remove.length > 0 ||
      uspis_to_create.length > 0
    ) {
      for (let i = 0; i < uspis_to_update.length; i++) {
        const uspi_to_update = uspis_to_update[i];
        const old_uspi = uspis.find(
          (uspi: any) =>
            uspi.shopify_subscription_line_id ===
            uspi_to_update.shopify_subscription_line_id &&
            uspi.ends_at === null
        );

        log(
          `updating user subscription plan item ${old_uspi?.id} to ${uspi_to_update}`
        );

        if (!old_uspi) {
          continue;
        }

        await context.app
          .service("user-subscription-plan-items")
          .patch(old_uspi.id, {
            ends_at: spacetime(old_uspi.starts_at).isAfter(spacetime.now())
              ? spacetime.now().toNativeDate()
              : usp.shopify_next_billing_date,
          });
        const new_uspi = await context.app
          .service("user-subscription-plan-items")
          .create({
            user_subscription_plan_id: usp.id,
            starts_at: usp.shopify_next_billing_date,
            shopify_subscription_line_id:
              uspi_to_update.shopify_subscription_line_id,
            product_id: uspi_to_update.product_id,
            quantity: uspi_to_update.quantity,
            child_id: old_uspi.child_id,
          });

        let deleted_soas: any;
        let updated_soas: any;

        const old_product = await context.app
          .service("products")
          .get(old_uspi.product_id);
        const product = await context.app
          .service("products")
          .get(uspi_to_update.product_id);

        const { handle: old_product_handle } = await context.app
          .service("shopify-products")
          .get(old_product.shopify_product_id);
        const { handle: product_handle } = await context.app
          .service("shopify-products")
          .get(product.shopify_product_id);

        const [jar_count] = product_handle.split("-");
        const [old_jar_count] = old_product_handle.split("-");
        const jar_count_to_meal_plan_id: any = {
          8: 121,
          16: 141,
          24: 161,
        };

        if (
          jar_count_to_meal_plan_id[jar_count] !==
          jar_count_to_meal_plan_id[old_jar_count]
        ) {
          deleted_soas = await context.app
            .service("sales-order-attributes")
            .patch(
              null,
              {
                deleted_at: new Date(),
              },
              {
                query: {
                  user_subscription_plan_item_id: old_uspi.id,
                  shopify_order_id: null,
                  sales_order_id: {
                    $in: future_user_sales_orders.map((so) => so.id),
                  },
                },
              }
            );
        } else {
          updated_soas = await context.app
            .service("sales-order-attributes")
            .patch(
              null,
              {
                user_subscription_plan_item_id: new_uspi.id,
              },
              {
                query: {
                  user_subscription_plan_item_id: old_uspi.id,
                  shopify_order_id: null,
                  sales_order_id: {
                    $in: future_user_sales_orders.map((so) => so.id),
                  },
                },
              }
            );
        }

        if (deleted_soas) {
          const dates = (
            (await Promise.all(
              deleted_soas.map(async (deleted_soa: any) => {
                const sales_order = await context.app
                  .service("sales-orders")
                  .get(deleted_soa.sales_order_id);
                return sales_order.delivery_date;
              })
            )) as any[]
          ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
          const earliest_date = dates[0];
          const latest_date = dates[dates.length - 1];

          const week_count =
            spacetime(earliest_date as any).diff(spacetime(latest_date as any))
              .weeks + 1;

          const soas_special_menu_id = (await context.app
            .service("sales-order-attributes")
            .find({
              query: {
                user_subscription_plan_item_id: old_uspi.id,
                special_menu_id: {
                  $ne: null,
                },
                sales_order_id: {
                  $in: future_user_sales_orders.map((so) => so.id),
                },
              },
              paginate: false,
            })) as any[];

          const old_special_menu_id =
            soas_special_menu_id.length > 0
              ? soas_special_menu_id[0].special_menu_id
              : null;

          let new_special_menu_id: any = null;
          if (old_special_menu_id) {
            const [child] = await context.app.service("children").find({
              query: {
                parent_id: user.id,
              },
            });

            const { type } = await context.app
              .service("special-menus-new")
              .get(old_special_menu_id);
            const special_menu_res = await context.app
              .service("special-menus-meta")
              .find({
                query: {
                  date: earliest_date,
                  baby_birthday: child.birthday,
                  meal_plan_id: jar_count_to_meal_plan_id[jar_count],
                  new_order: 0,
                },
              });

            const special_menu = special_menu_res.find(
              (sm: any) => sm.type === type
            );
            new_special_menu_id = special_menu.id;
          }

          const unique_delivery_dates = Array.from(
            new Set(
              future_user_sales_orders.map((so: any) => {
                return so.delivery_date;
              })
            )
          );

          for (const delivery_date of unique_delivery_dates) {
            await handlePatchedSalesOrderAttributes(
              context.app,
              user.id,
              delivery_date
            );
          }

          await context.app.service("shopify-generate-sales-orders").create({
            user_id: user.id,
            week_count,
            replace_preferences: true,
            allow_ends_at_not_null: true,
            start_date: earliest_date,
            shopify_subscription_contract: {
              user_subscription_plan_item_id: new_uspi.id,
              id: event.id,
              product_id: uspi_to_update.product_id,
              special_menu_id: new_special_menu_id,
              quantity: uspi_to_update.quantity,
            },
          });
        }
      }

      for (const uspi_to_remove of uspis_to_remove) {
        await context.app.service("sales-order-attributes").patch(
          null,
          {
            deleted_at: new Date(),
          },
          {
            query: {
              user_subscription_plan_item_id: uspi_to_remove.id,
              shopify_order_id: null,
              sales_order_id: {
                $in: future_user_sales_orders.map((so) => so.id),
              },
            },
          }
        );

        const unique_delivery_dates = Array.from(
          new Set(
            future_user_sales_orders.map((so: any) => {
              return so.delivery_date;
            })
          )
        );

        for (const delivery_date of unique_delivery_dates) {
          await handlePatchedSalesOrderAttributes(
            context.app,
            user.id,
            delivery_date
          );
        }
      }
    }

    if (event.status === "cancelled") {
      const [first_name, ...rest_of_name] = user.name.split(" ");
      await context.app.service("churnbuster-cancellations").create({
        subscription: {
          source: "shopify_subscription",
          source_id: event.id,
        },
        customer: {
          source: "shopify_customer",
          source_id: event.customer_id,
          email: user.email,
          properties: {
            first_name,
            last_name: rest_of_name.join(" ")
          }
        }
      })


      if (uspis.length === 1) {
        log(`cancelling user subscription plan ${usp.id}`);
        await context.app.service("user-subscription-plans").patch(usp.id, {
          ends_at: new Date(),
        });
      }

      for (const uspi of uspis) {
        log(
          `cancelling user subscription plan item ${uspi.id} at ${usp.shopify_next_billing_date}`
        );
        await context.app
          .service("user-subscription-plan-items")
          .patch(uspi.id, {
            ends_at: usp.shopify_next_billing_date,
          });
      }

      const sales_orders = (await context.app.service("sales-orders").find({
        query: {
          delivery_date: {
            $gt: new Date(),
          },
          deleted_at: null,
          user_id: user.id,
        },
        paginate: false,
      })) as any[];
      const sales_order_ids = sales_orders.map((so) => so.id);

      await context.app.service("sales-order-attributes").patch(
        null,
        {
          deleted_at: new Date(),
        },
        {
          query: {
            sales_order_id: {
              $in: sales_order_ids,
            },
            user_subscription_plan_item_id: {
              $in: uspis.map((uspi: any) => uspi.id),
            },
            shopify_order_id: null,
          },
        }
      );


      const unique_delivery_dates = Array.from(
        new Set(
          sales_orders.map((so: any) => {
            return so.delivery_date;
          })
        )
      );

      for (const delivery_date of unique_delivery_dates) {
        await handlePatchedSalesOrderAttributes(
          context.app,
          user.id,
          delivery_date
        );
      }

      await context.app.service("user-attributes").remove(null, {
        query: {
          user_id: user.id,
          attribute: "failed-subscription-billing-attempt",
          value: event.id
        }
      })
    }

    if (
      new Date(usp.shopify_next_billing_date).toISOString() !==
      new Date(
        subscription_lines_res.body.data.subscriptionContract.nextBillingDate
      ).toISOString()
    ) {
      await context.app.service("user-subscription-plans").patch(usp.id, {
        shopify_next_billing_date: new Date(
          subscription_lines_res.body.data.subscriptionContract.nextBillingDate
        ),
      });
    }
    return { success: true };
  } catch (error) {
    log(error as any);
    log(JSON.stringify(error));
    log("There was an issue handling the subscription contract update.");
    return { success: false, error: JSON.stringify(error) };
  }
};
