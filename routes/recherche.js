var express = require("express");
var router = express.Router();

var companyModel = require("../models/companies");
var CategoryModel = require("../models/categories");
var OfferModel = require("../models/offers");
var packModel = require("../models/packs");

// route pour obtenir les categories. Dans le front on traitera le resultat pour en obtenir une liste des sous-catecories
router.get("/getcategories", async function (req, res, next) {
  var categorieList = await CategoryModel.find();
  if (categorieList) {
    res.json({ result: true, categorieList });
  } else {
    res.json({ result: false });
  }
});

//Route pour trouver une liste d'ID d'offre à partir de la bar de recherche ou des catégories/sous-categories.
router.post("/rechercheListOffer", async function (req, res, next) {
  var recherche = req.body.recherche;
  var regex = new RegExp("\\b" + recherche, "gi");
  var listOfferID;

  //On recherche d'abord par categories avec en entré non pas la regex mais la recherche entière.
  var rechercheCategorie = await CategoryModel.findOne({
    categoryName: recherche,
  });

  //Si résultat, on cherche des offres qui sont dans la categorie recherchée.
  if (rechercheCategorie) {
    listOfferID = await OfferModel.find(
      {
        categoriyId: rechercheCategorie._id,
      },
      { _id: 1 }
    );

    //A partir du résultat des offres trouvé, on garde ici seulement le champs ID pour obtenir une liste d'ID d'offre
    //qu'on passe au front qui le renverra dans la route suivante /recherche
    listOfferID = listOfferID.map((e) => e._id);
  } else {
    //si le résultat de la recherche par categorie ne donne rien, on cherche dans les sous categories
    var rechercheSousCategorie = await CategoryModel.findOne({
      "subCategories.subCategoryName": regex,
    });

    //Si résultat, on cherche des offres qui sont dans la la sous-categorie recherchée.

    if (rechercheSousCategorie) {
      var resultmapage = rechercheSousCategorie.subCategories.find(
        (e) =>
          e.subCategoryName.toLowerCase().includes(recherche.toLowerCase()) ===
          true
      );

      listOfferID = await OfferModel.find(
        {
          subCategoriyId: resultmapage._id,
        },
        { _id: 1 }
      );
      //On garde seulement le champs _id pour pour obtenir une liste d'ID d'offre
      //qu'on passe au front qui le renverra dans la route suivante /recherche
      listOfferID = listOfferID.map((e) => e._id);
    }

    //si résultat de la recherche par sous categorie ne donne rien, on cherche dans les offres
    else {
      listOfferID = await OfferModel.find(
        {
          $or: [
            { offerName: regex },
            { description: regex },
            { shortDescription: regex },
          ],
        },
        { _id: 1 }
      );

      listOfferID = listOfferID.map((e) => e._id);
    }
  }

  //recherche dans compagnie. La route fonctionne, veut-on la garder ?
  // var rechercherCompanies = await companyModel.find({
  //   $or: [
  //     { companyName: regex },
  //     { description: regex },
  //     { shortDescription: regex },
  //   ],
  // });
  //

  if (listOfferID) {
    res.json({ result: true, listOfferID });
  } else {
    res.json({ result: false });
  }
});

//Recherche les data des offres + la compagnie de chaque offre trouvé à partir d'une liste d'ID d'offre.
router.post("/recherche", async function (req, res, next) {
  var listOfferId = req.body.listOfferId;
  listOfferId = JSON.parse(listOfferId);
// console.log("listOfferId", listOfferId);

  //recherche des offre a partir d'une liste de d'ID
  offerList = await OfferModel.find({
    _id: {
      $in: listOfferId,
    },
  });

  //ajout des data de la compagnie de chaque offre.
  //Le resultat est un tableau avec à la fois l'offre et les data de la compagnie dans le même objet.
  for (let i = 0; i < offerList.length; i++) {
    var companyData = await companyModel.find({
      offers: offerList[i]._id,
    });
    offerList[i] = { ...offerList[i].toJSON() };
    offerList[i].companyData = companyData;
  }

  //renvoie de la liste offres + companyData
  if (offerList.length !== 0) {
    res.json({ result: true, offerList });
  } else {
    res.json({ result: false });
  }
});

// récupération des Packs existants :
router.get("/getPacks", async function (req, res, next) {
  var dataPack = await packModel.find();
  if (dataPack) {
    res.json({ result: true, dataPack });
  } else {
    res.json({ result: false });
  }
});

// ércupération des offres du pack sélectionné :
router.get("/getPacks/:packId", async function (req, res, next) {
  var packOffers = await packModel.findById(req.params.packId)
    .populate("offers")
    .exec();
  // console.log("packOffers", packOffers);
  if (packOffers) {
    res.json({ result: true, packOffers });
  } else {
    res.json({ result: false });
  }
});

module.exports = router;
