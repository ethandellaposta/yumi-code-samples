import { NullableId, Params } from "@feathersjs/feathers";
import { Service, MemoryServiceOptions } from "feathers-memory";
import { Application } from "../../../feathersjs-backend/src/declarations";

export class ShopifyAccountDetails extends Service {
  app;
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: Partial<MemoryServiceOptions>, app: Application) {
    super(options);
    this.app = app;
  }

  async update(
    id: NullableId,
    data: {
      name: string;
      email: string;
      phone: string;
      is_sms_consented: boolean;
    },
    params: Params
  ): Promise<any> {
    const user = await this.app.service("users").patch(params.user?.id, {
      name: data.name,
      email: data.email,
      phone: data.phone,
    });

    const [firstName, lastName] = data.name.split(" ");

    const addresses_res = await this.app
      .service("shopify-partner-graphql-client")
      .create({
        query: `
      query {
        customer(id: "gid://shopify/Customer/${user.shopify_customer_id}") {
            addresses(first: 10) {
                country
                firstName
                lastName
                address1
                address2
                city
                provinceCode
                zip
                phone
            }
        }
    }`,
      });
    const addresses = addresses_res.body.data.customer.addresses.map(
      (a: any) => ({
        ...a,
        firstName,
        lastName,
        phone: data.phone,
      })
    );

    await this.app.service("shopify-partner-graphql-client").create({
      query: `
        mutation customerUpdate($input: CustomerInput!) {
          customerUpdate(input: $input) {
            customer {
              id
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      variables: {
        input: {
          id: `gid://shopify/Customer/${user.shopify_customer_id}`,
          firstName,
          lastName,
          email: data.email,
          phone: data.phone,
          addresses,
        },
      },
    });

    await this.app.service("shopify-partner-graphql-client").create({
      query: `
        mutation customerSmsMarketingConsentUpdate($input: CustomerSmsMarketingConsentUpdateInput!) {
          customerSmsMarketingConsentUpdate(input: $input) {
            customer {
              id
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      variables: {
        input: {
          customerId: `gid://shopify/Customer/${user.shopify_customer_id}`,
          smsMarketingConsent: {
            marketingState: data.is_sms_consented
              ? "SUBSCRIBED"
              : "UNSUBSCRIBED",
            marketingOptInLevel: "SINGLE_OPT_IN",
          },
        },
      },
    });

    return this.app.service("users").get(params.user?.id, {});
  }
}
