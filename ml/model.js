// ========================================
// Emoji + Feature-Viz (TF.js) MODEL LAYER
// ========================================
// This file should NOT include UI or p5.js setup logic! Only state/emojiModel/logic.

// App state and ML variables
window.lossHistory = [];
window.accHistory = [];
window.results = [];
window.idx = 0;
window.state = "initial";
window.emojiModel = undefined;

// --- Model parameter (can be set by UI) ---
window.rows = 9;
window.cols = 9;
window.panelSize = 380; // global shared value

// -------------------------
// MODEL and FEATURE HELPERS
// -------------------------

window.initializeParameters = function() {
  let r = parseInt(inputRows.value());
  let c = parseInt(inputCols.value());
  if (isNaN(r) || r <= 0) r = 9;
  if (isNaN(c) || c <= 0) c = 9;
  window.rows = r;
  window.cols = c;
  inputRows.value(rows);
  inputCols.value(cols);
  cellW = panelSize / cols;
  cellH = panelSize / rows;
  window.results = [];
  window.idx = 0;
  if (window.emojiModel) {
    tf.dispose(window.emojiModel);
    window.emojiModel = undefined;
  }
  console.log(`Initialized with ${rows} rows, ${cols} cols.`);
};

window.initializeAndStartCollection = function() {
  window.initializeParameters();
  window.state = "collect";
  startButton.attribute('disabled', true);
  resetButton.removeAttribute('disabled');
  inputRows.attribute('disabled', true);
  inputCols.attribute('disabled', true);
  trainingProgressDisplay.hide();
  statusBadge.html('Status: Collecting Data...');
  window.updateFrameRate();
};

window.resetSketch = function() {
  window.lossHistory = [];
  window.accHistory = [];
  window.state = "initial";
  startButton.removeAttribute('disabled');
  resetButton.attribute('disabled', true);
  inputRows.removeAttribute('disabled');
  inputCols.removeAttribute('disabled');
  statusBadge.html('Status: Initial. Configure and start.');
  trainingProgressDisplay.hide().html('');
  window.results = [];
  window.idx = 0;
  clear();
  background(255);
  window.drawInitialUI();
  if (window.emojiModel) {
    tf.dispose(window.emojiModel);
    window.emojiModel = undefined;
  }
  console.log("Sketch Reset");
};

window.updateFrameRate = function() {
  let fr = frameRateSlider.value();
  frameRate(fr);
};

// TODO: show resolution display
window.drawInitialUI = function() {
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
};

window.togglePredictionMode = function() {};
window.navigatePrediction = function(direction) {
  if (window.state === "predict" && !checkboxAutoRunPredictions.checked()) {
    window.idx = (window.idx + direction + emojis.length) % emojis.length;
  }
};
window.onKeyPressed = function(keyCode) {
  if (window.state === "predict" && !checkboxAutoRunPredictions.checked()) {
    if (keyCode === RIGHT_ARROW) {
      window.navigatePrediction(1);
    } else if (keyCode === LEFT_ARROW) {
      window.navigatePrediction(-1);
    }
  }
};

// --- Drawing/Helper functions (for use by UI) ---
window.drawOverlay = function(xOff = 0, yOff = 0) {
  push();
  translate(xOff, yOff);
  stroke(200, 200, 200, 150); strokeWeight(1);
  for (let i = 1; i < cols; i++) line(i * cellW, 0, i * cellW, panelSize);
  for (let j = 1; j < rows; j++) line(0, j * cellH, panelSize, j * cellH);
  pop();
};
window.drawEmojiPanel = function(ch, xOff = 0, yOff = 0) {
  push();
  translate(xOff, yOff);
  fill(255); noStroke();
  rect(0, 0, panelSize, panelSize);
  textSize(panelSize * 0.75); textAlign(CENTER, CENTER);
  text(ch, panelSize / 2, panelSize / 2 + (panelSize * 0.08));
  pop();
};
window.drawFeatureViz = function(cov, xOff = 0, yOff = 0) {
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
};

window.computeColorFeatures = function(panelXOffset = 0, panelYOffset = 0) {
  loadPixels();
  let feats = [];
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
};

// --- Training & Prediction ---
window.trainModel = async function() {
  if (results.length === 0) {
    console.error("No data collected."); statusBadge.html("Error: No data for training.");
    trainingProgressDisplay.html("Training failed: No data.").show(); resetButton.removeAttribute('disabled'); return;
  }
  const FEATURE_LEN = rows * cols * 3;
  const X_data = results.map(r => r.coverage);
  let validData = X_data.every((d, i) => {
    if (d.length !== FEATURE_LEN) console.error(`Data error: Emoji ${results[i].emoji}, len ${d.length}, expected ${FEATURE_LEN}`);
    return d.length === FEATURE_LEN;
  });
  if (!validData) {
    statusBadge.html("Error: Feature length mismatch."); trainingProgressDisplay.html("Training failed: Data error.").show();
    resetButton.removeAttribute('disabled'); return;
  }
  const X = tf.tensor2d(X_data, [results.length, FEATURE_LEN]);
  const labels = results.map(r => emojis.indexOf(r.emoji));
  const Y = tf.oneHot(tf.tensor1d(labels, "int32"), emojis.length);
  window.emojiModel = tf.sequential();
  emojiModel.add(tf.layers.dense({ units: Math.max(32, Math.floor(FEATURE_LEN / 2)), activation: "relu", inputShape: [FEATURE_LEN] }));
  emojiModel.add(tf.layers.dropout({ rate: 0.2 }));
  emojiModel.add(tf.layers.dense({ units: emojis.length, activation: "softmax" }));
  emojiModel.compile({ optimizer: tf.train.adam(0.001), loss: "categoricalCrossentropy", metrics: ["accuracy"] });
  trainingProgressDisplay.html("Starting training...").show(); console.log("Starting emojiModel training...");
  await emojiModel.fit(X, Y, {
    epochs: 75, batchSize: Math.min(16, results.length), shuffle: true,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        lossHistory.push(logs.loss);
        accHistory.push(logs.acc);
        let msg = `Epoch ${epoch + 1}/75: Loss=${logs.loss.toFixed(4)}, Acc=${logs.acc.toFixed(4)}`;
        console.log(msg);
        trainingProgressDisplay.html(msg);
      },
      onTrainEnd: (logs) => {
        console.log("Training finished", logs.acc, logs.loss);
        window.state = "predict"; window.idx = 0;
        statusBadge.html('Status: Predicting');
        trainingProgressDisplay.html(`Training complete! Final Acc: ${logs.acc ? logs.acc.toFixed(4) : 'N/A'}`);
      }
    }
  }).catch(err => {
    console.error("Training Error:", err); trainingProgressDisplay.html(`Training Error: ${err.message}`);
    statusBadge.html('Status: Training Failed');
  });
  tf.dispose([X, Y]);
};

window.predictTF = function(cov) {
  if (!window.emojiModel) { console.warn("Model not trained!"); return "?"; }
  const FEATURE_LEN = rows * cols * 3;
  if (cov.length !== FEATURE_LEN) { console.error(`Prediction error: Feature len mismatch. Got ${cov.length}, expected ${FEATURE_LEN}`); return "Err"; }
  let predTensor;
  try {
    predTensor = tf.tidy(() => {
      const input = tf.tensor2d([cov], [1, FEATURE_LEN]);
      return emojiModel.predict(input).argMax(-1);
    });
    const i = predTensor.dataSync()[0];
    tf.dispose(predTensor);
    return emojis[i];
  } catch (error) {
    console.error("Error during prediction:", error);
    if (predTensor) tf.dispose(predTensor);
    return "Err";
  }
};

// --- Main App Render (called from sketch.js) ---
window.drawMainApp = function({
  statusBadge, trainingProgressDisplay, inputRows, inputCols, startButton, resetButton, checkboxGrid, frameRateSlider, checkboxAutoRunPredictions
}) {
  background(255);
  window.updateFrameRate();
  push();
  fill(100); textSize(16); textAlign(CENTER); textStyle(NORMAL);
  text("Emoji Panel", panelSize / 2, 20);
  text("Feature Visualization", panelSize + panelSize / 2, 20);
  pop();
  const panelYOffset = 30;
  if (window.state === "initial") {
    window.drawInitialUI();
    return;
  }
  if (emojis.length === 0) {
    fill(255,0,0); textSize(20); text("Error: emojis array is empty!", width/2, height/2);
    return;
  }
  let e = emojis[window.idx % emojis.length];
  if (window.state === "collect") {
    statusBadge.html('Status: Collecting Data...');
    window.drawEmojiPanel(e, 0, panelYOffset);
    let cov = window.computeColorFeatures(0, panelYOffset);
    if (checkboxGrid.checked()) window.drawOverlay(0, panelYOffset);
    window.drawFeatureViz(cov, panelSize, panelYOffset);
    window.results.push({ emoji: e, coverage: cov });
    window.idx++;
    if (window.idx >= emojis.length) {
      window.state = "train";
      window.idx = 0; // Reset for prediction phase
      window.trainModel();
    }
  } else if (window.state === "train") {
    statusBadge.html('Status: Training Model...');
    trainingProgressDisplay.show();
    fill(0); textSize(28); textAlign(CENTER, CENTER);
    text("Training Model… please wait", (panelSize * 2) / 2, panelSize / 2 + panelYOffset);
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
    push();
    if (lossHistory.length > 1) {
      stroke(255, 0, 0); beginShape();
      for (let i = 0; i < lossHistory.length; i++) {
        let x = graphX + (i / 75) * graphW;
        // hacky workaround for dynamic axis
        let y = graphY + graphH - (map(lossHistory[i], 0, lossHistory[0],0,1) * graphH);
        vertex(x, y);
      }
      endShape();
    }
    pop();
    push();
    if (accHistory.length > 1) {
      stroke(0, 200, 0); beginShape();
      for (let i = 0; i < accHistory.length; i++) {
        let x = graphX + (i / 75) * graphW;
        let y = graphY + graphH - (accHistory[i] * graphH);
        vertex(x, y);
      }
      endShape();
    }
    pop();
    fill(0); noStroke();
    textAlign(LEFT, BOTTOM);
    textSize(12);
    text("Loss (red)", graphX, graphY - 5);
    text("Accuracy (green)", graphX + 120, graphY - 5);
  } else if (window.state === "predict") {
    statusBadge.html('Status: Predicting');
    trainingProgressDisplay.hide();
    window.drawEmojiPanel(e, 0, panelYOffset);
    let cov = window.computeColorFeatures(0, panelYOffset);
    if (checkboxGrid.checked()) window.drawOverlay(0, panelYOffset);
    window.drawFeatureViz(cov, panelSize, panelYOffset);
    let guess = window.emojiModel ? window.predictTF(cov) : "?";
    push();
    fill(0);
    textSize(20);
    textAlign(CENTER, CENTER);
    let centerX = panelSize;
    text(`Actual: ${e}   →   Predicted: ${guess}`, width/2 - 90, panelSize + 95);
    pop();
    if (checkboxAutoRunPredictions.checked()) {
      window.idx = (window.idx + 1) % emojis.length;
    }
  }
};

