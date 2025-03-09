// Set up the side panel when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  // Set the default panel configuration
  chrome.sidePanel.setOptions({
    path: "panel.html",
    enabled: true,
  });
});

// Listen for when the extension action is clicked
chrome.action.onClicked.addListener(async (tab) => {
  // Open the side panel
  await chrome.sidePanel.open({ tabId: tab.id });
});
