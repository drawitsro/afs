let jsonData = null;
// Stores each folder’s Pixi application and its sprite array for later filter updates.
const folderPixiData = {};
// Global object to store slider control references per folder.
const folderControlRefs = {};

// Global overlay Pixi app (pre-instantiated)
let globalOverlayApp = null;

// Cache DOM elements for overlay.
const overlay = document.getElementById('overlay');
const closeOverlay = document.getElementById('closeOverlay');
const overlayContainer = document.getElementById('overlayContainer');

closeOverlay.addEventListener('click', () => {
    overlay.style.display = 'none';
    if (globalOverlayApp) {
        globalOverlayApp.stage.removeChildren();
        globalOverlayApp.stage.scale.set(1);
        globalOverlayApp.stage.position.set(0, 0);
    }
});

// Instantiate the global overlay Pixi app once after DOM loads.
window.addEventListener('DOMContentLoaded', async () => {
    const overlayWidth = overlayContainer.clientWidth || window.innerWidth * 0.9;
    const overlayHeight = overlayContainer.clientHeight || window.innerHeight * 0.9;
    globalOverlayApp = new PIXI.Application({ backgroundAlpha: 0 });
    await globalOverlayApp.init({ width: overlayWidth, height: overlayHeight });
    overlayContainer.appendChild(globalOverlayApp.canvas);
    init();
});

// Create a new PixiJS application.
async function createPixiApp(width, height) {
    let app;
    try {
        console.log("Creating PixiJS application...");
        app = new PIXI.Application({ backgroundAlpha: 0 });
        await app.init({ width, height });
        console.log("✅ PixiJS App created.");
    } catch (error) {
        console.error("❌ PixiJS Application creation failed:", error);
        return null;
    }
    return app;
}

async function init() {
    try {
        console.log("Initializing application...");
        // Use a relative path instead of an absolute one:
        const response = await fetch('data/data.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch data.json (status ${response.status})`);
        }
        jsonData = await response.json();
        buildEditor();
    } catch (err) {
        console.error("Error initializing editor:", err);
    }
}

// Build the editor by creating a section for each folder.
function buildEditor() {
    const editorDiv = document.getElementById('editor');
    for (const folderKey in jsonData) {
        const folderData = jsonData[folderKey];
        createFolderSection(editorDiv, folderKey, folderData);
    }
}

// Helper: Create a slider input with a fixed-width text field.
// Returns an object with references.
function createSliderInput(labelText, min, max, step, initialValue, callback) {
    const container = document.createElement('div');
    container.className = 'form-group';
    container.style.display = 'inline-block';
    container.style.minWidth = '260px';
    container.style.marginRight = '5px';

    // Wrap label and text input in a span to force them on one line.
    const labelWrapper = document.createElement('span');
    labelWrapper.style.display = 'inline-block';
    labelWrapper.style.verticalAlign = 'middle';

    const label = document.createElement('label');
    label.textContent = labelText;
    label.style.marginRight = '5px';
    label.style.display = 'inline-block';
    labelWrapper.appendChild(label);

    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.value = initialValue;
    valueInput.className = 'slider-value form-control';
    valueInput.style.display = 'inline-block';
    valueInput.style.width = '50px';
    labelWrapper.appendChild(valueInput);

    container.appendChild(labelWrapper);

    const rangeInput = document.createElement('input');
    rangeInput.type = 'range';
    rangeInput.className = 'form-control-range';
    rangeInput.min = min;
    rangeInput.max = max;
    rangeInput.step = step;
    rangeInput.value = initialValue;
    rangeInput.style.display = 'inline-block';
    rangeInput.style.verticalAlign = 'middle';
    container.appendChild(rangeInput);

    rangeInput.addEventListener('input', () => {
        valueInput.value = rangeInput.value;
        callback(parseFloat(rangeInput.value));
    });
    valueInput.addEventListener('change', () => {
        const newVal = parseFloat(valueInput.value);
        if (!isNaN(newVal)) {
            rangeInput.value = newVal;
            callback(newVal);
        }
    });
    return { container, rangeInput, valueInput };
}

// Create a section for one folder.
async function createFolderSection(container, folderKey, folderData) {
    console.log(`Building section for: ${folderKey}`);
    
    const section = document.createElement('div');
    section.className = 'section';
    
    // Header: folder title and slider controls on one line.
    const header = document.createElement('div');
    header.className = 'd-flex flex-wrap align-items-center justify-content-between';
    
    const title = document.createElement('h2');
    title.textContent = folderKey;
    title.className = 'mr-3';
    header.appendChild(title);
    
    // Slider controls container.
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'slider-container';
    
    // Prepare an object to store slider references for this folder.
    folderControlRefs[folderKey] = {};
    
    // Exposure slider (range -10 to 10).
    if (folderData.exposure && folderData.exposure.tp === 'exp') {
        const expSliderObj = createSliderInput('Exposure', -10, 10, 0.1, folderData.exposure.val, (val) => {
            folderData.exposure.val = val;
            updatePixiFilters(folderKey, folderData);
        });
        sliderContainer.appendChild(expSliderObj.container);
        folderControlRefs[folderKey].exposure = expSliderObj;
    }
    
    // HSV sliders.
    if (folderData.hsv && folderData.hsv.tp === 'hsv') {
        const hsvVals = folderData.hsv.val; // [h, s, v]
        const hueSliderObj = createSliderInput('Hue', -180, 180, 1, hsvVals[0], (val) => {
            hsvVals[0] = val;
            folderData.hsv.val = hsvVals;
            updatePixiFilters(folderKey, folderData);
        });
        const satSliderObj = createSliderInput('Saturation', -1, 1, 0.01, hsvVals[1], (val) => {
            hsvVals[1] = val;
            folderData.hsv.val = hsvVals;
            updatePixiFilters(folderKey, folderData);
        });
        const lightSliderObj = createSliderInput('Lightness', -1, 1, 0.01, hsvVals[2], (val) => {
            hsvVals[2] = val;
            folderData.hsv.val = hsvVals;
            updatePixiFilters(folderKey, folderData);
        });
        sliderContainer.appendChild(hueSliderObj.container);
        sliderContainer.appendChild(satSliderObj.container);
        sliderContainer.appendChild(lightSliderObj.container);
        folderControlRefs[folderKey].hsv = {
            hue: hueSliderObj,
            saturation: satSliderObj,
            lightness: lightSliderObj
        };
    }
    
    header.appendChild(sliderContainer);
    section.appendChild(header);
    
    // Images container.
    const imagesDiv = document.createElement('div');
    imagesDiv.className = 'images-container mt-2';
    section.appendChild(imagesDiv);
    
    // Create a PixiJS application for this folder.
    const appHeight = 400;
    const defaultAppWidth = 1000;
    const pixiApp = await createPixiApp(defaultAppWidth, appHeight);
    if (!pixiApp) {
        console.error(`Skipping rendering for folder ${folderKey}`);
        return;
    }
    imagesDiv.appendChild(pixiApp.canvas);
    
    const containerSprite = new PIXI.Container();
    pixiApp.stage.addChild(containerSprite);
    
    let xOffset = 0;
    const sprites = [];
    
    // Load and render each image.
    for (let i = 0; i < folderData.files.length; i++) {
        const fileName = folderData.files[i];
        const imgPath = `data/${folderKey}/${fileName}`;
        console.log(`Loading image: ${imgPath}`);
        let texture;
        try {
            texture = await PIXI.Assets.load(imgPath);
            if (!texture) throw new Error(`Texture not loaded for ${imgPath}`);
        } catch (error) {
            console.error(`Error loading image ${imgPath}:`, error);
            continue;
        }
        const sprite = new PIXI.Sprite(texture);
        
        // Maintain aspect ratio: scale so that sprite height equals appHeight.
        const origWidth = texture.orig ? texture.orig.width : texture.width;
        const origHeight = texture.orig ? texture.orig.height : texture.height;
        const scale = appHeight / origHeight;
        sprite.width = origWidth * scale;
        sprite.height = origHeight * scale;
        
        sprite.x = xOffset;
        sprite.y = 0;
        xOffset += sprite.width + 5;
        
        // Add a numbered overlay.
        const numberText = new PIXI.Text((i + 1).toString(), {
            fontFamily: 'Arial',
            fontSize: 20,
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        numberText.x = 5;
        numberText.y = 5;
        sprite.addChild(numberText);
        
        // On click: show overlay image.
        sprite.interactive = true;
        sprite.cursor = 'pointer';
        sprite.on('pointerdown', () => {
            showOverlayImage(imgPath, folderData);
        });
        
        containerSprite.addChild(sprite);
        sprites.push(sprite);
    }
    pixiApp.renderer.resize(xOffset, appHeight);
    
    folderPixiData[folderKey] = { app: pixiApp, sprites: sprites };
    container.appendChild(section);
    
    // Additional form fields for other properties (e.g., note and ok) appear under the Pixi app.
    const additionalDiv = document.createElement('div');
    additionalDiv.className = 'additional-controls mt-2';
    for (const dataKey in folderData) {
        if (dataKey === 'files' || dataKey === 'exposure' || dataKey === 'hsv') continue;
        const fieldType = folderData[dataKey].tp;
        const val = folderData[dataKey].val;
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        if (fieldType === 'str') {
            const label = document.createElement('label');
            label.textContent = dataKey + ':';
            formGroup.appendChild(label);
            const textArea = document.createElement('textarea');
            textArea.className = 'form-control';
            textArea.value = val;
            textArea.addEventListener('input', (e) => {
                folderData[dataKey].val = e.target.value;
            });
            formGroup.appendChild(textArea);
        } else if (fieldType === 'bool') {
            const label = document.createElement('label');
            label.textContent = dataKey + ': ';
            formGroup.appendChild(label);
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = !!val;
            checkbox.addEventListener('change', (e) => {
                folderData[dataKey].val = e.target.checked ? 1 : 0;
            });
            formGroup.appendChild(checkbox);
        } else {
            const div = document.createElement('div');
            div.textContent = dataKey + ': ' + val;
            formGroup.appendChild(div);
        }
        additionalDiv.appendChild(formGroup);
    }
    section.appendChild(additionalDiv);
    
    updatePixiFilters(folderKey, folderData);
}

// Update filters for all sprites in the folder.
function updatePixiFilters(folderKey, folderData) {
    if (!folderPixiData[folderKey]) return;
    const { sprites } = folderPixiData[folderKey];
    
    const exposureFilter = new PIXI.filters.AdjustmentFilter();
    if (folderData.exposure && folderData.exposure.tp === 'exp') {
        const expVal = parseFloat(folderData.exposure.val);
        exposureFilter.brightness = 1 + expVal * 0.1;
    }
    
    const hslFilter = new PIXI.filters.HslAdjustmentFilter();
    if (folderData.hsv && folderData.hsv.tp === 'hsv') {
        const [h, s, v] = folderData.hsv.val.map(Number);
        // With valid hue range -180 to 180, no change is at 0.
        hslFilter.hue = h;
        hslFilter.saturation = s;
        hslFilter.lightness = v;
    }
    
    sprites.forEach(sprite => {
        sprite.filters = [exposureFilter, hslFilter];
    });
}

// Show overlay image in the global overlay Pixi app with pan and zoom.
async function showOverlayImage(imgPath, folderData) {
    if (!globalOverlayApp) {
        console.error("Overlay app not defined!");
        return;
    }
    globalOverlayApp.stage.removeChildren();
    globalOverlayApp.stage.scale.set(1);
    globalOverlayApp.stage.position.set(0, 0);
    
    let texture;
    try {
        texture = await PIXI.Assets.load(imgPath);
    } catch (error) {
        console.error(`Error loading image for overlay ${imgPath}:`, error);
        return;
    }
    
    // Create a container for pan & zoom.
    const panZoomContainer = new PIXI.Container();
    panZoomContainer.interactive = true;
    panZoomContainer.buttonMode = true;
    globalOverlayApp.stage.addChild(panZoomContainer);
    
    const sprite = new PIXI.Sprite(texture);
    
    const exposureFilter = new PIXI.filters.AdjustmentFilter();
    if (folderData.exposure && folderData.exposure.tp === 'exp') {
        const expVal = parseFloat(folderData.exposure.val);
        exposureFilter.brightness = 1 + expVal * 0.1;
    }
    const hslFilter = new PIXI.filters.HslAdjustmentFilter();
    if (folderData.hsv && folderData.hsv.tp === 'hsv') {
        const [h, s, v] = folderData.hsv.val.map(Number);
        hslFilter.hue = (h - 0); // 0 means no shift; using raw value
        hslFilter.saturation = s;
        hslFilter.lightness = v;
    }
    sprite.filters = [exposureFilter, hslFilter];
    
    panZoomContainer.addChild(sprite);
    
    // Set pivot to center of sprite.
    panZoomContainer.pivot.set(sprite.width / 2, sprite.height / 2);
    
    const overlayWidth = overlayContainer.clientWidth || window.innerWidth * 0.9;
    const overlayHeight = overlayContainer.clientHeight || window.innerHeight * 0.9;
    panZoomContainer.x = overlayWidth / 2;
    panZoomContainer.y = overlayHeight / 2;
    
    // Scale to fullscreen (or original size if smaller).
    const scaleFactor = Math.min(overlayWidth / sprite.width, overlayHeight / sprite.height, 1);
    panZoomContainer.scale.set(scaleFactor);
    
    // Enable zoom via mouse wheel.
    globalOverlayApp.view.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = 1 + e.deltaY * -0.001;
        panZoomContainer.scale.x *= zoomFactor;
        panZoomContainer.scale.y *= zoomFactor;
    });
    
    // Enable panning via pointer events.
    let dragging = false;
    let dragStart = { x: 0, y: 0 };
    panZoomContainer.on('pointerdown', (event) => {
        dragging = true;
        dragStart.x = event.data.global.x;
        dragStart.y = event.data.global.y;
    });
    panZoomContainer.on('pointermove', (event) => {
        if (dragging) {
            const newX = event.data.global.x;
            const newY = event.data.global.y;
            panZoomContainer.x += (newX - dragStart.x);
            panZoomContainer.y += (newY - dragStart.y);
            dragStart.x = newX;
            dragStart.y = newY;
        }
    });
    panZoomContainer.on('pointerup', () => { dragging = false; });
    panZoomContainer.on('pointerupoutside', () => { dragging = false; });
    
    overlay.style.display = 'flex';
}

// Load JSON functionality.
document.getElementById('loadBtn').addEventListener('click', () => {
    document.getElementById('loadInput').click();
});

document.getElementById('loadInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const newData = JSON.parse(e.target.result);
            for (const folderKey in newData) {
                if (jsonData[folderKey]) {
                    // Update exposure if present.
                    if (newData[folderKey].exposure && jsonData[folderKey].exposure) {
                        jsonData[folderKey].exposure.val = newData[folderKey].exposure.val;
                        if (folderControlRefs[folderKey] && folderControlRefs[folderKey].exposure) {
                            folderControlRefs[folderKey].exposure.rangeInput.value = newData[folderKey].exposure.val;
                            folderControlRefs[folderKey].exposure.valueInput.value = newData[folderKey].exposure.val;
                        }
                    }
                    // Update hsv if present.
                    if (newData[folderKey].hsv && jsonData[folderKey].hsv) {
                        jsonData[folderKey].hsv.val = newData[folderKey].hsv.val;
                        if (folderControlRefs[folderKey] && folderControlRefs[folderKey].hsv) {
                            const hsv = newData[folderKey].hsv.val;
                            folderControlRefs[folderKey].hsv.hue.rangeInput.value = hsv[0];
                            folderControlRefs[folderKey].hsv.hue.valueInput.value = hsv[0];
                            folderControlRefs[folderKey].hsv.saturation.rangeInput.value = hsv[1];
                            folderControlRefs[folderKey].hsv.saturation.valueInput.value = hsv[1];
                            folderControlRefs[folderKey].hsv.lightness.rangeInput.value = hsv[2];
                            folderControlRefs[folderKey].hsv.lightness.valueInput.value = hsv[2];
                        }
                    }
                    updatePixiFilters(folderKey, jsonData[folderKey]);
                }
            }
            alert("JSON loaded successfully!");
        } catch (err) {
            console.error("Error parsing loaded JSON:", err);
            alert("Invalid JSON file.");
        }
    };
    reader.readAsText(file);
});

// Save JSON data when Save button is clicked.
document.getElementById('saveBtn').addEventListener('click', () => {
    if (!jsonData) return;
    const fileContent = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([fileContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'data.json';
    link.click();
    URL.revokeObjectURL(url);
});
