/**
 * NOMRO - Timer Defaults Module
 * Centralized logic for timer limits, calculations, and normalization
 * @module modules/timer-defaults
 */
var TimerDefaults = (function () {
    'use strict';

    var LIMITS = {
        HOURS: { min: 0, max: 99, default: 0 },
        MINS: { min: 0, max: 59, default: 0 },
        SECS: { min: 0, max: 59, default: 0 },
        FRAMES: { min: 0, max: 99, default: 0 },
        DURATION: { min: 0.1, max: 864000, default: 10 },
        START_AT: { min: 0, max: 864000, default: 0 }
    };

    function _clamp(value, min, max) {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }

    function _toNumber(value, fallback) {
        var num = parseFloat(value);
        return isNaN(num) ? fallback : num;
    }

    function normalizeMode(mode) {
        if (mode === 'auto' || mode === 'realtime' || mode === 'markers') {
            return mode;
        }
        return 'manual';
    }

    function normalizeFormat(format) {
        if (format === 'ms' || format === 's' || format === 'hmsf' || format === 'msf' || format === 'sf') {
            return format;
        }
        return 'hms';
    }

    function secondsToUnits(totalSeconds, fps) {
        fps = fps || 30; // Default to 30fps if not provided
        var num = _toNumber(totalSeconds, 0);
        var isNegative = num < 0;
        var absVal = Math.abs(num);
        var totalInt = Math.floor(absVal);
        var frac = absVal - totalInt;
        var frames = Math.round(frac * fps);
        if (frames >= fps) {
            frames = 0;
            totalInt += 1;
        }

        var hours = Math.floor(totalInt / 3600);
        var mins = Math.floor((totalInt % 3600) / 60);
        var secs = totalInt % 60;

        return {
            isNegative: isNegative,
            hours: _clamp(hours, LIMITS.HOURS.min, LIMITS.HOURS.max),
            mins: _clamp(mins, LIMITS.MINS.min, LIMITS.MINS.max),
            secs: _clamp(secs, LIMITS.SECS.min, LIMITS.SECS.max),
            frames: _clamp(frames, LIMITS.FRAMES.min, LIMITS.FRAMES.max)
        };
    }

    function unitsToSeconds(hours, mins, secs, frames, fps) {
        fps = fps || 30;
        var h = _clamp(_toNumber(hours, LIMITS.HOURS.default), LIMITS.HOURS.min, LIMITS.HOURS.max);
        var m = _clamp(_toNumber(mins, LIMITS.MINS.default), LIMITS.MINS.min, LIMITS.MINS.max);
        var s = _clamp(_toNumber(secs, LIMITS.SECS.default), LIMITS.SECS.min, LIMITS.SECS.max);
        var f = _clamp(_toNumber(frames, LIMITS.FRAMES.default), LIMITS.FRAMES.min, LIMITS.FRAMES.max);
        
        return (h * 3600) + (m * 60) + s + (f / fps);
    }

    function pad2(n) {
        var num = Math.abs(parseInt(n, 10) || 0);
        return (num < 10 ? '0' : '') + num;
    }

    function formatDisplayTime(totalSeconds, format, fps) {
        fps = fps || 30;
        var isNeg = totalSeconds < 0;
        var absVal = Math.abs(totalSeconds);
        var absSec = Math.floor(absVal);
        var frac = absVal - absSec;
        var frames = Math.round(frac * fps);
        if (frames >= fps) {
            frames = 0;
            absSec += 1;
        }

        var hours = Math.floor(absSec / 3600);
        var mins = Math.floor((absSec % 3600) / 60);
        var secs = absSec % 60;
        var sign = isNeg ? "-" : "";

        if (format === 'hms') {
            return sign + pad2(hours) + ":" + pad2(mins) + ":" + pad2(secs);
        } else if (format === 'ms') {
            var totalMins = Math.floor(absSec / 60);
            return sign + pad2(totalMins) + ":" + pad2(secs);
        } else if (format === 'hmsf') {
            return sign + pad2(hours) + ":" + pad2(mins) + ":" + pad2(secs) + ":" + pad2(frames);
        } else if (format === 'msf') {
            var totalMinsF = Math.floor(absSec / 60);
            return sign + pad2(totalMinsF) + ":" + pad2(secs) + ":" + pad2(frames);
        } else if (format === 'sf') {
            return sign + pad2(absSec) + ":" + pad2(frames);
        } else if (format === 's') {
            return sign + pad2(absSec);
        } else {
            return totalSeconds.toString();
        }
    }

    function applyDurationModeUI(elements, mode) {
        if (!elements) return;
        if (elements.durationModeIcons && elements.durationModeIcons.forEach) {
            elements.durationModeIcons.forEach(function (btn) {
                var radio = btn.querySelector('input');
                var isActive = !!(radio && radio.value === mode);
                if (radio) radio.checked = isActive;
                btn.classList.toggle('active', isActive);
            });
        }

        if (elements.durationManualGroup) {
            elements.durationManualGroup.style.display = (mode === 'manual') ? 'flex' : 'none';
        }

        if (elements.inputDuration) {
            elements.inputDuration.disabled = (mode !== 'manual');
        }
    }

    function validateSettings(settings) {
        settings = settings || {};
        
        var valid = {
            counterType: 'timer',
            start: _toNumber(settings.start, 0),
            end: _toNumber(settings.end, 0),
            durationMode: normalizeMode(settings.durationMode),
            duration: _clamp(_toNumber(settings.duration, LIMITS.DURATION.default), LIMITS.DURATION.min, LIMITS.DURATION.max),
            startAt: _clamp(_toNumber(settings.startAt, LIMITS.START_AT.default), LIMITS.START_AT.min, LIMITS.START_AT.max),
            format: normalizeFormat(settings.format),
            monospace: !!settings.monospace,
            easing: settings.easing || 'linear',
            easingConfig: settings.easingConfig || { mode: 'single', singleCurveId: 'linear' },
            curveLibrary: settings.curveLibrary || [],
            fps: _toNumber(settings.fps, 30)
        };
        
        return valid;
    }

    return {
        LIMITS: LIMITS,
        normalizeMode: normalizeMode,
        normalizeFormat: normalizeFormat,
        secondsToUnits: secondsToUnits,
        unitsToSeconds: unitsToSeconds,
        pad2: pad2,
        formatDisplayTime: formatDisplayTime,
        applyDurationModeUI: applyDurationModeUI,
        validateSettings: validateSettings
    };
})();
