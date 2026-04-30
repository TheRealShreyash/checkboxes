import type { Request, Response } from "express";
import ApiResponse from "../../common/utils/api-response";
import { callback } from "./auth.services";

export default class AuthController {
  static async handleCallback(req: Request, res: Response) {
    try {
      const { searchParams } = new URL(req.url);
      const tokens = await callback(searchParams);
      const { accessToken, refreshToken } = tokens as {
        accessToken: string;
        refreshToken: string;
      };

      res.redirect("/");
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      });

      localStorage.setItem("accessToken", accessToken);
    } catch (error) {
      ApiResponse.error(res, error);
    }
  }
}
