/**
 * NOMRO - Nodes View Component
 * Renders interactive node cards, chain visualization, and multi-node preview
 * @module views/NodesView
 */
var NodesView = (function () {
    'use strict';

    /**
     * Escape HTML string
     * @private
     */
    function _escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Format time display helper (seconds to 00:00:00 or s)
     * @param {number} sec
     * @returns {string}
     */
    function _formatTime(sec) {
        sec = Math.max(0, sec || 0);
        var h = Math.floor(sec / 3600);
        var m = Math.floor((sec % 3600) / 60);
        var s = Math.floor(sec % 60);
        var pad = function (n) { return (n < 10 ? '0' : '') + n; };
        return pad(h) + ':' + pad(m) + ':' + pad(s);
    }

    /**
     * Render the list of node cards
     * @param {HTMLElement} container
     * @param {Array} sequence
     * @param {Object} handlers
     */
    function renderNodeList(container, sequence, handlers) {
        if (!container) return;
        handlers = handlers || {};

        container.innerHTML = '';

        if (!sequence || sequence.length === 0) {
            container.innerHTML = '<div class="nodes-empty">No nodes in sequence. Click "+ Add Node" to begin.</div>';
            return;
        }

        var isMinNodes = sequence.length <= 2;

        sequence.forEach(function (node, index) {
            var card = document.createElement('div');
            card.className = 'node-card' + (node.active ? ' node-card-active' : '');
            card.setAttribute('data-node-id', node.id);
            card.setAttribute('data-node-index', index);

            var typeColorClass = 'type-' + (node.type || 'number');

            var html = '';
            // Elevated High-Density Primary Row: Type, Value, Time, CTI & Delete
            html += '<div class="node-row-primary">';
            html += '  <span class="node-badge ' + typeColorClass + '" title="Waypoint Marker #' + (index + 1) + '">📍 #' + (index + 1) + '</span>';
            html += '  <select class="node-select-type select-compact" data-field="type" title="Marker Value Type (نوع القيمة)">';
            html += '    <option value="number"' + (node.type === 'number' ? ' selected' : '') + '>Number</option>';
            html += '    <option value="time"' + (node.type === 'time' ? ' selected' : '') + '>Time</option>';
            html += '    <option value="text"' + (node.type === 'text' ? ' selected' : '') + '>Text</option>';
            html += '    <option value="delta"' + (node.type === 'delta' ? ' selected' : '') + '>Delta (±)</option>';
            html += '  </select>';

            var valPlaceholder = node.type === 'time' ? '00:01:00' : (node.type === 'text' ? 'Text label' : '0');
            html += '  <div class="node-val-wrapper" title="Target Value (القيمة المستهدفة)">';
            html += '    <input type="text" class="node-input-val input-field-compact" data-field="value" value="' + _escapeHtml(node.value) + '" placeholder="' + valPlaceholder + '">';
            html += '  </div>';

            html += '  <div class="node-time-wrapper input-unit-compact" title="Marker Time in Seconds (توقيت الماركر بالثواني)">';
            html += '    <span class="node-time-icon">⏱️</span>';
            html += '    <input type="number" class="node-input-time input-short" data-field="time" step="0.1" min="0" value="' + parseFloat((node.time || 0).toFixed(2)) + '">';
            html += '    <span class="node-unit">s</span>';
            html += '  </div>';

            if (handlers.onCaptureTime) {
                html += '  <button type="button" class="btn-node-icon btn-capture-time" title="Capture CTI Time from Comp (التقاط توقيت المؤشر)" data-action="capture">';
                html += '    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';
                html += '  </button>';
            }

            if (!isMinNodes) {
                html += '  <button type="button" class="btn-node-icon btn-delete-node" title="Delete Marker (حذف الماركر)" data-action="delete">';
                html += '    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
                html += '  </button>';
            }
            html += '</div>';

            // Elevated Secondary Row: Hold Pause Duration & Easing Curve
            html += '<div class="node-row-secondary">';
            html += '  <div class="node-param-chip" title="Hold Pause Duration at this Waypoint (فترة الثبات بعد الوصول)">';
            html += '    <span class="node-param-label">Hold</span>';
            html += '    <div class="input-unit-compact param-unit-compact">';
            html += '      <input type="number" class="node-input-hold input-short" data-field="hold" step="0.1" min="0" value="' + (parseFloat(node.hold) || 0) + '" placeholder="0.0">';
            html += '      <span class="node-unit">s</span>';
            html += '    </div>';
            html += '  </div>';

            html += '  <div class="node-param-chip node-ease-chip" title="Transition Easing to Next Waypoint (منحنى الحركة نحو المحطة التالية)">';
            html += '    <span class="node-param-label">Ease</span>';
            html += '    <select class="node-select-ease select-compact" data-field="easing">';
            html += '      <option value="smoothOut"' + (node.easing === 'smoothOut' ? ' selected' : '') + '>Smooth Out</option>';
            html += '      <option value="snappyOut"' + (node.easing === 'snappyOut' ? ' selected' : '') + '>Snappy Out</option>';
            html += '      <option value="dramaticOut"' + (node.easing === 'dramaticOut' ? ' selected' : '') + '>Dramatic Out</option>';
            html += '      <option value="bounceOut"' + (node.easing === 'bounceOut' ? ' selected' : '') + '>Bounce Out</option>';
            html += '      <option value="elasticOut"' + (node.easing === 'elasticOut' ? ' selected' : '') + '>Elastic Out</option>';
            html += '      <option value="linear"' + (node.easing === 'linear' ? ' selected' : '') + '>Linear</option>';
            html += '    </select>';
            html += '  </div>';
            html += '</div>';

            card.innerHTML = html;

            // Attach event listeners
            _attachCardListeners(card, node, index, sequence, handlers);

            container.appendChild(card);

            // Add connector indicator if not last
            if (index < sequence.length - 1) {
                var nextNode = sequence[index + 1];
                var deltaT = Math.max(0, (nextNode.time || 0) - (node.time || 0)).toFixed(1);
                var connector = document.createElement('div');
                connector.className = 'node-connector';
                connector.innerHTML = '<div class="node-connector-line"></div><span class="node-connector-delta">➔ Δ ' + deltaT + 's</span><div class="node-connector-line"></div>';
                container.appendChild(connector);
            }
        });
    }

    /**
     * Attach event listeners to card elements
     * @private
     */
    function _attachCardListeners(card, node, index, sequence, handlers) {
        // Change Type
        var typeSelect = card.querySelector('.node-select-type');
        if (typeSelect) {
            typeSelect.addEventListener('change', function () {
                var newType = typeSelect.value;
                var defVal = 0;
                if (newType === 'time') defVal = '00:01:00';
                else if (newType === 'text') defVal = 'STAGE';
                else if (newType === 'delta') defVal = '+100';

                if (handlers.onUpdateNode) {
                    handlers.onUpdateNode(node.id, { type: newType, value: defVal });
                }
            });
        }

        // Change Value
        var valInput = card.querySelector('.node-input-val');
        if (valInput) {
            valInput.addEventListener('change', function () {
                var raw = valInput.value.trim();
                var val = raw;
                if (node.type === 'number') {
                    // Try evaluating math expression
                    try {
                        if (/^[0-9+\-*/. ()]+$/.test(raw)) {
                            /* eslint-disable no-eval */
                            var evaluated = Function('"use strict";return (' + raw + ')')();
                            if (typeof evaluated === 'number' && !isNaN(evaluated)) {
                                val = evaluated;
                                valInput.value = val;
                            }
                        } else {
                            val = parseFloat(raw) || 0;
                        }
                    } catch (e) {
                        val = parseFloat(raw) || 0;
                    }
                }
                if (handlers.onUpdateNode) {
                    handlers.onUpdateNode(node.id, { value: val });
                }
            });
        }

        // Change Time
        var timeInput = card.querySelector('.node-input-time');
        if (timeInput) {
            timeInput.addEventListener('change', function () {
                var t = Math.max(0, parseFloat(timeInput.value) || 0);
                if (handlers.onUpdateNode) {
                    handlers.onUpdateNode(node.id, { time: t });
                }
            });
        }

        // Change Hold
        var holdInput = card.querySelector('.node-input-hold');
        if (holdInput) {
            holdInput.addEventListener('change', function () {
                var h = Math.max(0, parseFloat(holdInput.value) || 0);
                if (handlers.onUpdateNode) {
                    handlers.onUpdateNode(node.id, { hold: h });
                }
            });
        }

        // Change Easing
        var easeSelect = card.querySelector('.node-select-ease');
        if (easeSelect) {
            easeSelect.addEventListener('change', function () {
                if (handlers.onUpdateNode) {
                    handlers.onUpdateNode(node.id, { easing: easeSelect.value });
                }
            });
        }

        // Capture Time
        var btnCapture = card.querySelector('.btn-capture-time');
        if (btnCapture) {
            btnCapture.addEventListener('click', function () {
                if (handlers.onCaptureTime) {
                    handlers.onCaptureTime(node.id);
                }
            });
        }

        // Delete Node
        var btnDelete = card.querySelector('.btn-delete-node');
        if (btnDelete) {
            btnDelete.addEventListener('click', function () {
                if (handlers.onDeleteNode) {
                    handlers.onDeleteNode(node.id);
                }
            });
        }
    }

    /**
     * Update active highlight in preview
     * @param {HTMLElement} container
     * @param {number} activeIndex
     */
    function highlightActiveNode(container, activeIndex) {
        if (!container) return;
        var cards = container.querySelectorAll('.node-card');
        for (var i = 0; i < cards.length; i++) {
            if (i === activeIndex) {
                cards[i].classList.add('node-card-active');
            } else {
                cards[i].classList.remove('node-card-active');
            }
        }

        // Also synchronize active pin on timeline ruler rail
        var rail = document.getElementById('nodes-marker-ruler-rail');
        if (rail) {
            var pins = rail.querySelectorAll('.nodes-ruler-pin');
            for (var p = 0; p < pins.length; p++) {
                if (p === activeIndex) {
                    pins[p].classList.add('active');
                } else {
                    pins[p].classList.remove('active');
                }
            }
        }
    }

    /**
     * Render visual marker timeline ruler with magnetic snapping & AE marker pins
     * @param {HTMLElement} container
     * @param {Array} sequence
     * @param {Function} onMarkerClick
     * @param {Function} [onScrub]
     */
    function renderMarkerRuler(container, sequence, onMarkerClick, onScrub) {
        if (!container) return;
        container.innerHTML = '';

        if (!sequence || sequence.length === 0) return;

        var maxTime = Math.max(0.5, sequence[sequence.length - 1].time || 0);

        var track = document.createElement('div');
        track.className = 'nodes-ruler-track';

        // 1. Subtle Micro-Ticks on Track (clean non-colliding visual scale)
        var ticksContainer = document.createElement('div');
        ticksContainer.className = 'nodes-ruler-ticks';
        var tickCount = (maxTime <= 5) ? Math.max(2, Math.round(maxTime * 2)) : 5;
        for (var tIdx = 0; tIdx <= tickCount; tIdx++) {
            var tick = document.createElement('span');
            var isMajor = (tIdx === 0 || tIdx === tickCount || tIdx % 2 === 0);
            tick.className = 'nodes-ruler-tick' + (isMajor ? ' tick-major' : '');
            tick.style.left = ((tIdx / tickCount) * 100).toFixed(2) + '%';
            ticksContainer.appendChild(tick);
        }
        track.appendChild(ticksContainer);

        // 2. Clean baseline rail wire (horizontal alignment guide)
        var wire = document.createElement('div');
        wire.className = 'nodes-ruler-wire';
        track.appendChild(wire);

        // 3. Playhead indicator needle (glides across ruler)
        var playhead = document.createElement('div');
        playhead.className = 'ruler-playhead';
        playhead.style.left = '0%';
        track.appendChild(playhead);

        // 4. Render hold duration bars behind pins
        sequence.forEach(function (node, index) {
            var pct = Math.min(100, Math.max(0, ((node.time || 0) / maxTime) * 100));
            if (node.hold && parseFloat(node.hold) > 0) {
                var holdPct = Math.min(100 - pct, ((parseFloat(node.hold) || 0) / maxTime) * 100);
                var holdBar = document.createElement('div');
                holdBar.className = 'nodes-ruler-hold type-' + (node.type || 'number');
                holdBar.style.left = pct.toFixed(2) + '%';
                holdBar.style.width = holdPct.toFixed(2) + '%';
                holdBar.setAttribute('title', 'Hold: ' + node.hold + 's (ثبات)');
                track.appendChild(holdBar);
            }
        });

        // 5. Render clean, distinct AE marker pins
        sequence.forEach(function (node, index) {
            var pct = Math.min(100, Math.max(0, ((node.time || 0) / maxTime) * 100));
            var pin = document.createElement('div');
            pin.className = 'nodes-ruler-pin type-' + (node.type || 'number') + (index === 0 ? ' active' : '');
            pin.style.left = pct.toFixed(2) + '%';
            pin.setAttribute('data-node-id', node.id);
            pin.setAttribute('data-node-index', index);
            pin.setAttribute('title', 'Marker #' + (index + 1) + ' (' + (node.type || 'number') + '): ' + node.value + ' @ ' + (node.time || 0) + 's');

            var pinHtml = '<div class="ruler-pin-flag">' + (index + 1) + '</div>' +
                '<span class="ruler-pin-stem"></span>';
            pin.innerHTML = pinHtml;

            pin.addEventListener('click', function (e) {
                e.stopPropagation();
                if (onMarkerClick) onMarkerClick(node.id, index);
            });

            track.appendChild(pin);
        });

        // 6. Interactive Click & Drag to Scrub with Magnetic Snapping
        if (typeof onScrub === 'function') {
            var isDragging = false;

            function getScrubTime(e) {
                var rect = container.getBoundingClientRect();
                var clickX = e.clientX - rect.left - 14;
                var availWidth = Math.max(1, rect.width - 28);
                var rawPct = Math.max(0, Math.min(1, clickX / availWidth));
                var rawTime = rawPct * maxTime;

                // Magnetic Snapping to Markers within ~2.5% threshold
                var snapThreshold = Math.max(0.06, maxTime * 0.025);
                for (var s = 0; s < sequence.length; s++) {
                    var mTime = sequence[s].time || 0;
                    if (Math.abs(rawTime - mTime) <= snapThreshold) {
                        return mTime;
                    }
                }
                return rawTime;
            }

            container.onmousedown = function (e) {
                if (e.target.closest('.nodes-ruler-pin')) return;
                isDragging = true;
                container.classList.add('is-scrubbing');
                onScrub(getScrubTime(e));

                function onMouseMove(moveEvent) {
                    if (isDragging) {
                        onScrub(getScrubTime(moveEvent));
                    }
                }

                function onMouseUp() {
                    isDragging = false;
                    container.classList.remove('is-scrubbing');
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                }

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            };
        }

        container.appendChild(track);
    }

    return {
        renderNodeList: renderNodeList,
        renderMarkerRuler: renderMarkerRuler,
        highlightActiveNode: highlightActiveNode,
        formatTime: _formatTime
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NodesView;
}

