/**
 * NOMRO - Preset View
 * Separation of Concerns: DOM manipulation & Live Preset Inspector
 * @module views/PresetView
 */
var PresetView = (function () {
    'use strict';

    var _elements = null;
    var _selectedPreset = null;
    var _isAnimating = false;
    var _animFrameId = null;
    var _currentCategory = 'all';
    var _searchQuery = '';

    function _initElements() {
        if (!_elements) {
            _elements = {
                container: document.getElementById('panel-presets'),
                list: document.getElementById('presets-list'),
                saveBtn: document.getElementById('btn-save-preset'),
                nameInput: document.getElementById('input-preset-name'),
                searchInput: document.getElementById('preset-search-input'),
                categoryButtons: document.querySelectorAll('[data-preset-cat]'),

                // Live Inspector Stage
                inspectorCard: document.getElementById('preset-inspector-card'),
                inspectorType: document.getElementById('preset-inspector-type'),
                inspectorName: document.getElementById('preset-inspector-name'),
                inspectorEasing: document.getElementById('preset-inspector-easing'),
                inspectorDur: document.getElementById('preset-inspector-dur'),
                previewStage: document.getElementById('preset-preview-stage'),
                previewNumber: document.getElementById('preset-preview-number'),
                playBtn: document.getElementById('btn-preset-play'),
                playBtnLabel: document.getElementById('btn-preset-play-label'),
                applyBtn: document.getElementById('btn-preset-apply'),
                createBtn: document.getElementById('btn-preset-create'),

                // Utility Toolbar
                exportBtn: document.getElementById('btn-export-presets'),
                importBtn: document.getElementById('btn-import-presets'),
                importInput: document.getElementById('input-import-presets'),
                resetBtn: document.getElementById('btn-reset-presets')
            };
        }
    }

    /**
     * Escape HTML string
     * @private
     */
    function _escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Format a counter value for preview
     * @private
     */
    function _formatCounterValue(settings, val) {
        settings = settings || {};
        var isDec = !!settings.decimals;
        var num = parseFloat(val);
        if (isNaN(num)) num = 0;

        var str = '';
        var decPart = '';

        if (isDec) {
            var fixed = Math.abs(num).toFixed(2);
            var parts = fixed.split('.');
            str = parts[0];
            decPart = '.' + parts[1];
        } else {
            str = Math.round(Math.abs(num)).toString();
        }

        if (settings.commas || settings.separator) {
            var sep = (settings.separator !== undefined && settings.separator !== null) ? settings.separator : ',';
            if (sep) {
                str = str.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
            }
        }

        var isNeg = num < 0 && Math.abs(num) >= (isDec ? 0.005 : 0.5);
        var sign = isNeg ? '-' : '';
        var pre = settings.symbol || '';
        var suf = settings.suffix || '';
        var pos = settings.formatPos || 'left';

        return (pos === 'left') ? (sign + pre + str + decPart + suf) : (sign + suf + str + decPart + pre);
    }

    /**
     * Format a timer value for preview
     * @private
     */
    function _formatTimerValue(settings, seconds) {
        settings = settings || {};
        var format = settings.format || 'hms';
        var fps = settings.fps || 30;

        if (typeof TimerDefaults !== 'undefined' && TimerDefaults.formatDisplayTime) {
            return TimerDefaults.formatDisplayTime(seconds, format, fps);
        }

        var s = Math.floor(Math.abs(seconds));
        var mins = Math.floor(s / 60);
        var secs = s % 60;
        return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
    }

    function _isNodesPreset(preset) {
        if (!preset) return false;
        if (preset.category === 'nodes') return true;
        if (preset.settings) {
            return preset.settings.counterType === 'nodes' || !!(preset.settings.nodes && preset.settings.nodes.length);
        }
        return false;
    }

    /**
     * Format a waypoint node value for preview
     * @private
     */
    function _formatNodeValue(settings, node) {
        if (!node) return '0';
        var type = node.type || 'number';
        if (type === 'time') {
            return String(node.value || '00:00:00');
        } else if (type === 'text') {
            return String(node.value !== undefined ? node.value : '');
        } else if (type === 'delta') {
            var sym = node.deltaSymbol || '+';
            var suf = node.deltaSuffix || '%';
            return sym + (node.value !== undefined ? node.value : 0) + suf;
        } else {
            return _formatCounterValue(settings, node.value !== undefined ? node.value : 0);
        }
    }

    /**
     * Standalone piecewise evaluator for multi-node sequence preview
     * @private
     */
    function _evaluateNodesPreview(nodeList, simT, settings) {
        if (!nodeList || nodeList.length === 0) return '0';
        var first = nodeList[0];
        if (simT <= (parseFloat(first.time) || 0)) {
            return _formatNodeValue(settings, first);
        }

        for (var idx = 0; idx < nodeList.length - 1; idx++) {
            var nA = nodeList[idx];
            var nB = nodeList[idx + 1];
            var tA = parseFloat(nA.time) || 0;
            var hA = parseFloat(nA.hold) || 0;
            var tB = parseFloat(nB.time) || 0;
            var tDepart = tA + hA;

            if (simT >= tA && simT < tDepart) {
                return _formatNodeValue(settings, nA);
            }

            if (simT >= tDepart && simT <= tB) {
                var segDur = tB - tDepart;
                var factor = segDur > 0 ? (simT - tDepart) / segDur : 1;
                var curve = nA.easing || (settings && settings.easing) || 'smoothOut';
                var strength = nA.easeStrength !== undefined ? nA.easeStrength : ((settings && settings.easeStrength !== undefined) ? settings.easeStrength : 75);
                var k = (typeof EasingRuntime !== 'undefined' && EasingRuntime.evaluateById)
                    ? EasingRuntime.evaluateById(curve, factor, strength)
                    : factor;

                if (nA.type === 'number' && nB.type === 'number') {
                    var vA = parseFloat(nA.value) || 0;
                    var vB = parseFloat(nB.value) || 0;
                    var inter = vA + (vB - vA) * k;
                    return _formatCounterValue(settings, inter);
                } else {
                    return (k < 1) ? _formatNodeValue(settings, nA) : _formatNodeValue(settings, nB);
                }
            }
        }

        return _formatNodeValue(settings, nodeList[nodeList.length - 1]);
    }

    /**
     * Render the target display value of a preset
     * @private
     */
    function _getPresetDisplayValue(preset, isFinal) {
        if (!preset || !preset.settings) return '---';
        var s = preset.settings;

        if (_isNodesPreset(preset)) {
            var nodes = s.nodes || [];
            if (!nodes.length) return '---';
            var target = isFinal ? nodes[nodes.length - 1] : nodes[0];
            return _formatNodeValue(s, target);
        }

        var isTimer = s.counterType === 'timer';
        if (isTimer) {
            var val = isFinal ? s.end : s.start;
            return _formatTimerValue(s, val !== undefined ? val : 0);
        } else {
            var val = isFinal ? s.end : s.start;
            return _formatCounterValue(s, val !== undefined ? val : 0);
        }
    }

    /**
     * Update the Live Inspector stage with a preset
     */
    function updateInspector(preset) {
        _initElements();
        if (!preset || !preset.settings) return;

        _selectedPreset = preset;
        stopPreview();

        var s = preset.settings;
        var isNodes = _isNodesPreset(preset);
        var isTimer = s.counterType === 'timer';

        if (_elements.inspectorType) {
            _elements.inspectorType.textContent = isNodes ? 'MARKERS' : (isTimer ? 'TIMER' : 'COUNTER');
        }
        if (_elements.inspectorName) {
            _elements.inspectorName.textContent = preset.name || 'Untitled Preset';
            _elements.inspectorName.title = preset.description || preset.name || '';
        }
        if (_elements.inspectorEasing) {
            if (isNodes) {
                var count = (s.nodes && s.nodes.length) ? s.nodes.length : 0;
                _elements.inspectorEasing.textContent = count + ' Waypoints';
            } else {
                var curve = s.easing || (s.easingConfig ? s.easingConfig.singleCurveId : 'smoothOut');
                var str = s.easeStrength !== undefined ? s.easeStrength : (s.easingConfig ? s.easingConfig.easeStrength : 75);
                _elements.inspectorEasing.textContent = curve === 'linear' ? 'Linear' : (curve + ' (' + str + '%)');
            }
        }
        if (_elements.inspectorDur) {
            if (isNodes) {
                var nodes = s.nodes || [];
                var totalDur = 2.0;
                if (nodes.length > 0) {
                    var last = nodes[nodes.length - 1];
                    totalDur = (parseFloat(last.time) || 0) + (parseFloat(last.hold) || 0);
                }
                _elements.inspectorDur.textContent = totalDur.toFixed(1) + 's';
            } else {
                _elements.inspectorDur.textContent = (s.duration || 2) + 's';
            }
        }
        if (_elements.previewNumber) {
            _elements.previewNumber.textContent = _getPresetDisplayValue(preset, true);
        }
    }

    /**
     * Stop preview animation
     */
    function stopPreview() {
        if (_animFrameId) {
            cancelAnimationFrame(_animFrameId);
            _animFrameId = null;
        }
        _isAnimating = false;
        if (_elements.playBtn) {
            _elements.playBtn.classList.remove('is-playing');
        }
        if (_elements.playBtnLabel) {
            _elements.playBtnLabel.textContent = 'Test Preview';
        }
        if (_elements.previewNumber) {
            _elements.previewNumber.classList.remove('is-animating');
            if (_selectedPreset) {
                _elements.previewNumber.textContent = _getPresetDisplayValue(_selectedPreset, true);
            }
        }
    }

    /**
     * Start live interactive preview animation
     */
    function startPreview(preset) {
        preset = preset || _selectedPreset;
        if (!preset || !preset.settings) return;

        stopPreview();
        _isAnimating = true;

        if (_elements.playBtn) {
            _elements.playBtn.classList.add('is-playing');
        }
        if (_elements.playBtnLabel) {
            _elements.playBtnLabel.textContent = 'Stop';
        }
        if (_elements.previewNumber) {
            _elements.previewNumber.classList.add('is-animating');
        }

        var s = preset.settings;
        var isNodes = _isNodesPreset(preset);
        var isTimer = !isNodes && s.counterType === 'timer';

        if (isNodes) {
            var nodes = s.nodes || [];
            if (!nodes.length) {
                stopPreview();
                return;
            }
            var lastNode = nodes[nodes.length - 1];
            var totalSeqDuration = (parseFloat(lastNode.time) || 0) + (parseFloat(lastNode.hold) || 0);
            if (totalSeqDuration <= 0) totalSeqDuration = 4.0;
            var animDuration = Math.max(1200, Math.min(3500, totalSeqDuration * 1000));
            var startTime = performance.now();

            function stepNodes(now) {
                if (!_isAnimating) return;
                var elapsed = now - startTime;
                var progress = Math.min(elapsed / animDuration, 1);
                var simTime = progress * totalSeqDuration;

                if (_elements.previewNumber) {
                    _elements.previewNumber.textContent = _evaluateNodesPreview(nodes, simTime, s);
                }

                if (progress < 1) {
                    _animFrameId = requestAnimationFrame(stepNodes);
                } else {
                    stopPreview();
                }
            }

            _animFrameId = requestAnimationFrame(stepNodes);
            return;
        }

        var startVal = s.start !== undefined ? parseFloat(s.start) : 0;
        var endVal = s.end !== undefined ? parseFloat(s.end) : 100;
        var rawDur = parseFloat(s.duration) || 2;
        // Keep interactive preview between 0.8s and 3.0s for responsive UX
        var animDuration = Math.max(800, Math.min(3000, rawDur * 1000));
        var curveId = s.easing || (s.easingConfig ? s.easingConfig.singleCurveId : 'smoothOut');
        var strength = s.easeStrength !== undefined ? s.easeStrength : (s.easingConfig ? s.easingConfig.easeStrength : 75);

        var startTime = performance.now();

        function step(now) {
            if (!_isAnimating) return;

            var elapsed = now - startTime;
            var progress = Math.min(elapsed / animDuration, 1);

            var eased = (typeof EasingRuntime !== 'undefined' && EasingRuntime.evaluateById)
                ? EasingRuntime.evaluateById(curveId, progress, strength)
                : progress;

            var current = startVal + (endVal - startVal) * eased;

            if (_elements.previewNumber) {
                if (isTimer) {
                    _elements.previewNumber.textContent = _formatTimerValue(s, current);
                } else {
                    _elements.previewNumber.textContent = _formatCounterValue(s, current);
                }
            }

            if (progress < 1) {
                _animFrameId = requestAnimationFrame(step);
            } else {
                stopPreview();
            }
        }

        _animFrameId = requestAnimationFrame(step);
    }

    /**
     * Render the presets list and select active preset
     * @param {Array} presets - Presets to render
     * @param {string} [activeId] - ID of preset to select
     */
    function render(presets, activeId) {
        _initElements();
        if (!_elements.list) return;

        _elements.list.innerHTML = '';

        if (!presets || presets.length === 0) {
            _elements.list.innerHTML = '<div class="preset-empty-compact">No matching presets found</div>';
            return;
        }

        // Determine which preset should be active
        var activePreset = null;
        if (activeId) {
            for (var a = 0; a < presets.length; a++) {
                if (presets[a].id === activeId) {
                    activePreset = presets[a];
                    break;
                }
            }
        }
        if (!activePreset) {
            activePreset = (_selectedPreset && presets.some(function(p){ return p.id === _selectedPreset.id; }))
                ? _selectedPreset
                : presets[0];
        }

        updateInspector(activePreset);

        for (var i = 0; i < presets.length; i++) {
            var preset = presets[i];
            var isSelected = (preset.id === activePreset.id);
            var isNodes = _isNodesPreset(preset);
            var isTimer = !isNodes && preset.settings && preset.settings.counterType === 'timer';

            var item = document.createElement('div');
            item.className = 'preset-item-compact' + (isSelected ? ' is-selected' : '');
            item.setAttribute('data-id', preset.id);

            // Icon SVG (Nodes/Markers vs Timer vs Counter)
            var iconSvg = '';
            if (isNodes) {
                iconSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a4 4 0 0 0-4 4c0 3 4 8 4 8s4-5 4-8a4 4 0 0 0-4-4z"></path><circle cx="12" cy="6" r="1.5"></circle></svg>';
            } else if (isTimer) {
                iconSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';
            } else {
                iconSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><text x="7" y="16" font-size="10" font-weight="bold" fill="currentColor">#</text></svg>';
            }

            var badgeHtml = preset.isFactory
                ? '<span class="preset-item-badge preset-item-badge--factory">DEFAULT</span>'
                : '<span class="preset-item-badge">USER</span>';

            item.innerHTML =
                '<div class="preset-item-info">' +
                    '<span class="preset-item-icon">' + iconSvg + '</span>' +
                    '<span class="preset-item-name">' + _escapeHtml(preset.name) + '</span>' +
                    badgeHtml +
                '</div>' +
                '<div class="preset-item-actions">' +
                    '<button type="button" class="preset-btn-compact preset-btn--create-ae" title="Create directly in AE (إنشاء مباشر في الآفترإفكتس)">' +
                        '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>' +
                    '</button>' +
                    '<button type="button" class="preset-btn-compact preset-btn--duplicate" title="Duplicate Preset (نسخ القالب)">' +
                        '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>' +
                    '</button>' +
                    (!preset.isFactory ?
                    '<button type="button" class="preset-btn-compact preset-btn--delete" title="Delete Preset (حذف القالب)">' +
                        '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
                    '</button>' : '') +
                '</div>';

            _elements.list.appendChild(item);
        }
    }

    /**
     * Bind all DOM events for Preset Studio
     * @param {Object} callbacks
     */
    function bindEvents(callbacks) {
        _initElements();
        callbacks = callbacks || {};

        // 1. Save Preset
        function triggerSave() {
            var name = _elements.nameInput ? _elements.nameInput.value.trim() : '';
            if (name) {
                if (callbacks.onSave) callbacks.onSave(name);
                if (_elements.nameInput) _elements.nameInput.value = '';
            } else {
                if (typeof MessagesModule !== 'undefined' && MessagesModule.showToast) {
                    MessagesModule.showToast('Please enter a preset name', 'error');
                }
                if (_elements.nameInput) _elements.nameInput.focus();
            }
        }

        if (_elements.saveBtn) {
            _elements.saveBtn.addEventListener('click', triggerSave);
        }
        if (_elements.nameInput) {
            _elements.nameInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    triggerSave();
                }
            });
        }

        // 2. Search Input
        if (_elements.searchInput) {
            _elements.searchInput.addEventListener('input', function () {
                _searchQuery = this.value || '';
                if (callbacks.onFilterChange) {
                    callbacks.onFilterChange(_currentCategory, _searchQuery);
                }
            });
        }

        // 3. Category Filter Chips
        if (_elements.categoryButtons && _elements.categoryButtons.length) {
            for (var c = 0; c < _elements.categoryButtons.length; c++) {
                (function (btn) {
                    btn.addEventListener('click', function () {
                        for (var j = 0; j < _elements.categoryButtons.length; j++) {
                            _elements.categoryButtons[j].classList.remove('active');
                        }
                        btn.classList.add('active');
                        _currentCategory = btn.getAttribute('data-preset-cat') || 'all';
                        if (callbacks.onFilterChange) {
                            callbacks.onFilterChange(_currentCategory, _searchQuery);
                        }
                    });
                })(_elements.categoryButtons[c]);
            }
        }

        // 4. Live Inspector Actions
        if (_elements.playBtn) {
            _elements.playBtn.addEventListener('click', function () {
                if (_isAnimating) {
                    stopPreview();
                } else if (_selectedPreset) {
                    startPreview(_selectedPreset);
                }
            });
        }

        if (_elements.applyBtn) {
            _elements.applyBtn.addEventListener('click', function () {
                if (_selectedPreset && callbacks.onLoad) {
                    callbacks.onLoad(_selectedPreset.id);
                }
            });
        }

        if (_elements.createBtn) {
            _elements.createBtn.addEventListener('click', function () {
                if (_selectedPreset && callbacks.onCreate) {
                    callbacks.onCreate(_selectedPreset);
                }
            });
        }

        // 5. Presets List Item Delegation
        if (_elements.list) {
            _elements.list.addEventListener('click', function (e) {
                var target = e.target;
                var item = target.closest('.preset-item-compact');
                if (!item) return;

                var id = item.getAttribute('data-id');

                // Check action buttons inside item
                var createBtn = target.closest('.preset-btn--create-ae');
                var dupBtn = target.closest('.preset-btn--duplicate');
                var delBtn = target.closest('.preset-btn--delete');

                if (createBtn) {
                    e.stopPropagation();
                    if (callbacks.onCreateById) callbacks.onCreateById(id);
                    return;
                }
                if (dupBtn) {
                    e.stopPropagation();
                    if (callbacks.onDuplicate) callbacks.onDuplicate(id);
                    return;
                }
                if (delBtn) {
                    e.stopPropagation();
                    if (callbacks.onDelete) callbacks.onDelete(id);
                    return;
                }

                // Row clicked: Select preset, update inspector, and start auto-preview!
                var allItems = _elements.list.querySelectorAll('.preset-item-compact');
                for (var i = 0; i < allItems.length; i++) {
                    allItems[i].classList.remove('is-selected');
                }
                item.classList.add('is-selected');

                if (callbacks.onSelect) {
                    callbacks.onSelect(id);
                }
            });
        }

        // 6. Utility Bar: Export, Import, Reset
        if (_elements.exportBtn) {
            _elements.exportBtn.addEventListener('click', function () {
                if (callbacks.onExport) callbacks.onExport();
            });
        }

        if (_elements.importBtn && _elements.importInput) {
            _elements.importBtn.addEventListener('click', function () {
                _elements.importInput.click();
            });

            _elements.importInput.addEventListener('change', function (e) {
                var file = e.target.files && e.target.files[0];
                if (file) {
                    var reader = new FileReader();
                    reader.onload = function (evt) {
                        if (callbacks.onImport) {
                            callbacks.onImport(evt.target.result);
                        }
                    };
                    reader.readAsText(file);
                    _elements.importInput.value = '';
                }
            });
        }

        if (_elements.resetBtn) {
            _elements.resetBtn.addEventListener('click', function () {
                if (callbacks.onResetDefaults) {
                    callbacks.onResetDefaults();
                }
            });
        }
    }

    return {
        render: render,
        bindEvents: bindEvents,
        updateInspector: updateInspector,
        startPreview: startPreview,
        stopPreview: stopPreview,
        getSelectedPreset: function () { return _selectedPreset; }
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PresetView;
}
