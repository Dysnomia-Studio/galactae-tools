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

async function init() {
	const units = (await serverClient.query('SELECT * FROM units')).rows;
	console.log('UNITS:');
	console.log(JSON.stringify(units));
	console.log('');

	const fleets = (await serverClient.query('SELECT * FROM fleets')).rows;
	console.log('FLEETS:');
	console.log(JSON.stringify(fleets));
	console.log('');

	const tactics = (await serverClient.query('SELECT * FROM tactics')).rows;
	console.log('TACTICS:');
	console.log(JSON.stringify(tactics));
	console.log('');
}

db.connect(function(success,general=false) {
	if(!success) {
		log('Failed to connect to db ! Blocking user connections ...','warn');
		return;
	}

	if(general) {
		return;
	}

	init();
});