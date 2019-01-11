#!/usr/bin/env node

const {processAngularUniversal, processEmailable, processAngularUniversalHtml} = require('../index.js');

const printError = function (err) {
  console.error(err);
  process.exit(1);
};

const processFile = function (args) {
  const promise1 = processAngularUniversal(args);
  promise1.then(html => {
    if (args.debug) {
      console.log('Angular universal output:\n------\n\n', html, '\n\n------\n');
    }
    const html2 = processAngularUniversalHtml(html);
    processEmailable(args, html2);
  });
};

const ArgumentParser = require('argparse').ArgumentParser;

const parser = new ArgumentParser({
  version: '1.1.3',
  addHelp: true,
  description: 'angular-universalize-email, a small utility that allows an angular project to generate email templates using angular universal.'
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
    help: 'The angular universal server bundle name, default to `main`',
    defaultValue: 'main'
  }
);
parser.addArgument(
  ['--index'],
  {
    help: 'The entry html filename, default to `index.html`',
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
    help: 'The email server module name. default to `AppServerModule`.',
    dest: 'moduleName',
    defaultValue: 'AppServerModule'
  }
);
parser.addArgument(
  ['-p', '--pattern'],
  {
    help: 'The output file pattern, url can be used as a substitute variable. Example: `prefix-{dashed}.html` or `{camel}.scala.html`.\n' +
      'Currently only camel and dashed conversion are supported.',
    dest: 'pattern',
    defaultValue: '{dashed}.html'
  }
);
parser.addArgument(
  ['--prepend'],
  {
    help: 'Additional text to be added in the beginning of generated html. Useful if generated for other framework.',
    dest: 'prepend'
  }
);
parser.addArgument(
  ['--convert-exotic-tags'],
  {
    help: 'Convert non-standard tags with a standard one. Default is `div`.',
    dest: 'convertTags',
    defaultValue: 'div'
  }
);
parser.addArgument(
  ['--no-convert-exotic-tags'],
  {
    help: 'Do not convert non-standard tags. Note, they may be skipped by some email clients.',
    dest: 'convertTags',
    action: 'storeFalse'
  }
);
parser.addArgument(
  ['--debug'],
  {
    help: 'Print debug message to assist the diagnosis',
    dest: 'debug',
    defaultValue: false,
    action: 'storeTrue'
  }
);

parser.addArgument(
  'url', {
    help: 'The url path to generate current email.'
  }
);

const args = parser.parseArgs();
// console.dir(args);

processFile(args);

