'use strict';

var config = require('../../config');
var controller = require('./controllers/MainController');

module.exports = function(app){

	app.get('/', function (req, res) {
		//Store targetId and RESTURI in a session
		(typeof(req.query.proxyRestUri) == 'undefined' || req.query.proxyRestUri === null) ? req.session.RESTURI = config.RESTURI : req.session.RESTURI = req.query.proxyRestUri;

		(typeof(req.query.proxyRestUri) == 'undefined' || req.query.proxyRestUri === null) ? req.session.targetId = config.REDIRECT : req.session.targetId = req.query.targetId;
		
		req.session.RESTURI= 'https://analytics.periplia.com:4243/qps/custom/';
		console.log('RESTURI', req.session.RESTURI);
		console.log('targetId', req.session.targetId);
		
		res.render('index');
	});

	app.get('/logout', function (req, res) {
		var selectedUser = req.query.selectedUser;
		var userDirectory = req.query.userDirectory;
		console.log("Logout user: "+selectedUser+" directory: "+userDirectory);

		logout(req,res,selectedUser,userDirectory);
		req.session.destroy();
	});

	app.get('/login', function (req, res) {
		var selectedUser = req.query.selectedUser;
		var userDirectory = req.query.userDirectory;
		
		console.log("Login User: ", selectedUser, " Directory: ",userDirectory);

		controller.requestticket(req, res, selectedUser, userDirectory, req.session.RESTURI, req.session.targetId);
		req.session.destroy();
	});
		
	/*app.post('/ticket', function (req, res) {
		var userId = req.body.userId;
		var userDirectory = req.body.userDirectory;
		var RESTURI =  req.body.proxyRestUri;
		var targetId = req.body.targetId;
		
		controller.getTicket(req, res, userId, userDirectory, RESTURI, targetId);
	});*/
	
	/*
	app.get("/resource/font", function (req, res) {
		res.sendfile('qlikview-sans.svg');
	});

	app.get("/resource/icon", function (req, res) {
		res.sendfile("users.png");
	});

	app.get("/resource/qv", function (req, res) {
		res.sendfile("QlikLogo-RGB.png");
	});

	app.get("/resource/background", function (req, res) {
		res.sendfile("ConnectingCircles-01.png");
	});
	*/
}