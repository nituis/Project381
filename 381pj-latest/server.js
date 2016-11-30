var express = require('express');
var app = express();
var mongourl = 'mongodb://lazylook:s20071038@ds159767.mlab.com:59767/comps381f';
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var session = require('cookie-session');
//var mongoose = require('mongoose');
var fileUpload = require('express-fileupload');
var SECRETKEY = 'I want to pass COMPS381F';
var ObjectId = require('mongodb').ObjectId;
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.use(fileUpload());
app.use(bodyParser.json());
app.use(session({
    secret: SECRETKEY,
    resave: true,
    saveUninitialized: true
}));

app.set('view engine', 'ejs');

app.get('/create', function (req, res) {
    res.sendFile(__dirname + '/public/createRestaurant.html');
});

app.get('/login', function (req, res) {
    res.sendFile(__dirname + '/public/login.html');
});

app.get('/register', function (req, res) {
    res.sendFile(__dirname + '/public/register.html');
});

app.get('/read', function (req, res) {
    MongoClient.connect(mongourl, function (err, db) {
        assert.equal(err, null);
        console.log('Connected to MongoDB\n');
        db.collection('restaurant').find().toArray(function (err, results) {
            if (err) {
                console.log(err);
            }
            else {
                db.close()
                //console.log(results);
                res.render('readpage.ejs', {userid: req.session.userid, c: results});
            }
        })
    });
});

//function findRestaurants(db, callback) {
//    var restaurants = [];
//    c = db.collection('restaurants').find();
//    c.each(function (err, doc) {
//        assert.equal(err, null);
//        if (doc != null) {
//            restaurants.push(doc);
//        } else {
//            callback(restaurants);
//        }
//    });
//}

app.get('/', function (req, res) {
    console.log(req.session);
    if(req.session.userid!=null)
        res.redirect('/read');
    else
        res.redirect('/login'); 
});

app.get('/logout', function (req, res) {
    req.session = null;
    res.redirect('/login');
});

/*register*/
app.post("/registerSubmit", function (req, res) {

    MongoClient.connect(mongourl, function (err, db) {
        assert.equal(err, null);
        console.log('Connected to MongoDB\n');
        checkduplicate(db, req.body.userid, function (callback) {
            if (!callback) {
                createUser(db, req.body.userid, req.body.password, function (result) {
                    db.close();
                    //res.status(200);
                });
            } else {
                console.log("Repeated");
            }
        });
    });
});

/*register*/
function createUser(db, userid, password, callback) {
    db.collection('user').insertOne({
        "userid": userid,
        "password": password,
    }, function (err, result) {
        if (err) {
            result = err;
            console.log("insertOne error" + JSON.stringify(err));
        } else {
            console.log("Inserted _id = " + result.insertedID)
        }
        callback(result);
    })
}
/*login*/
app.post('/login', function (req, res) {
    var userid = req.body.userid;
    var password = req.body.password;
    var userInfo;

    MongoClient.connect(mongourl, function (err, db) {
        assert.equal(err, null);
        console.log('Connected to MongoDB\n');
        db.collection('user').findOne({userid: userid, password: password}, function (err, user) {
            if (err) {
                console.log(err);
                res.status(500).send();
            }
            if (!user) {
                res.status(404).send();
            } else {
                req.session.userid = userid;
                userInfo = userid;
                db.close();
                console.log('Disconnected from MongoDB\n');
                console.log(user);
                console.log(userInfo);
                console.log(req.session.userid);
                res.redirect("/read")
                //res.render('readpage.ejs', {userInfo: userInfo, c: ""});
            }
        });
    });
});

function checkduplicate(db, userid, callback) {
    db.collection('user').findOne({userid: userid}, function (err, user) {
        assert.equal(err, null);
        if (user != null)
            callback(true);
        else {
            callback(false);
        }
    });
}
//;
//app.post('/read', function (req, res) {
//    if (!req.session.userid) {
//        res.redirect("/login");
//    } else {
//        //res.render('readpage.ejs', {userInfo: userInfo});
//    }
//});

app.post('/createRestaurant', function (req, res) {
    MongoClient.connect(mongourl, function (err, db) {
        assert.equal(err, null);
        console.log('Connected to MongoDB\n');
        if (req.body.name == null) {
            console.log('empty name');
            res.render("createRestaurant", {
                message: "enter again", userInfo: "", c: ""
            });
            //req.session.userInfo = 
            return;
        }
        create(db, req.files.bfile, req.body, req.session.userid, function (result) {
            db.close();
            if (result) {
                res.redirect("/read");
            }
            else {
                res.status(500);
            }
        });
    });
});

function create(db, bfile, restaurant, userid, callback) {
    console.log(bfile);
    db.collection('restaurant').insertOne({
        "address": {
            "street": restaurant.street,
            "zipcode": restaurant.zipcode,
            "building": restaurant.building,
            "coord": [restaurant.lon, restaurant.lat]
        },
        "borough": restaurant.borough,
        "cuisine": restaurant.cuisine,
        "name": restaurant.name,
        "userid": userid,
        "restaurant_id": null,
        "data": new Buffer(bfile.data).toString('base64'),
        "mimetype": bfile.mimetype
    }, function (err, result) {
        //assert.equal(err,null);
        if (err) {
            result = err;
            console.log("insertOne error: " + JSON.stringify(err));
        } else {
            console.log("Inserted _id = " + result.insertedId);
        }
        callback(result);
    });
}
app.get('/display', function (req, res) {
    if (req.query._id != null) {
        MongoClient.connect(mongourl, function (err, db) {
            display(db, req.query._id, function (result) {
                console.log(result);
                res.render('details.ejs', {c: result});
                db.close();
            });
        });
    }
    else{
        res.status(500).end(req.query.id + ' not found!');
    }
});


 app.get("/gmap.ejs", function(req,res) {
 MongoClient.connect(mongourl, function(err, db) {
 assert.equal(err,null);
 console.log('Connected to MongoDB\n');
 display(db, req.query._id, function (result) {
	  res.render('gmap.ejs',{c:result,zoom:18});
                db.close();
 console.log('Disconnected MongoDB\n');
 });
 });
 });
 
function display(db, id, callback) {
    db.collection('restaurant').findOne({"_id":ObjectId(id)},function (err, result) {
        assert.equal(err, null);
		console.log(result.address.coord[0],result.address.coord[1]);
        //if (result != null)
        callback(result);
    });
};



app.listen(process.env.PORT || 8099);
