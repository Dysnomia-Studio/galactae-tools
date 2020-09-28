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

	const userList = await db.player.findAll();

	for(let u=0; u<userList.length; u++) {
		const userId = u;
		const newUser = Object.assign({}, userList[userId]);

		if(newUser.points === 0) { continue; } // Security

		console.log('Recalcul des points pour ' + newUser.name);

		Player.refreshPoints(newUser, async function(updatedUser) {
			const userWithPoints = {
				id: updatedUser.id,
				points: updatedUser.points
			};

			if(updatedUser.points !== userList[userId].points) {
				console.log('Mise à jour de la BDD pour ' + updatedUser.name + ' Avant: ' + userList[userId].points + ' Apres: ' + updatedUser.points);
				console.log(userWithPoints);
				await db.player.update(userWithPoints);
			} else {
				console.log('Les points de ' + updatedUser.name + ' sont déjà à jour !');
			}
		});
	}
});