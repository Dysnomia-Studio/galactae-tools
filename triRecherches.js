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
global.db        = require('../server/database');
// Then include other classes
global.Planet    = require('../server/planet');
global.Player    = require('../server/player');
global.Units     = require('../server/units');

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
		const newUser = userList[userId];

		if(newUser.points === 0) { continue; } // Security

		console.log(newUser.name);

		console.log(newUser.research);

		for(const key in newUser.research) {
			if(newUser.research[key] === 0) {
				delete newUser.research[key];
			}
		}

		console.log(newUser.research);

		await db.player.update(newUser);
	}
});