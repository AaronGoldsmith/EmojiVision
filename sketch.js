// ========================================
// Emoji + Feature-Viz Side-by-Side (TF.js)
// ========================================

// --- Global Variables ---
let rows = 9, cols = 9; // Default values
const panelSize = 380;
let cellW, cellH;

let lossHistory = [];
let accHistory = [];

let results = [];
let idx = 0; // Current index for cycling emojis
let state = "initial"; // initial → collect → train → predict

let model;

// UI Elements
let inputRows, inputCols;
let startButton, resetButton;
let checkboxGrid;
let statusDisplay;
let trainingProgressDisplay;
let frameRateSlider;

// Prediction phase UI
let checkboxAutoRunPredictions;
let prevButton, nextButton;

const emojiListSize = 10;


// --- p5.js Setup Function ---
function setup() {
  createCanvas(panelSize * 2 + 200, panelSize + 130); // Increased height for prediction controls
  textAlign(CENTER, CENTER);
  textSize(panelSize * 0.8);

  // --- UI Element Creation ---
  let uiX = panelSize * 2 + 30;
  let uiY = 20;

  createP('Height (pixels)').position(uiX, uiY).style('margin-bottom', '2px');
  inputRows = createInput(str(rows), 'number');
  inputRows.position(uiX, uiY + 35).size(60);

  createP('Width (pixels)').position(uiX, uiY + 70).style('margin-bottom', '2px');
  inputCols = createInput(str(cols), 'number');
  inputCols.position(uiX, uiY + 105).size(60);

  startButton = createButton('Start Collection');
  startButton.position(uiX, uiY + 150).mousePressed(initializeAndStartCollection);
  resetButton = createButton('Reset');
  resetButton.position(uiX, uiY + 185).mousePressed(resetSketch);
  resetButton.attribute('disabled', true);

  checkboxGrid = createCheckbox('Show Grid Overlay', true);
  checkboxGrid.position(uiX, uiY + 230);

  createP('Animation Speed:').position(uiX, uiY + 280).style('margin-bottom', '2px');
  frameRateSlider = createSlider(1, 30, 5, 1);
  frameRateSlider.position(uiX, uiY + 305).style('width', '120px');

  // Status displays below the panels
  let statusAreaY = panelSize + 55;

  statusDisplay = createP('');
  statusDisplay.position(width/2-200, statusAreaY).style('font-size', '16px');

  trainingProgressDisplay = createP('');
  trainingProgressDisplay.position(width/2 - 200, statusAreaY + 20).style('font-size', '14px').style('font-family', 'monospace');
  trainingProgressDisplay.hide();

  // --- Prediction Controls UI (initially hidden or disabled) ---
  let predCtrlY = panelSize + 115; // Position for prediction controls
  checkboxAutoRunPredictions = createCheckbox('Auto-run Predictions', true);
  checkboxAutoRunPredictions.position(uiX, uiY + 260);
  checkboxAutoRunPredictions.changed(togglePredictionMode);


  initializeParameters();
  updateFrameRate();
}



function initializeParameters() {
  let r = parseInt(inputRows.value());
  let c = parseInt(inputCols.value());

  if (isNaN(r) || r <= 0) r = 9;
  if (isNaN(c) || c <= 0) c = 9;

  rows = r;
  cols = c;
  inputRows.value(rows);
  inputCols.value(cols);

  cellW = panelSize / cols;
  cellH = panelSize / rows;

  results = [];
  idx = 0;
  if (model) {
    tf.dispose(model);
    model = undefined;
  }
  console.log(`Initialized with ${rows} rows, ${cols} cols.`);
}

function initializeAndStartCollection() {
  initializeParameters();
  state = "collect";
  startButton.attribute('disabled', true);
  resetButton.removeAttribute('disabled');
  inputRows.attribute('disabled', true);
  inputCols.attribute('disabled', true);
  trainingProgressDisplay.hide();
  statusDisplay.html('Status: Collecting Data...');
  updateFrameRate();
}

function resetSketch() {
  state = "initial";
  startButton.removeAttribute('disabled');
  resetButton.attribute('disabled', true);
  inputRows.removeAttribute('disabled');
  inputCols.removeAttribute('disabled');
  statusDisplay.html('Status: Initial. Configure and start.');
  trainingProgressDisplay.hide().html('');
  results = [];
  idx = 0;
  clear();
  background(255);
  drawInitialUI();
  if (model) {
    tf.dispose(model);
    model = undefined;
  }
  console.log("Sketch Reset");
}

function updateFrameRate() {
  let fr = frameRateSlider.value();
  frameRate(fr);
}

function drawInitialUI() {
  push();
  background(255);
  fill(50);
  textSize(22);
  textAlign(CENTER, CENTER);
  text("Configure the resolution of the model's vision", (panelSize * 2) / 2, panelSize / 2);
    text("then press 'Start Collection' 👉", (panelSize * 2) / 2, panelSize / 2 + 40);

  textSize(16);
  fill(100);
  textStyle(NORMAL);
  text("Emoji Panel", panelSize / 2, 20);
  text("Feature Visualization", panelSize + panelSize / 2, 20);
  pop();
}


function togglePredictionMode() {
    if (state === "predict" && !checkboxAutoRunPredictions.checked()) {
    }
}

function navigatePrediction(direction) {
    if (state === "predict" && !checkboxAutoRunPredictions.checked()) {
        idx = (idx + direction + emojis.length) % emojis.length;
    }
}

function selectEmojiForPrediction() {
    if (state === "predict" && !checkboxAutoRunPredictions.checked()) {
        if (!isNaN(selectedIndex)) {
            idx = selectedIndex;
        }
    }
}


// --- p5.js Draw Function ---
function draw() {
  background(255);
  updateFrameRate();

  push();
  fill(100); textSize(16); textAlign(CENTER); textStyle(NORMAL);
  text("Emoji Panel", panelSize / 2, 20);
  text("Feature Visualization", panelSize + panelSize / 2, 20);
  pop();

  const panelYOffset = 30;

  if (state === "initial") {
    drawInitialUI();
    return;
  }

  if (emojis.length === 0) {
    fill(255,0,0); textSize(20); text("Error: emojis array is empty!", width/2, height/2);
    return;
  }
  let e = emojis[idx % emojis.length];

  if (state === "collect") {
    statusDisplay.html('Status: Collecting Data...');
    drawEmojiPanel(e, 0, panelYOffset);
    let cov = computeColorFeatures(0, panelYOffset);
    if (checkboxGrid.checked()) drawOverlay(0, panelYOffset);
    drawFeatureViz(cov, panelSize, panelYOffset);
    results.push({ emoji: e, coverage: cov });
    idx++;
    if (idx >= emojis.length) {
      state = "train";
      idx = 0; // Reset for prediction phase
      trainModel();
    }
  } else if (state === "train") {
    statusDisplay.html('Status: Training Model...');
    trainingProgressDisplay.show();
    fill(0); textSize(28); textAlign(CENTER, CENTER);
    text("Training model… please wait", (panelSize * 2) / 2, panelSize / 2 + panelYOffset);
    
    // Draw graph axes
  let graphX = 50;
  let graphY = height - 120;
  let graphW = width - 100;
  let graphH = 80;

  fill(240); stroke(200); rect(graphX, graphY, graphW, graphH);
  stroke(50);
  line(graphX, graphY, graphX, graphY + graphH); // Y-axis
  line(graphX, graphY + graphH, graphX + graphW, graphY + graphH); // X-axis

  // Plot loss (red) and accuracy (green)
  noFill();
  push()
  if (lossHistory.length > 1) {
    stroke(255, 0, 0); beginShape();
    for (let i = 0; i < lossHistory.length; i++) {
      let x = graphX + (i / 75) * graphW;
      // hacky workaround for dynamic axis
      let y = graphY + graphH - (map(lossHistory[i], 0, lossHistory[0],0,1) * graphH)
      vertex(x, y);
    }
    endShape();
  }
  pop()
  
  push()
  if (accHistory.length > 1) {
    stroke(0, 200, 0); beginShape();
    for (let i = 0; i < accHistory.length; i++) {
      let x = graphX + (i / 75) * graphW;
      let y = graphY + graphH - (accHistory[i] * graphH);
      vertex(x, y);
    }
    endShape();
  }
  pop()

  fill(0); noStroke();
  textAlign(LEFT, BOTTOM);
  textSize(12)
  text("Loss (red)", graphX, graphY - 5);
  text("Accuracy (green)", graphX + 120, graphY - 5);
  } else if (state === "predict") {
    statusDisplay.html('Status: Predicting');
    trainingProgressDisplay.hide();
    drawEmojiPanel(e, 0, panelYOffset);
    let cov = computeColorFeatures(0, panelYOffset);
    if (checkboxGrid.checked()) drawOverlay(0, panelYOffset);
    drawFeatureViz(cov, panelSize, panelYOffset);

    let guess = model ? predictTF(cov) : "?";

    // --- Prediction Text Alignment Fix ---
    push();
    fill(0);
    textSize(20);
    textAlign(CENTER, CENTER); // Ensure centering for this text
    // Calculate the center X based on the two panels
    let centerX = panelSize; // panelSize is width of one panel, so center of two is at the edge of the first.
    text(`Actual: ${e}   →   Predicted: ${guess}`, width/2 - 90, panelSize + 95);
    pop();

    if (checkboxAutoRunPredictions.checked()) {
        idx = (idx + 1) % emojis.length;
    }
  }
}

// --- Drawing Helper Functions ---
function drawOverlay(xOff = 0, yOff = 0) {
  push();
  translate(xOff, yOff);
  stroke(200, 200, 200, 150); strokeWeight(1);
  for (let i = 1; i < cols; i++) line(i * cellW, 0, i * cellW, panelSize);
  for (let j = 1; j < rows; j++) line(0, j * cellH, panelSize, j * cellH);
  pop();
}

function drawEmojiPanel(ch, xOff = 0, yOff = 0) {
  push();
  translate(xOff, yOff);
  fill(255); noStroke();
  rect(0, 0, panelSize, panelSize);
  textSize(panelSize * 0.75); textAlign(CENTER, CENTER);
  text(ch, panelSize / 2, panelSize / 2 + (panelSize * 0.08));
  pop();
}

function drawFeatureViz(cov, xOff = 0, yOff = 0) {
  push();
  translate(xOff, yOff);
  noStroke();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let base = (r * cols + c) * 3;
      if (base + 2 >= cov.length) { fill(128); rect(c * cellW, r * cellH, cellW, cellH); continue; }
      let Rn = cov[base], Gn = cov[base + 1], Bn = cov[base + 2];
      if (Rn === 0 && Gn === 0 && Bn === 0) fill(255);
      else fill(Rn * 255, Gn * 255, Bn * 255);
      rect(c * cellW, r * cellH, cellW, cellH);
    }
  }
  if (checkboxGrid.checked()) {
      stroke(220, 220, 220, 100); strokeWeight(1);
      for (let i = 1; i < cols; i++) line(i * cellW, 0, i * cellW, panelSize);
      for (let j = 1; j < rows; j++) line(0, j * cellH, panelSize, j * cellH);
  }
  pop();
}

// --- Feature Computation ---
function computeColorFeatures(panelXOffset = 0, panelYOffset = 0) {
  loadPixels();
  let feats = [];
  const canvasPixelWidth = width * 4;

  for (let ry = 0; ry < rows; ry++) {
    for (let cx = 0; cx < cols; cx++) {
      let sumR = 0, sumG = 0, sumB = 0, count = 0;
      let startPX = floor(cx * cellW);
      let endPX = floor((cx + 1) * cellW);
      let startPY = floor(ry * cellH);
      let endPY = floor((ry + 1) * cellH);

      for (let py = startPY; py < endPY; py++) {
        for (let px = startPX; px < endPX; px++) {
          let actualXOnCanvas = panelXOffset + px;
          let actualYOnCanvas = panelYOffset + py;
          if (actualXOnCanvas < 0 || actualXOnCanvas >= width || actualYOnCanvas < 0 || actualYOnCanvas >= height) continue;
          let i = (actualYOnCanvas * width + actualXOnCanvas) * 4;
          if (i < 0 || i + 3 >= pixels.length) continue;
          let r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
          if (r === 255 && g === 255 && b === 255) continue;
          sumR += r; sumG += g; sumB += b; count++;
        }
      }
      if (!count) feats.push(0, 0, 0);
      else feats.push(sumR / (count * 255), sumG / (count * 255), sumB / (count * 255));
    }
  }
  return feats;
}

// --- TensorFlow.js Model Training & Prediction ---
async function trainModel() {
  if (results.length === 0) {
    console.error("No data collected."); statusDisplay.html("Error: No data for training.");
    trainingProgressDisplay.html("Training failed: No data.").show(); resetButton.removeAttribute('disabled'); return;
  }
  const FEATURE_LEN = rows * cols * 3;
  const X_data = results.map(r => r.coverage);
  let validData = X_data.every((d, i) => {
    if (d.length !== FEATURE_LEN) console.error(`Data error: Emoji ${results[i].emoji}, len ${d.length}, expected ${FEATURE_LEN}`);
    return d.length === FEATURE_LEN;
  });
  if (!validData) {
    statusDisplay.html("Error: Feature length mismatch."); trainingProgressDisplay.html("Training failed: Data error.").show();
    resetButton.removeAttribute('disabled'); return;
  }

  const X = tf.tensor2d(X_data, [results.length, FEATURE_LEN]);
  const labels = results.map(r => emojis.indexOf(r.emoji));
  const Y = tf.oneHot(tf.tensor1d(labels, "int32"), emojis.length);

  model = tf.sequential();
  model.add(tf.layers.dense({ units: Math.max(32, Math.floor(FEATURE_LEN / 2)), activation: "relu", inputShape: [FEATURE_LEN] }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: emojis.length, activation: "softmax" }));
  model.compile({ optimizer: tf.train.adam(0.001), loss: "categoricalCrossentropy", metrics: ["accuracy"] });

  trainingProgressDisplay.html("Starting training...").show(); console.log("Starting model training...");
  await model.fit(X, Y, {
    epochs: 75, batchSize: Math.min(16, results.length), shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
  lossHistory.push(logs.loss);
  accHistory.push(logs.acc);
  let msg = `Epoch ${epoch + 1}/75: Loss=${logs.loss.toFixed(4)}, Acc=${logs.acc.toFixed(4)}`;
  console.log(msg);
  // Optional: still update text below
  trainingProgressDisplay.html(msg);
},
      onTrainEnd: (logs) => {
        console.log("Training finished", logs);
        state = "predict"; idx = 0;
        statusDisplay.html('Status: Predicting');
        trainingProgressDisplay.html(`Training complete! Final Acc: ${logs.acc ? logs.acc.toFixed(4) : 'N/A'}`);
      }
    }
  }).catch(err => {
    console.error("Training Error:", err); trainingProgressDisplay.html(`Training Error: ${err.message}`);
    statusDisplay.html('Status: Training Failed');
  });
  tf.dispose([X, Y]);
}

function predictTF(cov) {
  if (!model) { console.warn("Model not trained!"); return "?"; }
  const FEATURE_LEN = rows * cols * 3;
  if (cov.length !== FEATURE_LEN) { console.error(`Prediction error: Feature len mismatch. Got ${cov.length}, expected ${FEATURE_LEN}`); return "Err"; }
  let predTensor;
  try {
    predTensor = tf.tidy(() => {
      const input = tf.tensor2d([cov], [1, FEATURE_LEN]);
      return model.predict(input).argMax(-1);
    });
    const i = predTensor.dataSync()[0];
    tf.dispose(predTensor);
    return emojis[i];
  } catch (error) {
    console.error("Error during prediction:", error);
    if (predTensor) tf.dispose(predTensor);
    return "Err";
  }
}

// Manual Emoji Cycling in Predict State (Keyboard)
function keyPressed() {
  if (state === "predict" && !checkboxAutoRunPredictions.checked()) { // Only if manual mode
    if (keyCode === RIGHT_ARROW) {
      navigatePrediction(1);
    } else if (keyCode === LEFT_ARROW) {
      navigatePrediction(-1);
    }
  }
}