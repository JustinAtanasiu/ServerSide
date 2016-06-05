var config = require('./config');
var express = require('express');
var app = express();
app.set('superSecret', config.secret); 
app.set('database', config.database);
app.set('dbSecret', config.dbSecret);
var nano = require('nano')('http://'+app.get('database') + ':' + app.get('dbSecret') + '@localhost:5984');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var jwt = require('jsonwebtoken'); 
var http = require('http');
var https = require('https');
var crypto = require('crypto');

var persAssist = nano.db.use('personalassistant');
var port = 8080;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(morgan('dev'));

app.get('/', function(req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});

app.listen(port);
console.log('Connected at http://localhost:' + port);

var apiRoutes = express.Router();

apiRoutes.post('/signUp', function (req, res) { 
    var data = req.body;
    res.send('Added:' + data);
    persAssist.insert(data, function (err, body) {
        if (!err) {
        }
        console.log('User saved successfully');
    });
}); 

apiRoutes.post('/checkUsers', function (req, res) {
    var testUsername = false;
    persAssist.list({ include_docs: true }, function (err, response) {
        if (response && response.rows)
            (response.rows).forEach(function (element) {
                if (element.doc.username === req.body.username) {
                    res.send({ status: 400 });
                    testUsername = true;
                }
            }, this);
        if (!testUsername)
            res.send({ status: 200 });
    });
});

apiRoutes.post('/authenticate', function (req, res) { 
   persAssist.list({include_docs: true}, function (err, response) {
       var foundUser = false;
       if (response && response.rows){
           response.rows.forEach(function (element) {
               if (element.doc.username === req.body.username && element.doc.password === req.body.password) {
                   foundUser = element.doc;
               }
           }, this);
       }
       else{
           res.json({
               success: false,
               status: 503
           });
           return false;
       }
       if (foundUser) {
           var token = jwt.sign({id: foundUser._id}, app.get('superSecret'), {
               expiresIn: 86400 // expires in 24 hours
           });

           // return the information including token as JSON
           res.json({
               success: true,
               message: 'Enjoy your token!',
               token: token,
               id: foundUser._id
           });
       }
       else{
            res.json({
               success: false,
               status: 404
           });
       }
    });
}); 

apiRoutes.use(function(req, res, next) {

  // check header or url parameters or post parameters for token
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  // decode token
  if (token) {

    // verifies secret and checks exp
    jwt.verify(token, app.get('superSecret'), function(err, decoded) {      
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });    
      } else {
        // if everything is good, save to request for use in other routes
        req.decoded = decoded;    
        next();
      }
    });

  } else {

    // if there is no token
    // return an error
    return res.status(403).send({ 
        success: false, 
        message: 'No token provided.' 
    });
    
  }
});
 
apiRoutes.get('/users', function (req, res) {
    persAssist.list({include_docs: true}, function (err, response) {
        //all users
    });
});

apiRoutes.post('/location', function (req, res) {
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    var body = '';
    http.get('http://nominatim.openstreetmap.org/reverse?email=justin.atanasiu@gmail.com&format=json&lat=' + latitude + '&lon=' + longitude, function (resp) {
        resp.on('data', function (chunk) {
            body += chunk;
        });

        resp.on('end', function () {
            var fbResponse = JSON.parse(body);
            res.send(fbResponse);
        });
    }).on('error', function (e) {
        console.log("Got error: " + e.message);
    });
});

apiRoutes.post('/weather', function (req, res) {
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    var body = '';
    https.get('https://api.forecast.io/forecast/2d4d24f3d98fd833669ca7ccd52a18bd/' + latitude + ',' + longitude + '?units=si', function (resp) {
        resp.on('data', function (chunk) {
            body += chunk;
        });

        resp.on('end', function () {
            var fbResponse = JSON.parse(body);
            res.send(fbResponse);
        });
    }).on('error', function (e) {
        console.log("Got error: " + e.message);
    });
});        

apiRoutes.get('/getInfo/:id', function (req, res) { 
    var id = req.url.split("/")[2];
    persAssist.get(id, function (err, body) {
        if (!err) {
        }
        delete body.password;
        delete body.username;
        res.send(body);
        console.log('User saved successfully');
    });
}); 

apiRoutes.post('/saveInfo/:id', function (req, res) {
    var id = req.url.split("/")[2]; persAssist.get(id, function (err, bodyTwo) {
        if (!err) {
        }
        req.body.password = bodyTwo.password;
        req.body.username = bodyTwo.username;
        persAssist.insert(req.body, id, function (err, body) {
            if (!err)
                console.log(body)
        });
    });
    
});

// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);
