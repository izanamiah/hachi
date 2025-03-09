# Virtual Cursor Side Panel - Chrome Extension

A Chrome extension that opens a side panel with a virtual cursor that can move to and click on specified HTML elements.

## Features

- Opens a side panel with the current page URL
- Provides a virtual cursor that can highlight HTML elements on the page
- Cursor stays anchored to elements even when scrolling the page
- Shows a green boundary overlay around the browser window when cursor is active
- Allows clicking on elements through the virtual cursor
- Enter any CSS selector to move the cursor to matching elements
- Provides a button to refresh the current page

## Installation

1. Download or clone this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right corner
4. Click "Load unpacked" and select the directory containing these extension files
5. The extension should now appear in your Chrome toolbar

## Usage

1. Click the extension icon in the Chrome toolbar to open the side panel
2. Enter a CSS selector in the input field (e.g., `#header`, `.nav-item`, `button`)
3. Click "Move Cursor" or press Enter to move the virtual cursor to the element
4. The cursor will appear as a green circle on the matching element, and a green border will surround the browser window
5. The cursor stays attached to the element even when scrolling the page
6. Click the "Click Element" button to trigger a click on the targeted element
7. Use the "Hide Cursor" button to remove the cursor and border overlay
8. Use the refresh button to reload the current page if needed

## CSS Selector Examples

- `#header` - Element with ID "header"
- `.btn-primary` - Elements with class "btn-primary"
- `button` - All button elements
- `div.container` - All div elements with class "container"
- `ul li:first-child` - First list item in unordered lists

## How It Works

The extension creates a virtual cursor (a green circle) that can:

1. Move to and highlight HTML elements based on CSS selectors
2. Remain anchored to the selected element even during page scrolling
3. Click on the highlighted element to interact with it
4. Provide visual feedback when clicking (a brief red flash)

When the cursor is active, a subtle green border appears around the entire browser window, making it easy to see that the extension is in an active state.

The virtual cursor does not interfere with the page's normal functionality and can be used to interact with elements that may be otherwise difficult to target.

## Files

- `manifest.json` - Extension configuration and permissions
- `background.js` - Controls side panel opening
- `panel.html` - Side panel HTML structure
- `panel.css` - Side panel styling
- `panel.js` - Side panel functionality
- `cursor.js` - Content script for creating and moving the virtual cursor and boundary overlay
- `icon.png` - Extension icon

## License

MIT License
