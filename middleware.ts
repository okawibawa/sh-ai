import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const rateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(50, "60s"),
  analytics: true,
});

export async function middleware(
  request: NextRequest,
  context: NextFetchEvent,
) {
  const identifier = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const response = NextResponse.next();

  if (request.method !== "POST") {
    return response;
  }

  const { success, pending, limit, remaining } =
    await rateLimit.limit(identifier);

  context.waitUntil(pending);

  if (!success) {
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Exceeded", "true");
    return response;
  }

  response.headers.set("X-RateLimit-Limit", limit.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());

  return response;
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico|public).*)",
};
