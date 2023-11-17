import { Paginated } from "@feathersjs/feathers";
import { ShopifyHookContext } from "./types/ShopifyHookContext.type";
import { Application } from "../../feathersjs-backend/src/declarations"
import { ProductTypeIds } from "../../feathersjs-backend/src/services/meta/generate-sales-orders/utils/constants";
import { ProductUpdateEvent, } from "./types/ProductUpdateEvent.type";

const METAFIELDS_KEYS_TO_METADATA_TYPE: Record<string, string> = {
  "badges": "shop_badges",
  "why_we_love": "why_we_love",
  "yumi_selector_type": "selector_type",
  "category": "category",
  "yumi_selector_title": "selector_title"
};



const getOneOffBoxProduct = async (app: Application, id: number): Promise<{ id: number; shopify_variant_id: number | null } | null> => {
  const productsResponse = (await app.service("products").find({
    query: {
      shopify_product_id: id,
      deleted_at: null
    }
  })) as Paginated<any>;

  // Only need to check first product returned
  // as each one off box has 1 variant only
  const [product] = productsResponse.data;

  if (product && product.product_type_id === ProductTypeIds.OneOffBoxes) return product;

  return null;
}

const getCanalProducts = async (app: any, id: number): Promise<{ id: number; shopify_variant_id: number | null }[]> => {
  const productsResponse = (await app.service("products").find({
    query: {
      shopify_product_id: id,
      deleted_at: null,
      $limit: 100
    },
  })) as Paginated<any>;

  const result = productsResponse.data.filter(p => p.product_type_id === ProductTypeIds.CanalProducts);

  return result;
}

const handleYumiOneOffBoxOrdered = async (app: any, log: (str: string) => void, event: ProductUpdateEvent) => {
  const { id, variants } = event;

  // If product ordered is not a Yumi 1.5 box, skip
  const dbOneOffBoxProduct = await getOneOffBoxProduct(app, id);

  if (dbOneOffBoxProduct) {
    // Check variants for inventory
    // NOTE: Yumi 1.5 boxes all will only have 1 variant,
    // but variants are returned from shopify as an array
    await Promise.all(variants.map(async variant => {

      if (variant.inventory_quantity <= 0 && variant.id === dbOneOffBoxProduct.shopify_variant_id) {
        log(`Setting product id ${dbOneOffBoxProduct.id} with variant id ${variant.id} as sold out...`);

        try {
          const query = {
            product_id: dbOneOffBoxProduct.id,
            type: "is_sold_out",
            value: 1
          }

          const existingPM = (await app.service("product-metadata").find({
            query
          })) as Paginated<any>;

          if (existingPM.total > 0) {
            log(`Product id ${dbOneOffBoxProduct.id} with variant id ${variant.id} already sold out`);
          }
          else {
            await app.service("product-metadata").create(query);
            log(`Set product id ${dbOneOffBoxProduct.id} with variant id ${variant.id} as sold out`);
          }
        } catch (e) {
          log(`Error setting product id ${dbOneOffBoxProduct.id} with variant id ${variant.id} as sold out`);
          console.log(e);
        }

      }
      else {
        log(`Product id ${dbOneOffBoxProduct.id} with variant id ${variant.id} has ${variant.inventory_quantity} units remaining`);
      }
    }));
  }
  else {
    log("Product is not a Yumi 1.5 box");
  }
}

const handleCanalProductOrdered = async (app: Application, log: (str: string) => void, event: ProductUpdateEvent) => {
  const { id, variants } = event;

  // If product ordered is not a Canal product, skip
  const canalProducts = await getCanalProducts(app, id);
  const canalDBProductsByVariant = Object.fromEntries(canalProducts.map(p => [p.shopify_variant_id, { ...p }]));

  if (canalProducts.length > 0) {
    await Promise.all(variants.map(async variant => {
      const dbProduct = canalDBProductsByVariant[variant.id];

      if (variant.inventory_quantity <= 0 && dbProduct) {
        log(`Setting product id ${dbProduct.id} with variant id ${variant.id} as sold out...`);

        try {
          const query = {
            product_id: dbProduct.id,
            type: "is_sold_out",
            value: 1
          }

          const existingPM = (await app.service("product-metadata").find({
            query
          })) as Paginated<any>;

          if (existingPM.total > 0) {
            log(`Product id ${dbProduct.id} with variant id ${variant.id} already sold out`);
          }
          else {
            await app.service("product-metadata").create(query);
            log(`Set product id ${dbProduct.id} with variant id ${variant.id} as sold out`);
          }
        } catch (e) {
          log(`Error setting product id ${dbProduct.id} with variant id ${variant.id} as sold out`);
          console.log(e);
        }
      }
      else if (!dbProduct) {
        log(`Product with variant id ${variant.id} does not exist in database`);
      }
      else {
        log(`Product id ${dbProduct?.id} with variant id ${variant.id} has ${variant.inventory_quantity} units remaining`);
      }
    }));
  } else {
    log("Product is not a Canal product");
  }
}

const handleProductVariantUpdated = async (app: Application, log: (str: string) => void, event: ProductUpdateEvent) => {
  const { id, title, variants } = event;
  const product_with_metafields_res = (await app.service("shopify-partner-graphql-client").create({
    query: `query {
      product(id: "gid://shopify/Product/${id}") {
          metafields (first: 50) {
              edges {
                  node {
                      key
                      type
                      value
                  }
              }
          }
      }
    }
  `}))
  const product_with_metafields = product_with_metafields_res.body
    .data.product.metafields.edges.map((e: any) => e.node).filter((m: any) => Object.keys(METAFIELDS_KEYS_TO_METADATA_TYPE).find(mts => mts === m.key));

  const missing_metafields = Object.keys(METAFIELDS_KEYS_TO_METADATA_TYPE).filter(mts => !product_with_metafields.find((m: any) => m.key === mts));
  for (const missing_metafield of missing_metafields) {
    product_with_metafields.push({
      key: missing_metafield,
      value: "",
    })
  }


  for (const variant of variants) {
    console.log({ variant })
    let product = (await app.service("products").find({
      query: {
        shopify_variant_id: variant.id,
        shopify_product_id: id
      },
      paginate: false
    }) as any[])[0];

    const productName = variants.length > 1 ? `${title} - ${variant.title}` : title;

    if (!product) {
      log("Product not found. Please create product manually.");
      continue;
    }

    if (product.name !== productName) {
      log("Shopify product name/variant name changed. Updating product name.")
      await app.service("products").patch(product.id, {
        name: productName
      });
    }

    if (product.price !== variant.price && product.product_type_id !== ProductTypeIds.Bundles) {
      log("Shopify variant price changed. Updating product price.")
      await app.service("products").patch(product.id, {
        price: variant.price
      });
    }

    for (const metafield of product_with_metafields) {
      const metadata_type = METAFIELDS_KEYS_TO_METADATA_TYPE[metafield.key]
      let value_formatted = metafield.value;
      if (metafield.type === "list.single_line_text_field") {
        const list = JSON.parse(metafield.value);
        value_formatted = list.join(",")
      } else if (metafield.type === "boolean") {
        value_formatted = metafield.value === "true" ? "1" : "0";
      }

      const product_metadata = (await app.service("product-metadata").find({
        query: {
          type: metadata_type,
          product_id: product.id,
          deleted_at: null
        }, paginate: false
      }) as any[])[0];
      if (!product_metadata) {
        log(`Creating new product '${metadata_type}' product_metadata row.`)
        await app.service("product-metadata").create({
          type: metadata_type,
          product_id: product.id,
          value: value_formatted
        });
      } else if (product_metadata.value !== value_formatted) {
        log(`Updating product '${metadata_type}' product_metadata row.`)

        await app.service("product-metadata").patch(product_metadata.id, {
          value: value_formatted
        });
      }
    }


  }
};

export default async (context: ShopifyHookContext, event: ProductUpdateEvent) => {
  const app: Application = context.app as any;

  const log = (str: string) =>
    console.log(`handle-product-update(id: ${event.id}): ${str}`);

  log("webhook starting");

  const { id, title } = event;
  log(`Shopify product id ${id}: ${title} updated`);

  await handleProductVariantUpdated(app, log, event);
  await handleYumiOneOffBoxOrdered(app, log, event);
  await handleCanalProductOrdered(app, log, event);
}
