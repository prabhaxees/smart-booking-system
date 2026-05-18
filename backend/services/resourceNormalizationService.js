const RESOURCE_TYPE_ALIASES = {
  lab: "lab",
  laboratory: "lab",
  "computer lab": "lab",
  "science lab": "lab",
  room: "room",
  classroom: "room",
  "meeting room": "room",
  "conference room": "room",
  hall: "hall",
  auditorium: "hall",
  "seminar hall": "hall",
};

export const normalizeResourceType = (value = "") => {
  const normalized = String(value).trim().toLowerCase();
  return RESOURCE_TYPE_ALIASES[normalized] || normalized;
};

export const normalizeFeatureList = (features = []) => {
  if (!Array.isArray(features)) {
    return [];
  }

  return [...new Set(
    features
      .map((feature) => String(feature).trim().toLowerCase())
      .filter(Boolean)
  )];
};
