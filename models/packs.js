var mongoose = require('mongoose'); // utilisation de Mongoose

// création du schema :
var packSchema = mongoose.Schema({
    packName: String,
    packImage: String,
    offers: [{ type: mongoose.Schema.Types.ObjectId, ref: "offers" }] // tableau d'objets de clés étrangère : stocke les Id des Offers
});

var packModel = mongoose.model('packs', packSchema); // creation packModel dans la collection Packs avec le packSchema

module.exports = packModel; // exort du model