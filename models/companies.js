var mongoose = require("mongoose"); // utilisation de Mongoose

// création du schema du sous-document Offices :
var officeSchema = mongoose.Schema({
  address: String,
  city: String,
  postalCode: String,
  country: String,
  officeName: String,
  phone: String
});

// creation du schema Companies :
var companySchema = mongoose.Schema({
  siret: String,
  companyName: String,
  logo: String,
  type: String,
  description: String,
  shortDescription: String,
  website: String,
  companyImage: String,
  labels: [{ type: mongoose.Schema.Types.ObjectId, ref: "labels" }], // tableau d'objets de clés étrangère : stocke les Id des Labels
  offers: [{ type: mongoose.Schema.Types.ObjectId, ref: "offers" }], // idem avec collection Offers
  offices: [officeSchema] // tableau (car plusieurs offices possibles) contenant le sous-document Offices
});

var companyModel = mongoose.model("companies", companySchema); // creation du companyModel dans la collection Companies avec le companySchema

module.exports = companyModel; // export du model
