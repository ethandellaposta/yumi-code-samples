import { Id, NullableId, Params, ServiceMethods } from "@feathersjs/feathers";
import _ from "lodash";
import { Application } from "../../../declarations";
import Shopify from "@shopify/shopify-api";

interface Data {}

interface ServiceOptions {}

export class ShopifyRestClient implements ServiceMethods<Data> {
  app: Application;
  options: ServiceOptions;
  shopify: any;
  clientSession: any;

  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: ServiceOptions = {}, app: Application) {
    this.options = options;
    this.app = app;
    const shopifyParams: any = app.get("shopify");

    const client = new Shopify.Clients.Rest(
      shopifyParams ? shopifyParams.url : process.env.SHOPIFY_URL,
      shopifyParams
        ? shopifyParams.accessToken
        : process.env.SHOPIFY_ACCESS_TOKEN
    );

    this.shopify = client;
  }

  async get(id: Id, params?: any): Promise<any> {
    const { path } = params;

    const { body } = await this.shopify.get({
      path: `${path}/${id}`,
    });

    return body;
  }

  async create(passedInfo: any, params?: Params): Promise<any> {
    const { path, data, type } = passedInfo;
    delete data.created_at;
    delete data.updated_at;

    const product = await this.shopify.post({
      path,
      data,
      type,
    });

    return product;
  }

  async update(passedInfo: any, params?: Params): Promise<any> {
    console.log({ passedInfo });
    const { path, data, type } = passedInfo;
    delete data.created_at;
    delete data.updated_at;

    const product = await this.shopify.put({
      path,
      data,
      type,
    });

    return product;
  }

  async patch(passedInfo: any, params?: Params): Promise<any> {
    const { path, data, type } = passedInfo;
    delete data.created_at;
    delete data.updated_at;

    const product = await this.shopify.put({
      path,
      data,
      type,
    });

    return product;
  }

  remove(id: NullableId, params?: Params): Promise<any> {
    throw new Error("Method not implemented.");
  }

  async find(params?: any): Promise<any> {
    const { path, ...query } = params.query;

    const { body } = await this.shopify.get({
      path,
      query
    });

    return body;
  }
}
