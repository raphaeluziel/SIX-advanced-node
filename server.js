'use strict';

const routes = require('./routes.js');
const auth = require('./auth.js');

const express       = require('express');
const bodyParser    = require('body-parser');
const mongo         = require('mongodb').MongoClient;
const bcrypt        = require('bcrypt');
const fccTesting    = require('./freeCodeCamp/fcctesting.js');

const app = express();

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));

// Body parser takes in post request and puts it into req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set view engine to pug
app.set('view engine', 'pug');

// Connect database
mongo.connect(process.env.DATABASE, { useNewUrlParser: true }, (err, client) => {
  
  // This is new for mongo, so it is different in the fcc challenge
  var db = client.db('db-six');
  
  if(err) {console.log('Database error: ' + err);}
  else {
    console.log('Successful database connection');
    
    // Once database is connected, call modules:
    // auth must be called before routes!
    auth(app, db);
    routes(app, db);

    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port " + process.env.PORT);
    });    
  }
});