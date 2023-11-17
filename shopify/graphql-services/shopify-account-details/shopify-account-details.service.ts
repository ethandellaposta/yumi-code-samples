// Initializes the `shopify-account-details` service on path `/shopify-account-details`
import { ServiceAddons } from "@feathersjs/feathers";
import { Application } from "../../../declarations";
import { ShopifyAccountDetails } from "./shopify-account-details.class";
import hooks from "./shopify-account-details.hooks";

// Add this service to the service type index
declare module "../../../declarations" {
  interface ServiceTypes {
    "shopify-account-details": ShopifyAccountDetails & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get("paginate"),
  };

  // Initialize our service with any options it requires
  app.use("/shopify-account-details", new ShopifyAccountDetails(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service("shopify-account-details");

  service.hooks(hooks);
}
