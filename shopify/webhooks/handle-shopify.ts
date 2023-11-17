import { ShopifyHookContext } from "./types/ShopifyHookContext.type";

import handleCreateOrder from "./handle-create-order";
import handleUpdateOrder from "./handle-update-order";
import handleCreateSubscriptionContract from "./handle-create-subscription-contract";
import handleUpdateSubscriptionContract from "./handle-update-subscription-contract";
import handleSubscriptionBillingAttemptsSuccess from "./handle-subscription-billing-attempts-success";
import handleSubscriptionBillingAttemptsFailure from "./handle-subscription-billing-attempts-failure";
import handleCreateCustomer from "./handle-create-customer";
import handleUpdateCustomer from "./handle-update-customer";
import handleOrderTransactionsCreate from "./handle-order-transactions-create";
import handleUpdateProduct from "./handle-update-product";


export default async (context: ShopifyHookContext, type: string) => {
  const event = context.data;

  if (context.params.provider === "rest") {
    const TWENTY_FOUR_HOURS_SECONDS = 86400;
    const webhook_request_id =
      context.params.headers["X-Shopify-Webhook-Id"] ||
      context.params.headers["x-shopify-webhook-id"];

    const existing_webhook_request_id =
      webhook_request_id &&
      (await context.app.service("redis").get(webhook_request_id));

    if (existing_webhook_request_id) {
      return { dropped: true };
    } else if (webhook_request_id) {
      try {
        await context.app.service("redis").create({
          key: webhook_request_id,
          value: true,
          expires: TWENTY_FOUR_HOURS_SECONDS,
        });
      } catch (e) {
      }

    }
  }

  switch (type) {
    case "order-create":
      return handleCreateOrder(context, event);
    case "order-update":
      return handleUpdateOrder(context, event);
    case "subscription-contract-create":
      return handleCreateSubscriptionContract(context, event);
    case "subscription-contract-update":
      return handleUpdateSubscriptionContract(context, event);
    case "subscription-billing-attempts-success":
      return handleSubscriptionBillingAttemptsSuccess(context, event);
    case "subscription-billing-attempts-failure":
      return handleSubscriptionBillingAttemptsFailure(context, event);
    case "customer-create":
      return handleCreateCustomer(context, event);
    case "customer-update":
      return handleUpdateCustomer(context, event);
    case "order-transactions-create":
      return handleOrderTransactionsCreate(context, event);
    case "product-update":
      return handleUpdateProduct(context, event);
    default:
      return [];
  }
};
