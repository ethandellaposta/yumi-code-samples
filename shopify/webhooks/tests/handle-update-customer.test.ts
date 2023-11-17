import axios from "axios";
import app from "../../src/app";
import assert from "assert";
import { pointToNewUser } from "./utils";

export const create_event = {
  id: 5431663263949,
  email: "bobburger71330553@gmail.com",
  accepts_marketing: false,
  created_at: "2022-07-13T12:10:25-07:00",
  updated_at: "2022-07-13T12:10:25-07:00",
  first_name: "Bob",
  last_name: "Burger",
  orders_count: 0,
  state: "disabled",
  total_spent: "0.00",
  last_order_id: null,
  note: "",
  verified_email: true,
  multipass_identifier: null,
  tax_exempt: false,
  phone: "6627737748",
  tags: "referred_by=test123@gmail.com,role=vip",
  last_order_name: null,
  currency: "USD",
  addresses: [
    {
      id: 6598932922573,
      customer_id: 5431663263949,
      first_name: "Bob",
      last_name: "Burger",
      company: "",
      address1: "138 Beaconsfield Road",
      address2: "",
      city: "Brookline",
      province: "Massachusetts",
      country: "United States",
      zip: "02445",
      phone: "",
      name: "Bob Burger",
      province_code: "MA",
      country_code: "US",
      country_name: "United States",
      default: true,
    },
  ],
  accepts_marketing_updated_at: "2022-07-13T12:10:25-07:00",
  marketing_opt_in_level: null,
  email_marketing_consent: {
    state: "not_subscribed",
    opt_in_level: "single_opt_in",
    consent_updated_at: null,
  },
  sms_marketing_consent: {
    state: "not_subscribed",
    opt_in_level: "single_opt_in",
    consent_updated_at: null,
    consent_collected_from: "SHOPIFY",
  },
  sms_transactional_consent: null,
  admin_graphql_api_id: "gid://shopify/Customer/5431663263949",
  default_address: {
    id: 6598932922573,
    customer_id: 5431663263949,
    first_name: "Bob",
    last_name: "Burger",
    company: "",
    address1: "138 Beaconsfield Road",
    address2: "",
    city: "Brookline",
    province: "Massachusetts",
    country: "United States",
    zip: "02445",
    phone: "",
    name: "Bob Burger",
    province_code: "MA",
    country_code: "US",
    country_name: "United States",
    default: true,
  },
};

const event = {
  id: 5431663263949,
  email: "bobburger71330553@gmail.com",
  accepts_marketing: false,
  created_at: "2022-07-13T12:10:25-07:00",
  updated_at: "2022-07-13T12:19:52-07:00",
  first_name: "Bob",
  last_name: "Burger",
  orders_count: 0,
  state: "disabled",
  total_spent: "0.00",
  last_order_id: null,
  note: "",
  verified_email: true,
  multipass_identifier: null,
  tax_exempt: false,
  phone: "6627737748",
  tags: "referred_by=test123@gmail.com",
  last_order_name: null,
  currency: "USD",
  addresses: [
    {
      id: 6598932922573,
      customer_id: 5431663263949,
      first_name: "Bob",
      last_name: "Burger",
      company: "",
      address1: "138 Beaconsfield Road",
      address2: "",
      city: "Brookline",
      province: "Massachusetts",
      country: "United States",
      zip: "02445",
      phone: "",
      name: "Bob Burger",
      province_code: "MA",
      country_code: "US",
      country_name: "United States",
      default: true,
    },
    {
      id: 6598937641165,
      customer_id: 5431663263949,
      first_name: "Bob",
      last_name: "Burger",
      company: null,
      address1: "1412 Beaconsfield Road",
      address2: "4",
      city: "Brookline",
      province: null,
      country: "",
      zip: "02445",
      phone: "177288388",
      name: "Bob Burger",
      province_code: "MA",
      country_code: null,
      country_name: "",
      default: false,
    },
  ],
  accepts_marketing_updated_at: "2022-07-13T12:10:25-07:00",
  marketing_opt_in_level: null,
  email_marketing_consent: {
    state: "not_subscribed",
    opt_in_level: "single_opt_in",
    consent_updated_at: null,
  },
  sms_marketing_consent: {
    state: "not_subscribed",
    opt_in_level: "single_opt_in",
    consent_updated_at: null,
    consent_collected_from: "SHOPIFY",
  },
  sms_transactional_consent: null,
  admin_graphql_api_id: "gid://shopify/Customer/5431663263949",
  default_address: {
    id: 6598932922573,
    customer_id: 5431663263949,
    first_name: "Bob",
    last_name: "Burger",
    company: "",
    address1: "138 Beaconsfield Road",
    address2: "",
    city: "Brookline",
    province: "Massachusetts",
    country: "United States",
    zip: "02445",
    phone: "",
    name: "Bob Burger",
    province_code: "MA",
    country_code: "US",
    country_name: "United States",
    default: true,
  },
};

describe("handle-customer-update", () => {
  let user_id: number;
  afterEach(async () => {
    await pointToNewUser(app, user_id);
  });

  it("updates", async () => {
    await axios.post(
      "http://localhost:3031/api/v2/webhooks?source=shopify&type=customer-create",
      create_event
    );
    await axios.post(
      "http://localhost:3031/api/v2/webhooks?source=shopify&type=customer-update",
      event
    );

    const user_res = (await app.service("users").find({
      query: {
        shopify_customer_id: event.id,
      },
      paginate: false,
    })) as any[];

    const user = user_res[0];

    user_id = user ? user.id : undefined;
    console.log(`test user id = ${user_id}`);

    assert.notEqual(user_id, undefined);
    assert.deepEqual(
      {
        name: `${event.first_name} ${event.last_name}`,
        email: event.email,
        phone: event.phone,
        shopify_customer_id: event.id,
        role: null,
        referred_by: "test123@gmail.com",
      },
      {
        name: user.name,
        email: user.email,
        phone: user.phone,
        shopify_customer_id: user.shopify_customer_id,
        role: user.role,
        referred_by: user.referred_by,
      }
    );

    const expected_addresses = event.addresses.map((a: any, i: number) => {
      return {
        user_id: user.id,
        name: "",
        street: a.address1,
        street2: a.address2,
        city: a.city,
        state: a.province_code,
        postcode: a.zip,
        default: a.default ? 1 : 0,
        shopify_address_id: a.id,
      };
    });

    const addresses: any = await app.service("addresses").find({
      query: {
        user_id: user.id,
      },
      paginate: false,
    });
    console.log({ expected_addresses, addresses });

    assert.deepEqual(
      expected_addresses,
      addresses.map((a) => ({
        user_id: a.user_id,
        name: a.name,
        street: a.street,
        street2: a.street2,
        city: a.city,
        state: a.state,
        postcode: a.postcode,
        default: a.default,
        shopify_address_id: a.shopify_address_id,
      }))
    );
  });
});
