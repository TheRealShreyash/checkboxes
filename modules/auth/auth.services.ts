import ApiError from "../../common/utils/api-error";

export const callback = async (searchParams: URLSearchParams) => {
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const storedState = sessionStorage.getItem("oauth_state");

  if (state !== storedState) {
    throw ApiError.badRequest("Invalid State");
  }

  sessionStorage.removeItem("oauth_state");

  const response = await fetch("http://localhost:9090/auth/token", {
    method: "POST",
    body: JSON.stringify({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      code,
    }),
  });

  const tokens = await response.json();

  return tokens;
};
