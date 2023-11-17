import { authenticate } from "@feathersjs/authentication";
import isAdminHook from "../../../hooks/isAdmin.hook";

const { iff, isProvider } = require("feathers-hooks-common");

export default {
  before: {
    all: [iff(isProvider("rest"), [authenticate("jwt"), isAdminHook()])],
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
}