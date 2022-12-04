import { ApplicationError } from "@/protocols";

export function forbiddenError(): ApplicationError {
  return {
    name: "ForbiddenError",
    message: "You dont have permission to access the resource!",
  };
}
