let users = [];
let currentUser = null;
let selectedProfileImage = "🐱";

const GROWTH_DURATION = 1800; // seconds
const DECAY_PER_SECOND = 0.0000445;

function selectImage(emoji) {
  selectedProfileImage = emoji;
}

function saveUsers() {
  localStorage.setItem("users", JSON.stringify(users));
}

function loadUsers() {
  users = JSON.parse(localStorage.getItem("users") || "[]");
  users.forEach(u => {
    u.growths = u.growths || [];
    u.lastUpdate = u.lastUpdate || Date.now();
    u.maxJoy = u.maxJoy || 0;
  });
}

function register() {
  const username = document.getElementById("username").value.trim();
  const extraValue = parseFloat(document.getElementById("extraValue").value);
  if (!username || isNaN(extraValue)) {
    alert("Syötä käyttäjänimi ja kelvollinen lisäarvo.");
    return;
  }

  const user = {
    username,
    profileImage: selectedProfileImage,
    extraValue,
    growths: [],
    lastUpdate: Date.now(),
    maxJoy: 0
  };

  users.push(user);
  currentUser = user;
  saveUsers();
  showApp();
}

function showApp() {
  document.getElementById("register").style.display = "none";
  document.getElementById("app").style.display = "block";
  document.getElementById("current-user").textContent = currentUser.username;
  renderUsers();
}

function addJoy() {
  const now = Date.now();
  const G = (15 / (currentUser.extraValue * 6800)) * 1000;
  currentUser.growths.push({ amount: G, start: now });
  saveUsers();
  renderUsers();
}

function calculateJoy(user, now) {
  let joy = 0;
  let totalGrowth = 0;
  let lastEndTime = 0;

  for (let g of user.growths) {
    const elapsed = (now - g.start) / 1000;
    const growthDuration = Math.min(GROWTH_DURATION, Math.max(0, elapsed));
    const partial = (growthDuration / GROWTH_DURATION) * g.amount;
    joy += partial;
    totalGrowth += g.amount;

    const end = g.start + GROWTH_DURATION * 1000;
    if (end > lastEndTime) lastEndTime = end;
  }

  const secondsSinceStart = (now - user.growths[0]?.start || now) / 1000;
  const decay = DECAY_PER_SECOND * secondsSinceStart;
  joy -= decay;
  if (joy < 0) joy = 0;
  if (joy > user.maxJoy) user.maxJoy = joy;

  // Peak value estimation
  const decayUntilPeak = ((lastEndTime - (user.growths[0]?.start || now)) / 1000) * DECAY_PER_SECOND;
  const expectedPeak = Math.max(0, totalGrowth - decayUntilPeak);

  // Zero estimation
  const zeroIn = joy / DECAY_PER_SECOND;
  const zeroTime = joy > 0 ? now + zeroIn * 1000 : null;

  return {
    current: joy,
    expectedPeak: expectedPeak,
    peakTime: lastEndTime,
    zeroTime: zeroTime
  };
}

function renderUsers() {
  const container = document.getElementById("user-list");
  container.innerHTML = "";
  const now = Date.now();

  users.forEach(user => {
    const stats = calculateJoy(user, now);

    const div = document.createElement("div");
    div.innerHTML = `
      <strong>${user.profileImage} ${user.username}</strong> (lisäarvo: ${user.extraValue})<br>
      Hetkellinen ilo: ${stats.current.toFixed(3)}<br>
      Odotettu huippu: ${stats.expectedPeak.toFixed(3)}<br>
      Saavutettu huippu: ${user.maxJoy.toFixed(3)}<br>
      Huippu klo: ${new Date(stats.peakTime).toLocaleTimeString()}<br>
      Nolla klo: ${stats.zeroTime ? new Date(stats.zeroTime).toLocaleTimeString() : "-" }<br><br>
    `;
    container.appendChild(div);
  });
}

window.onload = () => {
  loadUsers();
  if (users.length > 0) {
    currentUser = users[users.length - 1];
    showApp();
  }

  setInterval(() => {
    renderUsers();
  }, 1000);
};
