// Initializes the `payment-method-update` service on path `/payment-method-update`
import { ServiceAddons } from "@feathersjs/feathers";
import { Application } from "../../../declarations";
import { PaymentMethodUpdate } from "./payment-method-update.class";
import hooks from "./payment-method-update.hooks";

// Add this service to the service type index
declare module "../../../declarations" {
  interface ServiceTypes {
    "payment-method-update": PaymentMethodUpdate & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: undefined,
  };

  // Initialize our service with any options it requires
  app.use("/payment-method-update", new PaymentMethodUpdate(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service("payment-method-update");

  service.hooks(hooks);
}
