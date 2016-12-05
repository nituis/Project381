var assert = require('assert');
var ObjectId = require('mongodb').ObjectId;

module.exports = {

createUser: function(db, userid, password, callback) {
	db.collection('user').insertOne({
		"userid": userid,
		"password": password
	}, callback); 
},

checkduplicate: function(db, userid, callback) {
    db.collection('user').findOne({userid: userid}, function (err, user) {
        assert.equal(err, null);
        if (user != null)
            callback(true);
        else {
            callback(false);
        }
    });
},


create: function(db, req, callback) {
    //console.log(bfile);
	var data = "";
	var mt = "";
	var coord = ["", ""];

	if (req.files) {
	data = new Buffer(req.files.data).toString('base64');
	if (req.files.mimetype == "image/jpeg"
||data.mimetype == "image/bmp"
||data.mimetype == "image/x-cmx"
||data.mimetype == "image/cis-cod"
||data.mimetype == "image/gif"
||data.mimetype == "image/x-icon"
||data.mimetype == "image/ief"
||data.mimetype == "image/pipeg"
||data.mimetype == "image/x-portable-bitmap"
||data.mimetype == "image/x-portable-graymap"){
		mt = data.mimetype;
	} 
	}
	if (req.body.lon && req.body.lat){
		coord = [req.body.lon, req.body.lat];
	} else {
		coord = ["", ""];
	}
		
	//restaurant_id = ?

    db.collection('restaurant').insertOne({
			"address": {
				"street": req.body.street,
				"zipcode": req.body.zipcode,
				"building": req.body.building,
				"coord": coord
			},
			"borough": req.body.borough,
			"cuisine": req.body.cuisine,
			"name": req.body.name,
			"userid": req.session.userid,
			"restaurant_id": null,
			"data": data,
			"mimetype": mt,
			"rate": []
		}, function (err, result) {
        //assert.equal(err,null);
        if (err) {
            //result = err;
            console.log("insertOne error: " + JSON.stringify(err));
        } else {
            console.log("Inserted _id = " + result.insertedId);
        }
        callback(result);
    });
},


rate: function(db, restaurant, userid, restid) {
	var doc = {"userid": userid, "value": restaurant.rate};
	console.log(userid, restaurant.rate);
	db.collection('restaurant').updateOne({
		"_id": ObjectId(restid)		
	},{$push: {rate: doc}}, function (err, result) {
        assert.equal(err,null);
		console.log("result", err);
        /* if (err) {
            //result = err;
            console.log("insertOne error: " + JSON.stringify(err));
        } else {
            console.log("Inserted _id = " + result.insertedId);
        } */
			//callback(result);
    });
},

remove: function(db, userid, restid) {
    db.collection('restaurant').removeOne({
		"userid": userid,
		"_id": ObjectId(restid)		
	}, function (err, result) {
        assert.equal(err,null);
        /* if (err) {
            //result = err;
            console.log("removeOne error: " + JSON.stringify(err));
        } else {
            console.log("remove");
        } */
        //callback(result);
    });
},

edit: function(db, bfile, restaurant, userid, restid) {
    console.log("In edit()", bfile);
	var doc;
	var data = new Buffer(bfile.data).toString('base64');
	var coord = ["", ""];
	var mt = "";
	if (restaurant.lon && restaurant.lat){
		coord = [restaurant.lon, restaurant.lat];
	} 
	if (data.mimetype == "image/jpeg"
||data.mimetype == "image/bmp"
||data.mimetype == "image/x-cmx"
||data.mimetype == "image/cis-cod"
||data.mimetype == "image/gif"
||data.mimetype == "image/x-icon"
||data.mimetype == "image/ief"
||data.mimetype == "image/pipeg"
||data.mimetype == "image/x-portable-bitmap"
||data.mimetype == "image/x-portable-graymap"){
			
			mt = data.mimetype;
		
	} else {
		data = "";
	}
	if (bfile.name != "" && data != "" && mt != ""){
		//console.log("BFILE!!!!!!!!!!!!!!", bfile);
		doc = {
		"address": {
			"street": restaurant.street,
			"zipcode": restaurant.zipcode,
			"building": restaurant.building,
			"coord": coord
		},
		"borough": restaurant.borough,
		"cuisine": restaurant.cuisine,
		"name": restaurant.name,
		"userid": userid,
		"restaurant_id": null,
		"data": new Buffer(bfile.data).toString('base64'),
		"mimetype": bfile.mimetype
		};
	} else {
		console.log("no new image");
		doc = {
		"address": {
			"street": restaurant.street,
			"zipcode": restaurant.zipcode,
			"building": restaurant.building,
			"coord": coord
		},
		"borough": restaurant.borough,
		"cuisine": restaurant.cuisine,
		"name": restaurant.name,
		"userid": userid,
		"restaurant_id": null
		};
	}
		
	//restaurant_id = ?

    db.collection('restaurant').updateOne({
		"userid": userid,
		"_id": ObjectId(restid)		
	},{$set: doc}, function (err, result) {
        assert.equal(err,null);
		console.log("in edit(): found", err, result)
        if (err) {
            //result = err;
            console.log("insertOne error: " + JSON.stringify(err));
        } else {
            console.log("Inserted _id = " + result.insertedId);
        }
        //callback(result);
    });
},
 
display: function(db, id, callback) {
    db.collection('restaurant').findOne({"_id":ObjectId(id)},function (err, result) {
        assert.equal(err, null);
		//console.log(result.address.coord[0],result.address.coord[1]);
		callback(result);
    });
}

};

//checkduplicate;
//app.post('/api/read', function (req, res) {
//    if (!req.session.userid) {
//        res.redirect("/api/login");
//    } else {
//        //res.render('readpage.ejs', {userInfo: userInfo});
//    }
//});

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
