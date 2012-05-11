(function /*$IF CACHE$*/lmd/*$ENDIF CACHE$*/(global, main, modules, sandboxed_modules/*$IF CACHE$*/, version/*$ENDIF CACHE$*/) {
    var initialized_modules = {},
        global_eval = global.eval,
        global_document = global.document,
        /**
         * @param {String} moduleName module name or path to file
         * @param {*}      module module content
         *
         * @returns {*}
         */
        register_module = function (moduleName, module) {
            // Predefine in case of recursive require
            var output = {exports: {}};
            initialized_modules[moduleName] = 1;
            modules[moduleName] = output.exports;

            if (!module) {
                // if undefined - try to pick up module from globals (like jQuery)
                module = global[moduleName];
            } else if (typeof module === "function") {
                // Ex-Lazy LMD module or unpacked module ("pack": false)
                module = module(sandboxed_modules[moduleName] ? null : require, output.exports, output) || output.exports;
            }

            return modules[moduleName] = module;
        },
        require = function (moduleName) {
            var module = modules[moduleName];

            // Already inited - return as is
            if (initialized_modules[moduleName] && module) {
                return module;
            }

            // Lazy LMD module not a string
            if (/^\(function\(/.test(module)) {
                module = global_eval(module);
            }

            return register_module(moduleName, module);
        },
        output = {exports: {}};

    for (var moduleName in modules) {
        // reset module init flag in case of overwriting
        initialized_modules[moduleName] = 0;
    }
/*$IF ASYNC$*/
    require.async = function (moduleName, callback) {
        var module = modules[moduleName],
            XMLHttpRequestConstructor = global.XMLHttpRequest || global.ActiveXObject;

        // If module exists or its a node.js env
        if (module) {
            callback(initialized_modules[moduleName] ? module : require(moduleName));
            return;
        }

/*$IF NODE$*/
        if (!XMLHttpRequestConstructor) {
            global.require('fs').readFile(moduleName, 'utf8', function (err, module) {
                if (err) {
                    callback();
                    return;
                }
                // check file extension not content-type
                if ((/js$|json$/).test(moduleName)) {
                    module = global_eval('(' + module + ')');
                }
                // 4. Then callback it
                callback(register_module(moduleName, module));
            });
            return;
        }
/*$ENDIF NODE$*/

/*$IF NODE$*/
//#JSCOVERAGE_IF 0
/*$ENDIF NODE$*/
        // Optimized tiny ajax get
        // @see https://gist.github.com/1625623
        var xhr = new XMLHttpRequestConstructor("Microsoft.XMLHTTP");
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                // 3. Check for correct status 200 or 0 - OK?
                if (xhr.status < 201) {
                    module = xhr.responseText;
                    if ((/script$|json$/).test(xhr.getResponseHeader('content-type'))) {
                        module = global_eval('(' + module + ')');
                    }
                    // 4. Then callback it
                    callback(register_module(moduleName, module));
                } else {
                    callback();
                }
            }
        };
        xhr.open('get', moduleName);
        xhr.send();
/*$IF NODE$*/
//#JSCOVERAGE_ENDIF
/*$ENDIF NODE$*/
    };
/*$ENDIF ASYNC$*/

/*$IF JS$*/
    require.js = function (moduleName, callback) {
        var module = modules[moduleName],
            readyState = 'readyState',
            isNotLoaded = 1,
            head;

        // If module exists
        if (module) {
            callback(initialized_modules[moduleName] ? module : require(moduleName));
            return;
        }

        // by default return undefined
        if (!global_document) {
/*$IF WORKER_OR_NODE$*/
            // if no global try to require
            // node or worker
            try {
                // call importScripts or require
                // any of them can throw error if file not found or transmission error
                module = register_module(moduleName, (global.importScripts || global.require)(moduleName) || {});
            } catch (e) {
                // error -> default behaviour
            }
/*$ENDIF WORKER_OR_NODE$*/
            callback(module);
            return;
        }

/*$IF WORKER_OR_NODE$*/
//#JSCOVERAGE_IF 0
/*$ENDIF WORKER_OR_NODE$*/
        var script = global_document.createElement("script");
        global.setTimeout(script.onreadystatechange = script.onload = function (e) {
            if (isNotLoaded &&
                (!e ||
                !script[readyState] ||
                script[readyState] == "loaded" ||
                script[readyState] == "complete")) {
                
                isNotLoaded = 0;
                // register or cleanup
                callback(e ? register_module(moduleName, script) : head.removeChild(script) && e); // e === undefined if error
            }
        }, 3000, head); // in that moment head === undefined

        script.src = moduleName;
        head = global_document.getElementsByTagName("head")[0];
        head.insertBefore(script, head.firstChild);
/*$IF WORKER_OR_NODE$*/
//#JSCOVERAGE_ENDIF
/*$ENDIF WORKER_OR_NODE$*/
    };
/*$ENDIF JS$*/

/*$IF CSS$*/
    // Inspired by yepnope.css.js
    // @see https://github.com/SlexAxton/yepnope.js/blob/master/plugins/yepnope.css.js
    require.css = function (moduleName, callback) {
        var module = modules[moduleName],
            isNotLoaded = 1,
            head;

        // If module exists or its a worker or node.js environment
        if (module || !global_document) {
            callback(initialized_modules[moduleName] ? module : require(moduleName));
            return;
        }

/*$IF WORKER_OR_NODE$*/
//#JSCOVERAGE_IF 0
/*$ENDIF WORKER_OR_NODE$*/

        // Create stylesheet link
        var link = global_document.createElement("link"),
            id = global.Math.random();

        // Add attributes
        link.href = moduleName;
        link.rel = "stylesheet";
        link.id = id;

        global.setTimeout(link.onload = function (e) {
            if (isNotLoaded) {
                isNotLoaded = 0;
                // register or cleanup
                link.removeAttribute('id');
                callback(e ? register_module(moduleName, link) : head.removeChild(link) && e); // e === undefined if error
            }
        }, 3000, head); // in that moment head === undefined

        head = global_document.getElementsByTagName("head")[0];
        head.insertBefore(link, head.firstChild);

        (function poll() {
            if (isNotLoaded) {
                try {
                    var sheets = global_document.styleSheets;
                    for (var j = 0, k = sheets.length; j < k; j++) {
                        if(sheets[j].ownerNode.id == id && sheets[j].cssRules.length) {
//#JSCOVERAGE_IF 0
                            return link.onload(1);
//#JSCOVERAGE_ENDIF
                        }
                    }
                    // if we get here, its not in document.styleSheets (we never saw the ID)
                    throw 1;
                } catch(e) {
                    // Keep polling
                    global.setTimeout(poll, 20);
                }
            }
        }());
/*$IF WORKER_OR_NODE$*/
//#JSCOVERAGE_ENDIF
/*$ENDIF WORKER_OR_NODE$*/
    };
/*$ENDIF CSS$*/

/*$IF CACHE$*/
    // If possible to dump and version passed (fallback mode)
    // then dump application source
    if (global.localStorage && version) {
        (function () {
            try {
                global.localStorage['lmd'] = global.JSON.stringify({
                    version: version,
                    modules: modules,
                    // main module function
                    main: '(' + main + ')',
                    // lmd function === arguments.callee
                    lmd: '(' + lmd + ')',
                    sandboxed: sandboxed_modules
                });
            } catch(e) {}
        }());
    }
/*$ENDIF CACHE$*/
    main(require, output.exports, output);
})