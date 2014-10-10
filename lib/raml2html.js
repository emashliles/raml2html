#!/usr/bin/env node

'use strict';

var raml2obj = require('raml2obj');
var handlebars = require('handlebars');
var marked = require('marked');
var program = require('commander');
var fs = require('fs');
var pjson = require('../package.json');
var renderer = new marked.Renderer();
var files = require('./files');
var path = require('path');
var async = require('async');

renderer.table = function(thead, tbody) {
    // Render Bootstrap tables
    return '<table class="table"><thead>' + thead + '</thead><tbody>' + tbody + '</tbody></table>';
};

function _markDownHelper(text) {
    if (text && text.length) {
        return new handlebars.SafeString(marked(text, { renderer: renderer }));
    } else {
        return '';
    }
}

function _lockIconHelper(securedBy) {
    if (securedBy && securedBy.length) {
        var index = securedBy.indexOf(null);
        if (index !== -1) {
            securedBy.splice(index, 1);
        }

        if (securedBy.length) {
            return new handlebars.SafeString(' <span class="glyphicon glyphicon-lock" title="Authentication required"></span>');
        }
    }

    return '';
}

function _emptyResourceCheckHelper(options) {
    if (this.methods || (this.description && this.parentUrl)) {
        return options.fn(this);
    }
}

function _parsePath(templateParam) {
    if (templateParam) {
        if (program.template.indexOf('.') == 0) {
            return process.cwd() + '/' + templateParam;
        }
        return templateParam;
    }
}

function render(source, config, onSuccess, onError) {
    config = config || {};
    config.protocol = config.https ? 'https:' : 'http:';
    config.raml2HtmlVersion = pjson.version;

    // Register handlebar helpers
    for (var helperName in config.helpers) {
        if (config.helpers.hasOwnProperty(helperName)) {
            handlebars.registerHelper(helperName, config.helpers[helperName]);
        }
    }

    // Register handlebar partials
    for (var partialName in config.partials) {
        if (config.partials.hasOwnProperty(partialName)) {
            handlebars.registerPartial(partialName, config.partials[partialName]);
        }
    }

    raml2obj.parse(source, function(ramlObj) {
        ramlObj.config = config;
        var result = config.template(ramlObj);

        if (config.processOutput) {
            config.processOutput(result, onSuccess, onError)
        } else {
            onSuccess(result);
        }
    }, onError);
}

function parseRaml(source, cb) {
    function onError(err) {
        console.log('Error parsing the RAML %s', err);
        return cb(err);
    }
    function onSuccess(result) {
        // result will be the `ramlObj`
        console.log('Successfully parsed the RAML');
        return cb(null, result);
    }
    console.log('About to parse the RAML');
    raml2obj.parse(source, onSuccess, onError);
}

function getDefaultConfig(https, mainTemplate, resourceTemplate, itemTemplate) {
    return {
        'https': https,
        'template': require(mainTemplate || './template.handlebars'),
        'helpers': {
            'emptyResourceCheck': _emptyResourceCheckHelper,
            'md': _markDownHelper,
            'lock': _lockIconHelper
        },
        'partials': {
            'resource': require(resourceTemplate || './resource.handlebars'),
            'item': require(itemTemplate || './item.handlebars')
        },
        processOutput: function(data, onSuccess, onError) {
            data = data.replace(/&quot;/g, '"');

            var Minimize = require('minimize');
            var minimize = new Minimize();

            minimize.parse(data, function(error, result) {
                if (error) {
                    onError(error);
                } else {
                    onSuccess(result);
                }
            });
        }
    };
}


if (require.main === module) {
    program
        .usage('[options] [RAML input file]')
        .version(pjson.version)
        .option('-i, --input [input]', 'RAML input file')
        .option('-I, --inputDir [input]', 'Directory containing RAML input files')
        .option('-s, --https', 'Use https links in the generated output')
        .option('-o, --output [output]', 'HTML output file')
        .option('-O, --outputDir [output]', 'HTML output files directory')
        .option('-t, --template [template]', 'Path to custom template.handlebars file')
        .option('-r, --resource [resource]', 'Path to custom resource.handlebars file')
        .option('-m, --item [item]', 'Path to custom item.handlebars file')
        .parse(process.argv);

    var input = program.input;
    var inputDir = program.inputDir;

    var inputFiles;
    var outputFiles = [program.output];

    if (program.input) {
        inputFiles = [program.input];
    } else if (program.args.length === 1) {
        inputFiles = [program.args[0]];
    } else if (inputDir) {
        inputFiles = files.findRamlFilesSync(inputDir);
        outputFiles = inputFiles.map(function(file) {
            return path.join(program.outputDir, file.replace(/raml$/, 'html'));
        });
    } else {
        console.error('Error: You need to specify the RAML input file');
        program.help();
        process.exit(1);
    }

    var https = program.https ? true : false;
    var mainTemplate = _parsePath(program.template);
    var resourceTemplate = _parsePath(program.resource);
    var itemTemplate = _parsePath(program.item);


    async.map(inputFiles, function processFile(file, cb) {
        // DO something asynchronously with "file" and use "cb" as the calback when you're done
        console.log('Processing File Name : ' + file);
        var inputFilePath = path.join(inputDir, file);
        console.log('InputDir = ' + inputDir);
        console.log('Processing File Full Path : ' + inputFilePath);

        parseRaml(inputFilePath, cb);

    }, function processMasterRAML(err, results) {
        // "err" is defined if any of the asynchronous operations on the files errored

        // "results" is an array of ramlObjs for each of the operations

        console.log('Error: %s', err);
        console.log('Results: %s', results);
    });










/*
       async.each(inputFiles, function (inputFile ,masterRamlObject,cb){

            console.log('Processing File Name : ' + inputFile);

            var iterationNumber = inputFiles.indexOf(inputFile);

            var inputFilePath = path.join(inputDir, inputFiles[iterationNumber]);

            var outputFile = outputFiles[iterationNumber];

            console.log('Output File = ' + outputFile);

            console.log('InputDir = ' + inputDir);

            console.log('Processing File Full Path : ' + inputFilePath);

            parseRaml(inputFilePath, function cb(err, result){
              if(err){
                return console.log('There was a bit of a problem: ', err);
                }

                masterRamlObject.push(result);  
                console.log('Possible raml = '+ result);
                

            });

            console.log("Master Object with stuff in", masterRamlObject.length);

            async.each(masterRamlObject, function(ramlObject, cb){
                console.log('Hopefully this is a raml object' + ramlObject);
            });

            render(inputFilePath, getDefaultConfig(https, mainTemplate, resourceTemplate, itemTemplate), function(result) {
                console.log("Converting '" + inputFilePath + "' to '" + outputFile + "'");
                if (outputFile) {
                    fs.writeFileSync(outputFile, result);
                } else {
                    // Simply output to console
                    process.stdout.write(result);
                    process.exit(0);
                }
            }, function(error) {
                console.log('Error parsing: ' + error);
                process.exit(1);
            });



       });

    */

           // parseRaml

            // Start the rendering process
            
    



    // for (var i = 0; i < inputFiles.length; i++) {
    //     (function(i) {
    //         var inputFile = path.join(inputDir, inputFiles[i]);
    //         var outputFile = outputFiles[i];

    //        // parseRaml

    //         // Start the rendering process
    //         render(inputFile, getDefaultConfig(https, mainTemplate, resourceTemplate, itemTemplate), function(result) {
    //             console.log("Converting '" + inputFile + "' to '" + outputFile + "'");
    //             if (outputFile) {
    //                 fs.writeFileSync(outputFile, result);
    //             } else {
    //                 // Simply output to console
    //                 process.stdout.write(result);
    //                 process.exit(0);
    //             }
    //         }, function(error) {
    //             console.log('Error parsing: ' + error);
    //             process.exit(1);
    //         });
    //     })(i);
    // };
}


module.exports.getDefaultConfig = getDefaultConfig;
module.exports.render = render;