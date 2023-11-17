// Initializes the `shopify-subscription-lines` service on path `/shopify-subscription-lines`
import { ServiceAddons } from "@feathersjs/feathers";
import { Application } from "../../../declarations";
import { ShopifySubscriptionLines } from "./shopify-subscription-lines.class";
import hooks from "./shopify-subscription-lines.hooks";

// Add this service to the service type index
declare module "../../../declarations" {
  interface ServiceTypes {
    "shopify-subscription-lines": ShopifySubscriptionLines & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get("paginate"),
  };

  // Initialize our service with any options it requires
  app.use(
    "/shopify-subscription-lines",
    new ShopifySubscriptionLines(options, app)
  );

  // Get our initialized service so that we can register hooks
  const service = app.service("shopify-subscription-lines");

  service.hooks(hooks);
}
