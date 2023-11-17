import { sleep } from "../../../utils/sleep";
import syncProduct from "./syncProduct";

const bluebird = require("bluebird");

const syncProducts = async (feathers: any) => {
  const db = feathers.get("knexClient");

  const [products] = JSON.parse(
    JSON.stringify(
      await db.raw(`
      SELECT * from products where deleted_at is null and shopify_product_id is null and stripe_price_id is not null and (end_date is null or  end_date > NOW())
      `)
    )
  );

  await bluebird.mapSeries(products, async (product: any) => {
    const { id } = product;
    await syncProduct(feathers, id);
    await sleep(200);
  });

  return true;
};

export default syncProducts;
