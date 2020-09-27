const { app, BrowserWindow } = require('electron');

const fs = require('fs');
const path = require('path');

function createWindow () {
	// Cree la fenetre du navigateur.
	const win = new BrowserWindow({
		width: 1920,
		height: 1080,
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true
		}
	});

	win.maximize();

	// et charger le fichier index.html de l'application.
	win.loadFile('index.html');
}

app.whenReady().then(createWindow);

const shipFilesList = fs.readdirSync(path.resolve(process.cwd(), './ships/'))
	.filter((elt) => elt.endsWith('.json'));

global.getShipList = () => {
	return shipFilesList.map((elt) => elt.substring(0, elt.length-5));
};

global.getShipData = (shipName) => {
	return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), './ships/' + shipName + '.json'), 'utf8'));
};

global.saveShipData = (shipName, shipData) => {
	shipData.partCount = shipData.svg.filter((elt) => elt[0] !== 'struct').length;
	fs.writeFileSync(path.resolve(process.cwd(), './ships/' + shipName + '.json'), JSON.stringify(shipData));
};