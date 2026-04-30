import { Router } from "express";
import AuthController from "./auth.controller";
import validate from "../../common/middlewares/validate.middlware";
import { callbackPayloadModel } from "./auth.models";

const authRouter = Router();

authRouter.get("/callback", AuthController.handleCallback);

authRouter.post("/refresh-token", AuthController.handleRefreshToken);

authRouter.get("/iris-login", AuthController.handleIrisLogin);

export default authRouter;
