/**
 * NOMRO - Multi-Node Sequence Expression Generator
 * Generates robust, high-performance After Effects expressions for Multi-Waypoint Node Sequences.
 * Handles Number, Time, Text, and Delta transitions with easing and hold periods.
 * @module expressions/NodesExpressionGenerator
 */

NOMRO.expressions = NOMRO.expressions || {};

/**
 * Generate complete After Effects expression for a Multi-Node sequence
 * @param {Object} settings - Node sequence settings
 * @returns {string} ExtendScript expression string
 */
NOMRO.expressions.generateNodesExpression = function (settings) {
    settings = settings || {};

    var easingCode = (NOMRO.expressions && NOMRO.expressions.resolveEasingExpression)
        ? NOMRO.expressions.resolveEasingExpression(settings)
        : '(1 - Math.pow(1 - t, 3))';

    var numFormat = settings.numberFormat || 'normal';
    var prefix = settings.symbol || '';
    var suffix = settings.suffix || '';
    var separator = settings.separator || '';
    var pos = settings.formatPos || 'left';
    var isDec = !!settings.decimals;

    var escPrefix = prefix.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    var escSuffix = suffix.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    var escSeparator = separator;

    var expr = '';
    expr += '// NOMRO Pro v' + NOMRO.version + ' — Multi-Node Sequence Engine\n';
    expr += '// Controls and waypoints driven by layer markers\n\n';

    // Helper functions for format
    expr += 'function parseNode(str) {\n';
    expr += '    str = (str || "").replace(/^\\s+|\\s+$/g, "");\n';
    expr += '    var hold = 0;\n';
    expr += '    var ease = "";\n';
    expr += '    if (str.indexOf("|") !== -1) {\n';
    expr += '        var parts = str.split("|");\n';
    expr += '        str = parts[0];\n';
    expr += '        for (var p = 1; p < parts.length; p++) {\n';
    expr += '            var opt = parts[p].replace(/^\\s+|\\s+$/g, "");\n';
    expr += '            if (opt.indexOf("H:") === 0) hold = parseFloat(opt.substring(2)) || 0;\n';
    expr += '            else if (opt.indexOf("E:") === 0) ease = opt.substring(2);\n';
    expr += '        }\n';
    expr += '    }\n';
    expr += '    if (str.indexOf("TIME:") === 0) return { type: "time", raw: str.substring(5), hold: hold, ease: ease };\n';
    expr += '    if (str.indexOf("TXT:") === 0) return { type: "text", raw: str.substring(4), hold: hold, ease: ease };\n';
    expr += '    if (str.indexOf("DELTA:") === 0) return { type: "delta", raw: str.substring(6), hold: hold, ease: ease };\n';
    expr += '    if (str.indexOf("NUM:") === 0) return { type: "number", raw: parseFloat(str.substring(4)) || 0, hold: hold, ease: ease };\n';
    expr += '    if (/^-?\\d+(\\.\\d+)?$/.test(str)) return { type: "number", raw: parseFloat(str), hold: hold, ease: ease };\n';
    expr += '    if (str.indexOf(":") !== -1) return { type: "time", raw: str, hold: hold, ease: ease };\n';
    expr += '    return { type: "text", raw: str, hold: hold, ease: ease };\n';
    expr += '}\n\n';

    // Convert time string "HH:MM:SS" or "MM:SS" to seconds
    expr += 'function timeStrToSec(ts) {\n';
    expr += '    if (typeof ts === "number") return ts;\n';
    expr += '    var p = String(ts).split(":");\n';
    expr += '    if (p.length === 3) return (parseFloat(p[0]) * 3600) + (parseFloat(p[1]) * 60) + parseFloat(p[2]);\n';
    expr += '    if (p.length === 2) return (parseFloat(p[0]) * 60) + parseFloat(p[1]);\n';
    expr += '    return parseFloat(ts) || 0;\n';
    expr += '}\n\n';

    // Convert seconds to formatted timecode
    expr += 'function secToTimeStr(s) {\n';
    expr += '    var absS = Math.abs(s);\n';
    expr += '    var totalSec = Math.floor(absS);\n';
    expr += '    var h = Math.floor(totalSec / 3600);\n';
    expr += '    var m = Math.floor((totalSec % 3600) / 60);\n';
    expr += '    var sec = totalSec % 60;\n';
    expr += '    function p2(n) { return (n < 10 ? "0" : "") + n; }\n';
    expr += '    var sign = s < 0 ? "-" : "";\n';
    expr += '    if (h > 0) return sign + p2(h) + ":" + p2(m) + ":" + p2(sec);\n';
    expr += '    return sign + p2(m) + ":" + p2(sec);\n';
    expr += '}\n\n';

    // Format number according to settings
    expr += 'function formatNumber(num) {\n';
    expr += '    var dec = ' + (isDec ? 'true' : 'false') + ';\n';
    expr += '    var pre = "' + escPrefix + '";\n';
    expr += '    var suf = "' + escSuffix + '";\n';
    expr += '    var sep = "' + escSeparator + '";\n';
    expr += '    var pos = "' + pos + '";\n';
    expr += '    var n = dec ? Number(num).toFixed(2) : Math.round(num).toString();\n';
    expr += '    var parts = n.split(".");\n';
    expr += '    var intPart = parts[0];\n';
    expr += '    var decPart = parts.length > 1 ? "." + parts[1] : "";\n';
    expr += '    var str = Math.abs(parseInt(intPart, 10) || 0).toString();\n';
    expr += '    if (sep !== "") str = str.replace(/\\B(?=(\\d{3})+(?!\\d))/g, sep);\n';
    expr += '    var isNeg = num < 0 && Math.abs(num) >= (dec ? 0.005 : 0.5);\n';
    expr += '    var sign = isNeg ? "-" : "";\n';
    expr += '    return (pos === "left") ? (sign + pre + str + decPart + suf) : (sign + suf + str + decPart + pre);\n';
    expr += '}\n\n';

    // Ease function resolver supporting per-node curves
    expr += 'function applyEase(t, curve) {\n';
    expr += '    t = Math.max(0, Math.min(1, t));\n';
    expr += '    var c = curve || "' + (settings.easing || 'smoothOut') + '";\n';
    expr += '    if (c === "linear") return t;\n';
    expr += '    if (c === "snappyOut") return 1 - Math.pow(1 - t, 4);\n';
    expr += '    if (c === "dramaticOut") return 1 - Math.pow(1 - t, 6);\n';
    expr += '    if (c === "bounceOut") {\n';
    expr += '        var n1 = 7.5625, d1 = 2.75;\n';
    expr += '        if (t < (1 / d1)) return n1 * t * t;\n';
    expr += '        if (t < (2 / d1)) return n1 * (t -= (1.5 / d1)) * t + 0.75;\n';
    expr += '        if (t < (2.5 / d1)) return n1 * (t -= (2.25 / d1)) * t + 0.9375;\n';
    expr += '        return n1 * (t -= (2.625 / d1)) * t + 0.984375;\n';
    expr += '    }\n';
    expr += '    if (c === "elasticOut") {\n';
    expr += '        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;\n';
    expr += '    }\n';
    expr += '    if (c === "smoothOut") return 1 - Math.pow(1 - t, 3);\n';
    expr += '    return ' + easingCode + ';\n';
    expr += '}\n\n';

    // Main resolution logic
    expr += 'var markers = thisLayer.marker;\n';
    expr += 'var n = markers.numKeys;\n';
    expr += 'function resolveNodeNum(idx) {\n';
    expr += '    if (idx < 1 || idx > n) return 0;\n';
    expr += '    var p = parseNode(markers.key(idx).comment);\n';
    expr += '    if (p.type === "number") return parseFloat(p.raw) || 0;\n';
    expr += '    if (p.type === "delta" && idx > 1) {\n';
    expr += '        var prevNum = resolveNodeNum(idx - 1);\n';
    expr += '        var ds = String(p.raw).replace(/^\\s+|\\s+$/g, "");\n';
    expr += '        var dv = (ds.indexOf("%") !== -1) ? (prevNum * ((parseFloat(ds.replace("%", "")) || 0) / 100)) : (parseFloat(ds) || 0);\n';
    expr += '        return prevNum + dv;\n';
    expr += '    }\n';
    expr += '    return parseFloat(p.raw) || 0;\n';
    expr += '}\n\n';

    expr += 'if (n === 0) {\n';
    expr += '    value;\n';
    expr += '} else if (n === 1 || time <= markers.key(1).time) {\n';
    expr += '    var n1 = parseNode(markers.key(1).comment);\n';
    expr += '    if (n1.type === "text") n1.raw; else if (n1.type === "time") secToTimeStr(timeStrToSec(n1.raw)); else formatNumber(resolveNodeNum(1));\n';
    expr += '} else if (time >= markers.key(n).time) {\n';
    expr += '    var nLast = parseNode(markers.key(n).comment);\n';
    expr += '    if (nLast.type === "text") nLast.raw; else if (nLast.type === "time") secToTimeStr(timeStrToSec(nLast.raw)); else formatNumber(resolveNodeNum(n));\n';
    expr += '} else {\n';
    expr += '    var out = "";\n';
    expr += '    for (var i = 1; i < n; i++) {\n';
    expr += '        var m1 = markers.key(i);\n';
    expr += '        var m2 = markers.key(i + 1);\n';
    expr += '        if (time >= m1.time && time < m2.time) {\n';
    expr += '            var nodeA = parseNode(m1.comment);\n';
    expr += '            var nodeB = parseNode(m2.comment);\n';
    expr += '            var segDur = Math.max(0.001, m2.time - m1.time);\n';
    expr += '            var elapsed = time - m1.time;\n';
    expr += '            var holdDur = Math.min(nodeA.hold, segDur - 0.001);\n';
    expr += '            if (elapsed < holdDur) {\n';
    expr += '                if (nodeA.type === "text") out = nodeA.raw;\n';
    expr += '                else if (nodeA.type === "time") out = secToTimeStr(timeStrToSec(nodeA.raw));\n';
    expr += '                else out = formatNumber(resolveNodeNum(i));\n';
    expr += '            } else {\n';
    expr += '                var activeElapsed = elapsed - holdDur;\n';
    expr += '                var activeDur = Math.max(0.001, segDur - holdDur);\n';
    expr += '                var progress = Math.min(Math.max(activeElapsed / activeDur, 0), 1);\n';
    expr += '                var k = applyEase(progress, nodeA.ease);\n';
    expr += '                if (nodeA.type === "text" || nodeB.type === "text") {\n';
    expr += '                    out = (k < 0.5) ? String(nodeA.raw) : String(nodeB.raw);\n';
    expr += '                } else if (nodeA.type === "time" || nodeB.type === "time") {\n';
    expr += '                    var secA = timeStrToSec(nodeA.raw);\n';
    expr += '                    var secB = timeStrToSec(nodeB.raw);\n';
    expr += '                    var curSec = secA + (secB - secA) * k;\n';
    expr += '                    out = secToTimeStr(curSec);\n';
    expr += '                } else {\n';
    expr += '                    var numA = resolveNodeNum(i);\n';
    expr += '                    var numB = resolveNodeNum(i + 1);\n';
    expr += '                    var curNum = numA + (numB - numA) * k;\n';
    expr += '                    out = formatNumber(curNum);\n';
    expr += '                }\n';
    expr += '            }\n';
    expr += '            break;\n';
    expr += '        }\n';
    expr += '    }\n';
    expr += '    out;\n';
    expr += '}\n';

    // Embed configuration payload
    expr += '\n/* NOMRO_CONFIG = ' + JSON.stringify(settings) + ' */';

    return expr;
};

