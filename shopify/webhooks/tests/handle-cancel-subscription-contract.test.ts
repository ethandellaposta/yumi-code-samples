import axios from "axios";
import app from "../../src/app";
import assert from "assert";
import spacetime from "spacetime";
import { pointToNewUser } from "./utils";

const cancel_event =
{
  description: "one jar sub",
  products: [
    {
      type: "jars",
      quantity: 8,
    },
  ],
  admin_graphql_api_id: "gid://shopify/SubscriptionContract/1730379981",
  id: 1730379981,
  billing_policy: {
    interval: "week",
    interval_count: 4,
    min_cycles: null,
    max_cycles: null,
  },
  currency_code: "USD",
  customer_id: 5411133554893,
  admin_graphql_api_customer_id: "gid://shopify/Customer/5411133554893",
  delivery_policy: { interval: "week", interval_count: 1 },
  status: "cancelled",
  admin_graphql_api_origin_order_id: "gid://shopify/Order/3892868776141",
  origin_order_id: 3892868776141,
  created_at: "2022-06-17T00:15:03.679Z",
  updated_at: "2022-06-17T00:15:03.679Z",
}



describe("handle-update-subscription-contract - cancel", () => {
  let user_id: number;
  afterEach(async () => {
    await pointToNewUser(app, user_id);
  });

  it("cancels", async () => {
    await axios.post(
      "http://localhost:3031/api/v2/webhooks?source=shopify&type=subscription-contract-create",
      cancel_event
    );
    await axios.post(
      "http://localhost:3031/api/v2/webhooks?source=shopify&type=subscription-contract-update",
      cancel_event
    );

    [{ id: user_id }] = (await app.service("users").find({
      query: {
        shopify_customer_id: cancel_event,
      },
      paginate: false,
    })) as any[];
    console.log(`test user id = ${user_id}`);

    const [user_subscription_plan] = (await app
      .service("user-subscription-plans")
      .find({
        query: {
          user_id,
        },
        paginate: false,
      })) as any[];

    assert.equal(
      spacetime(user_subscription_plan.ends_at).format("yyyy-mm-dd"),
      spacetime(new Date()).format("yyyy-mm-dd")
    );

    const sales_orders: any = await app.service("sales-orders").find({
      query: {
        user_id,
      },
      paginate: false,
    });

    const num_deleted_sales_orders =
      7 - cancel_event.billing_policy.interval_count;

    const not_deleted_sales_orders = sales_orders.filter(
      (so) => !so.deleted_at
    );
    const correct_not_deleted_sales_orders = (
      (await app.service("sales-orders").find({
        query: {
          user_id,
        },
        paginate: false,
      })) as any[]
    )
      .reverse()
      .slice(
        num_deleted_sales_orders,
        num_deleted_sales_orders +
        cancel_event.billing_policy.interval_count
      )
      .reverse();

    assert.equal(
      not_deleted_sales_orders.map((so) => so.id).join(","),
      correct_not_deleted_sales_orders.map((so) => so.id).join(",")
    );

    const not_deleted_soa_ids = (
      (await app.service("sales-order-attributes").find({
        query: {
          sales_order_id: {
            $in: not_deleted_sales_orders.map((so) => so.id),
          },
          deleted_at: null,
        },
        paginate: false,
      })) as any[]
    ).map((so) => so.id);
    const correct_not_deleted_soa_ids = (
      (await app.service("sales-order-attributes").find({
        query: {
          sales_order_id: {
            $in: correct_not_deleted_sales_orders.map((so) => so.id),
          },
        },
        paginate: false,
      })) as any[]
    ).map((so) => so.id);

    assert.equal(
      not_deleted_soa_ids.join(","),
      correct_not_deleted_soa_ids.join(",")
    );
  });

});
