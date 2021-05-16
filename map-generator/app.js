const builder = require('xmlbuilder');
const fs = require('fs');

// gtype -> gt
// type -> t
// size -> sz
const config = {
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
		redDwarf: 			0.8, 	// 80.00% - Estimation réelle: 80.00%
		yellowDwarf: 		0.88,	//  8.00% - Estimation réelle:  7.60%
		whiteDwarf: 		0.91,	//  3.00% - Estimation réelle:  2.76%
		brownDwarf: 		0.93,	//  2.00% - Estimation réelle:  ?
		blueWhiteGiant: 	0.934,	//  0.40% - Estimation réelle:  0.13%
		blueGiant: 			0.9341, //  0.01% - Estimation réelle:  0.00003%
		redGiant: 			0.9361, //  0.20% - Estimation réelle:  ?
		redSuperGiant: 		0.9366, //  0.05% - Estimation réelle:  ?
		nebula: 			0.998,  //  6.14% - Estimation réelle:  ?
		neutrons: 			0.9999, //  0.19% - Estimation réelle:  ?
		blackHole: 			1,		//  0.01% - Estimation réelle: ~0.0001% (qq Millions sur 200 a 400Md)
	},
	// Planets
	planetPerSys: 5,
	planetPerSysVar: 10,
	planetPerSysSpecialDwarfs: 2,
	planetPerSysVarSpecialDwarfs: 4,
	planetTypesRatios: {
		// Sources:
		// https://www.nasa.gov/sites/default/files/images/718509main_lores.jpg
		// earth: 		0.23,		// 23%
		// superEarth: 	0.58,		// 35%
		// rare: 		0.585,		// 0.5%
		// smallGaz:	0.91,		// 32.5%
		// bigGaz: 		1,			// 9%

		earth: 			0.12, 		// 12%
		rockNoEarth: 	0.52, 		// 40%
		rare: 			0.521,		// 0.1%
		smallGaz:		0.90,		// 37.9%
		bigGaz: 		1,			// 10%
	},
	planetEarthCount: 9,
	planetRockNoEarthCount: 12,
	planetGazCount: 16,
	planetRare: [42,901],
	planetRareSize: [2.5,2.5],
	planetRareAdded: [0,0],
};

function getStarList() {
	// L'array qui contient les etoiles
	const starList = [];

	// Generation de la premiere etoile
	const starType = Math.random();
	for(const index in config['starTypesRatios']) {
		if(starType<=config['starTypesRatios'][index]) {
			starList[0] = index;
			break;
		}
	}

	// Random du nombre d'etoiles
	let starCount = 1;
	let type = '';
	if(starList[0].substr(-5)==='Dwarf') {
		type = 'dwarf';
	} else if(starList[0].substr(-5)==='Giant' && starList[0]!=='redSuperGiant') {
		type = 'giant';
	}

	if(type !== '') {
		const starCountRandom = Math.random();
		for(const index in config['starsPerSys'][type]) {
			if(starCountRandom <= config['starsPerSys'][type][index]) {
				starCount = parseInt(index, 10);
				break;
			}
		}
	}

	// Generation des etoiles supplementaires si besoin
	for(let i=1; i<starCount; i++) {
		const newStarType = Math.random();
		let newType;

		for(const index in config['starTypesRatios']) {
			if(newStarType<=config['starTypesRatios'][index]) {
				newType = index;
				break;
			}
		}

		if(newType === 'nebula' || newType === 'blackHole' || newType === 'neutrons') {
			i--;
			continue;
		}

		starList.push(newType);
	}

	return starList;
}

function getPlanetType() {
	const random = Math.random();

	for(const index in config['planetTypesRatios']) {
		if(random<=config['planetTypesRatios'][index]) {
			let type = 0;
			let size = 0;

			switch(index) {
			case 'rockNoEarth':
				type = 100 + Math.ceil(Math.random()*config['planetRockNoEarthCount']);
				size = 0.5 + Math.random()*3;
				break;
			case 'smallGaz':
				type = 500 + Math.ceil(Math.random()*config['planetGazCount']);
				size = 1 + Math.random()*3;
				break;
			case 'bigGaz':
				type = 500 + Math.ceil(Math.random()*config['planetGazCount']);
				size = 3 + Math.random()*4;
				break;
			case 'rare':
				const random2 = Math.floor(Math.random()*config['planetRare'].length);

				if(config['planetRareAdded'][random2] !== 1) {
					type = config['planetRare'][random2];
					size = config['planetRareSize'][random2];

					config['planetRareAdded'][random2] = 1;

					console.log('planete rare !');

					break;
				}
			default:
				type = Math.ceil(Math.random()*config['planetEarthCount'] - 1);
				size = 0.5 + Math.random()*3;
			}

			return {type: type, size: size, globalType: index};
		}
	}

	return;
}

/**
 * MAP BUILDER
 */
const scriptTime = Date.now();

if (!fs.existsSync('out/'+scriptTime)){
	fs.mkdirSync('out/'+scriptTime);
}

// Generate full system list
const systemPosGalaxy = [];
const systemPos = [];
let erreur = 0;
while(true) {
	const x = Math.random() * 100;
	const y = Math.random() * 100;

	let faux = false;

	// Distance aux etoiles
	for(let i=0; i<systemPosGalaxy.length; i++) {
		// Min distance: 4% of 1920*1080
		// Min distance: 0.166% of 26 000*26 000
		if(parseFloat(Math.sqrt(Math.pow(x - systemPosGalaxy[i].x,2) + Math.pow(y - systemPosGalaxy[i].y,2))) < 0.1) {
			//console.log('[' + quadCurr + "-" + x + "-" + y + '](' + solCurr + ') Systeme trop proche d\'un autre');
			faux = true;
		}
	}

	// Distance au centre galactique
	const dist = Math.sqrt((50 - x)*(50 -x)
						+ (50 - y)*(50 -y))/50;
	if(dist > 0.97 || (7.89*Math.pow(dist,3) - 12.13*Math.pow(dist,2) + 3.29*dist + 1.01) < Math.random()) { faux = true;	}

	if(faux) {
		erreur ++;
		console.log(systemPosGalaxy.length);
		if(erreur > 100) {
			break;
		} else {
			continue;
		}
	}

	erreur = 0;

	if(systemPos[Math.floor(x/10)] === undefined) { systemPos[Math.floor(x/10)] = []; }
	if(systemPos[Math.floor(x/10)][Math.floor(y/10)] === undefined) { systemPos[Math.floor(x/10)][Math.floor(y/10)] = []; }

	systemPos[Math.floor(x/10)][Math.floor(y/10)].push({x: Math.round(x*1000)/10000, y: Math.round(y*1000)/10000});
	systemPosGalaxy.push({x: x, y: y});
}

// Generate each XML
for(let XMLx=0; XMLx<10; XMLx++) {
	for(let XMLy=0; XMLy<10; XMLy++) {
		const xml = builder.create('sc');

		if(systemPos[XMLx] == undefined) { // That's a security
			systemPos[XMLx] = [];
		}
		if(systemPos[XMLx][XMLy] == undefined) { // That's a security
			systemPos[XMLx][XMLy] = [];
		}

		for(let currSystemID=0; currSystemID < systemPos[XMLx][XMLy].length; currSystemID++) {
			const currSystem = systemPos[XMLx][XMLy][currSystemID];

			// Draw solar system
			const system = xml.ele('sy');
			system.att('id',XMLx + '-' + XMLy + '-' + currSystemID);

			system.att('x',currSystem.x);
			system.att('y',currSystem.y);

			// Randomize star type
			const starList = getStarList();
			let star;
			for(let i=0; i<starList.length; i++) {
				star = system.ele('st');
				star.att('id',XMLx + '-' + XMLy + '-' + currSystemID + '-S' + i);
				star.att('t',starList[i]);

				if(starList[i].substr(-10)=='superGiant') {
					star.att('sz', Math.round(10000 * (33 + 4*Math.random()))/10000);
				} else if(starList[i].substr(-5)=='Giant') {
					star.att('sz', Math.round(10000 * (20 + 10*Math.random()))/10000);
				} else if(starList[i].substr(-5)=='Dwarf') {
					star.att('sz', Math.round(10000 * (15*Math.random()))/10000);
				}
			}

			// Randomize planet count
			let planetNmb;
			if(starList[0]=='blackHole' || starList[0]=='nebula' || starList[0]=='neutrons') {
				planetNmb = 0;
			} else if(star.length > 1 || (starList[0] != 'whiteDwarf' && starList[0] != 'brownDwarf')) {
				planetNmb = config['planetPerSys'] + Math.round(Math.random()*config['planetPerSysVar']) - (config['planetPerSysVar']/2);
			} else {
				planetNmb = config['planetPerSysSpecialDwarfs'] + Math.round(Math.random()*config['planetPerSysVarSpecialDwarfs']) - (config['planetPerSysVarSpecialDwarfs']/2);
			}

			let types = [];
			for(let plCurr=0; plCurr<planetNmb; plCurr++) {
				// Randomize planet type
				types[plCurr] = getPlanetType();

				// Prevent having twice the same planet
				for(let plScan=0; plScan<plCurr; plScan++) {
					if(types[plScan].type == types[plCurr].type) {
						plCurr--;
						break;
					}
				}
			}

			// Tri
			types.sort(function(a,b) {
				if((a.globalType==='bigGaz' && b.globalType==='smallGaz') || (a.globalType==='smallGaz' && b.globalType==='bigGaz')) {
					return 0;
				} else if(b.globalType==='bigGaz') {
					return -1;
				} else {
					return 1;
				}
			});

			for(let plCurr=0; plCurr<planetNmb; plCurr++) {
				// Draw Planets
				const planet = system.ele('p');
				planet.att('id',XMLx + '-' + XMLy + '-' + currSystemID + '-P' + plCurr);
				planet.att('t',types[plCurr].type);
				planet.att('gt',types[plCurr].globalType);
				planet.att('sz',Math.round(10000 * types[plCurr].size)/10000);

			}
		} // End of current sector

		fs.writeFile('out/' + scriptTime + '/' + XMLx + '-' + XMLy + '.xml', xml, function(err) {
			if(err) {
				return console.log(err);
			}

			console.log('A sector was saved!');
		});
	} //End sector Y
} // End sector X
