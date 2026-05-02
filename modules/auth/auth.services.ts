import ApiError from "../../common/utils/api-error";

export const callback = async (code: string) => {
  const IrisAuthURL = process.env.IRIS_AUTH_URL!;
  const response = await fetch(`${IrisAuthURL}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      code,
    }),
  });

  if (!response.ok) throw ApiError.badRequest("OIDC request error");

  const tokens = await response.json();

  return tokens;
};

export const refreshTokens = async (refreshToken: string) => {
  if (!refreshToken) throw ApiError.badRequest("Refresh token not provided");
  const IrisAuthURL = process.env.IRIS_AUTH_URL!;

  const res = await fetch(`${IrisAuthURL}/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      refreshToken,
    }),
  });

  console.log(res)

  if (!res.ok) throw ApiError.unauthorized("Failed to refresh tokens");

  const { data } = (await res.json()) as {
    data: { accessToken: string; refreshToken: string };
  };

  console.log(data)

  return data;
};
