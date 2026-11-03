/**
 * NOMRO - Presets Module
 * Handles preset management
 * @module modules/presets
 */
var PresetsModule = (function () {
    'use strict';

    var _elements = null;
    var _state = null;
    var _callbacks = {};

    function _toNumber(value, fallback) {
        var num = parseFloat(value);
        return isNaN(num) ? fallback : num;
    }



    function _applyTimerModeUI(mode) {
        if (typeof TimerDefaults !== 'undefined' && TimerDefaults.applyDurationModeUI) {
            TimerDefaults.applyDurationModeUI(_elements, mode);
        }
    }

    /**
     * Initialize the module
     * @param {Object} elements - Cached DOM elements
     * @param {Object} state - App state reference
     * @param {Object} callbacks - Callback functions { onSwitchTab, onUpdatePreview, onUpdateTimer, onShowToast }
     */
    function init(elements, state, callbacks) {
        _elements = elements;
        _state = state;
        _callbacks = callbacks || {};

        if (typeof PresetView !== 'undefined' && typeof PresetService !== 'undefined') {
            PresetView.render(PresetService.getAll());

            PresetView.bindEvents({
                onSave: _handleSave,
                onLoad: _handleLoad,
                onDelete: _handleDelete
            });
        }
    }

    /**
     * Handle save preset
     * @param {string} name - Preset name
     */
    function _handleSave(name) {
        var currentTab = window.NOMRO_App ? window.NOMRO_App.currentTab : 'counter';
        if (currentTab === 'presets' && window.NOMRO_App && window.NOMRO_App.lastActiveSettingsTab) {
            currentTab = window.NOMRO_App.lastActiveSettingsTab;
        }
        var settings = _getSettingsForCurrentTab(currentTab);
        PresetService.save(name, settings);
        PresetView.render(PresetService.getAll());
        if (_callbacks.onShowToast) {
            _callbacks.onShowToast('Preset saved!', 'success');
        }
    }

    /**
     * Get settings for current tab
     * @param {string} currentTab - 'counter' or 'timer'
     * @returns {Object} Settings object
     */
    function _getSettingsForCurrentTab(currentTab) {
        var settings = {};

        if (currentTab === 'counter') {
            settings.counterType = 'basic';
            settings.start = _state.counter.start;
            settings.end = _state.counter.end;
            settings.duration = _state.counter.duration;
            var easingSettings = {
                schemaVersion: 2,
                easing: _state.counter.easing,
                easingConfig: _state.counter.easingConfig,
                curveLibrary: _state.counter.curveLibrary
            };

            if (typeof EasingValidator !== 'undefined') {
                easingSettings = EasingValidator.sanitizeSettings(easingSettings);
            }

            settings.schemaVersion = easingSettings.schemaVersion || 2;
            settings.easingConfig = easingSettings.easingConfig || { mode: 'single', singleCurveId: _state.counter.easing || 'linear' };
            settings.curveLibrary = easingSettings.curveLibrary || [];
            settings.easing = easingSettings.easing || _state.counter.easing || 'linear';
            settings.numberFormat = _state.counter.format;
            settings.symbol = _state.counter.prefix;
            settings.suffix = _state.counter.suffix;
            settings.separator = _state.counter.separator;
            settings.formatPos = _state.counter.symbolPosition;
            settings.monospace = _state.counter.monospace;
            settings.decimals = _state.counter.decimals;
            settings.commas = _state.counter.commas;
            settings.useMarkers = _state.counter.useMarkers || false;
        } else if (currentTab === 'timer') {
            if (typeof TimerModule !== 'undefined' && TimerModule.getSettings) {
                return TimerModule.getSettings();
            }
        }

        return settings;
    }

    /**
     * Handle load preset
     * @param {string} id - Preset ID
     */
    function _handleLoad(id) {
        var preset = PresetService.getById(id);
        if (preset && preset.settings) {
            applySettings(preset.settings);
            if (_callbacks.onShowToast) {
                _callbacks.onShowToast('Preset loaded!', 'success');
            }
        }
    }

    /**
     * Handle delete preset
     * @param {string} id - Preset ID
     */
    function _handleDelete(id) {
        PresetService.remove(id);
        PresetView.render(PresetService.getAll());
    }

    /**
     * Apply preset settings to UI
     * @param {Object} settings - Settings to apply
     */
    function applySettings(settings) {
        settings = settings || {};
        if (typeof EasingValidator !== 'undefined') {
            settings = EasingValidator.sanitizeSettings(settings);
        }
        var type = settings.counterType || 'basic';
        if (type !== 'timer') {
            if (_callbacks.onSwitchTab) _callbacks.onSwitchTab('counter');

            if (settings.start !== undefined && _elements.startValue) {
                _elements.startValue.value = settings.start;
                _state.counter.start = settings.start;
            }
            if (settings.end !== undefined && _elements.endValue) {
                _elements.endValue.value = settings.end;
                _state.counter.end = settings.end;
            }
            if (settings.duration !== undefined && _elements.durationValue) {
                _elements.durationValue.value = settings.duration;
                _state.counter.duration = settings.duration;
            }
            var easingConfig = settings.easingConfig || {
                mode: 'single',
                singleCurveId: settings.easing || _state.counter.easing || 'linear',
                dual: {
                    inCurveId: 'easeIn',
                    outCurveId: 'easeOut',
                    inPct: 0.2,
                    outPct: 0.2,
                    middleMode: 'linear'
                }
            };

            if (typeof EasingValidator !== 'undefined') {
                easingConfig = EasingValidator.sanitizeConfig(easingConfig);
            }

            _state.counter.easingConfig = easingConfig;
            _state.counter.curveLibrary = settings.curveLibrary || _state.counter.curveLibrary || [];

            var selectedCurve = easingConfig.mode === 'single'
                ? easingConfig.singleCurveId
                : (settings.easing || _state.counter.easing || 'linear');

            if (typeof UIControlsModule !== 'undefined' && UIControlsModule.applyEasingConfig) {
                UIControlsModule.applyEasingConfig(easingConfig, selectedCurve, _state.counter.curveLibrary);
            } else {
                _state.counter.easing = selectedCurve;
                var singleSelect = document.getElementById('single-easing-curve');
                if (singleSelect) {
                    singleSelect.value = selectedCurve;
                    singleSelect.dispatchEvent(new Event('change'));
                }
            }

            // Restore format (zero-padding) to DOM
            if (settings.numberFormat !== undefined) {
                _state.counter.format = settings.numberFormat;
                document.querySelectorAll('.segment-compact[data-format]').forEach(function (seg) {
                    seg.classList.toggle('active', seg.getAttribute('data-format') === settings.numberFormat);
                });
            }

            // Restore symbol/suffix to DOM
            if (settings.symbol !== undefined) {
                _state.counter.prefix = settings.symbol;
                if (_elements.prefixSymbol) _elements.prefixSymbol.value = settings.symbol;
            }
            if (settings.suffix !== undefined) {
                _state.counter.suffix = settings.suffix;
                if (_elements.suffixSymbol) _elements.suffixSymbol.value = settings.suffix;
            }

            // Restore separator to DOM
            if (settings.separator !== undefined) {
                _state.counter.separator = settings.separator;
                document.querySelectorAll('.segment-compact[data-separator]').forEach(function (seg) {
                    seg.classList.toggle('active', seg.getAttribute('data-separator') === settings.separator);
                });
            }

            // Restore symbol position to DOM
            if (settings.formatPos) {
                _state.counter.symbolPosition = settings.formatPos;
                if (_elements.alignLeftBtn) _elements.alignLeftBtn.classList.toggle('active', settings.formatPos === 'left');
                if (_elements.alignRightBtn) _elements.alignRightBtn.classList.toggle('active', settings.formatPos === 'right');
            }

            // Restore toggle buttons to DOM
            if (settings.monospace !== undefined) {
                _state.counter.monospace = settings.monospace;
                var monoBtn = document.getElementById('toggle-monospace-btn');
                if (monoBtn) monoBtn.classList.toggle('active', settings.monospace);
            }
            if (settings.decimals !== undefined) {
                _state.counter.decimals = settings.decimals;
                var decBtn = document.getElementById('toggle-decimals-btn');
                if (decBtn) decBtn.classList.toggle('active', settings.decimals);
            }
            if (settings.commas !== undefined) {
                _state.counter.commas = settings.commas;
                var comBtn = document.getElementById('toggle-commas-btn');
                if (comBtn) comBtn.classList.toggle('active', settings.commas);
            }

            if (_callbacks.onUpdatePreview) _callbacks.onUpdatePreview();

        } else if (settings.counterType === 'timer') {
            if (_callbacks.onSwitchTab) _callbacks.onSwitchTab('timer');

            var fps = _toNumber(settings.fps, _state.timer.fps || 30);
            _state.timer.fps = fps;

            // Apply Start Time
            if (settings.start !== undefined) {
                var startUnits = TimerDefaults.secondsToUnits(settings.start, fps);
                if (_elements.inputHours) _elements.inputHours.value = startUnits.hours;
                if (_elements.inputMins) _elements.inputMins.value = startUnits.mins;
                if (_elements.inputSecs) _elements.inputSecs.value = startUnits.secs;
                if (_elements.inputFrames) _elements.inputFrames.value = startUnits.frames;

                _state.timer.hours = startUnits.hours;
                _state.timer.mins = startUnits.mins;
                _state.timer.secs = startUnits.secs;
                _state.timer.frames = startUnits.frames;
            }

            // Apply End Time
            if (settings.end !== undefined) {
                var endUnits = TimerDefaults.secondsToUnits(settings.end, fps);
                if (_elements.inputEndH) _elements.inputEndH.value = endUnits.hours;
                if (_elements.inputEndM) _elements.inputEndM.value = endUnits.mins;
                if (_elements.inputEndS) _elements.inputEndS.value = endUnits.secs;
                if (_elements.inputEndF) _elements.inputEndF.value = endUnits.frames;

                _state.timer.endHours = endUnits.hours;
                _state.timer.endMins = endUnits.mins;
                _state.timer.endSecs = endUnits.secs;
                _state.timer.endFrames = endUnits.frames;
            }

            // Duration
            if (settings.duration !== undefined && _elements.inputDuration) {
                var durationNum = _toNumber(settings.duration, _state.timer.duration || 10);
                var duration = Math.min(Math.max(durationNum, 0.1), 864000);
                _elements.inputDuration.value = duration;
                _state.timer.duration = duration;
            }

            // Start At
            if (settings.startAt !== undefined && _elements.inputStartAt) {
                var startAtNum = _toNumber(settings.startAt, _state.timer.startAt || 0);
                var startAt = Math.min(Math.max(startAtNum, 0), 864000);
                _elements.inputStartAt.value = startAt;
                _state.timer.startAt = startAt;
            }

            // Format
            if (settings.format !== undefined) {
                var format = TimerDefaults.normalizeFormat(settings.format);
                _state.timer.format = format;
                if (_elements.selectCountdownFormat) {
                    var hasOption = !!_elements.selectCountdownFormat.querySelector('option[value="' + format + '"]');
                    _elements.selectCountdownFormat.value = hasOption ? format : 'hmsf';
                    if (!hasOption) {
                        _state.timer.format = 'hmsf';
                    }
                }
            }

            // Monospace
            if (settings.monospace !== undefined) {
                _state.timer.monospace = !!settings.monospace;
                var timerMonoBtn = document.getElementById('timer-toggle-monospace-btn');
                if (timerMonoBtn) {
                    timerMonoBtn.classList.toggle('active', _state.timer.monospace);
                }
            }

            // Easing & EasingConfig
            if (settings.easing !== undefined) {
                _state.timer.easing = settings.easing;
            }
            if (settings.easingConfig !== undefined) {
                _state.timer.easingConfig = settings.easingConfig;
            }
            if (settings.curveLibrary !== undefined) {
                _state.timer.curveLibrary = settings.curveLibrary;
            }

            // Duration Mode
            var mode = TimerDefaults.normalizeMode(settings.durationMode || _state.timer.durationMode);
            _state.timer.durationMode = mode;
            _applyTimerModeUI(mode);

            if (_callbacks.onUpdateTimer) _callbacks.onUpdateTimer();
        }
    }

    // Public API
    return {
        init: init,
        applySettings: applySettings
    };
})();



