DCR Chrome Extension
===

This file contains DCR in the form of Chrome extension.

### Installation Guide

#### Prerequisites

DCR Chrome extension requires a CORS Unblock plugin, which you can find [here](https://chrome.google.com/webstore/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino)

Note you can use any other extension which disables CORS policy or use custom work-around.

Also note that if you choose to install the CORS Unblock, you have to explicitly enable it by clicking its icon.

#### DCR extension setup

In order to install DCR Chrome extension, you have to do the following:
1. Download this folder or the entire repository
   1. Optionally, build the newest version of *dcr.js* by running commands
      ```
      > npm ci
      > npx webpack
      ```
   2. These will overwrite the *dcr.js* file located in extension/ folder
2. Use the *extension/* folder to load unpacked extension to Chrome (process described also [here](https://webkul.com/blog/how-to-install-the-unpacked-extension-in-chrome/))
   1. Go to [chrome://extensions](chrome://extensions)
   2. Enable developer mode in the upper right corner
   3. Click on "Load unpacked" in the upper left corner, and select the extension/ folder
   4. This will install the extension and put it into the list of your installed extensions.

### User Guide

Once DCR Chrome extension is installed, it is enabled by default.
Whenever you visit a page which contains a link that points to a CSV file,
and you hover over the link, a popup will appear. After the data is downloaded
and processed, this popup will be populated by chart representations.

Using the footer buttons, you can browse through these.
Additionally, you can click on the "Open" button, which opens up a
[stand-alone webpage](https://github.com/SaNuelson/DataChartRenderer/tree/master/web), 
where more advanced information is shown about the dataset.