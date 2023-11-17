// Initializes the `shopify-subscription-contracts` service on path `/shopify-subscription-contracts`
import { ServiceAddons } from "@feathersjs/feathers";
import { Application } from "../../../declarations";
import { ShopifySubscriptionContracts } from "./shopify-subscription-contracts.class";
import hooks from "./shopify-subscription-contracts.hooks";

// Add this service to the service type index
declare module "../../../declarations" {
  interface ServiceTypes {
    "shopify-subscription-contracts": ShopifySubscriptionContracts &
      ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get("paginate"),
  };

  // Initialize our service with any options it requires
  app.use(
    "/shopify-subscription-contracts",
    new ShopifySubscriptionContracts(options, app)
  );

  // Get our initialized service so that we can register hooks
  const service = app.service("shopify-subscription-contracts");

  service.hooks(hooks);
}
