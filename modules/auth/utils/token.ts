import JWT from "jsonwebtoken";
import type { UserTokenPayload } from "../auth.models";
import JwksClient from "jwks-rsa";

const client = JwksClient({
  jwksUri: `${process.env.IRIS_AUTH_URL!}/auth/certs`,
  cache: true,
  cacheMaxAge: 86400,
});

export async function verifyAccessToken(token: string) {
  const decoded = JWT.decode(token, { complete: true });
  const key = await client.getSigningKey(decoded?.header.kid);
  const publicKey = key.getPublicKey();
  return JWT.verify(token, publicKey, {
    algorithms: ["RS256"],
  }) as UserTokenPayload;
}

export async function verifyRefreshToken(token: string) {
  const decoded = JWT.decode(token, { complete: true });
  const key = await client.getSigningKey(decoded?.header.kid);
  const publicKey = key.getPublicKey();
  return JWT.verify(token, publicKey, {
    algorithms: ["RS256"],
  }) as { id: string };
}
