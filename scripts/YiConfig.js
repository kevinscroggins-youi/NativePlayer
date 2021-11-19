/**
 * @file YiConfig.js
 * @brief Overridable Tizen application configuration parameters.
 */

"use strict";

function CYIConfig() { }

// CYILogger configuration parameters
CYIConfig.enableLogger = CYIDebug.isDebugBuild; // determines if the on-screen JavaScript console logs area should appear on startup

CYIConfig.destroyLogsOnNaClLoad = true; // determines if the on-screen logs area should be cleaned up after the NaCl module loads

CYIConfig.maxLoggerHistory = Infinity; // restricts the maximum number of lines logged in the on-screen logs area

CYIConfig.defaultLoggerHeight = "18vh"; // sets the default height of the logs area

CYIConfig.errorLoggerHeight = "50vh"; // the height to adjust the logs area to when the error overlay is displayed

CYIConfig.loggerZIndex = "600";

// CYIApplication configruation parameters
CYIConfig.enableNaClLoadProgressBar = CYIDebug.isDebugBuild; // determines if the NaCl module loading progress bar should be displayed

CYIConfig.progressBarRectangle = Object.freeze({ // the position and dimensions of the NaCl module loading progress bar
    x: "0",
    y: "0",
    width: "100vw",
    height: "2vh"
});

CYIConfig.remoteControlButtonNames = Object.freeze([ // a list of Tizen remote control buttons to register event listeners for
    "MediaPlayPause",
    "MediaRewind",
    "MediaFastForward",
    "MediaPlay",
    "MediaPause",
    "MediaStop",
    "MediaRecord",
    "Info",
    "ColorF0Red",
    "ColorF1Green",
    "ColorF2Yellow",
    "ColorF3Blue",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9"
]);

CYIConfig.naclModulePlaceholderElementZIndex = "300";

// CYIReactNativeExecutor configuration parameters
CYIConfig.enableReactNativeIframe = true; // runs the React Native executor in a separate iframe so that it doesn't conflict with other code such as AVPlay and MSE/EME video players

// CYISubtitleStyleManager configuration parameters
CYIConfig.verboseSubtitleStyleManager = CYIDebug.isDebugBuild; // configures verbose debugging logs for the subtitle style manager

// CYIErrorOverlay configuration parameters
CYIConfig.defaultErrorOverlayCrashTitle = "Application Crashed"; // the default title to display on the error overlay when the NaCl module crashes

CYIConfig.defaultErrorOverlayErrorTitle = "Application Error"; // the default title to display on the error overlay when there is a NaCl module error

CYIConfig.defaultErrorOverlayUnknownErrorMessage = "Unknown error."; // the default message to display when there is no error message provided to the error overlay

CYIConfig.defaultExitButtonText = "Exit"; // the default text to display in the exit button on the errror overlay

CYIConfig.errorOverlayZIndex = "400";

// CYIVideoPlayer configuration parameters
CYIConfig.avPlayZIndex = "0";

// CYISplashScreen configuration parameters
CYIConfig.splashScreenZIndex = "200";

// CYIProgressBar configuration parameters
CYIConfig.progressBarZIndex = "500";
