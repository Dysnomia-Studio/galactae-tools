var builder = require('xmlbuilder');
var fs = require('fs');

var config = {
	// Number of elt
	quadrantCount: 4,
	sectorCount: [20,13,16,20],
	// Stars
	starsPerSys: {
		giant: { // https://en.wikipedia.org/wiki/Star#Distribution
			1: 0.3, 	// 33% ( Because there's not only BO Class => 20% )
			2: 0.95,	// 57.5%
			3: 1,		// 5%
		},
		dwarf: { // https://en.wikipedia.org/wiki/Star#Distribution
			1: 0.75,	// 75%
			2: 0.975,	// 22.5%
			3: 1,		// 2.5%
		},
	},
	starTypesRatios: {		
		// Sources:
		// https://en.wikipedia.org/wiki/Stellar_classification#Modern_classification
		// https://en.wikipedia.org/wiki/Star#Distribution
		// https://zestedesavoir.com/media/galleries/1093/7a61c625-2fa6-4022-82ad-01f0ca96f543.png.960x960_q85.png
		// http://www.ca-se-passe-la-haut.fr/2016/06/des-millions-de-trous-noirs-quasi.html
		// http://sboisse.free.fr/science/astronomie/images/type-spectral-etoile.jpg
		redDwarf: 			0.8, 	// 80% - Estimation réelle: 80%
		yellowDwarf: 		0.88,	// 8% - Estimation réelle: 7.6% 
		whiteDwarf: 		0.91,	// 3% - Estimation réelle: 2.76%
		brownDwarf: 		0.93,	// 2% - Estimation réelle: ?
		blueWhiteGiant: 	0.934,	// 0.4% - Estimation réelle: 0.13%
		blueGiant: 			0.9341,// 0.01% - Estimation réelle: 0.00003%
		redGiant: 			0.9361,// 0.2% - Estimation réelle: ?
		redSuperGiant: 		0.9366,// 0.05% - Estimation réelle: ?
		nebula: 			0.998,// ~6.2% - Estimation réelle: ?
		neutrons: 			0.9999,// 0.11% - Estimation réelle: ?
		blackHole: 			1,		// 0.01% - Estimation réelle: ~0.0001% (qq Millions sur 200 a 400Md)
	},
	// Planets
	planetPerSys: 5,
	planetPerSysVar: 10,
	planetTypesRatios: {
		// Sources:
		// https://www.nasa.gov/sites/default/files/images/718509main_lores.jpg
		// earth: 			0.23,		// 23%
		// superEarth: 	0.58,		// 35%
		// rare: 			0.585,		// 0.5%
		// smallGaz:		0.91,		// 32.5%
		// bigGaz: 		1,			// 9% 	

		earth: 			0.12, 		// 12%
		rockNoEarth: 	0.52, 		// 40%    			      		
		rare: 			0.525,		// 0.5%
		smallGaz:		0.90,		// 37.5%
		bigGaz: 		1,			// 10% 			    	
	},
	planetEarthCount: 1,
	planetRockNoEarthCount: 12,
	planetGazCount: 15,
	planetRare: [42,901],
	planetRareSize: [2.5,2.5],
}


function getStarList() {
	// L'array qui contient les etoiles
	var starList = [];

	// Generation de la premiere etoile
	var starType = Math.random();
	for(var index in config['starTypesRatios']) {
		if(starType<=config['starTypesRatios'][index]) {
			starList[0] = index;
			break;
		}
	}

	// Random du nombre d'etoiles
	var starCount = 1;
	var type = "";
	if(starList[0].substr(-5)=="Dwarf") {
		type = "dwarf";
	} else if(starList[0].substr(-5)=="Giant" && !(starList[0]=="redSuperGiant")) {
		type = "giant";
	}

	if(type != "") {
		var starCountRandom = Math.random();
		for(var index in config['starsPerSys'][type]) {
			if(starCountRandom <= config['starsPerSys'][type][index]) {
				starCount = parseInt(index);
				break;
			}
		}
	}

	// Generation des etoiles supplementaires si besoin
	for(var i=1; i<starCount; i++) {
		var newStarType = Math.random();
		var newType;

		for(var index in config['starTypesRatios']) {
			if(newStarType<=config['starTypesRatios'][index]) {
				newType = index;
				break;
			}
		}

		/*if(newType.substr(-5)==starList.substr(-5)) {
			starList.push(newType);
		} else {
			i--;
		}*/
		starList.push(newType);
	}

	return starList;
}

function getPlanetType(pos) {
	var random = Math.random();

	for(var index in config['planetTypesRatios']) {
		if(random<=config['planetTypesRatios'][index]) {
			var type = 0;
			var size = 0;

			switch(index) {
				case "earth":
					type = Math.ceil(Math.random()*config['planetEarthCount']);
					size = 0.5 + Math.random()*3;
					break;
				case "rockNoEarth":
					type = 100 + Math.ceil(Math.random()*config['planetRockNoEarthCount']);
					size = 0.5 + Math.random()*3;
					break;
				case "smallGaz":
					type = 500 + Math.ceil(Math.random()*config['planetGazCount']);
					size = 1 + Math.random()*3;
					break;
				case "bigGaz":
					type = 500 + Math.ceil(Math.random()*config['planetGazCount']);
					size = 3 + Math.random()*4;
					break;
				case "rare":
					var random2 = Math.floor(Math.random()*config['planetRare'].length);
					type = config['planetRare'][random2];
					size = config['planetRareSize'][random2];
					break;
				default:
					type = 0;
			}

			return {type: type, size: size, globalType: index};
		}
	}

	return;
}

/**
 * MAP BUILDER
 */

// Base Code
var xml = builder.create('galaxy');

for(var quadCurr=0; quadCurr<config['quadrantCount']; quadCurr++) {
	var quadrant = xml.ele('quadrant');
	quadrant.att("id",quadCurr);

	for(var secCurr=0; secCurr<config["sectorCount"][quadCurr]; secCurr++) {
		// Draw sector
		var sector = quadrant.ele('sector');
		sector.att("id",quadCurr + "-" + secCurr);

		// Randomize the system count
		var systemPos = [];
		var solCurr = 0;
		var retry = 0;
		while(true) {
			var x = Math.random() * 100;
			var y = Math.random() * 100;
			var incompatible = 0;

			for(var i=0; i<systemPos.length; i++) {
				if(Math.round(parseFloat(Math.abs(Math.sqrt(Math.pow(x - systemPos[i].x,2) + Math.pow(y - systemPos[i].y,2)))) * 100) < 300) {
					console.log('incompatible , coordonnées: ' + quadCurr + "-" + secCurr + "-" + solCurr);
					incompatible++;
					break;
				}
			}

			if(incompatible!=0) {
				retry++;

				if(retry>=2500 || systemPos.length > 500) {
					break;
				} else {
					continue;
				}
			}

			// Draw solar system
			var system = sector.ele('system');
			system.att("id",quadCurr + "-" + secCurr + "-" + solCurr);

			systemPos.push({x: x, y: y});

			system.att("x",x);
			system.att("y",y);

			// Randomize star type
			var starList = getStarList(); 
			for(var i=0; i<starList.length; i++) {
				var star = system.ele('star');
				star.att("id",quadCurr + "-" + secCurr + "-" + solCurr + "-S" + i);
				star.att("type",starList[i]);

				if(starList[i].substr(-10)=="superGiant") {
					star.att("size", 33 + 4*Math.random());
				} else if(starList[i].substr(-5)=="Giant") {
					star.att("size", 20 + 10*Math.random());
				} else if(starList[i].substr(-5)=="Dwarf") {
					star.att("size", 15*Math.random());
				}
			}
			
			// Randomize planet count
			var planetNmb = config["planetPerSys"] + Math.round(Math.random()*config["planetPerSysVar"]) - (config["planetPerSysVar"]/2);
			if(starList[0]=="blackHole" || starList[0]=="nebula" || starList[0]=="neutrons") {
				var planetNmb = 0;
			}

			var types = [];
			for(var plCurr=0; plCurr<planetNmb; plCurr++) {
				// Randomize planet type
				types[plCurr] = getPlanetType(i); 
			}

			// Tri
			types.sort(function(a,b) {
				if((a.globalType=="bigGaz" && b.globalType=="smallGaz") || (a.globalType=="smallGaz" && b.globalType=="bigGaz")) {
					return 0;
				} else if(b.globalType=="bigGaz") {
					return -1;
				} else {
					return 1;
				}
			});

			for(var plCurr=0; plCurr<planetNmb; plCurr++) {
				// Draw Planets
				var planet = system.ele('planet');
				planet.att("id",quadCurr + "-" + secCurr + "-" + solCurr + "-P" + plCurr);
				planet.att("type",types[plCurr].type);
				planet.att("gtype",types[plCurr].globalType);
				planet.att("size",types[plCurr].size);
			}

			solCurr++;
		}
	}
}
// End Code

// Save in file
fs.writeFile("out/" + Date.now() + ".xml", xml, function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
});