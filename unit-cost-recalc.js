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
global.Units = require('../server/Units');

/**
 * Libs
 */
// Include that before, instead, that could pose some problems
global.db        = require('../server/database');

/**
 * Launch server !
 */
db.connect(async(success,general=false) => {
	if(!success) {
		log('Failed to connect to db ! Blocking user connections ...','warn');
		return;
	}

	if(general) {
		return;
	}

	const unitList = await db.unit.findAll();

	log('Found ' + unitList.length + ' units.');

	for(let u=0; u<unitList.length; u++) {
		const curr = unitList[u];

		const newcost = Units.calcCost(
			curr.shipShape,
			curr.parts);

		if(newcost[0] === -1) {
			log('Unité: ' + curr.name + ', ERREUR');
			continue;
		} // There's something wrong ... Security measure

		if(newcost.toString() === curr.cost.toString()) {
			log('Unité: ' + curr.name + ', OK');
			console.info(newcost);
		} else {
			log('Unité: ' + curr.name + ', Pas OK');
			log('Avant:');
			console.info(curr.cost);
			log('Apres:');
			console.info(newcost);

			if(await db.unit.update({
				id: curr.id,
				cost: newcost
			})) {
				log('Unité: ' + curr.name + ', Mise à jour !');
			}
		}
	}
});