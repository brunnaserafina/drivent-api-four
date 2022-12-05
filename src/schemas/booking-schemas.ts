import Joi from "joi";

export const bookingBodySchema = Joi.object<{ roomId: number }>({
  roomId: Joi.number().integer().positive().required(),
});

export const bookingParamsSchema = Joi.object<{ bookingId: number }>({
  bookingId: Joi.number().integer().positive().required(),
});
