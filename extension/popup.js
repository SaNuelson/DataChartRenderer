const enabledLabel = 'dcr-enabled';
const rowLimitLabel = 'dcr-row-limit';

let enabled = localStorage.getItem(enabledLabel);
let rowLimit = localStorage.getItem(rowLimitLabel);

let toggleBtn = document.getElementById('on-off-btn');
let limitInput = document.getElementById('limit-input');

// enabled by default
if (!enabled) {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        var activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, { "message": "stop" });
    });
}

toggleBtn.addEventListener('click', function (e) {
    if (enabled) {
        toggleBtn.setAttribute('value', 'Enable');
        enabled = false;
        localStorage.removeItem(enabledLabel);
        chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
            var activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, { "message": "stop" });
        });
    }
    else {
        toggleBtn.setAttribute('value', 'Disable');
        enabled = true;
        localStorage.setItem(enabledLabel, true);
        chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
            var activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, { "message": "start" });
        });
    }
});

limitInput.addEventListener('change', function (e) {
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
        var activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, {"message": "limit", "value": limitInput.value});
       });
})