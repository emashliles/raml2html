'use strict';

var fs = require('fs');
var path = require('path');

function endsWithRaml(str) {
	return str.lastIndexOf('raml') === str.length - 4;
}

function isFile(filePath, filename) {
	var fullyQualifiedFilePath = path.join(filePath, filename);
	return fs.statSync(fullyQualifiedFilePath).isFile();
}

function findRamlFiles(searchDir, callback) {
	var inodes = fs.readdir(searchDir, filterRamlFiles);

	function filterRamlFiles(err, inodes) {
		if (err) { return callback(err); }

		var ramlFiles = inodes.filter(function isRamlFile(filename) {
			return endsWithRaml(filename) && isFile(searchDir, filename);
		});

		return callback(null, ramlFiles);
	}
}

function findRamlFilesSync(searchDir, callback) {
	var inodes = fs.readdirSync(searchDir);

	var ramlFiles = inodes.filter(function isRamlFile(filename) {
		return endsWithRaml(filename) && isFile(searchDir, filename);
	});

	return ramlFiles;
}


module.exports = exports = {
	findRamlFiles: findRamlFiles,
	findRamlFilesSync: findRamlFilesSync
};