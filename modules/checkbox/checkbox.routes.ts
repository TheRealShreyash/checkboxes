import { Router } from "express";
import CheckboxController from "./checkbox.controller";
import {
  authenticate,
  restrictToAuthenticatedUser,
} from "../../common/middlewares/authenticate.middleware";

const checkboxRouter = Router();

checkboxRouter.get(
  "/state",
  authenticate(),
  restrictToAuthenticatedUser(),
  CheckboxController.handleState,
);

export default checkboxRouter;
