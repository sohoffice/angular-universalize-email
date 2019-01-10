const {join} = require('path');
const fs = require('fs');

require(join(process.cwd(), 'node_modules', 'zone.js'));
require(join(process.cwd(), 'node_modules', 'zone.js/dist/zone-node'));
require(join(process.cwd(), 'node_modules', 'reflect-metadata'));
const {renderModuleFactory} = require(join(process.cwd(), 'node_modules', '@angular/platform-server'));
const {provideModuleMap} = require(join(process.cwd(), 'node_modules', '@nguniversal/module-map-ngfactory-loader'));
const inlineCss = require('inline-css');
const stripJs = require('strip-js');
const {sanitizeHtml} = require('./lib/sanitize-html');

const _converters = {
  'dashed': function (url) {
    return url.replace(/^\/+/gm, '')
      .replace(/\//gm, '-');
  },
  'camel': function (url) {
    const parts = url.replace(/^\/+/gm, '').split(/[\/-]/);
    let s = "";
    if (parts.length >= 1) {
      s += parts[0];
    }
    for (let i = 1; i < parts.length; i++) {
      if (parts[i].length > 0) {
        s += (parts[i][0].toUpperCase() + parts[i].substr(1));
      }
    }
    return s;
  }
};

const _reFilename = /^.*\{(dashed|camel)\}.*$/;
const _reFilenameToReplace = /\{(dashed|camel)\}/;

/**
 * Convert the url into a filename, according to the given pattern.
 *
 * The pattern support one variable to be substituted with url (after conversion)
 * The basic format is: `{dashed|camel}`
 *
 * @param pattern
 * @param url
 */
function urlToFilename(pattern, url) {
  const m = _reFilename.exec(pattern);
  let cv;
  if (m) {
    cv = _converters[m[1]];
  } else {
    console.error(`Not a supported filename pattern. ${pattern}, the conversion must be dashed or camel. dashed is used as a fallback.`);
    cv = _converters.dashed;
  }

  const converted = cv(url);
  return pattern.replace(_reFilenameToReplace, converted);
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
    console.log(`looking for ${name}: ${(name in bundle) ? 'Found' : 'Not found'}`);
    return (name in bundle);
  });
  if (found) {
    return bundle[found]
  }
}

/**
 * Use angular universal to generate one html.
 *
 * @param {object} args
 * @param {string} args.serverAsset The path that point to server asset directory, relative to current working directory.
 * @param {string} args.bundle The server bundle name, usually 'main'.
 * @param {string} args.moduleName The entry module of angular universal application, usually 'AppServerModule'
 * @param {string} args.browserAsset The path that point to browser asset directory, relative to current working directory.
 * @param {string} args.index The main html file of angular universal application, usually 'index.html'.
 * @param {string} args.url The routing path that point to the email to be generated.
 */
const processAngularUniversal = function (args) {
  const serverBundle = join(process.cwd(), args.serverAsset, args.bundle);
  const bundle = require(serverBundle);

  const {LAZY_MODULE_MAP} = bundle;
  const ngFactory = resolveModuleFactory(bundle, args.moduleName);
  const template = fs.readFileSync(join(process.cwd(), args.browserAsset, args.index)).toString();

  return renderModuleFactory(ngFactory, {
    document: template,
    url: args.url,
    extraProviders: [
      provideModuleMap(LAZY_MODULE_MAP)
    ]
  });
};

/**
 * Convert the html into an html that can be emailed.
 *
 * The below are performed:
 * - CSS are inlined.
 * - Html are sanitized.
 * - script tags are stripped.
 *
 * @param {object} args
 * @param {string} args.serverAsset The path that point to server asset directory, relative to current working directory.
 * @param {string} args.bundle The server bundle name, usually 'main'.
 * @param {string} args.moduleName The entry module of angular universal application, usually 'AppServerModule'
 * @param {string} args.browserAsset The path that point to browser asset directory, relative to current working directory.
 * @param {string} args.index The main html file of angular universal application, usually 'index.html'.
 * @param {string} args.url The routing path that point to the email to be generated.
 * @param {string} args.outputDir The directory where we put the generated html.
 * @param {string} args.pattern The pattern to generate output filename. Support one substitute variable to insert email routing URL.
 *                              The routing can be converted with either dashed or camel conversion method.
 * @param {string} [args.prepend] Optionally add text in the beginning of the generated file. The prepend text will be followed by line breaks.
 * @param {string} [args.convertTags] Optionally instruct the application to convert exotic tags. The value will be the new tag to be converted to.
 * @param {string} html The generated raw html file to be processed.
 */
const processEmailable = function (args, html) {
  const path = fs.realpathSync(args.browserAsset);

  console.log(`| Current directory: ${process.cwd()}.\n| Browser asset path: ${path}.\n| Output to: ${args.outputDir}`);
  const options = {
    removeStyleTags: true,
    removeLinkTags: true,
    removeHtmlSelectors: true,
    url: `file:///${path}/`
  };

  inlineCss(html, options)
    .then(function (html) {
      let fn = urlToFilename(args.pattern, args.url);
      const outputFile = join(args.outputDir, fn);
      console.log(`| Filename: ${fn}`);
      let result = stripJs(html);
      if (args.prepend!==null && typeof args.prepend !== 'undefined') {
        console.log(`| Prepend line: ${args.prepend}`);
        result = args.prepend + '\n\n' + result;
      }
      if (typeof args.convertTags === 'string') {
        result = sanitizeHtml(result, {
          replaceWith: args.convertTags
        });
      }
      fs.writeFileSync(outputFile, result);
    });
};

module.exports = {
  processAngularUniversal: processAngularUniversal,
  processEmailable: processEmailable
};