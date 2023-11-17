import { Id } from "@feathersjs/feathers";
import { Service, MemoryServiceOptions } from "feathers-memory";
import { Application } from "../../../declarations";

interface CreateData {
  user_subscription_plan_id: number;
  product_id: number;
  quantity: number;
}

interface UpdateData {
  product_id: number;
  quantity: number;
}

const SUBSCRIPTIONS_PERCENTAGE_DISCOUNTS: any = {
  jar: 0.2,
  vitamin: 0.1,
};

export class ShopifySubscriptionLines extends Service {
  app: Application;
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: Partial<MemoryServiceOptions>, app: Application) {
    super(options);
    this.app = app;
  }

  async create(data: CreateData, params: any): Promise<any> {
    const user_subscription_plan = await this.app
      .service("user-subscription-plans")
      .get(data.user_subscription_plan_id);
    const product = await this.app.service("products").get(data.product_id);

    const get_draft_id_res = await this.app
      .service("shopify-partner-graphql-client")
      .create({
        query: `
        mutation {
          subscriptionContractUpdate(
            contractId: "gid://shopify/SubscriptionContract/${user_subscription_plan.shopify_subscription_contract_id}"
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

    const price_res = await this.app
      .service("shopify-partner-graphql-client")
      .create({
        query: `
        query {
          productVariant(id: "gid://shopify/ProductVariant/${product.shopify_variant_id}") {
              price
          }
        }
      `,
      });

    const { price: currentPrice } = price_res.body.data.productVariant;

    await this.app.service("shopify-partner-graphql-client").create({
      query: `
        mutation subscriptionDraftLineAdd($draft_id: ID!, $input: SubscriptionLineInput!) {
          subscriptionDraftLineAdd(draftId: $draft_id, input: $input) {
            userErrors {
              field
              message
            }
          }
        }
      `,
      variables: {
        draft_id,
        input: {
          productVariantId: `gid://shopify/ProductVariant/${product.shopify_variant_id}`,
          quantity: data.quantity,
          sellingPlanId: `gid://shopify/SellingPlan/${product.selling_plan_id}`,
          currentPrice,
        },
      },
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

  async remove(id: Id, params: any): Promise<any> {
    const user_subscription_plan_item = await this.app
      .service("user-subscription-plan-items")
      .get(id);

    const user_subscription_plan = await this.app
      .service("user-subscription-plans")
      .get(user_subscription_plan_item.user_subscription_plan_id);

    const user_subscription_plans: any = await this.app
      .service("user-subscription-plans")
      .find({
        query: {
          user_id: params.user.id,
          ends_at: null,
        },
        paginate: false,
      });

    const uspis: any = await this.app
      .service("user-subscription-plan-items")
      .find({
        query: {
          ends_at: null,
          user_subscription_plan_id: {
            $in: user_subscription_plans.map((usp: any) => usp.id),
          },
        },
        paginate: false,
      });

    if (uspis.length === 1) {
      await this.app
        .service("shopify-subscription-contracts")
        .remove(user_subscription_plan.shopify_subscription_contract_id, {});
      return { success: true };
    }

    const get_draft_id_res = await this.app
      .service("shopify-partner-graphql-client")
      .create({
        query: `
        mutation {
          subscriptionContractUpdate(
            contractId: "gid://shopify/SubscriptionContract/${user_subscription_plan.shopify_subscription_contract_id}"
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
          mutation subscriptionDraftLineRemove($draft_id: ID!, $line_id: ID!) {
            subscriptionDraftLineRemove(draftId: $draft_id, lineId: $line_id) {
              userErrors {
                field
                message
              }
            }
          }
        `,
      variables: {
        draft_id,
        line_id: `gid://shopify/SubscriptionLine/${user_subscription_plan_item.shopify_subscription_line_id}`,
      },
    });

    const res = await this.app
      .service("shopify-partner-graphql-client")
      .create({
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

    console.dir({ res }, { depth: null });

    return {
      success: true,
    };
  }

  async update(id: Id, data: UpdateData, params?: any): Promise<any> {
    const [user_subscription_plan_item] = (await this.app
      .service("user-subscription-plan-items")
      .find({
        query: {
          shopify_subscription_line_id: id,
        },
        paginate: false,
      })) as any[];
    const user_subscription_plan = await this.app
      .service("user-subscription-plans")
      .get(user_subscription_plan_item.user_subscription_plan_id);
    const product = await this.app.service("products").get(data.product_id);
    const product_selling_plan = await this.app
      .service("selling-plans")
      .get(product.selling_plan_id);
    const old_product = await this.app
      .service("products")
      .get(user_subscription_plan_item.product_id);
    const old_product_selling_plan = await this.app
      .service("selling-plans")
      .get(old_product.selling_plan_id);

    const get_draft_id_res = await this.app
      .service("shopify-partner-graphql-client")
      .create({
        query: `
        mutation {
          subscriptionContractUpdate(
            contractId: "gid://shopify/SubscriptionContract/${user_subscription_plan.shopify_subscription_contract_id}"
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

    const shopify_product = (
      await this.app.service("shopify-partner-graphql-client").create({
        query: `
          query {
            productVariant(id: "gid://shopify/ProductVariant/${product.shopify_variant_id}") {
              price
              product {
                productType
              }
            }
          }
        `,
      })
    ).body.data.productVariant;

    const subscription_contract = (
      await this.app.service("shopify-partner-graphql-client").create({
        query: `
          query  {
            subscriptionContract(id: "gid://shopify/SubscriptionContract/${user_subscription_plan.shopify_subscription_contract_id}") {
              id
              createdAt
              updatedAt
              status
              billingPolicy {
                interval, intervalCount
              }
            }
          }
      `,
      })
    ).body.data.subscriptionContract;

    const single_price = parseInt(shopify_product.price);
    const price =
      subscription_contract.billingPolicy.intervalCount > 1
        ? (single_price -
            (single_price *
              SUBSCRIPTIONS_PERCENTAGE_DISCOUNTS[
                shopify_product.product.productType.split("-")[0]
              ] || 0)) *
          subscription_contract.billingPolicy.intervalCount
        : single_price;

    await this.app.service("shopify-partner-graphql-client").create({
      query: `mutation subscriptionDraftLineUpdate($draft_id: ID!, $input: SubscriptionLineUpdateInput!, $line_id: ID!) {
          subscriptionDraftLineUpdate(draftId: $draft_id, input: $input, lineId: $line_id) {
            userErrors {
              field
              message
            }
          }
        }
          `,
      variables: {
        draft_id,
        line_id: `gid://shopify/SubscriptionLine/${user_subscription_plan_item.shopify_subscription_line_id}`,
        input: {
          productVariantId: `gid://shopify/ProductVariant/${product.shopify_variant_id}`,
          quantity: data.quantity,
          sellingPlanId: `gid://shopify/SellingPlan/${product.selling_plan_id}`,
          currentPrice: price,
        },
      },
    });

    if (
      old_product_selling_plan.billing_recurring_interval_count !==
      product_selling_plan.billing_recurring_interval_count
    ) {
      await this.app.service("shopify-partner-graphql-client").create({
        query: `
          mutation subscriptionDraftUpdate(
            $draft_id: ID!
            $input: SubscriptionDraftInput!
          ) {
            subscriptionDraftUpdate(draftId: $draft_id, input: $input) {
              userErrors {
                field
                message
              }
            }
          }
        `,
        variables: {
          draft_id,
          input: {
            billingPolicy: {
              anchors: {
                day: 2,
                type: "WEEKDAY",
              },
              interval: product_selling_plan.billing_recurring_interval,
              intervalCount:
                product_selling_plan.billing_recurring_interval_count,
            },
          },
        },
      });
    }

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
