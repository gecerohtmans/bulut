const OPTIONS = ["A", "B", "C", "D", "E"];

const pdfInput = document.getElementById("pdfInput");
const pdfFrame = document.getElementById("pdfFrame");
const pdfWrap = document.getElementById("pdfWrap");
const drawCanvas = document.getElementById("drawCanvas");
const clearDrawing = document.getElementById("clearDrawing");
const toolSelect = document.getElementById("toolSelect");
const colorSelect = document.getElementById("colorSelect");

const questionCountInput = document.getElementById("questionCount");
const buildOptic = document.getElementById("buildOptic");
const finishExam = document.getElementById("finishExam");
const opticGrid = document.getElementById("opticGrid");
const questionTemplate = document.getElementById("questionTemplate");
const resultBox = document.getElementById("resultBox");

const timerDisplay = document.getElementById("timerDisplay");
const startTimer = document.getElementById("startTimer");
const stopTimer = document.getElementById("stopTimer");
const resetTimer = document.getElementById("resetTimer");

const videoUrl = document.getElementById("videoUrl");
const addVideo = document.getElementById("addVideo");
const videoList = document.getElementById("videoList");
const toggleNotes = document.getElementById("toggleNotes");
const notesPanel = document.getElementById("notesPanel");

let questionCount = Number(questionCountInput.value);
let userSelections = Array(questionCount).fill("");
let answerKey = Array(questionCount).fill("");

function buildOpticForm() {
  questionCount = Math.max(1, Math.min(200, Number(questionCountInput.value) || 20));
  questionCountInput.value = questionCount;
  userSelections = Array(questionCount).fill("");
  answerKey = Array(questionCount).fill("");
  opticGrid.innerHTML = "";
  resultBox.classList.add("hidden");

  for (let i = 0; i < questionCount; i += 1) {
    const row = questionTemplate.content.firstElementChild.cloneNode(true);
    row.querySelector(".question-number").textContent = `${i + 1}.`;

    const userGroup = row.querySelector(".user-group");
    const answerGroup = row.querySelector(".answer-group");

    addBubbles(userGroup, i, "user");
    addBubbles(answerGroup, i, "answer");

    opticGrid.appendChild(row);
  }
}

function addBubbles(group, questionIndex, mode) {
  OPTIONS.forEach((opt) => {
    const bubble = document.createElement("button");
    bubble.type = "button";
    bubble.className = "bubble";
    bubble.textContent = opt;
    bubble.dataset.option = opt;
    bubble.addEventListener("click", () => {
      const targetArray = mode === "user" ? userSelections : answerKey;
      targetArray[questionIndex] = targetArray[questionIndex] === opt ? "" : opt;
      [...group.children].forEach((el) => el.classList.remove("selected"));
      if (targetArray[questionIndex]) {
        bubble.classList.add("selected");
      }
    });
    group.appendChild(bubble);
  });
}

function finishAndScore() {
  let correct = 0;
  let wrong = 0;
  let blank = 0;

  for (let i = 0; i < questionCount; i += 1) {
    if (!userSelections[i]) {
      blank += 1;
    } else if (userSelections[i] === answerKey[i] && answerKey[i]) {
      correct += 1;
    } else {
      wrong += 1;
    }
  }

  resultBox.innerHTML = `
    <strong>Sonuçlar</strong><br>
    Doğru: <b>${correct}</b> &nbsp; Yanlış: <b>${wrong}</b> &nbsp; Boş: <b>${blank}</b><br>
    Net (4 yanlış 1 doğru götürür): <b>${(correct - wrong / 4).toFixed(2)}</b>
  `;
  resultBox.classList.remove("hidden");
}

buildOptic.addEventListener("click", buildOpticForm);
finishExam.addEventListener("click", finishAndScore);
buildOpticForm();

// PDF upload + drawing area
pdfInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }
  const url = URL.createObjectURL(file);
  pdfFrame.src = url;
});

const ctx = drawCanvas.getContext("2d");
let drawing = false;
let lastX = 0;
let lastY = 0;

function resizeCanvas() {
  const { width, height } = pdfWrap.getBoundingClientRect();
  const saved = ctx.getImageData(0, 0, drawCanvas.width || 1, drawCanvas.height || 1);
  drawCanvas.width = width;
  drawCanvas.height = height;
  try {
    ctx.putImageData(saved, 0, 0);
  } catch {
    // canvas fresh state
  }
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function getPos(event) {
  const rect = drawCanvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function applyToolStyle() {
  const tool = toolSelect.value;
  if (tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.lineWidth = 16;
    ctx.globalAlpha = 1;
    return;
  }

  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = colorSelect.value;
  if (tool === "highlighter") {
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 18;
  } else {
    ctx.globalAlpha = 1;
    ctx.lineWidth = 3;
  }
}

function startDraw(event) {
  drawing = true;
  const pos = getPos(event);
  lastX = pos.x;
  lastY = pos.y;
}

function moveDraw(event) {
  if (!drawing) {
    return;
  }
  const pos = getPos(event);
  applyToolStyle();
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
  lastX = pos.x;
  lastY = pos.y;
}

function stopDraw() {
  drawing = false;
}

drawCanvas.addEventListener("pointerdown", startDraw);
drawCanvas.addEventListener("pointermove", moveDraw);
drawCanvas.addEventListener("pointerup", stopDraw);
drawCanvas.addEventListener("pointerleave", stopDraw);
clearDrawing.addEventListener("click", () => {
  ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
});

// Timer
let timerId = null;
let elapsed = 0;

function renderTime() {
  const h = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const s = String(elapsed % 60).padStart(2, "0");
  timerDisplay.textContent = `${h}:${m}:${s}`;
}

startTimer.addEventListener("click", () => {
  if (timerId) {
    return;
  }
  timerId = setInterval(() => {
    elapsed += 1;
    renderTime();
  }, 1000);
});

stopTimer.addEventListener("click", () => {
  clearInterval(timerId);
  timerId = null;
});

resetTimer.addEventListener("click", () => {
  clearInterval(timerId);
  timerId = null;
  elapsed = 0;
  renderTime();
});

renderTime();

// Video links
addVideo.addEventListener("click", () => {
  const url = videoUrl.value.trim();
  if (!url) {
    return;
  }
  const li = document.createElement("li");
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = url;
  li.appendChild(link);
  videoList.appendChild(li);
  videoUrl.value = "";
});

// Notes toggle
toggleNotes.addEventListener("click", () => {
  notesPanel.classList.toggle("hidden");
});
