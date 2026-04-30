import { Router } from "express";
import AuthController from "./auth.controller";
import validate from "../../common/middlewares/validate.middlware";
import { callbackPayloadModel } from "./auth.models";

const authRouter = Router();

authRouter.get(
  "/callback",
  validate(callbackPayloadModel),
  AuthController.handleCallback,
);

export default authRouter;
