import Booking from "../models/booking.js";
import Resource from "../models/resource.js";
import { sendBookingConfirmedEmail } from "../services/emailService.js";
import {
  createBookingForUser,
  hasBookingConflict,
} from "../services/bookingService.js";
import { parseBookingRequestWithGemini } from "../services/geminiService.js";
import {
  normalizeFeatureList,
  normalizeResourceType,
} from "../services/resourceNormalizationService.js";
import { emitBookingsChanged } from "../socket.js";

const isWithinResourceHours = (resource, startTime, endTime) =>
  startTime >= resource.openingTime && endTime <= resource.closingTime;

const getPopularityByResourceId = async (resourceIds) => {
  if (resourceIds.length === 0) {
    return new Map();
  }

  const counts = await Booking.aggregate([
    {
      $match: {
        resource: { $in: resourceIds },
        status: "active",
      },
    },
    {
      $group: {
        _id: "$resource",
        count: { $sum: 1 },
      },
    },
  ]);

  return new Map(counts.map((item) => [String(item._id), item.count]));
};

const buildCandidate = ({ resource, parsed, popularity }) => {
  const requestedFeatures = normalizeFeatureList(parsed.features);
  const resourceFeatures = normalizeFeatureList(resource.features);
  const requestedType = normalizeResourceType(parsed.resourceType);
  const resourceType = normalizeResourceType(resource.type);
  const matchedFeatures = requestedFeatures.filter((feature) =>
    resourceFeatures.includes(feature)
  );
  const missingFeatures = requestedFeatures.filter(
    (feature) => !resourceFeatures.includes(feature)
  );
  const exactTypeMatch = !requestedType || requestedType === resourceType;
  const exactFeatureMatch = missingFeatures.length === 0;
  const capacityGap = Math.max((resource.capacity || 0) - (parsed.capacity || 0), 0);

  const score =
    (exactTypeMatch ? 1000 : 0) +
    matchedFeatures.length * 120 +
    (exactFeatureMatch ? 250 : 0) -
    capacityGap +
    popularity * 5;

  return {
    resource,
    matchedFeatures,
    missingFeatures,
    exactTypeMatch,
    exactFeatureMatch,
    capacityGap,
    popularity,
    score,
  };
};

const sortCandidates = (a, b) =>
  b.score - a.score ||
  a.capacityGap - b.capacityGap ||
  b.popularity - a.popularity ||
  a.resource.name.localeCompare(b.resource.name);

const findBestAvailableResource = async (parsed) => {
  const filters = {
    status: "active",
  };

  if (parsed.capacity > 0) {
    filters.capacity = { $gte: parsed.capacity };
  }

  const resources = await Resource.find(filters).lean();
  const eligibleResources = [];

  for (const resource of resources) {
    if (!isWithinResourceHours(resource, parsed.startTime, parsed.endTime)) {
      continue;
    }

    const isBusy = await hasBookingConflict({
      resourceId: resource._id,
      date: parsed.date,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
    });

    if (!isBusy) {
      eligibleResources.push(resource);
    }
  }

  if (eligibleResources.length === 0) {
    return null;
  }

  const popularityByResourceId = await getPopularityByResourceId(
    eligibleResources.map((resource) => resource._id)
  );

  const candidates = eligibleResources
    .map((resource) =>
      buildCandidate({
        resource,
        parsed,
        popularity: popularityByResourceId.get(String(resource._id)) || 0,
      })
    )
    .sort(sortCandidates);

  const exactCandidates = candidates.filter(
    (candidate) => candidate.exactTypeMatch && candidate.exactFeatureMatch
  );

  return exactCandidates[0] || candidates[0];
};

const buildReply = (candidate) => {
  const { resource, missingFeatures, exactTypeMatch } = candidate;
  const featuresText = resource.features?.length
    ? ` - Features: ${resource.features.join(", ")}`
    : "";

  if (missingFeatures.length > 0 || !exactTypeMatch) {
    const notes = [
      !exactTypeMatch ? `room type differs from the request (${resource.type})` : "",
      missingFeatures.length > 0 ? `missing features: ${missingFeatures.join(", ")}` : "",
    ].filter(Boolean);

    return `No exact match was available. Closest available match found: ${resource.name} - Capacity ${resource.capacity}${featuresText}. ${notes.join("; ")}. Do you want to confirm this booking?`;
  }

  return `Best available match found: ${resource.name} - Capacity ${resource.capacity}${featuresText}. Do you want to confirm this booking?`;
};

export const getAiBookingSuggestion = async (req, res) => {
  try {
    const { message, timezone = "UTC" } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: "Booking request is required" });
    }

    const parsed = await parseBookingRequestWithGemini({
      message,
      timezone,
    });

    if (
      parsed.needsClarification ||
      !parsed.date ||
      !parsed.startTime ||
      !parsed.endTime
    ) {
      return res.json({
        status: "clarification_needed",
        parsed,
        reply:
          parsed.clarificationMessage ||
          "I need a little more detail before I can search. Please include the date and time.",
      });
    }

    const bestMatch = await findBestAvailableResource(parsed);

    if (!bestMatch) {
      return res.json({
        status: "no_match",
        parsed,
        reply:
          "I could not find an available resource that fits the required capacity and time window. Try another time or a smaller group size.",
      });
    }

    const { resource } = bestMatch;

    return res.json({
      status:
        bestMatch.exactTypeMatch && bestMatch.exactFeatureMatch
          ? "match_found"
          : "closest_match_found",
      parsed,
      bestMatch: {
        resourceId: resource._id,
        name: resource.name,
        type: resource.type,
        capacity: resource.capacity,
        features: resource.features || [],
        date: parsed.date,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        popularity: bestMatch.popularity,
        matchedFeatures: bestMatch.matchedFeatures,
        missingFeatures: bestMatch.missingFeatures,
        exactTypeMatch: bestMatch.exactTypeMatch,
      },
      reply: buildReply(bestMatch),
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const confirmAiBooking = async (req, res) => {
  try {
    const { resourceId, date, startTime, endTime } = req.body;

    if (!resourceId || !date || !startTime || !endTime) {
      return res.status(400).json({ message: "Missing booking details" });
    }

    const { booking, resourceDoc } = await createBookingForUser({
      userId: req.user._id,
      resourceId,
      date,
      startTime,
      endTime,
    });
    emitBookingsChanged("created");

    try {
      await sendBookingConfirmedEmail({
        to: req.user.email,
        userName: req.user.name,
        resourceName: resourceDoc.name,
        date,
        startTime,
        endTime,
        bookingId: booking._id,
      });
    } catch (emailError) {
      console.error("SendGrid booking confirmation failed:", emailError?.message || emailError);
    }

    res.status(201).json({
      message: "Booking confirmed",
      booking,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};
