import { z } from "zod";

export const callbackPayloadModel = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  code: z.string(),
});

export type CallbackPayload = z.infer<typeof callbackPayloadModel>;
