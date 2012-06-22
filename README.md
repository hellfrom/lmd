LMD: Lazy Module Declaration
==============================================

Big JavaScript application cause huge startup latency. A 1Mb of JavaScript initializes about ~600-3000ms! without
touching any part of DOM. LMD is inspired by AMD and provides similar module interface. It evals module only when
they are required. LMD is "Yet Another Loader" with all loader features: js, css, parallel... Why LMD?
- it can initialize modules when they are required, it tiny and flexible (minimal only 288bytes and up to 1.5kb
all-in-one), you can write your modules as Node.js without define or require wrappers, and more...

Features
--------

1. Modules are similar to AMD: there is a require, but no define
2. LMD does not create globals
3. LMD is standalone, tiny and flexible (minimal only 288bytes! and up to 1.5Kb all-in-one)
4. Each function-module can be initialized/evaled on demand (`lazy: true`)
5. LMD module is as easy to debug as normal JavaScript file
6. Build system compresses JavaScript files using UglifyJs (or any other)
7. LMD module can define object via return or module.exports/exports as CommonJS Module
8. Module can be wrapped automatically in builder so you can write your modules as node.js modules (see Usage and Asynchronous module require)
9. Starting from version 1.5.2 LMD can require off-package modules `"async": true` (see Asynchronous module require)
10. From version 1.6.0 LMD can cache all in-package modules in localStorage `"cache": true` (see Local Storage cache)
11. From version 1.6.2 LMD can include off-package css `css: true` and js-files `js: true`(for jsonp, cross-origin JS or non LMD modules)
12. LMD package is possible to run as Web Worker or execute as Node.js script (see Web Worker and Node.js)
13. LMD works in all modern browsers and in older IE (see Browsers support)
14. Ready for production - `lmd.js` is 100% covered by unit tests see `test/README.md` for details

Installing
----------

`npm install lmd` or global `npm install lmd -g`

LMD Modules
-----------

**1\.1\. Module - functions**

*main.js - module as function declaration*

```javascript
function main(require) {
    var print = require('depA'),
        i18n = require('i18n'),
        $ = require('$'); // grab module from globals: LMD version 1.2.0

    var text = i18n.hello +  ', lmd';

    print(text);

    $(function () {
        $('#log').text(text);
    });
}
```

*depA.js - module as function expression*

```javascript
(function (require/*, exports, module*/) {
    var escape = require('depB');
    return function(message) {
        console.log(escape(message));
    }
})
```

*depB.js - module as plain code like Node.js*

```javascript
// @globals require module exports
// CommonJS Module exports
// or exports.feature = function () {}
module.exports = function(message) {
    return message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};
```

**Note**:
 - plain module will be wrapped by builder `(function (require, exports, module) {\n%code%\n})`
 - you can require plain off-package modules by declaring one of flags `async_plain` or `async_plainonly`

**1\.2\. Module - objects (for config, i18n and other resources)**

*i18n.ru.json*

```javascript
{
    "hello": "Привет"
}
```

**1\.3\. Module - string (for templates)**

```html
<i class="b-template">${content}</i>
```

Config file
-----------

**index.production.lmd.json**

```javascript
{
    "path": "../modules/", // if starts with "/" it is absolute path else path will be relative to the config file
    "modules": {
        // basic module descriptor -- only path
        "main": "main.js",     // "module_pseudonym": "module_file"
        "depA": "depA.js",     // require("module_pseudonym").doModuleStuff()

        // extended module descriptor
        "depB": {
            "path": "depB.js",
            "sandbox": true,    // module is sandboxed - can't require
            "lazy": false,      // overloading of global lazy flag, for the purpose of load optimizing
                                // dont work with global cache flag
        },

        // string template
        "template": "templates/template.html"
        
        "i18n": "i18n.ru.json",

        // shortcuts for require.async("abstract_name") or .js() or .css()
        "abstract_name": "@/path/to/real-file.js"
    },
    "main": "main",         // a main module - content of that module will be called on start (no reason to eval)
    "lazy": false,          // if true - all modules will be evaled on demand [default=true]
    "pack": false,          // if true - module will be packed using uglifyjs [default=true]
    "global": "this",       // name of global object, passed to the lmd [default="this"]

    "async": true,          // if modules uses off-package module set this to true [default=false]
    "async_plain": true,    // enables async require of both plain and function-modules [default=false]
    "async_plainonly":true, // if you are using only plain modules enable that flag instead of async_plain [default=false]

    "cache": true,          // store all application lmd itself + all modules in localStorage
                            // this flag will force all modules to be lazy [default=false]
    "cache_async": true,    // depend on cache flag, enables localStorage cache for require.async() [default=false]

    "js": true,             // if you are going to load non LMD modules set this flag to true [default=false]
    "css": true,            // enables css-loader feature `require.css` [default=false]

    "worker": true,         // set true if LMD package will run as worker [default=false]
    "node": true,           // set true if LMD package will run as node.js script [default=false]
    "ie": true,             // set false if script will run only in modern browsers [default=true]
    "race": true,           // set true if you are performing parallel loading of the same resource [default=false]
    "parallel": true,       // enables parallel loading [default=false]
                            // - if you are using parallel loading you are doing something wrong...
                            // - resources will be executed in **load order**! And passed to callback in list order

    "shortcuts": true,      // enables shortcuts in LMD package [default=false]

    "stats": true,          // enables require.stats() function - every module require, load, eval, call statistics [default=false]
    "stats_coverage": true, // enables code coverage for all in-package modules, you can use list of module names
                            // to cover only modules in that list [default=false]
    "stats_sendto": true    // enables require.stats.sendTo(host[, reportName]) function
                            // it POSTs stats&coverage report to specified stats server
}
```

**index.development.lmd.json**

```javascript
{
    "path": "../modules/",
    "modules": {
        "depB": {              // extended module descriptor
            "path": "depB.js",
            "sandbox": true    // module is sandboxed
        },
        "*": "*.js",           // use wildcards or specify regex string to grep 
        "i18n": "i18n.ru.json" // similar files (no dir wildcards supported by now)
    },
    "main": "main",
    "lazy": false,
    "pack": false,
    "async": true,
    "js": true,
    "css": true
}
```

You can extend config file with another using `"extends": "path/to/file.lmd.json"` parameter

Build
-----

`lmd examples/basic/cfgs/index.development.lmd.json examples/basic/out/index.development.lmd.js` or `node ./lmd/bin/lmd.js ... `

Or print to `STDOUT`

`lmd example/cfgs/index.development.lmd.json`

Use
---

**index.development.lmd.js**

```javascript
(function (window) {
    /* ... LMD content ... */
}(window))({
"depA": function depA(require){
    return function(message) {
        console.log(message);
    }
}
})(function main(require) {
    var depA = require('depA');
    depA('ololo');
})
```

**index.production.lmd.js**

```javascript
(function(a){/* ... LMD content ... */})(window)
({depA:"(function(a){return function(a){console.log(a)}})"})
(function(b){var c=b("depA");c("ololo")})
```

Asynchronous module require. Flags: `async`, `race`, `cache_async`, `async_plain`, `async_plainonly`
------------------------------------------

You can build async LMD package.  (Disabled by default)

Then your packages can require off-package modules from http server.
Build LMD package using `async: true` flag. LMD loader now can require javascript FunctionsExpressions,
JSON or template strings asynchronously. LMD parses file content depend on `Content-type` header.
You must work online using HTTP server for correct headers, if you work offline (using `file:` protocol)
then `Content-type` header will be INVALID so all modules will be strings.

**Notice**
 - See "Web Worker and Node.js" if your package will run as worker or node script
 - If you use `file:` protocol then all modules will be strings
 - LMD loader uses simple RegExp `/script$|json$/` with `Content-type` to determine the kind of content
and eval it (if json or javascript) or return as string
 - If all you modules are in-package then set `async` flag to false (300 bytes less)
 - If async require fails (status code will be >= 400) loader will return `undefined`
   (LMD doesn't re-request on error)
 - If you are performing parallel loading of the same resource add `race: true` (Disabled by default)
   flag to prevent duplication of requests.
 - You can set both flags `cache` and `cache_async` to true to enable localStorage cache for `require.async()`
   (see Local Storage cache)
 - You can require plain off-package modules by declaring one of flags `async_plain` or `async_plainonly`

```javascript
// Valid
(function (require, exports, module) {
    /* Module content */
})

// Invalid! - parse error in loader's eval
function (require, exports, module) {
    /* Module content */
}

// Bad but valid: module name will leak in global variables
function module(require, exports, module) {
    /* Module content */
}
```

**Example**

```javascript
(function main(require) {

    // async require of off-package module
    require.async('/css/_engine.css', function (css) {
        console.log('1', css.length); // result

        // require of module loaded async (already registered)
        console.log('2', require('/css/_engine.css').length);

        // require of in-package module
        console.log('3', require('pewpew'));
    });

    // async require of in-package module
    require.async('pewpew', function (pewpew) {
        console.log('4', pewpew);
    });
})
```

See `example/modules/main.js` near `async_template.html` for real life example

Local Storage cache. Flags: `cache`, `cache_async`, Property: `version`
-------------------------------------------------------

You can store all your in-package modules and lmd itself in localStorage. (Disabled by default)

1. Set config flag `cache: true` and add `version: your_current_build_version` property to your
config file then build your LMD package - it will be created in cache mode. If no version - LMD package will run
in default mode - without dumping modules
2. Set config flag `cache_async: true` to cache `require.async()` requests in localStorage too
3. Remove script tag `<script src="out/index.production.lmd.js" id="source"></script>` with LMD initializer:

```html
<script id="lmd-initializer"
        src="../src/lmd_initializer.min.js"
        data-src="out/index.production.lmd.js"
        data-version="1.6.0"
        data-key="lmd"></script>
```

 - `id` - always lmd-initializer (do not change it)
 - `src` - path to `lmd_initializer.js`
 - `data-key` - localStorage key where all lmd code stored (do not change it)
 - `data-version` - content in localStorage must match this version
 - `data-src` - fallback if version do not match or no localStorage or error or no content

See `example/cfgs/index.prodoction.lmd.json` and `example/index.html` for details

**Note**: `version` property from config and from `data-version` attribute must match to use code from localStorage!
Yep! Each time you have to change config file and your html file!

Loading CSS and JavaScript files. Flags: `js`, `css`, `race`
----------------------------------------------------

You can enable flags `css: true` and `js: true` to use css and js loader as all loaders do. (Disabled by default)

**Notice**
 - See "Web Worker and Node.js" if your package will run as worker or node script
 - If you are performing parallel loading of the same resource add `race: true` (Disabled by default)
   flag to prevent duplication of requests.

```javascript
// require some off-package javascript file - not a lmd module. Config flag: `js: true`
require.js('./vendors/jquery.someplugin.js', function (scriptTag) {
    console.log(typeof scriptTag === "undefined" ? 'error' : 'js loaded');
});

// require some off-package css file. Config flag: `css: true`
require.css('./css/b-template.css', function (linkTag) {
    console.log(typeof linkTag === "undefined" ? 'error' : 'css loaded');
})
```

Web Worker and Node.js. Flags: `node`, `worker`
-----------------------------------------------

You can use LMD in-package modules (`require()`) in worker and run it as node script without any config changes.
But if you are going to use `require.async()` or `require.js()` you should add `worker: true` or/and `node: true` config
flags. `require.css()` in node or worker environment acts like `require()`

 - `require.async()` in Worker environment works exactly the same as in browser environment
 - `require.async()` in Node uses `fs.readFile()` to read file and evals/returns file content depend on file extension
 - `require.js()` in Worker acts like `importScripts()` and call back an empty object `{}`
 - `require.js()` in Node acts like Node.js `GLOBALS.require()` and returns `module.exports` object from node module
 - `require.css()` in both environments acts like LMD `require()`

Run tests or see `example/modules/main.js` near `workerDepA` and `example/modules/workerDepA.js` for details

Browsers support. Flag: `ie`
----------------------------

LMD works in all modern browsers and in older IE. If LMD package will run only in modern browsers turn off `ie: false`
config flag to optimise lmd source for modern browsers (removes few IE hacks)

Tested on Opera 11.63, Chrome 17, Safari 5, IE 6+, Firefox 12, iOS Safari 5, to be updated...

Shortcuts. Flag `shortcuts`
---------------------------

You can define flag `shortcuts: true` to enable shortcuts in LMD package. Then you can use short names instead of full paths.
Symbol `@` indicates that module content is shortcut.

```javascript
{
    "modules": {
        "some-json": "@/path/to/file.json",
        "jquery": "@http://yandex.st/jquery/1.7.1/jquery.min.js",
    }
}
```

```javascript
// old way...
require.async("/path/to/file.json", function () {});

// its the same as above, but much abstract and short
require.async("some-json", function (data) {
    console.log('data');
});

require.js("jquery", function () {
    require('$').ready(function () {
        // do your stuff
    });
});
```

Application statistics. Require, load, eval, call statistics. Flag: `stats`
---------------------------------------------------

You can dump your application/package statistics to analise numbers: load+eval+call time and requires count

```javascript
var $ = require('$');

// You can check one module statistics
require.async('module_shortcut', function (Module) { // module_shortcut: module.js
    require.stats('module.js');
    /*
    {
        name: 'module.js',
        initTime: 31, // init time: load+eval+call
        accessTimes: [10], // list of module access times, 10 ms from app start
        shortcuts: ['module_shortcut'] // list of shortcuts [optional]
    }
    */
});

// Or for example dump all application module statistics

// 1. Get usage stats
var stats = require.stats();
/*
{
    "$": {
        name : "$",
        initTime: 0,
        accessTime: [3]
    },
    'module.js': {
        name: 'module.js',
        initTime: 31, // init time: load+eval+call
        accessTimes: [10], // list of module access times, 10 ms from app start
        shortcuts: ['module_shortcut'] // list of shortcuts pointed to this module [optional]
    },
    'module_shortcut': { // === same object as 'module.js'
        name: 'module.js',
        initTime: 31, // init time: load+eval+call
        accessTimes: [10], // list of module access times, 10 ms from app start
        shortcuts: ['module_shortcut'] // list of shortcuts pointed to this module [optional]
    }
}
*/

// 2. Push stats to server
$.post('/lmd-stats', JSON.stringify(stats));

// Or enable `stats_sendto` to post to stats server
require.stats.sendTo('http://localhost:8081'); // you may specify report_name too
```

Code coverage. Flag: `stats`, `stats_coverage`, `stats_sendto`
-------------------------------------------------------------

Add `stats_coverage` flag to your config file or use list of module names to cover only them. Rebuild your package.
Now you can see coverage report in `require.stats()` object. See `src/plugin/stats.js:46` for more information.

You may also enable `stats_sendto` flag to push your reports to the Stats Server.

```javascript
require.stats.sendTo('http://localhost:8081'); // you may specify report_name too
```

*How it work*
 1. LMD patches your source files with coverage functions
 2. User is running application and script executes coverage functions to calculate coverage
 3. Your source executes `require.stats.sendTo(your_lmd_stats_server_server)` and send report to the server
 4. Then you open Stats Server Admin interface to see reports

*Note*
 - if you are using function-modules you have to name your require as require at that moment...
 - sandboxed module under CC will accept an object as require with coverage functions instead of undefined
 - LMD cannot apply code coverage on async modules now (in future versions only)

Stats server
------------

Stats server provides simple coverage and usage reports

![](http://github.com/azproduction/lmd/raw/master/images/coverage_package.png)

![](http://github.com/azproduction/lmd/raw/master/images/coverage_module.png)

*Starting server*

`$ node bin/lmd_stats.js -a 0.0.0.0 -p 8081 -c ./js/lmd/index.lmd.json -log ./logs/ -www ./`

*Other arguments*

 - `-address` `-a` address for log and admin server, default=0.0.0.0
 - `-port` `-p` port for log and admin server, default=8081
 - `-admin-address` `-aa` address admin server, default=address
 - `-admin-port` `-ap` address admin server, default=port
 - `-config` `-c` your application config file
 - `-log` `-l` path where stats server will store stats logs
 - `-www` `-wd` www dir of your site - required for async modules

see `examples/mock_chat/README.md` for real example

Watch mode
----------

During development its not very convenient to rebuild the LMD-package each time. You can run LMD package in watch mode
and LMD builder can rebuild your package automatically.

**Run LMD package in watch mode**

old style `lmd watch config.lmd.json output.js`

new style `lmd -m watch -c config.lmd.json -o output.js -l` the `-l` flag for verbose stdout log

or new style with long names `lmd -mode watch -config config.lmd.json -output output.js -log`

LMD CLI
--------------

old style `lmd [mode] config [output]`

new style `lmd [-m mode] -c config [-o output] [-l]`

**Arguments**

 - `-m` `-mode` lmd run mode `main` (default) or `watch`
 - `-c` `-config` lmd package config file
 - `-o` `-output` lmd output file - default STDOUT
 - `-l` `-log` print work log - default false
 - `-no-w` `-no-warn` disable warnings

Running tests
-------------

see test/README.md for details

Major versions changelog
---------

**v1.1.x**

 - Recursive module inclusion and wildcards in descriptors

**v1.2.x**

 - LMD can grab modules from globals (jQuery, Ext, Backbone, Underscore) if module is not found in package
 - Wildcard build bugfixes
 - Makefile for example

**v1.3.x**

 - Modules sandboxing
 - Named global object (default this)
 - Updated example - added worker part and config file with environment-specific data

**v1.4.x**

  - Config extends (now config can extend common config file) see example/cfgs/*
  - Headless module without function wrapper like Node.js module
  - Possible to specify LMD.js version for build - `lmd_min` (old one) or `lmd_tiny`
  - Per module lazy flag `"Module": {"path": "Module.js", "lazy": false}`
  - Sandbox flag is moved to module descriptor. `{"sandbox": {...}}` is deprecated
  - Modified LmdBuilder constructor
  - Lots of comments in LmdBuilder

**v1.5.x**

  - Watch mode see "Watch mode" in this README
  - New version of argv params see "LMD CLI" in this README
  - String module
  - LMD async - loader of off-package modules see "Asynchronous module require" in this README

**v1.6.x**

  - Local Storage cache - config flag `cache: true` see "Local Storage cache" in this README
  - argv flag `-v`/`-version` is deprecated - use config flag `async: true` for `lmd_async.js` or false for `lmd_tiny.js` (default)
  - Created development version of example app without cache and production with cache=on
  - LMD can include off-package css `css: true` and js-files `js: true`(for jsonp, cross-origin JS or non LMD modules)
  - Unit tests and code coverage
  - Worker (`worker: true`) and Node.js (`node: true`) environments for require.css, require.js and require.async
  - Older IE support `ie: true` flag
  - Sandboxed module now accepts require arg as undefined (was null)
  - Callback argument in require.js .css .async now optional. Each of them returns require for chaining
  - Firefox 13 setTimeout callback poisoning bug
  - LMD Warnings for: Parse error, more to come...
  - Prevent requiring same sources while they are loading from server (`race` flag)
  - `require.async()` cache (`cache_async` flag)
  - LMD checks for direct globals access in lazy modules
  - Shortcuts `"shortcut": "@/path/to/real-file.js"` for `require.async("shortcut")` `.js()` or `.css()`
  - window.eval replaced with Function eval, removed IE eval hack
  - added `require.stats([moduleName])` flag `stats: false`
  - replaced old preprocessor with readable one

**v1.7.x**
  - **Note** in sandboxed module require can be an object (`{coverage_line, coverage_function, coverage_condition}`) if sandboxed module is under code coverage
  - `require.async()` can load plain modules flags `async_plain`, `async_plainonly`
  - `require.stats()` shows modules usage and code coverage. Flags `stats`, `stats_coverage`, `stats_sendto`
  - in-package Code coverage. Flag `stats_coverage`
  - Stats server

Licence
-------

(The MIT License)

Copyright (c) 2011 Mikhail Davydov &lt;azazel.private@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.