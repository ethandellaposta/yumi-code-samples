import { Params } from "@feathersjs/feathers";
import { Service, MemoryServiceOptions } from "feathers-memory";
import { Application } from "../../../declarations";

export class PaymentMethodUpdate extends Service {
  app;
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: Partial<MemoryServiceOptions>, app: Application) {
    super(options);
    this.app = app;
  }

  async find(params?: Params): Promise<any> {
    const { shopify_customer_id } = params?.user as any;

    const customer_res = await this.app
      .service("shopify-partner-graphql-client")
      .create({
        query: `query {
          customer (id: "gid://shopify/Customer/${shopify_customer_id}") {
              paymentMethods(first: 10) {
                  edges {
                      node {
                          id
                          
                      }
                  }
              }
          }
      }`,
      });

    const payment_method_id =
      customer_res.body.data.customer.paymentMethods.edges[0].node.id;

    await this.app.service("shopify-partner-graphql-client").create({
      query: `mutation customerPaymentMethodSendUpdateEmail($customerPaymentMethodId: ID!) {
        customerPaymentMethodSendUpdateEmail(customerPaymentMethodId: $customerPaymentMethodId) {
          customer {
            id
          }
          userErrors {
            field
            message
          }
        }
      }`,
      variables: {
        customerPaymentMethodId: payment_method_id,
      },
    });

    return {
      success: true,
    };
  }
}
