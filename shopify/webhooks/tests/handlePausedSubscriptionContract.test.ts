import assert from "assert";
import axios from "axios";
import app from "../../src/app";
import handlePausedSubscriptionContract from "../../src/jobs/shopify/subscriptionContracts/handlePausedSubscriptionContract";
import { query } from "../../src/utils/query";
import getNextDeliveryDate from "../../src/utils/getNextDeliveryDate";
import { pointToNewUser } from "./utils";

describe("handlePausedSubscriptionContract", () => {
  let user_id;

  const event_weekly = {
    product_id: 2518,
    admin_graphql_api_id: "gid://shopify/SubscriptionContract/1729331405",
    id: 1729331405,
    billing_policy: {
      interval: "week",
      interval_count: 1,
      min_cycles: null,
      max_cycles: null,
    },
    currency_code: "USD",
    customer_id: 5411003105485,
    admin_graphql_api_customer_id: "gid://shopify/Customer/5411003105485",
    delivery_policy: { interval: "week", interval_count: 1 },
    status: "active",
    admin_graphql_api_origin_order_id: "gid://shopify/Order/3892645101773",
    origin_order_id: 3892645101773,
    created_at: "2022-06-16T17:19:16.889Z",
    updated_at: "2022-06-16T17:19:16.889Z",
  };

  const event_monthly = {
    product_id: 2519,
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
    status: "active",
    admin_graphql_api_origin_order_id: "gid://shopify/Order/3892868776141",
    origin_order_id: 3892868776141,
    created_at: "2022-06-17T00:15:03.679Z",
    updated_at: "2022-06-17T00:15:03.679Z",
  };

  afterEach(async () => {
    await pointToNewUser(app, user_id);
  });

  for (const event of [event_weekly, event_monthly]) {
    it("assigns shopify_order_id to existing subscription sales order attributes", async () => {
      await axios.post(
        "http://localhost:3031/api/v2/webhooks?source=shopify&type=subscription-contract-create",
        event
      );

      [{ id: user_id }] = (await app.service("users").find({
        query: {
          shopify_customer_id: event.customer_id,
        },
        paginate: false,
      })) as any[];

      const sales_orders: any = await app.service("sales-orders").find({
        query: {
          user_id,
        },
        paginate: false,
      });

      const [first_sales_order, second_sales_order] = sales_orders;

      await app
        .service("sales-orders")
        .patch(first_sales_order.id, { paused: 1 });

      const [soa] = (await app.service("sales-order-attributes").find({
        query: {
          sales_order_id: first_sales_order.id,
          product_id: event.product_id,
        },
      })) as any[];

      await handlePausedSubscriptionContract(app, {
        sales_order_attribute_id: soa.id,
      });

      const second_so_soas = (await app.service("sales-order-attributes").find({
        query: {
          sales_order_id: second_sales_order.id,
        },
      })) as any[];

      assert.equal(
        second_so_soas
          .filter((soa) => soa.product_id)
          .every((p) => p.shopify_order_id),
        true
      );

      // todo:
      // assert next billing date correct
    });

    if (event.product_id === 2518) {
      it("has to create new sales order attributes", async () => {
        await axios.post(
          "http://localhost:3031/api/v2/webhooks?source=shopify&type=subscription-contract-create",
          event
        );

        [{ id: user_id }] = (await app.service("users").find({
          query: {
            shopify_customer_id: event.customer_id,
          },
          paginate: false,
        })) as any[];
        console.log(`test user id = ${user_id}`);

        const sales_orders: any = await app.service("sales-orders").find({
          query: {
            user_id,
          },
          paginate: false,
        });

        const [first_sales_order] = sales_orders;

        const sales_orders_to_delete = sales_orders.slice(1).map((so) => so.id);

        await app.service("sales-orders").patch(
          null,
          { deleted_at: new Date() },
          {
            query: {
              id: {
                $in: sales_orders_to_delete,
              },
            },
          }
        );

        await app.service("sales-orders").patch(first_sales_order.id, {
          paused: 1,
        });

        const [soa] = (await app.service("sales-order-attributes").find({
          query: {
            sales_order_id: first_sales_order.id,
            product_id: event.product_id,
          },
        })) as any[];

        await handlePausedSubscriptionContract(app, {
          sales_order_attribute_id: soa.id,
        });

        const sales_orders_after: any = await app.service("sales-orders").find({
          query: {
            user_id,
            deleted_at: null,
          },
          paginate: false,
        });
        assert.equal(sales_orders_after.length, 2);
        // assert paid for products shifts one week
        const second_so_soas = (await app
          .service("sales-order-attributes")
          .find({
            query: {
              sales_order_id: sales_orders_after[1].id,
            },
          })) as any[];
        assert.equal(
          second_so_soas
            .filter((soa) => soa.product_id)
            .every((p) => p.shopify_order_id),
          true
        );

        // todo:
        // assert next billing date correct
      });
    }
  }
});
