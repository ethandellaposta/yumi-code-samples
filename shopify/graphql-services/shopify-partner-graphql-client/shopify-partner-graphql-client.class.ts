import { Id, NullableId, Params, ServiceMethods } from "@feathersjs/feathers";
import _ from "lodash";
import { Application } from "../../../declarations";
import Shopify from "@shopify/shopify-api";
import axios from "axios";

interface Data { }

interface ServiceOptions { }

export class ShopifyPartnerGraphQLClient implements ServiceMethods<Data> {
  app: Application;
  options: ServiceOptions;
  shopify: any;
  shopifyUrl: string;
  clientSession: any;
  shopifyPartnerAccessToken: any;

  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: ServiceOptions = {}, app: Application) {
    this.options = options;
    this.app = app;
    const shopifyParams: any = app.get("shopify");
    const shopifyPartnerParams: any = app.get("shopifyPartner");

    this.shopifyPartnerAccessToken = shopifyPartnerParams
      ? shopifyPartnerParams.accessToken
      : process.env.SHOPIFY_PARTNER_ACCESS_TOKEN;

    this.shopifyUrl = shopifyParams ? shopifyParams.url : process.env.SHOPIFY_URL;

    const client = new Shopify.Clients.Graphql(
      shopifyParams ? shopifyParams.url : process.env.SHOPIFY_URL,
      shopifyPartnerParams
        ? shopifyPartnerParams.accessToken
        : process.env.SHOPIFY_PARTNER_ACCESS_TOKEN
    );

    this.shopify = client;
  }

  get(id: Id, params?: Params): Promise<any> {
    throw new Error("Method not implemented.");
  }
  async create(passedInfo: any, params?: Params): Promise<any> {
    const { query, variables } = passedInfo;

    const response = await axios.post(
      `https://${this.shopifyUrl}/admin/api/2022-04/graphql.json`,
      { query, variables },
      {
        headers: {
          "X-Shopify-Access-Token": this.shopifyPartnerAccessToken,
        },
      }
    );

    return { body: { data: response.data.data } };
  }

  async update(passedInfo: any, params?: Params): Promise<any> {
    throw new Error("Method not implemented.");
  }

  async patch(passedInfo: any, params?: Params): Promise<any> {
    throw new Error("Method not implemented.");
  }

  remove(id: NullableId, params?: Params): Promise<any> {
    throw new Error("Method not implemented.");
  }

  async find(params?: any): Promise<any> {
    throw new Error("Method not implemented.");
  }
}
