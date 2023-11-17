import axios from "axios";
import app from "../../src/app";
import assert from "assert";
import { pointToNewUser } from "./utils";

const event = (cancelled_at, refunds) => ({
  id: 3890447614157,
  admin_graphql_api_id: "gid://shopify/Order/3890447614157",
  app_id: 6966601,
  browser_ip: "71.232.159.143",
  buyer_accepts_marketing: true,
  cancel_reason: null,
  cancelled_at,
  cart_token: "2b2746185702ffd4b904f8b0a7200a90",
  checkout_id: 26103234953421,
  checkout_token: "d9a89c9301f8e3bc6f4413395b3843ed",
  client_details: {
    accept_language: "en-US,en;q=0.9",
    browser_height: 966,
    browser_ip: "71.232.159.143",
    browser_width: 1728,
    session_hash: null,
    user_agent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.61 Safari/537.36",
  },
  closed_at: null,
  confirmed: true,
  contact_email: "asdasd123@gmail.com",
  created_at: "2022-06-13T03:07:01.758Z",
  currency: "USD",
  current_subtotal_price: "179.98",
  current_subtotal_price_set: {
    shop_money: { amount: "179.98", currency_code: "USD" },
    presentment_money: { amount: "179.98", currency_code: "USD" },
  },
  current_total_discounts: "0.00",
  current_total_discounts_set: {
    shop_money: { amount: "0.00", currency_code: "USD" },
    presentment_money: { amount: "0.00", currency_code: "USD" },
  },
  current_total_duties_set: null,
  current_total_price: "179.98",
  current_total_price_set: {
    shop_money: { amount: "179.98", currency_code: "USD" },
    presentment_money: { amount: "179.98", currency_code: "USD" },
  },
  current_total_tax: "0.00",
  current_total_tax_set: {
    shop_money: { amount: "0.00", currency_code: "USD" },
    presentment_money: { amount: "0.00", currency_code: "USD" },
  },
  customer_locale: "en-US",
  device_id: null,
  discount_codes: [],
  email: "asdasd123@gmail.com",
  estimated_taxes: false,
  financial_status: "paid",
  fulfillment_status: null,
  gateway: "shopify_payments",
  landing_site: null,
  landing_site_ref: null,
  location_id: null,
  name: "#1197",
  note: "",
  note_attributes: [],
  number: 197,
  order_number: 1197,
  order_status_url:
    "https://checkout.helloyumi.com/61553213645/orders/053a59ce08583c888102dd64e503cfdd/authenticate?key=ac6251c1c197ba9c3e71512b669c2ed6",
  original_total_duties_set: null,
  payment_gateway_names: ["shopify_payments"],
  phone: null,
  presentment_currency: "USD",
  processed_at: "2022-06-12T20:06:55-07:00",
  processing_method: "direct",
  reference: null,
  referring_site: null,
  source_identifier: null,
  source_name: "web",
  source_url: null,
  subtotal_price: "179.98",
  subtotal_price_set: {
    shop_money: { amount: "179.98", currency_code: "USD" },
    presentment_money: { amount: "179.98", currency_code: "USD" },
  },
  tags: "",
  tax_lines: [],
  taxes_included: false,
  test: true,
  token: "053a59ce08583c888102dd64e503cfdd",
  total_discounts: "0.00",
  total_discounts_set: {
    shop_money: { amount: "0.00", currency_code: "USD" },
    presentment_money: { amount: "0.00", currency_code: "USD" },
  },
  total_line_items_price: "179.98",
  total_line_items_price_set: {
    shop_money: { amount: "179.98", currency_code: "USD" },
    presentment_money: { amount: "179.98", currency_code: "USD" },
  },
  total_outstanding: "0.00",
  total_price: "179.98",
  total_price_set: {
    shop_money: { amount: "179.98", currency_code: "USD" },
    presentment_money: { amount: "179.98", currency_code: "USD" },
  },
  total_price_usd: "179.98",
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
  updated_at: "2022-06-13T03:07:01.758Z",
  user_id: null,
  billing_address: {
    first_name: "Tom",
    address1: "1237 Walnut Street",
    phone: "1 (929) 837-4474",
    city: "Newton",
    zip: "02461",
    province: "Massachusetts",
    country: "United States",
    last_name: "Test",
    address2: "",
    company: null,
    latitude: 42.3196161,
    longitude: -71.20470279999999,
    name: "Tom Test",
    country_code: "US",
    province_code: "MA",
  },
  customer: {
    id: 5409295990989,
    email: "asdasd123@gmail.com",
    accepts_marketing: true,
    created_at: "2022-06-12T20:06:31-07:00",
    updated_at: "2022-06-12T20:06:56-07:00",
    first_name: "Tom",
    last_name: "Test",
    state: "disabled",
    note: null,
    verified_email: true,
    multipass_identifier: null,
    tax_exempt: false,
    phone: null,
    tags: "",
    currency: "USD",
    accepts_marketing_updated_at: "2022-06-12T20:06:32-07:00",
    marketing_opt_in_level: "single_opt_in",
    email_marketing_consent: {
      state: "subscribed",
      opt_in_level: "single_opt_in",
      consent_updated_at: null,
    },
    sms_marketing_consent: null,
    sms_transactional_consent: null,
    admin_graphql_api_id: "gid://shopify/Customer/5409295990989",
    default_address: {
      id: 6569802072269,
      customer_id: 5409295990989,
      first_name: "Tom",
      last_name: "Test",
      company: null,
      address1: "1237 Walnut Street",
      address2: "",
      city: "Newton",
      province: "Massachusetts",
      country: "United States",
      zip: "02461",
      phone: "1 (929) 837-4474",
      name: "Tom Test",
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
      id: 9998557315277,
      admin_graphql_api_id: "gid://shopify/LineItem/9998557315277",
      fulfillable_quantity: 1,
      fulfillment_service: "manual",
      fulfillment_status: null,
      gift_card: false,
      grams: 0,
      name: "Adult Vitamins 6 Months",
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
      price: "149.98",
      price_set: {
        shop_money: { amount: "149.98", currency_code: "USD" },
        presentment_money: { amount: "149.98", currency_code: "USD" },
      },
      product_exists: true,
      product_id: 6982420889805,
      properties: [
        { name: "cart_attribute", value: "This is a cart attribute" },
      ],
      quantity: 1,
      requires_shipping: true,
      sku: "27127",
      taxable: true,
      title: "Adult Vitamins 6 Months",
      total_discount: "0.00",
      total_discount_set: {
        shop_money: { amount: "0.00", currency_code: "USD" },
        presentment_money: { amount: "0.00", currency_code: "USD" },
      },
      variant_id: 40869490622669,
      variant_inventory_management: null,
      variant_title: "",
      vendor: "Yumi",
      tax_lines: [],
      duties: [],
      discount_allocations: [],
    },
    {
      id: 9998557348045,
      admin_graphql_api_id: "gid://shopify/LineItem/9998557348045",
      fulfillable_quantity: 1,
      fulfillment_service: "manual",
      fulfillment_status: null,
      gift_card: false,
      grams: 0,
      name: "Purple Insulated Tote",
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
      price: "30.00",
      price_set: {
        shop_money: { amount: "30.00", currency_code: "USD" },
        presentment_money: { amount: "30.00", currency_code: "USD" },
      },
      product_exists: true,
      product_id: 6982418202829,
      properties: [
        { name: "cart_attribute", value: "This is a cart attribute" },
      ],
      quantity: 1,
      requires_shipping: true,
      sku: "27271",
      taxable: true,
      title: "Purple Insulated Tote",
      total_discount: "0.00",
      total_discount_set: {
        shop_money: { amount: "0.00", currency_code: "USD" },
        presentment_money: { amount: "0.00", currency_code: "USD" },
      },
      variant_id: 40869487116493,
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
    credit_card_name: "asdhjkasd",
    credit_card_wallet: null,
    credit_card_expiration_month: 7,
    credit_card_expiration_year: 2025,
  },
  payment_terms: null,
  refunds,
  shipping_address: {
    first_name: "Tom",
    address1: "1237 Walnut Street",
    phone: "1 (929) 837-4474",
    city: "Newton",
    zip: "02461",
    province: "Massachusetts",
    country: "United States",
    last_name: "Test",
    address2: "",
    company: null,
    latitude: 42.3196161,
    longitude: -71.20470279999999,
    name: "Tom Test",
    country_code: "US",
    province_code: "MA",
  },
  shipping_lines: [
    {
      id: 3305931931853,
      carrier_identifier: null,
      code: "Economy",
      delivery_category: null,
      discounted_price: "0.00",
      discounted_price_set: {
        shop_money: { amount: "0.00", currency_code: "USD" },
        presentment_money: { amount: "0.00", currency_code: "USD" },
      },
      phone: null,
      price: "0.00",
      price_set: {
        shop_money: { amount: "0.00", currency_code: "USD" },
        presentment_money: { amount: "0.00", currency_code: "USD" },
      },
      requested_fulfillment_service_id: null,
      source: "shopify",
      title: "Economy",
      tax_lines: [],
      discount_allocations: [],
    },
  ],
});

const cancel_event = event(new Date().toISOString(), []);
const refund_event = event(null, [
  {
    refund_line_items: [
      {
        line_item_id: 9998557348045,
        subtotal: 30,
      },
    ],
  },
]);

describe("handle-update-order", () => {
  let user_id: number;
  afterEach(async () => {
    await pointToNewUser(app, user_id);
  });

  it("line item refunded", async () => {
    await axios.post(
      "http://localhost:3031/api/v2/webhooks?source=shopify&type=order-create",
      event(null, [])
    );
    await axios.post(
      "http://localhost:3031/api/v2/webhooks?source=shopify&type=order-update",
      refund_event
    );

    [{ id: user_id }] = (await app.service("users").find({
      query: {
        shopify_customer_id: event(null, []).customer.id,
      },
      paginate: false,
    })) as any[];
    console.log(`test user id = ${user_id}`);

    const [sales_order] = (await app.service("sales-orders").find({
      query: {
        user_id,
      },
      paginate: false,
    })) as any[];

    assert.equal(sales_order.deleted_at, null);

    const [soa] = (await app.service("sales-order-attributes").find({
      query: {
        shopify_line_item_id: 9998557348045,
      },
    })) as any[];

    assert.notEqual(soa.deleted_at, null);
  });

  it("order cancelled", async () => {
    await axios.post(
      "http://localhost:3031/api/v2/webhooks?source=shopify&type=order-create",
      event(null, [])
    );
    await axios.post(
      "http://localhost:3031/api/v2/webhooks?source=shopify&type=order-update",
      cancel_event
    );

    [{ id: user_id }] = (await app.service("users").find({
      query: {
        shopify_customer_id: event(null, []).customer.id,
      },
      paginate: false,
    })) as any[];
    console.log(`test user id = ${user_id}`);

    const [sales_order] = (await app.service("sales-orders").find({
      query: {
        user_id,
      },
      paginate: false,
    })) as any[];

    assert.notEqual(sales_order.deleted_at, null);
  });
});
