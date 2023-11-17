// Initializes the `shopify-client` service on path `/shopify-client`
import { ServiceAddons } from "@feathersjs/feathers";
import { Application } from "../../../declarations";
import { ShopifyPartnerGraphQLClient } from "./shopify-partner-graphql-client.class";
import hooks from "./shopify-partner-graphql-client.hooks";

// Add this service to the service type index
declare module "../../../declarations" {
  interface ServiceTypes {
    "shopify-partner-graphql-client": ShopifyPartnerGraphQLClient & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get("paginate"),
  };

  // Initialize our service with any options it requires
  app.use("/shopify-partner-graphql-client", new ShopifyPartnerGraphQLClient(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service("shopify-partner-graphql-client");

  service.hooks(hooks);
}
