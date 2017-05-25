/*
============================================================================================
File: app.js
Developer: Fredrik Lautrup
Created Date: Sometime in 2014

Description:
The app uses node.js and express.js to create a lightweight web
server for testing the ticketing authentication method in Qlik Sense Enterprise Server.

WARNING!:
This code is intended for testing and demonstration purposes only.  It is not meant for
production environments.  In addition, the code is not supported by Qlik.

Change Log
Developer                       Change Description                          Modify Date
--------------------------------------------------------------------------------------------
Fredrik Lautrup                 Initial Release                             circa Q4 2014
Jeffrey Goldberg                Updated for Expressjs v4.x                  01-June-2015
Fredrik Lautrup                 Added external config file                  03-November-2015
Steve Newman                    Updated Logout method and iframe support    07-January-2016

--------------------------------------------------------------------------------------------
============================================================================================
*/

var config = require('./config');
var express = require('express');
var app = express();

var https = require('https');
var http = require('http');
var fs = require('fs');
var url = require('url');

var session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var querystring = require("querystring");
var crypto = require('crypto');
var path = require('path');
var router = require('./app/http/routes.js');

//set the port for the listener here
app.set('port', config.port);
// create application/json parser
app.use(bodyParser.json());
// create application/x-www-form-urlencoded parser
app.use(bodyParser.urlencoded({ extended: false }));

//new Expressjs 4.x notation for configuring other middleware components
app.use(session({ resave: true, saveUninitialized: true, secret: config.sessionSecret}));
app.use(cookieParser('Test'));
app.set('views', path.join(__dirname, 'resource/views'));
app.set('view engine', 'ejs');

router(app);

function logout(req, res, selectedUser, userDirectory) {
	
	//Configure parameters for the ticket request
    var xrfkey = generateXrfkey();
	
    //Configure parameters for the logout request
    var options = {
        host: url.parse(req.session.RESTURI).hostname,
        port: url.parse(req.session.RESTURI).port,
        path: url.parse(req.session.RESTURI).path+'/user/'+userDirectory.toString()+'/' + selectedUser.toString() + '?xrfkey=' + xrfkey,
        method: 'DELETE',
        headers: { 
			'X-qlik-xrfkey': xrfkey, 
			'Content-Type': 'application/json' 
		},
		pfx: fs.readFileSync('client.pfx'),
		passphrase: config.certificateConfig.passphrase,
		rejectUnauthorized: false,
        agent: false
    };

    console.log("Path:", options.path.toString());
    //Send request to get logged out
    var ticketreq = https.request(options, function (ticketres) {
        console.log("statusCode: ", ticketres.statusCode);
        //console.log("headers: ", ticketres.headers);

        ticketres.on('data', function (d) {
			console.log(selectedUser, " is logged out");
            console.log("DELETE Response:", d.toString());
			
            redirectURI = '/';

            console.log("Logout redirect:", redirectURI);
            res.redirect(redirectURI);
        });
    });

    //Send request to logout
    ticketreq.end();

    ticketreq.on('error', function (e) {
        console.error('Error' + e);
    });
};

//Server options to run an HTTPS server
var httpsoptions = {
    pfx: fs.readFileSync('server.pfx'),
    passphrase: config.certificateConfig.passphrase
};

//Start listener https
var server = https.createServer(httpsoptions, app);

server.listen(app.get('port'), () => {
  console.log("Listen port " + app.get('port'));
});