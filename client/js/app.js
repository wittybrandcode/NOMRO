/**
 * NOMRO Pro - Application Entry Point
 * Updated for new compact UI with preserved functionality
 * @module app
 */
(function () {
    'use strict';

    // ========================================
    // APP STATE
    // ========================================
    var App = {
        version: '4.0.0',
        currentTab: 'counter',
        lastActiveSettingsTab: 'counter',
        isAnimating: false,
        animationFrameId: null,
        state: {
            counter: {
                start: 0,
                end: 1000,
                duration: 2,
                easing: 'linear',
                easingConfig: {
                    mode: 'single',
                    singleCurveId: 'linear',
                    dual: {
                        inCurveId: 'easeIn',
                        outCurveId: 'easeOut',
                        inPct: 0.2,
                        outPct: 0.2,
                        middleMode: 'linear'
                    }
                },
                curveLibrary: [],
                format: 'normal',
                separator: '',
                prefix: '',
                suffix: '',
                symbolPosition: 'left',
                useMarkers: false, // New feature
                monospace: false,
                decimals: false,
                commas: true
            },
            timer: {
                durationMode: 'manual',
                // Start Time
                hours: 0,
                mins: 0,
                secs: 0,
                frames: 0,
                // End Time
                endHours: 0,
                endMins: 5,
                endSecs: 0,
                endFrames: 0,
                // Config
                duration: 10,
                startAt: 0,
                format: 'hmsf',
                monospace: false,
                easing: 'linear',
                fps: 30
            }
        }
    };

    // ========================================
    // DOM ELEMENTS CACHE
    // ========================================
    var elements = {};

    function ensureCounterEasingState() {
        if (typeof EasingValidator === 'undefined') return;
        var migrated = EasingValidator.sanitizeSettings({
            schemaVersion: 2,
            easing: App.state.counter.easing,
            easingConfig: App.state.counter.easingConfig,
            curveLibrary: App.state.counter.curveLibrary
        });

        App.state.counter.easing = migrated.easing;
        App.state.counter.easingConfig = migrated.easingConfig;
        App.state.counter.curveLibrary = migrated.curveLibrary;
    }

    function cacheElements() {
        elements = {
            // Tabs
            tabContainer: document.getElementById('counter-tabs'),
            tabButtons: document.querySelectorAll('.tab-btn'),
            tabSlider: document.querySelector('.tab-slider'),
            panels: document.querySelectorAll('.panel'),

            // Counter inputs
            startValue: document.getElementById('start-value'),
            endValue: document.getElementById('end-value'),
            durationValue: document.getElementById('duration-value'),

            // Preview
            previewNumber: document.getElementById('preview-number'),
            playPreview: document.getElementById('play-preview'),
            stopPreview: document.getElementById('stop-preview'),
            resetPreview: document.getElementById('reset-preview'),

            // Timer Preview Controls
            previewPlayBtn: document.getElementById('timer-play-preview'),
            previewStopBtn: document.getElementById('timer-stop-preview'),
            previewResetBtn: document.getElementById('timer-reset-preview'),
            timerToggleMonospaceBtn: document.getElementById('timer-toggle-monospace-btn'),

            // Easing
            singleEasingCurve: document.getElementById('single-easing-curve'),
            easingModeButtons: document.querySelectorAll('[data-easing-mode]'),
            easingPanels: document.querySelectorAll('[data-easing-panel]'),
            easeInCurve: document.getElementById('ease-in-curve'),
            easeOutCurve: document.getElementById('ease-out-curve'),
            easeInPct: document.getElementById('ease-in-pct'),
            easeOutPct: document.getElementById('ease-out-pct'),
            middleMode: document.getElementById('middle-mode'),

            // Format
            formatSegments: document.querySelectorAll('[data-format]'),
            separatorSegments: document.querySelectorAll('[data-separator]'),
            prefixSymbol: document.getElementById('prefix-symbol'),
            suffixSymbol: document.getElementById('suffix-symbol'),
            symbolPresets: document.querySelectorAll('.symbol-preset-arrows .input-arrow-compact'),

            // Toggle buttons
            alignLeftBtn: document.getElementById('align-left-btn'),
            alignRightBtn: document.getElementById('align-right-btn'),
            toggleMonospaceBtn: document.getElementById('toggle-monospace-btn'),
            toggleDecimalsBtn: document.getElementById('toggle-decimals-btn'),
            toggleCommasBtn: document.getElementById('toggle-commas-btn'),

            // Timer - Start Time
            inputHours: document.getElementById('input-hours'),
            inputMins: document.getElementById('input-mins'),
            inputSecs: document.getElementById('input-secs'),
            inputFrames: document.getElementById('input-frames'),
            // Timer - End Time
            inputEndH: document.getElementById('input-end-h'),
            inputEndM: document.getElementById('input-end-m'),
            inputEndS: document.getElementById('input-end-s'),
            inputEndF: document.getElementById('input-end-f'),
            // Timer - Config
            inputDuration: document.getElementById('input-duration'),
            inputStartAt: document.getElementById('input-startat'),
            selectCountdownFormat: document.getElementById('select-countdown-format'),
            durationModeIcons: document.querySelectorAll('.mode-icon-btn-compact'),
            durationManualGroup: document.getElementById('duration-manual-group'),

            // Timer display
            timerH: document.getElementById('timer-h'),
            timerM: document.getElementById('timer-m'),
            timerS: document.getElementById('timer-s'),
            timerF: document.getElementById('timer-f'),
            timerSepF: document.getElementById('timer-sep-f'),

            // Presets
            presetNameInput: document.getElementById('input-preset-name'),
            btnSavePreset: document.getElementById('btn-save-preset'),
            presetsList: document.getElementById('presets-list'),

            // Create button
            btnCreate: document.getElementById('btn-create'),
            btnCreateCounter: document.getElementById('btn-create-counter'),
            btnCreateTimer: document.getElementById('btn-create-timer'),
            loading: document.getElementById('loading'),

            // Messages
            errorMessage: document.getElementById('error-message'),
            errorText: document.getElementById('error-text'),
            successMessage: document.getElementById('success-message'),
            successText: document.getElementById('success-text'),

            // Toast
            toastContainer: document.getElementById('toast-container'),

            // Header
            btnReset: document.getElementById('btn-reset'),
            btnHelp: document.getElementById('btn-help'),
            btnSettings: document.getElementById('btn-settings')
        };
    }

    // ========================================
    // INITIALIZATION
    // ========================================
    var linkedLayer = null; // Currently linked NOMRO layer for update mode
    var linkedLayerInfo = null;
    var unlinkedLayerKey = null; // Suppresses auto-relink for explicitly unlinked layer
    var selectionPollTimer = null;
    var selectionRequestInFlight = false;
    var selectionPollMs = 1200;

    function init() {
        Logger.log('App', 'Initializing...');

        ensureCounterEasingState();
        cacheElements();

        // Initialize UI Controls Module
        if (typeof UIControlsModule !== 'undefined') {
            UIControlsModule.init(elements, App.state, {
                onUpdatePreview: function () {
                    if (typeof CounterModule !== 'undefined') {
                        CounterModule.updatePreview();
                    }
                }
            });
            Logger.log('App', 'UIControlsModule initialized');
        } else {
            Logger.error('App', 'UIControlsModule missing; controls initialization skipped');
        }

        // Initialize Counter Module
        if (typeof CounterModule !== 'undefined') {
            CounterModule.init(elements, App.state);
            CounterModule.initPreview();
            Logger.log('App', 'CounterModule initialized');
        } else {
            Logger.error('App', 'CounterModule missing; counter features disabled');
        }

        // Initialize Timer Module
        if (typeof TimerModule !== 'undefined') {
            TimerModule.init(elements, App.state);
            Logger.log('App', 'TimerModule initialized');
        } else {
            Logger.error('App', 'TimerModule missing; timer features disabled');
        }

        // Initialize Presets Module
        if (typeof PresetsModule !== 'undefined') {
            PresetsModule.init(elements, App.state, {
                onSwitchTab: switchTab,
                onUpdatePreview: function () {
                    if (typeof CounterModule !== 'undefined') {
                        CounterModule.updatePreview();
                    }
                },
                onUpdateTimer: function () {
                    if (typeof TimerModule !== 'undefined') {
                        TimerModule.updateDisplay();
                    }
                },
                onShowToast: function (msg, type) {
                    if (typeof MessagesModule !== 'undefined') {
                        MessagesModule.showToast(msg, type);
                    }
                }
            });
            Logger.log('App', 'PresetsModule initialized');
        }

        // Initialize Sync Module
        if (typeof SyncModule !== 'undefined') {
            SyncModule.init(elements, App.state, {
                switchTab: switchTab,
                updatePreview: updatePreview,
                updateTimer: updateTimerDisplay,
                showUpdateMode: function (layerInfo) {
                    var layerName = (layerInfo && layerInfo.layerName) ? layerInfo.layerName : layerInfo;
                    linkedLayer = layerName || null;
                    if (layerInfo && typeof layerInfo === 'object') {
                        linkedLayerInfo = {
                            layerName: layerName || null,
                            counterType: layerInfo.counterType || null,
                            layerId: layerInfo.layerId,
                            layerIndex: layerInfo.layerIndex
                        };
                    } else {
                        linkedLayerInfo = layerName ? { layerName: layerName } : null;
                    }
                    if (typeof ModeModule !== 'undefined') {
                        ModeModule.showUpdateMode(linkedLayerInfo || layerName);
                    }
                }
            });
            Logger.log('App', 'SyncModule initialized');
        }

        // Initialize Messages Module
        if (typeof MessagesModule !== 'undefined') {
            MessagesModule.init(elements);
            Logger.log('App', 'MessagesModule initialized');
        }

        // Initialize Error Handler after MessagesModule so notifications are wired.
        if (typeof ErrorHandler !== 'undefined') {
            ErrorHandler.init({
                onShowError: function (msg) {
                    if (typeof MessagesModule !== 'undefined') {
                        MessagesModule.showError(msg);
                    }
                },
                onShowToast: function (msg, type) {
                    if (typeof MessagesModule !== 'undefined') {
                        MessagesModule.showToast(msg, type || 'error');
                    }
                }
            });
            Logger.log('App', 'ErrorHandler initialized');
        }

        // Initialize Mode Module
        if (typeof ModeModule !== 'undefined') {
            ModeModule.init(elements, App, {
                showToast: function (msg, type) {
                    if (typeof MessagesModule !== 'undefined') {
                        MessagesModule.showToast(msg, type);
                    }
                },
                onUnlink: function (layerRef) {
                    var ref = layerRef || linkedLayerInfo || linkedLayer;
                    var key = (ref && ref.layerId)
                        ? String(ref.layerId)
                        : (ref && ref.layerName ? ref.layerName : String(ref || ''));
                    unlinkedLayerKey = key || null;
                    linkedLayer = null;
                    linkedLayerInfo = null;
                    Logger.log('App', 'Layer explicitly unlinked, suppressing auto-relink for:', unlinkedLayerKey);
                }
            });
            Logger.log('App', 'ModeModule initialized');
        }

        // Initialize Creation Module
        if (typeof CreationModule !== 'undefined') {
            CreationModule.init(elements, {
                getSettings: function (type) {
                    return getSettingsForCurrentTab(type);
                },
                getLinkedLayer: function () {
                    return typeof ModeModule !== 'undefined' ? ModeModule.getLinkedLayer() : linkedLayer;
                },
                getLinkedLayerInfo: function () {
                    return typeof ModeModule !== 'undefined' ? ModeModule.getLinkedLayerInfo() : linkedLayerInfo;
                },
                switchTab: switchTab,
                showError: function (msg) {
                    if (typeof MessagesModule !== 'undefined') MessagesModule.showError(msg);
                },
                showSuccess: function (msg) {
                    if (typeof MessagesModule !== 'undefined') MessagesModule.showSuccess(msg);
                },
                showToast: function (msg, type) {
                    if (typeof MessagesModule !== 'undefined') MessagesModule.showToast(msg, type);
                },
                handleError: function (error, context) {
                    if (typeof ErrorHandler !== 'undefined') {
                        ErrorHandler.handle(error, context || 'creation');
                    } else if (typeof MessagesModule !== 'undefined') {
                        var msg = (error && error.message) ? error.message : 'Unexpected error';
                        MessagesModule.showError(msg);
                    }
                }
            });
            Logger.log('App', 'CreationModule initialized');
        }

        initHeaderActions();

        // Initialize Enhanced Keyboard Shortcuts
        if (typeof KeyboardShortcuts !== 'undefined') {
            KeyboardShortcuts.init({
                onSwitchTab: switchTab,
                onPlayPreview: function () { if (elements.playPreview) elements.playPreview.click(); },
                onStopPreview: function () { if (elements.stopPreview) elements.stopPreview.click(); },
                onCreate: function () {
                    if (App.currentTab === 'timer' && elements.btnCreateTimer) {
                        elements.btnCreateTimer.click();
                    } else if (elements.btnCreateCounter) {
                        elements.btnCreateCounter.click();
                    } else if (elements.btnCreate) {
                        elements.btnCreate.click();
                    }
                },
                onReset: function () {
                    if (elements.btnReset) elements.btnReset.click();
                }
            });
            Logger.log('App', 'KeyboardShortcuts initialized');
        } else {
            initKeyboardShortcuts(); // Fallback to legacy
        }

        // Initialize Real-time Validation
        if (typeof Validator !== 'undefined' && Validator.initRealtimeValidation) {
            var createButtons = [];
            if (elements.btnCreateCounter) createButtons.push(elements.btnCreateCounter);
            if (elements.btnCreateTimer) createButtons.push(elements.btnCreateTimer);
            if (createButtons.length === 0 && elements.btnCreate) createButtons.push(elements.btnCreate);
            Validator.initRealtimeValidation(elements, createButtons);
            Logger.log('App', 'Real-time validation initialized');
        }

        initSelectionListener();

        if (typeof UIControlsModule !== 'undefined') {
            UIControlsModule.updateTabSlider();
        } else {
            Logger.warn('App', 'Cannot update tab slider without UIControlsModule');
        }
        if (typeof CounterModule !== 'undefined') {
            CounterModule.updatePreview();
        } else {
            updatePreview();
        }
        if (typeof TimerModule !== 'undefined') {
            TimerModule.updateDisplay();
        } else {
            updateTimerDisplay();
        }
        animateEntry();

        Logger.log('App', 'NOMRO Pro v' + App.version + ' initialized with modules');
    }

    // ========================================
    // LIVE SLIDER SYNC
    // ========================================
    /**
     * Sync live slider values from AE when the same layer remains selected.
     * Updates UI fields only if values have actually changed.
     */
    function _syncLiveValues(settings) {
        if (!settings) return;
        var activeEl = document.activeElement;
        var changed = false;

        if (settings.counterType === 'timer') {
            var t = App.state.timer;
            var fps = settings.fps || settings.frameRate || t.fps || 30;
            t.fps = fps;

            if (settings.start !== undefined && typeof TimerDefaults !== 'undefined') {
                var startUnits = TimerDefaults.secondsToUnits(settings.start, fps);
                if (elements.inputHours && activeEl !== elements.inputHours && t.hours !== startUnits.hours) {
                    t.hours = startUnits.hours;
                    elements.inputHours.value = startUnits.hours;
                    changed = true;
                }
                if (elements.inputMins && activeEl !== elements.inputMins && t.mins !== startUnits.mins) {
                    t.mins = startUnits.mins;
                    elements.inputMins.value = startUnits.mins;
                    changed = true;
                }
                if (elements.inputSecs && activeEl !== elements.inputSecs && t.secs !== startUnits.secs) {
                    t.secs = startUnits.secs;
                    elements.inputSecs.value = startUnits.secs;
                    changed = true;
                }
                if (elements.inputFrames && activeEl !== elements.inputFrames && t.frames !== startUnits.frames) {
                    t.frames = startUnits.frames;
                    elements.inputFrames.value = startUnits.frames;
                    changed = true;
                }
            }

            if (settings.end !== undefined && typeof TimerDefaults !== 'undefined') {
                var endUnits = TimerDefaults.secondsToUnits(settings.end, fps);
                if (elements.inputEndH && activeEl !== elements.inputEndH && t.endHours !== endUnits.hours) {
                    t.endHours = endUnits.hours;
                    elements.inputEndH.value = endUnits.hours;
                    changed = true;
                }
                if (elements.inputEndM && activeEl !== elements.inputEndM && t.endMins !== endUnits.mins) {
                    t.endMins = endUnits.mins;
                    elements.inputEndM.value = endUnits.mins;
                    changed = true;
                }
                if (elements.inputEndS && activeEl !== elements.inputEndS && t.endSecs !== endUnits.secs) {
                    t.endSecs = endUnits.secs;
                    elements.inputEndS.value = endUnits.secs;
                    changed = true;
                }
                if (elements.inputEndF && activeEl !== elements.inputEndF && t.endFrames !== endUnits.frames) {
                    t.endFrames = endUnits.frames;
                    elements.inputEndF.value = endUnits.frames;
                    changed = true;
                }
            }

            if (elements.inputDuration && activeEl !== elements.inputDuration) {
                if (settings.duration !== undefined && settings.duration !== t.duration) {
                    t.duration = settings.duration;
                    elements.inputDuration.value = settings.duration;
                    changed = true;
                }
            }

            if (changed && typeof TimerModule !== 'undefined') {
                TimerModule.updateDisplay();
                Logger.log('Sync', 'Live timer slider values synced');
            }
        } else {
            var s = App.state.counter;

            // Counter values sync (only if user is not actively typing in that field)
            if (elements.startValue && activeEl !== elements.startValue) {
                if (settings.start !== undefined && settings.start !== s.start) {
                    s.start = settings.start;
                    elements.startValue.value = settings.start;
                    changed = true;
                }
            }
            if (elements.endValue && activeEl !== elements.endValue) {
                if (settings.end !== undefined && settings.end !== s.end) {
                    s.end = settings.end;
                    elements.endValue.value = settings.end;
                    changed = true;
                }
            }
            if (elements.durationValue && activeEl !== elements.durationValue) {
                if (settings.duration !== undefined && settings.duration !== s.duration) {
                    s.duration = settings.duration;
                    elements.durationValue.value = settings.duration;
                    changed = true;
                }
            }
            if (settings.delay !== undefined && settings.delay !== s.delay) {
                s.delay = settings.delay;
                changed = true;
            }

            if (changed && typeof CounterModule !== 'undefined') {
                CounterModule.updatePreview();
                Logger.log('Sync', 'Live slider values synced');
            }
        }
    }

    // ========================================
    // SELECTION LISTENER (UI Sync)
    // ========================================
    function _pollSelectionOnce() {
        if (selectionRequestInFlight || typeof Bridge === 'undefined' || !Bridge.evalScript) {
            return;
        }

        selectionRequestInFlight = true;

        Bridge.evalScript('readSelectedLayer()', function (err, result) {
            selectionRequestInFlight = false;

            if (err) {
                return;
            }

            if (result && result !== 'null' && result !== 'undefined') {
                try {
                    var settings = JSON.parse(result);
                    if (settings && settings.layerName) {
                        var selectedId = (settings.layerId !== undefined && settings.layerId !== null) ? String(settings.layerId) : '';
                        var selectedIdx = (settings.layerIndex !== undefined && settings.layerIndex !== null) ? String(settings.layerIndex) : '';
                        var candidateKey = selectedId || (settings.layerName + '_' + selectedIdx);

                        // If user explicitly unlinked this layer, do not auto-relink it while still selected
                        if (unlinkedLayerKey) {
                            if (unlinkedLayerKey === candidateKey || unlinkedLayerKey === settings.layerName) {
                                return;
                            }
                            // User selected a different layer in AE, release suppression
                            unlinkedLayerKey = null;
                        }

                        var linkedId = (linkedLayerInfo && linkedLayerInfo.layerId !== undefined && linkedLayerInfo.layerId !== null) ? String(linkedLayerInfo.layerId) : '';
                        var linkedIdx = (linkedLayerInfo && linkedLayerInfo.layerIndex !== undefined && linkedLayerInfo.layerIndex !== null) ? String(linkedLayerInfo.layerIndex) : '';

                        // Disambiguate by layerId first, then by layerIndex for duplicate-named layers
                        var idMatch = selectedId && linkedId ? (selectedId === linkedId) : false;
                        var idxMatch = selectedIdx && linkedIdx ? (selectedIdx === linkedIdx) : false;
                        var nameMatch = linkedLayer && linkedLayer === settings.layerName;
                        var isSameLayer = nameMatch && (idMatch || (!selectedId && !linkedId && idxMatch));

                        if (!isSameLayer) {
                            Logger.log('Sync', 'Layer selected:', settings.layerName);
                            onLayerSelected(settings);
                        } else if (isSameLayer) {
                            // Live slider sync: re-apply values if they changed in AE
                            _syncLiveValues(settings);
                        }
                    }
                } catch (e) {
                    Logger.warn('Sync', 'Parse error:', e.message);
                }
            } else if (linkedLayer) {
                Logger.log('Sync', 'No NOMRO layer selected, switching to create mode');
                linkedLayer = null;
                linkedLayerInfo = null;
                if (typeof ModeModule !== 'undefined') {
                    ModeModule.showCreateMode();
                }
            }
        });
    }

    function _startSelectionPolling() {
        if (selectionPollTimer !== null) return;
        _pollSelectionOnce();
        selectionPollTimer = setInterval(_pollSelectionOnce, selectionPollMs);
    }

    function _stopSelectionPolling() {
        if (selectionPollTimer !== null) {
            clearInterval(selectionPollTimer);
            selectionPollTimer = null;
        }
    }

    function initSelectionListener() {
        if (typeof Bridge !== 'undefined' && Bridge.evalScript) {
            Logger.log('App', 'Starting selection listener...');
            _startSelectionPolling();

            document.addEventListener('visibilitychange', function () {
                if (document.hidden) {
                    _stopSelectionPolling();
                } else {
                    _startSelectionPolling();
                }
            });

            window.addEventListener('blur', function () {
                _stopSelectionPolling();
            });

            window.addEventListener('focus', function () {
                _startSelectionPolling();
            });

            window.addEventListener('beforeunload', _stopSelectionPolling);
        } else {
            Logger.log('App', 'Bridge not available, selection listener disabled');
        }
    }

    function onLayerSelected(settings) {
        unlinkedLayerKey = null;
        if (typeof SyncModule !== 'undefined') {
            SyncModule.onLayerSelected(settings);
        }
    }

    // ========================================
    // WRAPPER FUNCTIONS (Compatibility)
    // ========================================
    function switchTab(tabId) {
        App.currentTab = tabId;
        if (tabId === 'counter' || tabId === 'timer') {
            App.lastActiveSettingsTab = tabId;
        }
        if (typeof UIControlsModule !== 'undefined') {
            UIControlsModule.switchTab(tabId);
        }
    }

    function updatePreview() {
        if (typeof CounterModule !== 'undefined') {
            CounterModule.updatePreview();
        }
    }

    function updateTimerDisplay() {
        if (typeof TimerModule !== 'undefined') {
            TimerModule.updateDisplay();
        }
    }

    function getSettingsForCurrentTab(typeOverride) {
        var targetTab = typeOverride || (App.currentTab === 'presets' ? App.lastActiveSettingsTab : App.currentTab);
        if (targetTab === 'timer' && typeof TimerModule !== 'undefined' && TimerModule.getSettings) {
            return TimerModule.getSettings();
        } else if (typeof CounterModule !== 'undefined') {
            return CounterModule.getSettings('counter');
        }
        return {};
    }

    // ========================================
    // HEADER ACTIONS
    // ========================================
    function initHeaderActions() {
        if (elements.btnReset) {
            elements.btnReset.addEventListener('click', function () {
                location.reload();
            });
        }

        if (elements.btnHelp) {
            elements.btnHelp.addEventListener('click', function () {
                if (typeof KeyboardShortcuts !== 'undefined' && KeyboardShortcuts.showHelp) {
                    KeyboardShortcuts.showHelp();
                } else if (typeof MessagesModule !== 'undefined') {
                    MessagesModule.showToast('Help shortcuts: 1/2/3, Ctrl+Enter, Ctrl+R', 'success');
                }
            });
        }

        if (elements.btnSettings) {
            elements.btnSettings.addEventListener('click', function () {
                if (typeof MessagesModule !== 'undefined') {
                    MessagesModule.showToast('Settings panel is coming soon', 'success');
                }
            });
        }
    }

    // ========================================
    // KEYBOARD SHORTCUTS
    // ========================================
    function initKeyboardShortcuts() {
        document.addEventListener('keydown', function (e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === '1') switchTab('counter');
            if (e.key === '2') switchTab('timer');
            if (e.key === '3') switchTab('presets');

            if (e.key === ' ' && App.currentTab === 'counter') {
                e.preventDefault();
                if (elements.playPreview) {
                    elements.playPreview.click();
                }
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                if (App.currentTab === 'timer' && elements.btnCreateTimer) {
                    elements.btnCreateTimer.click();
                } else if (elements.btnCreateCounter) {
                    elements.btnCreateCounter.click();
                } else if (elements.btnCreate) {
                    elements.btnCreate.click();
                }
            }
        });
    }

    // ========================================
    // ENTRY ANIMATION
    // ========================================
    function animateEntry() {
        var cards = document.querySelectorAll('.card');
        cards.forEach(function (card, index) {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';

            setTimeout(function () {
                card.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    // ========================================
    // START APP
    // ========================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for debugging
    window.NOMRO_App = App;
    window.switchTab = switchTab;

})();
