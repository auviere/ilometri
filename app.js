let users = [];
let currentUser = null;
let selectedProfileImage = "🐱";
const GROWTH_DURATION = 1800; // 30min in seconds
const DECAY_PER_SECOND = 0.0000445; // ilo vähenee 0.00267/min = 0.0000445/s

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
    lastUpdate: Date.now()
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

  currentUser.growths.push({
    amount,
    start: now
  });

  currentUser.lastUpdate = now;
  saveUsers();
  renderUsers();
}

function updateUserState(user) {
  const now = Date.now();
  const elapsed = Math.floor((now - user.lastUpdate) / 1000);

  if (elapsed <= 0) return;

  // Päivitä ilo: kasvuosuudet ja vähennys
  let addedJoy = 0;

  const newGrowths = [];

  user.growths.forEach(g => {
    const secondsPassed = Math.min((now - g.start) / 1000, GROWTH_DURATION);
    if (secondsPassed > 0) {
      const portion = g.amount * (secondsPassed / GROWTH_DURATION);
      addedJoy += portion;
    }
    if (secondsPassed < GROWTH_DURATION) {
      newGrowths.push(g); // säilytä edelleen kasvava
    }
  });

  user.growths = newGrowths;
  user.totalJoy += addedJoy;
  user.totalJoy -= DECAY_PER_SECOND * elapsed;
  if (user.totalJoy < 0) user.totalJoy = 0;

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
    let currentJoy = u.totalJoy;

    u.growths.forEach(g => {
      const secondsPassed = Math.min((now - g.start) / 1000, GROWTH_DURATION);
      const portion = g.amount * (secondsPassed / GROWTH_DURATION);
      currentJoy += portion;
    });

    // Laske huipun hetki
    const latestGrowth = u.growths[u.growths.length - 1];
    let peakTimeStr = "-";
    if (latestGrowth) {
      const peakTime = new Date(latestGrowth.start + GROWTH_DURATION * 1000);
      peakTimeStr = peakTime.toLocaleTimeString();
    }

    // Laske nolla-aika
    let zeroTimeStr = "-";
    if (currentJoy > 0) {
      const secondsUntilZero = currentJoy / DECAY_PER_SECOND;
      const zeroTime = new Date(now + secondsUntilZero * 1000);
      zeroTimeStr = zeroTime.toLocaleTimeString();
    }

    const div = document.createElement("div");
    div.textContent =
      `${u.profileImage} ${u.username} (lisäarvo: ${u.extraValue}) – ` +
      `ilo: ${currentJoy.toFixed(3)}, huippu klo: ${peakTimeStr}, nolla klo: ${zeroTimeStr}`;
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
