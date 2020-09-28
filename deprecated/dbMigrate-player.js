/**
 * Config
 */
/*const mongoURL = '***REMOVED***';
const postgresDB = {
	user: '***REMOVED***',
	host: '***REMOVED***',
	database: 'galactae',
	password: '***REMOVED***',
	port: 5432,
};*/
const mongoURL = '***REMOVED***';
const postgresDB = {
	user: '***REMOVED***',
	host: '***REMOVED***',
	database: '***REMOVED***',
	password: '***REMOVED***',
	port: 5432
};

/**
 * Modules
 */
// MongoDB
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Postgres
const { Pool } = require('pg');
let pool;

global.db = require('../server/database')

/**
 * Schemas
 */
const userSchema = new Schema({
	_id: Schema.Types.ObjectId,
	name: String,
	gvt: Number,
	ally: String,
	sid: String,

	planetlist: Array,

	currTutorial: Number,

	beginnerProtectEnd: Number,

	lastConnected: Number,
	lastAction: Number,

	points: Number,
	money: Number,
	// Research
	lastResearchUpdate: Number,
	research: Array,
	// Bonus journalier
	lastBonus: Number,
	dayBonusStreak: Number,
	dayBonusBest: Number,
});
const users = mongoose.model('users', userSchema, 'users');

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

			const oldResearch = newObj.research;
			const research = {};
			for(let j=0; j<oldResearch.length; j++) {
				research[oldResearch[j][0]] = oldResearch[j][1];
			}

			delete newObj._id;
			delete newObj.id;

			newObj.ally = null;
			newObj.research = research;

			const [query, values] = db.buildInsertQuery('users', newObj);
			pool.query(query, values, (err) => {
				if(err) { console.log(err, 'error'); return; }
			});
		}
	});
}

connectSQLDb();