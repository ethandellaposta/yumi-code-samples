import bluebird from "bluebird";
import _ from "lodash";
import spacetime, { TimeUnit } from "spacetime";
import { toLower } from "lodash";
import sqlDate from "../src/utils/sqlDate";
import { ShopifyHookContext } from "./types/ShopifyHookContext.type";

export default async (context: ShopifyHookContext, event: any) => {
  const log = (str: string) =>
    console.log(
      `handle-subscription-billing-attempt-success(id: ${event.id}): ${str}`
    );

  try {
    const {
      subscription_contract_id,
      order_id,
      error,
      error_code,
      idempotency_key,
      admin_graphql_api_order_id,
    } = context.data;

    if (error && error_code) {
      console.log("Failed billing attempt", subscription_contract_id, order_id);
    }

    const idempotency_array = idempotency_key.split("::");
    const date_string = idempotency_array[1];

    const { order } = await context.app
      .service("/shopify-rest-client")
      .get(order_id, { path: "orders" });

    let [user] = await context.app.service("users").find({
      query: {
        email: order.customer.email.toLowerCase(),
        $limit: 1,
      },
      paginate: false,
    });

    const customer_res = await context.app
      .service("shopify-partner-graphql-client")
      .create({
        query: `query {
        customer (id: "gid://shopify/Customer/${user.shopify_customer_id}") {
            paymentMethods(first: 10) {
                edges {
                    node {
                        id

                    }
                }
            }
        }
    }`,
      });


    const payment_method_id =
      customer_res.body.data.customer.paymentMethods.edges[0].node.id;



    await context.app.service("churnbuster-successful-payments").create({
      payment: {
        source: "shopify_payment_source",
        source_id: payment_method_id,
        amount_in_cents: Math.round(parseFloat(order.total_price) * 100),
        currency: "USD"
      },
      customer: {
        source: "shopify_customer",
        source_id: order.customer.id,
        email: order.customer.email,
        properties: {
          first_name: order.customer.first_name,
          last_name: order.customer.last_name
        }
      }
    })

    if (order.source_name !== "subscription_contract") {
      return context;
    }

    await context.app.service("user-attributes").remove(null, {
      query: {
        user_id: user.id,
        attribute: "failed-subscription-billing-attempt",
        value: subscription_contract_id
      }
    })

    await context.app.service("/shopify-subscription-billing-attempts").create({
      shopify_subscription_contract_id: subscription_contract_id,
      shopify_order_id: order_id,
      status: "SUCCESS",
      billing_date: date_string || null,
      idempotency_key,
    });


    // Get fulfillment orders
    const fulfillmentOrdersRes = await context.app
      .service("shopify-partner-graphql-client")
      .create({
        query: `
        {
          order(id:"${admin_graphql_api_order_id}") {
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

    const usps: any = await context.app
      .service("user-subscription-plans")
      .find({
        query: {
          user_id: user.id,
        },
        paginate: false,
      });
    const [usp] = usps;

    const uspis: any = await context.app
      .service("user-subscription-plan-items")
      .find({
        query: {
          user_subscription_plan_id: usp.id,
        },
        paginate: false,
      });

    const [uspi] = uspis;

    let weeks = await context.app.service("order_weekly_limits").find({
      query: {
        date: {
          $gt: new Date(usp.shopify_next_billing_date),
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
        await context.app.service("shopify-partner-graphql-client").create({
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

    const sales_orders: any[] = await context.app.service("sales-orders").find({
      query: {
        user_id: user.id,
        deleted_at: null,
        delivery_date: {
          $in: weeks.map((w: any) => new Date(w.date)),
        },
      },
      paginate: false,
    });

    await context.app.service("sales-order-attributes").patch(
      null,
      {
        shopify_order_id: order_id,
      },
      {
        query: {
          sales_order_id: {
            $in: sales_orders.map((so) => so.id),
          },
          deleted_at: null,
          user_subscription_plan_item_id: uspi.id,
        },
      }
    );

    const billing_date_res = await context.app
      .service("shopify-partner-graphql-client")
      .create({
        query: `
      query {
        subscriptionContract(id: "gid://shopify/SubscriptionContract/${subscription_contract_id}") {
          nextBillingDate
          billingPolicy {
            interval
            intervalCount
          }
        }
      }
    `,
      });

    const { nextBillingDate: old_next_billing_date, billingPolicy } =
      billing_date_res.body.data.subscriptionContract;

    const new_billing_date = spacetime(old_next_billing_date)
      .add(
        billingPolicy.intervalCount,
        toLower(billingPolicy.interval) as TimeUnit
      )
      .toNativeDate()
      .toISOString();

    await context.app.service("shopify-partner-graphql-client").create({
      query: `
      mutation {
        subscriptionContractSetNextBillingDate(
          contractId: "gid://shopify/SubscriptionContract/${subscription_contract_id}",
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

    return { success: true };
  } catch (error) {
    log(JSON.stringify(error));
    return { success: false, error: JSON.stringify(error) };
  }
};
