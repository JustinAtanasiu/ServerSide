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
 
// route to return all users (GET http://localhost:8080/api/users)
apiRoutes.get('/users', function (req, res) {
    persAssist.list({include_docs: true}, function (err, response) {
        res.json(response.rows);
    });
});  
 
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
    persAssist.list({include_docs: true}, function (err, response) {
        (response.rows).forEach(function(element) {
            if(element.doc.username === req.body.username){
                res.send({status:400});
            }
        }, this);        
        res.send({status:200});
    });
});
// apply the routes to our application with the prefix /api
app.use('/api', apiRoutes);
