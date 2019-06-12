#! /usr/local/bin/node

require('dotenv').config();

const commandLineArgs = require('command-line-args');
const fs = require('fs');
const path = require('path');
const appRoot = require('app-root-path');
const changeCase = require('change-case')

const boolValues = ['true', 'false'];

const options = commandLineArgs([
  { name: 'out', alias: 'o', type: String },
  { name: 'in', alias: 'i', type: String },
  { name: 'name', alias: 'n', type: String },
  { name: 'prefix', alias: 'p', type: String },
]);

const targetName = options['name'] || 'sharedEnvironment';
const targetFileName = options['name'] || 'base';

const prefix = options['prefix'] || 'NG_';
const sourceFile = options['in'] || path.join(appRoot.toString(), 'environment.json');
const filePath = options['out'] || path.join(appRoot.toString(), 'src', 'environments', `${changeCase.paramCase(targetFileName)}.ts`);

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
