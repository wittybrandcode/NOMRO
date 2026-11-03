/**
 * CSInterface - Adobe CEP SDK
 * Minimal implementation for NOMRO extension
 * @version 11.0
 */

function CSInterface() {
    this.hostEnvironment = null;
    this.CYCB_CYCB = undefined;

    // Initialize
    try {
        if (window.__adobe_cep__) {
            this.hostEnvironment = JSON.parse(window.__adobe_cep__.getHostEnvironment());
        }
    } catch (e) {
        console.warn('CSInterface: Not running in CEP environment');
    }
}

/**
 * Evaluates a JavaScript script in ExtendScript
 * @param {string} script - Script to evaluate
 * @param {function} callback - Callback function
 */
CSInterface.prototype.evalScript = function (script, callback) {
    try {
        if (window.__adobe_cep__) {
            window.__adobe_cep__.evalScript(script, callback);
        } else {
            // Mock for browser testing
            console.log('[CSInterface Mock] evalScript:', script);
            if (callback) {
                setTimeout(function () {
                    callback('success');
                }, 100);
            }
        }
    } catch (e) {
        if (callback) {
            callback('EvalScript error: ' + e.message);
        }
    }
};

/**
 * Returns the host environment data
 * @returns {object} Host environment
 */
CSInterface.prototype.getHostEnvironment = function () {
    try {
        if (window.__adobe_cep__) {
            return JSON.parse(window.__adobe_cep__.getHostEnvironment());
        }
    } catch (e) {
        console.warn('getHostEnvironment error:', e);
    }
    return null;
};

/**
 * Returns the system path
 * @param {string} pathType - Path type
 * @returns {string} System path
 */
CSInterface.prototype.getSystemPath = function (pathType) {
    try {
        if (window.__adobe_cep__) {
            return window.__adobe_cep__.getSystemPath(pathType);
        }
    } catch (e) {
        console.warn('getSystemPath error:', e);
    }
    return '';
};

/**
 * Opens a URL in the default browser
 * @param {string} url - URL to open
 */
CSInterface.prototype.openURLInDefaultBrowser = function (url) {
    try {
        if (window.__adobe_cep__) {
            window.__adobe_cep__.openURLInDefaultBrowser(url);
        } else {
            window.open(url, '_blank');
        }
    } catch (e) {
        console.warn('openURLInDefaultBrowser error:', e);
    }
};

/**
 * Sets the panel flyout menu
 * @param {string} menu - Menu XML
 */
CSInterface.prototype.setPanelFlyoutMenu = function (menu) {
    try {
        if (window.__adobe_cep__) {
            window.__adobe_cep__.invokeSync('setPanelFlyoutMenu', menu);
        }
    } catch (e) {
        console.warn('setPanelFlyoutMenu error:', e);
    }
};

/**
 * Listens for flyout menu click
 * @param {function} callback - Callback function
 */
CSInterface.prototype.addEventListener = function (type, listener, obj) {
    try {
        if (window.__adobe_cep__) {
            window.__adobe_cep__.addEventListener(type, listener, obj);
        }
    } catch (e) {
        console.warn('addEventListener error:', e);
    }
};

/**
 * Removes event listener
 * @param {string} type - Event type
 * @param {function} listener - Listener function
 */
CSInterface.prototype.removeEventListener = function (type, listener, obj) {
    try {
        if (window.__adobe_cep__) {
            window.__adobe_cep__.removeEventListener(type, listener, obj);
        }
    } catch (e) {
        console.warn('removeEventListener error:', e);
    }
};

/**
 * Dispatches an event
 * @param {object} event - Event object
 */
CSInterface.prototype.dispatchEvent = function (event) {
    try {
        if (window.__adobe_cep__) {
            if (typeof event.data === 'object') {
                event.data = JSON.stringify(event.data);
            }
            window.__adobe_cep__.dispatchEvent(event);
        }
    } catch (e) {
        console.warn('dispatchEvent error:', e);
    }
};

/**
 * Closes the extension
 */
CSInterface.prototype.closeExtension = function () {
    try {
        if (window.__adobe_cep__) {
            window.__adobe_cep__.closeExtension();
        }
    } catch (e) {
        console.warn('closeExtension error:', e);
    }
};

/**
 * Request opening of a file/folder dialog
 * @param {string} title - Dialog title
 * @param {string} path - Initial path
 * @param {Array} filters - File filters
 * @param {function} callback - Callback with result
 */
CSInterface.prototype.requestOpenExtension = function (extension, params) {
    try {
        if (window.__adobe_cep__) {
            window.__adobe_cep__.requestOpenExtension(extension, params);
        }
    } catch (e) {
        console.warn('requestOpenExtension error:', e);
    }
};

/**
 * Gets current API version
 * @returns {object} API version
 */
CSInterface.prototype.getCurrentApiVersion = function () {
    return { major: 11, minor: 0, micro: 0 };
};

/**
 * Get extension ID
 * @returns {string} Extension ID
 */
CSInterface.prototype.getExtensionID = function () {
    try {
        if (window.__adobe_cep__) {
            return window.__adobe_cep__.getExtensionId();
        }
    } catch (e) {
        console.warn('getExtensionID error:', e);
    }
    return 'com.nomro.panel';
};

/**
 * System path constants
 */
CSInterface.prototype.EXTENSION_PATH = 'extension';
CSInterface.prototype.USER_DATA_PATH = 'userData';
CSInterface.prototype.COMMON_FILES_PATH = 'commonFiles';
CSInterface.prototype.HOST_APPLICATION_PATH = 'hostApplication';

/**
 * Theme color constants
 */
CSInterface.prototype.THEME_COLOR_CHANGED_EVENT = 'com.adobe.csxs.events.ThemeColorChanged';

// CSEvent class for dispatching events
function CSEvent(type, scope, appId, extensionId) {
    this.type = type;
    this.scope = scope || 'APPLICATION';
    this.appId = appId || '';
    this.extensionId = extensionId || '';
    this.data = '';
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CSInterface: CSInterface, CSEvent: CSEvent };
}
