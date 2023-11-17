// Initializes the `shopify-sms-consent` service on path `/shopify-sms-consent`
import { ServiceAddons } from "@feathersjs/feathers";
import { Application } from "../../../declarations";
import { ShopifySmsConsent } from "./shopify-sms-consent.class";
import hooks from "./shopify-sms-consent.hooks";

// Add this service to the service type index
declare module "../../../declarations" {
  interface ServiceTypes {
    "shopify-sms-consent": ShopifySmsConsent & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get("paginate"),
  };

  // Initialize our service with any options it requires
  app.use("/shopify-sms-consent", new ShopifySmsConsent(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service("shopify-sms-consent");

  service.hooks(hooks);
}
