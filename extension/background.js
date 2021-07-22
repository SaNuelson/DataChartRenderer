chrome.runtime.onStartup.addListener(initPlugin);
chrome.runtime.onInstalled.addListener(initPlugin);
chrome.tabs.onActivated.addListener(recheckPlugin);
let enabled = true;

function onClick() {
    if (enabled) {
        disable();
    }
    else {
        enable();
    }
}

function initPlugin() {
    chrome.storage.local.get('dcr-enabled', function(res) {
        enabled = res;
        chrome.action.onClicked.addListener(onClick);
        chrome.runtime.onSuspend.addListener(cleanupPlugin);
    });
}

function cleanupPlugin() {
    chrome.storage.local.set({'dcr-enabled': enabled});
}

function recheckPlugin() {
    if (enabled)
        enable();
    else
        disable();
}

function enable() {
    console.log("bg enable");
    enabled = true;
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {message: 'dcr-enable'});  
    });
    chrome.action.setIcon({path: 'icon-on.png'});
    chrome.action.setTitle({title: 'DataChartRenderer - enabled'});
}

function disable() {
    console.log("bg disable");
    enabled = false;
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {message: 'dcr-disable'});  
    });
    chrome.action.setIcon({path: 'icon-off.png'});
    chrome.action.setTitle({title: 'DataChartRenderer - disabled'});
}