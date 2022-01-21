var express = require("express");
var router = express.Router();

var UserModel = require("../models/users");
// const userModel = require("../models/users");

var bcrypt = require("bcrypt");
var uid2 = require("uid2");

var uniqid = require("uniqid");
var fs = require("fs");

var cloudinary = require("cloudinary").v2;
// const { stringify } = require("querystring");

cloudinary.config({
  cloud_name: "djlnzwuj2",
  api_key: "657221472726422",
  api_secret: "_9NiMZQkKdOIXM-GQqpAzrYu6TE",
});

////// USER //////

// route create user depuis page register :
router.post("/", async function (req, res, next) {
// console.log("req.body /users");
// console.log(req.body);
  if (!req.body.email || !req.body.password) {
    res.json({ result: false, message: "info missing" }); // si il n'y a pas d'email ou de password : on renvoie ce message
  } else {
    let user = await UserModel.findOne({ // si ok, on cherche le user avec ce password
      email: req.body.email,
    });
    if (!user) { // si pas de user qui existe : on créé un documetn user :
// console.log(req.body);
      let token = uid2(32);
      let newUser = new UserModel({
        email: req.body.email.toLowerCase(),
        password: bcrypt.hashSync(req.body.password, 10),
        token: token,
        type: req.body.type ? req.body.type : "",
        firstName: req.body.firstName ? req.body.firstName : "",
        lastName: req.body.lastName ? req.body.lastName : "",
        role: req.body.role ? req.body.role : "",
        phone: req.body.phone ? req.body.phone : "",
        avatar: req.body.avatar ? req.body.avatar : "",
        companyId: req.body.companyId ? req.body.companyId : "",
      });
      let userSaved = await newUser.save();
      res.json({ result: true, user: userSaved }); // et on renvoie ce nouvel user
    } else {
      res.json({ result: false, message: "email already exists" }); // si un user existe déjà avec ce password : on renvoie ce message
    }
  }
});

// route connexion user depuis page login
router.post("/connect", async function (req, res, next) {
  // on récupère le user lié au mail entré  :
  let user = await UserModel.findOne({
    email: req.body.email.toLowerCase(),
  });

  if (user) { // si user exist :
    if (bcrypt.compareSync(req.body.password, user.password)) { // on hash le password entrée pour le comparer au hash de la DB
      res.json({ result: true, user }); // si password ok : on renvoie le user
    } else {
      res.json({ result: false, message: "password incorrect" }); // si password pas ok : on renvoie le message 
    }
  } else {
    res.json({ result: false, message: "user not found" }); // si user n'existe pas : on renvoie ce message
  }
});

// route chargement avatar depuis page register & userprofil :
router.post("/avatar", async function (req, res, next) {
// console.log(req.files);
  // création d'une adresse de stockage dans un dossier temporaire + avec création d'un nom de fichier unique :
  var imagePath = "./tmp/" + uniqid() + ".jpg";
  //récupère le fichier photo envoyé du front et le stocke au format jpg sous le nom et à l'endroit indiqué grâce à la ligne du dessus :
  var resultCopy = await req.files.avatar.mv(imagePath); // attente de savoir si le déplacement de l’image venant du front s’est bien passé : si oui resultCopy = vide donc false

  if (!resultCopy) { // si upload ok : répond null, donc false. Donc condition ici : si tout s'est bien passé = true => !resultCopy
    // alors upload dans cloudinary :
    var resultCloudinary = await cloudinary.uploader.upload(imagePath);
// console.log(resultCloudinary);
    if (resultCloudinary.url) {
      //si ça a bien été uploadé, suppression du fichier photo du dossier temporaire :
      fs.unlinkSync(imagePath);
      res.json({ // si tout ok : renvoie cet objet au front
        result: true,
        message: "image uploaded",
        url: resultCloudinary.url,
      });
    }
  } else {
    res.json({ result: false, message: resultCopy }); // resultCopy = message disant que ça n’a pas marché ( = true)
  }
});

// route modification donnée user depuis page userprofile :
router.put("/updateuserdata", async function (req, res, next) {
  var token = req.body.token;
// console.log("token stringigy", token);
  // on récupère & update les données liées au user du front :
  var updateUser = await UserModel.findOneAndUpdate(
    { token: token },
    {
      $set: {
        avatar: req.body.avatar,
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        role: req.body.role
      }
    }
  );

  if (updateUser) { // si on a bien un user updaté : on récupère ses nouvelles données via son token :
    var userData = await UserModel.findOne({ token: token });
// console.log(userData);
    res.json({ result: true, userData }); // et alors on renvoie ses nouvelles données
  } else {
    res.json({ result: false });
  }
});

//Route pour récuperer les infos du user à l'ouverture de l'app avec le localstorage depuis page welcome :
router.post("/getUserData", async function (req, res, next) {
  var token = req.body.token;
// console.log("token", token);
  // on récupère les données du user grâce à son token :
  var user = await UserModel.findOne({ token: token });
  if (user) {
    res.json({ result: true, user }); // si un user a été trouvé on renvoie ses données
  } else {
    res.json({ result: false });
  }
});

module.exports = router;
