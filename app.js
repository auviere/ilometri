let users = [];
let currentUser = null;
let selectedProfileImage = "🐱";

function selectImage(emoji) {
  selectedProfileImage = emoji;
}

function saveUsers() {
  localStorage.setItem("users", JSON.stringify(users));
}

function loadUsers() {
  users = JSON.parse(localStorage.getItem("users") || "[]");

  // Varmista että lastUpdate on määritetty
  const now = Date.now();
  users.forEach(user => {
    if (!user.lastUpdate || isNaN(user.lastUpdate)) {
      user.lastUpdate = now;
    }
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
    ilo: 0,
    iloKasvunopeus: 0,
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

  const increase = (15 / (currentUser.extraValue * 6800)) * 1000;
  const kasvunopeus = increase / 1800; // jaetaan 30 minuuttiin

  currentUser.iloKasvunopeus += kasvunopeus;
  currentUser.lastUpdate = Date.now();

  saveUsers();
  renderUsers();
}

function updateUserState(user) {
  const now = Date.now();
  let elapsed = Math.floor((now - user.lastUpdate) / 1000);
  if (elapsed <= 0) return;

  for (let i = 0; i < elapsed; i++) {
    user.ilo += user.iloKasvunopeus;
    user.ilo -= 0.0000445;
    if (user.ilo < 0) user.ilo = 0;

    user.iloKasvunopeus -= user.iloKasvunopeus / (1800 - i);
    if (user.iloKasvunopeus < 0) user.iloKasvunopeus = 0;
  }

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
    const kasvuaika = 1800;
    const remainingGrowthTime = Math.min(kasvuaika, u.iloKasvunopeus > 0 ? kasvuaika : 0);
    const additionalIlo = u.iloKasvunopeus * remainingGrowthTime;
    const futureIlo = u.ilo + additionalIlo;

    const peakTime = new Date(now + remainingGrowthTime * 1000);
    const peakTimeStr = (additionalIlo > 0) ? peakTime.toLocaleTimeString() : "-";

    let zeroTimeStr = "-";
    if (futureIlo > 0) {
      const secondsUntilZero = futureIlo / 0.0000445;
      const zeroTime = new Date(now + secondsUntilZero * 1000);
      zeroTimeStr = zeroTime.toLocaleTimeString();
    }

    const div = document.createElement("div");
    div.textContent =
      `${u.profileImage} ${u.username} (lisäarvo: ${u.extraValue}) – ` +
      `ilo: ${u.ilo.toFixed(3)}, huippu: ${futureIlo.toFixed(3)} klo ${peakTimeStr}, ` +
      `nolla klo ${zeroTimeStr}`;
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
