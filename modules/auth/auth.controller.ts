import type { Request, Response } from "express";
import ApiResponse from "../../common/utils/api-response";
import { callback, refreshTokens } from "./auth.services";

export default class AuthController {
  static async handleCallback(req: Request, res: Response) {
    try {
      const { searchParams } = new URL(req.url);
      const tokens = await callback(searchParams);
      const { accessToken, refreshToken } = tokens as {
        accessToken: string;
        refreshToken: string;
      };

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.redirect("/");
    } catch (error) {
      ApiResponse.error(res, error);
    }
  }

  static async handleRefreshToken(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies["refreshToken"];
      const { accessToken, newRefreshToken } = (await refreshTokens(
        refreshToken,
      )) as { accessToken: string; newRefreshToken: string };

      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      });

      ApiResponse.ok(res, "Tokens Refreshed successfully", {
        accessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      ApiResponse.error(res, error);
    }
  }
}
