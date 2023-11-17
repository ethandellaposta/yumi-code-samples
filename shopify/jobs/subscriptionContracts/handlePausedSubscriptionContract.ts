import { ProductTypeIds } from "../../../feathersjs-backend/src/services/meta/generate-sales-orders/utils/constants";
import { toLower } from "lodash";
import spacetime, { TimeUnit } from "spacetime";
import { Application } from "../../../feathersjs-backend/src/declarations";
import { query } from "../../../feathersjs-backend/src/utils/query";

const handlePausedSubscriptionContract = async (
  app: Application,
  message: {
    sales_order_attribute_id: number;
  }
) => {
  const sales_order_attribute = await app
    .service("sales-order-attributes")
    .get(message.sales_order_attribute_id);

  const user_subscription_plan_item = await app
    .service("user-subscription-plan-items")
    .get(sales_order_attribute.user_subscription_plan_item_id);
  const user_subscription_plan = await app
    .service("user-subscription-plans")
    .get(user_subscription_plan_item.user_subscription_plan_id);

  const log = (str: string) =>
    console.log(
      `handlePausedSubscriptionContract(id: ${user_subscription_plan.shopify_subscription_contract_id}): ${str}`
    );

  try {
    log("starting job");

    const billing_date_res = await app
      .service("shopify-partner-graphql-client")
      .create({
        query: `
      query {
        subscriptionContract(id: "gid://shopify/SubscriptionContract/${user_subscription_plan.shopify_subscription_contract_id}") {
          nextBillingDate
          deliveryPolicy {
            interval
            intervalCount
          }
        }
      }
    `,
      });

    const { nextBillingDate: old_next_billing_date, deliveryPolicy } =
      billing_date_res.body.data.subscriptionContract;

    const new_billing_date = spacetime(old_next_billing_date)
      .add(
        deliveryPolicy.intervalCount,
        toLower(deliveryPolicy.interval) as TimeUnit
      )
      .toNativeDate()
      .toISOString();

    log(`next delivery date: ${new_billing_date}`);

    await app.service("shopify-partner-graphql-client").create({
      query: `
    mutation {
      subscriptionContractSetNextBillingDate(
        contractId: "gid://shopify/SubscriptionContract/${user_subscription_plan.shopify_subscription_contract_id}",
        date: "${new_billing_date}") {
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

    const sales_order = await app
      .service("sales-orders")
      .get(sales_order_attribute.sales_order_id);

    const all_sales_orders_delivery_date = (await app
      .service("sales-orders")
      .find({
        query: {
          user_id: sales_order.user_id,
          delivery_date: sales_order.delivery_date,
          deleted_at: null,
        },
        paginate: false,
      })) as any[];

    await app.service("sales-order-attributes").patch(
      null,
      {
        shopify_order_id: null,
      },
      {
        query: {
          shopify_order_id: sales_order_attribute.shopify_order_id,
          sales_order_id: {
            $in: all_sales_orders_delivery_date.map((so) => so.id),
          },
        },
      }
    );

    const [sales_order_to_update] = (await app.service("sales-orders").find({
      query: {
        user_id: sales_order.user_id,
        delivery_date: {
          $gt: old_next_billing_date,
        },
        deleted_at: null,
        $limit: 1,
        $sort: {
          delivery_date: 1,
        },
      },
      paginate: false,
    })) as any[];

    const all_sales_orders_to_update_delivery_date = sales_order_to_update
      ? ((await app.service("sales-orders").find({
        query: {
          user_id: sales_order_to_update.user_id,
          delivery_date: sales_order_to_update.delivery_date,
          deleted_at: null,
        },
        paginate: false,
      })) as any[])
      : [];

    const matching_subscription_products_other_sales_order: any = await app
      .service("sales-order-attributes")
      .find({
        query: {
          user_subscription_plan_item_id: user_subscription_plan_item.id,
          sales_order_id: {
            $in: all_sales_orders_to_update_delivery_date.map((so) => so.id),
          },
          deleted_at: null,
        },
        paginate: false,
      });

    if (matching_subscription_products_other_sales_order.length > 0) {
      await app.service("sales-order-attributes").patch(
        null,
        {
          shopify_order_id: sales_order_attribute.shopify_order_id,
        },
        {
          query: {
            id: {
              $in: matching_subscription_products_other_sales_order.map(
                (soa: any) => soa.id
              ),
            },
          },
        }
      );
    } else {
      const soas_special_menu_id = (await app
        .service("sales-order-attributes")
        .find({
          query: {
            user_subscription_plan_item_id: user_subscription_plan_item.id,
            special_menu_id: {
              $ne: null,
            },
            sales_order_id: {
              $in: all_sales_orders_delivery_date.map((so) => so.id),
            },
          },
          paginate: false,
        })) as any[];
      const special_menu_id =
        soas_special_menu_id.length > 0
          ? soas_special_menu_id[0].special_menu_id
          : null;

      let [{ id: week_id, date: delivery_date }] = (await app
        .service("order_weekly_limits")
        .find({
          query: {
            date: {
              $gt: old_next_billing_date,
            },
            $limit: 1,
            $sort: {
              date: 1,
            },
          },
          paginate: false,
        })) as any[];

      const { product_id } = user_subscription_plan_item;
      const { name } = await app.service("products").get(product_id);

      let subscription_products: any[] = await query(
        app.get("knexClient"),
        `
        select product_id, quantity, special_menu_id
        from subscription_products
        where subscription_plan_product_id = :product_id
        and special_menu_id = :special_menu_id
        and week_id = :week_id
        and new_order = :new_order;
      `,
        {
          product_id,
          special_menu_id: name.includes("Jar Plan") ? special_menu_id : null,
          week_id,
          new_order: 0,
        }
      );

      subscription_products = await Promise.all(
        subscription_products.map(async (sp) => {
          const product = await app.service("products").get(sp.product_id);
          return {
            product_id: sp.product_id,
            product_type_id: product.product_type_id,
            quantity: sp.quantity * sales_order_attribute.quantity,
            special_menu_id: sp.special_menu_id,
            user_subscription_plan_item_id: user_subscription_plan_item.id,
            shopify_order_id: sales_order_attribute.shopify_order_id,
          };
        })
      );

      await app.service("user-sales-orders-products").create({
        user_id: user_subscription_plan.user_id,
        products_for_dates: {
          [spacetime(delivery_date).format("yyyy-mm-dd")]: [
            ...subscription_products,
            {
              product_id: sales_order_attribute.product_id,
              product_type_id: ProductTypeIds.Subscriptions,
              quantity: sales_order_attribute.quantity,
              user_subscription_plan_item_id: user_subscription_plan_item.id,
              shopify_order_id: sales_order_attribute.shopify_order_id,
            },
          ],
        },
        is_shopify: true,
      });
    }
  } catch (e) {
    log(`${JSON.stringify(e)}`);
  }
};

export default handlePausedSubscriptionContract;
