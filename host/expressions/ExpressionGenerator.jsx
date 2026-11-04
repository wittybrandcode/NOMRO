/**
 * NOMRO - Expression Generator (Embedded Controls Version)
 * Generates expressions that reference thisLayer instead of external control layer
 * @module expressions/ExpressionGenerator
 */

NOMRO.expressions = NOMRO.expressions || {};

/**
 * Normalize format token to zero-mask used by expression code.
 * Accepts: normal, 2, 3, 4, 00, 000, ...
 */
NOMRO.expressions.normalizeNumberFormat = function (format) {
    if (format === undefined || format === null || format === '' || format === 'normal') {
        return '0';
    }

    var fmt = format.toString();
    if (/^\d+$/.test(fmt)) {
        var digits = parseInt(fmt, 10);
        if (digits > 1) {
            return new Array(digits + 1).join('0');
        }
        return '0';
    }

    if (fmt.indexOf('0') !== -1) {
        return fmt;
    }

    return '0';
};

/**
 * Resolve easing expression code through unified adapter with safe fallback.
 * @param {Object} settings - Counter settings
 * @returns {string} Easing expression for "t" in range [0..1]
 */
NOMRO.expressions.resolveEasingExpression = function (settings) {
    settings = settings || {};

    var easingConfig = settings.easingConfig || null;
    var legacyEasing = settings.easing || 'linear';
    var curveLibrary = settings.curveLibrary || null;

    if (NOMRO.easingAdapter && NOMRO.easingAdapter.getExpressionFromConfig) {
        return NOMRO.easingAdapter.getExpressionFromConfig(easingConfig, legacyEasing, curveLibrary);
    }

    if (NOMRO.easing && NOMRO.easing.getFromConfig) {
        return NOMRO.easing.getFromConfig(easingConfig, legacyEasing, curveLibrary);
    }

    return 't';
};

/**
 * Generate embedded counter expression (uses thisLayer)
 * @param {Object} settings - Counter settings
 * @returns {string} Complete expression
 */
NOMRO.expressions.generateEmbedded = function (settings) {
    var easingCode = NOMRO.expressions.resolveEasingExpression(settings);

    // Format settings
    var numFormat = NOMRO.expressions.normalizeNumberFormat(settings.numberFormat);
    var prefix = settings.symbol || '';
    var suffix = settings.suffix || '';
    var separator = settings.separator || '';
    var pos = settings.formatPos || 'left';

    // Escape strings for expression
    var escPrefix = prefix.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    var escSuffix = suffix.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    var escSeparator = separator;

    // Format function
    var formatCode = '(function(num, fmt, pre, suf, pos, sep, dec) {\n';
    formatCode += '  var n = dec ? Number(num).toFixed(2) : Math.round(num).toString();\n';
    formatCode += '  var parts = n.split(".");\n';
    formatCode += '  var intPart = parts[0];\n';
    formatCode += '  var decPart = parts.length > 1 ? "." + parts[1] : "";\n';
    formatCode += '  var match = fmt.match(/0+/);\n';
    formatCode += '  var zeros = match ? match[0].length : 1;\n';
    formatCode += '  var str = Math.abs(parseInt(intPart)).toString();\n';
    formatCode += '  while (str.length < zeros) str = "0" + str;\n';
    formatCode += '  if (sep !== "") {\n';
    formatCode += '      str = str.replace(/\\B(?=(\\d{3})+(?!\\d))/g, sep);\n';
    formatCode += '  }\n';
    formatCode += '  var isNeg = num < 0 && Math.abs(num) >= (dec ? 0.005 : 0.5);\n';
    formatCode += '  var sign = isNeg ? "-" : "";\n';
    formatCode += '  return (pos === "left") ? (sign + pre + str + decPart + suf) : (sign + suf + str + decPart + pre);\n';
    formatCode += '})(rawValue, "' + numFormat + '", "' + escPrefix + '", "' + escSuffix + '", "' + pos + '", "' + escSeparator + '", ' + (settings.decimals ? 'true' : 'false') + ')';

    var expr = '';
    expr += '// NOMRO Counter v' + NOMRO.version + ' (Embedded)\n';
    expr += '// Controls are on this layer\n\n';

    // Read sliders from thisLayer
    expr += 'var startM = 0; try { startM = thisLayer.effect("NOMRO_Start_M")("Slider"); } catch(e){}\n';
    expr += 'var start = (startM * 1000000) + thisLayer.effect("NOMRO_Start")("Slider");\n';
    expr += 'var endM = 0; try { endM = thisLayer.effect("NOMRO_End_M")("Slider"); } catch(e){}\n';
    expr += 'var end = (endM * 1000000) + thisLayer.effect("NOMRO_End")("Slider");\n';
    // Time calculation (Frame-based for FPS accuracy)
    if (settings.useMarkers) {
        expr += '// Duration from IN/OUT markers\n';
        expr += 'var inTime = inPoint;\n';
        expr += 'var outTime = outPoint;\n';
        expr += 'var markers = thisLayer.marker;\n';
        expr += 'if (markers.numKeys >= 1) {\n';
        expr += '    for (var i = 1; i <= markers.numKeys; i++) {\n';
        expr += '        var comment = markers.key(i).comment.toLowerCase();\n';
        expr += '        if (comment === "in" || comment === "start") inTime = markers.key(i).time;\n';
        expr += '        if (comment === "out" || comment === "end") outTime = markers.key(i).time;\n';
        expr += '    }\n';
        expr += '}\n';
        expr += 'var currentFrame = timeToFrames(time - inTime);\n';
        expr += 'var durationFrames = timeToFrames(Math.max(0.001, outTime - inTime));\n';
    } else {
        expr += 'var duration = thisLayer.effect("NOMRO_Duration")("Slider");\n';
        expr += 'var delay = 0; try { delay = thisLayer.effect("NOMRO_Delay")("Slider"); } catch(e){}\n';
        expr += 'var currentFrame = timeToFrames(time - inPoint - delay);\n';
        expr += 'var durationFrames = timeToFrames(duration);\n';
    }

    expr += 'var t = durationFrames > 0 ? Math.min(1, Math.max(0, currentFrame / durationFrames)) : 0;\n';
    expr += 'var k = ' + easingCode + ';\n';
    expr += 'var rawValue = start + (end - start) * k;\n';
    expr += formatCode;

    // Inject Embedded Configuration (Source of Truth)
    expr += '\n/* NOMRO_CONFIG = ' + JSON.stringify(settings) + ' */';

    return expr;
};

/**
 * Generate embedded countdown expression (uses thisLayer)
 * Supports multiple duration modes: manual, auto, realtime, markers
 * @param {Object} settings - Countdown settings
 * @returns {string} Complete expression
 */
NOMRO.expressions.generateCountdownEmbedded = function (settings) {
    var durationMode = settings.durationMode || 'manual';
    var displayFormat = settings.format || 'hms';

    var expr = '// NOMRO Countdown v' + NOMRO.version + ' (Embedded)\n';
    expr += '// Controls are on this layer\n\n';

    // Read values from thisLayer
    expr += 'var startVal = thisLayer.effect("NOMRO_Start")("Slider");\n';
    expr += 'var endVal = thisLayer.effect("NOMRO_End")("Slider");\n\n';

    // Duration calculation based on mode
    if (durationMode === 'auto') {
        expr += '// Duration = layer duration\n';
        expr += 'var dur = outPoint - inPoint;\n';
    } else if (durationMode === 'realtime') {
        expr += '// Duration = difference between start and end (realtime)\n';
        expr += 'var dur = Math.abs(startVal - endVal);\n';
    } else if (durationMode === 'markers') {
        expr += '// Duration from IN/OUT markers\n';
        expr += 'var inTime = inPoint;\n';
        expr += 'var outTime = outPoint;\n';
        expr += 'var markers = thisLayer.marker;\n';
        expr += 'if (markers.numKeys >= 1) {\n';
        expr += '    for (var i = 1; i <= markers.numKeys; i++) {\n';
        expr += '        var comment = markers.key(i).comment.toLowerCase();\n';
        expr += '        if (comment === "in" || comment === "start") inTime = markers.key(i).time;\n';
        expr += '        if (comment === "out" || comment === "end") outTime = markers.key(i).time;\n';
        expr += '    }\n';
        expr += '}\n';
        expr += 'var dur = Math.max(0.001, outTime - inTime);\n';
        expr += 'var elapsed = time - inTime;\n';
    } else {
        // manual mode
        expr += '// Duration from slider\n';
        expr += 'var dur = thisLayer.effect("NOMRO_Duration")("Slider");\n';
    }

    // Time progress (Frame-based for FPS accuracy)
    if (durationMode !== 'markers') {
        expr += 'var currentFrame = timeToFrames(time - inPoint);\n';
        expr += 'var durationFrames = timeToFrames(dur);\n';
        expr += 'var tRaw = durationFrames > 0 ? clamp(currentFrame / durationFrames, 0, 1) : 0;\n';
    } else {
        expr += 'var currentFrame = timeToFrames(time - inTime);\n';
        expr += 'var durationFrames = timeToFrames(outTime - inTime);\n';
        expr += 'var tRaw = durationFrames > 0 ? clamp(currentFrame / durationFrames, 0, 1) : 0;\n';
    }

    var easingCode = NOMRO.expressions.resolveEasingExpression(settings);
    expr += 'var t = tRaw;\n';
    expr += 'var k = ' + easingCode + ';\n';
    expr += 'var val = startVal + (endVal - startVal) * k;\n\n';

    // Format helper
    expr += '// Time formatting\n';
    expr += 'function pad(n) { return ("0" + Math.abs(n)).slice(-2); }\n';
    expr += 'var fps = Math.round(1.0 / thisComp.frameDuration);\n';
    expr += 'var absVal = Math.abs(val);\n';
    expr += 'var absSec = Math.floor(absVal);\n';
    expr += 'var frac = absVal - absSec;\n';
    expr += 'var frames = Math.round(frac * fps);\n';
    expr += 'if (frames >= fps) { frames = 0; absSec += 1; }\n';
    expr += 'var hours = Math.floor(absSec / 3600);\n';
    expr += 'var mins = Math.floor((absSec % 3600) / 60);\n';
    expr += 'var secs = absSec % 60;\n';
    expr += 'var isZero = (hours === 0 && mins === 0 && secs === 0 && ("' + displayFormat + '".indexOf("f") === -1 || frames === 0));\n';
    expr += 'var sign = (val < 0 && !isZero) ? "-" : "";\n\n';

    // Format output
    if (displayFormat === 'hmsf') {
        expr += 'sign + pad(hours) + ":" + pad(mins) + ":" + pad(secs) + ":" + pad(frames);';
    } else if (displayFormat === 'msf') {
        expr += 'var totalMins = Math.floor(absSec / 60);\n';
        expr += 'sign + pad(totalMins) + ":" + pad(secs) + ":" + pad(frames);';
    } else if (displayFormat === 'sf') {
        expr += 'sign + pad(absSec) + ":" + pad(frames);';
    } else if (displayFormat === 'hms') {
        expr += 'sign + pad(hours) + ":" + pad(mins) + ":" + pad(secs);';
    } else if (displayFormat === 'ms') {
        expr += 'var totalMins = Math.floor(absSec / 60);\n';
        expr += 'sign + pad(totalMins) + ":" + pad(secs);';
    } else if (displayFormat === 's') {
        expr += 'sign + pad(absSec);';
    } else {
        expr += 'Math.round(val).toString();';
    }

    // Inject Embedded Configuration (Source of Truth)
    expr += '\n/* NOMRO_CONFIG = ' + JSON.stringify(settings) + ' */';

    return expr;
};

// ============================================
// ADVANCED MARKER EXPRESSION (FREE TAB)
// ============================================

/**
 * Generate expression with advanced marker support (Accumulated Time Algorithm)
 * Supports: START/STOP, PAUSE/RESUME, TARGET, JUMP, SPEED
 * @param {Object} settings - Counter settings
 * @returns {string} Complete expression with marker parsing
 */
NOMRO.expressions.generateFreeExpression = function (settings) {
    var easingCode = NOMRO.expressions.resolveEasingExpression(settings);

    // Format settings
    var numFormat = NOMRO.expressions.normalizeNumberFormat(settings.numberFormat);
    var prefix = settings.symbol || '';
    var suffix = settings.suffix || '';
    var separator = settings.separator || '';
    var pos = settings.formatPos || 'left';

    var escPrefix = prefix.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    var escSuffix = suffix.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    var escSeparator = separator;

    // Format function (reusable with decimals support)
    var formatCode = '(function(num, fmt, pre, suf, pos, sep, dec) {\n';
    formatCode += '  var n = dec ? Number(num).toFixed(2) : Math.round(num).toString();\n';
    formatCode += '  var parts = n.split(".");\n';
    formatCode += '  var intPart = parts[0];\n';
    formatCode += '  var decPart = parts.length > 1 ? "." + parts[1] : "";\n';
    formatCode += '  var match = fmt.match(/0+/);\n';
    formatCode += '  var zeros = match ? match[0].length : 1;\n';
    formatCode += '  var str = Math.abs(parseInt(intPart)).toString();\n';
    formatCode += '  while (str.length < zeros) str = "0" + str;\n';
    formatCode += '  if (sep !== "") {\n';
    formatCode += '      str = str.replace(/\\B(?=(\\d{3})+(?!\\d))/g, sep);\n';
    formatCode += '  }\n';
    formatCode += '  var isNeg = num < 0 && Math.abs(num) >= (dec ? 0.005 : 0.5);\n';
    formatCode += '  var sign = isNeg ? "-" : "";\n';
    formatCode += '  return (pos === "left") ? (sign + pre + str + decPart + suf) : (sign + suf + str + decPart + pre);\n';
    formatCode += '})(rawValue, "' + numFormat + '", "' + escPrefix + '", "' + escSuffix + '", "' + pos + '", "' + escSeparator + '", ' + (settings.decimals ? 'true' : 'false') + ')';

    var expr = '';
    expr += '// NOMRO Counter v' + NOMRO.version + ' (Free Mode - Advanced Markers)\n';
    expr += '// Supports: START, STOP, PAUSE, RESUME, TARGET:val, JUMP:val, SPEED:mult\n\n';

    // Read sliders from thisLayer
    expr += 'var startM = 0; try { startM = thisLayer.effect("NOMRO_Start_M")("Slider"); } catch(e){}\n';
    expr += 'var startVal = (startM * 1000000) + thisLayer.effect("NOMRO_Start")("Slider");\n';
    expr += 'var endM = 0; try { endM = thisLayer.effect("NOMRO_End_M")("Slider"); } catch(e){}\n';
    expr += 'var endVal = (endM * 1000000) + thisLayer.effect("NOMRO_End")("Slider");\n';
    expr += 'var baseDuration = thisLayer.effect("NOMRO_Duration")("Slider");\n\n';

    // Accumulated Time Algorithm (Core)
    expr += '// === ACCUMULATED TIME ALGORITHM ===\n';
    expr += 'var markers = thisLayer.marker;\n';
    expr += 'var accumulated = 0;\n';
    expr += 'var isPlaying = false;\n';
    expr += 'var lastStart = inPoint;\n';
    expr += 'var currentValue = startVal;\n';
    expr += 'var speedMultiplier = 1;\n\n';

    // Parse markers loop
    expr += 'for (var i = 1; i <= markers.numKeys; i++) {\n';
    expr += '    var mTime = markers.key(i).time;\n';
    expr += '    if (mTime > time) break;\n';
    expr += '    var comment = markers.key(i).comment.toUpperCase();\n\n';

    // START command
    expr += '    if (comment === "START" || comment === "RESUME") {\n';
    expr += '        if (!isPlaying) {\n';
    expr += '            isPlaying = true;\n';
    expr += '            lastStart = mTime;\n';
    expr += '        }\n';
    expr += '    }\n';

    // STOP command
    expr += '    else if (comment === "STOP" || comment === "PAUSE") {\n';
    expr += '        if (isPlaying) {\n';
    expr += '            accumulated += (mTime - lastStart) * speedMultiplier;\n';
    expr += '            isPlaying = false;\n';
    expr += '        }\n';
    expr += '    }\n';

    // TARGET:value command
    expr += '    else if (comment.indexOf("TARGET:") === 0) {\n';
    expr += '        var targetVal = parseFloat(comment.split(":")[1]) || 0;\n';
    expr += '        // Calculate progress up to this point\n';
    expr += '        if (isPlaying) accumulated += (mTime - lastStart) * speedMultiplier;\n';
    expr += '        var progress = baseDuration > 0 ? Math.min(1, accumulated / baseDuration) : 0;\n';
    expr += '        currentValue = startVal + (endVal - startVal) * progress;\n';
    expr += '        // Set new target\n';
    expr += '        startVal = currentValue;\n';
    expr += '        endVal = targetVal;\n';
    expr += '        accumulated = 0;\n';
    expr += '        lastStart = mTime;\n';
    expr += '    }\n';

    // JUMP:value command
    expr += '    else if (comment.indexOf("JUMP:") === 0) {\n';
    expr += '        var jumpVal = parseFloat(comment.split(":")[1]) || 0;\n';
    expr += '        currentValue = jumpVal;\n';
    expr += '        startVal = jumpVal;\n';
    expr += '        accumulated = 0;\n';
    expr += '        lastStart = mTime;\n';
    expr += '    }\n';

    // SPEED:multiplier command
    expr += '    else if (comment.indexOf("SPEED:") === 0) {\n';
    expr += '        var newSpeed = parseFloat(comment.split(":")[1]) || 1;\n';
    expr += '        if (isPlaying) accumulated += (mTime - lastStart) * speedMultiplier;\n';
    expr += '        speedMultiplier = newSpeed;\n';
    expr += '        lastStart = mTime;\n';
    expr += '    }\n';

    expr += '}\n\n';

    // Final calculation
    expr += '// === FINAL VALUE CALCULATION ===\n';
    expr += 'if (isPlaying) {\n';
    expr += '    accumulated += (time - lastStart) * speedMultiplier;\n';
    expr += '}\n';
    expr += 'var t = baseDuration > 0 ? Math.min(1, Math.max(0, accumulated / baseDuration)) : 0;\n';
    expr += 'var k = ' + easingCode + ';\n';
    expr += 'var rawValue = startVal + (endVal - startVal) * k;\n';
    expr += formatCode + '\n';

    // Embed configuration
    expr += '\n/* NOMRO_CONFIG = ' + JSON.stringify(settings) + ' */';

    return expr;
};
