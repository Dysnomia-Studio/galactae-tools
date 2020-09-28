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
let MongoDB;

// Postgres
const { Pool } = require('pg');
let pool;

global.db = require('../server/database');

/**
 * Server schemas
 */
const planetSchema = new Schema({
	// General informations
	_id: Schema.Types.ObjectId,
	name: String,
	address: String,
	owner: Schema.Types.ObjectId,
	points: Number,

	// Geographic informations
	orbitDist: Number,
	orbitDuration: Number,
	galacticPos: Array,
	planetType: Number,

	// Buildings
	Buildings: Array,
	nextBuilding: Number,
	nextBuildingTime: Number,

	// Resources
	resources: Array,
	lastResourcesUpdate: Number,

	// Units
	unitBuildingID: String,
	unitBuildingCount: Number,
	unitBuildingEndTime: Number,
	unitBuildingFleetID: Schema.Types.ObjectId,
	lastUnitUpdate: Number,
	highPriorityFleet: String,

	// Misc
	currResearch: String,
});

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

const unitsSchema = new Schema({
	_id: Schema.Types.ObjectId,
	name: String,
	ownerId: Schema.Types.ObjectId,
	cost: Array, // [Al,Fe,Ti,Cu,Time,Population]
	shipType: String,
	shipShape: String,
	parts: Array,
	armorType: String,
	owned: Number,
	note: Number,
});

const fleetsSchema = new Schema({
	_id: Schema.Types.ObjectId,
	name: String,
	ownerId: Schema.Types.ObjectId,
	motherPlanetId: Schema.Types.ObjectId,
	motherPlanetAdress: String,
	position: String,
	orbitPosition: Number, // -1 = Moving to, 0 = Low Orbit - Defense or siege, 1 = Mid Orbit - Attacking, 2 = High orbit - Just around the planet
	points: String,
	endMoveTime: Number,
	units: Array,
	population: Number,
	inBuilding: Boolean,
	fuel: Number,
	maxFuel: Number,
});

const statsSchema = new Schema({
	_id: Schema.Types.ObjectId,
	plCount: Number,
	time: Number,
});


/**
 * General schemas
 */
const userPrivilegesSchema = new Schema({
	_id: Schema.Types.ObjectId,
	user_id: Schema.Types.ObjectId,
	server_name: String,
	user_privilege_lvl: Number,
	user_whitelist: Number,
});

const serverSchema = new Schema({
	_id: Schema.Types.ObjectId,
	server_name: String,
	server_maintenance: Boolean,
});

const userGameIdSchema = new Schema({
	_id: Schema.Types.ObjectId,
	user_id: String,
	game_id: String,
	server_name: String,
});

const userBanSchema = new Schema({
	_id: Schema.Types.ObjectId,
	user_id: String,
	server_name: String,
	ban_type: Number, // 1 = Chat, 2 = Game
	ban_begin: Number,
	ban_end: Number,
	ban_reason: String,
	admin: String,
});

const globalRanksSchema = new Schema({
	_id: Schema.Types.ObjectId,
	user_id: String,
	name: String,
	server_name: String,
	rank: Number,
	points: Number,
	planets: Number,
});

const sectorRanksSchema = new Schema({
	_id: Schema.Types.ObjectId,
	user_id: String,
	name: String,
	server_name: String,
	sector: String,
	rank: Number,
	points: Number,
	planets: Number,
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


	global.planets = MongoDB.model('planets', planetSchema);
	global.users = MongoDB.model('users', userSchema);
	global.units = MongoDB.model('units', unitsSchema);
	global.fleets = MongoDB.model('fleets', fleetsSchema);
	global.stats = MongoDB.model('stats', statsSchema);
	global.privileges = MongoDB.model('privileges', userPrivilegesSchema);
	global.servers = MongoDB.model('servers', serverSchema);
	global.userGameIds = MongoDB.model('game_ids', userGameIdSchema);
	global.bans = MongoDB.model('bans', userBanSchema);
	global.globalRanks = MongoDB.model('globalRanks', globalRanksSchema);
	global.sectorRanks = MongoDB.model('sectorRanks', sectorRanksSchema);
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
	stats.find({ }, function (err, objReturned) {
		if(err) { console.log(err); }

		const statsList = {};
		for(let i=0; i<objReturned.length; i++) {
			if(!statsList[objReturned[i].time]) { statsList[objReturned[i].time] = 0; }
			statsList[objReturned[i].time] = Math.max(statsList[objReturned[i].time], objReturned[i].plCount);
		}

		const statsArray = [];
		for(const key in statsList) {
			statsArray.push({ time: key, plCount: statsList[key] });
		}

		for(let i=0; i<statsArray.length; i++) {
			const newObj = Object.assign({}, statsArray[i]);

			if(i%1000 === 0) {
				console.log(i);
			}

			delete newObj._id;
			delete newObj.id;
			delete newObj.__v;

			const [query, values] = db.buildInsertQuery('stats', newObj);
			pool.query(query, values, (err) => {
				if(err) { console.log(err, 'error'); return; }
			});
		}
	});
}

connectSQLDb();