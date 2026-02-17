console.log("TILBAKEMELDINGER JS LASTET");

import { auth, db } from "./firebase-refleksjon.js";
import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const list = document.getElementById("fbList");

onAuthStateChanged(auth, async (user) => {

  console.log("Auth state changed:", user);

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const q = query(
    collection(db, "refleksjoner", user.uid, "entries"),
    orderBy("week", "desc")
  );

  const snap = await getDocs(q);
  console.log("Antall docs:", snap.size);

  const entries = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(e => e.coachFeedback);

  if (entries.length === 0) {
    list.innerHTML = "Ingen tilbakemeldinger ennå.";
    return;
  }

  list.innerHTML = entries.map(e => `
    <div class="fb-entry">
      <h3>Uke ${e.week}</h3>
      <small>${e.dateNor || ""}</small>
      <p>${e.coachFeedback}</p>
    </div>
  `).join("");

});

const backBtn = document.getElementById("backBtn");

if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.location.href = "minside.html";
  });
}
