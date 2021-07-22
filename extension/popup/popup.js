console.log("Popup up and running");

let enabled;
let toggleBtn = document.getElementById('on-off-btn');
toggleBtn.addEventListener('click', onToggleClicked);
let limitSlider = document.getElementById('limit-input');
limitSlider.addEventListener('change', onLimitChanged);

chrome.runtime.onMessage.addListener(initHandler);
function initHandler(req) {
    if (req.message === "bg-dcr-enable"){
        onEnabled(req, false);
    }
    else if (req.message === "bg-dcr-disable"){
        onDisabled(false);
    }
    chrome.runtime.onMessage.removeListener(initHandler);
}

// necessary to update btn whenever popup is opened
if (enabled) onEnabled();
else onDisabled();

function onEnabled(res) {
    console.log("ONENABLED");
    chrome.action.setIcon({path: '../icon-on.png'});
    if (res && res.limit)
        limitSlider.value = res.limit;
    toggleBtn.value = "Disable";
    enabled = true;
}

function onDisabled() {
    console.log("ONDISABLED");
    chrome.action.setIcon({path: '../icon-off.png'});
    toggleBtn.value = "Enable";
    enabled = false;
}

function onToggleClicked(e) {
    console.log(toggleBtn.value);
    if (toggleBtn.value === "Enable") {
        onEnabled();
        chrome.runtime.sendMessage({message:'cs-dcr-enable'});
    }
    else {
        onDisabled();
        chrome.runtime.sendMessage({message:'cs-dcr-disable'});
    }
}

function onLimitChanged() {
    limit = limitSlider.value;
    if(enabled)
        chrome.runtime.sendMessage({message:'cs-dcr-enable', limit:limit});
}