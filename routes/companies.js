var express = require('express');
var router = express.Router();

var CompanyModel = require('../models/companies');

////// PAGE ENTREPRISE //////
// route affichage infos inscription entreprise
router.get('/:companyID', function (req, res, next) {
    let token = req.query.token;

    if (!token) {
        res.json({ result: false });
    } else {
        // Récupération dinfos inscription entreprise :
        // FROM FRONT : companyID
        // FROM DB TO FRONT dans {company} : ttes infos collection Companies (polulate offers + labels)
        res.json({ result: true, company });
    }
});

// route envoi infos inscirption entreprise 
router.post('/', async function (req, res, next) {
    if (!req.body.companyName) {
        res.json({ result: false, message: 'company info missing' });
    } else {
        let company = await CompanyModel.findOne({
            companyName: req.body.companyName
        });
        if (!company) {
            console.log(req.body);
            let newCompany = new CompanyModel({
                companyName: req.body.companyName,
                address: req.body.address ? req.body.address : '',
                siret: req.body.siret ? req.body.siret : ''
            });
            let companySaved = await newCompany.save();
            res.json({ result: true, company: companySaved });
        } else {
            res.json({ result: false, message: 'company already exists' })
        }
    }
});

// route rajout infos page entreprise 
router.put('/:companyID', function (req, res, next) {
    let token = req.body.token;

    if (!token) {
        res.json({ result: false });
    } else {
        // Modif des infos création page entreprise
        // infos modifiables depuis front :
        // FROM FRONT : companyID
        // FROM FRONT : image / description (main avec affichage en mode short) / labelID / offerID
        res.json({ result: true });
    }
});

module.exports = router;