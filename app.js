let users = [];
let currentUser = null;
let selectedProfileImage = "🐱";

const GROWTH_DURATION = 1800; // seconds (30 min)
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
    u.totalJoy = u.totalJoy || 0;
    u.maxJoy = u.maxJoy || 0;
    u.lastUpdate = u.lastUpdate || Date.now();
  });
}

function register() {
  const username = document.getElementById("username").value.trim();
  const extraValue = parseFloat(document.getElementById("extraValue").value);

  if (!username || isNaN(extraValue)) {
    alert("Syötä nimi ja kelvollinen lisäarvo.");
    return;
  }

  if (users.find(u => u.username === username)) {
    alert("Käyttäjänimi on jo käytössä.");
    return;
  }

  const user = {
    username,
    profileImage: selectedProfileImage,
    extraValue,
    growths: [],
    totalJoy: 0,
    maxJoy: 0,
    lastUpdate: Date.now(),
    expectedPeakJoy: 0,
    expectedPeakTime: null,
    nextZeroTime: null,
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
  updateUserState(currentUser);

  const G = (15 / (currentUser.extraValue * 6800)) * 1000;
  currentUser.growths.push({ amount: G, start: now });

  // Laske tuleva kasvu ja huipun ajankohta
  let totalGrowthLeft = 0;
  let lastGrowthStart = now;

  const updatedGrowths = [];

  for (let g of currentUser.growths) {
    const elapsed = (now - g.start) / 1000;
    if (elapsed < GROWTH_DURATION) {
      const remainingRatio = (GROWTH_DURATION - elapsed) / GROWTH_DURATION;
      totalGrowthLeft += g.amount * remainingRatio;
      updatedGrowths.push(g);
      if (g.start > lastGrowthStart) {
        lastGrowthStart = g.start;
      }
    }
  }

  currentUser.growths = updatedGrowths;

  const decayNext30min = DECAY_PER_SECOND * GROWTH_DURATION;
  const peak = currentUser.totalJoy + totalGrowthLeft - decayNext30min;
  currentUser.expectedPeakJoy = Math.max(0, peak);
  currentUser.expectedPeakTime = lastGrowthStart + GROWTH_DURATION * 1000;

  if (peak > 0) {
    const timeToZero = (peak / DECAY_PER_SECOND) * 1000;
    currentUser.nextZeroTime = currentUser.expectedPeakTime + timeToZero;
  } else {
    currentUser.nextZeroTime = null;
  }

  saveUsers();
  renderUsers();
}

function updateUserState(user) {
  const now = Date.now();
  const elapsed = Math.floor((now - user.lastUpdate) / 1000);
  if (elapsed <= 0) return;

  // Laske kasvu
  let growthAdd = 0;
  const updatedGrowths = [];

  for (let g of user.growths) {
    const age = (now - g.start) / 1000;
    if (age < GROWTH_DURATION) {
      const previousAge = (user.lastUpdate - g.start) / 1000;
      const gain = g.amount * ((Math.min(age, GROWTH_DURATION) - Math.max(previousAge, 0)) / GROWTH_DURATION);
      growthAdd += gain;
      updatedGrowths.push(g);
    }
  }

  user.totalJoy += growthAdd;

  // Laske väheneminen
  const decay = DECAY_PER_SECOND * elapsed;
  user.totalJoy -= decay;
  if (user.totalJoy < 0) user.totalJoy = 0;

  if (user.totalJoy > user.maxJoy) {
    user.maxJoy = user.totalJoy;
  }

  user.growths = updatedGrowths;
  user.lastUpdate = now;
}

function updateAllUsers() {
  users.forEach(updateUserState);
  saveUsers();
}

function renderUsers() {
  const container = document.getElementById("user-list");
  container.innerHTML = "";

  const now = Date.now();

  users.forEach(u => {
    // Hetkellinen ilo
    let joyNow = u.totalJoy;
    u.growths.forEach(g => {
      const elapsed = (now - g.start) / 1000;
      if (elapsed < GROWTH_DURATION) {
        joyNow += g.amount * ((Math.min(elapsed, GROWTH_DURATION)) / GROWTH_DURATION);
      }
    });

    const peakStr = u.expectedPeakTime ? new Date(u.expectedPeakTime).toLocaleTimeString() : "-";
    const zeroStr = u.nextZeroTime ? new Date(u.nextZeroTime).toLocaleTimeString() : "-";

    const div = document.createElement("div");
    div.textContent =
      `${u.profileImage} ${u.username} (lisäarvo: ${u.extraValue})\n` +
      `ilo nyt: ${joyNow.toFixed(3)}, odotettu huippu: ${u.expectedPeakJoy.toFixed(3)}, ` +
      `saavutettu huippu: ${u.maxJoy.toFixed(3)}\n` +
      `huippu klo: ${peakStr}, nolla klo: ${zeroStr}`;
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
    updateAllUsers();
    renderUsers();
  }, 1000);
};
