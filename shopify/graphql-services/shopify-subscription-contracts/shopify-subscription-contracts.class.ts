import { Id } from "@feathersjs/feathers";
import { Service, MemoryServiceOptions } from "feathers-memory";
import { Application } from "../../../declarations";

export class ShopifySubscriptionContracts extends Service {
  app: Application;

  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: Partial<MemoryServiceOptions>, app: Application) {
    super(options);
    this.app = app;
  }

  async remove(id: Id, params: any): Promise<any> {
    const get_draft_id_res = await this.app
      .service("shopify-partner-graphql-client")
      .create({
        query: `
        mutation {
          subscriptionContractUpdate(
            contractId: "gid://shopify/SubscriptionContract/${id}"
          ) {
            draft {
              id
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      });

    const { id: draft_id } =
      get_draft_id_res.body.data.subscriptionContractUpdate.draft;

    await this.app.service("shopify-partner-graphql-client").create({
      query: `
        mutation {
          subscriptionDraftUpdate(
            draftId: "${draft_id}"
            input: { status: CANCELLED }
          ) {
            userErrors {
              field
              message
            }
          }
        }
      `,
    });

    await this.app.service("shopify-partner-graphql-client").create({
      query: `
      mutation {
        subscriptionDraftCommit(draftId: "${draft_id}") {
          userErrors {
            field
            message
          }
        }
      }
    `,
    });

    return {
      success: true,
    };
  }
}
