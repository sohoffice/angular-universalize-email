Use angular universal to generate email templates
=================================================

angular-universalize-email is a small utility that allows an angular project to generate email templates using angular universal.

Basically you create emails just like you create any other angular pages. Don't worry about the styles and scripts, it will be taken care
by this utility.

The module heavily relies on [inline-css](https://www.npmjs.com/package/inline-css) and [strip-js](https://www.npmjs.com/package/strip-js) to work.

Prerequisites
-------------

1. The project must be an angular project.
2. The project must have added angular universal support
3. You have created your email templates using angular
4. These email templates must have routing defined.

To make life easier, I'll recommend you separate your primary angular project with your email template project. Most of the time,
the email pages are not needed by the primary angular project, so it's a good idea not to mix them together.

With angular 7+, it's as easy as executing the below to create a new sub-project.

    ng generate application <application name>

You will have to universalize this sub-project the same way you universalize the primary application. Check
[this guide](https://medium.com/@sohoffice/angular-universal-an-adventure-9d969d401072) should you require a reference.

Install
-------

    npm install angular-universalize-email --save-dev

An executable `angular-universalize-email` will be installed to your node_modules/.bin folder.
You may run the executable by explicitly refer to the path as `./node_modules/.bin/angular-universalize-email` or add it to your package.json as a script.

    "scripts": {
      ...
      "gen:email": "angular-universalize-email -a ./dist/foo-email -A ./dist/foo-email-server -o tmp -m EmailAppServerModule '/email/bar'"
    }

If you do not have scripts to build the email application yet, add the below to the scripts section:

    "scripts": {
      ...
      "build:email": "ng build --extract-css --project foo-email && ng run foo-email:server",
    }

The `--extract-css` is critical here, make sure you always use this flag or the `--prod` (which includes the extract-css flag).
When none of these flags are used, angular will be built in development mode which build the style into a js file. Obviously `inline-css` can not handle
the js.

Executing
---------

    # Supposed we have a `foo-email` sub application, and universalized as `foo-email-server`.
    # The email to generate is located in the routing '/email/bar'.
    angular-universalize-email -a ./dist/foo-email -A ./dist/foo-email-server -o tmp '/email/bar'

    # The output will be generated at tmp/email-bar.html

If you have renamed your server module, use -m to specify the module name.

    angular-universalize-email -a ./dist/foo-email -A ./dist/foo-email-server -o tmp -m EmailAppServerModule '/email/bar'

Write Templates
---------------

Theoretically the output can be used by as many template engines, here're a few examples.

If you want to use nue-extension tags (you mostly would), please follow the below nue-extension Tags section to setup.

#### scala template

    <mat-card>
      <div class="mat-card-header mat-primary mb-5">
        <img src="https://some.lo.go/" height="64" width="64">
      </div>

      <div class="mat-card-content">
        @if(anonymous) <nue-b>
            <p>Hi Guest:</p>
        </nue-b> else <nue-b>
            <p>Hi @user.name:</p>
        </nue-b>

        <p>Click the below link to verify your email.</p>

        <p>
          <a href="@link" mat-raised-button color="primary">Verify</a>
        </p>
      </div>
    </mat-card>

The `@user.name` and `@link` is where variable substitution happens.

@if(anonymous) is a conditional statement while &lt;nue-b&gt;&lt;/nue-b&gt; will be replaced by { and }.


nue-extension Tags
------------------

Some special characters will be escaped either by angular or by the template production pipelines.
In order to avoid this, the below extension tags are added to support these cases.

- nue-db => {{ and }}
- nue-b => { and }
- nue-dq => " and "
- nue-q => ' and '
- nue-ab => &lt; and &gt;
- nue-aq => &lt; and &gt;  (exactly the same as nue-ab)

To use these extension tags, you must first change your email application's Angular module:

    @NgModule({
      ...
      schemas: [
        CUSTOM_ELEMENTS_SCHEMA
      ]
    })

These extension tags can be placed inside templates, and usually used in pair. For example:

    <nue-db> user.name </nue-db>

    # this will produce:

    {{ user.name }}

Advanced usage
--------------

#### Prepend text

If you are generating email template for other framework, you may want to prepend some text before the generated html.

For example, to generated a template for play framework(java/scala), something similar to the below may be required:

    @(user: io.User, link: String)

In which case, use the --prepend argument to instruct angular-universalize-email to add such line in the beginning.

#### Filename pattern

The default filename is '{dashed}.html'. What does this mean exactly ?

The URL used to generate current template will be converted into dashed string. For example: /email/foo-bar will be converted
as `email-foo-bar`. This converted value is substituted into the pattern to make the result: `email-foo-bar.html`.

You may also use `camel` conversion, the same example will be converted into `emailFooBar.html`.

At the moment, dashed and camel are the only supported conversions.

Troubleshooting
---------------

#### TypeError: Cannot read property 'moduleType' of undefined

This means your email-server application name is incorrect. The default is AppServerModule, but you may have renamed the module.
Use `-m` flag to tell angular-universalize-email the entry module name of your email server application.

#### Missing most of the styles

You may not have built the email application with --extract-css flag. This is critical for inline-css to work.

#### My custom tags become div !

This is intentional, since non-standard tags are ignored by Gmail.
If you don't like this behavior, use the --no-convert-exotic-tags flag to turn this feature off.

#### My box-shadow is not working on Gmail

Some CSS styles are simply not supported by Gmail. To name a few: box-shadow, position, negative margins etc...

If your component use these styles, you'll have to get around it.
I've included a styles.css, which may be included in your styles.scss file like the below:

    @import "~angular-universalize-email/styles.css";

To use the styles, you'll also need to add `nue-email` to your top level element.

Don't expect too much, the only thing this style file provides is adding a border onto several material components, including .mat-card.
There is definitely a better way to do this, **any contributions is appreciated**.

#### My mat-button breaks my p

mat-button will be expanded into multiple elements, which includes several div. However, div can not exist inside p, that's why the display was broken.

    # The below buttons will be displayed in two rows, not side by side.
    <p>
      <a href="#" mat-button>Foo</a>
      <a href="#" mat-button>Bar</a>
    </p>

Try replace p with a div to fix the issue.

#### My mat-icons (or other icons) weren't showing.

I've tried both the SVG and iconfont approach in Gmail. Unfortunately, SVG tags were removed and iconfont was not loaded.
If you want to use icons, you may have to fallback to bitmap-based formats (png, jpg, etc.).

#### My template engine use braces.

See nue-extension Tags.


Command line options
--------------------

```
usage: angular-universalize-email [-h] [-v] -a BROWSERASSET -A SERVERASSET
                                  [--bundle BUNDLE] [--index INDEX]
                                  [-o OUTPUTDIR] [-m MODULENAME] [-p PATTERN]
                                  [-P PREPEND]
                                  url

angular-universalize-email, a small utility that allows an angular project to
generate email templates using angular universal.

Positional arguments:
  url                   The url path to generate current email.

Optional arguments:
  -h, --help            Show this help message and exit.
  -v, --version         Show program's version number and exit.
  -a BROWSERASSET, --asset BROWSERASSET
                        The directory contains the angular browser asset.
  -A SERVERASSET, --server-asset SERVERASSET
                        The directory contains the angular server asset.
  --bundle BUNDLE       The angular universal server bundle name, default to
                        `main`
  --index INDEX         The entry html filename, default to `index.html`
  -o OUTPUTDIR, --output-dir OUTPUTDIR
                        The output directory
  -m MODULENAME, --module-name MODULENAME
                        The email server module name. default to
                        `AppServerModule`.
  -p PATTERN, --pattern PATTERN
                        The output file pattern, url can be used as a
                        substitute variable. Example: `prefix-{dashed}.html`
                        or `{camel}.scala.html`. Currently only camel and
                        dashed conversion are supported.
  --prepend PREPEND     Additional text to be added in the beginning of
                        generated html. Useful if generated for other
                        framework.
  --convert-exotic-tags CONVERTTAGS
                        Convert non-standard tags with a standard one.
                        Default is `div`.
  --no-convert-exotic-tags
                        Do not convert non-standard tags. Note, they may be
                        skipped by some email clients.
```
