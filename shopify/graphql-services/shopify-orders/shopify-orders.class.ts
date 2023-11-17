import { GeneralError } from "@feathersjs/errors";
import { Id, Params, NullableId } from "@feathersjs/feathers";
import { DataType } from "@shopify/shopify-api";
import { Service, MemoryServiceOptions } from "feathers-memory";
import { Application } from "../../../declarations";

export interface ShopifyOrderCreateRequestData {
  customer_id: number;
  delivery_date: string;
  shipping_line: {
    title: string;
    price: number;
  };
  line_items: {
    variant_id: number;
    selling_plan_id?: number;
    quantity: number;
  }[];
}
export interface ShopifyOrderCreateRequestParams {}
export interface ShopifyOrderCreateResponseData {
  id: string;
  line_items: {
    variant: {
      id: string;
      price: string;
      product: {
        id: string;
        title: string;
        productType: string;
      };
    };
    quantity: number;
  }[];
}

export class ShopifyOrders extends Service {
  app: Application;
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: Partial<MemoryServiceOptions>, app: Application) {
    super(options);
    this.app = app;
  }

  async get(id: Id, params?: Params): Promise<any> {
    const body = await this.app
      .service("shopify-rest-client")
      .get(id, { path: "orders" });

    return body.order;
  }

  async create(
    data: ShopifyOrderCreateRequestData,
    params?: ShopifyOrderCreateRequestParams
  ): Promise<ShopifyOrderCreateResponseData> {
    try {
      const create_order_res = await this.app
        .service("shopify-rest-client")
        .create({
          path: `orders.json`,
          data: {
            customer: {
              id: `gid://shopify/Customer/${data.customer_id}`,
            },
            order: {
              line_items: await Promise.all(
                data.line_items.map(async (li: any) => {
                  const [product] = (await this.app.service("products").find({
                    query: {
                      shopify_variant_id: li.variant_id,
                      selling_plan_id: li.selling_plan_id
                        ? li.selling_plan_id
                        : null,
                    },
                    paginate: false,
                  })) as any[];
                  return {
                    variant_id: `gid://shopify/ProductVariant/${li.variant_id}`,
                    selling_plan_id: li.selling_plan_id
                      ? `gid://shopify/SellingPlan/${li.selling_plan_id}`
                      : null,
                    price: product.price,
                    quantity: li.quantity,
                    name: product.name,
                    title: product.name,
                  };
                })
              ),
              shipping_line: data.shipping_line,
            },
          },
          type: DataType.JSON,
        });
      const { id, line_items } = create_order_res.body.order;

      return { id, line_items };
    } catch (e: any) {
      throw new GeneralError(e.message);
    }
  }
  update(id: NullableId, data: any, params?: Params): Promise<any> {
    throw new Error("Method not implemented.");
  }
  patch(id: NullableId, data: any, params?: Params): Promise<any> {
    throw new Error("Method not implemented.");
  }
  remove(id: NullableId, params?: Params): Promise<any> {
    throw new Error("Method not implemented.");
  }

  async find(params: Params): Promise<any> {
    const { shopify_order_ids } = params.query as any;
    const body = await this.app.service("shopify-rest-client").find({
      query: { path: `orders.json?ids=${shopify_order_ids.join(",")}` },
    });
    return body.orders;
  }
}
