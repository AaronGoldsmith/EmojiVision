# Emoji Trainer

**Emoji Trainer** is an interactive, browser-based project demonstrating how computers can learn to classify and recognize emojis by extracting simple visual features, using JavaScript, p5.js, and TensorFlow.js.

## Features
- **Emoji Classification:** Recognizes a wide variety of emojis using a neural network trained in-browser.
- **Configurable Vision Grid:** Users can adjust how the AI 'sees' by changing the grid resolution.
- **Live Data Collection & Training:** Collect data, train a neural network, and watch loss/accuracy metrics update—all within the web UI.
- **Interactive Prediction:** Watch the model predict the emoji and compare its guess with the ground truth.
- **Educational Focus:** Visualizes features, neural network outputs, and the step-by-step ML process.

## Technologies Used
- [p5.js](https://p5js.org/): For interactive graphics, UI, and rendering.
- [TensorFlow.js](https://www.tensorflow.org/js): All neural network operations in-browser.
- **JavaScript:** UI and logic controllers.

## How It Works
1. **Set Vision Resolution:** Choose the number of rows/columns in the vision grid (simulating low-to-high resolution input).
2. **Collect Data:** The app cycles through emojis, extracting color grid features for each one.
3. **Train Model:** A small neural network is trained on the collected dataset to map features to the correct emoji.
4. **Predict:** The system tries to guess new emoji images based on what it has learned.

## Project Structure
- `index.html`: Main page and UI layout.
- `sketch.js`: p5.js sketch, controls the main interface, workflow, feature extraction, and ML logic.
- `data/emojis.js`: Contains the emoji list.
- `controllers/`: UI logic and controller code.
- `style.css`: Optional CSS tweaks.
- `tf.min.js`: TensorFlow.js for ML in JS.

## Usage
Simply open `index.html` in your browser. No installation or server needed (provided browsers support ES6 and local file JS loading).

## Screenshots
![Demo Screenshot](screenshot.png) <!-- Add a screenshot file for best results -->

## Credits
- Inspired by ML education projects and visualizations such as [Teachable Machine](https://teachablemachine.withgoogle.com/).

## License
MIT License (include actual license file for open source works)

---

*Happy Learning!*
