import { query } from "express";
import faker from "faker";

export const pointToNewUser = async (app: any, user_id) => {
  await app.service("users").patch(user_id, {
    email: faker.internet.email(),
    phone: faker.phone.phoneNumber(),
    shopify_customer_id: 1,
  });

  const usps = await app.service("user-subscription-plans").find({
    query: {
      user_id,
    },
    paginate: false,
  });

  const ssbas = await app.service("shopify-subscription-billing-attempts").find({
    query: {
      shopify_subscription_contract_id: usps[0].shopify_subscription_contract_id
    }
  })

  for (const usp of usps) {
    await app
      .service("user-subscription-plans")
      .patch(usp.id, { shopify_subscription_contract_id: null });
  }
  for (const ssba of ssbas) {
    await app
      .service("shopify-subscription-billing-attempts")
      .patch(ssba.id, { shopify_subscription_contract_id: user_id });
  }

  await app.service("addresses").patch(
    null,
    {
      street: faker.address.streetAddress(),
    },
    {
      query: {
        user_id,
      },
    }
  );
};
