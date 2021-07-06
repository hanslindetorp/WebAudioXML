# Multi Client Node.js DEMO for WebAudioXML

This DEMO shows how multiple smartphone web-clients can be setup to send Device Orientation Data and up to five independent touches via a node.js https-server. The server uses socket.io to pass the data to a master web-page that plays audio using WebAudioXML and iMusicXML.
THere are a few steps to follow in order to run the project:

### The MASTER (computer)

1. Download the directory from https://github.com/hanslindetorp/WebAudioXML/new/master/demos/Multi-Client-NodeJS
2. Make sure you have installed https://nodejs.org/
3. Start the node.js-server using the terminal: 

```console
$ cd /path/to/Multi-Client-NodeJS
$ node https-server.js
````

4. For chrome: Allow https for local servers by navigating to chrome://flags/#allow-insecure-localhost
5. Navigate to https://127.0.0.1:8000
6. Accept invalid, non-secure pages if needed
7. Click "Master"
8. Click "Start" to init WebAudio


### The Clients

1. Make sure, you're on the same network as your MASTER computer.
2. Navigate to the adress found in the Terminal window (e.g. https://192.168.68.119:8000)
3. Click "Client"
4. Choose Client ID (0-4) - They are connected to control different sounds
5. Init the sensors

Read the info on the MASTER to see how different gestures for different client IDs are controlling different aspects of the sound.

## Make your own content
There are many ways to change the content completely. 
- Loops can be added in the imusic.xml-file using the https://github.com/hanslindetorp/iMusicXML syntax
- Synthesisers can be constructed in the mixer.xml-file using the https://github.com/hanslindetorp/WebAudioXML syntax
- Mixer routings can be setup and audio parameters can be mapped to sensor data from the clients in the mixer.xml-file as well
- The GUI for the clients can be modified with different colors, rows and columns from the clients.js-file (at the top)



