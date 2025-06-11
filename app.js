const profileImages = ["🐱", "🐶", "🦊", "🐻", "🐼"];
let selectedProfileImage = profileImages[0];
let currentUser = null;
let users = JSON.parse(localStorage.getItem("users") || "[]");

// Profiilikuvien valinta
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

// Rekisteröi uusi käyttäjä
function register() {
  const username = document.getElementById("reg-username").value;
  const password = document.getElementById("reg-password").value;

  if (users.find(u => u.username === username)) {
    alert("Käyttäjänimi on jo käytössä!");
    return;
  }

  const newUser = {
    username,
    password,
    profileImage: selectedProfileImage,
    timeLeft: 0,
    lastUpdate: Date.now()
  };
  users.push(newUser);
  saveUsers();
  localStorage.setItem("loggedInUser", username);
  loginUser(newUser);
}

// Kirjaa sisään käyttäjän
function login() {
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    alert("Väärä käyttäjänimi tai salasana!");
    return;
  }

  localStorage.setItem("loggedInUser", username);
  loginUser(user);
}

// Sisäinen kirjautuminen (näytetään käyttöliittymä)
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

// Päivittää ajan yhdelle käyttäjälle
function updateUserTime(user) {
  const now = Date.now();
  const elapsed = Math.floor((now - user.lastUpdate) / 1000);
  user.timeLeft -= elapsed;
  if (user.timeLeft < 0) user.timeLeft = 0;
  user.lastUpdate = now;
}

// Päivittää kaikkien käyttäjien aikaa
function updateAllUsers() {
  users.forEach(updateUserTime);
  saveUsers();
}

// Näyttää käyttäjien tiedot
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

// Yritetään kirjautua automaattisesti
window.onload = () => {
  const savedUsername = localStorage.getItem("loggedInUser");
  if (savedUsername) {
    const user = users.find(u => u.username === savedUsername);
    if (user) {
      loginUser(user);
    }
  }
};

// Päivitetään näkymä jatkuvasti
setInterval(() => {
  updateAllUsers();
  renderUsers();
}, 1000);