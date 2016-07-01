/**
 * Created by Viktar Liaskovich on 26.05.2016.
 */

var HOST_NAME = "com.yourbrowsinginsights.ext";
var ERR_NOT_FOUND = "Specified native messaging host not found.";

var port;
var historyListenerAdded = false,
    removeLsoAdded = false;

export var isEnabled = false;
export var isInstalled = false;
export var isValidSerial = false;
export var errorMessage = null;

export function getHistory(callback) {
    if (!historyListenerAdded) {
        port.onMessage.addListener(function (msg) {
            if (msg.action == 'get_history_response') {
                if (msg.error) {
                    callback(null, msg.error, msg.message);
                } else {
                    callback(msg.message.history, msg.error, null);
                }
            }
        });
        historyListenerAdded = true;
    }
    port.postMessage({action: "get_history"});
}

var numOfLsoCallbacks = [],
    firstHistoryRecordTimeCallbacks = [];

export function getNumOfLSO(callback) {
    numOfLsoCallbacks.push(callback);

    port.postMessage({action: "get_num_of_lso"});
}
export function getFirstHistoryRecordTime(callback) {
    firstHistoryRecordTimeCallbacks.push(callback);

    port.postMessage({action: "get_first_history_record_time"});
}

export function removeLSO(callback) {
    if (!removeLsoAdded) {
        port.onMessage.addListener(function (msg) {
            if (msg.action == 'remove_lso_response') {
                if (msg.error) {
                    callback(null, msg.error, msg.message);
                } else {
                    callback(msg.message.removed, msg.error, null);
                }
            }
        });
        removeLsoAdded = true;
    }

    port.postMessage({action: "remove_lso"});
}

export function checkSerial(sn, callback) {
    port.onMessage.addListener(function (msg) {
        if (msg.action == 'validate_sn_response') {
            if (msg.error) {
                callback(false);
            } else {
                callback(msg.message.isValidSerial);
            }
        }
    });

    port.postMessage({action: "validate_sn", serialNumber: sn});
}

// callback signature: function(errorMsg)
export function connectNative(callback) {
    port = chrome.runtime.connectNative(HOST_NAME);
    port.onMessage.addListener(function (msg) {
        console.log(" ---->>> Received message: " + JSON.stringify(msg));
        if (msg.action == 'ready_response') {
            isEnabled = !msg.error;
            isInstalled = true;

            if (msg.error) {
                isValidSerial = null;
                callback(msg.message);
            } else {
                isValidSerial = msg.message.isValidSerial;
                callback(null);
            }
        } else if (msg.action == 'get_num_of_lso_response') {
            while (numOfLsoCallbacks.length > 0) {
                var cb = numOfLsoCallbacks.shift();
                if (msg.error) {
                    cb(null, msg.error, msg.message);
                } else {
                    cb(msg.message.num_of_lso, msg.error, null);
                }
            }
        } else if (msg.action == 'get_first_history_record_time_response') {
            while (firstHistoryRecordTimeCallbacks.length > 0) {
                var cb = firstHistoryRecordTimeCallbacks.shift();
                if (msg.error) {
                    cb(null, msg.error, msg.message);
                } else {
                    cb(msg.message.first_history_record_time, msg.error, null);
                }
            }
        }
    });

    port.onDisconnect.addListener(function () {
        console.log(" ---->>> Failed to connect: " + chrome.runtime.lastError.message);

        isEnabled = false;
        isInstalled = chrome.runtime.lastError.message != ERR_NOT_FOUND;
        isValidSerial = null;
        errorMessage = chrome.runtime.lastError.message;

        callback(chrome.runtime.lastError.message);
    });

    port.postMessage({action: "ready", serialNumber: localStorage['serialNumber']});
}
