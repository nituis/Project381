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


create: function(db, bfile, restaurant, userid, callback) {
    console.log(bfile);
	var data = "";
	var mt = "";
	var coord = ["", ""];

	if (bfile){
		data = new Buffer(bfile.data).toString('base64');
		mt = data.mimetype;
	} 
	if (restaurant.lon && restaurant.lat){
		coord = [restaurant.lon, restaurant.lat];
	} else {
		coord = ["", ""];
	}
		
	//restaurant_id = ?

    db.collection('restaurant').insertOne({
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
	var coord = ["", ""];
	
	if (restaurant.lon && restaurant.lat){
		coord = [restaurant.lon, restaurant.lat];
	} 

	if (bfile.name != ""){
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
		console.log("in edit(): found")
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