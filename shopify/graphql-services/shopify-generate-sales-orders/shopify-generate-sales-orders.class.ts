import { ProductTypeIds } from "./../../meta/generate-sales-orders/utils/constants";
import { Service, MemoryServiceOptions } from "feathers-memory";
import _, { toUpper } from "lodash";
import spacetime, { ParsableDate } from "spacetime";
import { GenerateSalesOrders } from "../../../utils/types";
import { Application } from "../../../declarations";
import getNextDeliveryDate from "../../../utils/getNextDeliveryDate";
import replaceProductsByPreferences from "../../meta/generate-sales-orders/utils/replace-products-by-preferences";
import getDeliveryDateRange from "../../../utils/getDeliveryDateRange";
import { query } from "../../../utils/query";
export interface CreateData {
  user_id: number;
  is_new_order: boolean;
  start_date?: string;
  week_count: number;
  quantity: number;
  shopify_subscription_contract: {
    user_subscription_plan_item_id: number;
    id: number;
    product_id: number;
    special_menu_id: number;
    quantity: number;
  };
  replace_preferences?: boolean;
  allow_ends_at_not_null?: boolean;
}

export class ShopifyGenerateSalesOrders extends Service {
  app: Application;

  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: Partial<MemoryServiceOptions>, app: Application) {
    super(options);
    this.app = app;
  }

  async create(data: CreateData): Promise<any> {
    const products: Record<string, GenerateSalesOrders.Product[]> =
      (await getProducts(this.app, data)) as any;

    await this.app.service("user-sales-orders-products").create({
      user_id: data.user_id,
      products_for_dates: products,
      custom: false,
      is_shopify: true,
    });

    return products;
  }
}

const getProducts = async (
  app: Application,
  data: CreateData
): Promise<any> => {
  let allSubItemProducts: GenerateSalesOrders.Product[] = [];
  let products = await getSubscriptionProducts(app, data);

  if (data.replace_preferences) {
    products = await replaceProductsByPreferences(
      app.get("knexClient"),
      products,
      data.user_id
    );
  }

  products = products.map(
    ({ violates_products, violates_ingredients, ...p }) => ({
      ...p,
      quantity: p.quantity,
    })
  );

  allSubItemProducts = allSubItemProducts.concat(products);

  const products_grouped = products
    .sort((a: any, b: any) => a.week_id - b.week_id)
    .reduce((p, c: any) => {
      /* eslint-disable no-param-reassign */
      p[c.delivery_date] = p[c.delivery_date] || [];
      p[c.delivery_date].push(c);
      return p;
    }, Object.create(null));

  const user_subscription_plan_item = await app
    .service("user-subscription-plan-items")
    .get(data.shopify_subscription_contract.user_subscription_plan_item_id);

  for (const date of Object.keys(products_grouped)) {
    products_grouped[date] = [
      {
        product_id: user_subscription_plan_item.product_id,
        product_type_id: ProductTypeIds.Subscriptions,
        user_subscription_plan_item_id: user_subscription_plan_item.id,
        quantity: data.shopify_subscription_contract.quantity,
      },
      ...products_grouped[date],
    ];
  }

  const formattedProducts: any = {};
  Object.keys(products_grouped).forEach((date) => {
    formattedProducts[date] = products_grouped[date].map((p: any) => ({
      product_type_id: 1,
      ..._.omit(p, ["delivery_date", "week_id", "product_name"]),
    }));
  });

  return formattedProducts;
};

export const getSubscriptionProducts = async (
  app: Application,
  data: CreateData
): Promise<GenerateSalesOrders.Product[]> => {
  const { id: product_id, selling_plan_id } = await app
    .service("products")
    .get(data.shopify_subscription_contract.product_id);
  const selling_plan = await app.service("selling-plans").get(selling_plan_id);

  const user_sales_orders = (await app.service("sales-orders").find({
    query: {
      user_id: data.user_id,
      deleted_at: null,
    },
    paginate: false,
  })) as any[];

  const contract_sales_order_attributes = (await app
    .service("sales-order-attributes")
    .find({
      query: {
        sales_order_id: {
          $in: user_sales_orders.map((uso: any) => uso.id),
        },
        deleted_at: null,
        user_subscription_plan_item_id:
          data.shopify_subscription_contract.user_subscription_plan_item_id,
      },
    })) as any[];

  let sales_order_cadence: any;

  if (contract_sales_order_attributes.length > 0) {
    const contract_last_delivery_date = contract_sales_order_attributes.reduce(
      (a: any, { user_subscription_plan_item_id, sales_order_id }: any) => {
        const { delivery_date } = user_sales_orders.find(
          (so: any) => so.id === sales_order_id
        );
        if (
          user_subscription_plan_item_id &&
          a[user_subscription_plan_item_id]
        ) {
          if (a[user_subscription_plan_item_id] < delivery_date) {
            a[user_subscription_plan_item_id] = delivery_date;
          }
        } else {
          a[user_subscription_plan_item_id] = delivery_date;
        }
        return a;
      },
      {}
    );

    const last_delivery_date = contract_last_delivery_date[
      data.shopify_subscription_contract.user_subscription_plan_item_id
    ]
      ? spacetime(
        contract_last_delivery_date[
        data.shopify_subscription_contract.user_subscription_plan_item_id
        ]
      )
      : getNextDeliveryDate().add(
        -1 * selling_plan.delivery_recurring_interval_count,
        "week"
      );

    const [{ id: first_delivery_week_id }] = (await app
      .service("order_weekly_limits")
      .find({
        query: {
          date: last_delivery_date
            .add(selling_plan.delivery_recurring_interval_count, "week")
            .format("yyyy-mm-dd"),
        },
      })) as any[];

    const { date: first_delivery_date } = await app
      .service("order_weekly_limits")
      .get(first_delivery_week_id);

    sales_order_cadence = {
      start_date: first_delivery_date,
      week_mod:
        first_delivery_week_id % selling_plan.delivery_recurring_interval_count,
    };
  } else {
    const first_delivery_date = data.start_date
      ? spacetime(data.start_date as ParsableDate)
      : getNextDeliveryDate();

    const [{ id: first_delivery_week_id }] = (await app
      .service("order_weekly_limits")
      .find({
        query: {
          date: first_delivery_date.format("yyyy-mm-dd"),
        },
      })) as any[];

    sales_order_cadence = {
      start_date: first_delivery_date,
      week_mod:
        first_delivery_week_id % selling_plan.delivery_recurring_interval_count,
    };
  }

  const date_range = await getDeliveryDateRange(
    app.get("knexClient"),
    spacetime(sales_order_cadence.start_date).format("yyyy-mm-dd"),
    data.week_count
  );

  const weeks = (
    (await app.service("order_weekly_limits").find({
      query: {
        date: {
          $gte: spacetime(date_range.start_date)
            .startOf("day")
            .format("yyyy-mm-dd"),
          $lte: spacetime(date_range.end_date)
            .startOf("day")
            .format("yyyy-mm-dd"),
        },
      },
    })) as any[]
  ).filter((week: any) => {
    return (
      !sales_order_cadence ||
      selling_plan.delivery_recurring_interval_count === 1 ||
      sales_order_cadence.week_mod ===
      week.id % selling_plan.delivery_recurring_interval_count
    );
  });

  const user_preferences = (await data.user_id)
    ? ((await app
      .service("preferences")
      .find({ user: { id: data.user_id } })) as any)
    : [];

  let week_id_to_special_menu_id: {
    max_week_id: number;
    special_menu_id: number;
  }[] = [];

  const special_menu = data.shopify_subscription_contract.special_menu_id
    ? await app
      .service("special-menus-new")
      .get(data.shopify_subscription_contract.special_menu_id)
    : null;

  if (special_menu && special_menu.type === "age") {
    const { size } = special_menu;
    const [child] = (await app.service("children").find({
      query: {
        parent_id: data.user_id,
      },
    })) as any[];

    const { diff } = spacetime(weeks[0].date).since(child.birthday);
    const months_old = diff.months + 12 * diff.years;
    let current_age = months_old;
    let weeks_left = data.week_count;

    let next_milestone = spacetime(child.birthday).add(
      current_age + 1,
      "month"
    );
    let weeks_temp = weeks;
    while (weeks_left > 0) {
      const week_chunk = weeks_temp.filter((week) =>
        spacetime(week.date).isBefore(next_milestone)
      );

      const [{ id: chunked_special_menu_id }] = await query(
        app.get("knexClient"),
        'select * from special_menus_new where type = "age" and age = :current_age and size = :size',
        {
          current_age:
            current_age > 24 ? 24 : current_age < 6 ? 6 : current_age,
          size,
        }
      );

      week_id_to_special_menu_id.push({
        max_week_id: week_chunk[0].id + week_chunk.length - 1,
        special_menu_id: chunked_special_menu_id,
      });

      const chunked_week_count =
        week_chunk.length <= weeks_left ? week_chunk.length : weeks_left;
      next_milestone = next_milestone.add(1, "month");
      current_age++;
      weeks_left -= chunked_week_count;
      weeks_temp = weeks_temp.slice(chunked_week_count);
    }
  }

  const week_products = await Promise.all(
    weeks.map(async (week: { id: number; date: string }) => {
      const special_menu_id =
        week_id_to_special_menu_id.length > 0
          ? week_id_to_special_menu_id.find((w) => w.max_week_id >= week.id)
            ?.special_menu_id
          : data.shopify_subscription_contract.special_menu_id;

      const products = await query(
        app.get("knexClient"),
        `
        select product_id, quantity, special_menu_id from subscription_products where subscription_plan_product_id = :product_id and special_menu_id ${special_menu_id ? `= ${special_menu_id}` : "IS NULL"
        } and week_id = :week_id and new_order = :new_order
      `,
        {
          product_id,
          week_id: week.id,
          new_order: 0,
        }
      );

      return Promise.all(
        products.map(
          async ({
            feature_index,
            new_order,
            created_at,
            updated_at,
            week_id,
            id,
            ...sp
          }: any) => {
            const violates_ingredients =
              (
                (await app.service("product-bill-of-materials").find({
                  query: {
                    product_id: sp.product_id,
                    deleted_at: null,
                    ingredient_id: {
                      $in: user_preferences.ingredients.map(
                        (i: any) => i.ingredient_id
                      ),
                    },
                  },
                })) as any[]
              ).length > 0;

            const violates_products =
              user_preferences.products.filter(
                (p: any) => p.product_id === sp.product_id
              ).length > 0;

            return {
              ...sp,
              delivery_date: spacetime(week.date).format("yyyy-mm-dd hh:mm:ss"),
              user_subscription_plan_item_id:
                data.shopify_subscription_contract
                  .user_subscription_plan_item_id,
              violates_products,
              violates_ingredients,
            };
          }
        )
      );
    })
  );

  const products: GenerateSalesOrders.Product[] = [].concat.apply(
    [],
    week_products as any
  );

  return products;
};
