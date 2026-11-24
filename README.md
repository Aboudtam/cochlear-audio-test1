# Cochlear Audio Test V0.1

A static Arabic RTL app with 32 Arabic MP3 samples in collapsible sections: مقاطع الحروف (12 syllables), الكلمات (12 words), and الجمل (8 sentences), plus a separate section for the original three WAV test sounds. It also records and downloads microphone audio and plays files selected from your device. The browser keeps the selected file and current recording local. Download the recording before closing or refreshing the page if you want to keep it.

All sources share one player with play/pause, stop, seeking, independent volume, and playback speeds of 0.5x, 0.75x, 1x (default), 1.25x, and 1.5x. Speed changes apply immediately and carry over to the next sound, including uploads and recordings; reset returns to 1x. Pitch is preserved where supported. Speed changes do not alter audio files or downloaded recordings.

The Arabic library is explicitly registered in `app.js`, with relative paths and no directory-listing API. Keep the `sounds/` folder alongside `index.html` when using localhost, VS Code Live Server, or GitHub Pages. No build step or dependencies are required.

## Run locally

From the `cochlear-audio-test` folder, run this command with Python 3 and open [the local app](http://localhost:8000) in a browser.

```sh
python -m http.server 8000 --bind localhost
```

Microphone access requires **HTTPS or localhost**, a compatible browser, and microphone permission. To test with a separate phone, serve the same static files over HTTPS and open that URL on the phone. An ordinary HTTP address on your local network is insufficient for microphone access.

The app starts at 15% playback volume where browser controls are supported. Your operating system chooses the audio output. Connect any compatible Bluetooth processor or wired accessory through the device's normal settings and use the device volume controls as needed. This app is for audio testing only and does not detect, verify, or program cochlear implants.
