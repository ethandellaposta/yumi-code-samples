import { authenticate } from "@feathersjs/authentication";

const { iff, isProvider } = require("feathers-hooks-common");

export default {
  before: {
    all: [iff(isProvider("rest"), authenticate("jwt"))],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
};