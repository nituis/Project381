//SFH : rate function -> RESTful

var express = require('express');
var app = express();
var mongourl = 'mongodb://lazylook:s20071038@ds159767.mlab.com:59767/comps381f';
//mongourl = "mongodb://localhost:test:27017"
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var session = require('cookie-session');
//var mongoose = require('mongoose');
var fileUpload = require('express-fileupload');
var SECRETKEY = 'I want to pass COMPS381F';
var ObjectId = require('mongodb').ObjectId;
var bodyParser = require('body-parser');
var fn = require('./fn');


app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.use(fileUpload());
app.use(bodyParser.json());
app.use(session({
    secret: SECRETKEY,
    resave: true,
    saveUninitialized: true
}));/* 
 app.use(function (req, res, next) {
  console.log('Time:', Date.now(), req.method, req.path);
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
}); */

app.set('view engine', 'ejs');

///////////////////////////////////////////////////////////////////////////////////////////////////////
/* app.get('/', function (req, res) {
    //console.log(req.session);
    if(req.session.userid != null)
        res.redirect('/api/read');
    else
        res.redirect('/api/login'); 
}); */

/////////////////////////////////////////////////      Login & Logout
app.get('/', function (req, res) {
	if (!req.session.userid) {
		res.sendFile(__dirname + '/public/login.html');	
	} else {
		res.redirect('/api/read');
	}
});

app.post('/api/login', function (req, res) {
	if (req.body.userid != null && req.body.password != null){
		var userid = req.body.userid;
		var password = req.body.password;
		//var userInfo;
		
		MongoClient.connect(mongourl, function (err, db) {
			assert.equal(err, null);
			console.log('Connected to MongoDB\n');
			db.collection('user').findOne({userid: userid, password: password}, function (err, user) {
				/* if (err) {
					console.log(err);
					res.status(500).send();
				}
				if (!user) {
					res.status(404).send(); 
					//console.log(user != null, !user);
				}*/
				if (!user){
					res.redirect("/");
				} else {
					req.session.userid = userid;
					//userInfo = userid;
					res.redirect("/api/read");
					db.close();
					console.log('Disconnected from MongoDB\n', user, req.session.userid);
					//res.render('readpage.ejs', {userInfo: userInfo, c: ""});
				}
			});
		});
	} else {
		res.redirect("/");
	}
});

app.get('/api/logout', function (req, res) {
    req.session = null;
    res.redirect('/');
});

/////////////////////////////////////////////////      Register
app.get('/api/register', function (req, res) {
    res.sendFile(__dirname + '/public/register.html');
});

app.post("/api/register", function (req, res) {
	if (req.body.userid != null && req.body.password != null){
		MongoClient.connect(mongourl, function (err, db) {
			assert.equal(err, null);
			console.log('Connected to MongoDB\n');
			fn.checkduplicate(db, req.body.userid, function (callback) {
				if (!callback) {
					fn.createUser(db, req.body.userid, req.body.password, function (err, result){
						
						assert.equal(err,null);
						console.log("insertOne() was successful _id = " +
						JSON.stringify(result.insertedId));
						db.close();
						console.log('Disconnected from MongoDB\n');
						res.redirect("/");
					});
				} else {
					console.log("Repeated");
					res.redirect("/api/register");
				}
			});
			
		});
	} else {
		res.redirect("/api/register");
	}
});


/////////////////////////////////////////////////      Read
app.get('/api/read', function (req, res) {
	console.log("in /api/read");
	var criteria = "None";
	if (req.session.userid){
		MongoClient.connect(mongourl, function (err, db) {
			assert.equal(err, null);
			console.log('Connected to MongoDB\n');
			db.collection('restaurant').find().toArray(function (err, results) {
				if (err) {
					console.log(err);
				}
				else {
					db.close();
					//console.log(results);
					res.render('readpage.ejs', {userid: req.session.userid, c: results, criteria: criteria});
				}
			})
		});
	}else {
		res.redirect("/");
	}
}); 

/////////////////////////////////////////////////      Read & Search
app.get('/api/read/:criteria/:detail', function (req, res){
	//console.log("in /api/read/:criteria/:detail");
	var criteria = "None";
	
	if (req.session.userid && req.params.detail && req.params.criteria){
		var detail = req.params.detail;
		var criteria = req.params.criteria;
		var doc;
		MongoClient.connect(mongourl, function (err, db) {
			assert.equal(err, null);
			//console.log('Connected to MongoDB\n');
			switch (criteria){
				case "name": doc = {name: detail}; break;		
				case "borough": doc = {borough: detail}; break;
				case "cuisine": doc = {cuisine: detail}; break;
				default : doc = {};
			}

			db.collection('restaurant').find(doc).toArray(function (err, results) {
				db.close();
				if (results) {
					res.json(results);
				}
				else {
					//console.log(results);
					res.json();
				}
			})
		});
 	} else {
		res.redirect("/");
	}  
});

/////////////////////////////////////////////////      Read details
app.get('/api/display', function (req, res) {
	if (req.session.userid){
		if (req.query._id) {
			MongoClient.connect(mongourl, function (err, db) {
				fn.display(db, req.query._id, function (result) {
					//console.log(result);
					if (result){
						db.close();
						res.render('details.ejs', {c: result, userid: req.session.userid});
					} else {
						res.render('output.ejs', {userid: req.session.userid, message: "Restaurant not found!"});
					}
				});
			});
		}
		else{
			//res.status(500).end(req.query.id + ' not found!');
			res.render('output.ejs', {userid: req.session.userid, message: "Empty restaurants!"});
		}
	} else {
		res.redirect("/");
	}
});

/////////////////////////////////////////////////      Read map
 app.get("/api/gmap", function(req,res) {
	 if (req.session.userid){
		 if (req.query._id != null) {
			 MongoClient.connect(mongourl, function(err, db) {
				 assert.equal(err,null);
				 console.log('Connected to MongoDB\n');
				 fn.display(db, req.query._id, function (result) {
					 if (result != null){
						console.log(result.address, typeof result.address.coord[0]);
						//result.address.coord[0]='22.3161489';
						//result.address.coord[1]='114.1781523';
						console.log(result.address, typeof result.address.coord[0]);
						res.render('gmap.ejs',{c:result,zoom:18, userid: req.session.userid});
						db.close();
						console.log('Disconnected MongoDB\n');
					 } else {
						res.render('output.ejs', {userid: req.session.userid, message: "Restaurant not found!"});
					 }
				 });
			 });
		 } else {
			//res.status(500).end(req.query.id + ' not found!');
			res.render('output.ejs', {userid: req.session.userid, message: "Empty restaurants!"});
		}
	} else {
		res.redirect("/");
	}
 });

 

/////////////////////////////////////////////////      Create
app.get('/api/create', function (req, res) {
	if (req.session.userid){
		res.sendFile(__dirname + '/public/createRestaurant.html');
		//res.render('createRestaurant.ejs', {userid: req.session.userid});

	} else {
		res.redirect("/");
	}
});

app.post('/api/create', function (req, res) {
	if (req.session.userid){
		MongoClient.connect(mongourl, function (err, db) {
			assert.equal(err, null);
			console.log('Connected to MongoDB\n');
			if (req.body.name == null) {
				console.log('empty name');
				res.render("/api/create", {
					message: "enter again", userInfo: "", c: ""
				});
				return;
			} 
			fn.create(db, req.files.bfile, req.body, "demo", function (result) {
				db.close();
				if (result) {
					res.json({status: "ok", _id: result.insertedId});
					//res.redirect("/api/display?_id=" + result.insertedId);
				}
				else {
					res.json({status: "failed"});
					//res.status(500).end(req.query.id + ' not found!');
					//res.render('output.ejs', {userid: req.session.userid, message: "Failed to create restaurant!"});
				}
			});
		});
	} else {
		res.redirect("/");
	} 
});


/////////////////////////////////////////////////    Edit
app.get('/api/edit', function (req, res) {
	if (req.session.userid && req.query._id){
		MongoClient.connect(mongourl, function (err, db) {
			assert.equal(err, null);
			console.log('Connected to MongoDB\n');
			db.collection('restaurant').findOne(
			{userid: req.session.userid, _id:ObjectId(req.query._id)}
			, function (err, result){
				if (result){
					//res.sendFile(__dirname + '/public/createRestaurant.html');
					res.render('edit.ejs', {userid: req.session.userid, c:result});
				} else {
					res.redirect('/api/display?_id='+req.query._id);
				}
				//console.log(req.query._id, result);
			});
		});		
	} else {
		res.redirect("/");
	}
});

app.post('/api/edit', function (req, res) {
	if (req.session.userid && req.query._id){
		MongoClient.connect(mongourl, function (err, db) {
			assert.equal(err, null);
			console.log('Connected to MongoDB?\n');
			if (req.body.name == null) {
				console.log('empty name');
				res.redirect("/api/edit?_id=" + req.query._id);
				return;
			} 
			fn.edit(db, req.files.bfile, req.body, req.session.userid, req.query._id);
			db.close();
			res.redirect("/api/display?_id=" + req.query._id);
		});
	} else {
		res.redirect("/");
	}
});


/////////////////////////////////////////////////      Rate
app.get('/api/rate', function (req, res){
	if (req.session.userid && req.query._id){
		res.render('rate.ejs', {userid: req.session.userid, _id: req.query._id});
	} else {
		res.redirect("/");
	}
});

app.post('/api/rate', function (req, res) {
	if (req.session.userid && req.query._id){
		MongoClient.connect(mongourl, function (err, db) {
			assert.equal(err, null);
			console.log('Connected to MongoDB?\n');
			if (req.body.rate >= 0 && req.body.rate <= 10){
				db.collection('restaurant').findOne({rate: { $elemMatch: {userid: req.session.userid}}, _id: ObjectId(req.query._id)}
				, function (err, result){
					if (!err && !result){
						fn.rate(db, req.body, req.session.userid, req.query._id);
					} 
					db.close();
				});
			}
			res.redirect("/api/display?_id=" + req.query._id);
		});
	} else {
		res.redirect("/");
	}
});

/////////////////////////////////////////////////      Remove
app.get('/api/remove', function (req, res) {
	if (req.session.userid && req.query._id){
		MongoClient.connect(mongourl, function (err, db) {
			assert.equal(err, null);
			console.log('Connected to MongoDB\n');
			fn.remove(db, req.session.userid, req.query._id);
			db.close();
		});
		res.redirect("/api/display?_id=" + req.query._id);
	} else 
		res.redirect("/");
});


app.listen(process.env.PORT || 8099);
console.log("Server is working");
