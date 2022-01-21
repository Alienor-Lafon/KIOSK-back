var mongoose = require("mongoose"); // utilisation de Mongoose

// création du schema : 
var ratingSchema = mongoose.Schema({
    title: String,
    feedback: String,
    rating: Number,
    dateRating: Date,
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "companies" }, // clé étrangère permettant de récupérer l'Id de l'entreprise pour laquelle on travaille en tant que client
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: "companies" }, // clé étrangère permettant de récupérer l'Id de l'entreprise pour laquelle on travaille en tant que prestataire
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "users" } // // clé étrangère permettant de récupérer l'Id de mon profil personnel
});
var ratingModel = mongoose.model("ratings", ratingSchema); // creation du ratingModel dans la collection Ratings avec le ratingSchema

module.exports = ratingModel; // exort du model