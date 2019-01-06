#!/usr/bin/env node
const {join} = require('path');
const fs = require('fs');

require(join(process.cwd(), 'node_modules', 'zone.js'));
require(join(process.cwd(), 'node_modules', 'zone.js/dist/zone-node'));
require(join(process.cwd(), 'node_modules', 'reflect-metadata'));
const {renderModuleFactory} = require(join(process.cwd(), 'node_modules', '@angular/platform-server'));
const {provideModuleMap} = require(join(process.cwd(), 'node_modules', '@nguniversal/module-map-ngfactory-loader'));

const ArgumentParser = require('argparse').ArgumentParser;
const inlineCss = require('inline-css');
const stripJs = require('strip-js');

function urlToFilename(url) {
  return url.replace(/^\/+/gm, '')
    .replace(/\//gm, '-');
}

function resolveModuleFactory(bundle, moduleName) {
  let moduleNames;
  if (typeof moduleName !== "undefined") {
    moduleNames = [
      `${moduleName}NgFactory`,
      `${moduleName}ModuleNgFactory`,
      `${moduleName}ServerModuleNgFactory`,
      `${moduleName}AppServerModuleNgFactory`
    ]
  } else {
    moduleNames = [
      'AppServerModuleNgFactory'
    ];
  }
  const found = moduleNames.find(name => {
    console.log(`looking for ${name}: ${name in bundle}`);
    return (name in bundle);
  });
  if (found) {
    return bundle[found]
  }
}

const printError = function (err) {
  console.error(err);
  process.exit(1);
};

const processFile = function (args) {
  const promise1 = processFile1(args);
  promise1.then(html => {
    processFile2(args, html);
  });
};

const processFile1 = function (args) {
  const serverBundle = join(process.cwd(), args.serverAsset, args.bundle);
  const bundle = require(serverBundle);

  const {LAZY_MODULE_MAP} = bundle;
  const ngFactory = resolveModuleFactory(bundle, args.moduleName);
  const template = fs.readFileSync(join(args.browserAsset, args.index)).toString();

  return renderModuleFactory(ngFactory, {
    document: template,
    url: args.url,
    extraProviders: [
      provideModuleMap(LAZY_MODULE_MAP)
    ]
  });
};

const processFile2 = function (args, html) {
  const path = fs.realpathSync(args.browserAsset);

  console.log(`Current directory: ${process.cwd()}, path: ${path}, output: ${args.outputDir}`);
  const options = {
    removeStyleTags: true,
    removeLinkTags: true,
    url: `file:///${path}/`
  };

  inlineCss(html, options)
    .then(function (html) {
      const outputFile = join(args.outputDir, urlToFilename(args.url) + '.html');
      console.log(`Output to ${outputFile}`);
      const stripped = stripJs(html);
      fs.writeFileSync(outputFile, stripped);
    });
};

const parser = new ArgumentParser({
  version: '0.0.1',
  addHelp: true,
  description: 'angular-universalize-email, a small utility that allows an angular project to easily generate email templates using angular universal.'
});
parser.error = printError;

parser.addArgument(
  ['-a', '--asset'],
  {
    help: 'The directory contains the angular browser asset.',
    dest: 'browserAsset',
    required: true
  }
);
parser.addArgument(
  ['-A', '--server-asset'],
  {
    help: 'The directory contains the angular server asset.',
    dest: 'serverAsset',
    required: true
  }
);
parser.addArgument(
  ['--bundle'],
  {
    help: 'The angular universal server bundle name, default to main',
    defaultValue: 'main'
  }
);
parser.addArgument(
  ['--index'],
  {
    help: 'The entry html filename, default to index.html',
    defaultValue: 'index.html'
  }
);
parser.addArgument(
  ['-o', '--output-dir'],
  {
    help: 'The output directory',
    dest: 'outputDir',
    defaultValue: '.'
  }
);
parser.addArgument(
  ['-m', '--module-name'],
  {
    help: 'The email server module name. default to AppServerModule.',
    dest: 'moduleName',
    defaultValue: 'AppServerModule'
  }
);
parser.addArgument(
  'url', {
    help: 'The url path to generate current email.'
  }
);

const args = parser.parseArgs();
console.dir(args);

processFile(args);

