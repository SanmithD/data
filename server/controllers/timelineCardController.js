import timelineCardRepository from "../repositories/timelineCardRepository.js";
import sharp from "sharp";
import { uploadImage } from "../utils/uploadToCloudinary.js";

export const createTimelineCard = async (req, res) => {
  try {
    const { timeline, image, note } = req.body;

    if (!timeline) {
      return res.status(400).json({ error: "Timeline is required" });
    }

    let uploadedImage = { url: "", public_id: "" };

    // ✅ Handle image (same as before)
    if (image && image.startsWith("data:image")) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const optimizedBuffer = await sharp(buffer)
        .resize(1200, 800)
        .jpeg({ quality: 85 })
        .toBuffer();

      const processedBase64 = `data:image/jpeg;base64,${optimizedBuffer.toString(
        "base64"
      )}`;

      uploadedImage = await uploadImage(processedBase64, "timeline");
    }

    // ✅ Pass everything to repo
    const newCard = await timelineCardRepository.createCard({
      timeline,
      image: uploadedImage,
      note: note || "",
    });

    res.status(201).json(newCard);
  } catch (error) {
    console.error("Create TimelineCard error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all TimelineCards (no pagination, simple)
 */
export const getTimelineCards = async (req, res) => {
  try {
    const cards = await timelineCardRepository.getAllCards();
    res.json(cards);
  } catch (error) {
    console.error("Get TimelineCards error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get a single TimelineCard by ID
 */
export const getTimelineCardById = async (req, res) => {
  try {
    const card = await timelineCardRepository.getCardById(req.params.id);

    if (!card) {
      return res.status(404).json({ error: "TimelineCard not found" });
    }

    res.json(card);
  } catch (error) {
    console.error("Get TimelineCard error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update a TimelineCard
 */
export const updateTimelineCard = async (req, res) => {
  try {
    const { timeline, image, note } = req.body;

    if (!timeline) {
      return res.status(400).json({ error: "Timeline is required" });
    }

    let uploadedImage = undefined;

    // ✅ Handle image upload
    if (image && image.startsWith("data:image")) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      const optimizedBuffer = await sharp(buffer)
        .resize(1200, 800)
        .jpeg({ quality: 85 })
        .toBuffer();

      const processedBase64 = `data:image/jpeg;base64,${optimizedBuffer.toString(
        "base64"
      )}`;

      uploadedImage = await uploadImage(processedBase64, "timeline");
    }

    const updateData = {
      timeline,
      note,
    };

    // ✅ only update image if provided
    if (uploadedImage) {
      updateData.image = uploadedImage;
    }

    const updatedCard = await timelineCardRepository.updateCard(
      req.params.id,
      updateData
    );

    if (!updatedCard) {
      return res.status(404).json({ error: "TimelineCard not found" });
    }

    res.json(updatedCard);
  } catch (error) {
    console.error("Update TimelineCard error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete a TimelineCard
 */
export const deleteTimelineCard = async (req, res) => {
  try {
    const deletedCard = await timelineCardRepository.deleteCard(req.params.id);

    if (!deletedCard) {
      return res.status(404).json({ error: "TimelineCard not found" });
    }

    res.json({ message: "TimelineCard deleted" });
  } catch (error) {
    console.error("Delete TimelineCard error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update card positions after drag-and-drop
export const reorderTimeCards = async (req, res) => {
  try {
    const { updatedOrder } = req.body;
    // updatedOrder = [{ id: "mongoId1", position: 1 }, { id: "mongoId2", position: 2 }, ...]

    if (!Array.isArray(updatedOrder)) {
      return res.status(400).json({ error: "Invalid order format" });
    }

    // Use repository function to bulk update positions
    await timelineCardRepository.updateTimeCardPositions(updatedOrder);

    res.json({ success: true });
  } catch (error) {
    console.error("Reorder cards error:", error);
    res.status(500).json({ error: error.message });
  }
};