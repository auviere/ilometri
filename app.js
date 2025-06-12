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
  users.forEach(user => {
    if (!user.growths) user.growths = [];
    if (!user.lastUpdate) user.lastUpdate = Date.now();
    if (isNaN(user.totalJoy)) user.totalJoy = 0;
    if (isNaN(user.maxJoy)) user.maxJoy = 0;
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
    nextZeroTime: null
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
  if (!currentUser) return;

  updateUserState(currentUser);

  const now = Date.now();
  const amount = (15 / (currentUser.extraValue * 6800)) * 1000;

  currentUser.growths.push({ amount, start: now });
  currentUser.lastUpdate = now;

  // Päivitetään huippu ja nolla-aika KIINTEÄSTI
  const activeGrowths = currentUser.growths;
  const growthSum = activeGrowths.reduce((sum, g) => sum + g.amount, 0);
  const peakTime = now + GROWTH_DURATION * 1000;
  const expectedJoy = currentUser.totalJoy + growthSum;

  const zeroTime = peakTime + (expectedJoy / DECAY_PER_SECOND) * 1000;

  currentUser.expectedPeakTime = peakTime;
  currentUser.expectedPeakJoy = expectedJoy;
  currentUser.nextZeroTime = zeroTime;

  saveUsers();
  renderUsers();
}

function updateUserState(user) {
  const now = Date.now();
  const elapsed = Math.floor((now - user.lastUpdate) / 1000);
  if (elapsed <= 0) return;

  let addedJoy = 0;
  const stillGrowing = [];

  user.growths.forEach(g => {
    const secondsPassed = Math.min((now - g.start) / 1000, GROWTH_DURATION);
    const portion = g.amount * (secondsPassed / GROWTH_DURATION);
    addedJoy += portion;

    if (secondsPassed < GROWTH_DURATION) stillGrowing.push(g);
  });

  user.totalJoy += addedJoy;

  const decay = DECAY_PER_SECOND * elapsed;
  user.totalJoy -= decay;
  if (user.totalJoy < 0) user.totalJoy = 0;

  if (user.totalJoy > user.maxJoy) {
    user.maxJoy = user.totalJoy;
  }

  user.growths = stillGrowing;
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
    // Laske hetkellinen ilo
    let joyNow = u.totalJoy;
    u.growths.forEach(g => {
      const secondsPassed = Math.min((now - g.start) / 1000, GROWTH_DURATION);
      joyNow += g.amount * (secondsPassed / GROWTH_DURATION);
    });

    const peakTimeStr = u.expectedPeakTime
      ? new Date(u.expectedPeakTime).toLocaleTimeString()
      : "-";
    const zeroTimeStr = u.nextZeroTime
      ? new Date(u.nextZeroTime).toLocaleTimeString()
      : "-";

    const div = document.createElement("div");
    div.textContent =
      `${u.profileImage} ${u.username} (lisäarvo: ${u.extraValue})\n` +
      `ilo nyt: ${joyNow.toFixed(3)}, odotettu huippu: ${u.expectedPeakJoy.toFixed(3)}, ` +
      `saavutettu huippu: ${u.maxJoy.toFixed(3)}\n` +
      `huippu klo: ${peakTimeStr}, nolla klo: ${zeroTimeStr}`;
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
