import { ShopifyHookContext } from "./types/ShopifyHookContext.type";
import handlePausedSubscriptionContract from "../src/jobs/shopify/subscriptionContracts/handlePausedSubscriptionContract";
import { ProductTypeIds } from "../src/services/meta/generate-sales-orders/utils/constants";

const NUM_FAILED_ATTEMPTS_BEFORE_PAUSING = 4;
const NUM_FAILED_WEEKS_BEFORE_CANCELLATION = 3;

export default async (context: ShopifyHookContext, event: any) => {
  const log = (str: string) =>
    console.log(
      `handle-subscription-billing-attempt-failure(id: ${event.id}): ${str}`
    );


  try {
    const {
      subscription_contract_id,
      order_id,
      ready,
      error_message,
      error_code,
      idempotency_key,
    } = context.data;

    const idempotency_array = idempotency_key.split("::");
    const date_string = idempotency_array[1];
    const attempt = parseInt(idempotency_array[2], 10);

    if (!ready) {
      console.log(
        "Not ready or missing error",
        subscription_contract_id,
        order_id
      );
    }

    const [usp] = await context.app.service("user-subscription-plans").find({
      query: {
        shopify_subscription_contract_id: subscription_contract_id,
        $limit: 1
      },
      paginate: false
    })

    const user = await context.app.service("users").get(usp.user_id)

    const num_weeks_failed = (await context.app.service("user-attributes").find({
      query: {
        user_id: usp.user_id,
        attribute: "failed-subscription-billing-attempt",
        value: subscription_contract_id
      },
      paginate: false
    })).length + 1;


    log(`attempt ${attempt}/${NUM_FAILED_ATTEMPTS_BEFORE_PAUSING}`)

    if (attempt > NUM_FAILED_ATTEMPTS_BEFORE_PAUSING) {
      log("already sent maximum number of weekly billing attempts")
      return { dropped: true, }
    }


    if (attempt === NUM_FAILED_ATTEMPTS_BEFORE_PAUSING) {
      log("reached maximum number of weekly billing attempts")
      log(`failed weeks ${num_weeks_failed}/${NUM_FAILED_WEEKS_BEFORE_CANCELLATION}`)
      if (num_weeks_failed === NUM_FAILED_WEEKS_BEFORE_CANCELLATION) {
        log("reached maximum number of failed weeks")

        await context.app.service("user-attributes").remove(null, {
          query: {
            user_id: usp.user_id,
            attribute: "failed-subscription-billing-attempt",
            value: subscription_contract_id
          }
        });
        log("cancelling sub")
        await context.app.service("shopify-subscription-contracts").remove(subscription_contract_id);
      } else {
        log("pausing next week's delivery")

        await context.app.service("user-attributes").create({
          user_id: usp.user_id,
          attribute: "failed-subscription-billing-attempt",
          value: subscription_contract_id
        })
        const [next_sales_order] = await context.app.service("sales-orders").find({
          query: {
            user_id: usp.user_id,
            delivery_date: {
              $gt: new Date(date_string),
            },
            $limit: 1,
            $sort: {
              delivery_date: 1
            }
          },
          paginate: false
        })

        await context.app.service("sales-orders").patch(next_sales_order.id, {
          paused: 1
        })
        const next_sales_order_attributes = await context.app.service("sales-order-attributes").find({
          query: {
            sales_order_id: next_sales_order.id,
            product_id: {
              $ne: null
            },
            deleted_at: null
          },
          paginate: false
        })
        let soa_sub_placeholder;
        for (let i = 0; i < next_sales_order_attributes.length; i++) {
          const soa = next_sales_order_attributes[i];
          const product = await context.app.service("products").get(soa.product_id);
          if (product.product_type_id === ProductTypeIds.Subscriptions) {
            soa_sub_placeholder = soa;
          }
        }

        await handlePausedSubscriptionContract(context.app, {
          sales_order_attribute_id: soa_sub_placeholder.id
        })
      }

    } else {
      log("doing nothing")
    }


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

    const billing_attempt_res = await context.app
      .service("shopify-partner-graphql-client")
      .create({
        query: `query {
          subscriptionBillingAttempt (id: "gid://shopify/SubscriptionBillingAttempt/${event.id}") {
              subscriptionContract {
                  id
                  lines(first: 10) {
                      edges {
                          node {
                              currentPrice {
                                  amount
                                  currencyCode
                              }
                          }
                      }
                  }
              }
          }
      }`,
      });

    const payment_method_id =
      customer_res.body.data.customer.paymentMethods.edges[0].node.id;
    const billing_attempt_amount_in_cents = billing_attempt_res.body.data.subscriptionBillingAttempt ?
      billing_attempt_res.body.data.subscriptionBillingAttempt.subscriptionContract.lines.edges.reduce((a: number, line: any) => a + line.node.currentPrice.amount * 100, 0) : 0;

    const [first_name, ...rest_of_name] = user.name.split(" ");
    console.log("hi")
    await context.app.service("churnbuster-failed-payments").create({
      payment: {
        source: "shopify_payment_source",
        source_id: payment_method_id,
        amount_in_cents: billing_attempt_amount_in_cents || 0,
        currency: "USD"
      },
      customer: {
        source: "shopify_customer",
        source_id: user.shopify_customer_id,
        email: user.email,
        properties: {
          first_name,
          last_name: rest_of_name.join(" ")
        }
      }
    })

    await context.app.service("/shopify-subscription-billing-attempts").create({
      shopify_subscription_contract_id: subscription_contract_id,
      shopify_order_id: order_id,
      status: "ERROR",
      error: `${error_code} - ${error_message}`,
      idempotency_key,
      billing_date: date_string || null,
      attempt: attempt,
    });

    return { success: true };
  } catch (error: any) {
    const e = JSON.stringify(error) !== "{}" ? JSON.stringify(error) : error;
    log(e);
    return { success: false, error: e };
  }
};
