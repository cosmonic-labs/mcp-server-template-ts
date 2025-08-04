import { Env, Context } from "hono";
import { HTTPException } from "hono/http-exception";

function handleError<E extends Env = Env>(
  err: unknown,
  ctx: Context<E>,
): Response {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  if (ctx.req.header("Content-Type") === "application/json") {
    return ctx.json({ error: "Internal Server Error" }, 500);
  }

  return ctx.text("Internal Server Error", 500);
}

export { handleError };
