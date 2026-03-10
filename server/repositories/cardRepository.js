// repositories/cardRepository.js

import Card from "../models/Card.js";

class CardRepository {

  async createCard(data) {
    return await Card.create(data);
  }

  async addSubCard(parentId, childId) {
    return await Card.findByIdAndUpdate(
      parentId,
      { $push: { subCards: childId } },
      { new: true }
    );
  }

  async getCards(page, limit) {
    const skip = (page - 1) * limit;

    return await Card.find({ parentCard: null })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
  }

  async getCardById(id) {
    return await Card.findById(id);
  }

  async getChildCards(cardId, page, limit) {
    const skip = (page - 1) * limit;

    return await Card.aggregate([
      { $match: { _id: new Card.Types.ObjectId(cardId) } },
      {
        $lookup: {
          from: "cards",
          localField: "subCards",
          foreignField: "_id",
          as: "children"
        }
      },
      {
        $project: {
          children: { $slice: ["$children", skip, limit] }
        }
      }
    ]);
  }

  async updateCard(id, data) {
    return await Card.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteCard(id) {
    return await Card.findByIdAndDelete(id);
  }
}

export default new CardRepository();