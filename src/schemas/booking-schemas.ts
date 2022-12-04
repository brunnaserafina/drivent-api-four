import Joi from "joi";

export const bookingBodySchema = Joi.object<{ roomId: number }>({
  roomId: Joi.number().integer().positive().required(),
});
