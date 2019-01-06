Use angular universal to generate email templates
=================================================

angular-universalize-email is a small utility that allows an angular project to easily generate email templates using angular universal.

Basically you create emails just like you create any other angular pages. Don't worry about the styles and scripts, it will be taken care
by the script.

Prerequisites
-------------

1. The project must be an angular project.
2. The project must have added angular universal support
3. You have created your email templates using angular
4. These email templates must have routing defined.

To make life easier, I'll recommend you separate your primary angular project with your email template angular project. Most of the time,
the emails are not needed by the primary angular project, so it's a good idea not to mix them together.

With angular 7+, it's as easy as executing the below to create a new sub-project.

    ng generate application <application name>

You can universalize this sub-project the same way you universalize the primary application. Check
[this guide](https://medium.com/@sohoffice/angular-universal-an-adventure-9d969d401072) should you require a reference.

Install
-------

    npm install angular-universalize-email --save-dev

Executing
---------

    # Suppose we have a foo-email sub application and universalized as foo-email-server.
    # The email to generate is located in the routing '/email/bar'.
    angular-universalize-email -a ./dist/foo-email -A ./dist/foo-email-server -o tmp '/email/bar'

Command line options
--------------------

```
usage: angular-universalize-email [-h] [-v] -a BROWSERASSET -A SERVERASSET
                                  [--bundle BUNDLE] [--index INDEX]
                                  [-o OUTPUTDIR]
                                  url

angular-universalize-email, a small utility that allows an angular project to
easily generate email templates using angular universal.

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
                        main
  --index INDEX         The entry html filename, default to index.html
  -o OUTPUTDIR, --output-dir OUTPUTDIR
                        The output directory
```