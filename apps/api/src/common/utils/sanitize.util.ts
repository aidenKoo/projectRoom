const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/g;
const SCRIPT_TAG_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const HTML_TAG_REGEX = /<\/?[^>]+(>|$)/g;

const shouldBypass = (value: any): boolean => {
  if (!value) {
    return false;
  }

  return (
    typeof Buffer !== "undefined" &&
    typeof Buffer.from === "function" &&
    Buffer.isBuffer(value)
  );
};

const sanitizeString = (value: string): string => {
  if (value.length === 0) {
    return value;
  }

  const trimmed = value.trim();
  const withoutControlChars = trimmed.replace(CONTROL_CHARS_REGEX, "");
  const withoutScripts = withoutControlChars.replace(SCRIPT_TAG_REGEX, "");

  return withoutScripts.replace(HTML_TAG_REGEX, "");
};

export const sanitizeInput = <T>(input: T): T => {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === "string") {
    return sanitizeString(input) as unknown as T;
  }

  if (typeof input !== "object") {
    return input;
  }

  if (input instanceof Date || shouldBypass(input)) {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeInput(item)) as unknown as T;
  }

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(input as Record<string, any>)) {
    sanitized[key] = sanitizeInput(value);
  }

  return sanitized as T;
};
