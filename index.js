#! /usr/local/bin/node

require('dotenv').config();

const commandLineArgs = require('command-line-args');
const fs = require('fs');
const path = require('path');
const appRoot = require('app-root-path');
const changeCase = require('change-case')

const parameters = {
  in: { full: 'in', short: 'i' },
  out: { full: 'out', short: 'o' },
  name: { full: 'name', short: 'n' },
  prefix: { full: 'prefix', short: 'p' }
}

const boolValues = ['true', 'false'];

const options = commandLineArgs([
  createParameter(parameters.in),
  createParameter(parameters.out),
  createParameter(parameters.prefix),
  createParameter(parameters.name)
]);

const targetName = getOption(parameters.name) || 'sharedEnvironment';
const targetFileName = getOption(parameters.name) || 'base';
const prefix = getOption(parameters.prefix) || 'NG_';
const sourceFile = getOption(parameters.in) || path.join(appRoot.toString(), 'environment.json');
const filePath = getOption(parameters.out) || path.join(appRoot.toString(), 'src', 'environments', `${changeCase.paramCase(targetFileName)}.ts`);

const targetObject = fs.existsSync(sourceFile) ? JSON.parse(fs.readFileSync(sourceFile, 'utf-8').toString()) : {};

Object.keys(process.env).forEach(key => {
  if (key.startsWith(prefix) && key.length > prefix.length) {
    const value = process.env[key];
    if (!!value && value.length) {
      const propertyName = changeCase.camelCase(key.substr(prefix.length).toLowerCase());
      const boolValue = value.toLowerCase();
      targetObject[propertyName] = boolValues.includes(boolValue)
        ? boolValue === 'true'
        : value;
    }
  }
});

const serializedSettings = JSON.stringify(targetObject, null, '  ').replace(/\"/g, "'");
const fileContents = `export const ${targetName} = ${serializedSettings};\n\nexport default ${targetName};`;

const destinationPath = path.dirname(filePath);
if (!fs.existsSync(destinationPath)) {
  fs.mkdirSync(destinationPath, { recursive: true });
}

fs.writeFileSync(filePath, fileContents);

function createParameter(parameter) {
  return { name: parameter.full, alias: parameter.short, type: String };
}

function getOption(parameter) {
  return options[parameter.full];
}
