export class ApiRequestError extends Error {
  messages: string[];

  constructor(messages: string[], fallbackMessage = "Request failed") {
    const normalizedMessages = normalizeMessages(messages);
    super(normalizedMessages[0] || fallbackMessage);
    this.name = "ApiRequestError";
    this.messages = normalizedMessages.length ? normalizedMessages : [fallbackMessage];
  }
}

const GENERIC_ERROR_MESSAGES = new Set([
  "multiple errors occurred, see details below.",
  "multiple errors occurred. see details below.",
  "multiple errors occurred",
  "one or more validation errors occurred.",
  "the request is invalid.",
  "request failed",
]);

const formatFieldLabel = (key: string) =>
  key
    .replace(/^_+|_+$/g, "")
    .replace(/[_\-.]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();

const prefixFieldMessage = (key: string, message: string) => {
  const label = formatFieldLabel(key);
  if (!label) return message.trim();

  const normalizedMessage = message.trim();
  if (!normalizedMessage) return "";

  return normalizedMessage.toLowerCase().startsWith(label.toLowerCase())
    ? normalizedMessage
    : `${label}: ${normalizedMessage}`;
};

const collectFieldMessages = (value: unknown): string[] => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];

  return Object.entries(value as Record<string, unknown>).flatMap(([key, entryValue]) =>
    collectMessages(entryValue).map((message) => prefixFieldMessage(key, message)),
  );
};

const collectMessages = (value: unknown): string[] => {
  if (!value) return [];

  if (typeof value === "string") {
    const message = value.trim();
    return message ? [message] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectMessages(item));
  }

  if (typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;
  const directFields = [
    record.message,
    record.error_description,
    record.description,
    record.detail,
    record.title,
  ];

  const nestedFields = [
    record.error,
    record.errors,
    record.details,
    record.errordetails,
    record.innererror,
    record.ModelState,
  ];

  return [
    ...directFields,
    ...nestedFields,
    ...collectFieldMessages(record.errors),
    ...collectFieldMessages(record.ModelState),
  ].flatMap((item) => collectMessages(item));
};

export const normalizeMessages = (messages: string[]) =>
  [...new Set(messages.map((message) => message.trim()).filter(Boolean))];

export const prioritizeApiErrorMessages = (messages: string[]) => {
  const normalized = normalizeMessages(messages);
  const detailed = normalized.filter(
    (message) => !GENERIC_ERROR_MESSAGES.has(message.toLowerCase()),
  );

  return detailed.length ? [...detailed, ...normalized.filter((message) => !detailed.includes(message))] : normalized;
};

export const extractApiErrorMessages = (
  payload: unknown,
  fallbackMessage = "Request failed",
) => {
  const messages = prioritizeApiErrorMessages(collectMessages(payload));
  return messages.length ? messages : [fallbackMessage];
};

export const parseApiErrorResponse = async (
  response: Response,
  fallbackMessage = "Request failed",
) => {
  const payload = await response.json().catch(() => null);
  return extractApiErrorMessages(payload, fallbackMessage);
};
