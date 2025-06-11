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
  const username = document.getElementById("reg-username").value.trim();

  if (!username) {
    alert("Anna käyttäjänimi!");
    return;
  }

  if (users.find(u => u.username === username)) {
    alert("Käyttäjänimi on jo käytössä!");
    return;
  }

  const newUser = {
    username,
    profileImage: selectedProfileImage,
    timeLeft: 0,
    lastUpdate: Date.now()
  };

  users.push(newUser);
  saveUsers();

  localStorage.setIt