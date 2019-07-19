const http = require('http');
const path = require('path');

exports.safeRequireFEResources = (vbox, filename, dirname) => {
	try {
		filename = vboxFe.resolve(filename, dirname)
	} catch (error) {
		return ;
	}
	
	if (
		filename.endsWith('.js')
		|| filename.endsWith('.json')
	)
		return fs.readFile(filename)
	
	return vboxFe.require(filename, dirname)
}

const pathDict = exports.pathDict = {
	root: path.resolve(__dirname, '../../'),
	static: path.resolve(__dirname, '../../static'),
	node_modules: path.resolve(__dirname, '../../node_modules'),
}

exports.fHandlers = {
	root: http.fileHandler(pathDict.root),
	static: http.fileHandler(pathDict.static),
}