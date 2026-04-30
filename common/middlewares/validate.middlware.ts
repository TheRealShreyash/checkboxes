import type { NextFunction, Request, Response } from "express";
import type { ZodObject } from "zod";
import ApiError from "../utils/api-error";
import ApiResponse from "../utils/api-response";

const validate = (schema: ZodObject<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        const errors = result.error.issues.map((e) => e.message).join("; ");
        throw ApiError.badRequest(errors);
      }

      req.body = result.data;
      next();
    } catch (error) {
      ApiResponse.error(res, error);
    }
  };
};

export default validate;
