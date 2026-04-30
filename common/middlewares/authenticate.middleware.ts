import type { Request, Response, NextFunction } from "express";
import ApiError from "../utils/api-error";
import ApiResponse from "../utils/api-response";
import { verifyAccessToken } from "../../modules/auth/utils/token";
import type { AuthenticatedRequest } from "../utils/interfaces";

export const authenticate = () => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const header = req.headers["authorization"];
      if (!header) return next();

      if (!header?.startsWith("Bearer")) {
        throw ApiError.badRequest(
          `Authorization header must start with bearer`,
        );
      }

      const token = header.split(" ")[1];
      if (!token)
        throw ApiError.badRequest(
          "Authorization header must start with Bearer followed by the token",
        );

      const user = verifyAccessToken(token);
      req.user = user;

      next();
    } catch (error) {
      ApiResponse.error(
        res,
        ApiError.unauthorized("Session expired or invalid token"),
      );
    }
  };
};

export const restrictToAuthenticatedUser = () => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // if (!req.user) throw ApiError.unauthorized("Authentication required");
    if (!req.user)
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    next();
  };
};
