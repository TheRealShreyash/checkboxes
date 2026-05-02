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

      console.log(tokens)

      const isProduction = process.env.NODE_ENV?.toLowerCase() === "production";

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        maxAge: 15 * 60 * 1000,
      });

      res.redirect("/");
    } catch (error) {
      console.log(error)
      ApiResponse.error(res, error);
    }
  }

  static async handleRefreshToken(req: Request, res: Response) {
    try {
      const oldRefreshToken = req.cookies["refreshToken"];
      const { accessToken, refreshToken } = (await refreshTokens(
        oldRefreshToken,
      )) as { accessToken: string; refreshToken: string };

      const isProduction = process.env.NODE_ENV?.toLowerCase() === "production";

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "strict" : "lax",
        maxAge: 15 * 60 * 1000,
      });

      ApiResponse.ok(res, "Tokens Refreshed successfully");
    } catch (error) {
      ApiResponse.error(res, error);
    }
  }

  static async handleIrisLogin(_: Request, res: Response) {
    const clientId = process.env.CLIENT_ID!;

    const IrisAuthURL = process.env.IRIS_AUTH_URL!;

    res.redirect(`${IrisAuthURL}/auth/authenticate?clientId=${clientId}`);
  }

  static handleMe(_: Request, res: Response) {
    try {
      ApiResponse.ok(res, "Authenticated");
    } catch (error) {
      ApiResponse.error(res, error);
    }
  }
}
