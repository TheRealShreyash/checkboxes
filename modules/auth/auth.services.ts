import ApiError from "../../common/utils/api-error";

export const callback = async (code: string) => {
  const response = await fetch("http://localhost:9090/auth/token", {
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
  const res = await fetch("http://localhost:9090/auth/refresh-token", {
    method: "POST",
    body: JSON.stringify({
      refreshToken,
    }),
  });

  const tokens = await res.json();

  return tokens;
};
