/**
 * NOMRO - JSON & String Polyfills for ExtendScript (ES3)
 * @module utils/JSONPolyfill
 */

if (typeof String.prototype.trim !== 'function') {
    String.prototype.trim = function () {
        return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
    };
}

if (typeof JSON === 'undefined') {
    JSON = {};
}

if (typeof JSON.parse !== 'function') {
    JSON.parse = function (text) {
        var source = String(text);

        // Basic JSON grammar validation before using eval in legacy ES3 hosts.
        var safe = /^[\],:{}\s]*$/.test(
            source
                .replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                .replace(/(?:^|:|,)(?:\s*\[)+/g, '')
        );

        if (!safe) {
            throw new Error('Invalid JSON string');
        }

        return eval('(' + source + ')');
    };
}

if (typeof JSON.stringify !== 'function') {
    JSON.stringify = function (obj) {
        var type = typeof obj;

        if (type === 'undefined' || obj === null) {
            return 'null';
        }

        if (type === 'number' || type === 'boolean') {
            return String(obj);
        }

        if (type === 'string') {
            return '"' + obj.replace(/\\/g, '\\\\')
                .replace(/"/g, '\\"')
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
                .replace(/\t/g, '\\t') + '"';
        }

        if (obj instanceof Array) {
            var arrStr = [];
            for (var i = 0; i < obj.length; i++) {
                arrStr.push(JSON.stringify(obj[i]));
            }
            return '[' + arrStr.join(',') + ']';
        }

        if (type === 'object') {
            var pairs = [];
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    pairs.push('"' + key + '":' + JSON.stringify(obj[key]));
                }
            }
            return '{' + pairs.join(',') + '}';
        }

        return 'null';
    };
}

