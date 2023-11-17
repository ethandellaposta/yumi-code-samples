import { query } from "../../../utils/query";

const bluebird = require("bluebird");

const addCreditToPausedOrders = async (feathers: any) => {
  const db = feathers.get("knexClient");

  const [{ date: delivery_date }] = (await feathers
    .service("order_weekly_limits")
    .find({
      query: {
        date: {
          $gt: new Date(),
        },
        $limit: 1,
        $sort: {
          date: 1,
        },
      },
      paginate: false,
    })) as any[];

  const uspi_soas = await query(
    db,
    `
    select
      soa.id
    from
      user_subscription_plans usp
      inner join sales_orders so on so.user_id = usp.user_id
      inner join sales_order_attributes soa on so.id = soa.sales_order_id
      inner join products p on p.id = soa.product_id
    where
      DATE(so.delivery_date) = DATE(:delivery_date)
      and so.deleted_at is null
      and so.paused = 1
      and p.product_type_id = 10
      and soa.deleted_at is null
      and usp.shopify_subscription_contract_id is not null
    group by
      soa.id,
      soa.user_subscription_plan_item_id,
      soa.shopify_order_id
    `,
    { delivery_date }
  );

  await bluebird.mapSeries(uspi_soas, async (soa: any) => {
    await feathers.service("/sqs").create(
      {
        sales_order_attribute_id: soa.id,
      },
      { sqsMessageType: "handlePausedSubscriptionContract" }
    );
  });

  return true;
};

export default addCreditToPausedOrders;
