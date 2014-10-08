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

function findOutputFiles(sourceDir, cb) {
	var inodes = fs.readdir(sourceDir, filterRamlFiles);
	function filterRamlFiles(err, inodes) {
		if (err) { return cb(err); }

		var outputFiles = inodes.filter(function isFile(file) {
			var fullyQualifiedFilePath = path.join(sourceDir, file);

			return fs.statSync(fullyQualifiedFilePath).isFile()
				&& endsWithRaml(file);
		}).map(function convertToLink(file) {
			return file.replace(/raml$/, 'html');
		});

		return cb(null, outputFiles);
	}
}


module.exports = exports = {
	findRamlFiles: findRamlFiles,
	findOutputFiles: findOutputFiles
};