/**
 * Npm libs
 */
global.fs = require('fs');

/**
 * Global vars
 */
global.preventConnection = false;
global.preventConnectionMsg = "";
global.maintenance = false;
global.plCount = 0;
global.adminSid = "";

/**
 * Configs & Constants
 */
require('../server-dev/calcConstants')();
require('./config')();

require('../server-dev/misc')();
require('../server-dev/console')();

global.io = class { // Prevent bugs - we don't need socket
	static to() { return new io(); }
	emit() { return 0; }
};

/**
 * Libs
 */
// Include that before, instead, that could pose some problems
global.db        = require('../server-dev/database');

global.Planet    = require('../server-dev/planet');
global.Player    = require('../server-dev/player');
global.Research  = require('../server-dev/research');
global.Units     = require('../server-dev/units');

/**
 * Launch server !
 */
db.connect(async function(success,general=false) {
	if(!success) {
		log('Failed to connect to db ! Blocking user connections ...',"warn");
		return;
	}

	if(general) {
		return;
	}

	const userList = await db.player.findAll();

	for(let u=0; u<userList.length; u++) {
		let userId = u;
		let newUser = userList[userId].toJSON();

		for(let i in newUser.research) {
			if(newUser.research[i][1] === -1) {
				newUser.research[i][1] = researchList[newUser.research[i][0]].cost / 2;
			}
		}

		//console.log('Mise à jour de la BDD pour ' + newUser.name + ' Avant: ' + userList[userId] + ' Apres: ');
		//console.log(newUser);

		//if(newUser.name === 'Elanis') {
			console.log('Updating user: ' + newUser.name);

			newUser.id = newUser._id;

			// Reset planet current research
			for(let p=0; p<newUser.planetlist.length; p++) {
				console.log('Resetting research on planet ' + newUser.planetlist[p]);
				Research.ChangePlanetResearch({ id: newUser.id, sid: "", pid: newUser.planetlist[p], username: newUser.name }, "researchCenter");
			}
			
			await db.player.update(newUser);
		//}
	}
});