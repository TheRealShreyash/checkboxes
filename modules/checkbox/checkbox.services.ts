import ApiError from "../../common/utils/api-error";
import { redis } from "../../redis-connection";

const CHECKBOX_STATE_KEY = process.env.CHECKBOX_STATE_KEY!;
const CHECKBOX_SIZE = parseInt(process.env.CHECKBOX_SIZE!);

export const getState = async () => {
  const existingState = await redis.get(CHECKBOX_STATE_KEY);

  if (!existingState) throw ApiError.notFound("No state found");

  const rawData = JSON.parse(existingState);
  return rawData;
};
