import { Id, NullableId, Params, ServiceMethods } from "@feathersjs/feathers";
import _ from "lodash";
import { Application } from "../../../declarations";
import { DataType } from "@shopify/shopify-api";

interface Data {}

interface ServiceOptions {}

export class ShopifyProducts implements ServiceMethods<Data> {
  app: Application;
  options: ServiceOptions;

  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: ServiceOptions = {}, app: Application) {
    this.options = options;
    this.app = app;
  }

  async get(id: Id, params?: Params): Promise<any> {
    const res = await this.app
      .service("shopify-rest-client")
      .get(id, { path: "products" });

    return res.product;
  }
  async create(data: any, params?: Params): Promise<any> {
    delete data.created_at;
    delete data.updated_at;

    const product = await this.app
      .service("shopify-rest-client")
      .create({ path: "products", data, type: DataType.JSON });

    return product;
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

  async find(params?: any): Promise<any> {
    const products = await this.app
      .service("shopify-rest-client")
      .find({ query: { path: "products", ...params.query } });

    return products;
  }
}
