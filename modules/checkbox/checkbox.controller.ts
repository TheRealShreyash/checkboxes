import type { Request, Response } from "express";
import ApiResponse from "../../common/utils/api-response";
import { getState } from "./checkbox.services";

export default class CheckboxController {
  static async handleState(_: Request, res: Response) {
    try {
      const data = await getState();
      ApiResponse.ok(res, "State found", { checkboxes: data });
    } catch (error) {
      ApiResponse.error(res, error);
    }
  }
}
