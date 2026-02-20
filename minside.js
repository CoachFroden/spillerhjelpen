"use strict";

/* ================= FIREBASE CONFIG ================= */

const firebaseConfig = {
  apiKey: "AIzaSyAKZMu2HZPmmoZ1fFT7DNA9Q6ystbKEPgE",
  authDomain: "samnanger-g14-f10a1.firebaseapp.com",
  projectId: "samnanger-g14-f10a1",
  storageBucket: "samnanger-g14-f10a1.firebasestorage.app",
  messagingSenderId: "926427862844",
  appId: "1:926427862844:web:5e6d11bb689c802d01b039",
  measurementId: "G-EJL3YYC63R"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

/* ================= AUTH CHECK ================= */

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  // Finn spiller koblet til uid
  const snap = await db
    .collection("spillere")
    .where("uid", "==", user.uid)
    .get();

  if (snap.empty) {
    alert("Fant ingen spiller koblet til brukeren.");
    return;
  }

  const player = snap.docs[0].data();

  document.getElementById("player-name").textContent = player.navn;
  document.getElementById("player-role").textContent = player.rolle || "";

  // Sjekk om spilleren har fått tilbakemelding
  checkForFeedback(user.uid);
});

/* ================= SJEKK TILBAKEMELDINGER ================= */

async function checkForFeedback(uid) {
  const snapshot = await db
    .collection("refleksjoner")
    .doc(uid)
    .collection("entries")
    .get();

  let hasFeedback = false;

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.coachFeedback && data.coachFeedback.trim() !== "") {
      hasFeedback = true;
    }
  });

  const badge = document.getElementById("feedbackBadge");

  if (hasFeedback) {
    badge.classList.remove("hidden");
  }
}

/* ================= NAVIGASJON ================= */

window.goTo = function (page) {
  window.location.href = page;
};

/* ================= LOGG UT ================= */

document.getElementById("logoutBtn").onclick = () => {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
};
