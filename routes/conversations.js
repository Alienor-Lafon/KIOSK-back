var express = require("express");
var router = express.Router();
var conversationModel = require("../models/conversations");
var CompanyModel = require("../models/companies");
var UserModel = require("../models/users");

////// ROUTES MESSAGES SCREEN //////
//route pour créer une conversation à partir de "contacter"
router.post("/new", async function (req, res, next) {


  //avant de créer une nouvelle conversation, il faut vérifier au préalable s'il en existe déjà une entre les deux interlocuteurs :
  var conversation = await conversationModel.findOne({
    senderID: req.body.senderId,
    receiverID: req.body.receiverId,
  });
  //si une conversation n'existe pas déjà, on en créé une nouvelle 
  if (!conversation) {
    conversation = new conversationModel({
      senderID: req.body.senderId,
      receiverID: req.body.receiverId,
    });
    conversation = await conversation.save();
  }
//sinon, il faut renvoyer la conversation trouvée au front
  res.json({ result: true, conversation });
});


//route qui affiche les conversations dans la page messagesscreen

router.get("/:companyId/:userType/:token", async function (req, res, next) {
  
  let token = req.params.token;

  if (!token) {
      res.json({ result: false });
  } else {
//fonction pour formater la date
  const dateFormat = function (date) {
    var newDate = new Date(date);
    var format =
      newDate.getDate() +
      "/" +
      (newDate.getMonth() + 1) +
      "/" +
      newDate.getFullYear();
    return format;
  };
  //on récupère l'id de l'entreprise à laquelle le user appartient car on affiche les conversations de cette entreprise
  var companyId = req.params.companyId;

  //on récupére l'entreprise à laquelle le user appartient à partir de l'id
  var senderCompany = await CompanyModel.findById(companyId);


  //on peut récupérer les conversations selon le statut de l'utilisateur. Si c'est un client alors il correspond au sender. Sinon, c'est le destinataire
  var conversations;
  if (req.params.userType == "client") {
    conversations = await conversationModel.find({ senderID: companyId });
  } else { // req.params.userType == "client"
    conversations = await conversationModel.find({ receiverID: companyId });
  }

  let conversationsToDisplay = [];

  for (var i = 0; i < conversations.length; i++) {
    //dans le front, on veut afficher les informations de l'interlocuteur pour chaque conv. Pour cela, il faut d'abord récupérer l'interlocuteur, selon le statut du user actuel. S'il s'agit d'un client alors l'interlocuteur sera forcément "receiver" puisque seul le client peut initier une conversation. Sinon, l'interlocuteur sera le sender .
    var company;
    if (req.params.userType == "client") {
      company = await CompanyModel.findById(conversations[i].receiverID);
    } else { // req.params.userType == "client"
      company = await CompanyModel.findById(conversations[i].senderID);
    }
    conversationsToDisplay.push({
      id: conversations[i].id,
      logo: company.logo ? company.logo : "",//ternaire, s'il n'y a pas de logo alors logo:""
      message:
        conversations[i].messages[conversations[i].messages.length - 1].message,//on récupère le dernier message du tableau "messages", conversations[i].messages sert à récupérer tous les messages et [conversations[i].messages.length - 1] correspond à la position du message à récupérer
      date: conversations[i].messages[conversations[i].messages.length - 1]
        .dateMessageSent
        ? dateFormat(
            conversations[i].messages[conversations[i].messages.length - 1]
              .dateMessageSent
          )
        : "",
      companyName: company.companyName,
    });
  }
  //ajout d'objets correspondant aux conversations avec toutes les informations qu'on veut afficher dans le front dans un tableau "conversations to display"

  res.json({ conversationsToDisplay });}
});

////// ROUTES CHAT SCREEN //////

// route affichage messages d'une conversation spécifique
router.get("/messages/:convId/:userId/:token", async function (req, res, next) {
    let token = req.params.token;

      if (!token) {
        res.json({ result: false });
      } else {

  // on récupère la conversation concernée grâce à son Id, cet Id est envoyé au click sur la conversation dans messages screen(voir onPress)

  var conversation = await conversationModel.findById(req.params.convId);

  //on cherche les messages à afficher
  var messagesToShow = conversation.messages;

  //on va chercher les informations des messages à afficher dans le front, reconstitués pour correspondre à la structure d'un message définie par gifted chat
  
  var messages = [];
  for (var i = 0; i < messagesToShow.length; i++) {
    //on boucle sur les messages pour récupérer le userId du propriétaire de chaque message
    var user = await UserModel.findById(messagesToShow[i].userId);
//userInfo correspond à la structure du message dans gifted chat. L'_id permet d'identifier qui a envoyé le message. La condition vérifie que si l'userId envoyé du front correspond au userId du message alors son id : 1, sinon, on renvoie le userId du front ce qui implique que ce message n'a pas été envoyé par l'user. 
    let userInfo = {
      _id:
        messagesToShow[i].userId == req.params.userId
          ? 1
          : messagesToShow[i].userId,
      name: user.firstName,
      avatar: user.avatar,
    };
    messages.push({
      text: messagesToShow[i].message,
      _id: messagesToShow[i].id,
      createdAt: messagesToShow[i].dateMessageSent,
      user: userInfo,
    });
  }

  //range les messages en affichant le plus récent en bas de la page

  var sortedMessages = messages
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt);

 
  res.json({ result: true, sortedMessages })};
  
});

// route envoi message dans la conversation
router.post("/messages", async function (req, res, next) {
  
  let token = req.body.token;

  if (!token) {
      res.json({ result: false });
  } else {
//récupère la conversation dans laquelle on veut ajouter un message
  var conversation = await conversationModel.findOneAndUpdate(
    { _id: req.body.convId },
    {
      $push: {
        messages: {
          message: req.body.message,
          dateMessageSent: req.body.date,
          userId: req.body.userId,
        },
      },
    },
    { new: true }
  );


  //code permettant de retrouver le message créé et lui assigner la structure exacte qu'on a dans le front
  var conversationToFind = await conversationModel.findById(req.body.convId);
  var messageToFind =
    conversationToFind.messages[conversationToFind.messages.length - 1];

  var user = await UserModel.findById(req.body.userId);
 
  let userInfo = {
    _id: 1,
    name: user.firstName,
    avatar: user.avatar,
  };
  var messageToSendToFront = {
    _id: messageToFind.id,
    text: messageToFind.message,
    createdAt: messageToFind.dateMessageSent,
    user: userInfo,
  };

  //messageToSendToFront permet de reconstituer le message enregistré dans la database pour que la structure corresponde à ce qui existe dans le front

  res.json({ result: true, messageToSendToFront })};
});

module.exports = router;

