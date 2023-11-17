import { Params } from "@feathersjs/feathers";
import { Service, MemoryServiceOptions } from "feathers-memory";
import { Application } from "../../../declarations";

export class ShopifySmsConsent extends Service {
  app;

  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: Partial<MemoryServiceOptions>, app: Application) {
    super(options);
    this.app = app;
  }

  async find(params: Params): Promise<any> {
    const user = params.user;

    const customer_res = await this.app
      .service("shopify-partner-graphql-client")
      .create({
        query: `
      query {
        customer(id: "gid://shopify/Customer/${user?.shopify_customer_id}") {
            smsMarketingConsent {
              marketingState
            }
        }
    }`,
      });

    return (
      customer_res.body.data.customer.smsMarketingConsent.marketingState ===
      "SUBSCRIBED"
    );
  }
}
