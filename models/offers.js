var mongoose = require("mongoose");

var questionSchema = mongoose.Schema({
  questions: String,
  placeholder: String
});

var commitmentSchema = mongoose.Schema({
  commitment: String
});

var offerSchema = mongoose.Schema({
  offerName: String,
  offerImage: String,
  description: String,
  shortDescription: String,
  commitments: [commitmentSchema],
  categoriyId: { type: mongoose.Schema.Types.ObjectId, ref: "categories" },
  subCategoriyId: { type: mongoose.Schema.Types.ObjectId, ref: "categories" },
  questions: [questionSchema]
});

var OfferModel = mongoose.model("offers", offerSchema);

module.exports = OfferModel;
