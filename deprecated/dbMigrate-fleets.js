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


function getNewUnitId(id, ownerId, callback) {
	if(!id || id == -1) {
		callback(null);
		return;
	}

	if((''+id).charAt(0) === 'S') {
		callback(id);
		return;
	}

	units.findById(id, (err, oldUnit) => {
		if(err) { console.trace(err, 'error'); return; }

		pool.query('SELECT * FROM units WHERE name=$1 AND "ownerId"=$2', [oldUnit.name, ownerId], (err, newUnit) => {
			if(err) { console.trace(err, 'error'); return; }

			callback(newUnit.rows[0].id);
		});
	});
}


/**
 * Iterate on items: find, insert in pgsql
 */
function iterate() {
	fleets.find({ }, function (err, objReturned) {
		if(err) { console.log(err); }
		for(let i=0; i<objReturned.length; i++) {
			const newObj = objReturned[i].toJSON();

			delete newObj._id;
			delete newObj.id;
			delete newObj.motherPlanetAdress;
			delete newObj.__v;

			newObj.fuel = Math.round(parseFloat(newObj.fuel));
			newObj.maxFuel = Math.round(parseFloat(newObj.maxFuel));
			if(Number.isNaN(newObj.fuel)) { newObj.fuel = 0; }
			if(Number.isNaN(newObj.maxFuel)) { newObj.maxFuel = 0; }
			newObj.fuel = Math.min(newObj.fuel, newObj.maxFuel);

			// ownerId
			users.findById(newObj.ownerId, (err, oldUser) => {
				if(err) { console.log(err, 'error'); return; }
				pool.query('SELECT * FROM users WHERE name=$1', [oldUser.name], (err, newUser) => {
					if(err) { console.log(err, 'error'); return; }

					newObj.ownerId = newUser.rows[0].id;

					pool.query('SELECT * FROM planets WHERE address=$1', [newUser.rows[0].planetlist[0]], (err, newPlanet) => {
						if(err) { console.log(err, 'error'); return; }

						newObj.motherPlanetId = newPlanet.rows[0].id;
						newObj.motherPlanetAddress = newPlanet.rows[0].address;
						newObj.position = newPlanet.rows[0].address;


						const oldUnits = newObj.units;
						const newUnits = {};

						let added = 0;

						// Units
						for(let i=0; i<oldUnits.length; i++) {
							const id = i;
							getNewUnitId(oldUnits[id][0], newObj.ownerId, (objid) => {
								newUnits[objid] = oldUnits[id][1];
								added++;

								if(added === oldUnits.length) {
									newObj.units = newUnits;

									const [query, values] = db.buildInsertQuery('fleets', newObj);
									pool.query(query, values, (err) => {
										if(err) { console.log(err, 'error'); return; }
										console.log(newObj.name + ' added');
									});
								}
							});
						}


					});
				});
			});
			// owner
		}
	});
}

connectSQLDb();