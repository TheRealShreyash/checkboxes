import { Router } from "express";
import AuthController from "./auth.controller";
import {
  authenticate,
  restrictToAuthenticatedUser,
} from "../../common/middlewares/authenticate.middleware";

const authRouter = Router();

authRouter.get("/callback", AuthController.handleCallback);

authRouter.post("/refresh-token", AuthController.handleRefreshToken);

authRouter.get("/iris-login", AuthController.handleIrisLogin);

authRouter.get(
  "/me",
  authenticate(),
  restrictToAuthenticatedUser(),
  AuthController.handleMe,
);

export default authRouter;
