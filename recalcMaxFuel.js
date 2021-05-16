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

	const fleetList = await db.fleet.findAll();

	for(let f=0; f<fleetList.length; f++) {
		let fid = f;
		let done = 0;
		let todo = 0;

		fleetList[fid].fuel = parseInt(fleetList[fid].fuel, 10);

		console.log('Updating fleet ' + fleetList[fid].name);

		fleetList[fid].maxFuel = 0;

		for(const uid in fleetList[fid].units) {
			++todo;

			if(uid.substr(0,14) === 'SHIP_WEP_MINES') {
				++done;
				continue;
			}

			const unit = await db.unit.findById(uid);

			if(fuelStorage[unit.shipShape]) {
				fleetList[fid].maxFuel += fuelStorage[unit.shipShape] * fleetList[fid].units[uid];
			}

			if(++done === todo) {
				if(fleetList[fid].fuel > fleetList[fid].maxFuel) {
					fleetList[fid].fuel = fleetList[fid].maxFuel;
				}

				console.log('Updated fleet ' + fleetList[fid].name);
				console.log('Fuel: ' + fleetList[fid].fuel);
				console.log('Max: ' + fleetList[fid].maxFuel);

				db.fleet.update({
					id: fleetList[fid].id,
					maxFuel: fleetList[fid].maxFuel,
					fuel: fleetList[fid].fuel,
				});
			}
		}
	}
});