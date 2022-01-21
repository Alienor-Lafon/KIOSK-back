var mongoose = require('mongoose');  // utilisation de Mongoose
import { REACT_APP_APIMONGO } from '@env'; // imort de la clé API Mongo depuis le dotenv

var options = {
    connectTimeoutMS: 5000,
    useNewUrlParser: true,
    useUnifiedTopology : true
}

// connexion à la DB Mongo de KIOSK
mongoose.connect(`mongodb+srv://${REACT_APP_APIMONGO}`, 
    options,
    function(err) {
        console.log(err);
    }
);