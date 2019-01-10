/**
 * A simple module to use regular expression to sanitize HTML tags by replacing exotic tags with <div />.
 * The purpose is to permit only the standard tags.
 */

const allowedTags = [
  'a', 'abbr', 'acronym', 'address', 'applet', 'area', 'article', 'aside', 'audio', 'b', 'base', 'basefont', 'bdi', 'bdo', 'big',
  'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'command', 'datalist', 'dd', 'del',
  'details', 'dfn', 'dir', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form', 'frame', 'frameset',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'iframe', 'img', 'input', 'ins',

  'kbd', 'keygen', 'label', 'legend', 'li', 'link', 'map', 'mark', 'menu', 'meta', 'meter', 'nav', 'noframes', 'noscript', 'object', 'ol',
  'optgroup', 'option', 'output', 'p', 'param', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section', 'select', 'small',
  'source', 'span', 'strike', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'time',
  'title', 'tr', 'track', 'tt', 'u', 'ul', 'var', 'video', 'wbr',
];

const TagKind = Object.freeze({
  Open: 1,
  Close: 2,
  SelfClose: 3
});

function _makeStripReplaceObject(replaces) {
  if (!replaces && replaces.length !== 3) {
    throw "illegal replace object";
  }

  const built = Object.keys(TagKind).reduce((obj, key) => {
    obj[TagKind[key]] = {
      replace: replaces[TagKind[key] - 1],
      strip: true
    };
    return obj;
  }, {});
  return Object.freeze(built);
}

const _dbReplace = _makeStripReplaceObject(["{{", "}}", "{{}}"]);
const _bReplace = _makeStripReplaceObject(['{', '}', '{}']);
const _dqReplace = _makeStripReplaceObject(['"', '"', '""']);
const _qReplace = _makeStripReplaceObject(["'", "'", "''"]);
const _aqReplace = _makeStripReplaceObject(['<', '>', '<>']);

/**
 * @typedef ReplaceWithTagData
 *
 * @property {string} tag The tag name
 * @property {TagKind|number} kind The kind of this tag. See [[TagKind]].
 */

/**
 * @typedef ReplaceWithAction
 *
 * @property {string} replace The new tag name to use.
 * @property {boolean} [strip] Should the tag be entirely replaced with the `replace`.
 *                             This means the &lt and &rt and anything in between will be replaced.
 */

/**
 * The default replace with rules, this should be applied before user defined rule.
 *
 * @type {Function<ReplaceWithTagData, ReplaceWithAction>[]}
 */
const DEFAULT_REPLACE_WITH_RULES = [
  function (tagData) {
    const lower = tagData.tag.toLowerCase();
    if (lower === "nue-db") {
      return _dbReplace[tagData.kind];
    } else if (lower === "nue-b") {
      return _bReplace[tagData.kind];
    } else if (lower === "nue-dq") {
      return _dqReplace[tagData.kind];
    } else if (lower === "nue-q") {
      return _qReplace[tagData.kind];
    } else if (lower === "nue-aq" || lower === "nue-ab") {
      return _aqReplace[tagData.kind];
    }
  }
];

/**
 * Try to find html tags. The following rules are used:
 *
 * - Whitespaces may or may not exist between < and the tag name.
 * - Tag name must start with letter, underscore (_) or colon (:)
 * - Tag name must only contain: numbers, letters, underscore(_), colon (:), period (.), dash (-)
 *
 * @type {{re: RegExp, kind: number}[]}
 */
const htmlTagRegularExpressions = [
  // open tag, it may have additional attributes and may span multiple lines.
  {
    re: /<\s*([a-zA-z_:][0-9a-zA-Z_:.-]+)[^>/]*>/m,
    kind: TagKind.Open
  },
  // self close tag, it may have additional attributes and may span multiple lines.
  {
    re: /<\s*([a-zA-z_:][0-9a-zA-Z_:.-]+)[^>/]*\/\s*>/m,
    kind: TagKind.SelfClose
  },
  // close tag
  {
    re: /<\s*\/([a-zA-z_:][0-9a-zA-Z_:.-]+\s*)>/,
    kind: TagKind.Close
  }
];

/**
 * Return a function that check whether a tag is allowed.
 *
 * @param {object} options
 * @param {string[]} [options.allowedTags] A list of additional allowed tags.
 *
 * @return {function<string, boolean>} A predicate that check whether the tagName is allowed.
 */
function createTagChecker(options) {
  const tags = allowedTags.concat(options.allowedTags).map(t => t.toLowerCase());
  return (tagName) => {
    const lower = tagName.toLowerCase();
    const res = tags.find(t => t === lower);
    return typeof res !== 'undefined' && res !== null;
  };
}

/**
 * Create a function to evaluate all rules and return the final tag.
 *
 * @param {object} options
 * @param {function({tag: string, kind: TagKind}): string} options.replaceWith A string to specify the tag to replace those that are not allowed.
 * Or a function that take the tagName as the sole parameter and return the desired tag.
 *
 * @return {function(ReplaceWithTagData): ReplaceWithAction}
 */
function createReplaceRule(options) {
  const rules = [].concat(DEFAULT_REPLACE_WITH_RULES, options.replaceWith);

  return function (tagData) {
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const res = rule(tagData);
      if (typeof res !== "undefined" && res !== null) {
        if (typeof res === "string") {
          return {
            replace: res
          };
        }
        return res;
      }
    }
  };
}

const defaultOptions = {
  allowedTags: [],
  replaceWith: function (opt) {
    return 'div';
  }
};

/**
 * Sanitize the input Html by replacing
 *
 * @param html The html to be sanitized.
 * @param [options]
 * @param {string[]} [options.allowedTags] A list of additional allowed tags.
 * @param {string|function<{tag: string, kind: TagKind}, string>} [options.replaceWith] A string to specify the tag to replace those that are not allowed.
 * Or a function that take the tagName as the sole parameter and return the desired tag.
 */
function sanitizeHtml(html, options) {
  const $opt = Object.assign({}, defaultOptions, options);
  if (typeof $opt.replaceWith === 'string') {
    // convert string style of replaceWith into a function.
    const savedReplaceWith = $opt.replaceWith;
    $opt.replaceWith = function (opt) {
      return savedReplaceWith;
    };
  }

  const checker = createTagChecker($opt);
  /**
   * @type {function(ReplaceWithTagData): ReplaceWithAction}
   */
  const replace = createReplaceRule($opt);

  let result = html;
  for (let i = 0; i < htmlTagRegularExpressions.length; i++) {
    let iterResult = '';
    // This is the string remain to be processed.
    let processing = result;
    let anyMatch = false;

    const {re, kind} = htmlTagRegularExpressions[i];
    while (res = re.exec(processing)) {
      const [matched, tagName] = res;
      const pos = res.index;

      iterResult += processing.substring(0, pos);
      if (checker(tagName)) {
        iterResult += matched;
      } else {
        // const replaceWith = $opt.replaceWith(tagName);
        const replaceWith = replace({tag: tagName, kind: kind});
        if (replaceWith.strip === true) {
          iterResult += replaceWith.replace;
        } else {
          iterResult += matched.replace(tagName, replaceWith.replace);
        }
      }
      // console.log(`Found ${matched}, iterResult: ${iterResult}`);
      processing = processing.substring(pos + matched.length);
      // console.log(`Processing to be: ${processing}`);

      anyMatch = true;
    }

    if (!anyMatch) {
      iterResult = result;
    } else {
      iterResult += processing;
    }

    // console.log(`Finish iteration: ${iterResult}`);
    result = iterResult;
  }

  return result;
}

module.exports = {
  sanitizeHtml: sanitizeHtml
};