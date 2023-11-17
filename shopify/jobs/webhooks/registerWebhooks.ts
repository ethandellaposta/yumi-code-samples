import bluebird from "bluebird";
import { sleep } from "../../../utils/sleep";

const base_url =
  "https://helloyumi.com";

const webhooks = [
  {
    type: "order-transactions-create",
    shopify_topic: "ORDER_TRANSACTIONS_CREATE",
  },
  {
    type: "order-create",
    shopify_topic: "ORDERS_CREATE",
  },
  {
    type: "order-update",
    shopify_topic: "ORDERS_UPDATED",
  },
  {
    type: "subscription-contract-create",
    shopify_topic: "SUBSCRIPTION_CONTRACTS_CREATE",
  },
  {
    type: "subscription-contract-update",
    shopify_topic: "SUBSCRIPTION_CONTRACTS_UPDATE",
  },
  {
    type: "subscription-billing-attempts-success",
    shopify_topic: "SUBSCRIPTION_BILLING_ATTEMPTS_SUCCESS",
  },
  {
    type: "subscription-billing-attempts-failure",
    shopify_topic: "SUBSCRIPTION_BILLING_ATTEMPTS_FAILURE",
  },
  {
    type: "customer-create",
    shopify_topic: "CUSTOMERS_CREATE",
  },
  {
    type: "customer-update",
    shopify_topic: "CUSTOMERS_UPDATE",
  },
  {
    type: "product-update",
    shopify_topic: "PRODUCTS_UPDATE"
  }
];

const registerWebhook = async (feathers: any, topic: string, url: string) =>
  feathers.service("shopify-partner-graphql-client").create({
    query: `
        mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
            webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
              userErrors {
                field
                message
              }
              webhookSubscription {
                # WebhookSubscription fields
                id
                callbackUrl
                format
                topic
              }
            }
          }
          `,
    variables: {
      topic,
      webhookSubscription: {
        callbackUrl: url,
        format: "JSON",
        includeFields: null,
        metafieldNamespaces: [""],
        privateMetafieldNamespaces: [""],
      },
    },
  });

const registerWebhooks = async (feathers: any) => {
  await bluebird.mapSeries(webhooks, async (webhook: any) => {
    const url = `${base_url}/api/v2/webhooks?source=shopify&type=${webhook.type}`;
    let registeredWebhook;
    try {
      registeredWebhook = await registerWebhook(
        feathers,
        webhook.shopify_topic,
        url
      );

      if (registeredWebhook?.body?.errors) {
        console.log(
          "ERRORED ON WEBHOOK",
          webhook.shopify_topic || webhook.type,
          registeredWebhook?.body?.errors
        );
      } else {
        console.log("REGISTERED WEBHOOK", registeredWebhook.body);
      }
    } catch (error) {
      console.log("ERROR REGISTERING WEBHOOK", error);
    }
    await sleep(100);
  });

  return true;
};

export default registerWebhooks;
