import getNextDeliveryDate from "../src/utils/getNextDeliveryDate";
import assignOrCreateUserShopify from "../src/hooks/assignOrCreateUserShopify.hook";
import { Unprocessable } from "@feathersjs/errors";
import spacetime from "spacetime";
import { Application } from "../src/declarations";
import { query } from "../src/utils/query";
import { ShopifyHookContext } from "./types/ShopifyHookContext.type";

export default async (context: ShopifyHookContext, event: any) => {
  const log = (str: string) =>
    console.log(`handle-create-subscription-contract(id: ${event.id}): ${str}`);

  log("webhook starting");

  try {
    const shopify_order = await context.app
      .service("shopify-orders")
      .get(event.origin_order_id);

    const {
      billing_address: { phone },
      shipping_address: { id: shopify_address_id, address1, city, zip, address2, province_code },
    } = shopify_order;

    let birthday;
    let user_id_attribute;
    for (const line_item of shopify_order.line_items) {
      if (line_item.properties.length > 0) {
        const birthday_property = line_item.properties.find(
          (p: any) => p.name === "_birthday"
        );
        const user_id_property = line_item.properties.find(
          (p: any) => p.name === "_user_id"
        );
        if (birthday_property) {
          birthday = birthday_property.value;
        }
        if (user_id_property) {
          user_id_attribute = user_id_property.value;
        }
      }
    }
    let customer;
    if (event.customer) {
      customer = event.customer;
    } else {
      customer = (
        await context.app
          .service("shopify-rest-client")
          .get(event.customer_id, { path: "customers" })
      ).customer;
    }

    const subscription_contract_res = await context.app
      .service("shopify-partner-graphql-client")
      .create({
        query: `
      query {
        subscriptionContract(id: "gid://shopify/SubscriptionContract/${event.id}") {
          lines(first: 10) {
              edges {
                node {
                  id
                  sellingPlanId
                  productId
                  variantId
                  quantity
                }
              }
          }
      }
    }
    `,
      });

    let user;
    if (user_id_attribute) {
      user = context.app.service("users").get(parseInt(user_id_attribute));
    } else {
      user = await assignOrCreateUserShopify({
        email: customer.email,
        shopify_customer_id: event.customer
          ? event.customer.id
          : event.customer_id,
        name: `${customer.first_name} ${customer.last_name}`,
        phone,
        address: {
          shopify_address_id,
          street: address1 || "",
          street2: address2 || "",
          postcode: zip || "",
          state: province_code || "",
          city: city || "",
        },
        child: {
          birthday: spacetime(birthday).format("yyyy-mm-dd"),
        },
      })(context);
    }

    if (!user) {
      const invalid_user_error = new Unprocessable("Invalid User Error", {
        error: {
          user: "Sorry, invalid user.",
        },
      });
      throw invalid_user_error;
    }

    await query(
      context.app.get("knexClient"),
      `update users set shopify_customer_id = :shopify_customer_id
      where id = :id`,
      {
        shopify_customer_id: event.customer
          ? event.customer.id
          : event.customer_id,
        id: user.id,
      }
    );

    const subscription_lines =
      subscription_contract_res.body.data.subscriptionContract.lines.edges.map(
        (l: any) => l.node
      );

    let { sellingPlanId } = subscription_lines[0];
    sellingPlanId = sellingPlanId.replace(/\D/g, "");

    // set next billing date
    const billing_date_change_res = await context.app
      .service("shopify-partner-graphql-client")
      .create({
        query: `mutation {
        subscriptionContractSetNextBillingDate(contractId: "gid://shopify/SubscriptionContract/${event.id
          }", date: "${new Date(
            await getNextBillingDate(context.app as any, event.billing_policy)
          ).toISOString()}") {
          contract {
            nextBillingDate
          }
          userErrors {
            field
            message
          }
        }
      }
      `,
      });

    const { nextBillingDate: next_billing_date } =
      billing_date_change_res.body.data.subscriptionContractSetNextBillingDate
        .contract;

    const usp = await context.app.service("user-subscription-plans").create({
      user_id: user.id,
      starts_at: new Date(),
      shopify_next_billing_date: new Date(next_billing_date),
      shopify_subscription_contract_id: event.id,
    });

    let [child] = await context.app.service("children").find({
      query: {
        parent_id: user.id,
      },
    });

    if (!child || !child?.id) {
      const formatted_birthday = spacetime(birthday).format("yyyy-mm-dd");
      child = await context.app.service("/children").create({
        birthday: formatted_birthday || null,
        name: "Baby",
        parent_id: user.id,
      });
    }

    const { billing_recurring_interval_count } = await context.app
      .service("selling-plans")
      .get(sellingPlanId);

    for (const subscription_line of subscription_lines) {
      let {
        id: subscription_line_id,
        variantId,
        sellingPlanId,
        quantity,
        productId,
      } = subscription_line;

      variantId = variantId.replace(/\D/g, "");
      productId = productId.replace(/\D/g, "");
      sellingPlanId = sellingPlanId.replace(/\D/g, "");

      const products = (await context.app.service("products").find({
        query: {
          shopify_variant_id: parseInt(variantId),
          selling_plan_id: parseInt(sellingPlanId),
        },
        paginate: false,
      })) as any[];

      const product_id = products.length > 0 ? products[0].id : null;

      const uspi = await context.app
        .service("user-subscription-plan-items")
        .create({
          user_subscription_plan_id: usp.id,
          shopify_subscription_line_id: subscription_line_id.replace(
            "gid://shopify/SubscriptionLine/",
            ""
          ),
          product_id,
          starts_at: new Date(),
          child_id: child.id,
        });

      const { product_type, handle: product_handle } = await context.app
        .service("shopify-products")
        .get(productId);

      let special_menu_id;

      if (product_type === "jar-subscriptions") {
        const [jar_count] = product_handle.split("-");
        const jar_count_to_meal_plan_id: any = {
          8: 121,
          16: 141,
          24: 161,
        };

        const special_menu_res = await context.app
          .service("special-menus-meta")
          .find({
            query: {
              date: getNextDeliveryDate().format("yyyy-mm-dd"),
              baby_birthday:
                birthday ||
                spacetime.now().add(-6, "month").format("yyyy-mm-dd"),
              meal_plan_id: jar_count_to_meal_plan_id[jar_count],
              new_order: 0,
            },
          });

        let special_menu = special_menu_res.find(
          (sm: any) => sm.type === "age"
        );
        if (!special_menu) {
          special_menu = special_menu_res[0];
        }
        special_menu_id = special_menu.id;
      }

      await context.app.service("shopify-generate-sales-orders").create({
        user_id: user.id,
        week_count: 7,
        replace_preferences: true,
        allow_ends_at_not_null: true,
        shopify_subscription_contract: {
          user_subscription_plan_item_id: uspi.id,
          id: event.id,
          product_id,
          special_menu_id: special_menu_id ? special_menu_id : null,
          quantity,
        },
      });

      const paid_for_weeks = (await context.app
        .service("order_weekly_limits")
        .find({
          query: {
            date: {
              $gte: new Date(getNextDeliveryDate().format("yyyy-mm-dd")),
              $lt: new Date(
                getNextDeliveryDate()
                  .add(billing_recurring_interval_count, "week")
                  .format("yyyy-mm-dd")
              ),
            },
          },
          paginate: false,
        })) as any[];

      const paid_for_delivery_dates = paid_for_weeks.map((w) =>
        spacetime(w.date).goto("UTC").startOf("day").format("yyyy-mm-dd")
      );

      const paid_for_sales_orders = await context.app
        .service("sales-orders")
        .find({
          query: {
            delivery_date: {
              $in: paid_for_delivery_dates,
            },
            deleted_at: null,
            user_id: user.id,
          },
          paginate: false,
        });

      await context.app.service("sales-order-attributes").patch(
        null,
        {
          shopify_order_id: shopify_order.id,
        },
        {
          query: {
            user_subscription_plan_item_id: uspi.id,
            sales_order_id: {
              $in: paid_for_sales_orders.map((so: any) => so.id),
            },
            deleted_at: null,
          },
        }
      );
    }

    const fulfillmentOrdersRes = await context.app
      .service("shopify-partner-graphql-client")
      .create({
        query: `
        {
          order(id:"${event.admin_graphql_api_origin_order_id}") {
              id
              fulfillmentOrders(first: 100) {
                edges {
                    node {
                        id
                        fulfillAt
                        fulfillBy
                        status
                    }
                }
              }
          }
        }
      `,
      });

    const fulfillmentOrders =
      fulfillmentOrdersRes.body.data.order.fulfillmentOrders.edges;

    let weeks = await context.app.service("order_weekly_limits").find({
      query: {
        date: {
          $gte: getNextDeliveryDate().format("yyyy-mm-dd"),
        },
        $sort: {
          date: 1,
        },
      },
      paginate: false,
    });

    weeks = weeks.slice(0, fulfillmentOrders.length);

    for (let i = 0; i < fulfillmentOrders.length; i++) {
      if (fulfillmentOrders[i].node.status === "SCHEDULED") {
        const res = await context.app
          .service("shopify-partner-graphql-client")
          .create({
            query: `
              mutation {
                  fulfillmentOrderReschedule(fulfillAt:"${spacetime(
              new Date(weeks[i].date)
            )
                .add(8, "hour")
                .goto("UTC")
                .toNativeDate()
                .toISOString()}", id: "${fulfillmentOrders[i].node.id}") {
                    fulfillmentOrder {
                      id
                    }
                    userErrors {
                      field
                      message
                    }
                  }
                }
              `,
          });
      }
    }

    return { success: true };
  } catch (error: any) {
    console.log(error);
    log(JSON.stringify(error));
    log("There was an issue handling create subscription contract.");
    return { success: false, error: JSON.stringify(error) };
  }
};

export const getNextBillingDate = async (
  app: Application,
  billing_policy: {
    interval_count: number;
  }
): Promise<string> => {
  const db = app.get("knexClient");
  const query = `
    SELECT * FROM order_weekly_limits
    WHERE date > DATE_ADD(CONVERT_TZ(NOW(), "UTC", "America/Los_Angeles"), INTERVAL 6 DAY)
    LIMIT 1;
  `;

  const [owl] = JSON.parse(JSON.stringify(await db.raw(query)));

  const parsedNextDelivery = new Date(
    new Date(owl[0].date).setUTCHours(0, 0, 0, 0)
  );

  const nextDelivery = parsedNextDelivery.toISOString();

  return spacetime(nextDelivery)
    .goto("UTC")
    .day("tuesday")
    .add(3, "day")
    .startOf("day")
    .add(billing_policy.interval_count - 1, "week")
    .format("yyyy-mm-dd");
};
