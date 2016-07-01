/**
 * Created by Viktar Liaskovich.
 */

console.log("collector.injected");

function onIdle() {
    console.log('on idle');
    chrome.runtime.sendMessage({action : "on-idle"});
}

function onActive() {
    console.log(' on active');

    chrome.runtime.sendMessage({action : "on-active"});
}

$(document).idle({
    onIdle: onIdle,
    onActive: onActive,
    idle: 5*60*1000
});