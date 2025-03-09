document.addEventListener("DOMContentLoaded", () => {
  // Get elements from the panel
  const refreshPageButton = document.getElementById("refresh-page");
  const currentUrlSpan = document.getElementById("current-url");
  const elementSelectorInput = document.getElementById("element-selector");
  const findElementButton = document.getElementById("find-element");
  const clickElementButton = document.getElementById("click-element");
  const hideCursorButton = document.getElementById("hide-cursor");
  const cursorStatusSpan = document.getElementById("cursor-status");

  // Track if cursor is active/positioned on an element
  let isCursorActive = false;

  // Get the current tab information
  getCurrentTab().then((tab) => {
    if (tab) {
      currentUrlSpan.textContent = tab.url;
    }
  });

  // Refresh the current page when button is clicked
  refreshPageButton.addEventListener("click", async () => {
    const tab = await getCurrentTab();
    if (tab) {
      chrome.tabs.reload(tab.id);
    }
  });

  // Move the virtual cursor when the button is clicked
  findElementButton.addEventListener("click", async () => {
    const selector = elementSelectorInput.value.trim();

    if (!selector) {
      updateCursorStatus("Please enter a valid CSS selector", "error");
      return;
    }

    moveVirtualCursor(selector);
  });

  // Click the element at the cursor position
  clickElementButton.addEventListener("click", async () => {
    if (!isCursorActive) {
      updateCursorStatus(
        "Position cursor on an element before clicking",
        "error"
      );
      return;
    }

    try {
      const tab = await getCurrentTab();
      if (!tab) {
        updateCursorStatus("No active tab found", "error");
        return;
      }

      // Check if the current page is a restricted URL
      if (
        tab.url &&
        (tab.url.startsWith("chrome://") ||
          tab.url.startsWith("chrome-extension://") ||
          tab.url.startsWith("edge://") ||
          tab.url.startsWith("about:"))
      ) {
        updateCursorStatus(
          "Cannot click elements on browser internal pages",
          "error"
        );
        return;
      }

      // Send message to content script to click the element
      chrome.tabs.sendMessage(
        tab.id,
        { action: "clickElement" },
        (response) => {
          if (chrome.runtime.lastError) {
            updateCursorStatus(
              `Error: ${chrome.runtime.lastError.message}`,
              "error"
            );
            return;
          }

          if (response && response.success) {
            updateCursorStatus(response.message, "active");
          } else if (response) {
            updateCursorStatus(response.message, "error");
          } else {
            updateCursorStatus("No response from content script", "error");
          }
        }
      );
    } catch (error) {
      updateCursorStatus(`Error: ${error.message}`, "error");
    }
  });

  // Hide the cursor (and remove boundary)
  hideCursorButton.addEventListener("click", async () => {
    try {
      const tab = await getCurrentTab();
      if (!tab) {
        return;
      }

      // Send message to content script to hide the cursor (which also removes boundary)
      chrome.tabs.sendMessage(tab.id, { action: "hideCursor" }, (response) => {
        if (chrome.runtime.lastError) {
          return;
        }

        if (response && response.success) {
          updateCursorStatus("Cursor hidden", "");
          isCursorActive = false;
        }
      });
    } catch (error) {
      // Silent fail - not critical
    }
  });

  // Also move the cursor when Enter is pressed in the input field
  elementSelectorInput.addEventListener("keypress", async (event) => {
    if (event.key === "Enter") {
      const selector = elementSelectorInput.value.trim();

      if (!selector) {
        updateCursorStatus("Please enter a valid CSS selector", "error");
        return;
      }

      moveVirtualCursor(selector);
    }
  });

  // Function to move the virtual cursor to an element (which will also create boundary)
  async function moveVirtualCursor(selector) {
    try {
      updateCursorStatus("Moving cursor...", "");

      const tab = await getCurrentTab();
      if (!tab) {
        updateCursorStatus("No active tab found", "error");
        return;
      }

      // Check if the current page is a restricted URL
      if (
        tab.url &&
        (tab.url.startsWith("chrome://") ||
          tab.url.startsWith("chrome-extension://") ||
          tab.url.startsWith("edge://") ||
          tab.url.startsWith("about:"))
      ) {
        updateCursorStatus(
          "Cannot move cursor on browser internal pages",
          "error"
        );
        return;
      }

      // Inject the content script if not already
      await injectContentScriptIfNeeded(tab.id);

      // Send message to content script to move the cursor (which will also create boundary)
      chrome.tabs.sendMessage(
        tab.id,
        { action: "moveCursor", selector: selector },
        (response) => {
          if (chrome.runtime.lastError) {
            updateCursorStatus(
              `Error: ${chrome.runtime.lastError.message}`,
              "error"
            );
            isCursorActive = false;
            return;
          }

          if (response && response.success) {
            updateCursorStatus(response.message, "active");
            isCursorActive = true;
            // Update click button state
            clickElementButton.disabled = false;
          } else if (response) {
            updateCursorStatus(response.message, "error");
            isCursorActive = false;
          } else {
            updateCursorStatus("No response from content script", "error");
            isCursorActive = false;
          }
        }
      );
    } catch (error) {
      updateCursorStatus(`Error: ${error.message}`, "error");
      isCursorActive = false;
    }
  }

  // Function to update the cursor status display
  function updateCursorStatus(text, state) {
    cursorStatusSpan.textContent = text;

    // Remove all possible state classes
    cursorStatusSpan.classList.remove("active", "error");

    // Add the specified state class if provided
    if (state) {
      cursorStatusSpan.classList.add(state);
    }
  }

  // Function to inject the content script if it hasn't been injected yet
  async function injectContentScriptIfNeeded(tabId) {
    try {
      // Try to send a simple message to check if the content script is already running
      await chrome.tabs.sendMessage(tabId, { action: "ping" });
    } catch (error) {
      // If there's an error, the content script may not be injected
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ["cursor.js"],
        });
      } catch (injectionError) {
        throw new Error(
          `Failed to inject content script: ${injectionError.message}`
        );
      }
    }
  }

  // Helper function to get the current active tab
  async function getCurrentTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
  }

  // Initial setup - disable click button until an element is selected
  clickElementButton.disabled = true;
});
