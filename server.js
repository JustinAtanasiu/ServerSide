var nano = require('nano')('http://localhost:5984');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var jwt = require('jsonwebtoken'); 
var config = require('./config');


var persAssist = nano.db.use('personalassistant');
var port = 8080;

app.set('superSecret', config.secret); 

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(morgan('dev'));

app.get('/', function(req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});

app.listen(port);
console.log('Connected at http://localhost:' + port);

var apiRoutes = express.Router();
 
apiRoutes.get('/', function(req, res) {
  res.json({ message: 'Welcome to Syblium API on earth!' });
});

// route to return all users (GET http://localhost:8080/api/users)
apiRoutes.get('/users', function (req, res) {
    persAssist.list({include_docs: true}, function (err, response) {
        res.json(response.rows);
    });
});   
apiRoutes.post('/signUp', function (req, res) {
    
    // create a sample user
    var data = req.body;
    res.send('Added:' + data);
    // save the sample user
    persAssist.insert(data, function (err, body) {
        if (!err) {
            //awesome
        }
        console.log('User saved successfully');
    });
}); 
// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);
