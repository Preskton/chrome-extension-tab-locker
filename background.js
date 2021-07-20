chrome.runtime.onInstalled.addListener(function() {
    console.debug("Installed.");    
});

chrome.tabs.onActivated.addListener(function(activeTabInfo) {
    console.debug("⚡ tabs.onActivated");

    if (activeTabInfo != null) {
        if (activeTabInfo.tabId != chrome.tabs.TAB_ID_NONE) {
            console.debug("tabs.onActivated - activated tab ID " + activeTabInfo.tabId);

            setTimeout(() => {
                chrome.tabs.get(activeTabInfo.tabId, tabHandler);
            }, 500);
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
    console.debug("⚡ tabs.onCreated");
    console.debug("Created a new tab with ID " + tab.id);

    setTimeout(() => {
        tabHandler(tab)
    }, 500);
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, oldTab) {
    console.debug("⚡ tabs.onUpdated");
    console.debug("tabs.onUpdated - updated tab ID " + tabId);

    setTimeout(() => {
        tabHandler(oldTab, changeInfo)
    }, 500);
});

chrome.browserAction.onClicked.addListener(function(tab) {
    console.debug("⚡ browserAction.onClicked");
    if (tab != null) {
        console.debug("Browser action clicked - unlocking current tab (if locked).");
        unlockTab(tab.id);
    }
});

// TODO put this in a real class

var LastActiveTabId = -1;

var VisitedTabs = {};

var UrlsToLock = []; // TODO move this to config
var TitlesToLock = [/CONFIDENTIAL/i]; // TODO move this to config

function tabHandler(tab, changeInfo) {
    var tabInfo = changeInfo ? reduceChangeInfo(tab, changeInfo) : reduceTab(tab);

    if (tabInfo === null) return;

    // blur the old tab if it needs it
    console.debug("checking if we need to blur tab " + getLastTabId());

    var lastActiveTabId = getLastTabId();
    setTabVisited(tab); // do this early

    if (lastActiveTabId !== null && lastActiveTabId !== undefined && lastActiveTabId > 0 && lastActiveTabId !== tabInfo.id) {
        console.debug("Checking if we need to lock the old tab = " + lastActiveTabId);
        
        lastActiveTab = getCachedTabById(lastActiveTabId);

        if (lastActiveTab !== null && shouldLockTab(lastActiveTab, lastActiveTab)) {
            console.debug("Locking the old tab");
            lockTab(lastActiveTab.id);
        }
    }

    // handle the new tab and blur it if we didn't before / missed it
    var shouldLock = shouldLockTab(tabInfo, getCachedTabById(tabInfo.id));

    if (shouldLock) {
        lockTab(tab.id);
    }
}

function setTabVisited(tab) {
    console.debug("Setting tab ID " + tab.id + " as visited.");

    VisitedTabs[tab.id] = tab;
    LastActiveTabId = tab.id;
}

function getCachedTabById(id) {
    return id in VisitedTabs ? VisitedTabs[id] : null;
}

function getLastTabId() {
    return LastActiveTabId;
}

function reduceTab(tab) {
    if (tab === null || tab === undefined) return null;

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

    // TODO inject our own unique css and add/remove that class instead of direct manip of doc styles
    chrome.tabs.executeScript(
        tabId, 
        {
            "code": "document.body.style.filter = 'blur(8px)'"
        },
        null
    );
}

function unlockTab(tabId) {
    console.debug("🔓🔓🔓🔓 Unlocking tab " + tabId);

    chrome.tabs.executeScript(
        tabId, 
        {
            "code": "document.body.style.filter = ''"
        },
        null
    );
}