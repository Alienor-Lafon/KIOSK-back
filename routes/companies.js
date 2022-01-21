var express = require("express");
var router = express.Router();

// utilisation des models
var CompanyModel = require("../models/companies");
var OfferModel = require("../models/offers");
var UserModel = require("../models/users");
var RatingModel = require("../models/ratings");

// gestion de l'upload des images
var uniqid = require("uniqid");
var fs = require("fs");
var cloudinary = require("cloudinary").v2;

////// PAGE PROFIL ENTREPRISE //////

// route pour récupérer les informations du profil :
router.get("/profile/:token/:companyId", async function (req, res, next) { //récupère token et companyId du front, dans l'ordre
  var token = req.params.token
  var companyId = req.params.companyId

  if (!token) {
    res.json({ result: false });
  } else {
    // on récupère l'Id de la company dont on veut afficher le profil :
    var company = await CompanyModel.findById(companyId)
    // préparation des informations récupérées des la DB à renvoyer au front pour qu'elles soient affichées automatiquement dans les input :
    var siret = company.siret
    var companyName = company.companyName
    var logo = company.logo
    res.json({ result: true, siret, companyName, logo }); //  renvoie des ces 3 variables au front
  }
});

// route pour ajouter un logo :
router.post("/logo", async function (req, res, next) {
// console.log(req.files);
  // création d'une adresse de stockage dans un dossier temporaire + avec création d'un nom de fichier unique :
  var imagePath = "./tmp/" + uniqid() + ".jpg";
  //récupère le fichier photo envoyé du front et le stocke au format jpg sous le nom et à l'endroit indiqué grâce à la ligne du dessus :
  var resultCopy = await req.files.logo.mv(imagePath); // attente de savoir si le déplacement de l’image venant du front s’est bien passé : si oui resultCopy = vide donc false

  if (!resultCopy) { // si upload ok : répond null, donc false. Donc condition ici : si tout s'est bien passé = true => !resultCopy
    // alors upload dans cloudinary :
    var resultCloudinary = await cloudinary.uploader.upload(imagePath);
// console.log(resultCloudinary);
    if (resultCloudinary.url) {
      //si ça a bien été uploadé, suppression du fichier photo du dossier temporaire :
      fs.unlinkSync(imagePath);
      res.json({
        result: true,
        message: "image uploaded",
        url: resultCloudinary.url,
      });
    }
  } else {
    res.json({ result: false, message: resultCopy }); // resultCopy = message disant que ça n’a pas marché ( = true)
  }
  res.json({ result: true}) // si tout ok : renvoie juste True au front
});

// route pour modifier les informations du profil :
router.put("/update-company", async function (req, res, next) {
  var token = req.body.token;

  if (!token) {
    res.json({ result: false });
  } else {
    var newSiret = req.body.siret
    //cherche par id et modifie les informations de la company correspondante dans la collection companies en base de données.
    var updateCompany = await CompanyModel.findOneAndUpdate({_id: req.body.companyId }, {
      $set:{
      siret: newSiret,
      companyName: req.body.companyName,
      logo: req.body.logo,
      }
    }
    );
// console.log("update",updateCompany)
    if (updateCompany) {
      res.json({ result: true, updateCompany });
    } else {
      res.json({ result: false });
    }
  }
});

////// ** PAGE ENTREPRISE //////

// route affichage infos inscription entreprise :
router.get("/all/:token", async function (req, res, next) {
  let token = req.params.token;
// console.log("companyiD", req.params.token, req.params.companyId);

  if (!token) {
    res.json({ result: false });
  } else {
    // pour afffichage random de la company mise en avant dans la HomePage :
    var companies = await CompanyModel.find({ type: "partner" }, { _id: 1 });
    var companies = companies.map(company => company._id);
//console.log("company", company.labels);
//console.log("company", company);
    res.json({ result: true, companies });
  }
});

// ** route affichage infos entreprise :
router.get("/:companyId/:token", async function (req, res, next) {
  let token = req.params.token;
// console.log("companyiD", req.params.token, req.params.companyId);

  if (!token) {
    res.json({ result: false });
  } else {
    // récupération des données de l'entreprise à afficher, avec ses labels et ses offres :
    var company = await CompanyModel.findById(req.params.companyId)
      .populate("labels") // on rajoute à la récupération des données de la company, les données de la collectioni Labels, via l'appel à la clé labels dans le schema company
      .populate("offers") // idema avec offers
      .exec();
    // on récupère les évaluations du prestataire / provider :
    var ratings = await RatingModel.find({ providerId: req.params.companyId })
      .populate("clientId") // pour afficher entreprise de l'utilisateur qui a noté le provider
      .exec();
//console.log("company", company.labels);
//console.log("company", company);
    res.json({ result: true, company, ratings });
  }
});

// route envoi infos inscirption entreprise :
router.post("/", async function (req, res, next) {
  if (!req.body.companyName) {
    res.json({ result: false, message: "company info missing" });
  } else {
    let company = await CompanyModel.findOne({
      companyName: req.body.companyName,
    });
    if (!company) {
//console.log(req.body);
      let newCompany = new CompanyModel({
        companyName: req.body.companyName,
        address: req.body.address ? req.body.address : "",
        siret: req.body.siret ? req.body.siret : "",
        type: req.body.type ? req.body.type : "",
      });
      let companySaved = await newCompany.save();
      res.json({ result: true, company: companySaved });
    } else {
      res.json({ result: false, message: "company already exists" });
    }
  }
});

// ** route rajout infos + labels page entreprise :
router.put("/:companyId", async function (req, res, next) {
  let token = req.body.token;

  if (!token) {
    res.json({ result: false });
  } else { 
    // recupération data de la company à modifier :
    var dataCie = await CompanyModel.findOne({ _id: req.params.companyId });
// console.log("dataCie", dataCie)

    // modification des labels :
    if (req.body.labelId) {
      // on check si le label a deja ete ajouté :
      const labelFound = dataCie.labels.filter((label) => label._id == req.body.labelId); // on compare chaque label de la companie avec le label du req.body : si un label est identique, il sera renvoyé dans un nouveau tableau
      labelFound.length === 0 && dataCie.labels.push(req.body.labelId); // si il n'a pas été trouvé / le tableau est vide = on l'ajoute
    };

    // modification des la description : 
    if (req.body.description) {
      dataCie.description = req.body.description;
      dataCie.shortDescription = req.body.description;
    };

    // modification des offres :
    let offerSaved;
    if (req.body.offerName) {
      let newOffer = new OfferModel({
        // création nouvelle offre avec d'abord juste un nom :
        offerName: req.body.offerName,
      });
      offerSaved = await newOffer.save();
      // on rajoute la nouvelle offre via son id dans le document de la company :
      dataCie.offers.push(offerSaved._id);
    };

    // modification de l'image associée à l'entreprise sur sa page public :
    if (req.body.image) {
      dataCie.companyImage = req.body.image;
    };

// console.log("dataCie", dataCie)
    await dataCie.save();

    // récupération des nouvelles données de la company, y compris les labels et les offres :
    var dataCieFull = await CompanyModel.findOne({ _id: req.params.companyId })
      .populate("labels")
      .populate("offers")
      .exec();
// console.log("dataCieFull", dataCieFull)
// console.log("dataCie", dataCie);
    res.json({ result: true, dataCieFull, offerSaved });
  }
});

// ** route suppression labels sur page company filled :
router.put("/labels/:companyId/:labelId", async function (req, res, next) {
  // update du document de la company en y enlevant le label sélectionné :
  await CompanyModel.updateOne(
    { _id: req.params.companyId },
    { $pull: { labels: req.params.labelId } }
  );
  var dataLabelsCieUpdated = await CompanyModel.findOne({_id: req.params.companyId })
    .populate("labels")
    .populate("offers")
    .exec();

  res.json({ result: true, dataLabelsCieUpdated });
});

// route to like a company
router.post("/like", async function (req, res, next) {
  let token = req.body.token;

  if (!token) {
    res.json({ result: false });
  } else {
    var user = await UserModel.findById(req.body.userId);
    if (req.body.companyId) {
      if (user.favorites.some(e => e.companyId && e.companyId == req.body.companyId)) { // some teste voir si au moins un élément du tableau (user.favorites) passe le test, et renvoie un booleen du résultat du test
        user.favorites = user.favorites.filter(e => e.offerId || (e.companyId && e.companyId != req.body.companyId)); // filter renvoie un tableau avec les éléments qui remplissent la condition ()
      } else {
        user.favorites.push({ companyId: req.body.companyId });
      }
    }
    await user.save();
    user = await UserModel.findById(req.body.userId);
    res.json({ result: true, user });
  }
});



module.exports = router;
