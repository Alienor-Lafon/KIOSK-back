var express = require("express");
var router = express.Router();

var OfferModel = require("../models/offers");
var CompanyModel = require("../models/companies");
var UserModel = require("../models/users");

////// OFFERS //////
// route affichage infos offres
router.get("/:offerId/:token", async function (req, res, next) {
  let token = req.params.token;
// console.log("route offers");
  if (!token) {
    res.json({ result: false });
  } else {
    var offer = await OfferModel.findById(req.params.offerId);
// console.log("req.params.offerId", req.params.offerId);
    var company = await CompanyModel.findOne({
      offers: offer._id,
    });
// console.log("company", company);
    res.json({ result: true, offer, company });
  }
});

// route envoi infos création offres
router.post("/", async function (req, res, next) {
  let token = req.body.token;

  if (!token) {
    res.json({ result: false });
  } else {
    if (!req.body.offerName) {
      res.json({ result: false, message: "offer info missing" });
    } else {
// console.log(req.body);
      let newOffer = new OfferModel({
        offerName: req.body.offerName,
      });
      let offerSaved = await newOffer.save();
      res.json({ result: true, offer: offerSaved });
    }
  }
});

// route modif infos offres
router.put("/:offerId/", async function (req, res, next) {
  let token = req.body.token;

  if (!token) {
    res.json({ result: false });
  } else {
    var offer = await OfferModel.findById(req.params.offerId);
// console.log(offer);
    if (req.body.image) {
      offer.offerImage = req.body.image;
    }
    if (req.body.description) {
      offer.description = req.body.description;
      offer.shortDescription = req.body.description;
    }
    if (req.body.commitment) {
      offer.commitments.push({ commitment: req.body.commitment });
    }
    if (req.body.commitmentId) {
      offer.commitments = offer.commitments.filter(
        (e) => e.id !== req.body.commitmentId
      );
    }
    await offer.save();
    var offer = await OfferModel.findById(req.params.offerId);
    res.json({ result: true, offer });
  }
});

// route delete offres
router.delete("/:offerId", function (req, res, next) {
  let token = req.query.token;

  if (!token) {
    res.json({ result: false });
  } else {
    // Suppression d'une offre
    res.json({ result: true });
  }
});


// route to like an offer
router.post("/like", async function (req, res, next) {
  let token = req.body.token;
  if (!token) {
    res.json({ result: false });
  } else {
    var user = await UserModel.findById(req.body.userId);
    if(req.body.offerId) {
      if(user.favorites.some(e => e.offerId && e.offerId == req.body.offerId)) {
        user.favorites = user.favorites.filter(e => e.companyId || ( e.offerId && e.offerId != req.body.offerId ));
      } else {
        user.favorites.push({ offerId: req.body.offerId });
      }
    }
    await user.save();
    user = await UserModel.findById(req.body.userId);
    res.json({ result: true, user });
  }
});

module.exports = router;
