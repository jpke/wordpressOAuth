var express = require('express')
var passport = require('passport')
var mongoose = require('mongoose');
var User = require('./User');
var WordpressStrategy = require('passport-wordpress').Strategy;
var app = express()
var unirest = require('unirest');

require("dotenv").config({silent: true});

var CLIENT_ID = process.env.CLIENT_ID;
var CLIENT_SECRET = process.env.CLIENT_SECRET;
var CALLBACK_URL = process.env.CALLBACK_URL;
var DATABASE_URI = process.env.DATABASE_URI;


passport.use(new WordpressStrategy({
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    callbackURL: CALLBACK_URL
  },
  function(accessToken, refreshToken, profile, done) {
    console.log("wordpress profile: ", profile, "accessToken: ", accessToken);
    User.find({WordpressId: profile.id}).exec()
    .then(function(user) {
      if(user) {
        return done(null, user);
      } else {
        user = new User();
        user.WordpressId = profile.id,
        user.accessToken = accessToken
        user.save().exec()
        .then(function(user) {
          return done(null, user);
        })
      }
    })
    .catch(function(err) {
      done(err, null)
    });
  }
));

app.use(passport.initialize());

app.get('/auth/wordpress',
  // passport.authorize('wordpress'));
  function(req, res) {
    res.redirect(`https://public-api.wordpress.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${CALLBACK_URL}&response_type=code&scope=auth`)
  }
)

app.get('/auth/wordpress/callback',
  passport.authorize('wordpress', { failureRedirect: '/login' }),
  function(req, res) {
    console.log("req.user: ", req.query.code);
    unirest.post('https://public-api.wordpress.com/oauth2/token')
    .send(`client_id=${CLIENT_ID}`)
    .send('grant_type=authorization_code')
    .send(`client_secret=${CLIENT_SECRET}`)
    .send(`redirect_uri=${CALLBACK_URL}`)
    .send(`code=od)REEV9KZx2IyBgD&nU@AzOcMPmui54idw^q3dKF&j4G0dpSXD$a)n)z2ZRCDdK`)
    .end(function(response) {
      console.log("auth code response: ", response.raw_body);
      res.redirect('/');
    })
    // Successful authentication, redirect home.
    // res.redirect('/');
  });

app.get('/', function (req, res) {
  res.send('Hello Authenticated World!')
})

app.get('/login', function (req, res) {
  res.send('You must login!')
})

// unirest.post('https://public-api.wordpress.com/oauth2/token-info?client_id')

mongoose.Promise = global.Promise;
mongoose.connect(process.env.DATABASE_URI || 'mongodb://<database name>').then(function() {
  var PORT = process.env.PORT || 8080
  app.listen(PORT)
  console.log("Server is listening on ", PORT)
  // var data = [{data: 1, name: 'JP'}, {data: 2, name: 'Ray'}]
  // console.log(prettyjson.render(data))
}).catch(function(error) {
  console.log("Server error: ", error)
})
