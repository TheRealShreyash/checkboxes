import type { Request, Response } from "express";
import ApiResponse from "../../common/utils/api-response";
import { callback, refreshTokens } from "./auth.services";

export default class AuthController {
  static async handleCallback(req: Request, res: Response) {
    try {
      const code = req.query.code;
      const tokens = (await callback(code as string)) as { data: any };
      const { accessToken, refreshToken } = tokens.data as {
        accessToken: string;
        refreshToken: string;
      };

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
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
        secure: false,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 15 * 60 * 1000,
      });

      ApiResponse.ok(res, "Tokens Refreshed successfully");
    } catch (error) {
      ApiResponse.error(res, error);
    }
  }

  static async handleIrisLogin(req: Request, res: Response) {
    const clientId = process.env.CLIENT_ID!;

    res.redirect(
      `http://localhost:9090/auth/authenticate?clientId=${clientId}`,
    );
  }
}
