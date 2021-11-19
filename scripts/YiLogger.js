/**
 * @file YiLogger.js
 * @brief NaCl/JS application log command handler.
 */

function CYILogger() { }

CYILogger.logTypeMap = Object.freeze({
    "log": "D",
    "debug": "D",
    "info": "I",
    "warn": "W",
    "error": "E"
});

CYILogger.logTypes = Object.freeze(Object.keys(CYILogger.logTypeMap));

CYILogger.enabled = CYIConfig.enableLogger; // determines if logs should be appended to the on-screen log overlay (disabled by default on release builds)

CYILogger.destroyOnNaClLoad = CYIConfig.destroyLogsOnNaClLoad; // determines if the logs should be removed from the DOM once the NaCl module loads

CYILogger.destroyed = false; // represents a state that the logger enters after being destoyed once the NaCL module loads, if applicable

CYILogger.logsContainerElement = null; // the element containing all of the log messages

CYILogger.originalConsole = { }; // the original unhooked console logging functions

CYILogger.modifiedConsole = { }; // the most recent version of the console logging functions which may be hooked by other code

CYILogger.consoleHooked = false; // represents whether the console logging functions are currently hooked or not

CYILogger.preNaClLoadLogCache = []; // a collection of any messages logged before the NaCl module has loaded

CYILogger.maxHistory = CYIConfig.maxLoggerHistory; // the maximum number of lines that can appear in the logs area before being truncated

CYILogger.scrollAmount = 100; // the amount to scroll the logs area by when pressing the up or down buttons

CYILogger.manuallyScrolled = false; // changes to true if the user has ever manually scrolled the logs area

CYILogger.keyListenerAdded = false; // represents whether the key listener has been added or not

CYILogger.defaultHeight = CYIConfig.defaultLoggerHeight; // the default height of the logs area

CYILogger.errorHeight = CYIConfig.errorLoggerHeight; // the height to adjust the logs area to when the error overlay is displayed

CYILogger.initialize = function initialize() {
    if(!CYILogger.enabled || CYILogger.destroyed || CYIUtilities.isValid(CYILogger.logsContainerElement)) {
        return;
    }

    CYILogger.logsContainerElement = document.createElement("div");
    CYILogger.logsContainerElement.classList.add("logs-container");
    CYILogger.logsContainerElement.style.display = "block";
    CYILogger.logsContainerElement.style.position = "absolute";
    CYILogger.logsContainerElement.style.left = "0";
    CYILogger.logsContainerElement.style.bottom = "0";
    CYILogger.logsContainerElement.style.width = "100%";
    CYILogger.logsContainerElement.style.overflowY = "scroll";
    CYILogger.logsContainerElement.style.backgroundColor = "black";
    CYILogger.logsContainerElement.style.fontSize = "1.65vh";
    CYILogger.logsContainerElement.style.color = "white";
    CYILogger.logsContainerElement.style.textAlign = "left";
    CYILogger.logsContainerElement.style.zIndex = CYIConfig.loggerZIndex;
    document.body.appendChild(CYILogger.logsContainerElement);

    CYILogger.setHeight(CYILogger.defaultHeight);

    CYILogger.addKeyListener();

    if(CYIDebug.isDebugBuild) {
        CYILogger.setLogWindowVisibility(true);
    }
};

CYILogger.destroy = function destroy() {
    if(CYILogger.destroyed || !CYILogger.destroyOnNaClLoad) {
        return;
    }

    CYILogger.removeKeyListener();

    if(CYILogger.logsContainerElement != null) {
        document.body.removeChild(CYILogger.logsContainerElement);
        CYILogger.logsContainerElement = null;
    }

    CYILogger.enabled = false;
    CYILogger.destroyed = true;
};

CYILogger.getLogWindowVisibility = function getLogWindowVisibility() {
    CYILogger.initialize();

    if(CYIUtilities.isInvalid(CYILogger.logsContainerElement)) {
        return false;
    }

    return CYILogger.logsContainerElement.style.display === "block";
};

CYILogger.setLogWindowVisibility = function setLogWindowVisibility(visible) {
    CYILogger.initialize();

    if(CYIUtilities.isInvalid(CYILogger.logsContainerElement)) {
        return;
    }

    if(visible) {
        CYILogger.logsContainerElement.style.display = "block";
    }
    else {
        CYILogger.logsContainerElement.style.display = "none";
    }

    if(visible) {
        CYILogger.scrollToBottom();
    }
};

CYILogger.setHeight = function setHeight(height) {
    if(CYIUtilities.isInvalid(CYILogger.logsContainerElement)) {
        return;
    }

    CYILogger.logsContainerElement.style.height = height;
    CYILogger.logsContainerElement.style.maxHeight = height;
};

CYILogger.scrollUp = function scrollUp() {
    if(!CYILogger.enabled || CYIUtilities.isInvalid(CYILogger.logsContainerElement)) {
        return;
    }

    var scrollPosition = CYILogger.logsContainerElement.scrollTop - CYILogger.scrollAmount;

    if(scrollPosition < 0) {
        scrollPosition = 0;
    }

    CYILogger.logsContainerElement.scrollTop = scrollPosition;
    CYILogger.manuallyScrolled = true;
};

CYILogger.scrollDown = function scrollDown() {
    if(!CYILogger.enabled || CYIUtilities.isInvalid(CYILogger.logsContainerElement)) {
        return;
    }

    var maxScrollPosition = CYILogger.logsContainerElement.scrollHeight - CYILogger.logsContainerElement.clientHeight;
    var scrollPosition = CYILogger.logsContainerElement.scrollTop + CYILogger.scrollAmount;

    if(scrollPosition > maxScrollPosition) {
        scrollPosition = maxScrollPosition;
    }

    CYILogger.logsContainerElement.scrollTop = scrollPosition;
    CYILogger.manuallyScrolled = true;
};

CYILogger.scrollToBottom = function scrollToBottom() {
    if(CYIUtilities.isInvalid(CYILogger.logsContainerElement)) {
        return;
    }

    CYILogger.logsContainerElement.scrollTop = CYILogger.logsContainerElement.scrollHeight - CYILogger.logsContainerElement.clientHeight;
};

CYILogger.canAppendToLogArea = function canAppendToLogArea() {
    if(!CYILogger.enabled || CYILogger.destroyed) {
        return false;
    }

    CYILogger.initialize();

    return CYILogger.getLogWindowVisibility(); // in the end, add messages only if the log area is visible
};

CYILogger.appendToLogArea = function appendToLogArea(finalMessage) {
    var shouldScroll = !CYILogger.manuallyScrolled || CYILogger.logsContainerElement.scrollTop + CYILogger.logsContainerElement.clientHeight == CYILogger.logsContainerElement.scrollHeight;

    if(isFinite(CYILogger.maxHistory)) {
        if(CYILogger.logsContainerElement.childElementCount >= CYILogger.maxHistory) {
            CYILogger.logsContainerElement.removeChild(CYILogger.logsContainerElement.firstChild);
        }
    }

    var messages = finalMessage.split("\n");

    for(var i = 0; i < messages.length; i++) {
        var logElement = document.createElement("div");
        var logTextNode = document.createTextNode(CYIUtilities.toString(messages[i]));
        logElement.appendChild(logTextNode);
        CYILogger.logsContainerElement.appendChild(logElement);
    }

    if(shouldScroll) {
        CYILogger.scrollToBottom();
    }
};

CYILogger.formatMessage = function formatMessage(args) {
    var formattedMessage = "";

    for(var i = 0; i < args.length; i++) {
        if(i !== 0) {
            formattedMessage += " ";
        }

        var arg = args[i];

        if(CYIUtilities.isError(arg)) {
            formattedMessage += CYIUtilities.toString(CYIUtilities.formatError(arg));
        } else {
            formattedMessage += CYIUtilities.toString(arg);
        }
    }

    return formattedMessage;
};

CYILogger.getCurrentTimestampString = function getCurrentTimestampString() {
    return moment().format("HH:mm:ss.SSS");
};

CYILogger.decorateLogMessage = function decorateLogMessage(timestampString, level, formattedMessage) {
    return timestampString + " " + level + "/Tizen:   " + formattedMessage;
};

CYILogger.log = function log(logType, args) {
    var timestampString = CYILogger.getCurrentTimestampString();
    var formattedMessage = CYILogger.formatMessage(args);

    // keep the original log timestamp in the native logs since those will only have their timestamp of most recent emission
    // from the C++ code, which will be later than the JS event (or much later, in case of pre-NaCL log cache playback)
    var nativeFormattedMessage = "[" + timestampString + "] " + formattedMessage;

    var isPreNaClMode = Array.isArray(CYILogger.preNaClLoadLogCache);

    var level = CYILogger.logTypeMap[logType];

    if(isPreNaClMode && level !== "E" && level !== "W") {
        // we need to transform non-warnings and non-errors into special levels,
        // so that it is kept even if the baseline C++ logging level is pretty high (warnings and above)
        level = "*"; // a "wildcard" level, reserved for pre-NaCl messages
    }

    // save or send JS console log messages to the C++ layer even if on-screen logging is disabled
    if(isPreNaClMode) {
        CYILogger.preNaClLoadLogCache.push({
            level: level,
            message: nativeFormattedMessage
        });
    }
    // the cache is not needed, we can send log events already
    else {
        CYIMessaging.sendEvent({
            context: CYILogger.name,
            name: "messageLogged",
            level: level, // the native level logger will do its own filtering
            message: nativeFormattedMessage
        });
    }

    if(CYILogger.canAppendToLogArea()) {
        CYILogger.appendToLogArea(CYILogger.decorateLogMessage(timestampString, level, formattedMessage));
    }
};

CYILogger.getPreNaClLoadLogs = function getPreNaClLoadLogs() {
    var preNaClLoadLogs = CYILogger.preNaClLoadLogCache;
    CYILogger.preNaClLoadLogCache = null; // discard the cache, it's no longer needed

    return preNaClLoadLogs;
};

CYILogger.backupOriginalConsole = function backupOriginalConsole() {
    for(var i = 0; i < CYILogger.logTypes.length; i++) {
        var type = CYILogger.logTypes[i];
        CYILogger.originalConsole[type] = console[type];
    }
};

CYILogger.backupModifiedConsole = function backupModifiedConsole() {
    for(var i = 0; i < CYILogger.logTypes.length; i++) {
        var type = CYILogger.logTypes[i];
        CYILogger.modifiedConsole[type] = console[type];
    }
};

CYILogger.restoreOriginalConsole = function restoreOriginalConsole() {
    for(var i = 0; i < CYILogger.logTypes.length; i++) {
        var type = CYILogger.logTypes[i];
        console[type] = CYILogger.originalConsole[type];
    }
};

CYILogger.restoreModifiedConsole = function restoreModifiedConsole() {
    for(var i = 0; i < CYILogger.logTypes.length; i++) {
        var type = CYILogger.logTypes[i];
        console[type] = CYILogger.modifiedConsole[type];
    }
};

CYILogger.hookConsoleLogging = function hookConsoleLogging() {
    if(CYILogger.consoleHooked) {
        return;
    }

    CYILogger.backupModifiedConsole();

    for(var i = 0; i < CYILogger.logTypes.length; i++) {
        var type = CYILogger.logTypes[i];

        console[type] = (function(type) {
            return function() {
                if(CYILogger.modifiedConsole[type] instanceof Function) {
                    CYILogger.modifiedConsole[type].apply(console, arguments);
                }

                return CYILogger.log(type, arguments);
            }
        })(type);
    }

    CYILogger.consoleHooked = true;
};

CYILogger.unhookConsoleLogging = function unhookConsoleLogging() {
    if(!CYILogger.consoleHooked) {
        return;
    }

    CYILogger.restoreModifiedConsole();

    CYILogger.consoleHooked = false;
};

CYILogger.onKeyUp = function onKeyUp(event) {
    if(!CYILogger.enabled) {
        return;
    }

    // ArrowUp
    if(event.keyCode === 38) {
        CYILogger.scrollUp();
    }
    // ArrowDown
    else if(event.keyCode === 40) {
        CYILogger.scrollDown();
    }
};

CYILogger.addKeyListener = function addKeyListener() {
    if(CYILogger.keyListenerAdded) {
        return;
    }

    document.addEventListener("keyup", CYILogger.onKeyUp);

    CYILogger.keyListenerAdded = true;
};

CYILogger.removeKeyListener = function removeKeyListener() {
    if(!CYILogger.keyListenerAdded) {
        return;
    }

    document.removeEventListener("keyup", CYILogger.onKeyUp);

    CYILogger.keyListenerAdded = false;
};

CYILogger.backupOriginalConsole();
CYILogger.hookConsoleLogging();

window.addEventListener("tizennaclloaded", function(event) {
    CYILogger.destroy();
});

window.addEventListener("tizenerroroverlayvisible", function(event) {
    CYILogger.setHeight(CYILogger.errorHeight);
});

window.addEventListener("tizenerroroverlayhidden", function(event) {
    CYILogger.setHeight(CYILogger.defaultHeight);
});

window.addEventListener("error", function(event) {
    if(event instanceof ErrorEvent) {
        var error = event.message;

        if(event.error !== undefined && event.error !== null) {
            error = event.error;
        }

        if(error instanceof Error) {
            if(error.stack === undefined || error.stack === null) {
                error.stack = CYIUtilities.formatStack(CYIUtilities.getStack().slice(1));
            }

            console.error("Unhandled Error: " + error.message);
            console.error(error.stack);
        }
        else {
            console.error("Unhandled Error: " + event.message);
            console.error("at " + event.filename + ":" + event.lineno + (isNaN(event.colno) ? "" : event.colno));
        }
    }

    return false;
});

window.addEventListener("unhandledrejection", function(event) {
    if(event instanceof PromiseRejectionEvent) {
        var reason = event.reason;

        if(reason instanceof Object) {
            console.error("Unhandled Promise Rejection: " + reason.message);
        }
    }

    return false;
});
