# Cochlear Audio Test V0.1

A static Arabic RTL app for playing three bundled WAV samples, recording and downloading microphone audio, and playing audio files selected from your device. The browser keeps the selected file and current recording local. Download the recording before closing or refreshing the page if you want to keep it.

## Run locally

From the `cochlear-audio-test` folder, run this command with Python 3 and open [the local app](http://localhost:8000) in a browser.

```sh
python -m http.server 8000 --bind localhost
```

Microphone access requires **HTTPS or localhost**, a compatible browser, and microphone permission. To test with a separate phone, serve the same static files over HTTPS and open that URL on the phone. An ordinary HTTP address on your local network is insufficient for microphone access.

The app starts at 15% playback volume where browser controls are supported. Your operating system chooses the audio output. Connect any compatible Bluetooth processor or wired accessory through the device's normal settings and use the device volume controls as needed. This app is for audio testing only and does not detect, verify, or program cochlear implants.
