import axios from "axios";
import app from "../../src/app";
import assert from "assert";
import getNextDeliveryDate from "../../src/utils/getNextDeliveryDate";
import spacetime from "spacetime";
import { pointToNewUser } from "./utils";

export const create_sub_event = {
  admin_graphql_api_id: "gid://shopify/SubscriptionContract/1729724621",
  id: 1729724621,
  billing_policy: {
    interval: "week",
    interval_count: 1,
    min_cycles: null,
    max_cycles: null,
  },
  currency_code: "USD",
  customer_id: 5411054190797,
  admin_graphql_api_customer_id: "gid://shopify/Customer/5411054190797",
  delivery_policy: { interval: "week", interval_count: 1 },
  status: "active",
  admin_graphql_api_origin_order_id: "gid://shopify/Order/3892734165197",
  origin_order_id: 3892734165197,
  created_at: "2022-06-16T19:46:43.338Z",
  updated_at: "2022-06-16T19:46:43.338Z",
};

export const create_order_event = {
  id: 3892769161421,
  admin_graphql_api_id: "gid://shopify/Order/3892769161421",
  app_id: 1354745,
  browser_ip: "71.232.159.143",
  buyer_accepts_marketing: true,
  cancel_reason: null,
  cancelled_at: null,
  cart_token: null,
  checkout_id: 26161624875213,
  checkout_token: "d370a36028b4c7e58f93ddc6b9a91e7a",
  client_details: {
    accept_language: "en-US,en;q=0.9",
    browser_height: null,
    browser_ip: "71.232.159.143",
    browser_width: null,
    session_hash: null,
    user_agent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36",
  },
  closed_at: null,
  confirmed: true,
  contact_email: "ethan34439@gmail.com",
  created_at: "2022-06-16T20:47:20.173Z",
  currency: "USD",
  current_subtotal_price: "8.99",
  current_subtotal_price_set: {
    shop_money: { amount: "8.99", currency_code: "USD" },
    presentment_money: { amount: "8.99", currency_code: "USD" },
  },
  current_total_discounts: "0.00",
  current_total_discounts_set: {
    shop_money: { amount: "0.00", currency_code: "USD" },
    presentment_money: { amount: "0.00", currency_code: "USD" },
  },
  current_total_duties_set: null,
  current_total_price: "8.99",
  current_total_price_set: {
    shop_money: { amount: "8.99", currency_code: "USD" },
    presentment_money: { amount: "8.99", currency_code: "USD" },
  },
  current_total_tax: "0.00",
  current_total_tax_set: {
    shop_money: { amount: "0.00", currency_code: "USD" },
    presentment_money: { amount: "0.00", currency_code: "USD" },
  },
  customer_locale: "en-US",
  device_id: null,
  discount_codes: [],
  email: "ethan34439@gmail.com",
  estimated_taxes: false,
  financial_status: "paid",
  fulfillment_status: null,
  gateway: "shopify_payments",
  landing_site: null,
  landing_site_ref: null,
  location_id: null,
  name: "#1229",
  note: null,
  note_attributes: [],
  number: 229,
  order_number: 1229,
  order_status_url:
    "https://checkout.helloyumi.com/61553213645/orders/9b1d205b77745f12700ca84f61ced654/authenticate?key=b674dd6558189c8b3fa2a817221fbfb5",
  original_total_duties_set: null,
  payment_gateway_names: ["shopify_payments"],
  phone: null,
  presentment_currency: "USD",
  processed_at: "2022-06-16T13:47:13-07:00",
  processing_method: "direct",
  reference: null,
  referring_site: null,
  source_identifier: null,
  source_name: "shopify_draft_order",
  source_url: null,
  subtotal_price: "8.99",
  subtotal_price_set: {
    shop_money: { amount: "8.99", currency_code: "USD" },
    presentment_money: { amount: "8.99", currency_code: "USD" },
  },
  tags: "",
  tax_lines: [],
  taxes_included: false,
  test: true,
  token: "9b1d205b77745f12700ca84f61ced654",
  total_discounts: "0.00",
  total_discounts_set: {
    shop_money: { amount: "0.00", currency_code: "USD" },
    presentment_money: { amount: "0.00", currency_code: "USD" },
  },
  total_line_items_price: "8.99",
  total_line_items_price_set: {
    shop_money: { amount: "8.99", currency_code: "USD" },
    presentment_money: { amount: "8.99", currency_code: "USD" },
  },
  total_outstanding: "0.00",
  total_price: "8.99",
  total_price_set: {
    shop_money: { amount: "8.99", currency_code: "USD" },
    presentment_money: { amount: "8.99", currency_code: "USD" },
  },
  total_price_usd: "8.99",
  total_shipping_price_set: {
    shop_money: { amount: "0.00", currency_code: "USD" },
    presentment_money: { amount: "0.00", currency_code: "USD" },
  },
  total_tax: "0.00",
  total_tax_set: {
    shop_money: { amount: "0.00", currency_code: "USD" },
    presentment_money: { amount: "0.00", currency_code: "USD" },
  },
  total_tip_received: "0.00",
  total_weight: 0,
  updated_at: "2022-06-16T20:47:20.174Z",
  user_id: 79833923789,
  billing_address: {
    first_name: "asdghj",
    address1: "1627 Massachusetts Avenue",
    phone: "1 (727) 838-3838",
    city: "Cambridge",
    zip: "02138",
    province: "Massachusetts",
    country: "United States",
    last_name: "sdaghj",
    address2: "",
    company: null,
    latitude: 42.3806601,
    longitude: -71.1194701,
    name: "asdghj sdaghj",
    country_code: "US",
    province_code: "MA",
  },
  customer: {
    id: 5411054190797,
    email: "ethan34439@gmail.com",
    accepts_marketing: true,
    created_at: "2022-06-16T12:45:33-07:00",
    updated_at: "2022-06-16T13:47:16-07:00",
    first_name: "asdghj",
    last_name: "sdaghj",
    state: "disabled",
    note: null,
    verified_email: true,
    multipass_identifier: null,
    tax_exempt: false,
    phone: null,
    tags: "",
    currency: "USD",
    accepts_marketing_updated_at: "2022-06-16T12:45:33-07:00",
    marketing_opt_in_level: "single_opt_in",
    email_marketing_consent: {
      state: "subscribed",
      opt_in_level: "single_opt_in",
      consent_updated_at: null,
    },
    sms_marketing_consent: null,
    sms_transactional_consent: null,
    admin_graphql_api_id: "gid://shopify/Customer/5411054190797",
    default_address: {
      id: 6572137644237,
      customer_id: 5411054190797,
      first_name: "asdghj",
      last_name: "sdaghj",
      company: null,
      address1: "1627 Massachusetts Avenue",
      address2: "",
      city: "Cambridge",
      province: "Massachusetts",
      country: "United States",
      zip: "02138",
      phone: "1 (727) 838-3838",
      name: "asdghj sdaghj",
      province_code: "MA",
      country_code: "US",
      country_name: "United States",
      default: true,
    },
  },
  discount_applications: [],
  fulfillments: [],
  line_items: [
    {
      id: 10002145607885,
      admin_graphql_api_id: "gid://shopify/LineItem/10002145607885",
      destination_location: {
        id: 2995040321741,
        country_code: "US",
        province_code: "MA",
        name: "asdghj sdaghj",
        address1: "1627 Massachusetts Avenue",
        address2: "",
        city: "Cambridge",
        zip: "02138",
      },
      fulfillable_quantity: 1,
      fulfillment_service: "manual",
      fulfillment_status: null,
      gift_card: false,
      grams: 0,
      name: "Fruit Leather Mango",
      origin_location: {
        id: 2985993208013,
        country_code: "US",
        province_code: "CA",
        name: "Yumi",
        address1: "8070 Melrose Avenue",
        address2: "",
        city: "Los Angeles",
        zip: "90046",
      },
      price: "8.99",
      price_set: {
        shop_money: { amount: "8.99", currency_code: "USD" },
        presentment_money: { amount: "8.99", currency_code: "USD" },
      },
      product_exists: true,
      product_id: 6982417121485,
      properties: [],
      quantity: 1,
      requires_shipping: true,
      sku: "27082",
      taxable: true,
      title: "Fruit Leather Mango",
      total_discount: "0.00",
      total_discount_set: {
        shop_money: { amount: "0.00", currency_code: "USD" },
        presentment_money: { amount: "0.00", currency_code: "USD" },
      },
      variant_id: 40869485707469,
      variant_inventory_management: null,
      variant_title: "",
      vendor: "Yumi",
      tax_lines: [],
      duties: [],
      discount_allocations: [],
    },
  ],
  payment_details: {
    credit_card_bin: "424242",
    avs_result_code: "Y",
    cvv_result_code: "M",
    credit_card_number: "•••• •••• •••• 4242",
    credit_card_company: "Visa",
    credit_card_name: "asdghj",
    credit_card_wallet: null,
    credit_card_expiration_month: 7,
    credit_card_expiration_year: 2025,
  },
  payment_terms: null,
  refunds: [],
  shipping_address: {
    first_name: "asdghj",
    address1: "1627 Massachusetts Avenue",
    phone: "1 (727) 838-3838",
    city: "Cambridge",
    zip: "02138",
    province: "Massachusetts",
    country: "United States",
    last_name: "sdaghj",
    address2: "",
    company: null,
    latitude: 42.3806601,
    longitude: -71.1194701,
    name: "asdghj sdaghj",
    country_code: "US",
    province_code: "MA",
  },
  shipping_lines: [],
};

describe("handle-create-order", () => {
  let user_id: number;
  afterEach(async () => {
    await pointToNewUser(app, user_id);
  });

  it("one off", async () => {
    await axios.post(
      "http://localhost:3031/api/v2/webhooks?source=shopify&type=order-create",
      create_order_event
    );

    [{ id: user_id }] = (await app.service("users").find({
      query: {
        shopify_customer_id: create_order_event.customer.id,
      },
      paginate: false,
    })) as any[];

    const sales_orders: any = await app.service("sales-orders").find({
      query: {
        user_id,
      },
      paginate: false,
    });

    const delivery_date: any = Array.from(
      new Set(sales_orders.map((s) => s.delivery_date))
    )[0];
    const correct_delivery_date = getNextDeliveryDate().format("yyyy-mm-dd");

    assert.equal(
      spacetime(delivery_date).format("yyyy-mm-dd"),
      correct_delivery_date
    );

    const products = (
      (await app.service("sales-order-attributes").find({
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
      })) as any[]
    ).map((p) => ({
      product_id: p.product_id,
      shopify_line_item_id: p.shopify_line_item_id,
      shopify_order_id: p.shopify_order_id,
      quantity: p.quantity,
    }));

    const correct_products = await Promise.all(
      create_order_event.line_items.map(async (li) => {
        const [{ id: product_id }] = (await app.service("products").find({
          query: {
            shopify_product_id: li.product_id,
          },
          paginate: false,
        })) as any[];

        console.log({
          user_id,
          sales_orders,
          delivery_date,
          correct_delivery_date,
          products,
          create_order_event,
        });
        return {
          product_id,
          shopify_line_item_id: li.id,
          shopify_order_id: create_order_event.id,
          quantity: li.quantity,
        };
      })
    );

    assert.equal(JSON.stringify(products), JSON.stringify(correct_products));
  });

  it("addon", async () => {
    await axios.post(
      "http://localhost:3031/api/v2/webhooks?source=shopify&type=subscription-contract-create",
      create_sub_event
    );

    const [user] = (await app.service("users").find({
      query: {
        $sort: {
          id: -1,
        },
        $limit: 1,
      },
      paginate: false,
    })) as any[];

    user_id = user.id;

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

    await axios.post(
      "http://localhost:3031/api/v2/webhooks?source=shopify&type=order-create",
      create_order_event
    );

    const sales_orders_after: any = await app.service("sales-orders").find({
      query: {
        user_id,
      },
      paginate: false,
    });

    console.log({ sales_orders_after });

    const first_order_products_after = (
      (await app.service("sales-order-attributes").find({
        query: {
          sales_order_id: sales_orders_after[0].id,
          product_id: {
            $ne: null,
          },
          deleted_at: null,
        },
        paginate: false,
      })) as any[]
    ).map((p) => ({
      sales_order_id: p.sales_order_id,
      user_subscription_plan_item_id: p.user_subscription_plan_item_id,
      product_id: p.product_id,
      shopify_line_item_id: p.shopify_line_item_id,
      shopify_order_id: p.shopify_order_id,
      quantity: p.quantity,
    }));

    const subscription_products = first_order_products_after.filter(
      (p) => p.user_subscription_plan_item_id
    );

    console.log({ first_order_products_after, subscription_products });

    assert.equal(
      subscription_products.every(
        (p) =>
          p.user_subscription_plan_item_id === user_subscription_plan_item.id
      ),
      true
    );
    assert.equal(
      subscription_products.reduce((a, c) => a + c.quantity, 0),
      9
    );

    const non_subscription_products = first_order_products_after.filter(
      (p) => !p.user_subscription_plan_item_id
    );

    assert.equal(
      create_order_event.id,
      non_subscription_products[0].shopify_order_id
    );
    assert.equal(
      create_order_event.line_items[0].id,
      non_subscription_products[0].shopify_line_item_id
    );
    assert.equal(non_subscription_products.length, 1);
    assert.equal(non_subscription_products[0].quantity, 1);
    assert.equal(non_subscription_products[0].product_id, 2147);
  });
});
