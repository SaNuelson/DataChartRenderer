console.log("Background service worker up and running.");
console.log(chrome);
chrome.runtime.onStartup.addListener(initPlugin);
chrome.runtime.onInstalled.addListener(initPlugin);
chrome.runtime.onSuspend.addListener(cleanupPlugin);
chrome.tabs.onUpdated.addListener(recheckPlugin);
chrome.runtime.onMessage.addListener(function(req){
	if (req.message === "cs-dcr-enable") {
		if (!enabled)
            enablePlugin();
        if(req.limit)
            rowLimit = req.limit;
	}
	else if (req.message === "cs-dcr-disable") {
        if (enabled)
    		disablePlugin();
	}
});

let enabled = false;
let rowLimit = 5000;

// On start/install... make init steps.
function initPlugin() {
	chrome.storage.local.get('dcr-enabled', function (res) {
		enabled = res;
		if (enabled) enablePlugin();
		else disablePlugin();
	});
	chrome.storage.local.get('dcr-limit', function (res) {
		if (res) {
			rowLimit = res;
			if (enabled)
				enablePlugin();
		}
	});
}

// On quit/suspend... save config and clean up.
function cleanupPlugin() {
	chrome.storage.local.set('dcr-enabled', enabled);
	chrome.storage.local.set('dcr-limit', rowLimit);
}

// Send disabling message
function disablePlugin() {
	console.log("BG disablePlugin");
	enabled = false;
	chrome.runtime.sendMessage({message: "bg-dcr-disable"});
}

// Send enabling message
function enablePlugin() {
	console.log("BG enablePlugin");
	enabled = true;
	chrome.runtime.sendMessage({message:"bg-dcr-enable", limit: rowLimit });
}

// On tab switch, resend the state info
function recheckPlugin() {
    console.log("RECHEKC");
	if (enabled) enablePlugin();
	else disablePlugin();
}