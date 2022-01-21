var express = require("express");
var router = express.Router();

// utilisation du model
var ratingModel = require('../models/ratings');


// route récupération infos company pour affichage company card :
router.get('/:companyId/:token', async function (req, res, next) {
    let token = req.params.token;
    if (!token) {
        res.json({ result: false });
    } else {
        // réacupération des évaluations de la company évaluée + infos du user qui a noté + de son entreprise :
        var ratings = await ratingModel.find()
            .populate("userId")
            .populate("clientId")
            .exec();
// console.log("ratings", ratings);
        // calcul de la note moyenne du prestataire :
        var avg = await ratingModel.aggregate([{$group: {
            _id : "$providerId",
            averageNoteByCie: { $avg: "$rating" }
        }}]);
    res.json({ result: true, ratings, avg });
    }
});

// route création un nouveau rating :
router.post("/:token", async function (req, res, next) {
    let token = req.params.token;
    if (!token) {
        res.json({ result: false });
    } else {
        let newRating = new ratingModel({
            feedback: req.body.feedback,
            rating: req.body.rating,
            dateRating: req.body.dateRating,
            clientId: req.body.clientId,
            providerId: req.body.providerId,
            userId: req.body.userId
    })
    let newRatingSaved = await newRating.save();
// console.log("newRatingSaved", newRatingSaved);
    res.json({ result: true, newRatingSaved });
    }
});

module.exports = router;