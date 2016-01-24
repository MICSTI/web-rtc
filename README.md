# Browser based remote support application using WebRTC
If you don't know too much about WebRTC, [this is a fantastic tutorial](http://www.html5rocks.com/en/tutorials/webrtc/basics/) to get started.

# Features
- use P2P (peer-to-peer) connections to chat with others via audio and/or video chat or text messages
- securely encrypted data transfer for all communication parts
- assist peers in solving difficult problems and tasks with overlay drawing indicators
- switch between chat and support mode
- pause video streams to take closer look at issues
- management server built on lightweight, completely extendable node.js application
- 100% open source

# Setup
- after checkout, server can be started in the folder */server* with the command `node index.js`. Afterwards, the application can be accessed over **https://127.0.0.1:1337**, in case the default settings are not changed. Please note the "https" in front of the URL, without which the application will not work in Google Chrome.
- all settings for the server application can be changed in */server/config.js* (see more details below)
- it is recommended to use Google Chrome or Mozilla Firefox for the application.

# Dependencies
The node.js application's only dependency is the **websocket** package, which is automatically included in the */node_modules* folder for convenience.

For the web page itself, [jQuery](http://jquery.com/) is used as well as [adapter.js](https://github.com/webrtc/adapter/blob/master/adapter.js), which takes care of browser prefixes regarding the WebRTC API and is maintained by some folks at Google. Both are included in the repository.

# Application structure
The whole application is located in the */server* folder.

In the file **config.js** it is possible to configure the application to one's needs:
* in the *server* object, the ip address and port for the node.js app can be set
* in the *userMedia* object, it can be configured whether audio, video or both should be requested by navigator.getUserMedia
* in the *peerConnection* object, the settings for ICE servers can be configured
* in the *frontend* object, all DOM element ids are configured for the web page. So you could technically change the whole frontend page while the logic of the page still remains fully functional.
* in the *logging* object, logging can be enabled or disabled.

The file **[main_controller.js](https://github.com/MICSTI/web-rtc/blob/master/server/controller/main_controller.js)** creates the HTTPS server and also attaches a WebSocket server to it. It is responsible for serving all static files to the clients (all JavaScript and CSS files). A WebSocket connection is opened to each client who has accepted the navigator.getUserMedia request and entered a username.

The file **[routes_controller.js](https://github.com/MICSTI/web-rtc/blob/master/server/controller/routes_controller.js)** is responsible for parsing the ReST-ful URL request and delegating the response correctly.

All parts of the frontend web application are located in the */view/public* folder.
* in **[client.html](https://github.com/MICSTI/web-rtc/blob/master/server/view/public/client.html)** the HTML source of the web page is provided
* the file **[scripts.js](https://github.com/MICSTI/web-rtc/blob/master/server/view/public/js/scripts.js)** is the main controller for all page interaction
* in **[user-media.js](https://github.com/MICSTI/web-rtc/blob/master/server/view/public/js/user-media.js)** the access to the device's camera and microphone are managed
* **[web-rtc.js](https://github.com/MICSTI/web-rtc/blob/master/server/view/public/js/web-rtc.js)** provides wrapper methods for the WebRTC API, some of which are implemented in *scripts.js*.

# Possible improvements
- **Screenshots** the ability to save and maybe send screenshots to someone else over the application would be really useful and not tremendously difficult to implement.
- **User authentication** for now, there is no user authentication implemented, anyone visiting the URL can access the application.
- **E-mail invitations** users could provide an e-mail address, over which other user could invite them to chat sessions. Right now, only active users on the web page can be called.
- **Cross-platform application** the application only works in web browsers for now, which could be inconvenient on some mobile devices. A cross-platform app with a framework like [Apache Cordova](https://cordova.apache.org/) or [PhoneGap](http://phonegap.com/) would most likely extend the usability on mobile devices significantly.
- **Multi-user sessions** while there can theoretically be an infinite number of parallel chat sessions, only two users can be part of one chat session. A Multipoint Control Unit, e.g. the open source plugin [Janus](https://github.com/meetecho/janus-gateway), would eradicate this problem.
