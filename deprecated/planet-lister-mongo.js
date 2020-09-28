// Libs
const mongoose = require('mongoose');
const cheerio = require('cheerio');
const fs = require('fs');
const Schema = mongoose.Schema;

/**
 * Configs & Constants
 */
require('./config')();

// Stars: 4.8 to 12 em
// in XML from 0 to 37
const STAR_SIZE_BASE = 4;
const STAR_SIZE_COEF = 2 / 37;
const STAR_ECART = 2.25;

// Planets: 4 to 15 em
const PLANET_SIZE_BASE = 3 / 2;
const PLANET_SIZE_COEF = 9 / 14;
const PLANET_ECART = 2.5;

// Mongo Schemes
const planetSchema = new Schema({
	// General informations
	_id: Schema.Types.ObjectId,
	address: String,
	owner: Schema.Types.ObjectId,

	// Geographic informations
	orbitDist: Number,
	orbitDuration: Number,
	galacticPos: Array,
	planetType: Number,
});

// Global Vars
let x = 0,
	y = 0;
const planetList = [];
let joueurisable = true;

// Functions
function saveToDb(address, type, orbitSize, orbitDuration, galacticPos, callback) {
	const newtype = parseInt(type);
	if(Number.isNaN(parseInt(type))) {
		const starTypesList = {
			yellowDwarf:	1000,
			blueGiant:		1001,
			redDwarf:		1002,
			redSuperGiant:	1002,
			redGiant: 		1002,
			blackHole: 1008,

			whiteDwarf: 1003,
			brownDwarf: 1004,
			blueWhiteGiant: 1005,
			nebula: 1006,
			neutrons: 1007,
		};

		type = starTypesList[type];
		if(Number.isNaN(type)) { console.err('Erreur sur l\'etoile ' + address); }
	} else {
		type = parseInt(type);
	}

	const newPlanet = {
		_id: new mongoose.Types.ObjectId(),
		address: address,
		planetType: type,

		orbitDist: orbitSize,
		orbitDuration: orbitDuration,
		galacticPos: galacticPos,
	};

	// Attribution des proprietaires
	if(type < 100) { // Planetes de type terre
		if(joueurisable) {
			newPlanet.owner = '00000000-0000-0000-0000-000000000001'; // Colonisable & Joueursiable
		} else {
			newPlanet.owner = '00000000-0000-0000-0000-000000000002'; // Colonisable
		}

		joueurisable = !joueurisable;
	} else if(type < 600) { // Planetes gazeuses
		newPlanet.owner = '00000000-0000-0000-0000-000000000003'; // Non Colonisable mais on pourra mettre des structures en orbite
	} else if (type < 1000) { // Autres planetes
		newPlanet.owner = '00000000-0000-0000-0000-000000000002'; // Colonisable
	} else { // Etoile
		newPlanet.owner = '00000000-0000-0000-0000-000000000001'; // Non Colonisable
	}

	planetDocs.create(newPlanet, function(error) {
		if(error) { console.log(error); return; }
		callback();
	});
}

let pAddedCount = 0;

function generateSystemData(callback) {
	if(planetList.length === 0) { console.log('All planets are added !'); return; }

	if(++pAddedCount%1000 === 0) { console.log(pAddedCount); }

	let currDb = 0;

	const stars = [];
	const starsXML = $(planetList[0]).find('st');
	for(let i=0; i< starsXML.length; i++) {
		stars[i] = {};
		stars[i].address = $(starsXML[i]).attr('id');
		stars[i].size	= (STAR_SIZE_BASE + STAR_SIZE_COEF * parseFloat($(starsXML[i]).attr('sz')));
		stars[i].type	= $(starsXML[i]).attr('t');
	}

	const planets = [];
	const planetsXML =  $(planetList[0]).find('p');
	for(let i=0; i< planetsXML.length; i++) {
		planets[i] = {};
		planets[i].address = $(planetsXML[i]).attr('id');
		planets[i].size	= $(planetsXML[i]).attr('sz');
		planets[i].type	= $(planetsXML[i]).attr('t');
	}

	function loadCallback() {
		if(++currDb >= (stars.length + planets.length)) {
			planetList.splice(0,1);
			generateSystemData(callback);
			return;
		}
	}

	/**
	 * Stars drawing
	 */
	let firstPlanet = 0; // let needed to know where to place the planets
	let orbitSize = [];

	// Sort by size
	stars.sort(function(a,b) {
		if(a.size === b.size) {
			return 0;
		} else if(a.size > b.size) {
			return -1;
		}
		return 1;
	});

	// Calc star positions for ...
	if(stars.length === 1) { // one star
		orbitSize[0] = 0;

		firstPlanet = stars[0].size * STAR_ECART;
	} else if(stars.length === 2) { // two stars
		// Si c'est les memes gTypes (naine et naine OU geante et geante), et on exclue les supergeantes
		if(stars[0].type.substr(-5) === stars[1].type.substr(-5) &&
			stars[0].type.substr(-10) !== 'SuperGiant' &&
			stars[1].type.substr(-10) !== 'SuperGiant') {

			orbitSize[0] = orbitSize[1] = (stars[0].size + stars[1].size)/2 * STAR_ECART;
		} else {
			orbitSize[0] = 0;

			orbitSize[1] = stars[0].size * STAR_ECART + stars[1].size * STAR_ECART/2;
		}

		firstPlanet =  orbitSize[1] + stars[1].size * STAR_ECART/2;
	} else { // 3 stars
		if(stars[0].type.substr(-5) !== stars[1].type.substr(-5) &&
			stars[1].type.substr(-5) === stars[2].type.substr(-5) &&
			stars[1].type.substr(-10) !== 'SuperGiant' &&
			stars[2].type.substr(-10) !== 'SuperGiant') { // Same 2 lasts stars

			orbitSize[0] = 0;

			orbitSize[1] = orbitSize[2] = stars[0].size * STAR_ECART + (stars[1].size + stars[2].size)/2 * STAR_ECART;

		} else { // Sort by size or same 2 first stars or same 3 stars
			if(stars[0].size - stars[1].size < 1) { // If 2 biggers are almost same size
				orbitSize[0] = orbitSize[1] = (stars[0].size + stars[1].size)/2 * STAR_ECART;

				orbitSize[2] = 2 * orbitSize[1] + stars[2].size/2 * STAR_ECART;
			} else { // If one is bigger than 2 others
				orbitSize[0] = 0;

				orbitSize[1] = orbitSize[2] = stars[0].size * STAR_ECART + (stars[1].size + stars[2].size)/2 * STAR_ECART;
			}
		}

		firstPlanet =  orbitSize[2] + stars[1].size * STAR_ECART/2;
	}

	for(let i=0; i<stars.length; i++) {
		let orbitDuration = orbitSize[i] * 36; // in seconds
		orbitDuration = Math.round(orbitDuration * 100)/100;

		saveToDb(stars[i].address, stars[i].type, orbitSize[i], orbitDuration, 
			[ parseFloat($(planetList[0]).attr('x')), parseFloat($(planetList[0]).attr('y')) ],
			loadCallback
		);
	}

	orbitSize = firstPlanet;
	for(let i=0; i<planets.length; i++) {
		// Set Size
		const size = PLANET_SIZE_BASE + parseFloat(planets[i].size)*PLANET_SIZE_COEF;

		if(i==0) {
			orbitSize += size * PLANET_ECART/2;
		} else {
			orbitSize += (PLANET_SIZE_BASE + parseFloat(planets[i - 1].size)*PLANET_SIZE_COEF) * PLANET_ECART/2 + size * PLANET_ECART/2;
		}
		orbitSize = Math.round(orbitSize * 100)/100;

		// Anim duration
		let orbitDuration = (2 + orbitSize) * 100;
		orbitDuration = Math.round(orbitDuration * 100)/100;

		saveToDb(planets[i].address, planets[i].type, orbitSize, orbitDuration,
			[ parseFloat($(planetList[0]).attr('x')), parseFloat($(planetList[0]).attr('y')) ],
			loadCallback
		);
	}
}

function LoadMap() {
	if(y > 9) { y = 0; x++; }
	if(x > 9) {
		planetList.sort(function(a, b) {
			const distA = Math.pow( 5 - parseFloat($(a).attr('x')), 2) + Math.pow( 5 - parseFloat($(a).attr('y')), 2);
			const distB = Math.pow( 5 - parseFloat($(b).attr('x')), 2) + Math.pow( 5 - parseFloat($(b).attr('y')), 2);


			if(distA > distB) {
				return 1;
			} else if(distA === distB) {
				return 0;
			}
			return -1;
		});

		console.log('Adding planets to database ...');

		generateSystemData();

		return;
	}

	console.log(x + '-' + y);

	fs.readFile(__dirname + '/map/' + x + '-' + y +'.xml', function(err, data) {
		if (!err) {
			$ = cheerio.load(data, { xmlMode: true });

			const systems = $('sy');
			for(let i=0; i<systems.length; i++) {
				planetList.push(systems[i]);
			}
		}

		y++;
		LoadMap();
	});
}

// Db Events
const mongoSrv = mongoose.createConnection(globalCfg['dbAdress']);
planetDocs = mongoSrv.model('planetsTest', planetSchema);
mongoSrv.on('error', function(err) { console.log(err.message,'warn'); callback(false); });
mongoSrv.once('open', function() {
	console.log('Successfuly connected to server database.');

	LoadMap();
});