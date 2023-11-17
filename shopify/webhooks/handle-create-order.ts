/* eslint-disable no-restricted-syntax */
import { Unprocessable } from "@feathersjs/errors";
import _ from "lodash";
import assignOrCreateUserShopify from "../src/hooks/assignOrCreateUserShopify.hook";
import getNextDeliveryDate from "../src/utils/getNextDeliveryDate";
import { query } from "../src/utils/query";
import { ProductTypeIds } from "../src/services/meta/generate-sales-orders/utils/constants";
import { ShopifyHookContext } from "./types/ShopifyHookContext.type";
import { OrderCreateEvent } from "./types/OrderCreateEvent.type";

// assume you have user id and address id

export default async (context: ShopifyHookContext, event: OrderCreateEvent) => {
  const log = (str: string) =>
    console.log(`handle-create-order(id: ${event.id}): ${str}`);

  log("webhook starting");

  try {
    const {
      checkout_token,
      id: order_id,
      checkout_id,
      token: order_token,
      source_name: source
    } = context.data;

    const fromCanal = source === "Canal"

    if ((!checkout_token || !checkout_id) && !fromCanal) {
      const invalid_checkout = new Unprocessable("Invalid Checkout Error", {
        error: {
          user: "Sorry, please pass a valid checkout",
        },
      });

      throw invalid_checkout;
    }

    let customer;
    if (event.customer) {
      customer = event.customer;
    } else {
      customer = (
        await context.app
          .service("shopify-rest-client")
          .get(event.customer_id, { path: "customers" })
      ).customer;
    }

    const shopify_order = await context.app
      .service("shopify-orders")
      .get(event.id);

    const has_subscription =
      shopify_order.line_items.filter((li: any) =>
        li.name.includes("Subscription")
      ).length > 0;

    let user_id_attribute;
    for (const line_item of event.line_items) {
      if (line_item.properties.length > 0) {
        const user_id_property = line_item.properties.find(
          (p: any) => p.name === "_user_id"
        );
        if (user_id_property) {
          user_id_attribute = user_id_property.value;
        }
      }
    }

    const {
      billing_address: { phone },
      shipping_address: { id: shopify_address_id, address1, city, zip, address2, province_code },
    } = context.data;

    let user;
    console.log({ user_id_attribute })
    if (user_id_attribute) {
      user = await context.app
        .service("users")
        .get(parseInt(user_id_attribute, 10));
    } else {
      user = await assignOrCreateUserShopify({
        email: customer.email,
        name: `${customer.first_name} ${customer.last_name}`,
        shopify_customer_id: event.customer
          ? event.customer.id
          : event.customer_id,
        from_shopify: true,
        phone,
        address: {
          shopify_address_id,
          street: address1 || "",
          street2: address2 || "",
          postcode: zip || "",
          state: province_code || "",
          city: city || "",
        },
      })(context);
    }

    if (!user) {
      const invalid_user_error = new Unprocessable("Invalid User Error", {
        error: {
          user: "Sorry, invalid user.",
        },
      });
      throw invalid_user_error;
    }

    if (!has_subscription) {
      const childInfo = await context.app.service("/children").find({
        query: {
          parent_id: user.id,
        },
      });

      console.log({ childInfo });

      const [child] = childInfo;

      if (!child) {
        await context.app.service("/children").create({
          birthday: "2022-01-01",
          name: "Baby",
          parent_id: user.id,
        });
      }
    }

    await query(
      context.app.get("knexClient"),
      `update users set shopify_customer_id = :shopify_customer_id
      where id = :id`,
      {
        shopify_customer_id: event.customer
          ? event.customer.id
          : event.customer_id,
        id: user.id,
      }
    );

    // Insert shopify Auth user attributes
    const user_attributes = [
      {
        attribute: "shopify_checkout_token",
        value: checkout_token,
        user_id: user.id,
      },
      {
        attribute: "shopify_checkout_id",
        value: checkout_id,
        user_id: user.id,
      },
      {
        attribute: "shopify_order_token",
        value: order_token,
        user_id: user.id,
      },
      {
        attribute: "shopify_order_id",
        value: order_id,
        user_id: user.id,
      },
    ];

    if (!fromCanal) {
      await context.app.service("/user-attributes").create(user_attributes);
    }

    const { line_items } = event;

    let products_data: {
      shopify_line_item_id: number;
      quantity: number;
      product_id: number;
      product_type_id: number;
      variant_id: number;
    }[] = await Promise.all(
      line_items.map(async (li: any) => {
        const { quantity, product_id, variant_id } = li;
        const [product] = await query(
          context.app.get("knexClient"),
          `
                select * from products
                where shopify_product_id = :shopify_product_id
                and shopify_variant_id = :shopify_variant_id
                `,
          {
            shopify_product_id: product_id,
            shopify_variant_id: variant_id,
          }
        );
        return {
          shopify_line_item_id: li.id,
          variant_id,
          quantity,
          product_id: product.id,
          product_type_id: product.product_type_id,
          shopify_order_id: event.id,
        };
      })
    );

    const SUNFLOWER_BOOK_PRODUCT_ID = 2492;

    const sunflower_book = products_data.find(
      (p) => p.product_id === SUNFLOWER_BOOK_PRODUCT_ID
    );

    products_data = products_data.filter(
      (p) =>
        p.product_type_id !== ProductTypeIds.Subscriptions &&
        p.product_id !== SUNFLOWER_BOOK_PRODUCT_ID
    );

    if (products_data.length === 0 && !sunflower_book) {
      log(
        "Dropping create order webhook because product creation is handled elsewhere."
      );
      return { dropped: true };
    }

    const products_for_dates: any = {
      [getNextDeliveryDate().format("yyyy-mm-dd")]: products_data,
    };

    if (sunflower_book) {
      products_for_dates["2022-12-27"] = [sunflower_book];
    }

    await context.app.service("user-sales-orders-products").create({
      user_id: user.id,
      products_for_dates,
      custom: true,
      is_shopify: true,
    });

    return {
      success: true,
    };
  } catch (error) {
    console.log(error);
    log(JSON.stringify(error));
    log("There was an issue handling create order.");

    const slackService = await context.app.service("slack");

    const message = slackService.composeWebhookFailedMessage(event, error);

    await slackService.create({ message });

    return {
      success: false,
      error: JSON.stringify(error),
    };
  }
};
