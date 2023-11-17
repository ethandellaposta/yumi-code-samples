import { actOnDefault } from "feathers-hooks-common/types";
import _, { omit } from "lodash";
import { Application } from "../src/declarations";
import { ShopifyHookContext } from "./types/ShopifyHookContext.type"

export default async (context: ShopifyHookContext, event: any) => {
  const app: Application = context.app as any;

  const log = (str: string) =>
    console.log(`handle-update-customer(id: ${event.id}): ${str}`);

  log("webhook starting");

  try {
    const [user] = (await app.service("users").find({
      query: {
        shopify_customer_id: event.id,
      },
      paginate: false,
    })) as any[];

    if (!user) {
      return { dropped: true }
    }

    if (
      `${event.first_name} ${event.last_name}` !== user.name ||
      event.email !== user.email ||
      event.phone !== user.phone
    )
      await app.service("users").patch(user.id, {
        name: `${event.first_name} ${event.last_name}`,
        email: event.email,
        phone: event.phone,
      });

    const address_shopify_res = await app.service("shopify-rest-client").find({
      query: {
        path: `customers/${event.id}/addresses.json`,
      },
    });

    const addresses_shopify: any[] = address_shopify_res.addresses.map(
      (a: any) => {
        return {
          user_id: user.id,
          street: a.address1,
          street2: a.address2 || "",
          city: a.city,
          state: a.province_code,
          postcode: a.zip,
          default: a.default ? 1 : 0,
          shopify_address_id: a.id,
        };
      }
    );

    const addresses_db: any[] = (
      (await app.service("addresses").find({
        query: {
          user_id: user.id,
        },
        paginate: false,
      })) as any[]
    ).map((a) => ({
      id: a.id,
      user_id: a.user_id,
      street: a.street,
      street2: a.street2,
      city: a.city,
      state: a.state,
      postcode: a.postcode,
      default: a.default,
      shopify_address_id: parseInt(a.shopify_address_id, 10),
    }));

    if (
      JSON.stringify(addresses_shopify) !==
      JSON.stringify(
        addresses_db.map((adb: any) => ({
          user_id: adb.user_id,
          street: adb.street,
          street2: adb.street2,
          city: adb.city,
          state: adb.state,
          postcode: adb.postcode,
          default: adb.default,
          shopify_address_id: adb.shopify_address_id,
        }))
      )
    ) {
      log("Customer addresses changed, syncing with database");
      const addresses_to_patch = addresses_shopify
        .filter((as: any) =>
          addresses_db.find(
            (ad: any) => ad.shopify_address_id === as.shopify_address_id
          )
        )
        .map((a: any) => {
          const adb = addresses_db.find(
            (ad: any) => ad.shopify_address_id === a.shopify_address_id
          );

          return {
            ...a,
            id: adb.id,
          };
        })
        .filter(
          (as: any) =>
            !addresses_db.find(
              (ad: any) =>
                ad.street === as.street &&
                ad.street2 === as.street2 &&
                ad.city === as.city &&
                ad.state === as.state &&
                ad.postcode === as.postcode &&
                ad.default === as.default
            )
        )
        .concat(
          addresses_db.filter(
            (ad) => ad.default === null || ad.default === undefined
          )
        );

      const addresses_to_create = addresses_shopify
        .filter(
          (as: any) =>
            !addresses_db.find(
              (ad: any) => ad.shopify_address_id === as.shopify_address_id
            )
        )
        .filter(
          (as: any) =>
            !addresses_db.find(
              (ad: any) =>
                ad.street === as.street &&
                ad.street2 === as.street2 &&
                ad.city === as.city &&
                ad.state === as.state &&
                ad.postcode === as.postcode
            )
        );

      const addresses_missing_shopify_id = addresses_shopify
        .filter(
          (as: any) =>
            !addresses_db.find(
              (ad: any) => ad.shopify_address_id === as.shopify_address_id
            )
        )
        .filter((as: any) =>
          addresses_db.find(
            (ad: any) =>
              ad.street === as.street &&
              ad.street2 === as.street2 &&
              ad.city === as.city &&
              ad.state === as.state &&
              ad.postcode === as.postcode
          )
        )
        .map((as: any) => {
          const adb = addresses_db.find(
            (ad: any) =>
              ad.street === as.street &&
              ad.street2 === as.street2 &&
              ad.city === as.city &&
              ad.state === as.state &&
              ad.postcode === as.postcode
          );

          return {
            ...as,
            id: adb.id,
          };
        });

      const addresses_to_delete = addresses_db.filter(
        (ad: any) =>
          !addresses_shopify.find(
            (as: any) =>
              !ad.shopify_address_id ||
              as.shopify_address_id === ad.shopify_address_id
          )
      );

      for (const a of addresses_to_create) {
        await app.service("user-address").update(null, a, {
          user: {
            is_admin: 1,
          },
          query: {
            user_id: user.id,
          },
          is_from_webhook: true,
        });
      }
      for (const a of addresses_to_patch) {
        await app.service("user-address").update(
          null,
          {
            ...a,
            default: a.default ? 1 : 0,
          },
          {
            user: {
              is_admin: 1,
            },
            query: {
              user_id: user.id,
            },
            is_from_webhook: true,
          }
        );
      }

      for (const a of addresses_to_delete) {
        await app.service("user-address").remove(null, {
          user: {
            is_admin: 1,
          },
          query: {
            user_id: user.id,
            address_id: a.id,
          },
          is_from_webhook: true,
        });
      }
      for (const a of addresses_missing_shopify_id) {
        await app.service("user-address").update(
          null,
          { ...a, shopify_address_id: a.shopify_address_id },
          {
            user: {
              is_admin: 1,
            },
            query: {
              user_id: user.id,
            },
            is_from_webhook: true,
          }
        );
      }
    }

    return { success: true };
  } catch (error) {
    log(JSON.stringify(error));
    log("There was an issue handling customer update.");
    return { success: false, error: JSON.stringify(error) };
  }
};
