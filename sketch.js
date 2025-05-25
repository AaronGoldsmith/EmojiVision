// =======================================
// Emoji Vision Sketch (p5.js UI layer)
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
  let appDiv = createDiv().addClass('flex h-[95vh] p-4 gap-4 box-border');

  // Panels area
  mainPanelsDiv = createDiv().addClass('grid grid-cols-2 gap-4 flex-1 h-full').parent(appDiv);
  let leftPanel = createDiv().addClass('flex flex-col justify-center items-center h-full bg-white rounded-lg shadow-md p-4').parent(mainPanelsDiv);
  let rightPanel = createDiv().addClass('flex flex-col justify-center items-center h-full bg-white rounded-lg shadow-md p-4').parent(mainPanelsDiv);

  // Canvas in leftPanel
  let c = createCanvas(panelSize * 2, panelSize + 130);
  c.parent(leftPanel);

  // Controls sidebar
  controlsDiv = createDiv().addClass('w-[280px] flex flex-col gap-4 p-4 h-full bg-white rounded-lg shadow-md').parent(appDiv);
  createElement('h2', 'Controls').addClass('text-xl mb-2 text-slate-500').parent(controlsDiv);

  // Control groups with gap
  // Height (pixels)
  let groupHeight = createDiv().addClass('flex flex-col gap-1').parent(controlsDiv);
  createSpan('Height (pixels)').addClass('text-sm text-slate-600 mb-1').parent(groupHeight);
  inputRows = createInput(str(rows), 'number').addClass('p-2 border border-slate-300 rounded-lg text-base').parent(groupHeight);

  // Width (pixels)
  let groupWidth = createDiv().addClass('flex flex-col gap-1').parent(controlsDiv);
  createSpan('Width (pixels)').addClass('text-sm text-slate-600 mb-1').parent(groupWidth);
  inputCols = createInput(str(cols), 'number').addClass('p-2 border border-slate-300 rounded-lg text-base').parent(groupWidth);

  // Button row (horizontally)
  let groupButtons = createDiv().addClass('flex flex-row items-stretch gap-2').parent(controlsDiv);
  startButton = createButton('Start Collection').addClass('py-3 px-4 rounded-lg text-base cursor-pointer transition-colors duration-200 ease-in-out w-1/2 min-w-[110px] h-[44px] inline-flex justify-center items-center bg-blue-500 text-white hover:bg-blue-600').parent(groupButtons).mousePressed(() => window.initializeAndStartCollection());
  resetButton = createButton('Reset').addClass('py-3 px-4 rounded-lg text-base cursor-pointer transition-colors duration-200 ease-in-out w-1/2 min-w-[110px] h-[44px] inline-flex justify-center items-center bg-slate-200 text-slate-500 hover:bg-slate-300').parent(groupButtons).mousePressed(() => window.resetSketch());
  resetButton.attribute('disabled', true);

  // Show Grid
  let groupGrid = createDiv().addClass('flex flex-col gap-1 switch').parent(controlsDiv); // Retained 'switch' for potential specific styling not covered by Tailwind alone.
  checkboxGrid = createCheckbox('Show Grid Overlay', true).parent(groupGrid);

  // Auto-run Predictions
  let groupAutoRun = createDiv().addClass('flex flex-col gap-1 switch').parent(controlsDiv); // Retained 'switch'
  checkboxAutoRunPredictions = createCheckbox('Auto-run Predictions', true).parent(groupAutoRun);
  checkboxAutoRunPredictions.changed(() => window.togglePredictionMode());

  // Animation Speed
  let groupSpeed = createDiv().addClass('flex flex-col gap-1').parent(controlsDiv);
  createSpan('Animation Speed:').addClass('text-sm text-slate-600 mb-1').parent(groupSpeed);
  frameRateSlider = createSlider(1, 30, 5, 1).addClass('w-[90%] max-w-[210px] mx-auto block').parent(groupSpeed);
  frameRateSlider.style('width', '90%'); // This might be redundant or could be replaced by Tailwind width if preferred.

  // Status badge inside controls (only show this, remove extra status elsewhere)
  statusBadge = createDiv('').addClass('text-center bg-blue-100 text-blue-600 font-bold py-1.5 px-2.5 rounded-xl mx-auto max-w-[230px] text-base tracking-wider mt-3').parent(controlsDiv);
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
      statusBadge: statusBadge, // now statusBadge
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
