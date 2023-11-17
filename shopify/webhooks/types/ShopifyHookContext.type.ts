import { HookContext } from "@feathersjs/feathers";
import { Application } from "../../../feathersjs-backend/src/declarations";

export type ShopifyHookContext = HookContext & {
  app: Application;
  params: { headers: any };
};
