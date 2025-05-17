// =======================================
// Emoji Trainer Sketch (p5.js UI layer)
// =======================================
// This file contains ONLY p5.js setup, draw, and UI logic.
// All model/ML logic should be called from ml/model.js!
// 
// Imports (for browsers):
// - ml/model.js must load before this!
// - data/emojis.js must load before this!

let cellW, cellH;
let statusBadge, trainingProgressDisplay, inputRows, inputCols, startButton, resetButton, checkboxGrid, frameRateSlider, checkboxAutoRunPredictions;
let controlsDiv, statusDiv, mainPanelsDiv;
let state = "initial";

function setup() {
  // Outer app wrapper
  let appDiv = createDiv().addClass('app');

  // Panels area
  mainPanelsDiv = createDiv().addClass('panels').parent(appDiv);
  let leftPanel = createDiv().addClass('panel card').parent(mainPanelsDiv);
  let rightPanel = createDiv().addClass('panel card').parent(mainPanelsDiv);

  // Canvas in leftPanel
  let c = createCanvas(panelSize * 2, panelSize + 130);
  c.parent(leftPanel);

  // Controls sidebar
  controlsDiv = createDiv().addClass('controls card').parent(appDiv);
  createElement('h2', 'Controls').parent(controlsDiv);

  // Control groups with gap
  // Height (pixels)
  let groupHeight = createDiv().addClass('control-group').parent(controlsDiv);
  createSpan('Height (pixels)').parent(groupHeight);
  inputRows = createInput(str(rows), 'number').addClass('card').parent(groupHeight);

  // Width (pixels)
  let groupWidth = createDiv().addClass('control-group').parent(controlsDiv);
  createSpan('Width (pixels)').parent(groupWidth);
  inputCols = createInput(str(cols), 'number').addClass('card').parent(groupWidth);

  // Button row (horizontally)
  let groupButtons = createDiv().addClass('control-group button-row').parent(controlsDiv);
  startButton = createButton('Start Collection').addClass('btn').addClass('btn-primary').parent(groupButtons).mousePressed(() => window.initializeAndStartCollection());
  resetButton = createButton('Reset').addClass('btn').addClass('btn-secondary').parent(groupButtons).mousePressed(() => window.resetSketch());
  resetButton.attribute('disabled', true);

  // Show Grid
  let groupGrid = createDiv().addClass('control-group switch').parent(controlsDiv);
  checkboxGrid = createCheckbox('Show Grid Overlay', true).parent(groupGrid);

  // Auto-run Predictions
  let groupAutoRun = createDiv().addClass('control-group switch').parent(controlsDiv);
  checkboxAutoRunPredictions = createCheckbox('Auto-run Predictions', true).parent(groupAutoRun);
  checkboxAutoRunPredictions.changed(() => window.togglePredictionMode());

  // Animation Speed
  let groupSpeed = createDiv().addClass('control-group').parent(controlsDiv);
  createSpan('Animation Speed:').parent(groupSpeed);
  frameRateSlider = createSlider(1, 30, 5, 1).addClass('card').parent(groupSpeed);
  frameRateSlider.style('width', '90%');

  // Status badge inside controls (only show this, remove extra status elsewhere)
  statusBadge = createDiv('').addClass('status-badge').parent(controlsDiv);
  statusBadge.hide();

  // Remove statusDiv, only use the badge now

  trainingProgressDisplay = createP('').parent(controlsDiv).style('font-size', '14px').style('font-family', 'monospace');
  trainingProgressDisplay.hide();

  if (window.initializeParameters) window.initializeParameters();
  window.updateFrameRate && window.updateFrameRate();
}

function draw() {
  // Button visibility logic
  if (window.state === 'initial' || window.state === undefined) {
    startButton.show();
    startButton.removeAttribute('disabled');
    resetButton.hide();
  } else {
    startButton.hide();
    resetButton.show();
    resetButton.removeAttribute('disabled');
  }

  if (window.drawMainApp) {
    // Handle status badge for unified control
    let badgeText = '';
    if (window.state === 'collect') badgeText = 'Collecting Data...';
    else if (window.state === 'train') badgeText = 'Training Model...';
    else if (window.state === 'predict') badgeText = 'Predicting';
    if (badgeText) {
      statusBadge.html(badgeText);
      statusBadge.show();
    } else {
      statusBadge.hide();
    }
    window.drawMainApp({
      statusDisplay: statusBadge, // now statusBadge
      trainingProgressDisplay,
      inputRows,
      inputCols,
      startButton,
      resetButton,
      checkboxGrid,
      frameRateSlider,
      checkboxAutoRunPredictions
    });
  }
}

function keyPressed() {
  if (window.onKeyPressed) window.onKeyPressed(keyCode);
}
