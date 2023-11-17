// Initializes the `shopify-client` service on path `/shopify-client`
import { ServiceAddons } from "@feathersjs/feathers";
import { Application } from "../../../declarations";
import { ShopifyRestClient } from "./shopify-rest-client.class";
import hooks from "./shopify-rest-client.hooks";

// Add this service to the service type index
declare module "../../../declarations" {
  interface ServiceTypes {
    "shopify-rest-client": ShopifyRestClient & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get("paginate"),
  };

  // Initialize our service with any options it requires
  app.use("/shopify-rest-client", new ShopifyRestClient(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service("shopify-rest-client");

  service.hooks(hooks);
}
