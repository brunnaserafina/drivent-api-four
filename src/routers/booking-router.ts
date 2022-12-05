import { Router } from "express";
import { authenticateToken, validateBody, validateParams } from "@/middlewares";
import { getBooking, postBooking, updateBooking } from "@/controllers";
import { bookingBodySchema, bookingParamsSchema } from "@/schemas";

const bookingRouter = Router();

bookingRouter
  .all("/*", authenticateToken)
  .get("/", getBooking)
  .post("/", validateBody(bookingBodySchema), postBooking)
  .put("/:bookingId", validateParams(bookingParamsSchema), validateBody(bookingBodySchema), updateBooking);

export { bookingRouter };
