import { auth, db } from "./firebase-refleksjon.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const backBtn = document.getElementById("backBtn");

const trainingGoalDiv = document.getElementById("trainingGoalDisplay");
const matchBehaviourDiv = document.getElementById("matchBehaviourDisplay");
const updatedAtDiv = document.getElementById("updatedAtDisplay");

backBtn.addEventListener("click", () => {
  window.history.back();
});

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const planRef = doc(db, "utviklingsplan", user.uid);
  const planSnap = await getDoc(planRef);

if (!planSnap.exists()) {
  document.getElementById("utviklingsmaalDisplay").textContent =
    "Ingen utviklingsplan publisert ennå.";
  return;
}

  const plan = planSnap.data();

  trainingGoalDiv.innerText = plan.trainingGoal || "-";
  const utviklingsmaalDiv = document.getElementById("utviklingsmaalDisplay");
  utviklingsmaalDiv.textContent = plan.utviklingsmaal || "-";
  matchBehaviourDiv.innerText = plan.matchBehaviour || "-";

  if (plan.updatedAt?.toDate) {
    const date = plan.updatedAt.toDate();
    updatedAtDiv.textContent =
      "Sist oppdatert: " + date.toLocaleDateString("no-NO");
  }
});
