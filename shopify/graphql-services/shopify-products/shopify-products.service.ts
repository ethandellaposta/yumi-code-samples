// Initializes the `shopify-products` service on path `/shopify-products`
import { ServiceAddons } from "@feathersjs/feathers";
import { Application } from "../../../declarations";
import { ShopifyProducts } from "./shopify-products.class";
import hooks from "./shopify-products.hooks";

// Add this service to the service type index
declare module "../../../declarations" {
  interface ServiceTypes {
    "shopify-products": ShopifyProducts & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get("paginate"),
  };

  // Initialize our service with any options it requires
  app.use("/shopify-products", new ShopifyProducts(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service("shopify-products");

  service.hooks(hooks);
}
