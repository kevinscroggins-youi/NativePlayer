/**
 * @file YiUtilities.js
 * @brief JavaScript utility helper functions.
 *
 * Original Source:
 *  - https://github.com/nitro404/extra-utilities
 *  - https://github.com/nitro404/extended-math
 */

function CYIUtilities() { }

CYIUtilities.regExpFlags = {
    global: "g",
    multiline: "m",
    ignoreCase: "i",
    sticky: "y",
    unicode: "u"
};

CYIUtilities.isValid = function isValid(value) {
    return value !== undefined && value !== null;
};

CYIUtilities.isInvalid = function isInvalid(value) {
    return value === undefined || value === null;
};

CYIUtilities.isBoolean = function isBoolean(value, allowObjects) {
    return value === true || value === false || (!!allowObjects && value instanceof Boolean);
};

CYIUtilities.isValidNumber = function isValidNumber(value) {
    return typeof value === "number" && !isNaN(value) && value !== -Infinity && value !== Infinity;
};

CYIUtilities.isInvalidNumber = function isInvalidNumber(value) {
    return typeof value !== "number" || isNaN(value) || value === -Infinity || value === Infinity;
};

CYIUtilities.isInteger = function isInteger(value, allowObjects) {
    if(Number.isInteger(value)) {
        return true;
    }

    if(value instanceof Number && CYIUtilities.parseBoolean(allowObjects, true)) {
        return Number.isInteger(value.valueOf());
    }

    if(typeof value !== "string") {
        return false;
    }

    // will match string values optionally prefixed with a + / - sign followed by either 0 or any other integer number that does not start with 0
    // this will not match some strings such as those containing numbers expressed using scientific notation
    return !!value.match(/^([+-]?[1-9][0-9]*|0)$/);
};

CYIUtilities.isFloat = function isFloat(value, allowObjects) {
    if(typeof value === "number") {
        return !isNaN(value) && isFinite(value);
    }

    if(value instanceof Number && CYIUtilities.parseBoolean(allowObjects, true)) {
        return true;
    }

    if(typeof value !== "string") {
        return false;
    }

    // will match string values optionally prefixed with a + / - sign followed by either:
    // - an integer value
    // - a decimal point followed by an integer value
    // - an integer value followed by a decimal point and another subsequent integer value
    // this will not match some strings such as those containing numbers expressed using scientific notation
    return !!value.match(/^([+-]?(((([1-9][0-9]*|0)?\.)[0-9]+)|([1-9][0-9]*|0)))$/);
};

CYIUtilities.isEmptyString = function isEmptyString(value, trim) {
    return typeof value !== "string" || (CYIUtilities.parseBoolean(trim, true) ? value.trim().length === 0 : value.length === 0);
};

CYIUtilities.isNonEmptyString = function isNonEmptyString(value, trim) {
    return typeof value === "string" && (CYIUtilities.parseBoolean(trim, true) ? value.trim().length !== 0 : value.length !== 0);
};

CYIUtilities.isObject = function isObject(value, strict) {
    return value !== undefined && (strict ? value !== null && value.constructor === Object : value instanceof Object && !(value instanceof Function));
};

CYIUtilities.isObjectStrict = function isObjectStrict(value) {
    return value !== undefined && value !== null && value.constructor === Object;
};

CYIUtilities.isEmptyObject = function isEmptyObject(value) {
    return value !== undefined && value !== null && value.constructor === Object && Object.keys(value).length === 0;
};

CYIUtilities.isNonEmptyObject = function isNonEmptyObject(value) {
    return value !== undefined && value !== null && value.constructor === Object && Object.keys(value).length !== 0;
};

CYIUtilities.isEmptyArray = function isEmptyArray(value) {
    return Array.isArray(value) ? value.length === 0 : true;
};

CYIUtilities.isNonEmptyArray = function isNonEmptyArray(value) {
    return Array.isArray(value) && value.length !== 0;
};

CYIUtilities.isDate = function isDate(value) {
    return value instanceof Date;
};

CYIUtilities.isError = function isError(value) {
    return value instanceof Error;
};

CYIUtilities.isRangeError = function isRangeError(value) {
    return value instanceof RangeError;
};

CYIUtilities.isReferenceError = function isReferenceError(value) {
    return value instanceof ReferenceError;
};

CYIUtilities.isSyntaxError = function isSyntaxError(value) {
    return value instanceof SyntaxError;
};

CYIUtilities.isTypeError = function isTypeError(value) {
    return value instanceof TypeError;
};

CYIUtilities.isRegularExpression = function isRegularExpression(value) {
    return value instanceof RegExp;
};

CYIUtilities.isFunction = function isFunction(value) {
    return value instanceof Function;
};

CYIUtilities.equalsIgnoreCase = function equalsIgnoreCase(valueA, valueB) {
    if(typeof valueA !== "string" || typeof valueB !== "string") {
        return false;
    }

    return valueA.localeCompare(valueB, undefined, { sensitivity: "accent" }) === 0;
};

CYIUtilities.formatStack = function formatStack(stackFrames, message, errorName) {
    if(CYIUtilities.isEmptyArray(stackFrames)) {
        return "";
    }

    var stackFrame = null;
    var formattedStack = "";

    if (CYIUtilities.isNonEmptyString(message)) {
        formattedStack += CYIUtilities.isEmptyString(errorName) ? "Error" : errorName + ": " + message;
    }

    for(var i = 0; i < stackFrames.length; i++) {
        stackFrame = stackFrames[i];

        if(formattedStack.length !== 0) {
            formattedStack += "\n";
        }

        if(CYIUtilities.isNonEmptyString(stackFrame.source)) {
            formattedStack += "\t" + stackFrame.source;
        }
    }

    return formattedStack;
};

CYIUtilities.getStack = function getStack(callback) {
    if(typeof StackTrace === "undefined") {
        var stack = new Error().stack

        if(CYIUtilities.isInvalid(stack)) {
            if(CYIUtilities.isFunction(callback)) {
                return callback(null, null);
            }

            return null;
        }

        var stackLines = stack.split(/\n[ \t]*/).slice(2);
        var formattedStack = [];
        var stackLineData = null;

        for(var i = 0; i < stackLines.length; i++) {
            // intended to match stack trace lines such as the following:
            // - '    at (index):34'
            // - '    at Test.ignore ((index):42)'
            // - '    at foo ((index):47)'
            // - '    at //Users/username/app/index.js:7:15'
            // - '    at test (//Users/username/app/index.js:8:4)'
            // - '    at Object.<anonymous> (/Users/username/app/index.js:11:1)'
            // - '    at Object.Module._extensions..js (internal/modules/cjs/loader.js:991:10)'
            // - '    at Test.ignore (main.js:5)'
            // - '    at foo (main.js:13)'
            // - '    at main.js:20'
            stackLineData = stackLines[i].match(/^[ \t]*at[ \t]+((([^\(]+)[ \t]+\(([^:]+):([0-9]+)(:([0-9]+))?\))|(([^ \t:]+|[^():]+):([0-9]+)(:([0-9]+))?))$/);

            if(stackLineData) {
                formattedStack.push({
                    functionName: stackLineData[3] || "",
                    fileName: CYIUtilities.getFileName(stackLineData[4] || stackLineData[9]),
                    filePath: stackLineData[4] || stackLineData[9],
                    lineNumber: CYIUtilities.parseInteger(CYIUtilities.isInteger(stackLineData[5]) ? stackLineData[5] : stackLineData[10]),
                    columnNumber: CYIUtilities.parseInteger(CYIUtilities.isInteger(stackLineData[7]) ? stackLineData[7] : stackLineData[12]),
                    source: stackLines[i]
                });
            }
        }

        if(CYIUtilities.isFunction(callback)) {
            return callback(null, formattedStack);
        }

        return formattedStack;
    }

    function formatStackFrames(stackFrames) {
        if(CYIUtilities.isEmptyArray(stackFrames)) {
            return [];
        }

        var formattedStackFrames = [];
        var stackFrame = null;

        for(var i = stackFrames[0].functionName === "Object.getStack" ? 1 : 3; i < stackFrames.length; i++) {
            stackFrame = stackFrames[i];
            var stackFrameSource = CYIUtilities.isValid(stackFrame.source) ? stackFrame.source.trim() : "Source Unknown";

            formattedStackFrames.push({
                functionName: stackFrame.functionName,
                fileName: CYIUtilities.getFileName(stackFrame.fileName),
                filePath: stackFrame.fileName,
                lineNumber: stackFrame.lineNumber,
                columnNumber: stackFrame.columnNumber,
                source: stackFrameSource
            });
        }

        return formattedStackFrames;
    }

    if(CYIUtilities.isFunction(callback)) {
        return StackTrace.get({
            offline: true
        }).then(function(stackFrames) {
            return callback(null, formatStackFrames(stackFrames));
        }).catch(function(error) {
            return callback(error);
        });
    }

    return formatStackFrames(StackTrace.getSync());
};

CYIUtilities.getFormattedStack = function getFormattedStack() {
    return CYIUtilities.formatStack(CYIUtilities.getStack().slice(1));
};

CYIUtilities.formatFunctionName = function formatFunctionName(functionName, includeClassName) {
    if(typeof functionName !== "string") {
        return null;
    }

    var includeClassName = CYIUtilities.parseBoolean(includeClassName, false);

    if(includeClassName) {
        return functionName;
    }

    var dotIndex = functionName.indexOf(".");

    if(dotIndex === -1) {
        return functionName;
    }

    return functionName.substring(dotIndex + 1, functionName.length);
};

CYIUtilities.getFunctionName = function getFunctionName(includeClassName) {
    var stackData = CYIUtilities.getStack();

    if(CYIUtilities.isInvalid(stackData) || stackData.length < 2) {
        return null;
    }

    return CYIUtilities.formatFunctionName(stackData[1].functionName, includeClassName);
};

CYIUtilities.getParentFunctionName = function getParentFunctionName(includeClassName) {
    var includeClassName = CYIUtilities.parseBoolean(includeClassName, false);
    var stackData = CYIUtilities.getStack();

    if(CYIUtilities.isInvalid(stackData) || stackData.length < 3) {
        return null;
    }

    return CYIUtilities.formatFunctionName(stackData[2].functionName, includeClassName);
};

CYIUtilities.parseBoolean = function parseBoolean(value, defaultValue) {
    if(CYIUtilities.isBoolean(value)) {
        return value;
    }

    if(CYIUtilities.isBoolean(value, true)) {
        return value.valueOf();
    }

    if(!CYIUtilities.isBoolean(defaultValue)) {
        defaultValue = null;
    }

    if(CYIUtilities.isInvalid(value)) {
        return defaultValue;
    }

    if(value === 0) {
        return false;
    }
    else if(value === 1) {
        return true;
    }

    if(typeof value !== "string") {
        return defaultValue;
    }

    var formattedValue = value.trim().toLowerCase();

    if(formattedValue.length === 0) {
        return defaultValue;
    }

    if(formattedValue.length === 1) {
        var character = formattedValue.charAt(0);

        if(character === "t" || character === "y") {
            return true;
        }
        else if(character === "f" || character === "n") {
            return false;
        }
        else if(character === "0") {
            return false;
        }
        else if(character === "1") {
            return true;
        }

        return defaultValue;
    }

    if(formattedValue === "true" || formattedValue === "yes" || formattedValue === "on") {
        return true;
    }
    else if(formattedValue === "false" || formattedValue === "no" || formattedValue === "off") {
        return false;
    }

    return defaultValue;
};

CYIUtilities.parseInteger = function parseInteger(value, defaultValue) {
    var newValue = NaN;

    if(typeof value === "number") {
        newValue = parseInt(value);
    }
    else if(typeof value === "string") {
        if(CYIUtilities.isFloat(value)) {
            newValue = parseInt(value);
        }
    }
    else if(value instanceof Number) {
        newValue = parseInt(value.valueOf());
    }

    if(CYIUtilities.isInvalidNumber(newValue)) {
        defaultValue = parseInt(defaultValue);

        return CYIUtilities.isValidNumber(defaultValue) ? defaultValue : NaN;
    }

    return newValue;
};

// note: function name cannot collide with global scope functions
CYIUtilities.parseFloat = function parseFloatingPointNumber(value, defaultValue) {
    var newValue = NaN;

    if(typeof value === "number") {
        newValue = value;
    }
    else if(typeof value === "string") {
        if(CYIUtilities.isFloat(value)) {
            newValue = parseFloat(value);
        }
    }
    else if(value instanceof Number) {
        newValue = value.valueOf();
    }

    if(CYIUtilities.isInvalidNumber(newValue)) {
        return CYIUtilities.isValidNumber(defaultValue) ? defaultValue : NaN;
    }

    return newValue;
};

// deprecated
CYIUtilities.parseFloatingPointNumber = CYIUtilities.parseFloat;

CYIUtilities.parseDate = function parseDate(value, defaultValue) {
    if(!CYIUtilities.isDate(defaultValue)) {
        defaultValue = null;
    }

    if(typeof value === "number") {
        if(CYIUtilities.isInvalidNumber(value) || !Number.isInteger(value) || value < 0) {
            return defaultValue;
        }

        return new Date(parseInt(value));
    }
    else if(typeof value === "string") {
        var formattedValue = value.trim();

        if(formattedValue.length === 0) {
            return defaultValue;
        }

        var timestamp = null;

        if(CYIUtilities.isInteger(formattedValue)) {
            timestamp = parseInt(formattedValue);
        }
        else {
            timestamp = Date.parse(formattedValue);
        }

        if(CYIUtilities.isInvalidNumber(timestamp)) {
            return defaultValue;
        }

        return new Date(timestamp);
    }
    else if(value instanceof Date) {
        return value;
    }

    return defaultValue;
};

CYIUtilities.leftShift = function leftShift(number, bits) {
    if(!Number.isInteger(number) || !Number.isInteger(bits)) {
        return NaN;
    }

    return number * Math.pow(2, bits);
};

CYIUtilities.rightShift = function rightShift(number, bits) {
    if(!Number.isInteger(number) || !Number.isInteger(bits)) {
        return NaN;
    }

    return number / Math.pow(2, bits);
};

CYIUtilities.trimString = function trimString(value, defaultValue) {
    return typeof value === "string" ? value.trim() : (typeof defaultValue === "string" ? defaultValue : null);
};

CYIUtilities.trimNullTerminatedString = function trimNullTerminatedString(value, defaultValue) {
    if(typeof value !== "string") {
        return typeof defaultValue === "string" ? defaultValue : null;
    }

    var nullTerminatorIndex = value.indexOf("\0");

    if(nullTerminatorIndex >= 0) {
        return value.substr(0, nullTerminatorIndex);
    }

    return value;
};

CYIUtilities.trimWhitespace = function trimWhitespace(value, trimNewlines, defaultValue) {
    if(typeof value !== "string") {
        return typeof defaultValue === "string" ? defaultValue : null;
    }

    var trimmedString = value.replace(/^[ \t]+|[ \t]+$/gm, "");

    if(CYIUtilities.parseBoolean(trimNewlines, false)) {
        trimmedString = trimmedString.replace(/\r\n?|\n/g, "");
    }

    return trimmedString;
};

CYIUtilities.trimTrailingNewlines = function trimTrailingNewlines(value, defaultValue) {
    if(typeof value !== "string") {
        return typeof defaultValue === "string" ? defaultValue : null;
    }

    if(CYIUtilities.isEmptyString(value)) {
        return value;
    }

    return value.replace(/[ \t\r\n]+$/, "");
};

CYIUtilities.replaceNonBreakingSpaces = function replaceNonBreakingSpaces(value) {
    return typeof value === "string" ? value.replace(/&nbsp;/gi, " ") : null;
};

CYIUtilities.indentText = function indentText(value, amount, indentation, clearEmptyLines) {
    if(typeof value !== "string") {
        return null;
    }

    clearEmptyLines = CYIUtilities.parseBoolean(clearEmptyLines, true);

    amount = CYIUtilities.parseInteger(amount, 1);

    if(amount < 0) {
        amount = 0;
    }

    indentation = typeof indentation === "string" ? indentation : "\t";

    var totalIndentation = "";

    for(var i = 0; i < amount; i++) {
        totalIndentation += indentation;
    }

    var line = null;
    var lines = value.split(/\r\n?|\n/g);
    var indentedParagraph = "";

    for(var i = 0; i < lines.length; i++) {
        line = lines[i];

        indentedParagraph += (CYIUtilities.isEmptyString(line) && clearEmptyLines ? "" : totalIndentation + line) + ((i < lines.length - 1) ? "\n" : "");
    }

    return indentedParagraph;
};

CYIUtilities.trimLeadingZeroes = function trimLeadingZeroes(value) {
    if(typeof value !== "string") {
        return null;
    }

    if(value.length === 0) {
        return value;
    }

    var formattedValue = value.trim();

    if(formattedValue.length === 0) {
        return formattedValue;
    }
    else if(formattedValue.match(/^[0]+$/)) {
        return "0";
    }

    return formattedValue.replace(/^0+/, "");
};

CYIUtilities.addLeadingZeroes = function addLeadingZeroes(value, expectedLength) {
    if(CYIUtilities.isInvalid(value)) {
        return null;
    }

    value = value.toString();
    expectedLength = CYIUtilities.parseInteger(expectedLength);

    if(CYIUtilities.isInvalidNumber(expectedLength) || expectedLength < 0) {
        return value;
    }

    var numberOfZeroes = expectedLength - value.length;

    for(var i = 0; i < numberOfZeroes; i++) {
        value = "0" + value;
    }

    return value;
};

CYIUtilities.toString = function toString(value) {
    if(value === undefined) {
        return "undefined";
    }
    else if(value === null) {
        return "null";
    }
    else if(typeof value === "string") {
        return value;
    }
    else if(value === Infinity) {
        return "Infinity";
    }
    else if(value === -Infinity) {
        return "-Infinity";
    }
    else if(typeof value === "number" && isNaN(value)) {
        return "NaN";
    }
    else if(CYIUtilities.isDate(value)) {
        return value.toString();
    }
    else if(CYIUtilities.isRegularExpression(value)) {
        var flags = "";

        for(var flag in regExpFlags) {
            if(value[flag]) {
                flags += regExpFlags[flag];
            }
        }

        return "/" + value.source + "/" + flags;
    }
    else if(CYIUtilities.isFunction(value)) {
        return value.toString();
    }
    else if(CYIUtilities.isError(value)) {
        if(CYIUtilities.isValid(value.stack)) {
            return value.stack;
        }

        return value.message;
    }

    return JSON.stringify(value);
};

CYIUtilities.compareDates = function compareDates(a, b) {
    a = CYIUtilities.parseDate(a);
    b = CYIUtilities.parseDate(b);

    if(a === null && b === null) {
        return 0;
    }

    if(a === null) {
        return -1;
    }
    else if(b === null) {
        return 1;
    }

    return a.getTime() - b.getTime();
};

CYIUtilities.compareCasePercentage = function compareCasePercentage(value) {
    if(CYIUtilities.isEmptyString(value)) {
        return 0;
    }

    var c = null;
    var upper = 0;
    var lower = 0;
    var lowerA = "a".charCodeAt();
    var lowerZ = "z".charCodeAt();
    var upperA = "A".charCodeAt();
    var upperZ = "Z".charCodeAt();

    for(var i = 0; i < value.length; i++) {
        c = value.charCodeAt(i);

        if(c >= lowerA && c <= lowerZ) {
            lower++;
        }
        else if(c >= upperA && c <= upperZ) {
            upper++;
        }
    }

    return upper - lower;
};

CYIUtilities.reverseString = function reverseString(value) {
    if(typeof value !== "string") {
        return null;
    }

    value = value.replace(
        /([\0-\u02FF\u0370-\u1AAF\u1B00-\u1DBF\u1E00-\u20CF\u2100-\uD7FF\uE000-\uFE1F\uFE30-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])([\u0300-\u036F\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]+)/g,
        function($0, $1, $2) {
            return CYIUtilities.reverseString($2) + $1;
        }
    ).replace(/([\uD800-\uDBFF])([\uDC00-\uDFFF])/g, "$2$1");

    var reverse = "";

    for(var i = value.length - 1; i >= 0; i--) {
        reverse += value[i];
    }

    return reverse;
};

CYIUtilities.createError = function createError(message) {
    var error = new Error(message);
    error.stack = CYIUtilities.formatStack(CYIUtilities.getStack().slice(1), message, error.name);
    return error;
};

CYIUtilities.createRangeError = function createRangeError(message) {
    var error = new RangeError(message);
    error.stack = CYIUtilities.formatStack(CYIUtilities.getStack().slice(1), message, error.name);
    return error;
};

CYIUtilities.createReferenceError = function createReferenceError(message) {
    var error = new ReferenceError(message);
    error.stack = CYIUtilities.formatStack(CYIUtilities.getStack().slice(1), message, error.name);
    return error;
};

CYIUtilities.createSyntaxError = function createSyntaxError(message) {
    var error = new SyntaxError(message);
    error.stack = CYIUtilities.formatStack(CYIUtilities.getStack().slice(1), message, error.name);
    return error;
};

CYIUtilities.createTypeError = function createTypeError(message) {
    var error = new TypeError(message);
    error.stack = CYIUtilities.formatStack(CYIUtilities.getStack().slice(1), message, error.name);
    return error;
};

CYIUtilities.formatError = function formatError(error) {
    if(!CYIUtilities.isObject(error)) {
        return error;
    }

    if(CYIUtilities.isInvalid(error.stack)) {
        error.stack = CYIUtilities.formatStack(CYIUtilities.getStack().slice(1), error.message, error.name);
    }

    return error;
};

CYIUtilities.clone = function clone(value) {
    if(!CYIUtilities.isObject(value)) {
        return value;
    }
    else if(value instanceof Boolean) {
        return new Boolean(value.valueOf());
    }
    else if(value instanceof Date) {
        var copy = new Date();
        copy.setTime(value.getTime());

        return copy;
    }
    else if(value instanceof Array) {
        var copy = [];

        for(var i = 0, length = value.length; i < length; i++) {
            copy[i] = CYIUtilities.clone(value[i]);
        }

        return copy;
    }
    else if(value instanceof Set) {
        return new Set(value);
    }
    else if(value instanceof Map) {
        return new Map(value);
    }
    else if(value instanceof RegExp) {
        var flags = "";

        for(var flag in regExpFlags) {
            if(value[flag]) {
                flags += regExpFlags[flag]
            }
        }

        return new RegExp(value.source, flags);
    }
    else if(typeof Buffer !== "undefined" && value instanceof Buffer) {
        return Buffer.from instanceof Function ? Buffer.from(value) : new Buffer(value);
    }
    else if(value instanceof Object) {
        var copy = null;

        if(value instanceof Error) {
            copy = new Error(value.message);

            copy.stack = CYIUtilities.clone(value.stack);

            var properties = Object.keys(value);

            for(var i = 0; i < properties.length; i++) {
                copy[properties[i]] = CYIUtilities.clone(value[properties[i]]);
            }
        }
        else {
            copy = { };
        }

        for(var attribute in value) {
            if(Object.prototype.hasOwnProperty.call(value, attribute)) {
                copy[attribute] = CYIUtilities.clone(value[attribute]);
            }
        }

        return copy;
    }

    return value;
};

CYIUtilities.merge = function merge(a, b, copy, deepMerge) {
    if(!CYIUtilities.isObject(a) || Array.isArray(a)) {
        return null;
    }

    var newObject = null;

    copy = CYIUtilities.parseBoolean(copy, true);

    if(copy) {
        newObject = CYIUtilities.clone(a);
    }
    else {
        newObject = a;
    }

    if(!CYIUtilities.isObject(a) || Array.isArray(a) || !CYIUtilities.isObject(b) || Array.isArray(b)) {
        return newObject;
    }

    var attribute = null;
    var value = null;
    var newValue = null;
    var attributes = Object.keys(b);

    deepMerge = CYIUtilities.parseBoolean(deepMerge, true);

    for(var i = 0; i < attributes.length; i++) {
        attribute = attributes[i];
        value = newObject[attribute];

        if(copy) {
            newValue = CYIUtilities.clone(b[attribute]);
        }
        else {
            newValue = b[attribute];
        }

        if(deepMerge && CYIUtilities.isObject(value) && !Array.isArray(value) && CYIUtilities.isObject(newValue) && !Array.isArray(newValue)) {
            newObject[attribute] = CYIUtilities.merge(value, newValue);
        }
        else {
            newObject[attribute] = newValue;
        }
    }

    return newObject;
};

CYIUtilities.getFileName = function getFileName(filePath) {
    if(typeof filePath !== "string") {
        return null;
    }

    filePath = filePath.trim();

    for(var i = filePath.length - 1; i >= 0; i--) {
        if(filePath[i] === "/" || filePath[i] === "\\") {
            return filePath.substring(i + 1, filePath.length).trim();
        }
    }

    return filePath;
};

CYIUtilities.getFilePath = function getFilePath(filePath) {
    if(typeof filePath !== "string") {
        return null;
    }

    filePath = filePath.trim();

    for(var i = filePath.length - 1; i >= 0; i--) {
        if(filePath[i] === "/" || filePath[i] === "\\") {
            return filePath.substring(0, i).trim();
        }
    }

    return "";
};

CYIUtilities.getFileNameNoExtension = function getFileNameNoExtension(fileName) {
    if(typeof fileName !== "string") {
        return null;
    }

    fileName = CYIUtilities.getFileName(fileName);

    for(var i = fileName.length - 1; i >= 0; i--) {
        if(fileName[i] === ".") {
            return fileName.substring(0, i).trim();
        }
    }

    return fileName;
};

CYIUtilities.getFileExtension = function getFileExtension(fileName) {
    if(typeof fileName !== "string") {
        return null;
    }

    fileName = CYIUtilities.getFileName(fileName);

    for(var i = fileName.length - 1; i >= 0; i--) {
        if(fileName[i] === ".") {
            return fileName.substring(i + 1, fileName.length).trim();
        }
    }

    return "";
};

CYIUtilities.fileHasExtension = function fileHasExtension(fileName, extension) {
    if(CYIUtilities.isEmptyString(fileName) || CYIUtilities.isEmptyString(extension)) {
        return false;
    }

    var actualFileExtension = CYIUtilities.getFileExtension(fileName);

    if(CYIUtilities.isEmptyString(actualFileExtension)) {
        return false;
    }

    return actualFileExtension.toLowerCase() === extension.trim().toLowerCase();
};

CYIUtilities.reverseFileExtension = function reverseFileExtension(fileName) {
    if(typeof fileName !== "string") {
        return null;
    }

    fileName = fileName.trim();

    for(var i = fileName.length - 1; i >= 0; i--) {
        if(fileName[i] === ".") {
            return fileName.substring(0, i) + "." + CYIUtilities.reverseString(fileName.substring(i + 1, fileName.length));
        }
    }

    return fileName;
};

CYIUtilities.truncateFileName = function truncateFileName(fileName, maxLength) {
    if(typeof fileName !== "string") {
        return null;
    }

    fileName = CYIUtilities.getFileName(fileName);

    if(CYIUtilities.isEmptyString(fileName)) {
        return "";
    }

    maxLength = CYIUtilities.parseInteger(maxLength);

    if(CYIUtilities.isInvalidNumber(maxLength) || maxLength < 0) {
        return fileName;
    }

    if(maxLength === 0) {
        return "";
    }

    if(fileName.length <= maxLength) {
        return fileName;
    }

    var extension = "";
    var originalFileName = fileName;

    for(var i = fileName.length - 1; i >= 0; i--) {
        if(fileName[i] === ".") {
            extension = fileName.substring(i + 1, fileName.length);
            originalFileName = fileName.substring(0, i);
            break;
        }
    }

    if(maxLength - (extension.length + (extension.length > 0 ? 1 : 0)) < 1) {
        return originalFileName.substring(0, maxLength);
    }

    return originalFileName.substring(0, maxLength - extension.length - (extension.length > 0 ? 1 : 0)) + (extension.length > 0 ? "." + extension : "");
};

CYIUtilities.prependSlash = function prependSlash(value, forwardSlash) {
    if(typeof value !== "string") {
        return null;
    }

    forwardSlash = CYIUtilities.parseBoolean(forwardSlash, true);

    var formattedValue = value.trim();

    if(formattedValue.length === 0) {
        return formattedValue;
    }

    if(formattedValue[0] !== "/" && formattedValue[0] !== "\\") {
        formattedValue = (forwardSlash ? "/" : "\\") + formattedValue;
    }

    return formattedValue;
};

CYIUtilities.appendSlash = function appendSlash(value, forwardSlash) {
    if(typeof value !== "string") {
        return null;
    }

    forwardSlash = CYIUtilities.parseBoolean(forwardSlash, true);

    var formattedValue = value.trim();

    if(formattedValue.length === 0) {
        return formattedValue;
    }

    if(formattedValue[formattedValue.length - 1] !== "/" && formattedValue[formattedValue.length - 1] !== "\\") {
        formattedValue += (forwardSlash ? "/" : "\\");
    }

    return formattedValue;
};

CYIUtilities.joinPaths = function joinPaths(paths, options) {
    if(!Array.isArray(paths)) {
        paths = Array.prototype.slice.call(arguments);
    }

    if(paths.length !== 0 && CYIUtilities.isObjectStrict(paths[paths.length - 1])) {
        options = paths.splice(paths.length - 1, 1)[0];
    }

    if(!CYIUtilities.isObjectStrict(options)) {
        options = { };
    }

    options.separator = CYIUtilities.trimString(options.separator);

    if(options.separator !== "/" && options.separator !== "\\") {
        options.separator = "/";
    }

    var newPath = "";

    for(var i = 0; i < paths.length; i++) {
        var path = CYIUtilities.trimString(paths[i]);

        if(CYIUtilities.isEmptyString(path)) {
            continue;
        }

        if(CYIUtilities.isEmptyString(newPath)) {
            if(path === "/" || path === "\\") {
                newPath = path;
            }
            else {
                newPath = path.replace(/[\/\\]+$/, "");
            }
        }
        else {
            path = path.replace(/^[\/\\]+/, "");

            if(CYIUtilities.isNonEmptyString(path)) {
                if(newPath[newPath.length - 1] !== options.separator) {
                    newPath += options.separator;
                }

                newPath += path;
            }
        }
    }

    return newPath.replace(/[\/\\]/g, options.separator);
};

CYIUtilities.generateVersions = function generateVersions(version, prefix, suffix) {
    version = CYIUtilities.parseVersion(version);

    if(version === null) {
        return null;
    }

    prefix = CYIUtilities.trimString(prefix);
    suffix = CYIUtilities.trimString(suffix);

    var versions = [];
    var value = null;

    for(var i = 0; i < version.length; i++) {
        value = "";

        if(CYIUtilities.isNonEmptyString(prefix)) {
            value += prefix;
        }

        for(var j = 0; j <= i; j++) {
            if(j > 0) {
                value += "_";
            }

            value += version[j];
        }

        if(CYIUtilities.isNonEmptyString(suffix)) {
            value += suffix;
        }

        versions.push(value);
    }

    return versions;
};

CYIUtilities.parseVersion = function parseVersion(value, trimTrailingZeroes) {
    var formattedValue = CYIUtilities.isValidNumber(value) ? value.toString() : value;

    if(typeof formattedValue !== "string") {
        return null;
    }

    var version = [];
    var versionData = formattedValue.match(/[^. \t]+/g);

    if(versionData === null || versionData.length === 0) {
        return null;
    }

    var part = null;

    for(var i = 0; i < versionData.length; i++) {
        if(CYIUtilities.isInteger(versionData[i])) {
            part = CYIUtilities.parseInteger(versionData[i]);

            if(CYIUtilities.isInvalidNumber(part) || part < 0) {
                continue;
            }

            version.push(part.toString());
        }
        else {
            version.push(versionData[i]);
        }
    }

    if(CYIUtilities.parseBoolean(trimTrailingZeroes, false)) {
        while(true) {
            if(version.length <= 1) {
                break;
            }

            if(version[version.length - 1] === "0") {
                version.pop();
            }
            else {
                break;
            }
        }
    }

    return version.length === 0 ? null : version;
};

CYIUtilities.compareVersions = function compareVersions(v1, v2, caseSensitive) {
    caseSensitive = CYIUtilities.parseBoolean(caseSensitive, false);

    v1 = CYIUtilities.parseVersion(v1);

    if(v1 === null) {
        throw new Error("Cannot compare invalid or empty first version.");
    }

    v2 = CYIUtilities.parseVersion(v2);

    if(v2 === null) {
        throw new Error("Cannot compare invalid or empty second version.");
    }

    var index = 0;

    while(true) {
        if(index >= v1.length) {
            if(v1.length === v2.length) {
                return 0;
            }

            for(var i = index; i < v2.length; i++) {
                if(v2[i] !== "0") {
                    return -1;
                }
            }

            return 0;
        }

        if(index >= v2.length) {
            for(var i = index; i < v1.length; i++) {
                if(v1[i] !== "0") {
                    return 1;
                }
            }

            return 0;
        }

        var formattedA = CYIUtilities.parseInteger(v1[index]);
        var formattedB = CYIUtilities.parseInteger(v2[index]);

        if(CYIUtilities.isInvalidNumber(formattedA)) {
            formattedA = caseSensitive ? v1[index] : v1[index].toUpperCase();
        }

        if(CYIUtilities.isInvalidNumber(formattedB)) {
            formattedB = caseSensitive ? v2[index] : v2[index].toUpperCase();
        }

        if(Number.isInteger(formattedA)) {
            if(!Number.isInteger(formattedB)) {
                return -1;
            }
        }
        else {
            if(Number.isInteger(formattedB)) {
                return 1;
            }
        }

        if(formattedA > formattedB) {
            return 1;
        }
        else if(formattedA < formattedB) {
            return -1;
        }

        index++;
    }
};

CYIUtilities.clamp = function clamp(value, min, max) {
    if(CYIUtilities.isInvalidNumber(value) || CYIUtilities.isInvalidNumber(min) || CYIUtilities.isInvalidNumber(max)) {
        return NaN;
    }

    return value < min ? min : (value > max ? max : value);
};

CYIUtilities.promisify = function promisify(func) {
  if (!CYIUtilities.isFunction(func)) {
    throw new TypeError("Cannot promisify non-function arguments!");
  }

  if (typeof Promise === "undefined" || !CYIUtilities.isFunction(Promise)) {
    throw new Error("No promise implementation found! A polyfill may be required.");
  }

  return function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return new Promise(function (resolve, reject) {
      args.push(function callback(error) {
        if (error) {
          return reject(error);
        }

        return resolve(arguments.length <= 1 ? undefined : arguments[1]);
      });
      func.call.apply(func, [this].concat(args));
    });
  };
};
