chrome.runtime.onInstalled.addListener(function() {
    console.debug("Installed.");    
});

chrome.tabs.onActivated.addListener(function(activeTabInfo) {
    if (activeTabInfo != null) {
        if (activeTabInfo.tabId != chrome.tabs.TAB_ID_NONE) {
            console.debug("tabs.onActivated - activated tab ID " + activeTabInfo.tabId);

            chrome.tabs.get(activeTabInfo.tabId, tabHandler);
        }
        else {
            console.debug("tabs.onActivated - activated a tab with ID of chrome.tabs.TAB_ID_NONE (" + chrome.tabs.TAB_ID_NONE + ")");
        }
    }
    else {
        console.debug("tabs.onActivated - active tab changed but there was no tab info attached");
    }
});

chrome.tabs.onCreated.addListener(function(tab) {
    console.debug("Created a new tab with ID " + tab.id);

    tabHandler(tab);
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, oldTab) {
    console.debug("tabs.onUpdated - updated tab ID " + tabId);

    tabHandler(oldTab, changeInfo);
});

var LastActiveTabId = -1;

var VisitedTabs = {};

var UrlsToLock = []; // TODO move this to config
var TitlesToLock = [/Preskton/i]; // TODO move this to config

function tabHandler(tab, changeInfo) {
    var tabInfo = changeInfo ? reduceChangeInfo(tab, changeInfo) : reduceTab(tab);

    var shouldLock = shouldLockTab(tabInfo, getTabLockState(tab.id));

    if (shouldLock) {
        lockTab(tab.id);
    }

    setTabVisited(tab.id);
}

function setTabVisited(tabId) {
    console.debug("Setting tab ID " + tabId + " as visited.");

    VisitedTabs[tabId] = {};
    LastActiveTabId = tabId;
}

function reduceTab(tab) {
    return {
        "id": tab.id,
        "url": tab.url || tab.pendingUrl,
        "title": tab.title
    }
}

function reduceChangeInfo(tab, changeInfo) {
    return {
        "id": tab.id,
        "url": changeInfo.url,
        "title": changeInfo.title
    }
}

function getTabLockState(tabId) {
    return VisitedTabs[tabId];
}

function shouldLockTab(tabInfo, tabLockState) {
    var shouldLock = false;
    // If we are opening this tab for the first time, don't lock it.
    if (tabLockState == null) {
        console.debug("Tab has no lock state (never been opened/loading first time) -- we shouldn't lock.");
        shouldLock = false;
    }
    else if (tabInfo.id == LastActiveTabId) {
        console.debug("We shouldn't lock this tab because it's still the active tab.");
        shouldLock = false;
    }
    else {
        if (UrlsToLock.length > 0) {

        }

        if (tabInfo.title != null) {
            for (var titleLockRegexIndex in TitlesToLock) {
                var titleLockRegex = TitlesToLock[titleLockRegexIndex];
                
                if (tabInfo.title.match(titleLockRegex) != null) {
                    console.debug("We should lock this tab because '" + tabInfo.title + "' matches " + titleLockRegex + ".");
                    shouldLock = true;
                    break;
                }
            }
        }
    }

    return shouldLock;
}

function lockTab(tabId) {
    console.debug("🔒🔒🔒🔒 Locking tab " + tabId);
}

function unlockTab(tabId) {
    console.debug("🔓🔓🔓🔓 Unlocking tab " + tabId);
}