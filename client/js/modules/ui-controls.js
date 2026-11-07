/**
 * NOMRO - UI Controls Module
 * Handles tabs, inputs, easing, and format controls
 * @module modules/ui-controls
 */
var UIControlsModule = (function () {
    'use strict';

    var _elements = null;
    var _state = null;
    var _callbacks = {};

    /**
     * Initialize the module
     * @param {Object} elements - Cached DOM elements  
     * @param {Object} state - App state reference
     * @param {Object} callbacks - { onUpdatePreview, onUpdateTimer }
     */
    function init(elements, state, callbacks) {
        _elements = elements;
        _state = state;
        _callbacks = callbacks || {};

        initTabs();
        initInputArrows();
        initMathInputs();
        initInputs();
        initEasing();
        initFormat();
    }

    // ========================================
    // TAB NAVIGATION
    // ========================================
    function initTabs() {
        if (!_elements.tabButtons) return;

        _elements.tabButtons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var tabId = btn.getAttribute('data-tab');
                switchTab(tabId);
            });
        });

        window.addEventListener('resize', updateTabSlider);
    }

    function switchTab(tabId) {
        if (window.NOMRO_App) {
            window.NOMRO_App.currentTab = tabId;
            if (tabId === 'counter' || tabId === 'timer') {
                window.NOMRO_App.lastActiveSettingsTab = tabId;
            }
        }

        _elements.tabButtons.forEach(function (btn) {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
        });

        _elements.panels.forEach(function (panel) {
            panel.classList.toggle('active', panel.id === 'panel-' + tabId);
        });

        updateTabSlider();
    }

    function updateTabSlider() {
        var activeTab = document.querySelector('.tab-btn.active');
        if (!activeTab || !_elements.tabSlider) return;

        var tabRect = activeTab.getBoundingClientRect();
        var navRect = activeTab.parentElement.getBoundingClientRect();

        _elements.tabSlider.style.width = tabRect.width + 'px';
        _elements.tabSlider.style.left = (tabRect.left - navRect.left) + 'px';
    }

    // ========================================
    // MATH EVALUATOR & ARROW STEPPING
    // ========================================
    var MathEvaluator = {
        /**
         * Safely evaluate a basic math expression string (+, -, *, /, %, ^, parentheses)
         * @param {string|number} expr
         * @param {number} [fallback=0]
         * @returns {number}
         */
        evaluate: function (expr, fallback) {
            if (typeof expr === 'number') return isNaN(expr) ? (fallback || 0) : expr;
            if (!expr || typeof expr !== 'string') return fallback !== undefined ? fallback : 0;

            var clean = expr.trim();
            if (clean === '') return fallback !== undefined ? fallback : 0;

            // Direct numeric match
            if (/^-?\d+(\.\d+)?$/.test(clean)) {
                var direct = parseFloat(clean);
                return isNaN(direct) ? (fallback || 0) : direct;
            }

            // Verify safe arithmetic characters only: digits, +, -, *, /, %, ^, parentheses, decimal point, spaces
            if (/^[0-9+\-*/%^().\s]+$/.test(clean)) {
                try {
                    var sanitized = clean.replace(/\^/g, '**');
                    // eslint-disable-next-line no-new-func
                    var result = Function('"use strict"; return (' + sanitized + ')')();
                    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                        return parseFloat(result.toFixed(4));
                    }
                    return fallback !== undefined ? fallback : 0;
                } catch (e) {
                    return fallback !== undefined ? fallback : 0;
                }
            }

            var fallbackNum = parseFloat(clean);
            return isNaN(fallbackNum) ? (fallback !== undefined ? fallback : 0) : fallbackNum;
        },

        /**
         * Clamps a value based on input min/max attributes
         */
        clamp: function (val, input) {
            if (!input) return val;
            var min = input.getAttribute('min');
            if (min !== null && min !== '' && !isNaN(parseFloat(min))) {
                val = Math.max(parseFloat(min), val);
            }
            var max = input.getAttribute('max');
            if (max !== null && max !== '' && !isNaN(parseFloat(max))) {
                val = Math.min(parseFloat(max), val);
            }
            return parseFloat(val.toFixed(4));
        },

        /**
         * Evaluates math expression inside an input field, clamps it, and triggers update events
         */
        applyInputMath: function (input) {
            if (!input) return;
            var raw = input.value;
            var evaluated = MathEvaluator.evaluate(raw, 0);
            var clamped = MathEvaluator.clamp(evaluated, input);
            input.value = clamped;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        },

        /**
         * Steps an input up or down with Shift (10x) and Alt (0.1x) support
         */
        stepInput: function (input, action, e) {
            if (!input) return;
            var currentVal = MathEvaluator.evaluate(input.value, 0);
            var step = parseFloat(input.getAttribute('step'));
            if (isNaN(step) || step <= 0) {
                var id = input.id || '';
                if (id.indexOf('duration') !== -1 || id.indexOf('startat') !== -1) {
                    step = 0.5;
                } else if (id.indexOf('pct') !== -1) {
                    step = 0.05;
                } else {
                    step = 1;
                }
            }

            if (e && e.shiftKey) {
                step *= 10;
            } else if (e && e.altKey) {
                step = Math.max(step / 10, 0.01);
            }

            var newVal = action === 'up' ? currentVal + step : currentVal - step;
            var clamped = MathEvaluator.clamp(newVal, input);

            input.value = clamped;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    };

    // ========================================
    // INPUT ARROWS
    // ========================================
    function initInputArrows() {
        var arrowButtons = document.querySelectorAll('.input-arrow-compact[data-action]');

        arrowButtons.forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                var action = btn.getAttribute('data-action');
                var targetId = btn.getAttribute('data-target');
                var input = document.getElementById(targetId);

                if (input) {
                    MathEvaluator.stepInput(input, action, e);
                }
            });
        });
    }

    // ========================================
    // MATH INPUTS (Arithmetic Evaluation & Keys)
    // ========================================
    function initMathInputs() {
        var selector = '#start-value, #end-value, #duration-value, #input-hours, #input-mins, #input-secs, #input-frames, #input-end-h, #input-end-m, #input-end-s, #input-end-f, #input-duration, #input-startat, #ease-in-pct, #ease-out-pct';
        var inputs = document.querySelectorAll(selector);

        inputs.forEach(function (input) {
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    MathEvaluator.applyInputMath(input);
                    input.blur();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    MathEvaluator.stepInput(input, 'up', e);
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    MathEvaluator.stepInput(input, 'down', e);
                }
            });

            input.addEventListener('blur', function () {
                MathEvaluator.applyInputMath(input);
            });
        });
    }

    // ========================================
    // INPUT HANDLING
    // ========================================
    function initInputs() {
        if (_elements.startValue) {
            _elements.startValue.addEventListener('input', function () {
                var val = MathEvaluator.evaluate(this.value, _state.counter.start);
                _state.counter.start = val;
                if (_callbacks.onUpdatePreview) _callbacks.onUpdatePreview();
            });
        }

        if (_elements.endValue) {
            _elements.endValue.addEventListener('input', function () {
                var val = MathEvaluator.evaluate(this.value, _state.counter.end);
                _state.counter.end = val;
                if (_callbacks.onUpdatePreview) _callbacks.onUpdatePreview();
            });
        }

        if (_elements.durationValue) {
            _elements.durationValue.addEventListener('input', function () {
                var val = MathEvaluator.evaluate(this.value, _state.counter.duration);
                _state.counter.duration = val;
            });
        }
    }

    // ========================================
    // EASING (5 GOLDEN CURVES)
    // ========================================
    function _ensureEasingConfig() {
        if (!_state.counter.easingConfig) {
            _state.counter.easingConfig = {
                mode: 'single',
                singleCurveId: _state.counter.easing || 'smoothOut'
            };
        }

        if (typeof EasingValidator !== 'undefined') {
            _state.counter.easingConfig = EasingValidator.sanitizeConfig(_state.counter.easingConfig);
        }

        _state.counter.easing = _state.counter.easingConfig.singleCurveId;
    }

    function _syncEasingUI(selectedCurve) {
        var resolved = 'smoothOut';
        if (typeof EasingDefaults !== 'undefined' && EasingDefaults.resolveCurveId) {
            resolved = EasingDefaults.resolveCurveId(selectedCurve);
        } else {
            resolved = selectedCurve || 'smoothOut';
        }

        var buttons = document.querySelectorAll('[data-easing]');
        if (buttons && buttons.length) {
            for (var i = 0; i < buttons.length; i++) {
                var btn = buttons[i];
                var curveId = btn.getAttribute('data-easing');
                if (curveId === resolved) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        }

        if (_elements.singleEasingCurve) {
            _elements.singleEasingCurve.value = resolved;
        }
    }

    function applyEasingConfig(config, legacyCurve, curveLibrary) {
        _ensureEasingConfig();

        var candidate = legacyCurve || _state.counter.easing || 'smoothOut';
        if (config && typeof config === 'object') {
            if (config.mode === 'dual' && config.dual && config.dual.outCurveId) {
                candidate = config.dual.outCurveId;
            } else if (config.singleCurveId) {
                candidate = config.singleCurveId;
            }
        }

        var resolved = 'smoothOut';
        if (typeof EasingDefaults !== 'undefined' && EasingDefaults.resolveCurveId) {
            resolved = EasingDefaults.resolveCurveId(candidate);
        } else {
            resolved = candidate;
        }

        var normalized = {
            mode: 'single',
            singleCurveId: resolved
        };

        _state.counter.easingConfig = normalized;
        _state.counter.easing = resolved;
        _state.counter.curveLibrary = [];

        _syncEasingUI(resolved);
    }

    function initEasing() {
        _ensureEasingConfig();

        // 1. One-click Segmented Buttons for the 5 Golden Curves
        var buttons = document.querySelectorAll('[data-easing]');
        if (buttons && buttons.length) {
            for (var i = 0; i < buttons.length; i++) {
                (function (btn) {
                    btn.addEventListener('click', function () {
                        var curveId = btn.getAttribute('data-easing');
                        applyEasingConfig({
                            mode: 'single',
                            singleCurveId: curveId
                        }, curveId);

                        if (_callbacks.onUpdatePreview) {
                            _callbacks.onUpdatePreview();
                        }
                    });
                })(buttons[i]);
            }
        }

        // 2. Synchronized change listener on hidden/fallback select for presets
        if (_elements.singleEasingCurve) {
            _elements.singleEasingCurve.addEventListener('change', function () {
                var selected = this.value || 'smoothOut';
                applyEasingConfig({
                    mode: 'single',
                    singleCurveId: selected
                }, selected);

                if (_callbacks.onUpdatePreview) {
                    _callbacks.onUpdatePreview();
                }
            });
        }

        applyEasingConfig(_state.counter.easingConfig, _state.counter.easing);
    }

    function initFormat() {
        // Number format segments
        _elements.formatSegments.forEach(function (segment) {
            segment.addEventListener('click', function () {
                _elements.formatSegments.forEach(function (s) { s.classList.remove('active'); });
                segment.classList.add('active');
                _state.counter.format = segment.getAttribute('data-format');
                if (_callbacks.onUpdatePreview) _callbacks.onUpdatePreview();
            });
        });

        // Separator segments
        _elements.separatorSegments.forEach(function (segment) {
            segment.addEventListener('click', function () {
                _elements.separatorSegments.forEach(function (s) { s.classList.remove('active'); });
                segment.classList.add('active');
                _state.counter.separator = segment.getAttribute('data-separator');
                if (_callbacks.onUpdatePreview) _callbacks.onUpdatePreview();
            });
        });

        // Symbol preset buttons
        _elements.symbolPresets.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var symbol = btn.getAttribute('data-symbol');
                if (symbol && _elements.prefixSymbol) {
                    _elements.prefixSymbol.value = symbol;
                    _state.counter.prefix = symbol;
                    if (_callbacks.onUpdatePreview) _callbacks.onUpdatePreview();
                }
            });
        });

        // Prefix/Suffix inputs
        if (_elements.prefixSymbol) {
            _elements.prefixSymbol.addEventListener('input', function () {
                _state.counter.prefix = this.value;
                if (_callbacks.onUpdatePreview) _callbacks.onUpdatePreview();
            });
        }

        if (_elements.suffixSymbol) {
            _elements.suffixSymbol.addEventListener('input', function () {
                _state.counter.suffix = this.value;
                if (_callbacks.onUpdatePreview) _callbacks.onUpdatePreview();
            });
        }

        // Alignment buttons
        if (_elements.alignLeftBtn) {
            _elements.alignLeftBtn.addEventListener('click', function () {
                _state.counter.symbolPosition = 'left';
                _elements.alignLeftBtn.classList.add('active');
                if (_elements.alignRightBtn) _elements.alignRightBtn.classList.remove('active');
                if (_callbacks.onUpdatePreview) _callbacks.onUpdatePreview();
            });
        }

        if (_elements.alignRightBtn) {
            _elements.alignRightBtn.addEventListener('click', function () {
                _state.counter.symbolPosition = 'right';
                _elements.alignRightBtn.classList.add('active');
                if (_elements.alignLeftBtn) _elements.alignLeftBtn.classList.remove('active');
                if (_callbacks.onUpdatePreview) _callbacks.onUpdatePreview();
            });
        }

        // Toggle buttons
        _initToggleButton(_elements.toggleMonospaceBtn, 'monospace', function (active) {
            if (_elements.previewNumber) {
                _elements.previewNumber.style.fontFamily = active ? 'var(--font-mono)' : 'var(--font-primary)';
            }
        });

        _initToggleButton(_elements.toggleDecimalsBtn, 'decimals', function () {
            if (_callbacks.onUpdatePreview) _callbacks.onUpdatePreview();
        });

        _initToggleButton(_elements.toggleCommasBtn, 'commas', function () {
            if (_callbacks.onUpdatePreview) _callbacks.onUpdatePreview();
        });

        // Toggle Markers
        var toggleMarkersBtn = document.getElementById('toggle-markers-btn');
        if (toggleMarkersBtn) {
            toggleMarkersBtn.addEventListener('click', function () {
                _state.counter.useMarkers = !_state.counter.useMarkers;
                toggleMarkersBtn.classList.toggle('active', _state.counter.useMarkers);

                // Toggle duration input visibility
                if (_elements.durationValue) {
                    _elements.durationValue.parentElement.style.opacity = _state.counter.useMarkers ? '0.5' : '1';
                    _elements.durationValue.disabled = _state.counter.useMarkers;
                }

                if (_callbacks.onUpdatePreview) _callbacks.onUpdatePreview();
            });
        }
    }

    function _initToggleButton(btn, stateKey, callback) {
        if (!btn) return;

        btn.addEventListener('click', function () {
            _state.counter[stateKey] = !_state.counter[stateKey];
            btn.classList.toggle('active', _state.counter[stateKey]);
            if (callback) callback(_state.counter[stateKey]);
        });
    }

    // Public API
    return {
        init: init,
        switchTab: switchTab,
        updateTabSlider: updateTabSlider,
        applyEasingConfig: applyEasingConfig,
        evaluateMath: MathEvaluator.evaluate,
        stepInput: MathEvaluator.stepInput,
        applyInputMath: MathEvaluator.applyInputMath
    };
})();
