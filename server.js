var nano = require('nano')('http://localhost:5984');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var jwt = require('jsonwebtoken'); 
var config = require('./config');


var test_db = nano.db.use('personalassistant');
var port = 8080;

app.set('superSecret', config.secret); 

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(morgan('dev'));

app.get('/', function(req, res) {
    res.send('Hello! The API is at http://localhost:' + port + '/api');
});

app.listen(port);
console.log('Connected at http://localhost:' + port);

app.get('/signUp', function (req, res) {
    debugger;
    // create a sample user
    var data = {
        name: 'pikachu',
        skills: ['thunder bolt', 'iron tail', 'quick attack', 'mega punch'],
        type: 'electric'
    };
aaaaaaaaaaaa
    // save the sample user
    test_db.insert(data, function (err, body) {
        if (!err) {
            //awesome
        }
        console.log('User saved successfully');
    });
});