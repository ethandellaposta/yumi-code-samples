import { Application } from "../../../feathersjs-backend/src/declarations";
import createJobLogger from "../../../feathersjs-backend/src/jobs/utils/createJobLogger";

const request_id = "ddda512c-ed4c-4bac-98bb-e411ec024988";

const log = createJobLogger(`retryWebhook: `);

export const retryWebhook = async (app: Application) => {
  const [request_log] = (await app.service("audit-logs-feathers").find({
    query: {
      request_id,
    },
  })) as any | undefined[];

  const { query, data } = request_log;

  log(`request_id="${request_id}"`);

  const res = await app.service("webhooks").create(JSON.parse(data), {
    query: JSON.parse(query),
  });

  return res;
};
