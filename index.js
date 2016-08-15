var express = require('express');
var request = require('request');
var bodyParser = require('body-parser')
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// renders the main index page for the app
app.get('/', function(req, res) {
  res.render('pages/index');
});

// renders the success page after a succesfull API call has been made
app.get('/success', function(req, res) {
  res.render('pages/success');
});

// renders the skills page that is used for creating skills on the account
app.get('/createSkills', function(req, res) {
  res.render('pages/skills');
});

// renders the users page that is used for creating users on the account
app.get('/createUsers', function(req, res) {
  res.render('pages/user');
});

// renders the update users page that is used for updating users on the account
app.get('/updateUsers', function(req, res) {
  res.render('pages/updateUser');
});

// calls the Users API for LiveEngage, uses the API keys and settings from the CSV file that was uploaded on the create users page of the App
app.post('/createUsersAPI', function(req, res) {
	var tempconsumerkey = req.body.consumerKey;
    var tempconsumersecret = req.body.consumerSecret;
    var temptoken = req.body.accessToken;
    var temptokenSecret = req.body.accessTokenSecret;
    var tempaccountNum = req.body.accountNum;
    var tempresults = req.body.results;

    var oauth = {
        consumer_key: tempconsumerkey,
        consumer_secret: tempconsumersecret,
        token: temptoken,
        token_secret: temptokenSecret
    };
    var skillData = {};
    var urlBaseURI = 'https://api.liveperson.net/api/account/'+tempaccountNum+'/service/accountConfigReadWrite/baseURI.json?version=1.0';
	request.get({
	    url: urlBaseURI,
	    json: true
	}, function (e, r, b) {
		if (!e && r.statusCode == 200) {
	      var url = 'https://'+b.baseURI+'/api/account/'+tempaccountNum+'/configuration/le-users/skills?v=1';
	    	request.get({
			    url: url,
			    oauth: oauth,
			    json: true,
			    headers: {
			        'Content-Type': 'application/json'
			    }
			}, function (e2, r2, b2) {
				if (!e2 && r2.statusCode == 200) {
					for(var j = 0; j < b2.length; j++){
						skillData[b2[j].name] = b2[j].id;
					}
					//loop through temp results and update skills with ids
					var userBody = JSON.parse(tempresults);
					for(var k = 0; k < userBody.length; k++){
						for(var l = 0; l < userBody[k].skillIds.length; l++){
							if(typeof userBody[k].skillIds[l] === "string"){
								if(skillData.hasOwnProperty(userBody[k].skillIds[l])){
									userBody[k].skillIds[l] = skillData[userBody[k].skillIds[l]];
								}
							}
						}
					}
					//create the users
					var urlCreate = 'https://'+b.baseURI+'/api/account/'+tempaccountNum+'/configuration/le-users/users?v=1';
			    	request.post({
					    url: urlCreate,
					    oauth: oauth,
					    body: userBody,
					    json: true,
					    headers: {
					        'Content-Type': 'application/json'
					    }
					}, function (e3, r3, b3) {
						if (!e3 && r3.statusCode == 201) {
							res.render('pages/success');
						}
						else{
							res.json(b3);
						}
					});
					//end create users
				}
				else{
					res.json(b2);
				}
			});
	    }
	    else {
	    	res.json(b);
	    }
	});
});

// calls the Users API for LiveEngage, users the API keys and settings from the CSV file that was uploaded on the update users page of the App
app.post('/updateUsersAPI', function(req, res) {
	var tempconsumerkey = req.body.consumerKey;
    var tempconsumersecret = req.body.consumerSecret;
    var temptoken = req.body.accessToken;
    var temptokenSecret = req.body.accessTokenSecret;
    var tempaccountNum = req.body.accountNum;
    var tempresults = req.body.results;

    var oauth = {
        consumer_key: tempconsumerkey,
        consumer_secret: tempconsumersecret,
        token: temptoken,
        token_secret: temptokenSecret
    };
    var skillData = {};
    var urlBaseURI = 'https://api.liveperson.net/api/account/'+tempaccountNum+'/service/accountConfigReadWrite/baseURI.json?version=1.0';
	request.get({
	    url: urlBaseURI,
	    json: true
	}, function (e, r, b) {
		if (!e && r.statusCode == 200) {
	    	var url = 'https://'+b.baseURI+'/api/account/configuration/le-users/users/query';
	    	var qs = {"type":2,"parameters":[{"site": tempaccountNum},{"site": tempaccountNum}]};
	    	request.post({
			    url: url,
			    oauth: oauth,
			    body: qs,
			    json: true,
			    headers: {
			        'Content-Type': 'application/json'
			    }
			}, function (e2, r2, b2) {
				if (!e2 && r2.statusCode == 200) {
					var url = 'https://'+b.baseURI+'/api/account/'+tempaccountNum+'/configuration/le-users/skills?v=1';
			    	request.get({
					    url: url,
					    oauth: oauth,
					    json: true,
					    headers: {
					        'Content-Type': 'application/json'
					    }
					}, function (e3, r3, b3) {
						if (!e3 && r3.statusCode == 200) {
							for(var j = 0; j < b3.length; j++){
								skillData[b3[j].name] = b3[j].id;
							}
							//loop through temp results and update skills with ids
							var userBody = JSON.parse(tempresults);
							for(var k = 0; k < userBody.length; k++){
								for(var l = 0; l < userBody[k].skillIds.length; l++){
									if(typeof userBody[k].skillIds[l] === "string"){
										if(skillData.hasOwnProperty(userBody[k].skillIds[l])){
											userBody[k].skillIds[l] = skillData[userBody[k].skillIds[l]];
										}
									}
								}
							}
							var updateUserURL = 'https://'+b.baseURI+'/api/account/'+tempaccountNum+'/configuration/le-users/users';
							request.put({
							    url: updateUserURL,
							    oauth: oauth,
							    body: userBody,
							    json: true,
							    headers: {
							        'Content-Type': 'application/json',
							        'If-Match': b2[0].revision
							    }
							}, function (e4, r4, b4) {
								if (!e4 && r4.statusCode == 200) {
									res.render('pages/success');
								}
								else{
									res.json(b4);
								}
							});
						}
						else {
							console.log(2);
							res.json(b3);
						}
					});
			    }
			    else {
			    	console.log(3);
			    	res.json(b2);
			    }
			});
	    }
	    else {
	    	console.log(4);
	    	res.json(b);
	    }
	});
});

// calls the Skills API for LiveEngage, uses the API keys and setting from the CSV file that was uploaded on the create skills page of the App
app.post('/createSkillsAPI', function(req, res) {
	var tempconsumerkey = req.body.consumerKey;
    var tempconsumersecret = req.body.consumerSecret;
    var temptoken = req.body.accessToken;
    var temptokenSecret = req.body.accessTokenSecret;
    var tempaccountNum = req.body.accountNum;
    var tempresults = req.body.results;

    var oauth = {
        consumer_key: tempconsumerkey,
        consumer_secret: tempconsumersecret,
        token: temptoken,
        token_secret: temptokenSecret
    };

    var urlBaseURI = 'https://api.liveperson.net/api/account/'+tempaccountNum+'/service/accountConfigReadWrite/baseURI.json?version=1.0';
	request.get({
	    url: urlBaseURI,
	    json: true
	}, function (e, r, b) {
		if (!e && r.statusCode == 200) {
	      var url = 'https://'+b.baseURI+'/api/account/'+tempaccountNum+'/configuration/le-users/skills?v=1';
	    	request.post({
			    url: url,
			    oauth: oauth,
			    body: JSON.parse(tempresults),
			    json: true,
			    headers: {
			        'Content-Type': 'application/json'
			    }
			}, function (e2, r2, b2) {
				if (!e2 && r2.statusCode == 201) {
					res.render('pages/success');
				}
				else{
					res.json(b2);
				}
			});
	    }
	    else {
	    	res.json(b);
	    }
	});
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});