// Initializes the `shopify-generate-sales-orders` service on path `/shopify-generate-sales-orders`
import { ServiceAddons } from "@feathersjs/feathers";
import { Application } from "../../../declarations";
import { ShopifyGenerateSalesOrders } from "./shopify-generate-sales-orders.class";
import hooks from "./shopify-generate-sales-orders.hooks";

// Add this service to the service type index
declare module "../../../declarations" {
  interface ServiceTypes {
    "shopify-generate-sales-orders": ShopifyGenerateSalesOrders &
      ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get("paginate"),
  };

  // Initialize our service with any options it requires
  app.use(
    "/shopify-generate-sales-orders",
    new ShopifyGenerateSalesOrders(options, app)
  );

  // Get our initialized service so that we can register hooks
  const service = app.service("shopify-generate-sales-orders");

  service.hooks(hooks);
}
