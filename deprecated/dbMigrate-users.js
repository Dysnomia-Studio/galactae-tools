/**
 * Config
 */
const mongoURL = '***REMOVED***';
const postgresDB = {
	user: '***REMOVED***',
	host: '***REMOVED***',
	database: 'galactae',
	password: '***REMOVED***',
	port: 5432,
};
/*const mongoURL = '***REMOVED***';
const postgresDB = {
	user: '***REMOVED***',
	host: '***REMOVED***',
	database: '***REMOVED***',
	password: '***REMOVED***',
	port: 5432
};*/

/**
 * Modules
 */
// MongoDB
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let MongoDB;

// Postgres
const { Pool } = require('pg');
let pool;

global.db = require('../server/database');

/**
 * Server schemas
 */
const userSchema = new Schema({
	_id: Schema.Types.ObjectId,
	user_name: String,
	user_mail: String,
	user_passwd: String,
	activated: Number,
	newsletter_misc: Number,
	newsletter_updates: Number,
	user_customRank: String,
	user_adminPanelAccess: Number,
	lastViewedNews: Number
});

/**
 * Used to connect to database
 */
function connectMongoDb() {
	mongoose.connect(mongoURL);
	MongoDB = mongoose.connection;
	MongoDB.on('error', function(err) { console.err(err.message); });
	MongoDB.once('open', function() {
		console.log('Successfuly connected to MongoDB database server.');

		iterate();
	});


	global.users = MongoDB.model('users', userSchema);
}

function connectSQLDb() {
	pool = new Pool(postgresDB);

	pool.connect((err, client, done) => {
		if (err) throw err;

		console.log('Successfuly connected to PostgreSQL database server.');
		connectMongoDb();
	});
}

/**
 * Iterate on items: find, insert in pgsql
 */
function iterate() {
	users.find({ }, function (err, objReturned) {
		if(err) { console.log(err); }

		for(let i=0; i<objReturned.length; i++) {
			const newObj = objReturned[i].toJSON();

			delete newObj._id;
			delete newObj.id;
			delete newObj.__v;
			delete newObj.viewedNews;

			const [query, values] = db.buildInsertQuery('users', newObj);

			console.log(query);
			console.log(values);

			pool.query(query, values, (err) => {
				if(err) { console.log(err, 'error'); return; }
			});
		}
	});
}

connectSQLDb();