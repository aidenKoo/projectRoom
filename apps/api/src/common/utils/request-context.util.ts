import { Request } from "express";

interface RequestContext {
  ip?: string;
  requestId?: string;
  userAgent?: string;
}

export const extractRequestContext = (req: Request): RequestContext => {
  const forwardedFor = req.headers["x-forwarded-for"] as string | undefined;
  const rawIp = forwardedFor
    ? forwardedFor.split(",")[0]?.trim()
    : req.ip;

  const requestId = (req.headers["x-request-id"] as string | undefined)?.trim();
  const userAgent = (req.headers["user-agent"] as string | undefined)?.trim();

  return {
    ip: rawIp || undefined,
    requestId: requestId || undefined,
    userAgent: userAgent || undefined,
  };
};
