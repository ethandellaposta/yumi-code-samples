import bluebird from "bluebird";
import { sleep } from "../../../utils/sleep";

const deleteWebhook = async (feathers: any, id: string) =>
  feathers.service("shopify-partner-graphql-client").create({
    query: `
        mutation webhookSubscriptionDelete($id: ID!) {
  webhookSubscriptionDelete(id: $id) {
    deletedWebhookSubscriptionId
    userErrors {
      field
      message
    }
  }
}
          `,
    variables: {
      id,
    },
  });

const deleteWebhooks = async (feathers: any) => {
  const webhooks = await feathers
    .service("shopify-partner-graphql-client")
    .create({
      query: `
      query {
        webhookSubscriptions(first: 60) {
          edges {
            node {
              id
              createdAt
              callbackUrl
              topic
            }
          }
        }
      }
          `,
    });

  // console.dir(webhooks, { depth: null });

  const {
    body: {
      data: {
        webhookSubscriptions: { edges },
      },
    },
  } = webhooks;

  const res = await deleteWebhook(
    feathers,
    "gid://shopify/WebhookSubscription/1089295581389"
  );

  await bluebird.mapSeries(edges, async (e: any) => {
    // console.dir({ e }, { depth: null });
    if (e.node.callbackUrl.includes("ngrok.io")) {
      console.log("delete", e.node.id, "...");
      try {
        const res = await deleteWebhook(feathers, e.node.id);
      } catch (error) {
        console.log(error);
      }
      // console.dir(res, { depth: null });
      await sleep(100);
    }
  });
  return true;
};

export default deleteWebhooks;
