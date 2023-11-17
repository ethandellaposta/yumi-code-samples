const bluebird = require("bluebird");

const syncProduct = async (feathers: any, id: number) => {
  const db = feathers.get("knexClient");

  const [[product]] = JSON.parse(
    JSON.stringify(
      await db.raw(`select p.* from products p where p.id = ${id}`)
    )
  );

  console.log("product", !product.shopify_product_id);

  if (!product.shopify_product_id) {
    console.log("product inside create");
    await createProduct(feathers, id);
  }

  return true;
};

const createProduct = async (feathers: any, id: number) => {
  try {
    const db = feathers.get("knexClient");

    const [[foundProduct]] = JSON.parse(
      JSON.stringify(
        await db.raw(`select p.*, pt.name as product_type_name from products p
        inner join product_types pt on pt.id = p.product_type_id
        where p.id = ${id}`)
      )
    );

    if (!foundProduct) {
      return;
    }

    let variants = [];
    if (foundProduct.price) {
      variants.push({
        option1: "Default",
        price: `${foundProduct.price}`,
        sku: `${foundProduct.netsuite_internal_id || foundProduct.id}`,
      });
    }

    let images = [];

    const [[pm_image]] = JSON.parse(
      JSON.stringify(
        await db.raw(`
          select * from product_metadata where product_id = ${id} and type = 'image' and deleted_at is null
          `)
      )
    );

    // const [[full_image]] = JSON.parse(
    //   JSON.stringify(
    //     await db.raw(`
    //         select * from product_metadata where product_id = ${id} and type = 'full_image'
    //         `)
    //   )
    // );

    if (pm_image && pm_image?.value) {
      images.push({
        src: `https://res.cloudinary.com/helloyumi/image/upload/q_auto,f_auto/s3/${pm_image.value}`,
      });
    }

    console.log("IMAGES HERE", images);

    // product.images:[{"src":"http://example.com/rails_logo.gif"}]

    const {
      body: { product },
    } = await feathers.service("/shopify-products").create({
      product: {
        title: foundProduct.name,
        body_html: `<strong>${foundProduct.name}</strong>`,
        vendor: "Yumi",
        product_type: foundProduct.product_type_name,
        status: "draft",
        published_scope: "web",
        variants,
        images,
      },
    });

    console.log("productData", product);

    const {
      variants: [{ id: variantId }],
    } = product;

    // Update shopify product id
    await db.raw(
      `UPDATE products set shopify_product_id =${product.id}, shopify_variant_id=${variantId} where id = ${foundProduct.id}`
    );
  } catch (error) {
    console.log("error", error);
  }
};

export default syncProduct;
