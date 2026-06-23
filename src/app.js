import {
  buildSearchPlan,
  getLikelyQueryFromOcr,
  rankCardsForSearch,
} from "./card-search.js";
import {
  formatMoney,
  formatPrices,
  getMarketPrice,
  getRatingScore,
} from "./value-providers.js";

const API_BASE = "https://api.pokemontcg.io/v2/cards";

const state = {
  imageDataUrl: "",
  selectedCard: null,
  deferredInstallPrompt: null,
  cameraStream: null,
  isAnalyzing: false,
  autoScanEnabled: true,
  autoScanTimer: 0,
  lastAutoScanAt: 0,
  stableCardFrames: 0,
  previousFrameSignature: 0,
};

const icons = {
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3"/></svg>',
  image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg>',
  scan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
  external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
};

const $ = (id) => document.getElementById(id);

document.querySelectorAll("[data-icon]").forEach((node) => {
  node.innerHTML = icons[node.dataset.icon] || "";
});

const elements = {
  camera: $("camera"),
  cameraButton: $("cameraButton"),
  capturePreview: $("capturePreview"),
  emptyPreview: $("emptyPreview"),
  fileInput: $("fileInput"),
  scanButton: $("scanButton"),
  searchInput: $("searchInput"),
  searchButton: $("searchButton"),
  results: $("results"),
  scanText: $("scanText"),
  gradeEstimate: $("gradeEstimate"),
  rawValue: $("rawValue"),
  ratingValue: $("ratingValue"),
  gradeTitle: $("gradeTitle"),
  gradeNotes: $("gradeNotes"),
  installButton: $("installButton"),
  certInput: $("certInput"),
  psaLookupButton: $("psaLookupButton"),
  canvas: $("analysisCanvas"),
  autoScanState: $("autoScanState"),
};

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  state.deferredInstallPrompt = event;
  elements.installButton.hidden = false;
});

elements.installButton.addEventListener("click", async () => {
  if (!state.deferredInstallPrompt) return;
  state.deferredInstallPrompt.prompt();
  await state.deferredInstallPrompt.userChoice;
  state.deferredInstallPrompt = null;
  elements.installButton.hidden = true;
});

elements.cameraButton.addEventListener("click", async () => {
  if (state.cameraStream) {
    showLiveCamera();
    return;
  }

  await startCamera();
});

async function startCamera() {
  try {
    const stream = await getCameraStream();
    state.cameraStream = stream;
    elements.camera.srcObject = stream;
    showLiveCamera();
    setStatus("Camera is live. Hold the card in the frame, then tap Analyze.");
  } catch {
    setStatus("Camera permission was blocked or no webcam was found. Upload a card photo instead.");
  }
}

async function getCameraStream() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera API unavailable");
  }

  const cameraOptions = [
    { video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
    { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
    { video: true, audio: false },
  ];

  let lastError;
  for (const options of cameraOptions) {
    try {
      return await navigator.mediaDevices.getUserMedia(options);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function showLiveCamera() {
  state.imageDataUrl = "";
  elements.camera.hidden = false;
  elements.capturePreview.hidden = true;
  elements.capturePreview.setAttribute("aria-hidden", "true");
  elements.emptyPreview.hidden = true;
  elements.cameraButton.innerHTML = `${icons.camera} Live`;
  elements.scanButton.disabled = false;
  startAutoScan();
}

function startAutoScan() {
  stopAutoScan();
  if (!state.autoScanEnabled) return;
  elements.autoScanState.textContent = "Watching for card";
  state.autoScanTimer = window.setInterval(checkForCardInCamera, 850);
}

function stopAutoScan() {
  if (state.autoScanTimer) {
    window.clearInterval(state.autoScanTimer);
    state.autoScanTimer = 0;
  }
}

elements.fileInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const dataUrl = await readFileAsDataUrl(file);
  setPreview(dataUrl);
});

elements.scanButton.addEventListener("click", analyzeImage);
elements.searchButton.addEventListener("click", () => searchCards(elements.searchInput.value));
elements.searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") searchCards(elements.searchInput.value);
});

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab, .tab-panel").forEach((node) => node.classList.remove("active"));
    button.classList.add("active");
    $(`${button.dataset.tab}Panel`).classList.add("active");
  });
});

["cornersRange", "edgesRange", "surfaceRange", "centeringRange"].forEach((id) => {
  $(id).addEventListener("input", updateGradeFromSliders);
});

elements.psaLookupButton.addEventListener("click", () => {
  const cert = elements.certInput.value.replace(/\D/g, "");
  const url = cert ? `https://www.psacard.com/cert/${cert}` : "https://www.psacard.com/cert/";
  window.open(url, "_blank", "noopener,noreferrer");
});

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function captureFromCamera(options = {}) {
  const video = elements.camera;
  if (!video.srcObject) return "";
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    await new Promise((resolve) => {
      video.addEventListener("loadeddata", resolve, { once: true });
    });
  }

  const canvas = elements.canvas;
  canvas.width = video.videoWidth || 900;
  canvas.height = video.videoHeight || 1200;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
  setPreview(dataUrl, options);
  return dataUrl;
}

function setPreview(dataUrl, options = {}) {
  state.imageDataUrl = dataUrl;
  if (options.keepCameraLive) {
    return;
  }

  stopAutoScan();
  elements.capturePreview.src = dataUrl;
  elements.capturePreview.hidden = false;
  elements.capturePreview.setAttribute("aria-hidden", "false");
  elements.camera.hidden = true;
  elements.emptyPreview.hidden = true;
  elements.scanButton.disabled = false;
}

async function analyzeImage(options = {}) {
  if (state.isAnalyzing) return;
  state.isAnalyzing = true;
  elements.scanButton.disabled = true;

  if (elements.camera.srcObject && !elements.camera.hidden) {
    setStatus(options.auto ? "Card detected. Auto-analyzing..." : "Captured webcam frame. Analyzing card...");
    await captureFromCamera({ keepCameraLive: Boolean(options.auto) });
  }

  try {
    if (!state.imageDataUrl) {
      setStatus("Start the camera or upload a card photo first.");
      return;
    }

    setStatus("Analyzing photo for text and condition clues...");
    const condition = await estimateCondition(state.imageDataUrl);
    applyCondition(condition);

    if (!window.Tesseract) throw new Error("OCR unavailable");
    const result = await window.Tesseract.recognize(state.imageDataUrl, "eng");
    const text = result.data.text.replace(/\s+/g, " ").trim();
    const query = getLikelyQueryFromOcr(text);
    elements.scanText.textContent = text
      ? `OCR: ${text}`
      : "OCR did not find readable text. Try manual search.";
    if (query) {
      elements.searchInput.value = query;
      await searchCards(query);
    }
  } catch (err) {
    if (err.message === "OCR unavailable") {
      setStatus("Tesseract OCR is not available offline. Condition estimate is ready. Use manual search.");
    } else {
      setStatus("Condition estimate is ready. OCR could not process this image. Try manual search.");
    }
  } finally {
    state.isAnalyzing = false;
    elements.scanButton.disabled = false;
    if (state.cameraStream && !elements.camera.hidden) {
      elements.autoScanState.textContent = "Watching for card";
    }
  }
}

async function checkForCardInCamera() {
  if (state.isAnalyzing || !state.cameraStream || elements.camera.hidden) return;
  if (Date.now() - state.lastAutoScanAt < 8000) return;
  if (elements.camera.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

  const detection = detectCardCandidate(elements.camera);
  if (!detection.found) {
    state.stableCardFrames = 0;
    state.previousFrameSignature = detection.signature;
    elements.autoScanState.textContent = "Show a card";
    return;
  }

  const movement = Math.abs(detection.signature - state.previousFrameSignature);
  state.previousFrameSignature = detection.signature;
  state.stableCardFrames = movement < 18 ? state.stableCardFrames + 1 : 1;
  elements.autoScanState.textContent = state.stableCardFrames >= 2 ? "Card locked" : "Hold steady";

  if (state.stableCardFrames >= 2) {
    state.lastAutoScanAt = Date.now();
    state.stableCardFrames = 0;
    await analyzeImage({ auto: true });
  }
}

function detectCardCandidate(video) {
  const canvas = elements.canvas;
  const width = 180;
  const height = 120;
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(video, 0, 0, width, height);
  const { data } = context.getImageData(0, 0, width, height);
  const gray = new Uint8Array(width * height);
  let total = 0;

  for (let index = 0, pixel = 0; index < data.length; index += 4, pixel++) {
    const value = Math.round(data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114);
    gray[pixel] = value;
    total += value;
  }

  const average = total / gray.length;
  let edgePixels = 0;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let signature = 0;

  for (let y = 2; y < height - 2; y += 2) {
    for (let x = 2; x < width - 2; x += 2) {
      const pixel = y * width + x;
      const dx = Math.abs(gray[pixel - 1] - gray[pixel + 1]);
      const dy = Math.abs(gray[pixel - width] - gray[pixel + width]);
      const edge = dx + dy;
      signature += gray[pixel] > average ? 1 : -1;

      if (edge > 54) {
        edgePixels++;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  const boxWidth = maxX - minX;
  const boxHeight = maxY - minY;
  const boxArea = boxWidth * boxHeight;
  const frameArea = width * height;
  const fill = boxArea / frameArea;
  const aspect = boxWidth && boxHeight ? Math.max(boxWidth, boxHeight) / Math.min(boxWidth, boxHeight) : 0;
  const edgeDensity = edgePixels / ((width / 2) * (height / 2));

  return {
    found: fill > 0.18 && fill < 0.82 && aspect > 1.15 && aspect < 2.15 && edgeDensity > 0.045,
    signature: signature / 100,
  };
}

async function estimateCondition(dataUrl) {
  const image = await loadImage(dataUrl);
  const canvas = elements.canvas;
  const width = 420;
  const height = Math.round((image.height / image.width) * width);
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height);
  const edgeScore = scoreEdges(imageData, width, height);
  const centeringScore = scoreCentering(imageData, width, height);
  const surfaceScore = Math.max(4, Math.min(9, Math.round((edgeScore + centeringScore) / 2)));
  return {
    corners: edgeScore,
    edges: edgeScore,
    surface: surfaceScore,
    centering: centeringScore,
  };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function scoreEdges(imageData, width, height) {
  const data = imageData.data;
  let brightPixels = 0;
  let checked = 0;
  const margin = Math.max(8, Math.round(width * 0.04));

  for (let y = 0; y < height; y += 3) {
    for (let x = 0; x < width; x += 3) {
      const nearEdge = x < margin || x > width - margin || y < margin || y > height - margin;
      if (!nearEdge) continue;
      const index = (y * width + x) * 4;
      const brightness = (data[index] + data[index + 1] + data[index + 2]) / 3;
      if (brightness > 220) brightPixels++;
      checked++;
    }
  }

  const whiteRatio = brightPixels / Math.max(1, checked);
  return Math.max(4, Math.min(10, Math.round(10 - whiteRatio * 14)));
}

function scoreCentering(imageData, width, height) {
  const data = imageData.data;
  const midY = Math.floor(height / 2);
  const scan = [];

  for (let x = 0; x < width; x++) {
    const index = (midY * width + x) * 4;
    scan.push((data[index] + data[index + 1] + data[index + 2]) / 3);
  }

  const threshold = 205;
  const left = scan.findIndex((value) => value < threshold);
  const rightFromEnd = [...scan].reverse().findIndex((value) => value < threshold);
  if (left < 0 || rightFromEnd < 0) return 7;
  const right = width - rightFromEnd - 1;
  const leftBorder = left;
  const rightBorder = width - right;
  const ratio = Math.min(leftBorder, rightBorder) / Math.max(leftBorder, rightBorder, 1);
  return Math.max(5, Math.min(10, Math.round(6 + ratio * 4)));
}

function applyCondition(condition) {
  $("cornersRange").value = condition.corners;
  $("edgesRange").value = condition.edges;
  $("surfaceRange").value = condition.surface;
  $("centeringRange").value = condition.centering;
  updateGradeFromSliders();
}

function getGradeFromSliders() {
  const values = ["cornersRange", "edgesRange", "surfaceRange", "centeringRange"].map((id) => Number($(id).value));
  return Math.max(1, Math.min(10, Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)));
}

function updateGradeFromSliders() {
  const grade = getGradeFromSliders();
  elements.gradeEstimate.textContent = `PSA ${grade}?`;
  elements.gradeTitle.textContent = `Estimated PSA-style grade: ${grade}`;
  elements.gradeNotes.textContent = grade >= 9
    ? "Looks strong from the photo. Inspect with angled light for scratches, dents, whitening, and print lines before assuming gem potential."
    : grade >= 7
      ? "Likely collector-grade condition. Small edge, surface, or centering issues may hold it below gem mint."
      : "Visible wear likely affects grade and value. For valuable cards, compare against PSA standards before submitting.";
  updateRating();
}

let lastCards = [];

async function searchCards(query) {
  const cleanQuery = query.trim();
  if (!cleanQuery) return;

  if (!navigator.onLine) {
    elements.results.innerHTML = '<div class="grade-card"><h2>You are offline</h2><p>Card search requires an internet connection. Come back when you are online.</p></div>';
    setStatus("Offline — search unavailable.");
    return;
  }

  setStatus("Searching Pokemon TCG API...");
  elements.results.innerHTML = '<div class="grade-card"><p>Searching…</p></div>';

  try {
    const searchPlan = buildSearchPlan(cleanQuery);
    let cards = [];

    for (const plan of searchPlan) {
      cards = await fetchCards(plan.apiQuery);
      if (cards.length) break;
    }

    renderResults(rankCardsForSearch(cards, cleanQuery));
  } catch {
    elements.results.innerHTML = '<div class="grade-card"><h2>Search failed</h2><p>Check your connection or try a simpler name like "Charizard".</p></div>';
    setStatus("Search failed. Check your connection or try a simpler card name.");
  }
}

async function fetchCards(apiQuery) {
  const response = await fetch(`${API_BASE}?q=${encodeURIComponent(apiQuery)}&pageSize=12&orderBy=-set.releaseDate`);
  if (!response.ok) throw new Error("Search failed");
  const payload = await response.json();
  return payload.data || [];
}

function renderResults(cards) {
  if (!cards.length) {
    elements.results.innerHTML = '<div class="grade-card"><h2>No cards found</h2><p>Try the Pokemon name plus collector number, like "Pikachu 25" or "Pikachu 58/102". You can also search just a set name.</p></div>';
    setStatus("No matching cards found. Try a different search.");
    return;
  }

  lastCards = cards;

  elements.results.innerHTML = cards.map((card, index) => {
    return `
      <article class="result-card${card === state.selectedCard ? " selected" : ""}">
        <div class="card-image-wrapper">
          <img src="${card.images?.small || ""}" alt="${card.name}" loading="lazy" data-card-index="${index}" />
          <div class="card-fallback">
            <span>${card.name}</span>
            <span>${card.set?.name || ""}</span>
          </div>
        </div>
        <div>
          <h2>${card.name}</h2>
          <div class="meta">${card.set?.name || "Unknown set"} &middot; #${card.number || "-"} &middot; ${card.rarity || "Unknown rarity"}</div>
          <div class="prices">${formatPrices(card)}</div>
          <button class="select-card" data-card-index="${index}" type="button">Select</button>
        </div>
      </article>
    `;
  }).join("");

  elements.results.querySelectorAll("img[data-card-index]").forEach((img) => {
    img.addEventListener("error", () => {
      img.classList.add("failed");
      const fallback = img.nextElementSibling;
      if (fallback && fallback.classList.contains("card-fallback")) {
        fallback.style.display = "flex";
      }
    });
  });

  document.querySelectorAll("[data-card-index]").forEach((button) => {
    button.addEventListener("click", () => selectCard(lastCards[Number(button.dataset.cardIndex)]));
  });

  const firstPriced = cards.find((c) => getMarketPrice(c));
  selectCard(firstPriced || cards[0]);
}

function selectCard(card) {
  state.selectedCard = card;
  elements.rawValue.textContent = formatMoney(getMarketPrice(card));
  updateRating();

  document.querySelectorAll(".result-card").forEach((el) => el.classList.remove("selected"));
  const idx = lastCards.indexOf(card);
  if (idx >= 0) {
    const all = elements.results.querySelectorAll(".result-card");
    if (all[idx]) all[idx].classList.add("selected");
  }
}

function updateRating() {
  const grade = getGradeFromSliders();
  const score = getRatingScore(state.selectedCard, grade);
  elements.ratingValue.textContent = score === null ? "-" : `${score}/100`;
}

function setStatus(message) {
  elements.scanText.textContent = message;
}

window.addEventListener("online", () => {
  setStatus("Back online. Search and OCR are available again.");
  document.documentElement.classList.remove("offline");
});
window.addEventListener("offline", () => {
  setStatus("You are offline. Manual search and OCR require internet.");
  document.documentElement.classList.add("offline");
});
