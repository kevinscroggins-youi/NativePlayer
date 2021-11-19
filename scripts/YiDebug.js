/**
 * @file YiDebug.js
 * @brief The javascript namespace for debugging-related utilities and information.
 */

function CYIDebug() { }

CYIDebug.buildType = "Debug";

CYIDebug.isDebugBuild = CYIDebug.buildType.toLowerCase() === "debug";
