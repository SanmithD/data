import {
  createTimelineDetail,
  getTimelineDetail,
  updateTimelineDetail,
  deleteTimelineDetail,
} from "../repositories/timelineDetailRepository.js";

import { uploadImage } from "../utils/uploadToCloudinary.js";
import sharp from "sharp";

/**
 * CREATE
 */
export const createDetail = async (req, res) => {
  try {
    const { timelineId, image, note } = req.body;

    let uploadedImage = {};

    if (image && image.startsWith("data:image")) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const optimizedBuffer = await sharp(buffer)
        .resize(1200, 800)
        .jpeg({ quality: 85 })
        .toBuffer();

      const processedBase64 = `data:image/jpeg;base64,${optimizedBuffer.toString(
        "base64",
      )}`;

      uploadedImage = await uploadImage(processedBase64, "timeline");
    }

    const detail = await createTimelineDetail({
      timelineId,
      image: uploadedImage,
      note,
    });

    res.status(201).json({
      success: true,
      data: detail,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * GET
 */
export const getDetail = async (req, res) => {
  try {
    const { timelineId } = req.params;

    const detail = await getTimelineDetail(Number(timelineId));

    res.status(200).json({
      success: true,
      data: detail,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * UPDATE
 */
export const updateDetail = async (req, res) => {
  try {
    const { timelineId } = req.params;
    const { image, note } = req.body;

    let updatedData = { note };

    if (image && image.startsWith("data:image")) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const optimizedBuffer = await sharp(buffer)
        .resize(1200, 800)
        .jpeg({ quality: 85 })
        .toBuffer();

      const processedBase64 = `data:image/jpeg;base64,${optimizedBuffer.toString(
        "base64",
      )}`;

      const uploaded = await uploadImage(processedBase64, "timeline");

      updatedData.image = uploaded;
    }

    const updated = await updateTimelineDetail(Number(timelineId), updatedData);

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * DELETE
 */
export const deleteDetail = async (req, res) => {
  try {
    const { timelineId } = req.params;

    await deleteTimelineDetail(Number(timelineId));

    res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
