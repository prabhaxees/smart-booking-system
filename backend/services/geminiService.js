import { normalizeFeatureList, normalizeResourceType } from "./resourceNormalizationService.js";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const getGeminiApiKey = () => process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

const BOOKING_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    resourceType: { type: "string" },
    capacity: { type: "integer" },
    date: { type: "string" },
    startTime: { type: "string" },
    endTime: { type: "string" },
    features: {
      type: "array",
      items: { type: "string" },
    },
    confidence: { type: "number" },
    needsClarification: { type: "boolean" },
    clarificationMessage: { type: "string" },
  },
  required: [
    "resourceType",
    "capacity",
    "date",
    "startTime",
    "endTime",
    "features",
    "confidence",
    "needsClarification",
    "clarificationMessage",
  ],
};

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const formatTodayForTimezone = (timezone) => {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" }).format(new Date());
  }
};

const normalizeParsedBooking = (parsed) => {
  const capacity = Number.isFinite(Number(parsed.capacity))
    ? Math.max(Number.parseInt(parsed.capacity, 10), 0)
    : 0;
  const date = DATE_PATTERN.test(parsed.date || "") ? parsed.date : "";
  const startTime = TIME_PATTERN.test(parsed.startTime || "") ? parsed.startTime : "";
  const endTime = TIME_PATTERN.test(parsed.endTime || "") ? parsed.endTime : "";

  return {
    resourceType: normalizeResourceType(parsed.resourceType),
    capacity,
    date,
    startTime,
    endTime,
    features: normalizeFeatureList(parsed.features),
    confidence: Number(parsed.confidence) || 0,
    needsClarification: Boolean(parsed.needsClarification),
    clarificationMessage: String(parsed.clarificationMessage || ""),
  };
};

export const parseBookingRequestWithGemini = async ({
  message,
  timezone = "UTC",
}) => {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    const error = new Error("GEMINI_API_KEY or GOOGLE_API_KEY is not configured");
    error.statusCode = 500;
    throw error;
  }

  const today = formatTodayForTimezone(timezone);

  const prompt = `
You are an extraction engine for a resource booking platform.
Today is ${today}.
User timezone is ${timezone}.

Extract booking details from the user's message.

Rules:
- Convert relative dates like "tomorrow" into YYYY-MM-DD using today's date and timezone.
- Convert times to 24-hour HH:MM.
- If the user does not give an end time, assume a 1 hour duration.
- Normalize resourceType to one of: "lab", "room", "hall" when possible, otherwise "".
- Normalize features to lowercase words like ["projector", "ac", "whiteboard"].
- If the user does not provide a required detail for booking, set needsClarification to true.
- confidence must be a number from 0 to 1.

User message:
${message}
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseJsonSchema: BOOKING_RESPONSE_SCHEMA,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`Gemini request failed: ${errorText}`);
    error.statusCode = 502;
    throw error;
  }

  const data = await response.json();
  const text =
    data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") ||
    "";

  if (!text) {
    const error = new Error("Gemini response did not contain booking details");
    error.statusCode = 502;
    throw error;
  }

  return normalizeParsedBooking(JSON.parse(text));
};
