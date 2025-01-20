import exp from "constants";
import express from "express";
import auth from "./auth";
import storage from "./storage";
import favourit from "./favourit";
import user from "./user";

const router = express.Router();

export default (): express.Router => {
  user(router);
  auth(router);
  storage(router);
  favourit(router);

  return router;
};
