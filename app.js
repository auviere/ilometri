const profileImages = ["🐱", "🐶", "🦊", "🐻", "🐼"];
let selectedProfileImage = profileImages[0];
let currentUser = null;
let users = JSON.parse(localStorage.getItem("users") || "[]");

// Näytä profiilikuvavalinta
const profileImagesContainer = document.getElementById("profile-images");
profileImages.forEach(img => {
  const btn = document.createElement("button");
  btn.textContent = img;
  btn.onclick = () => selectedProfileImage = img;
  profileImagesContainer.appendChild(btn);
});

function saveUsers() {
  localStorage.setItem("users", JSON.stringify(users));
}

// Luo tai hae käyttäjä
function register() {
  const username = document.getElementById("reg-username").value.trim();
  const extraValue = parseInt(document.getElementById("reg-extra").value.trim());

  if (!username || isNaN(extraValue)) {
    alert("Anna käyttäjänimi ja numeerinen lisäarvo.");
    return;
  }

  let user = users.find(u => u.username === username);
  if (!user) {
    user = {
      username,
      profileImage: selectedProfileImage,
      extraValue,
      timeLeft: 0,
      lastUpdate: Date.now()
    };
    users.push(user);
    saveUsers();
  }

  localStorage.setItem("loggedInUser", username);
  loginUser(user);
}

// Kirjaa käyttäjän sisään ja näytä sovellus
function loginUser(user) {
  currentUser = user;
  document.getElementById("current-user").textContent = `${user.username} ${user.profileImage}`;
  document.getElementById("auth").style.display = "none";
  document.getElementById("app").style.display = "block";
}

// Lisää aikaa
function addTime() {
  if (!currentUser) return;
  updateUserTime(currentUser);
  currentUser.timeLeft += 60;
  currentUser.lastUpdate = Date.now();
  saveUsers();
}

// Päivitä yhden käyttäjän aika
function updateUserTime(user) {
  const now = Date.now();
  const elapsed = Math.floor((now - user.lastUpdate) / 1000);
  user.timeLeft -= elapsed;
  if (user.timeLeft < 0) user.timeLeft = 0;
  user.lastUpdate = now;
}

// Päivitä kaikkien käyttäjien ajat
function updateAllUsers() {
  users.forEach(updateUserTime);
  saveUsers();
}

// Näytä käyttäjien tiedot koostenäkymässä
function renderUsers() {
  const container = document.getElementById("user-list");
  container.innerHTML = "";
  users.forEach(u => {
    const endTime = new Date(Date.now() + u.timeLeft * 1000);
    const endTimeStr = u.timeLeft > 0 ? endTime.toLocaleTimeString() : "-";
    const div = document.createElement("div");
    div.textContent = `${u.profileImage} ${u.username} (lisäarvo: ${u.extraValue}) – jäljellä: ${u.timeLeft}s, päättyy: ${endTimeStr}`;
    container.appendChild(div);
  });
}

// Tarkista automaattinen sisäänkirjautuminen
window.onload = () => {
  const savedUsername = localStorage.getItem("loggedInUser");
  if (savedUsername) {
    const user = users.find(u => u.username === savedUsername);
    if (user) loginUser(user);
  }
};

// Päivitä näkymä sekunnin välein
setInterval(() => {
  updateAllUsers();
  renderUsers();
}, 1000);
