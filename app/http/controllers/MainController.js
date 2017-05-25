'use strict';

var config = require('../../../config');
var crypto = require('crypto');
var https = require('https');
var fs = require('fs');
var url = require('url');
var querystring = require("querystring");

function generateXrfkey(size, chars) {
	size = size || 16;
	chars = chars || 'abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789';
	var rnd = crypto.randomBytes(size), value = new Array(size), len = chars.length;
	for (var i = 0; i < size; i++) {
		value[i] = chars[rnd[i] % len]
	};
	return value.join('');
}

function requestticket(req, res, selecteduser, userdirectory, RESTURI, targetId) {
	//Get and verify parameters
	config.certificateConfig.passphrase = config.certificateConfig.passphrase || '';
		
	//Configure parameters for the ticket request
    var xrfkey = generateXrfkey();
	
    //Configure parameters for the ticket request
    var options = {
        host: url.parse(RESTURI).hostname,
        port: url.parse(RESTURI).port,
        path: url.parse(RESTURI).path + '/ticket?xrfkey='+xrfkey,
        method: 'POST',
        headers: { 
			'X-qlik-xrfkey': xrfkey, 
			'Content-Type': 'application/json' 
		},
		pfx: fs.readFileSync('client.pfx'),
		passphrase: config.certificateConfig.passphrase,
		//requestCert: true,
		rejectUnauthorized: false,
        agent: false
    };
	console.log('Options', options);
			
    //Send ticket request
    var ticketreq = https.request(options, function (ticketres) {
		
		console.log("statusCode: ", ticketres.statusCode);
		console.log("statusMessage: ", ticketres.statusMessage);
		// 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
		// No client certificate supplied!
		if(parseInt(ticketres.statusCode) != 403){
			
			ticketres.on('data', function (d) {
				//Parse ticket response
				console.log(" is logged in", selecteduser);
				console.log("POST Response:", d.toString());
				var ticket = JSON.parse(d.toString());
				console.log("POST Response User:", ticket.UserId);								
				// Add the QlikTicket to the redirect URL regardless whether the existing REDIRECT has existing params.
				console.log("REDIRECT: ",config.REDIRECT);
				console.log("targetId: ",targetId);
				var myRedirect = url.parse(config.REDIRECT);
				
				var myQueryString = querystring.parse(myRedirect.query);
				myQueryString['QlikTicket'] = ticket.Ticket; 

				var redirectURI = '/?selecteduser='+ selecteduser;

				//This replaces the existing REDIRECT querystring with the one with the QlikTicket.			
				if (typeof(myRedirect.query) == 'undefined' || myRedirect.query === null) {
					console.log("Si");
					// valido el usuario para mostrar el iframe
					if(selecteduser == ticket.UserId){
						console.log("Si");
						redirectURI += '&redirect='+ querystring.escape(myRedirect.href + '?' + querystring.stringify(myQueryString));
					}
				} else {
					console.log("No");
					redirectURI += '&redirect='+ querystring.escape(myRedirect.href.replace(myRedirect.query, querystring.stringify(myQueryString)));
				}			

				console.log("Login redirect:", redirectURI);
				res.redirect(redirectURI);
			});
		}
		
    });
	
    //Send JSON request for ticket
    var jsonrequest = JSON.stringify({ 
		'UserDirectory': userdirectory.toString() , 
		'UserId': selecteduser.toString(), 
		'Attributes': [] 
	});

    ticketreq.write(jsonrequest);
    ticketreq.end();

    ticketreq.on('error', function (e) {
        console.error('Error' + e);
    });
};


module.exports = {
	requestticket
};