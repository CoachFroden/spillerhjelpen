import { auth, db } from "./firebase-refleksjon.js";

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  serverTimestamp,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

console.log("SPILLER REFLEKSJON LASTET");

let reflectionData = [];
let currentOpenIndex = null;

// ==============================
// AUTH CHECK
// ==============================

auth.onAuthStateChanged(async (user) => {

  if (!user) {
    console.log("Ingen bruker → sender til login");
    window.location.href = "login.html";
    return;
  }

  console.log("Innlogget som:", user.uid);

  document.getElementById("appBox").hidden = false;

  await loadHistory(user.uid);
  await loadSeasonGoal(user.uid);

});


// ==============================
// LAST HISTORIKK
// ==============================

async function loadHistory(uid) {

  const historyDiv = document.getElementById("historyList");
  historyDiv.innerHTML = "Laster...";

  const entriesRef = collection(db, "refleksjoner", uid, "entries");
  const q = query(entriesRef, orderBy("createdAt", "desc"));

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    historyDiv.innerHTML = "<p>Ingen refleksjoner enda.</p>";
    return;
  }

  historyDiv.innerHTML = "";

  reflectionData = [];

snapshot.forEach(docSnap => {
  reflectionData.push(docSnap.data());
});
populateWeekSelector();
}

function populateWeekSelector() {

  const selector = document.getElementById("weekSelector");
  selector.innerHTML = "";

  reflectionData.forEach((entry, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `Uke ${entry.week} (${entry.year})`;
    selector.appendChild(option);
  });

selector.addEventListener("change", (e) => {

  const selectedIndex = e.target.value;

  // Hvis tom verdi → lukk visningen
  if (selectedIndex === "") {
    document.getElementById("historyList").innerHTML = "";
    currentOpenIndex = null;
    return;
  }

  showReflection(selectedIndex);
  currentOpenIndex = selectedIndex;

});

  const defaultOption = document.createElement("option");
defaultOption.textContent = "Velg uke";
defaultOption.value = "";
defaultOption.disabled = false;
defaultOption.selected = true;
selector.prepend(defaultOption);

}

function showReflection(index) {

  const historyDiv = document.getElementById("historyList");
  const data = reflectionData[index];

historyDiv.innerHTML = `
  <div id="openReflection" class="history-card">
    <h3>Uke ${data.week} (${data.year})</h3>
    <p><strong>Innsats:</strong> ${data.effort}</p>
    <p><strong>Energi:</strong> ${data.energy}</p>
    <p><strong>Jobbet med sesongmål:</strong> ${data.workedOnSeasonGoal}</p>
    <p><strong>Fornøyd med:</strong> ${data.goodThing}</p>
    <p><strong>Neste uke:</strong> ${data.improveThing}</p>
    <p><strong>Til trener:</strong> ${data.coachNote}</p>
  </div>
`;

setTimeout(() => {
  const card = document.getElementById("openReflection");
  if (card) card.classList.add("show");
}, 10);

}

document.addEventListener("click", function (event) {

  const openCard = document.getElementById("openReflection");
  const selector = document.getElementById("weekSelector");

  if (!openCard) return;

  if (openCard.contains(event.target)) return;
  if (selector.contains(event.target)) return;

  openCard.classList.remove("show");
  openCard.classList.add("hide");

  setTimeout(() => {
    document.getElementById("historyList").innerHTML = "";
    selector.value = "";
  }, 250);

});

async function loadSeasonGoal(uid) {

  try {

    const goalRef = doc(db, "seasonGoals", uid);
    const goalSnap = await getDoc(goalRef);

    if (goalSnap.exists()) {

      const data = goalSnap.data();

      document.getElementById("seasonGoal").value = data.goal || "";

      if (data.updatedAt) {
        const date = data.updatedAt.toDate();
        document.getElementById("seasonUpdated").textContent =
          "Oppdatert: " + date.toLocaleDateString("no-NO");
      }

      document.getElementById("seasonBadge").textContent = "Satt";

    } else {

      document.getElementById("seasonBadge").textContent = "Ikke satt";

    }

  } catch (error) {
    console.error("Feil ved lasting av sesongmål:", error);
  }

}

// ==============================
// LAGRE NY REFLEKSJON
// ==============================

const weeklyForm = document.getElementById("weeklyForm");

if (weeklyForm) {

  weeklyForm.addEventListener("submit", async (e) => {

    e.preventDefault(); // VIKTIG – stopper reload

    const user = auth.currentUser;
    if (!user) return;

    const effort = document.getElementById("effort").value;
    const energy = document.getElementById("energy").value;
	const energyMap = { Lav: 1, Middels: 2, Høy: 3 };
    const energyValue = energyMap[energy];
	console.log("Energy:", energy, "=>", energyValue);
    const workedOnSeasonGoal = document.getElementById("workedOnSeasonGoal").value;
    const goodThing = document.getElementById("goodThing").value;
    const improveThing = document.getElementById("improveThing").value;
    const coachNote = document.getElementById("coachNote").value;

    try {

      const entriesRef = collection(db, "refleksjoner", user.uid, "entries");
	  
	  const now = new Date();
const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
const pastDaysOfYear = (now - firstDayOfYear) / 86400000;
const week = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

const year = new Date().getFullYear();

const selectedType = document.querySelector(
  'input[name="reflectionType"]:checked'
).value;

await addDoc(
  collection(db, "refleksjoner", user.uid, "entries"),
  {
    effort,
    energy,
    goodThing,
    improveThing,
    coachNote,
    workedOnSeasonGoal,
    year,
    week,
    type: selectedType,
    createdAt: serverTimestamp()
  }
);

      alert("Refleksjon lagret!");

      weeklyForm.reset();
      await loadHistory(user.uid);

    } catch (error) {
      console.error("Feil ved lagring:", error);
    }

  });

}

// ==============================
// SESONGMÅL
// ==============================

const saveSeasonBtn = document.getElementById("saveSeasonBtn");
console.log("saveSeasonBtn:", saveSeasonBtn);

const clearSeasonBtn = document.getElementById("clearSeasonBtn");
const seasonGoalInput = document.getElementById("seasonGoal");
const seasonStatus = document.getElementById("seasonStatus");

if (saveSeasonBtn) {

  saveSeasonBtn.addEventListener("click", async () => {

    const user = auth.currentUser;
    if (!user) return;

    const goalText = seasonGoalInput.value.trim();

    if (!goalText) {
      seasonStatus.textContent = "Du må skrive et mål.";
      return;
    }

    try {

      const goalRef = doc(db, "seasonGoals", user.uid);

      await setDoc(goalRef, {
        goal: goalText,
        updatedAt: serverTimestamp()
      });

      seasonStatus.textContent = "Mål lagret!";

    } catch (error) {
      console.error(error);
      seasonStatus.textContent = "Noe gikk galt.";
    }

  });
}

const goodThingLabel = document.getElementById("goodThingLabel");
const improveThingLabel = document.getElementById("improveThingLabel");

const typeRadios = document.querySelectorAll('input[name="reflectionType"]');

typeRadios.forEach((radio) => {
  radio.addEventListener("change", () => {

    // Hvis Kamp er valgt
    if (radio.value === "match" && radio.checked) {
      goodThingLabel.textContent =
        "Hvilken konkret situasjon i kampen løste du godt?";
      improveThingLabel.textContent =
        "I hvilken situasjon kunne du gjort noe annerledes?";
    }

    // Hvis Trening er valgt
    if (radio.value === "training" && radio.checked) {
      goodThingLabel.textContent = "Fornøyd med";
      improveThingLabel.textContent = "Neste uke";
    }

  });
});


// ==============================
// TILBAKE KNAPP
// ==============================

window.goBack = function () {
  window.location.href = "minside.html";
};
