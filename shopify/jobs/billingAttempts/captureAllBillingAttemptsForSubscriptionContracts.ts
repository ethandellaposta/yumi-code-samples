import { sleep } from "../../../feathersjs-backend/src/utils/sleep";
import captureBillingAttemptForSubscriptionContract from "./captureBillingAttemptForSubscriptionContract";

const bluebird = require("bluebird");

const captureAllBillingAttemptsForSubscriptionContracts = async (
  feathers: any
) => {
  const db = feathers.get("knexClient");

  const [user_subscription_plans] = JSON.parse(
    JSON.stringify(
      await db.raw(`
      SELECT
      usp.id, usp.shopify_subscription_contract_id,
    CONVERT_TZ(usp.shopify_next_billing_date, "UTC", "America/Los_Angeles") AS shopify_next_billing_date, CASE when attempt is null then 0 else attempt end as attempt
  FROM
    user_subscription_plans usp
    LEFT JOIN (
      SELECT
        sba.*
      FROM
        shopify_subscription_billing_attempts sba
        LEFT JOIN shopify_subscription_billing_attempts sba2 ON (sba.shopify_subscription_contract_id = sba2.shopify_subscription_contract_id and sba.billing_date = sba2.billing_date AND sba.created_at < sba2.created_at)
      WHERE
        sba2.id IS NULL
        AND sba.billing_date BETWEEN DATE_SUB(NOW(), interval 2 day)
        AND DATE_add(NOW(), interval 2 day)) sbaJoined ON
        sbaJoined.shopify_subscription_contract_id = usp.shopify_subscription_contract_id
    WHERE (sbaJoined.status != 'SUCCESS' or sbaJoined.status is null) AND usp.shopify_next_billing_date BETWEEN DATE_SUB(NOW(), interval 2 day) AND DATE_add(NOW(), interval 2 day) and usp.ends_at is null;
      `)
    )
  );

  await bluebird.mapSeries(
    user_subscription_plans,
    async (subscription_contract: any) => {
      const {
        shopify_subscription_contract_id,
        shopify_next_billing_date,
        attempt,
      } = subscription_contract;

      try {
        await captureBillingAttemptForSubscriptionContract(
          feathers,
          shopify_subscription_contract_id,
          shopify_next_billing_date,
          attempt
        );
        await sleep(200);
      } catch (e) {
        console.log("e", e);
      }
    }
  );

  return true;
};

export default captureAllBillingAttemptsForSubscriptionContracts;
