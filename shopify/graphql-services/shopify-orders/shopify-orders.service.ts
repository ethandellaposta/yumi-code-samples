// Initializes the `shopify-orders` service on path `/shopify-orders`
import { ServiceAddons } from "@feathersjs/feathers";
import { Application } from "../../../declarations";
import { ShopifyOrders } from "./shopify-orders.class";
import hooks from "./shopify-orders.hooks";

// Add this service to the service type index
declare module "../../../declarations" {
  interface ServiceTypes {
    "shopify-orders": ShopifyOrders & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get("paginate"),
  };

  // Initialize our service with any options it requires
  app.use("/shopify-orders", new ShopifyOrders(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service("shopify-orders");

  service.hooks(hooks);
}
