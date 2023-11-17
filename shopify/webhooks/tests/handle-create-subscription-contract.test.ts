import spacetime from "spacetime";
import axios from "axios";
import app from "../../src/app";
import assert from "assert";
import getNextDeliveryDate from "../../src/utils/getNextDeliveryDate";
import { pointToNewUser } from "./utils";

export const test_events: any[] = [
  {
    products: [
      {
        type: "jars",
        quantity: 8,
      },
    ],
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
  },
  {
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
    status: "active",
    admin_graphql_api_origin_order_id: "gid://shopify/Order/3892868776141",
    origin_order_id: 3892868776141,
    created_at: "2022-06-17T00:15:03.679Z",
    updated_at: "2022-06-17T00:15:03.679Z",
  },
  {
    products: [
      {
        type: "jars",
        quantity: 16,
      },
    ],
    admin_graphql_api_id: "gid://shopify/SubscriptionContract/1729265869",
    id: 1729265869,
    billing_policy: {
      interval: "week",
      interval_count: 1,
      min_cycles: null,
      max_cycles: null,
    },
    currency_code: "USD",
    customer_id: 5411001729229,
    admin_graphql_api_customer_id: "gid://shopify/Customer/5411001729229",
    delivery_policy: { interval: "week", interval_count: 1 },
    status: "active",
    admin_graphql_api_origin_order_id: "gid://shopify/Order/3892642283725",
    origin_order_id: 3892642283725,
    created_at: "2022-06-16T17:15:30.917Z",
    updated_at: "2022-06-16T17:15:30.917Z",
  },
  {
    products: [
      {
        type: "jars",
        quantity: 16,
      },
    ],
    admin_graphql_api_id: "gid://shopify/SubscriptionContract/1729233101",
    id: 1729233101,
    billing_policy: {
      interval: "week",
      interval_count: 4,
      min_cycles: null,
      max_cycles: null,
    },
    currency_code: "USD",
    customer_id: 5411000484045,
    admin_graphql_api_customer_id: "gid://shopify/Customer/5411000484045",
    delivery_policy: { interval: "week", interval_count: 1 },
    status: "active",
    admin_graphql_api_origin_order_id: "gid://shopify/Order/3892640448717",
    origin_order_id: 3892640448717,
    created_at: "2022-06-16T17:12:56.361Z",
    updated_at: "2022-06-16T17:12:56.361Z",
  },
  {
    products: [
      {
        type: "jars",
        quantity: 24,
      },
    ],
    admin_graphql_api_id: "gid://shopify/SubscriptionContract/1866793165",
    id: 1866793165,
    billing_policy: {
      interval: "week",
      interval_count: 1,
      min_cycles: null,
      max_cycles: null,
    },
    currency_code: "USD",
    customer_id: 5479044088013,
    admin_graphql_api_customer_id: "gid://shopify/Customer/5479044088013",
    delivery_policy: { interval: "week", interval_count: 1 },
    status: "active",
    admin_graphql_api_origin_order_id: "gid://shopify/Order/3954248351949",
    origin_order_id: 3954248351949,
    revision_id: 12307300557,
    created_at: "2022-09-15T01:28:22.984Z",
    updated_at: "2022-09-15T01:28:22.984Z",
  },
  {
    products: [
      {
        type: "jars",
        quantity: 24,
      },
    ],
    admin_graphql_api_id: "gid://shopify/SubscriptionContract/1729134797",
    id: 1729134797,
    billing_policy: {
      interval: "week",
      interval_count: 4,
      min_cycles: null,
      max_cycles: null,
    },
    currency_code: "USD",
    customer_id: 5410993701069,
    admin_graphql_api_customer_id: "gid://shopify/Customer/5410993701069",
    delivery_policy: { interval: "week", interval_count: 1 },
    status: "active",
    admin_graphql_api_origin_order_id: "gid://shopify/Order/3892629340365",
    origin_order_id: 3892629340365,
    created_at: "2022-06-16T16:54:12.078Z",
    updated_at: "2022-06-16T16:54:12.078Z",
  },
  {
    products: [
      {
        type: "vitamins",
        quantity: 1,
      },
    ],
    admin_graphql_api_id: "gid://shopify/SubscriptionContract/1729855693",
    id: 1729855693,
    billing_policy: {
      interval: "week",
      interval_count: 4,
      min_cycles: null,
      max_cycles: null,
    },
    currency_code: "USD",
    customer_id: 5411098427597,
    admin_graphql_api_customer_id: "gid://shopify/Customer/5411098427597",
    delivery_policy: { interval: "week", interval_count: 4 },
    status: "active",
    admin_graphql_api_origin_order_id: "gid://shopify/Order/3892811169997",
    origin_order_id: 3892811169997,
    created_at: "2022-06-16T21:59:23.407Z",
    updated_at: "2022-06-16T21:59:23.407Z",
  },
];

describe("handle-create-subscription-contract", () => {
  let user_id: number;
  afterEach(async () => {
    await pointToNewUser(app, user_id);
  });

  for (const event of test_events) {
    const test_name = `delivers ${event.products.map(
      (p) => `${p.quantity} ${p.type}`
    )} every ${event.delivery_policy.interval_count} ${
      event.delivery_policy.interval
    }(s) - bills every ${event.billing_policy.interval_count} ${
      event.billing_policy.interval
    }(s)`;
    it(test_name, async () => {
      await axios.post(
        "http://localhost:3031/api/v2/webhooks?source=shopify&type=subscription-contract-create",
        event
      );
      const customer = (
        await app
          .service("shopify-rest-client")
          .get(event.customer_id, { path: "customers" })
      ).customer;

      [{ id: user_id }] = (await app.service("users").find({
        query: {
          shopify_customer_id: customer.id,
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

      const sales_order_attribute_products: any = await app
        .service("sales-order-attributes")
        .find({
          query: {
            sales_order_id: {
              $in: sales_orders.map((so) => so.id),
            },
            product_id: {
              $ne: null,
            },
            deleted_at: null,
          },
          paginate: false,
        });

      const products_delivery_dates = sales_order_attribute_products.reduce(
        (acc, soa) => {
          const sales_order = sales_orders.find(
            (so) => so.id === soa.sales_order_id
          );
          const date = new Date(sales_order.delivery_date).toISOString();
          if (acc[date]) {
            acc[date].push(soa);
          } else {
            acc[date] = [soa];
          }
          return acc;
        },
        {}
      );

      const correct_first_delivery_date = getNextDeliveryDate()
        .toNativeDate()
        .toISOString();
      let previous_delivery_date = correct_first_delivery_date;
      const correct_delivery_dates: string[] = [];

      let i = 0;
      while (i <= 6) {
        let delivery_date = spacetime(previous_delivery_date)
          .toNativeDate()
          .toISOString();

        correct_delivery_dates.push(delivery_date);

        delivery_date = spacetime(previous_delivery_date)
          .add(event.delivery_policy.interval_count, "week")
          .toNativeDate()
          .toISOString();

        previous_delivery_date = delivery_date;

        i += event.delivery_policy.interval_count;
      }

      const delivery_dates = Object.keys(products_delivery_dates)
        .map((d) => d.substring(0, 10))
        .join();

      assert.equal(
        delivery_dates,
        correct_delivery_dates.map((d) => d.substring(0, 10)).join()
      );

      const [user_subscription_plan] = (await app
        .service("user-subscription-plans")
        .find({
          query: {
            user_id,
          },
          paginate: false,
        })) as any[];

      const user_subscription_plan_items = (await app
        .service("user-subscription-plan-items")
        .find({
          query: {
            user_subscription_plan_id: user_subscription_plan.id,
          },
          paginate: false,
        })) as any[];

      assert.equal(
        user_subscription_plan.shopify_subscription_contract_id,
        event.id
      );

      const next_billing_date = new Date(
        user_subscription_plan.shopify_next_billing_date
      )
        .toISOString()
        .substring(0, 10);

      const correct_next_billing_date = spacetime(getNextDeliveryDate())
        .add(3, "day")
        .add(event.billing_policy.interval_count - 1, "week")
        .startOf("day")
        .toNativeDate()
        .toISOString()
        .substring(0, 10);

      assert.equal(next_billing_date, correct_next_billing_date);

      const has_correct_products = Object.keys(products_delivery_dates).every(
        (delivery_date, i) => {
          const products = products_delivery_dates[delivery_date];

          const products_total_quantity = products.reduce((a, c) => {
            return a + c.quantity;
          }, 0);

          const products_correct_shopify_data = products
            .filter((p) => p.paused !== 0)
            .every((p) => {
              return (
                (i * event.delivery_policy.interval_count <
                event.billing_policy.interval_count
                  ? p.shopify_order_id === event.origin_order_id
                  : p.shopify_order_id === null) &&
                user_subscription_plan_items.find(
                  (uspi) => uspi.id === p.user_subscription_plan_item_id
                )
              );
            });

          const placeholder_products = products.filter((p) => p.paused === 0);

          const has_correct_placeholder_product =
            placeholder_products &&
            (i * event.delivery_policy.interval_count <
            event.billing_policy.interval_count
              ? placeholder_products.every(
                  (p) => p.shopify_order_id === event.origin_order_id
                )
              : placeholder_products.every(
                  (p) => p.shopify_order_id === null
                )) &&
            placeholder_products.every((p) =>
              user_subscription_plan_items.find(
                (uspi) => uspi.id === p.user_subscription_plan_item_id
              )
            );

          const products_correct_total_quantity =
            event.products.reduce((a, c) => {
              return a + c.quantity;
            }, 0) + event.products.length;

          return (
            products_correct_shopify_data &&
            products_total_quantity === products_correct_total_quantity &&
            has_correct_placeholder_product
          );
        }
      );

      assert.equal(has_correct_products, true);
    });
  }
});
