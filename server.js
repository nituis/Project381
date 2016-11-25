var express = require('express');
var session = require('cookie-session');
var bodyParser = require('body-parser');
var app = express();

app = express();

var SECRETKEY1 = 'I want to pass COMPS381F';
var SECRETKEY2 = 'Keep this to yourself';

var users = new Array(
	{name: 'developer', password: 'developer'},
	{name: 'guest', password: 'guest'}
);

app.set('view engine','ejs');

app.use(session({
  name: 'session',
  keys: [SECRETKEY1,SECRETKEY2]
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

app.get('/',function(req,res) {
	console.log(req.session);
	if (!req.session.authenticated) {
		res.redirect('/api/login');
	}
	res.status(200).end('Hello, ' + req.session.username +
	  '!  This is a secret page!');
});

app.get('/api/login',function(req,res) {
	res.sendFile(__dirname + '/login_register.ejs');
	//res.render("login_register.ejs", {username: "admin", pw: 0});
});

app.post('/api/login',function(req,res) {
	for (var i=0; i<users.length; i++) {
		if (users[i].name == req.body.name &&
		    users[i].password == req.body.password) {
			req.session.authenticated = true;
			req.session.username = users[i].name;
		}
	}
	res.redirect('/api/read');
});

app.get('/api/read', function(req, res){
	if (req.query != null){
		if (req.query.name != null){
			
		} else if (req.query.name != null){
			
		} else if (req.query.name != null){
			
		} else {
			//res.render("list.ejs", req.session, c);
		}
	}
	console.log(req);
});

app.post('/api/create', function(req, res){
	

});

app.get('/api/register', function(req, res){

});

app.get('/logout',function(req,res) {
	req.session = null;
	res.redirect('/');
});

app.listen(process.env.PORT || 8099);
