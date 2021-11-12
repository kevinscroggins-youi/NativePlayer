/*!
 * common.js (https://github.com/SamsungDForum/NativePlayer)
 * Copyright 2016, Samsung Electronics Co., Ltd
 * Licensed under the MIT license
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @file common.js
 * @brief Common NaCl application page configuration.
 */

var LogLevelEnum = {
  kNone : 0,
  kError : 1,
  kInfo : 2,
  kDebug : 3,
}

var logs;
var logs_level = LogLevelEnum.kError;
var uses_logging = false;

var nacl_elem = null;

var kInfoPrefix = "INFO:";
var kErrorPrefix = "ERROR:";
var kDebugPrefix = "DEBUG:";

function updateStatus(message) {
  document.getElementById("status").innerHTML = message;
}

/**
 * Return true when |s| starts with the string |prefix|.
 *
 * @param {string} s The string to search.
 * @param {string} prefix The prefix to search for in |s|.
 */
function startsWith(s, prefix) {
  return s.indexOf(prefix) === 0;
}

/**
 * Print message in the logs area if it has a specific prefix (defined in
 * kInfoPrefix or kErrorPrefix).
 * @param message - a string message
 * @returns true - if this message was a log or error message.
 */
function printIfLog(message) {
  if(typeof CYIRemoteLogger !== undefined) {
    if(CYIUtilities.isNonEmptyString(message)) {
      if(message.indexOf(kDebugPrefix) === 0) {
        console.log(message);
        return true;
      }
      else if(message.indexOf(kInfoPrefix) === 0) {
        console.info(message);
        return true;
      }
      else if(message.indexOf(kErrorPrefix) === 0) {
        console.error(message);
        return true;
      }
    }

    return false;
  }

  if ((typeof message == "string") && (uses_logging == true) &&
          (startsWith(message, kInfoPrefix) || startsWith(message, kErrorPrefix)
           || startsWith(message, kDebugPrefix))) {
    console.log(message);
    if (startsWith(message, kErrorPrefix))
      logs.innerHTML += '<font color="red">' + message + '</font>';
    else if (startsWith(message, kDebugPrefix))
      logs.innerHTML += '<font color="grey">' + message + '</font>';
    else
      logs.innerHTML += message;
    logs.innerHTML += '<br>'
    return true;
  }
  return false;
}

function handleNaclAbort(event) {
  console.error("NaCl module loading aborted.");
}

function handleNaclError(event) {
  console.error(nacl_elem.lastError);
}

function handleNaclCrash(event) {
  var nacl_module = document.getElementById("nacl_module");
  console.error("Crashed/exited with status: " + nacl_module.exitStatus);
  updateStatus("Crashed/exited with status: " + nacl_module.exitStatus);
}

function handleNaclLoadStart(event) {
  console.log("NaCl module load started.");
}

function handleNaclLoadProgress(event) {
  if(event.lengthComputable && event.total > 0) {
    console.log("NaCl module load " + ((event.loaded / event.total) * 100).toFixed(0) + "% complete (" + event.loaded + " / " + event.total + " bytes).");
  }
}

function handleNaclLoad(event) {
  console.log("NaCl module loaded successfully.");
  updateStatus("Loaded successfully.");
  updateLogLevel(LogLevelEnum.kError);
  if (typeof(exampleSpecificActionAfterNaclLoad) == "function") {
    exampleSpecificActionAfterNaclLoad();
  }
}

/**
 * Creates a NaCl module with params from example.js and attach listeners.
 *
 * @param nmf_path_name - complete manifest file path with name
 * @param width - of a NaCl module"s view in pixels
 * @param height - of a NaCl module"s view in pixels
 */
function createNaclModule(nmf_path_name, width, height) {
  console.log("Creating NaCl module...");

  nacl_elem = document.createElement("embed");
  nacl_elem.setAttribute("name", "nacl_module");
  nacl_elem.setAttribute("id", "nacl_module");
  nacl_elem.setAttribute("type", "application/x-nacl");
  nacl_elem.setAttribute("src", nmf_path_name);
  nacl_elem.setAttribute("width", width);
  nacl_elem.setAttribute("height", height);
  nacl_elem.setAttribute("logs", logs_level);

  var listenerDiv = document.getElementById("listener");
  listenerDiv.appendChild(nacl_elem);

  // attach common listeners
  listenerDiv.addEventListener("message", handleNaclMessage, true);
  listenerDiv.addEventListener("abort", handleNaclAbort, true);
  listenerDiv.addEventListener("error", handleNaclError, true);
  listenerDiv.addEventListener("crash", handleNaclCrash, true);
  listenerDiv.addEventListener("loadstart", handleNaclLoadStart, true);
  listenerDiv.addEventListener("progress", handleNaclLoadProgress, true);
  listenerDiv.addEventListener("load", handleNaclLoad, true);
}

/**
 * Configure this page with example specific elements when document finishes
 * loading.
 */
document.addEventListener("DOMContentLoaded", function(event) {

  document.getElementById("page_title").innerHTML = demo_name;
  document.getElementById("demo_header").innerHTML += demo_name;
  document.getElementById("description").innerHTML = demo_description;
  logs = document.getElementById("logs");
  if (uses_logging == false) {
    document.getElementById("logs_area").style.display = "none";
  }

  createNaclModule(nmf_path_name, nacl_width, nacl_height);
  updateStatus("Loading...");
});
