import { Router } from "express";
import CheckboxController from "./checkbox.controller";

const checkboxRouter = Router();

checkboxRouter.get("/state", CheckboxController.handleState);

export default checkboxRouter;
