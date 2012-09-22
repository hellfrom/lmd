# LMD: Lazy Module Declaration [![Build Status](https://secure.travis-ci.org/azproduction/lmd.png?branch=master)](http://travis-ci.org/azproduction/lmd)

Big JavaScript application cause huge startup latency. A 1Mb of JavaScript initializes about ~600-3000ms! without
touching any part of DOM. LMD is inspired by AMD and provides similar module interface. It evals module only when
they are required. LMD is "Yet Another Loader" with all loader features: js, css, parallel... Why LMD?
- it can initialize modules when they are required,
- it tiny and flexible (minimal only 288bytes!),
- you can write your [modules as Node.js](#lmd-modules) without define or require wrappers
- but you can use all [other modules](#lmd-module-form-third-party-modules)), and more...

## Features

1. Modules are similar to AMD: there is a require, but no define
2. LMD does not create globals
3. LMD is standalone, tiny and flexible (minimal only 288bytes!)
4. Each function-module can be initialized/evaled on demand (`lazy: true`)
5. LMD module is as easy to debug as normal JavaScript file
6. Build system compresses JavaScript files using UglifyJs
7. LMD module can define object via `return` or `module.exports` or `exports` as CommonJS Module
8. Module can be wrapped automatically in builder so you can write your modules as node.js modules (see [Use](#use)
and [Asynchronous module require](#asynchronous-module-require))
9. Starting from version 1.5.2 LMD can require off-package modules `"async": true`
(see [Asynchronous module require](#asynchronous-module-require))
10. From version 1.6.0 LMD can cache all in-package modules in localStorage `"cache": true`
(see [Local Storage cache](#local-storage-cache))
11. From version 1.6.2 LMD can include off-package css `css: true` and js-files `js: true`(for jsonp, cross-origin JS or non LMD modules)
12. LMD package is possible to run as Web Worker or execute as Node.js script
(see [Web Worker and Node.js](#web-worker-and-nodejs))
13. LMD works in all modern browsers and in older IE
(see [Browsers support](#browsers-support))
14. LMD can convert non-LMD modules to LMD to use jquery or any other as in-package LMD module
(see [LMD module form third-party modules](#lmd-module-form-third-party-modules))
15. LMD can protect your code from 3-party modules (see [Modules sandbox](#modules-sandbox))
16. Code Coverage? - Easy! (see [Code coverage](#code-coverage))
17. Ready for production - `lmd.js` is 100% covered by unit tests see [test/README.md](/azproduction/lmd/tree/master/test) for details

## Installing

`npm install lmd` or global `npm install lmd -g`

## LMD Modules types

### Module - functions

#### Module as function declaration

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

#### Module as function expression

```javascript
(function (require/*, exports, module*/) {
    var escape = require('depB');
    return function(message) {
        console.log(escape(message));
    }
})
```

#### Module as plain code like Node.js

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

### Module - objects

For config, i18n and other resources

```javascript
{
    "hello": "Привет"
}
```

### Module - string

For templates

```html
<i class="b-template">${content}</i>
```

## LMD Config file

**Full version**

```javascript
{
    "path": "../modules/", // if starts with "/" it is absolute path else path will be relative to the config file
    "root": "../modules/", // alias to path

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

        // 3-party modules
        "third_party_module": {
            "path": "vendors/other_module.js",
            "sandbox": true, // add sandbox
            "exports": {
                "pewpew": "pewpew",
                "ololo": "ololo",
                "someVariable": "someVariable"
            }
        },

        "jquery": {
            "path": "vendors/jquery.min.js",
            "exports": "require('$').noConflict(true)"
        },

        "module_with_depends": {
            "path": "vendors/jquery.min.js",
            "depends": "*.lmd.json" // With mask -> vendors/jquery.min.lmd.json
                                    // Or direct config name jquery.lmd.json
        },

        // string template
        "template": "templates/template.html"
        
        "i18n": "i18n.ru.json",

        // shortcuts for require.async("abstract_name") or .js() or .css()
        "abstract_name": "@/path/to/real-file.js"
    },
    "main": "main",         // a main module - content of that module will be called on start (no reason to eval)
    "global": "this",       // name of global object, passed to the lmd [default="this"]

    // # Depends
    "depends": true,        // module depends mask [default=false]
                            // Can be true value or mask string. Default mask for true is '*.lmd.json'
                            // For each module in config lmd builder will use mask to find config with module depends
                            // eg: module_name.js + *.lmd.json lmd will looking for module_name.lmd.json etc

    // # Modules output format
    "lazy": false,          // if true - all modules will be evaled on demand [default=false]
    "pack": false,          // if true - module will be packed using uglifyjs [default=false]
    "pack_options": {},     // object with UglifyJS pack options @see UglifyJS documents or
                            // /test/qunit/cfgs/test.lmd.json for details [default={}]

    // # Plugins @see Plugins paragraph

    // ## Off-package LMD module loader
    "async": true,
    "async_plain": true,
    "async_plainonly":true,

    // ## Cache
    "cache": true,
    "cache_async": true,

    // ## Non-LMD modules loader
    "js": true,
    "css": true,

    // ## Environment optimizations
    "worker": true,
    "node": true,
    "ie": true,
    "opera_mobile": true,

    // ## Loaders features and optimizations
    "race": true,
    "parallel": true,

    // ## Extra module types
    "shortcuts": true,

    // ## Stats and Code coverage
    "stats": true,
    "stats_coverage": true,
    "stats_coverage_async": true,
    "stats_sendto": true
}
```

**Minimal**

```javascript
{
    "root": "../modules/",
    "modules": {
        "*": "*.js" // use wildcards or specify regex string to grep
    }
}
```

**Note**

 - You can extend config file with another using `"extends": "path/to/file.lmd.json"` parameter
 - You can also specify module depends by adding `"depends"` options see [Modules depends](#modules-depends)


## Build LMD package

`lmd examples/basic/cfgs/index.development.lmd.json examples/basic/out/index.development.lmd.js` or `node ./lmd/bin/lmd.js ... `

Or print to `STDOUT`

`lmd example/cfgs/index.development.lmd.json`

See [LMD CLI](#lmd-cli)

LMD will assemble your modules and LMD source itself into one file. This file is monolith, but it more than debugable!

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

## List of plugins


### Off-package LMD module loader

<table>
    <tr>
        <th>Plugin</th>
        <th>Description</th>
        <th>Default</th>
    </tr>
    <tr>
        <td>async</td>
        <td>if modules uses off-package module set this to true</td>
        <td>false</td>
    </tr>
    <tr>
        <td>async_plain</td>
        <td>enables async require of both plain and function-modules</td>
        <td>false</td>
    </tr>
    <tr>
        <td>async_plainonly</td>
        <td>if you are using only plain modules enable that flag instead of async_plain</td>
        <td>false</td>
    </tr>
</table>

### Cache

<table>
    <tr>
        <th>Plugin</th>
        <th>Description</th>
        <th>Default</th>
    </tr>
    <tr>
        <td>cache</td>
        <td>stores all application lmd itself + all modules in localStorage this flag will force all modules to be lazy</td>
        <td>false</td>
    </tr>
    <tr>
        <td>cache_async</td>
        <td>depend on cache flag, enables localStorage cache for require.async()</td>
        <td>false</td>
    </tr>
</table>

### Non-LMD modules loader

<table>
    <tr>
        <th>Plugin</th>
        <th>Description</th>
        <th>Default</th>
    </tr>
    <tr>
        <td>js</td>
        <td>if you are going to load non LMD javascript modules require.js() set this flag to true</td>
        <td>false</td>
    </tr>
    <tr>
        <td>css</td>
        <td>enables css-loader feature require.css()</td>
        <td>false</td>
    </tr>

</table>

### Environment optimization

<table>
    <tr>
        <th>Plugin</th>
        <th>Description</th>
        <th>Default</th>
    </tr>
    <tr>
        <td>worker</td>
        <td>set true if LMD package will run as worker</td>
        <td>false</td>
    </tr>
    <tr>
        <td>node</td>
        <td>set true if LMD package will run as Node.js script</td>
        <td>false</td>
    </tr>
    <tr>
        <td>ie</td>
        <td>set false if script will run only in modern browsers</td>
        <td>true</td>
    </tr>
    <tr>
        <td>opera_mobile</td>
        <td>set true if LMD package will run in Opera Mobile</td>
        <td>false</td>
    </tr>
</table>

### Async loaders features and optimizations

<table>
    <tr>
        <th>Plugin</th>
        <th>Description</th>
        <th>Default</th>
    </tr>
    <tr>
        <td>race</td>
        <td>set true if you are performing simultaneous loading of the same resources</td>
        <td>false</td>
    </tr>
    <tr>
        <td>parallel</td>
        <td>enables parallel loading require.js([a, b, c], ..) resources will be executed in load order! And passed to callback in list order</td>
        <td>false</td>
    </tr>
</table>

### Extra module types

<table>
    <tr>
        <th>Plugin</th>
        <th>Description</th>
        <th>Default</th>
    </tr>
    <tr>
        <td>shortcuts</td>
        <td>enables shortcuts in LMD package</td>
        <td>false</td>
    </tr>
</table>

### Stats and Code coverage

<table>
    <tr>
        <th>Plugin</th>
        <th>Description</th>
        <th>Default</th>
    </tr>
    <tr>
        <td>stats</td>
        <td>enables require.stats() function - every module require, load, eval, call statistics</td>
        <td>false</td>
    </tr>
    <tr>
        <td>stats_coverage</td>
        <td>enables code coverage for all in-package modules, you can use list of module names to cover only modules in that list</td>
        <td>false</td>
    </tr>
    <tr>
        <td>stats_coverage_async</td>
        <td>enables code coverage for all off-package function-modules for that option you can NOT use list of off-package module names.
        This options is VERY HEAVY +50Kb sources. Each async LMD module will be parsed and patched on the client - it may take A LOT of time
        </td>
        <td>false</td>
    </tr>
    <tr>
        <td>stats_sendto</td>
        <td>enables require.stats.sendTo(host[, reportName]) function. It POSTs stats&coverage report to specified stats server</td>
        <td>false</td>
    </tr>
</table>


## Plugins usage

### Asynchronous module require

 - Flags: `async`, `race`, `cache_async`, `async_plain`, `async_plainonly`

You can build async LMD package.  (Disabled by default)

Then your packages can require off-package modules from http server.
Build LMD package using `async: true` flag. LMD loader now can require javascript FunctionsExpressions,
JSON or template strings asynchronously. LMD parses file content depend on `Content-type` header.
You must work online using HTTP server for correct headers, if you work offline (using `file:` protocol)
then `Content-type` header will be INVALID so all modules will be strings.

**Notice**

 - See "[Web Worker and Node.js](#web-worker-and-nodejs)" if your package will run as worker or node script
 - If you use `file:` protocol then all modules will be strings
 - LMD loader uses simple RegExp `/script$|json$/` with `Content-type` to determine the kind of content
and eval it (if json or javascript) or return as string
 - If all you modules are in-package then set `async` flag to false (300 bytes less)
 - If async require fails (status code will be >= 400) loader will return `undefined`
   (LMD doesn't re-request on error)
 - If you are performing parallel loading of the same resource add `race: true` (Disabled by default)
   flag to prevent duplication of requests.
 - You can set both flags `cache` and `cache_async` to true to enable localStorage cache for `require.async()`
   (see [Local Storage cache](#local-storage-cache))
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

See [example/basic/modules/main.js](/azproduction/lmd/blob/master/examples/basic/modules/main.js#L24) for real life example

### Local Storage cache

 - Flags: `cache`, `cache_async`, Property: `version`

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

See [examples/basic/cfgs/index.prodoction.lmd.json](/azproduction/lmd/blob/master/examples/basic/cfgs/index.prodoction.lmd.json)
and [examples/basic/index.html](/azproduction/lmd/blob/master/examples/basic/index.html) for details

**Note**: `version` property from config and from `data-version` attribute must match to use code from localStorage!
Yep! Each time you have to change config file and your html file!

### Loading CSS and JavaScript files

 - Flags: `js`, `css`, `race`

You can enable flags `css: true` and `js: true` to use css and js loader as all loaders do. (Disabled by default)

**Note**

 - See "[Web Worker and Node.js](#web-worker-and-nodejs)" if your package will run as worker or node script
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

### Web Worker and Node.js

 - Flags: `node`, `worker`

You can use LMD in-package modules (`require()`) in worker and run it as node script without any config changes.
But if you are going to use `require.async()` or `require.js()` you should add `worker: true` or/and `node: true` config
flags. `require.css()` in node or worker environment acts like `require()`

 - `require.async()` in Worker environment works exactly the same as in browser environment
 - `require.async()` in Node uses `fs.readFile()` to read file and evals/returns file content depend on file extension
 - `require.js()` in Worker acts like `importScripts()` and call back an empty object `{}`
 - `require.js()` in Node acts like Node.js `GLOBALS.require()` and returns `module.exports` object from node module
 - `require.css()` in both environments acts like LMD `require()`

Run tests or see [examples/basic/modules/main.js](/azproduction/lmd/blob/master/examples/basic/modules/main.js#L60) and
[examples/basic/modules/workerDepA.js](/azproduction/lmd/blob/master/examples/basic/modules/workerDepA.js) for details

### Browsers support

 - Flags: `ie`, `opera_mobile`

LMD works in all modern browsers and in older IE. If LMD package will run only in modern browsers turn off `ie: false`
config flag to optimise lmd source for modern browsers (removes few IE hacks)

Tested on Opera 11.63, Chrome 17, Safari 5, IE 6+, Firefox 12, iOS Safari 5, to be updated...

### Shortcuts

 - Flag `shortcuts`

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

## Module features

### LMD module form third-party modules

 - Module parameters: exports, require

If you are using jquery as in-package module or any other module without exports. LMD can easily convert it to LMD format.
You may add `"exports"` and/or `"require"` to your module descriptor to notify LMD that this module should be converted to LMD format.
The design of non-lmd2lmd patching is close to require.js shim

**Example**

You have one 3-party module and you have to include it to the LMD-package.
```javascript
function pewpew () {

}

function ololo() {

}

var someVariable = "string";
```

It easy, just add `"exports"` to your module descriptor, add "require" to start module deps:
```javascript
"third_party_module_b": {
    "path": "vendors/other_module.js",
    "exports": {
        "pewpew": "pewpew",
        "ololo": "ololo",
        "someVariable": "someVariable"
    } // return ALL THE SUFF!!!
}
```

Or return just one exports, and some deps
```javascript
"third_party_module_b": {
    "path": "vendors/other_module.js",
    "exports": "pewpew || ololo", // or var name "pewpew"

    // Modules may have some deps
    "require": {
        "third_party_module_b": "third_party_module_b-dep",
        "someGlobal": "Function"
    }
}
```

LMD will make a LMD module from you code (while building LMD-package)

```javascript
(function (require) { // << added
var third_party_module_b = require("third_party_module_b-dep"), // << added
    someGlobal = require("Function"); // << added

function pewpew () {

}

function ololo() {

}

var someVariable = "string";

return pewpew || ololo; // << added
}) // << added
```

`"exports"` should be valid JavaScript code or object of valid JavaScript

You may use more complex exports as `"exports": "require('$').noConflict(true)"` if you are exporting jQuery.

**Note** Try not to use complex expressions!

### Modules sandbox

 - Module parameters: sandbox

If you are using some untrusted 3-party modules or your modules cant `require()` by design you can apply sandbox on that
module by adding `"sandbox": true` to your module declaration. Now this module can't require and use require sub-functions.
`undefined` or `Object` (if module under Code Coverage) will passed as require. Sandboxed module can export all module stuff.

```javascript
"third_party_module_b": {
    "path": "vendors/other_module.js",
    "sandbox": true,
    "exports": {
        "pewpew": "pewpew",
        "ololo": "ololo",
        "someVariable": "someVariable"
    }
}
```

### Modules depends

 - Module Property/Flag: `depends`
 - Property/Flag: `depends`

Modules may have dependencies that you can put in a separate file. This file has the same format as any lmd.json file.
In that file can specify a list of required features and modules.
Each module can have only one config file with dependencies. All dependant configs may also have depends.

In other words, each configuration defines a subtree of the file system and the features that it needs to work.
The main config file assembles all subtrees and list of features into one big tree and features list.

**Example**

*FS Tree*

```
cfgs/
    index.lmd.json           | Main config
modules/                     |
    some_module/             |
        some_module_deps.js  |
    main.js                  |
    some_module.lmd.json     | Depends config of some_module.js
    some_module.js           |
    some_other_module.js     |
```

*index.lmd.json*

```javascript
{
    "root": "../modules/", // or "path":

    "modules": {
        "main": "modules/main.js",
        "some_module": "modules/some_module.js",
        "some_other_module": "modules/some_other_module.js"
    },

    "depends": true // or mask "*.lmd.json",

    "cache": false
}
```

You may also use per module depends:

```javascript
{
    "some_module": {
        "path": "modules/some_module.js",
        "depends": "some_module.lmd.json"
    }
}
```

*modules/some_module.lmd.json*

```javascript
{
    "root": "./some_module/", // or "path":

    "modules": {
        "some_module_deps": "some_module_deps.js"
    },

    "js": true,
    "async": true,

    "cache": true
}
```

`$ lmd index.lmd.json index.js`

Result js file will contain all module deps:

```javascript
{
    "modules": {
        "main": "modules/main.js",
        "some_module": "modules/some_module.js",
        "some_other_module": "modules/some_other_module.js"
        "some_module_deps": "some_module_deps.js"
    },

    "js": true,    // from some_module.lmd.json
    "async": true,

    "cache": false // overwritten by master config index.lmd.json
}
```

See [test/qunit/cfgs/test.lmd.json](/azproduction/lmd/tree/master/test/qunit/cfgs/test.lmd.json) for config example

**Note:**

 - LMD will warn if some config declares exists module name
 - "main" module from each depends module will be excluded
 - master config may overwrite flags by setting `"flag": false`

## LMD Statistics and Code Coverage

### Application statistics. Require, load, eval, call statistics

 - Flag: `stats`

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

### Code coverage

 - Flag: `stats`, `stats_coverage`, `stats_sendto`, `stats_coverage_async`

Add `stats_coverage` flag to your config file or use list of module names to cover only them. Rebuild your package.
Now you can see coverage report in `require.stats()` object. See [src/plugin/stats.js#L46](/azproduction/lmd/blob/master/src/plugin/stats.js#L46) for more information.

You can enable `stats_sendto` flag to push your reports to the Stats Server.
You may also enable `stats_coverage_async` to profile all your async modules without processing them on server. All async modules
will be parsed and processed on client.

```javascript
require.stats.sendTo('http://localhost:8081'); // you may specify report_name too
```

*How it work*
 1. LMD patches your source files with coverage functions
 2. User is running application and script executes coverage functions to calculate coverage
 3. Your source executes `require.stats.sendTo(your_lmd_stats_server_server)` and send report to the server
 4. Then you open Stats Server Admin interface to see reports

**Note**

 - sandboxed module under CC will accept an object as require with coverage functions instead of undefined
 - `stats_coverage_async` is VERLY LARGE `plugin` +50Bb and it may take a LOT of time to parse and patch your sources

### Stats server

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

see [examples/mock_chat](/azproduction/lmd/tree/master/examples/mock_chat) for real example

## Watch mode

During development its not very convenient to rebuild the LMD-package each time. You can run LMD package in watch mode
and LMD builder can rebuild your package automatically.

**Run LMD package in watch mode**

old style `lmd watch config.lmd.json output.js`

new style `lmd -m watch -c config.lmd.json -o output.js -l` the `-l` flag for verbose stdout log

or new style with long names `lmd -mode watch -config config.lmd.json -output output.js -log`

## LMD CLI

old style `lmd [mode] config [output]`

new style `lmd [-m mode] -c config [-o output] [-l]`

**Arguments**

 - `-m` `-mode` lmd run mode `main` (default) or `watch`
 - `-c` `-config` lmd package config file
 - `-o` `-output` lmd output file - default STDOUT
 - `-l` `-log` print work log - default false
 - `-no-w` `-no-warn` disable warnings

## Plugins and extending LMD

Starts from 1.8.0 LMD rewritten it plugin system from Patch-Based to Event-Based Context Share (extended version of pub/sub pattern).
Now you have event listeners and triggers `lmd_on` and `lmd_trigger` private functions. The idea is simple: subscriber
can return some value to context in which it was called.

Example: you have a plugin which provides indexOf polyfill for IE.

**Your plugin: indexof_for_ie.js**
```javascript
(function (sb) {

    function indexOf(item) {
        for (var i = this.length; i --> 0;) {
            if (this[i] === item) {
                return i;
            }
        }
        return -1;
    }

    // Subscribe
    sb.on('request-for-indexOf', function (defaultIndexOf) {
        // Check for real indexof
        if (typeof defaultIndexOf === "function") {
            return [defaultIndexOf];
        }

        return [indexOf]; // Share context! Return our indexof.
    });
}(sandbox));
```

**Your other plugin that uses indexof_for_ie.js**
```javascript
(function (sb) {
    // trigger event and send part of our context
    var sharedOrDefaultIndexOf = sb.trigger('request-for-indexOf', Array.prototype.indexOf)[0];
    if (!sharedOrDefaultIndexOf) {
        throw new Error('No Array#indexOf');
    }

    var index = sharedOrDefaultIndexOf.call([1, 2, 3, 4], 5);
}(sandbox));
```

If plugin `indexof_for_ie.js` is not included (no event listeners for `request-for-indexOf` event) `sb.trigger` will return
arguments as-is eg `[Array.prototype.indexOf]` in our case. `sb.trigger` will also return arguments as-is if all subscribers
returns undefined (or returns nothing).

### Optimisations

  1. LMD highly optimises plugins source code and indexes all publishers and subscribers. If no subscribers (in our case
plugin `indexof_for_ie.js` is not included) LMD will replace useless `sb.trigger` function call with array-expression.

**Your other plugin that uses indexof_for_ie.js (optimized version)**
```javascript
(function (sb) {
    // trigger event and send part of our context
    var sharedOrDefaultIndexOf = [Array.prototype.indexOf][0];      // <<<
    if (!sharedOrDefaultIndexOf) {
        throw new Error('No Array#indexOf');
    }

    var index = sharedOrDefaultIndexOf.call([1, 2, 3, 4], 5);
}(sandbox));
```

  2. If no publishers (no `sb.trigger` calls) LMD will remove all subscribers associated with that event name.
  3. If no publishers nor subscribers at all LMD will wipe all related functions and objects.
  4. LMD will also replace event names with corresponding event index (event name is not passed to listener).
  5. LMD brakes sandbox: replaces all `sb.*` with names without dot operator (that code will be better compressed).
  eg `sb.on(..) -> lmd_on(...)` `sb.document -> global_document` etc @see /src/lmd.js for details

### Basic plugin code

```javascript
(function (sb) {

    // Subscribe
    sb.on('async:require-environment-file', function (moduleName, a) {
        // Trigger
        var sharedContext = sb.trigger('your:stuff', a);

        return [moduleName, a * 2]; // Context share
    });
}(sandbox));
```

Where `sandbox` is

```javascript
var sandbox = {
    global: global,                     // window, this or ... - depend on config
    modules: modules,                   // map of modules content
    sandboxed: sandboxed_modules,       // map of sandboxed modules module_name: true|false

    eval: global_eval,                  // window.eval
    register: register_module,          // register module function
    require: require,                   // require module function
    initialized: initialized_modules,   // map of initializd modules module_name: 0|1

    noop: global_noop,                  // function () {}           if $P.CSS || $P.JS || $P.ASYNC
    document: global_document,          // window.document          if $P.CSS || $P.JS || $P.STATS_SENDTO
    lmd: lmd,                           // lmd function itself      if $P.CACHE
    main: main,                         // main module code         if $P.CACHE
    version: version,                   // module version           if $P.CACHE
    coverage_options: coverage_options, // ...                      if $P.STATS_COVERAGE

    on: lmd_on,                         // lmd_on
    trigger: lmd_trigger,               // lmd_trigger

    undefined: local_undefined          // void 0
};
```

### Declare and use plugin

 1. Add record to `/src/lmd_plugins.json` file:

```javascript
    "your_plugin_name": {                // !!!
        "require": "your_plugin_code.js" // may be an array of files
    }
```

 2. Put your plugin code `your_plugin_code.js` into the plugins dir `/src/plugin`
 3. Add `"your_plugin_name": true` record to your .lmd.json config file

```javascript
{
    "root": "../modules/",
    "modules": {
        "*": "*.js"
    },

    "your_plugin_name": true        // <<<
}
```

### List of events

#### *:before-init

 calls when module is goint to eval or call

  * `{String}` moduleName
  * `{Object}` module

_Listener returns context:_ no

#### *:coverage-apply

 applies code coverage for module

  * `{String}` moduleName
  * `{Object}` module

_Listener returns context:_ yes

#### *:is-plain-module

 code type check request: plain or lmd-module

  * `{String}` moduleName
  * `{String}` module
  * `{String}` isPlainCode default value

_Listener returns context:_ yes

#### *:request-error

 module load error

  * `{String}` moduleName
  * `{Object}` module

_Listener returns context:_ no

#### *:request-indexof

 requests indexOf polifill

  * `{Function|undefined}` arrayIndexOf default indexOf value

_Listener returns context:_ yes

#### *:request-json

 requests JSON polifill with only stringify function!

  * `{Object|undefined}` JSON default JSON value

_Listener returns context:_ yes

#### *:request-parallel

 parallel module request for require.async(['a', 'b', 'c']) etc

  * `{Array}`    moduleNames list of modules to init
  * `{Function}` callback    this callback will be called when module inited
  * `{Function}` method      method to call for init

_Listener returns context:_ yes empty environment

#### *:request-race

 race module request eg for cases when some async modules are required simultaneously

  * `{String}`   moduleName race for module name
  * `{Function}` callback   this callback will be called when module inited

_Listener returns context:_ yes returns callback if race is empty or only 1 item in it

#### *:rewrite-shortcut

 fires before stats plugin counts require same as *:rewrite-shortcut but without triggering shortcuts:before-resolve event

  * `{String}` moduleName race for module name
  * `{String}` module     this callback will be called when module inited

_Listener returns context:_ yes returns modified moduleName and module itself

#### *:rewrite-shortcut

 request for shortcut rewrite

  * `{String}` moduleName race for module name
  * `{String}` module     this callback will be called when module inited

_Listener returns context:_ yes returns modified moduleName and module itself

#### *:stats-coverage

 adds module parameters for statistics

  * `{String}` moduleName
  * `{Object}` moduleOption preprocessed data for lines, conditions and functions

_Listener returns context:_ no

#### *:stats-get

 somethins is request raw module stats

  * `{String}` moduleName
  * `{Object}` result    default stats

_Listener returns context:_ yes

#### *:stats-results

 somethins is request processed module stats

  * `{String}` moduleName
  * `{Object}` result     default stats

_Listener returns context:_ yes

#### *:stats-type

 something tells stats to overwrite module type

  * `{String}` moduleName
  * `{String}` packageType

_Listener returns context:_ no

#### *:wrap-module

 Module wrap request

  * `{String}` moduleName
  * `{String}` module this module will be wrapped
  * `{String}` contentTypeOrExtension file content type or extension to avoid wrapping json file

_Listener returns context:_ yes

#### async:before-callback

 when async.js require is going to return module, uses for cache async module

  * `{String}` moduleName
  * `{String}` module     module content

_Listener returns context:_ no

#### async:before-check

 before module cache check in async()

  * `{String}` moduleName
  * `{Object}` module

_Listener returns context:_ no

#### async:require-environment-file

 requests file register using some environment functions non XHR

  * `{String}`   moduleName
  * `{String}`   module
  * `{Function}` callback   this callback will be called when module inited

_Listener returns context:_ no

#### css:before-check

 before module cache check in css()

  * `{String}` moduleName
  * `{Object}` module

_Listener returns context:_ no

#### js:before-check

 before module cache check in js()

  * `{String}` moduleName
  * `{Object}` module

_Listener returns context:_ no

#### js:request-environment-module

 js.js plugin requests for enviroment-based module init (importScripts or node require)

  * `{String}`   moduleName
  * `{String}`   module

_Listener returns context:_ yes

#### lmd-register:after-register

 after module register event

  * `{String}` moduleName
  * `{Object}` module

_Listener returns context:_ no

#### lmd-register:before-register

 before module register event

  * `{String}` moduleName
  * `{Object}` module

_Listener returns context:_ no

#### lmd-register:call-module

 request for fake require

  * `{String}` moduleName
  * `{Object}` module

_Listener returns context:_ yes wraps require

#### lmd-register:call-sandboxed-module

 register_module is goint to call sandboxed module and requests for require wrapper for sandboxed module

  * `{String}`        moduleName
  * `{Function|Null}` require default require

_Listener returns context:_ yes creates fake require

#### lmd-require:before-check

 before module cache check

  * `{String}` moduleName
  * `{Object}` module

_Listener returns context:_ no

#### shortcuts:before-resolve

 moduleName is shortcut and its goint to resolve with actual name

  * `{String}` moduleName
  * `{Object}` module

_Listener returns context:_ no

#### stats:before-return-stats

 stats is going to return stats data this event can modify that data

  * `{String|undefined}` moduleName
  * `{Object}`           stats_results default stats

_Listener returns context:_ yes depend on moduleName value returns empty array or replaces stats_results



## Running tests

see [test](/azproduction/lmd/tree/master/test) for details

## Major versions changelog

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

  - Config extends (now config can extend common config file) see [examples/basic/cfgs](/azproduction/lmd/tree/master/examples/basic/cfgs)
  - Headless module without function wrapper like Node.js module
  - Possible to specify LMD.js version for build - `lmd_min` (old one) or `lmd_tiny`
  - Per module lazy flag `"Module": {"path": "Module.js", "lazy": false}`
  - Sandbox flag is moved to module descriptor. `{"sandbox": {...}}` is deprecated
  - Modified LmdBuilder constructor
  - Lots of comments in LmdBuilder

**v1.5.x**

  - Watch mode see "[Watch mode](#watch-mode)" in this README
  - New version of argv params see "[LMD CLI](#lmd-cli)" in this README
  - String module
  - LMD async - loader of off-package modules see "Asynchronous module require" in this README

**v1.6.x**

  - Local Storage cache - config flag `cache: true` see "[Local Storage cache](#local-storage-cache)" in this README
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
  - LMD module from non-lmd module (see [LMD module form third-party modules](#lmd-module-form-third-party-modules))
  - `config.lazy=false` by default now
  - Local Storage cache in Opera Mobile is disabled (OM cant Function#toString...)
  - `root` alias to `path`
  - Module depends
  - off-package Code coverage. Flag `stats_coverage_async`
  - Phantom JS and Travis CI integration
  - Improved Stats Server: require timeline, require graph
  - Pack options UglifyJS `pack_options` issue #41 parameter

**v1.8.x**

  - Plugins interface are totally rewritten

## Licence

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