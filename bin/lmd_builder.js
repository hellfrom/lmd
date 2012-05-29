/**
 * LMD Builder
 *
 * @author  Mikhail Davydov
 * @licence MIT
 */

var LMD_JS_SRC_PATH = __dirname + '/../src/';

var JSHINT_CONFIG = {
    debug:      true,
    eqnull:     true,
    boss:       true,
    loopfunc:   true,
    evil:       true,
    laxbreak:   true,
    undef:      true,
    nonew:      true,
    maxerr:     Infinity
};

var JSHINT_GLOBALS = {
    Array               : 0,
    Boolean             : 0,
    Date                : 0,
    decodeURI           : 0,
    decodeURIComponent  : 0,
    encodeURI           : 0,
    encodeURIComponent  : 0,
    Error               : 0,
    'eval'              : 0,
    EvalError           : 0,
    Function            : 0,
    hasOwnProperty      : 0,
    isFinite            : 0,
    isNaN               : 0,
    JSON                : 0,
    Math                : 0,
    Number              : 0,
    Object              : 0,
    parseInt            : 0,
    parseFloat          : 0,
    RangeError          : 0,
    ReferenceError      : 0,
    RegExp              : 0,
    String              : 0,
    SyntaxError         : 0,
    TypeError           : 0,
    URIError            : 0
};

var fs = require('fs'),
    parser = require("uglify-js").parser,
    uglify = require("uglify-js").uglify,
    JsHint = require('jshint').JSHINT;

/**
 * LmdBuilder
 * 
 * @constructor
 *
 * @param {Object|String} data               lmd options or argv string
 *
 * If data is {Object}:
 * @param {Object}        data.config               path to config file
 * @param {Object}        [data.mode='main']        watch or main
 * @param {Object}        [data.output]             result file or STDOUT
 * @param {Object}        [data.version='lmd_tiny'] lmd version
 * @param {Boolean}       [data.log=false]          log?
 *
 * If data is {String}:
 * @format
 *
 * data old format
 *      node lmd_builder.js [mode] path/to/config.lmd.json [result.js]
 *
 * data new format
 *      node lmd_builder.js [-m main] -c path/to/config.lmd.json [-r result.js] [-v lmd_tiny] [-l]
 *
 *      -c -config
 *      -m -mode       default main
 *      -o -output     default print to stdout
 *      -l -log        default false
 *      -v -version    default lmd_tiny
 *      -no-w -no-warn disable warnings
 *
 * @example
 *      // pass and object
 *      new LmdBuilder({
 *          config: "config.json",
 *          output: "result.js", // optional
 *          version: "lmd_tiny" // optional - default=lmd_tiny
 *      });
 *
 *      // pass string
 *      new LmdBuilder(process.argv.join(' '));
 *
 *      // old argv format
 *      new LmdBuilder("node lmd_builder.js watch path/to/config.lmd.json result.js");
 *
 *      // new argv format
 *      new LmdBuilder("node lmd_builder.js -m main -c path/to/config.lmd.json -r result.js -v lmd_tiny -l");
 */
var LmdBuilder = function (data) {
    var args = this.parseData(data);

    // apply config
    this.mode = args.mode || 'main';
    this.configFile = args.config;
    this.outputFile = args.output;
    this.isLog = args.log || false;
    this.isWarn = this.isLog && !args['no-warn'];

    if (LmdBuilder.availableModes.indexOf(this.mode) === -1) {
        throw new Error('No such LMD run mode - ' + this.mode);
    }

    this.configDir = fs.realpathSync(this.configFile);
    this.configDir = this.configDir.split('/');
    this.configDir.pop();
    this.configDir = this.configDir.join('/');
    if (this.configure()) {
        this.runMode(this.mode);
    }
};

/**
 * LMD template
 * 
 * @param {Object} data
 */
LmdBuilder.prototype.template = function (data) {
    return data.lmd_js + '(' + data.global + ',' + data.lmd_main + ',' + data.lmd_modules + ',' + data.sandboxed_modules +
        // if version passed
        (data.version ? ',' + data.version : '') +
    ')';
};

/**
 *
 *
 * @type {String[]}
 */
LmdBuilder.availableModes = ['main', 'watch'];

/**
 * Run LMD builder in specific mode
 *
 * @param {String} mode
 */
LmdBuilder.prototype.runMode = function (mode) {
    switch (mode) {
        case 'watch':
            this.fsWatch();
            break;

        case 'main':
            this.build();
            break;
    }
};

/**
 * Simple argv parser
 *
 * @see https://gist.github.com/1497865
 *
 * @param {String} a an argv string
 *
 * @returns {Object}
 */
LmdBuilder.prototype.parseArgv = function (a,b,c,d) {
    c={};for(a=a.split(/\s*\B[-]+([\w-]+)[\s=]*/),d=1;b=a[d++];c[b]=a[d++]||!0);return c
};

/**
 * Formats lmd config
 *
 * @param  {String|Object} data
 *
 * @return {Object}
 */
LmdBuilder.prototype.parseData = function (data) {
    var config;

    // case data is argv string
    if (typeof data === "string") {
        // try to parse new version
        config = this.parseArgv(data);

        // its new config argv string
        if (Object.keys(config).length) {
            // translate short params to long one
            config.version = config.version || config.v;
            config.mode = config.mode || config.m;
            config.output = config.output || config.o;
            config.log = config.log || config.l;
            config.config = config.config || config.c;
            config['no-warn'] = config['no-warn'] || config['no-w'];
        } else {
            // an old argv format, split argv and parse manually
            data = data.split(' ');

            // without mode
            if (LmdBuilder.availableModes.indexOf(data[2]) === -1) {
                config = {
                    mode: 'main',
                    config: data[2],
                    output: data[3]
                };
            } else { // with mode
                config = {
                    mode: data[2],
                    config: data[3],
                    output: data[4]
                };
            }
        }

    // case data is config object
    } else if (typeof config === "object") {
        // use as is
        config = data;

    // case else
    } else {
        // wut?
        throw new Error('Bad config data');
    }

    return config;
};

/**
 * Compress code using UglifyJS
 * 
 * @param {String} code
 *
 * @returns {String} compressed code
 */
LmdBuilder.prototype.compress = function (code) {
    var ast = parser.parse(code);
    ast = uglify.ast_mangle(ast);
    ast = uglify.ast_squeeze(ast);

    return uglify.gen_code(ast);
};

/**
 * Wrapper for plain files
 *
 * @param {String} code
 *
 * @returns {String} wrapped code
 */
LmdBuilder.prototype.tryWrap = function (code) {
    try {
        var ast = parser.parse(code);
    } catch (e) {
        throw new Error('parse error on ' + code);
    }

    // ["toplevel",[["defun","depA",["require"],[]]]]
    if (ast && ast.length === 2 &&
        ast[1] && ast[1].length === 1 &&
        ast[1][0][0] === "defun"
        ) {
        return code;
    }

    // ["toplevel",[["stat",["function",null,["require"],[]]]]]
    if (ast && ast.length === 2 &&
        ast[1] && ast[1].length === 1 &&
        ast[1][0][0] === "stat" &&
        ast[1][0][1] &&
        ast[1][0][1][0] === "function"
        ) {
        return code;
    }

    return '(function (require, exports, module) { /* wrapped by builder */\n' + code + '\n})';
};

/**
 * JSON escaper
 *
 * @param file
 */
LmdBuilder.prototype.escape = function (file) {
    return JSON.stringify(file);
};

/**
 * Module code renderer
 * 
 * @param {String[]} lmd_modules
 * @param {String}   lmd_main
 * @param {Boolean}  pack
 * @param {String[]} sandboxed_modules
 *
 * @returns {String}
 */
LmdBuilder.prototype.render = function (config, lmd_modules, lmd_main, pack, sandboxed_modules) {
    sandboxed_modules = JSON.stringify(sandboxed_modules || {});
    var lmd_js = fs.readFileSync(LMD_JS_SRC_PATH + 'lmd.js', 'utf8'),
        result;

    // Apply patch if LMD package in cache Mode
    lmd_js = this.patchLmdSource(lmd_js, config);
    lmd_modules = '{\n' + lmd_modules.join(',\n') + '\n}';

    result = this.template({
        lmd_js: lmd_js,
        global: config.global || 'this',
        lmd_main: lmd_main,
        lmd_modules: lmd_modules,
        sandboxed_modules: sandboxed_modules,
        // if version passed -> module will be cached
        version: JSON.stringify(config.version) || false
    });

    if (pack) {
        result = this.compress(result);
    }

    return result;
};

/**
 * Patches lmd source
 *
 * @param {String}  lmd_js
 * @param {Object} config
 *
 * @returns {String}
 */
LmdBuilder.prototype.patchLmdSource = function (lmd_js, config) {
    var optionNames,
        leftPattern,
        rightPattern,
        leftIndex,
        rightIndex,
        flagName;

    var flagToOptionNameMap = JSON.parse(fs.readFileSync(LMD_JS_SRC_PATH + 'lmd_flags.json'));

    // Add plugins
    for (flagName in flagToOptionNameMap) {
        optionNames = flagToOptionNameMap[flagName];

        optionNames.forEach(function (optionName) {
            var includePattern = new RegExp('\\/\\*\\$INCLUDE IF ' + optionName + '\\s+([a-z-_\\.]+)\\s+\\$\\*\\/', ''),
                patchContent = '',
                match;

            // Add plugin
            if (config[flagName]) {
                // apply: remove left & right side
                match = lmd_js.match(includePattern);
                if (match && match[1]) {
                    patchContent = fs.readFileSync(LMD_JS_SRC_PATH + 'plugin/' + match[1]);
                }
            }
            lmd_js = lmd_js.replace(includePattern, patchContent);
        });
    }

    // Apply IF statements
    for (flagName in flagToOptionNameMap) {
        optionNames = flagToOptionNameMap[flagName];

        if (config[flagName]) {
            // apply: remove left & right side
            optionNames.forEach(function (optionName) {
                lmd_js = lmd_js.replace(new RegExp('\\/\\*\\$(END)?IF ' + optionName + '\\$\\*\\/', 'g'), '');
            });
        }
    }

    // Wipe IF statements
    for (flagName in flagToOptionNameMap) {
        optionNames = flagToOptionNameMap[flagName];

        if (!config[flagName]) {
            // remove: wipe all content
            optionNames.forEach(function (optionName) {
                leftPattern = '/*$IF ' + optionName + '$*/';
                rightPattern = '/*$ENDIF ' + optionName + '$*/';

                // wipe all blocks
                while (true) {
                    leftIndex = lmd_js.indexOf(leftPattern);
                    if (leftIndex === -1) break;
                    rightIndex = lmd_js.indexOf(rightPattern) + rightPattern.length;
                    lmd_js = lmd_js.substring(0, leftIndex) + lmd_js.substring(rightIndex);
                }
            });
        }
    }

    return lmd_js;
};

/**
 * Performs configuration
 */
LmdBuilder.prototype.configure = function () {
    if (!this.configFile) {
        console.log('lmd usage:\n\t    lmd config.lmd.json [output.lmd.js]');
        return false;
    }
    return true;
};

/**
 * Extracts file path parameters
 * 
 * @param file
 */
LmdBuilder.prototype.extract = function (file) {
    file = file.split('/');
    return {
        file: file.pop(),
        path: (file.length ? file.join('/') + '/' : '')
    };
};

/**
 * Config files deep merge
 *
 * @param {Object} left
 * @param {Object} right
 */
LmdBuilder.prototype.deepDestructableMerge = function (left, right) {
    for (var prop in right) {
        if (right.hasOwnProperty(prop))  {
            if (typeof left[prop] === "object") {
                this.deepDestructableMerge(left[prop], right[prop]);
            } else {
                left[prop] = right[prop];
            }
        }
    }
    return left;
};

/**
 * Merges all config files in module's lineage
 *
 * @param config
 */
LmdBuilder.prototype.tryExtend = function (config) {
    config = config || {};
    if (typeof config.extends !== "string") {
        return config;
    }
    var parentConfig = this.tryExtend(JSON.parse(fs.readFileSync(this.configDir + '/' + config.extends, 'utf8')));

    return this.deepDestructableMerge(parentConfig, config);
};

/**
 * @name LmdModuleStruct
 * @class
 *
 * @field {String}  name       module name
 * @field {String}  path       full path to module
 * @field {Boolean} is_lazy    is lazy module?
 * @field {Boolean} is_sandbox is module sandboxed?
 * @field {Boolean} is_greedy  module is collected using wildcard
 */

/**
 * Collecting module using merged config
 *
 * @param config
 *
 * @returns {Object}
 */
LmdBuilder.prototype.collectModules = function (config) {
    var IS_HAS_WILD_CARD = /\*/;

    var modules = {},
        globalLazy = typeof config.lazy === "undefined" ? true : config.lazy,
        moduleLazy = false,
        moduleName,
        modulePath,
        descriptor,
        moduleDesciptor,
        wildcardRegex,
        moduleData,
        path =  config.path || '';

    if (path[0] !== '/') { // non-absolute
        path = this.configDir + '/' + path;
    }

    // grep paths
    for (moduleName in config.modules) {
        moduleDesciptor = config.modules[moduleName];
        // case "moduleName": "path/to/module.js"
        if (typeof moduleDesciptor === "string") {
            modulePath = moduleDesciptor;
            moduleLazy = globalLazy;
        } else { // case "moduleName": {"path": "path/to/module.js", "lazy": false}
            modulePath = moduleDesciptor.path;
            moduleLazy = typeof moduleDesciptor.lazy === "undefined" ? globalLazy : moduleDesciptor.lazy;
        }

        // Override if cache flag = true
        if (config.cache) {
            moduleLazy = true;
        }
        // its a wildcard
        // "*": "*.js" or "*_pewpew": "*.ru.json" or "ololo": "*.js"
        if (IS_HAS_WILD_CARD.test(modulePath)) {
            descriptor = this.extract(modulePath);
            wildcardRegex = new RegExp("^" + descriptor.file.replace(/\*/g, "(\\w+)") + "$");
            fs.readdirSync(path + descriptor.path).forEach(function (fileName) {
                var match = fileName.match(wildcardRegex),
                    newModuleName;

                if (match) {
                    match.shift();

                    // Modify a module name
                    match.forEach(function (replacement) {
                        newModuleName = moduleName.replace('*', replacement);
                    });

                    moduleData = {
                        name: newModuleName,
                        path: fs.realpathSync(path + descriptor.path + fileName),
                        is_lazy: moduleLazy,
                        is_greedy: true,
                        is_sandbox: moduleDesciptor.sandbox || false
                    };

                    // wildcard have a low priority
                    // if module was directly named it pass
                    if (!(modules[newModuleName] && !modules[newModuleName].is_greedy)) {
                        modules[newModuleName] = moduleData;
                    }
                }
            });
        } else {
            // normal name
            // "name": "name.js"
            modules[moduleName] = {
                name: moduleName,
                path: fs.realpathSync(path + modulePath),
                is_lazy: moduleLazy,
                is_greedy: false,
                is_sandbox: moduleDesciptor.sandbox || false
            };
        }
    }

    return modules;
};

/**
 * Collecting sandboxed modules using merged config
 *
 * @param modulesStruct
 *
 * @returns {Object}
 */
LmdBuilder.prototype.getSandboxedModules = function (modulesStruct, config) {
    // TODO(azproduction) Backward capability
    var result = config.sandbox || {};
    for (var moduleName in modulesStruct) {
        if (modulesStruct[moduleName].is_sandbox) {
            result[moduleName] = true;
        }
    }

    return result;
};

/**
 * Watch the module files, rebuilding when a change is detected
 */
LmdBuilder.prototype.fsWatch = function () {
    var self = this,
        watchedModulesCount = 0,
        config = this.tryExtend(JSON.parse(fs.readFileSync(this.configFile, 'utf8'))),
        module,
        modules,
        watchBuilder = function (stat, filename) {
            if (self.isLog) {
                filename = filename.split(/\/|\\/).pop();
                if (stat && filename) {
                    process.stdout.write('Change detected in \033[34m' + filename + '\033[0m at ' + stat.mtime);
                } else if (stat) {
                    process.stdout.write('Change detected at ' + stat.mtime);
                } else {
                    process.stdout.write('Change detected');
                }
                process.stdout.write(' \033[32mRebuilding...\033[0m');
                self.build(function () {
                    process.stdout.write(' \033[32m\033[1mDone!\033[0m\033[0m\n');
                });
            } else {
                self.build();
            }
        },
        watch = function (event, filename) {
            if (event === 'change') {
                if (filename) {
                    watchBuilder(fs.stat(filename), filename);
                } else {
                    watchBuilder();
                }
            }
        },
        watchFile = function (curr, prev, filename) {
            if (curr.mtime > prev.mtime) {
                watchBuilder(curr, filename);
            }
        };

    if (config.modules) {
        modules = this.collectModules(config);
        for (var index in modules) {
            module = modules[index];
            try {
                // a mess....
                fs.watchFile(module.path, { interval: 1000 }, function (curr, prev) {
                    watchFile(curr, prev, this);
                }.bind(module.path));
            } catch (e) {
                fs.watch(module.path, watch);
            }
            watchedModulesCount++;
        }

        if (this.isLog) {
            console.log('Now watching \033[37m%d\033[0m module files. Ctrl+C to stop', watchedModulesCount);
        }
    }
};

/**
 * Formats and prints an warning
 *
 * @param {String} text simple markdown syntax
 *
 * @example
 *     Pewpew **ololo** - ololo will be green
 */
LmdBuilder.prototype.warn = function (text) {
    if (this.isWarn) {
        text = text.replace(/\*\*/g, function bold() {
            bold.odd_even = !bold.odd_even;
            return bold.odd_even ? '\033[32m' : '\033[0m';
        });
        console.log('  \033[31mWarning:\033[0m ' + text);
    }
};

/**
 * Using JsHint, it checks for direct global vars access
 *
 * @param {String} moduleName
 * @param {String} moduleCode
 */
LmdBuilder.prototype.checkForDirectGlobalsAccess = function (moduleName, moduleCode) {
    new JsHint(moduleCode, JSHINT_CONFIG, JSHINT_GLOBALS);
    var globalsObjects = [];
    for (var i = 0, c = JsHint.errors.length, error; i < c; i++) {
        error = JsHint.errors[i];
        if (error.raw === '\'{a}\' is not defined.') {
            if (globalsObjects.indexOf(error.a) === -1) {
                globalsObjects.push(error.a);
            }
        }
    }

    if (globalsObjects.length) {
         this.warn("Lazy module **" + moduleName + "** uses some globals directly (" + globalsObjects.join(', ') +  "). " +
                   "Replace them with require('" + globalsObjects[0] + "') etc");
    }
};

/**
 * Main builder
 *
 * @param [callback] {Function}
 */
LmdBuilder.prototype.build = function (callback) {
    var config = this.tryExtend(JSON.parse(fs.readFileSync(this.configFile, 'utf8'))),
        lazy = typeof config.lazy === "undefined" ? true : config.lazy,
        mainModuleName = config.main,
        pack = lazy ? true : typeof config.pack === "undefined" ? true : config.pack,
        moduleContent,
        lmdModules = [],
        sandbox,
        lmdMain,
        lmdFile,
        isJson,
        isModule,
        module,
        modules;

    if (typeof config.ie === "undefined") {
        config.ie = true;
    }

    if (!config.cache && config.cache_async) {
        this.warn('This package was configured with flag **cache_async: true**, but without flag **cache**; ' +
            'cache_async cant work independently. Flag cache_async is disabled! Please switch on **cache**.');
        config.cache_async = false;
    }

    if (config.cache && typeof config.version === "undefined") {
        this.warn('This package was configured with flag **cache: true**, but without flag **version** parameter. ' +
            'Please define **version** to enable cache.');
    }

    if (config.modules) {
        modules = this.collectModules(config);
        // build modules string
        for (var index in modules) {
            module = modules[index];
            moduleContent = fs.readFileSync(module.path, 'utf8');

            try {
                JSON.parse(moduleContent);
                isJson = true;
            } catch (e) {
                isJson = false;
            }

            if (!isJson) {
                try {
                    moduleContent = this.tryWrap(moduleContent);
                    isModule = true;
                } catch(e) {
                    isModule = false;
                }

                // #12 Warn if parse error in .js file
                if (!isModule && /.js$/.test(module.path)) {
                    this.warn('File "**' + module.path + '**" has extension **.js** and LMD detect an parse error. ' +
                              'This module will be string. Please check the source.');
                }

                // #14 	Check direct access of globals in lazy modules
                if (this.isWarn && isModule && module.is_lazy) {
                    this.checkForDirectGlobalsAccess(module.path, moduleContent);
                }

                if (isModule && (module.is_lazy || pack)) {
                    moduleContent = this.compress(moduleContent);
                }
            }

            if (module.name === mainModuleName) {
                lmdMain = moduleContent;
            } else {
                if (isModule && !isJson && module.is_lazy) {
                    moduleContent = moduleContent.replace(/^function[^\(]*/, 'function');
                    if (moduleContent.indexOf('(function(') !== 0) {
                        moduleContent = '(' + moduleContent + ')';
                    }
                    moduleContent = this.escape(moduleContent);
                } else if (!isModule) {
                    moduleContent = this.escape(moduleContent);
                }

                lmdModules.push(this.escape(module.name) + ': ' + moduleContent);
            }
        }

        sandbox = this.getSandboxedModules(modules, config);
        lmdFile = this.render(config, lmdModules, lmdMain, pack, sandbox);

        if (this.outputFile) {
            fs.writeFileSync(this.outputFile, lmdFile,'utf8')
        } else {
            process.stdout.write(lmdFile);
        }
    }

    // callback must be called anyway
    if (typeof callback === 'function') {
        callback();
    }
};

module.exports = LmdBuilder;