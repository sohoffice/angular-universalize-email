const {sanitizeHtml} = require('../lib/sanitize-html');

describe('sanitize-html', () => {

  it('should handle simple case', () => {
    const html = '<should-not-exist>Oh</should-not-exist>';
    const html2 = sanitizeHtml(html);

    expect(html2).toEqual('<div>Oh</div>');
  });

  it('should handle tag with attributes', () => {
    const html = '<foo class="abc" onclick="javascript:doSomething();"></foo>';
    expect(sanitizeHtml(html)).toEqual('<div class="abc" onclick="javascript:doSomething();"></div>')
  });

  it('should handle tag with whitespaces', () => {
    const html = ' < foo style="margin-right: 10px;">bar</foo>';
    expect(sanitizeHtml(html)).toEqual(' < div style="margin-right: 10px;">bar</div>')
  });

  it('should handle self closed tag', () => {
    const html = '<i-have-to-close-myself/>';
    expect(sanitizeHtml(html)).toEqual('<div/>');
  });

  it('should handle unclosed tags', () => {
    const html = '<foo class="size:1px"><bar></bar>';
    expect(sanitizeHtml(html)).toEqual('<div class="size:1px"><div></div>');
  });

  it('should handle nested tags', () => {
    const html = '<foo><bar></bar></foo>';
    expect(sanitizeHtml(html)).toEqual('<div><div></div></div>');
  });

  it('will not be bothered by additional >', () => {
    const html = '<foo>some > inside</foo>';
    expect(sanitizeHtml(html)).toEqual('<div>some > inside</div>');
  });

  it('should handle data with &lt;', () => {
    const html = '<foo>some &lt; inside</foo>';
    expect(sanitizeHtml(html)).toEqual('<div>some &lt; inside</div>');
  });

  it('should allow specified custom tags', () => {
    const html = '<foo></foo><bar></bar>';
    expect(sanitizeHtml(html, {
      allowedTags: ['foo']
    })).toEqual('<foo></foo><div></div>');
  });

  it('should support replaceWith option', () => {
    const html = '<foo></foo><bar></bar><baz></baz>';
    expect(sanitizeHtml(html, {
      replaceWith: function (tagData) {
        if (tagData.tag === 'foo') return 'span';
        if (tagData.tag === 'bar') return tagData.tag;
        return 'div';
      }
    })).toEqual('<span></span><bar></bar><div></div>');
  });

  it('should support replaceWith option in string style', () => {
    const html = '<foo></foo>';
    expect(sanitizeHtml(html, {
      replaceWith: 'span'
    })).toEqual('<span></span>');
  });

  it('should support nue:db tag replace', () => {
    const html = '<nue-db> something </nue-db>';
    expect(sanitizeHtml(html)).toEqual('{{ something }}');
  });

  it('should support nue:b tag replace', () => {
    const html = '<nue-b> something </nue-b>';
    expect(sanitizeHtml(html)).toEqual('{ something }');
  });

  it('should support nue:dq tag replace', () => {
    const html = '<nue-dq> something </nue-dq>';
    expect(sanitizeHtml(html)).toEqual('" something "');
  });

  it('should support nue:q tag replace', () => {
    const html = '<nue-q> something </nue-q>';
    expect(sanitizeHtml(html)).toEqual("' something '");
  });

  it('should support nue:aq and nue:ab tag replace', () => {
    const html = '<nue-aq><nue-ab> something </nue-ab></nue-aq>';
    expect(sanitizeHtml(html)).toEqual("<< something >>");
  });

  it('should handle slash in attributes', () => {
    const html = '<foo style="font:foo/font;"> something </foo>'
    expect(sanitizeHtml(html)).toEqual('<div style="font:foo/font;"> something </div>');
  })
});