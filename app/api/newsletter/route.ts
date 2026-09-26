import { addNewsletterSignup } from "@/lib/queries";
function result(request: Request, message: string, status: number) {
  if (request.headers.get("content-type")?.includes("application/json"))
    return Response.json(status < 400 ? { message } : { error: message }, {
      status,
    });
  return new Response(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Spotlight Newsletter · ALUNSINA NEWS</title><body><main><h1>Spotlight Newsletter</h1><p>${message}</p><a href="/#newsletter">Return to the edition</a></main></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
export async function POST(request: Request) {
  let email: unknown;
  try {
    email = request.headers.get("content-type")?.includes("application/json")
      ? (await request.json()).email
      : (await request.formData()).get("email");
  } catch {
    return result(request, "Enter a valid email address.", 400);
  }
  if (
    typeof email !== "string" ||
    email.trim().length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  )
    return result(request, "Enter a valid email address.", 400);
  try {
    await addNewsletterSignup(email);
    return result(
      request,
      "Signup recorded. Email delivery is not active yet.",
      201,
    );
  } catch {
    return result(
      request,
      "Unable to record your signup. Please try again.",
      500,
    );
  }
}
