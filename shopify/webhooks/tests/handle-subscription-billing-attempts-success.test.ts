import axios from "axios";
import app from "../../src/app";
import assert from "assert";

import { pointToNewUser } from "./utils";
import { Console } from "winston/lib/winston/transports";
import faker from "faker";
import { create } from "lodash";

const create_subscription_event = { "admin_graphql_api_id": "gid://shopify/SubscriptionContract/10746691881", "id": 10746691881, "billing_policy": { "interval": "week", "interval_count": 1, "min_cycles": null, "max_cycles": null }, "currency_code": "USD", "customer_id": 6735677391145, "admin_graphql_api_customer_id": "gid://shopify/Customer/6735677391145", "delivery_policy": { "interval": "week", "interval_count": 1 }, "status": "active", "admin_graphql_api_origin_order_id": "gid://shopify/Order/5237087142185", "origin_order_id": 5237087142185, "revision_id": "376707318057", "created_at": "2023-01-03T21:33:28.401Z", "updated_at": "2023-01-03T21:33:28.401Z" };

const billing_attempt_success_event = {
  id: 2493645005,
  admin_graphql_api_id: "gid://shopify/SubscriptionBillingAttempt/2493645005",
  idempotency_key: "1897300173::2022-10-06 13:46:13::1",
  order_id: 5237112733993,
  admin_graphql_api_order_id: "gid://shopify/Order/5237112733993",
  subscription_contract_id: 10746691881,
  admin_graphql_api_subscription_contract_id:
    "gid://shopify/SubscriptionContract/10746691881",
  ready: true,
  error_message: null,
  error_code: null,
  created_at: "2022-10-06T20:46:24.676Z",
  updated_at: "2022-10-06T20:46:24.676Z",
};

describe("handle-subscription-billing-attempt", () => {
  let user_id: number;

  afterEach(async () => {
    await pointToNewUser(app, user_id);
  });

  it("sets next billing date, assigns shopify_order_id", async () => {
    await axios.post(
      "http://localhost:3031/api/v2/webhooks?source=shopify&type=subscription-contract-create",
      create_subscription_event
    );

    await axios.post(
      "http://localhost:3031/api/v2/webhooks?source=shopify&type=subscription-billing-attempts-success",
      billing_attempt_success_event
    );

    const usps: any = await app.service("user-subscription-plans").find({
      query: {
        shopify_subscription_contract_id:
          billing_attempt_success_event.subscription_contract_id,
      },
      paginate: false,
    });

    user_id = usps[0].user_id;

    const sales_orders: any = await app.service("sales-orders").find({
      query: {
        user_id,
        deleted_at: null,
      },
      paginate: false,
    });
    const fifth_so_soas = (await app.service("sales-order-attributes").find({
      query: {
        sales_order_id: sales_orders[4].id,
      },
    })) as any[];

    assert.notEqual(
      fifth_so_soas.find((soa: any) => soa.shopify_order_id),
      undefined
    );
  });
});
