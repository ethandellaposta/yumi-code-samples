import axios from "axios";
import app from "../../src/app";
import assert from "assert";
import spacetime from "spacetime";
import { getNextBillingDate } from "../../src/services/webhooks/shopify/handle-create-subscription-contract";
import { pointToNewUser } from "./utils";

const update_product_events = [
  (from_product_id?: number) => ({
    description: "jar sub - monthly -> monthly w/ plan size change",
    update: {
      from: {
        product_id: from_product_id,
        quantity: 1,
      },
      to: {
        product_id: from_product_id === 2519 ? 2521 : 2519,
        quantity: 1,
      },
    },
    admin_graphql_api_id: "gid://shopify/SubscriptionContract/1727529165",
    id: 1727529165,
    billing_policy: {
      interval: "week",
      interval_count: 4,
      min_cycles: null,
      max_cycles: null,
    },
    currency_code: "USD",
    customer_id: 5410686107853,
    admin_graphql_api_customer_id: "gid://shopify/Customer/5410686107853",
    delivery_policy: { interval: "week", interval_count: 1 },
    status: "active",
    admin_graphql_api_origin_order_id: "gid://shopify/Order/3892330823885",
    origin_order_id: 3892330823885,
    created_at: "2022-06-15T22:44:45.684Z",
    updated_at: "2022-06-15T22:44:45.684Z",
  }),
  (from_product_id?: number) => ({
    description: "jar sub - weekly -> monthly",
    update: {
      from: {
        product_id: from_product_id,
        quantity: 1,
      },
      to: {
        product_id: from_product_id === 2518 ? 2519 : 2518,
        quantity: 1,
      },
    },
    admin_graphql_api_id: "gid://shopify/SubscriptionContract/1729364173",
    id: 1729364173,
    billing_policy: {
      interval: "week",
      interval_count: 1,
      min_cycles: null,
      max_cycles: null,
    },
    currency_code: "USD",
    customer_id: 5411006251213,
    admin_graphql_api_customer_id: "gid://shopify/Customer/5411006251213",
    delivery_policy: { interval: "week", interval_count: 1 },
    status: "active",
    admin_graphql_api_origin_order_id: "gid://shopify/Order/3892650934477",
    origin_order_id: 3892650934477,
    created_at: "2022-06-16T17:27:31.732Z",
    updated_at: "2022-06-16T17:27:31.732Z",
  }),
  (from_product_id?: number) => ({
    description: "vitamin sub",
    update: {
      from: {
        product_id: from_product_id,
        quantity: 1,
      },
      to: {
        product_id: from_product_id === 2526 ? 2525 : 2526,
        quantity: 1,
      },
    },
    admin_graphql_api_id: "gid://shopify/SubscriptionContract/1729298637",
    id: 1729298637,
    billing_policy: {
      interval: "week",
      interval_count: 4,
      min_cycles: null,
      max_cycles: null,
    },
    currency_code: "USD",
    customer_id: 5411002515661,
    admin_graphql_api_customer_id: "gid://shopify/Customer/5411002515661",
    delivery_policy: { interval: "week", interval_count: 1 },
    status: "active",
    admin_graphql_api_origin_order_id: "gid://shopify/Order/3892643856589",
    origin_order_id: 3892643856589,
    created_at: "2022-06-16T17:17:27.545Z",
    updated_at: "2022-06-16T17:17:27.545Z",
  }),
];

const double_update_events = [
  (from_product_id?: number) => ({
    description: "jar sub - monthly -> monthly w/ plan size change",
    update: {
      from: {
        product_id: from_product_id,
        quantity: 1,
      },
      to: {
        product_id: from_product_id === 2519 ? 2521 : 2519,
        quantity: 1,
      },
    },
    admin_graphql_api_id: "gid://shopify/SubscriptionContract/1727529165",
    id: 1727529165,
    billing_policy: {
      interval: "week",
      interval_count: 4,
      min_cycles: null,
      max_cycles: null,
    },
    currency_code: "USD",
    customer_id: 5410686107853,
    admin_graphql_api_customer_id: "gid://shopify/Customer/5410686107853",
    delivery_policy: { interval: "week", interval_count: 1 },
    status: "active",
    admin_graphql_api_origin_order_id: "gid://shopify/Order/3892330823885",
    origin_order_id: 3892330823885,
    created_at: "2022-06-15T22:44:45.684Z",
    updated_at: "2022-06-15T22:44:45.684Z",
  }),
  (from_product_id?: number) => ({
    description: "jar sub - weekly <-> monthly",
    update: {
      from: {
        product_id: from_product_id,
        quantity: 1,
      },
      to: {
        product_id: from_product_id === 2520 ? 2521 : 2520,
        quantity: 1,
      },
    },
    admin_graphql_api_id: "gid://shopify/SubscriptionContract/1813971149",
    id: 1813971149,
    billing_policy: {
      interval: "week",
      interval_count: 1,
      min_cycles: null,
      max_cycles: null,
    },
    currency_code: "USD",
    customer_id: 5459044171981,
    admin_graphql_api_customer_id: "gid://shopify/Customer/5459044171981",
    delivery_policy: {
      interval: "week",
      interval_count: 1,
    },
    status: "active",
    admin_graphql_api_origin_order_id: "gid://shopify/Order/3933724541133",
    origin_order_id: 3933724541133,
    revision_id: 11622219981,
  }),
];

describe("handle-update-subscription-contract - update once", () => {
  let user_id: number;
  afterEach(async () => {
    await pointToNewUser(app, user_id);
  });

  for (const event of update_product_events) {
    it(`updates ${event().description}`, async () => {
      await axios.post(
        "http://localhost:3031/api/v2/webhooks?source=shopify&type=subscription-contract-create",
        event()
      );

      const subscription_lines_res = await app
        .service("shopify-partner-graphql-client")
        .create({
          query: `
          query {
              subscriptionContract(id: "gid://shopify/SubscriptionContract/${event().id
            }")  {
                id
                  lines(first: 10) {
                    edges {
                      node {
                        id
                        variantId
                        sellingPlanId
                        quantity
                      }
                    }
                  }
              }
            }
        `,
        });

      const subscription_line_products = await Promise.all(
        subscription_lines_res.body.data.subscriptionContract.lines.edges.map(
          async (l: any) => {
            const [product] = (await app.service("products").find({
              query: {
                selling_plan_id: l.node.sellingPlanId.replace(/\D/g, ""),
                shopify_variant_id: l.node.variantId.replace(/\D/g, ""),
                deleted_at: null,
              },
              paginate: false,
            })) as any[];
            return product;
          }
        )
      );

      [{ id: user_id }] = (await app.service("users").find({
        query: {
          shopify_customer_id: event().customer_id,
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

      const [user_subscription_plan_item] = (await app
        .service("user-subscription-plan-items")
        .find({
          query: {
            user_subscription_plan_id: user_subscription_plan.id,
          },
          paginate: false,
        })) as any[];

      const e = event(subscription_line_products[0].id);

      await app
        .service("shopify-subscription-lines")
        .update(user_subscription_plan_item.shopify_subscription_line_id, {
          product_id: e.update.to.product_id,
          quantity: e.update.from.quantity,
        });

      await axios.post(
        "http://localhost:3031/api/v2/webhooks?source=shopify&type=subscription-contract-update",
        event()
      );

      const new_user_subscription_plan_items = (await app
        .service("user-subscription-plan-items")
        .find({
          query: {
            user_subscription_plan_id: user_subscription_plan.id,
          },
          paginate: false,
        })) as any[];

      const next_billing_date = await getNextBillingDate(
        app,
        event().billing_policy
      );

      assert.equal(new_user_subscription_plan_items.length, 2);
      assert.equal(
        spacetime(new_user_subscription_plan_items[0].ends_at)
          .goto("UTC")
          .format("yyyy-mm-dd"),
        spacetime(next_billing_date).goto("UTC").format("yyyy-mm-dd")
      );
      assert.equal(
        spacetime(new_user_subscription_plan_items[0].ends_at)
          .goto("UTC")
          .format("yyyy-mm-dd"),
        spacetime(new_user_subscription_plan_items[1].starts_at)
          .goto("UTC")
          .format("yyyy-mm-dd")
      );

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
          const date = spacetime(sales_order.delivery_date).format(
            "yyyy-mm-dd"
          );
          if (acc[date]) {
            acc[date].push(soa);
          } else {
            acc[date] = [soa];
          }
          return acc;
        },
        {}
      );

      const product_id_to_plan_size: any = {
        2518: 8,
        2519: 8,
        2520: 16,
        2521: 16,
        2522: 24,
        2523: 24,
        2524: 1,
        2525: 1,
        2526: 1,
      };

      const old_plan_size =
        product_id_to_plan_size[e.update.from.product_id as any];
      const new_plan_size =
        product_id_to_plan_size[e.update.to.product_id as any];

      for (const delivery_date of Object.keys(products_delivery_dates)) {
        const products = products_delivery_dates[delivery_date];

        if (spacetime(delivery_date).isBefore(spacetime(next_billing_date))) {
          const products_sum = products.reduce((a, c) => a + c.quantity, 0);
          assert.equal(products_sum, old_plan_size + 1);
        } else {
          const products_sum = products.reduce((a, c) => a + c.quantity, 0);
          assert.equal(products_sum, new_plan_size + 1);
        }
      }
    });
  }
});

describe("handle-update-subscription-contract - update twice", () => {
  let user_id: number;
  afterEach(async () => {
    await pointToNewUser(app, user_id);
  });

  for (const event of double_update_events) {
    it(`updates ${event().description}`, async () => {
      await axios.post(
        "http://localhost:3031/api/v2/webhooks?source=shopify&type=subscription-contract-create",
        event()
      );

      const subscription_lines_res = await app
        .service("shopify-partner-graphql-client")
        .create({
          query: `
          query {
              subscriptionContract(id: "gid://shopify/SubscriptionContract/${event().id
            }")  {
                id
                  lines(first: 10) {
                    edges {
                      node {
                        id
                        variantId
                        sellingPlanId
                        quantity
                      }
                    }
                  }
              }
            }
        `,
        });

      const subscription_line_products = await Promise.all(
        subscription_lines_res.body.data.subscriptionContract.lines.edges.map(
          async (l: any) => {
            const [product] = (await app.service("products").find({
              query: {
                selling_plan_id: l.node.sellingPlanId.replace(/\D/g, ""),
                shopify_variant_id: l.node.variantId.replace(/\D/g, ""),
                deleted_at: null,
              },
              paginate: false,
            })) as any[];
            return product;
          }
        )
      );

      [{ id: user_id }] = (await app.service("users").find({
        query: {
          shopify_customer_id: event().customer_id,
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

      const [user_subscription_plan_item] = (await app
        .service("user-subscription-plan-items")
        .find({
          query: {
            user_subscription_plan_id: user_subscription_plan.id,
          },
          paginate: false,
        })) as any[];

      const e = event(subscription_line_products[0].id);

      await app
        .service("shopify-subscription-lines")
        .update(user_subscription_plan_item.shopify_subscription_line_id, {
          product_id: e.update.to.product_id,
          quantity: e.update.from.quantity,
        });

      console.log({
        product_id: e.update.to.product_id,
        quantity: e.update.from.quantity,
      });

      await axios.post(
        "http://localhost:3031/api/v2/webhooks?source=shopify&type=subscription-contract-update",
        event()
      );

      await app
        .service("shopify-subscription-lines")
        .update(user_subscription_plan_item.shopify_subscription_line_id, {
          product_id: e.update.from.product_id as number,
          quantity: e.update.to.quantity,
        });

      console.log({
        product_id: e.update.from.product_id as number,
        quantity: e.update.to.quantity,
      });

      await axios.post(
        "http://localhost:3031/api/v2/webhooks?source=shopify&type=subscription-contract-update",
        event()
      );

      const new_user_subscription_plan_items = (await app
        .service("user-subscription-plan-items")
        .find({
          query: {
            user_subscription_plan_id: user_subscription_plan.id,
          },
          paginate: false,
        })) as any[];

      console.log({ new_user_subscription_plan_items });

      const next_billing_date = await getNextBillingDate(
        app,
        event().billing_policy
      );

      assert.equal(new_user_subscription_plan_items.length, 3);
      assert.equal(
        spacetime(new_user_subscription_plan_items[0].ends_at)
          .goto("UTC")
          .format("yyyy-mm-dd"),
        spacetime(next_billing_date).goto("UTC").format("yyyy-mm-dd")
      );
      assert.equal(
        spacetime(new_user_subscription_plan_items[1].ends_at)
          .goto("UTC")
          .format("yyyy-mm-dd"),
        spacetime.now().format("yyyy-mm-dd")
      );
      assert.equal(
        spacetime(new_user_subscription_plan_items[0].ends_at)
          .goto("UTC")
          .format("yyyy-mm-dd"),
        spacetime(new_user_subscription_plan_items[2].starts_at)
          .goto("UTC")
          .format("yyyy-mm-dd")
      );

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
          const date = spacetime(sales_order.delivery_date).format(
            "yyyy-mm-dd"
          );
          if (acc[date]) {
            acc[date].push(soa);
          } else {
            acc[date] = [soa];
          }
          return acc;
        },
        {}
      );

      const product_id_to_plan_size: any = {
        2518: 8,
        2519: 8,
        2520: 16,
        2521: 16,
        2522: 24,
        2523: 24,
        2524: 1,
        2525: 1,
        2526: 1,
      };

      const old_plan_size =
        product_id_to_plan_size[e.update.from.product_id as any];
      const new_plan_size =
        product_id_to_plan_size[e.update.from.product_id as any];

      for (const delivery_date of Object.keys(products_delivery_dates)) {
        const products = products_delivery_dates[delivery_date];

        if (spacetime(delivery_date).isBefore(spacetime(next_billing_date))) {
          const products_sum = products.reduce((a, c) => a + c.quantity, 0);
          assert.equal(products_sum, old_plan_size + 1);
        } else {
          const products_sum = products.reduce((a, c) => a + c.quantity, 0);
          assert.equal(products_sum, new_plan_size + 1);
        }
      }
    });
  }
});
