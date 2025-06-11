const profileImages = ["🐱", "🐶", "🦊", "🐻", "🐼"];
let selectedProfileImage = profileImages[0];
let currentUser = null;
let users = JSON.parse(localStorage.getItem("users") || "[]");

// Näytä profiilikuvat
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

function register() {
  const username = document.getElementById("reg-username").value;
  const password = document.getElementById("reg-password").value;

  if (users.find(u => u.username === username)) {
    alert("Käyttäjänimi on jo käytössä!");
    return;
  }

  users.push({
    username,
    password,
    profileImage: selectedProfileImage,
    timeLeft: 0,
    lastUpdate: Date.now()
  });
  saveUsers();
  alert("Käyttäjä luotu!");
}

function login() {
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    alert("Väärä käyttäjänimi tai salasana!");
    return;
  }

  currentUser = user;
  document.getElementById("current-user").textContent = `${user.username} ${user.profileImage}`;
  document.getElementById("auth").style.display = "none";
  document.getElementById("app").style.display = "block";
}

function addTime() {
  if (!currentUser) return;
  updateUserTime(currentUser);
  currentUser.timeLeft += 60; // lisää 60 sekuntia
  currentUser.lastUpdate = Date.now();
  saveUsers();
}

function updateUserTime(user) {
  const now = Date.now();
  const elapsed = Math.floor((now - user.lastUpdate) / 1000);
  user.timeLeft -= elapsed;
  if (user.timeLeft < 0) user.timeLeft = 0;
  user.lastUpdate = now;
}

function updateAllUsers() {
  users.forEach(updateUserTime);
  saveUsers();
}

function renderUsers() {
  const container = document.getElementById("user-list");
  container.innerHTML = "";
  users.forEach(u => {
    const endTime = new Date(Date.now() + u.timeLeft * 1000);
    const endTimeStr = u.timeLeft > 0 ? endTime.toLocaleTimeString() : "-";
    const div = document.createElement("div");
    div.textContent = `${u.profileImage} ${u.username} - jäljellä: ${u.timeLeft}s, päättyy: ${endTimeStr}`;
    container.appendChild(div);
  });
}

// Päivitä joka sekunti
setInterval(() => {
  updateAllUsers();
  renderUsers();
}, 1000);
