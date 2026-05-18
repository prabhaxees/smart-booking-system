import Resource from "../models/resource.js";
import {
  normalizeFeatureList,
  normalizeResourceType,
} from "../services/resourceNormalizationService.js";

export const createResource = async (req, res) => {
  try {
    const resource = await Resource.create({
      ...req.body,
      type: normalizeResourceType(req.body.type),
      features: normalizeFeatureList(req.body.features),
    });
    res.status(201).json(resource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getResources = async (req, res) => {
  try {
    const resources = await Resource.find();
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        type: normalizeResourceType(req.body.type),
        features: normalizeFeatureList(req.body.features),
      },
      { new: true, runValidators: true }
    );

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.json(resource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.json({ message: "Resource deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
