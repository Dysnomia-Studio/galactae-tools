/**
 * Npm libs
 */
global.fs = require('fs');

/**
 * Global vars
 */
global.preventConnection = false;
global.preventConnectionMsg = '';
global.maintenance = false;
global.plCount = 0;
global.adminSid = '';

/**
 * Configs & Constants
 */
require('../server/calcConstants')();
require('../server/config')();

require('../server/misc')();
require('../server/console')();

/**
 * Libs
 */
// Include that before, instead, that could pose some problems
global.db         = require('../server/database');
global.Discord    = require('../server/discord');
// Then include other classes
global.Alliances  = require('../server/Alliances');
global.Buildings  = require('../server/Buildings');
global.Chat       = require('../server/chat');
global.Combat     = require('../server/combat');
global.Conquest   = require('../server/Conquest');
global.DependencyEngine = require('../server/DependencyEngine');
global.Fleets 	  = require('../server/Fleets');
global.GameMap    = require('../server/GameMap');
global.Planet     = require('../server/planet');
global.Player     = require('../server/player');
global.Privileges = require('../server/privileges');
global.Reports    = require('../server/Reports');
global.Research   = require('../server/research');
global.Resources  = require('../server/Resources');
global.Tactics    = require('../server/tactics');
global.Tutorials  = require('../server/Tutorials');
global.Units      = require('../server/Units');
// And that's in last
global.Websocket  = require('../server/socket');

/**
 * Launch server !
 */
db.connect(async function(success,general=false) {
	if(!success) {
		log('Failed to connect to db ! Blocking user connections ...','warn');
		return;
	}

	if(general) {
		return;
	}

	console.log('go');

	const planetList = await db.planet.getAllColonizedPlanets();

	console.log('Updating ' + planetList.length + ' planets ...');

	try {
		const updatedList = [];

		for(const planet of planetList) {
			const newPlanet = JSON.parse(JSON.stringify(planet));

			for(let i = 0; i<newPlanet.Buildings.length; i++) {
				newPlanet.Buildings[i] = Math.min(newPlanet.Buildings[i], buildingMaxLvl[newPlanet.planetType][i]);
			}

			if(JSON.stringify(newPlanet) !== JSON.stringify(planet)) {
				updatedList.push(newPlanet);
			}
		}

		console.log('Found ' + updatedList.length + ' planets to update in database !');

		for(const planet of updatedList) {
			db.planet.update(planet);
		}
	} catch(err) {
		log(err, 'error');
	}
});