import axios from "axios";
import app from "../../../feathersjs-backend/src/app";
import assert from "assert";

import { pointToNewUser } from "./utils";
import { Console } from "winston/lib/winston/transports";
import faker from "faker";
import { create } from "lodash";
import spacetime from "spacetime";

const create_subscription_event = { "admin_graphql_api_id": "gid://shopify/SubscriptionContract/10746691881", "id": 10746691881, "billing_policy": { "interval": "week", "interval_count": 1, "min_cycles": null, "max_cycles": null }, "currency_code": "USD", "customer_id": 6735677391145, "admin_graphql_api_customer_id": "gid://shopify/Customer/6735677391145", "delivery_policy": { "interval": "week", "interval_count": 1 }, "status": "active", "admin_graphql_api_origin_order_id": "gid://shopify/Order/5237087142185", "origin_order_id": 5237087142185, "revision_id": "376707318057", "created_at": "2023-01-03T21:33:28.401Z", "updated_at": "2023-01-03T21:33:28.401Z" };


const billing_attempt_failure_event = (billing_date = "2022-10-06") => ({
  id: 2493022413,
  admin_graphql_api_id: "gid://shopify/SubscriptionBillingAttempt/2493022413",
  idempotency_key: `10746691881::${billing_date} 13:46:13::`,
  order_id: null,
  admin_graphql_api_order_id: null,
  subscription_contract_id: 10746691881,
  admin_graphql_api_subscription_contract_id:
    "gid://shopify/SubscriptionContract/10746691881",
  ready: true,
  error_message: "Your card was declined.",
  error_code: "payment_method_declined",
  created_at: "2022-10-06T20:04:22.834Z",
  updated_at: "2022-10-06T20:04:22.834Z",
});

describe("handle-subscription-billing-attempt-failure", () => {
  let user_id: number;

  afterEach(async () => {
    await pointToNewUser(app, user_id);
  });

  it("pauses subscription for a delivery cycle after 3 failures", async () => {
    await axios.post(
      "http://localhost:3031/api/v2/webhooks?source=shopify&type=subscription-contract-create",
      create_subscription_event
    );

    const usps: any = await app.service("user-subscription-plans").find({
      query: {
        shopify_subscription_contract_id:
          create_subscription_event.id,
      },
      paginate: false,
    });

    user_id = usps[0].user_id;

    const pre_sales_orders: any = await app.service("sales-orders").find({
      query: {
        user_id,
        deleted_at: null,
      },
      paginate: false,
    });

    for (let i = 1; i < 4; i++) {
      await axios.post(
        "http://localhost:3031/api/v2/webhooks?source=shopify&type=subscription-billing-attempts-failure",
        {
          ...billing_attempt_failure_event(),
          ready: true,
          idempotency_key: `${billing_attempt_failure_event(spacetime(pre_sales_orders[0].delivery_date).add(3, "day").format("yyyy-mm-dd")).idempotency_key}${i}`
        }
      );
    }

    const sales_orders: any = await app.service("sales-orders").find({
      query: {
        user_id,
        deleted_at: null,
      },
      paginate: false,
    });


    console.log({ sales_orders })
    assert.equal(sales_orders[0].paused, 0);
    assert.equal(sales_orders[1].paused, 1);
    assert.equal(sales_orders[2].paused, 0);

    const num_failed_weeks = (await app.service("user-attributes").find({
      query: {
        user_id: user_id,
        attribute: "failed-subscription-billing-attempt",
        value: create_subscription_event.id
      },
      paginate: false
    }) as any[]).length;

    assert.equal(num_failed_weeks, 1)
  });

  it("pauses after second week of 3 failed billing attempts", async () => {
    await axios.post(
      "http://localhost:3031/api/v2/webhooks?source=shopify&type=subscription-contract-create",
      create_subscription_event
    );

    const usps: any = await app.service("user-subscription-plans").find({
      query: {
        shopify_subscription_contract_id:
          create_subscription_event.id,
      },
      paginate: false,
    });

    user_id = usps[0].user_id;

    const pre_sales_orders: any = await app.service("sales-orders").find({
      query: {
        user_id,
        deleted_at: null,
      },
      paginate: false,
    });

    // first week
    for (let i = 1; i < 4; i++) {
      await axios.post(
        "http://localhost:3031/api/v2/webhooks?source=shopify&type=subscription-billing-attempts-failure",
        {
          ...billing_attempt_failure_event(),
          ready: true,
          idempotency_key: `${billing_attempt_failure_event(spacetime(pre_sales_orders[0].delivery_date).add(3, "day").format("yyyy-mm-dd")).idempotency_key}${i}`,
        }
      );
    }

    // second week
    for (let i = 1; i < 4; i++) {
      await axios.post(
        "http://localhost:3031/api/v2/webhooks?source=shopify&type=subscription-billing-attempts-failure",
        {
          ...billing_attempt_failure_event(),
          ready: true,
          idempotency_key: `${billing_attempt_failure_event(spacetime(pre_sales_orders[0].delivery_date).add(3, "day").add(1, "week").format("yyyy-mm-dd")).idempotency_key}${i}`,
        }
      );
    }

    const sales_orders: any = await app.service("sales-orders").find({
      query: {
        user_id,
        deleted_at: null,
      },
      paginate: false,
    });

    console.log({ sales_orders })


    assert.equal(sales_orders[0].paused, 0);
    assert.equal(sales_orders[1].paused, 1);
    assert.equal(sales_orders[2].paused, 1);
    assert.equal(sales_orders[3].paused, 0);

    const num_failed_weeks = (await app.service("user-attributes").find({
      query: {
        user_id: user_id,
        attribute: "failed-subscription-billing-attempt",
        value: create_subscription_event.id
      },
      paginate: false
    }) as any[]).length;

    assert.equal(num_failed_weeks, 2)
  })

  it("cancels after third week of 3 failed billing attempts", async () => {
    await axios.post(
      "http://localhost:3031/api/v2/webhooks?source=shopify&type=subscription-contract-create",
      create_subscription_event
    );

    const usps: any = await app.service("user-subscription-plans").find({
      query: {
        shopify_subscription_contract_id:
          create_subscription_event.id,
      },
      paginate: false,
    });

    user_id = usps[0].user_id;

    const pre_sales_orders: any = await app.service("sales-orders").find({
      query: {
        user_id,
        deleted_at: null,
      },
      paginate: false,
    });

    // first week
    for (let i = 1; i < 4; i++) {
      await axios.post(
        "http://localhost:3031/api/v2/webhooks?source=shopify&type=subscription-billing-attempts-failure",
        {
          ...billing_attempt_failure_event(),
          ready: true,
          idempotency_key: `${billing_attempt_failure_event(spacetime(pre_sales_orders[0].delivery_date).add(3, "day").format("yyyy-mm-dd")).idempotency_key}${i}`,
        }
      );
    }

    // second week
    for (let i = 1; i < 4; i++) {
      await axios.post(
        "http://localhost:3031/api/v2/webhooks?source=shopify&type=subscription-billing-attempts-failure",
        {
          ...billing_attempt_failure_event(),
          ready: true,
          idempotency_key: `${billing_attempt_failure_event(spacetime(pre_sales_orders[0].delivery_date).add(3, "day").add(1, "week").format("yyyy-mm-dd")).idempotency_key}${i}`,
        }
      );
    }

    // third week
    for (let i = 1; i < 4; i++) {
      await axios.post(
        "http://localhost:3031/api/v2/webhooks?source=shopify&type=subscription-billing-attempts-failure",
        {
          ...billing_attempt_failure_event(),
          ready: true,
          idempotency_key: `${billing_attempt_failure_event(spacetime(pre_sales_orders[0].delivery_date).add(3, "day").add(2, "week").format("yyyy-mm-dd")).idempotency_key}${i}`,
        }
      );
    }

    const sales_orders: any = await app.service("sales-orders").find({
      query: {
        user_id,
        deleted_at: null,
      },
      paginate: false,
    });

    console.log({ sales_orders })


    assert.equal(sales_orders[0].paused, 0);
    assert.equal(sales_orders[1].paused, 1);
    assert.equal(sales_orders[2].paused, 1);

    const num_failed_weeks = (await app.service("user-attributes").find({
      query: {
        user_id: user_id,
        attribute: "failed-subscription-billing-attempt",
        value: create_subscription_event.id
      },
      paginate: false
    }) as any[]).length;

    assert.equal(num_failed_weeks, 0)
  })
});
