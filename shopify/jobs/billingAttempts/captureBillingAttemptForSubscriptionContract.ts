const captureBillingAttemptForSubscriptionContract = async (
  feathers: any,
  subscription_contract_id: string,
  shopify_next_billing_date: string,
  attempt: number
) => {
  const origin_time = new Date(shopify_next_billing_date).toISOString();
  const sql_date = new Date(shopify_next_billing_date)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  const idempotency_key = `${subscription_contract_id}::${sql_date}::${attempt + 1
    }`;

  await feathers
    .service("/subscription-contract-billing-attempt")
    .create({
      subscription_contract_id: parseInt(subscription_contract_id, 10),
      idempotency_key,
      origin_time,
    });
};

export default captureBillingAttemptForSubscriptionContract;
