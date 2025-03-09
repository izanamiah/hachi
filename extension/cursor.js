// Create the virtual cursor element if it doesn't exist
function createCursor() {
  let cursor = document.getElementById("virtual-cursor-extension");

  if (!cursor) {
    cursor = document.createElement("div");
    cursor.id = "virtual-cursor-extension";
    cursor.style.position = "fixed"; // Fixed position relative to viewport
    cursor.style.width = "20px";
    cursor.style.height = "20px";
    cursor.style.borderRadius = "50%";
    cursor.style.backgroundColor = "rgba(46, 204, 113, 0.5)";
    cursor.style.border = "2px solid #2ecc71";
    cursor.style.zIndex = "9999";
    cursor.style.pointerEvents = "none"; // So it doesn't interfere with clicks
    cursor.style.transition = "transform 0.3s ease";
    cursor.style.display = "none";

    document.body.appendChild(cursor);
  }

  return cursor;
}

// Function to create a green boundary line around the browser window
function createBoundaryOverlay() {
  // Check if boundary already exists
  let boundary = document.getElementById("extension-boundary-overlay");

  if (!boundary) {
    // Create the boundary overlay
    boundary = document.createElement("div");
    boundary.id = "extension-boundary-overlay";

    // Set styles for the boundary
    boundary.style.position = "fixed";
    boundary.style.top = "0";
    boundary.style.left = "0";
    boundary.style.width = "100%";
    boundary.style.height = "100%";
    boundary.style.border = "6px solid #2ecc71"; // 6px border width
    boundary.style.boxSizing = "border-box";
    boundary.style.pointerEvents = "none"; // Prevent interference with page interaction
    boundary.style.zIndex = "9998"; // Below cursor but above most elements

    // Add a pulse animation
    boundary.style.animation = "extension-boundary-pulse 2s infinite";

    // Create and append style for the pulse animation
    const style = document.createElement("style");
    style.id = "extension-boundary-style";
    style.textContent = `
      @keyframes extension-boundary-pulse {
        0% { border-color: rgba(46, 204, 113, 0.8); }
        50% { border-color: rgba(46, 204, 113, 0.4); }
        100% { border-color: rgba(46, 204, 113, 0.8); }
      }
    `;
    document.head.appendChild(style);

    // Add the boundary to the page
    document.body.appendChild(boundary);

    return { success: true, message: "Boundary overlay created" };
  }

  // If boundary exists but is hidden, show it
  if (boundary.style.display === "none") {
    boundary.style.display = "block";
  }

  return { success: true, message: "Boundary overlay already exists" };
}

// Function to remove the boundary overlay
function removeBoundaryOverlay() {
  const boundary = document.getElementById("extension-boundary-overlay");
  const style = document.getElementById("extension-boundary-style");

  if (boundary) {
    boundary.remove();
  }

  if (style) {
    style.remove();
  }

  return { success: true, message: "Boundary overlay removed" };
}

// Global variables for tracking
let targetElement = null;
let cursorElement = null;
let trackerInterval = null;
let intersectionObserver = null;
let visibilityState = true;

// Function to move the cursor to a specific element
function moveCursorToElement(selector) {
  try {
    // Clear any existing tracking
    clearTracking();

    // Try to find the element using the selector
    const element = document.querySelector(selector);

    if (!element) {
      return { success: false, message: `Element "${selector}" not found` };
    }

    // Create boundary overlay
    createBoundaryOverlay();

    // Get/create cursor
    const cursor = createCursor();

    // Store references
    targetElement = element;
    cursorElement = cursor;

    // Initial positioning
    updateCursorPosition();

    // Apply highlight effect
    cursor.style.transform = "scale(1.2)";
    setTimeout(() => {
      cursor.style.transform = "scale(1)";
    }, 300);

    // Start tracking
    startTracking();

    // Scroll element into view
    element.scrollIntoView({ behavior: "smooth", block: "center" });

    return { success: true, message: `Cursor moved to ${selector}` };
  } catch (error) {
    console.error("Error moving cursor:", error);
    return { success: false, message: `Error: ${error.message}` };
  }
}

// Function to start tracking the element
function startTracking() {
  // Create an IntersectionObserver to monitor when the element is visible
  intersectionObserver = new IntersectionObserver(
    (entries) => {
      visibilityState = entries[0].isIntersecting;
      updateCursorVisibility();
    },
    { threshold: 0.1 }
  );

  if (targetElement) {
    intersectionObserver.observe(targetElement);
  }

  // Set up interval for continuous position updates
  trackerInterval = setInterval(updateCursorPosition, 100);

  // Add scroll and resize listeners for immediate updates
  window.addEventListener("scroll", updateCursorPosition, { passive: true });
  window.addEventListener("resize", updateCursorPosition, { passive: true });

  // Handle page visibility changes
  document.addEventListener("visibilitychange", handleVisibilityChange);
}

// Function to handle visibility changes
function handleVisibilityChange() {
  if (document.visibilityState === "visible") {
    // Page is visible again, update the cursor position
    updateCursorPosition();
  }
}

// Function to update the cursor position
function updateCursorPosition() {
  if (!targetElement || !cursorElement) return;

  try {
    // Get the current element position
    const rect = targetElement.getBoundingClientRect();

    // Only update when in viewport
    if (rect.width > 0 && rect.height > 0) {
      // Calculate cursor position (center of element)
      const centerX =
        rect.left + rect.width / 2 - cursorElement.offsetWidth / 2;
      const centerY =
        rect.top + rect.height / 2 - cursorElement.offsetHeight / 2;

      // Update cursor position
      cursorElement.style.left = `${centerX}px`;
      cursorElement.style.top = `${centerY}px`;

      // Ensure cursor is visible
      updateCursorVisibility();
    }
  } catch (error) {
    console.error("Error updating cursor position:", error);
  }
}

// Update cursor visibility based on element visibility
function updateCursorVisibility() {
  if (!cursorElement) return;

  // Only show cursor when element is visible
  if (visibilityState) {
    cursorElement.style.display = "block";
  } else {
    cursorElement.style.display = "none";
  }
}

// Function to clear all tracking
function clearTracking() {
  // Clear interval
  if (trackerInterval) {
    clearInterval(trackerInterval);
    trackerInterval = null;
  }

  // Remove event listeners
  window.removeEventListener("scroll", updateCursorPosition);
  window.removeEventListener("resize", updateCursorPosition);
  document.removeEventListener("visibilitychange", handleVisibilityChange);

  // Disconnect observer
  if (intersectionObserver) {
    intersectionObserver.disconnect();
    intersectionObserver = null;
  }
}

// Function to click on the element where the cursor is positioned
function clickElement() {
  try {
    if (!targetElement) {
      return { success: false, message: "No element selected to click" };
    }

    // Visual feedback for click
    if (cursorElement) {
      // Create a pulse effect
      cursorElement.style.transform = "scale(0.8)";
      cursorElement.style.backgroundColor = "rgba(231, 76, 60, 0.5)"; // Red flash
      cursorElement.style.borderColor = "#e74c3c";

      setTimeout(() => {
        cursorElement.style.transform = "scale(1)";
        cursorElement.style.backgroundColor = "rgba(46, 204, 113, 0.5)"; // Back to green
        cursorElement.style.borderColor = "#2ecc71";
      }, 200);
    }

    // Create and dispatch click event
    const rect = targetElement.getBoundingClientRect();
    const clickEvent = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    });

    // Try to click the element
    const clicked = targetElement.dispatchEvent(clickEvent);

    if (clicked) {
      return {
        success: true,
        message: `Clicked on element: ${targetElement.tagName.toLowerCase()}${
          targetElement.id ? "#" + targetElement.id : ""
        }`,
      };
    } else {
      return { success: false, message: "Click was cancelled" };
    }
  } catch (error) {
    console.error("Error clicking element:", error);
    return {
      success: false,
      message: `Error clicking element: ${error.message}`,
    };
  }
}

// Function to hide the cursor
function hideCursor() {
  try {
    // Hide cursor
    if (cursorElement) {
      cursorElement.style.display = "none";
    }

    // Remove boundary
    removeBoundaryOverlay();

    // Clear tracking
    clearTracking();

    // Reset global variables
    targetElement = null;

    return { success: true, message: "Cursor hidden" };
  } catch (error) {
    console.error("Error hiding cursor:", error);
    return { success: false, message: `Error hiding cursor: ${error.message}` };
  }
}

// Function to perform complete cleanup (remove cursor and boundary)
function cleanupAll() {
  try {
    // First hide the cursor (which clears tracking)
    hideCursor();

    // Remove the cursor element completely
    const cursor = document.getElementById("virtual-cursor-extension");
    if (cursor) {
      cursor.remove();
    }

    // Reset references
    cursorElement = null;
    targetElement = null;

    return { success: true, message: "All extension elements cleaned up" };
  } catch (error) {
    console.error("Error during cleanup:", error);
    return {
      success: false,
      message: `Error during cleanup: ${error.message}`,
    };
  }
}

// Listen for messages from the panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "ping") {
    sendResponse({ success: true });
    return true;
  }

  if (message.action === "moveCursor") {
    const result = moveCursorToElement(message.selector);
    sendResponse(result);
    return true; // Required for async response
  }

  if (message.action === "clickElement") {
    const result = clickElement();
    sendResponse(result);
    return true;
  }

  if (message.action === "hideCursor") {
    const result = hideCursor();
    sendResponse(result);
    return true;
  }

  if (message.action === "cleanupAll") {
    const result = cleanupAll();
    sendResponse(result);
    return true;
  }
});
