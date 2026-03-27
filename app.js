import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDocs,
  where,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const list = document.getElementById("list");
const addBtn = document.getElementById("addBtn");

const couponModal = document.getElementById("couponModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalBackdrop = document.querySelector(".modalBackdrop");

const nameInput = document.getElementById("nameInput");
const bet1 = document.getElementById("bet1");
const bet2 = document.getElementById("bet2");
const saveCouponBtn = document.getElementById("saveCouponBtn");

const detailModal = document.getElementById("detailModal");
const closeDetailBtn = document.getElementById("closeDetailBtn");
const detailBackdrop = document.querySelector(".detailBackdrop");
const detailName = document.getElementById("detailName");
const detailScore = document.getElementById("detailScore");
const detailStatus = document.getElementById("detailStatus");
const detailBreakdown = document.getElementById("detailBreakdown");

let participantsCache = [];
let editingParticipantId = null;

function openCouponModal() {
  couponModal.classList.remove("hidden");
  nameInput.focus();
}

function closeCouponModal() {
  couponModal.classList.add("hidden");
  resetCouponForm();
}

function resetCouponForm() {
  editingParticipantId = null;
  nameInput.value = "";
  bet1.value = "";
  bet2.value = "";
  nameInput.disabled = false;
}

function openDetailModal(data) {
  detailName.textContent = data.name || "Kupong";
  detailScore.textContent = `${data.score || 0} p`;
  detailStatus.textContent = data.lockedIn ? "LOCKED" : "ÖPPEN";

  detailBreakdown.innerHTML = `
    <div class="breakdownItem">
      <div class="breakdownTitle">Lag som gör första målet</div>
      <div class="breakdownMeta">Ditt val: ${labelFirstGoalTeam(data?.bets?.firstGoalTeam)}</div>
    </div>

    <div class="breakdownItem">
      <div class="breakdownTitle">Vinner hemmalaget matchen</div>
      <div class="breakdownMeta">Ditt val: ${labelHomeWin(data?.bets?.homeWin)}</div>
    </div>

    <div class="breakdownItem">
      <div class="breakdownTitle">Kupong</div>
      <div class="breakdownMeta">
        Tryck på “+ Kupong” och skriv samma namn om du vill öppna och uppdatera dina val.
      </div>
    </div>
  `;

  detailModal.classList.remove("hidden");
}

function closeDetailModal() {
  detailModal.classList.add("hidden");
}

addBtn.onclick = openCouponModal;
closeModalBtn.onclick = closeCouponModal;
modalBackdrop.onclick = closeCouponModal;

closeDetailBtn.onclick = closeDetailModal;
detailBackdrop.onclick = closeDetailModal;

nameInput.addEventListener("blur", tryLoadExistingCouponByName);

async function tryLoadExistingCouponByName() {
  const rawName = nameInput.value.trim();
  if (!rawName) return;

  const existing = findParticipantByName(rawName);
  if (!existing) return;

  editingParticipantId = existing.id;
  bet1.value = existing?.bets?.firstGoalTeam || "";
  bet2.value = existing?.bets?.homeWin || "";
}

saveCouponBtn.onclick = async () => {
  const name = normalizeName(nameInput.value);

  if (!name) {
    alert("Skriv ditt namn.");
    return;
  }

  if (!bet1.value || !bet2.value) {
    alert("Fyll i båda frågorna.");
    return;
  }

  const existing = findParticipantByName(name);

  if (existing) {
    const ref = doc(db, "participants", existing.id);

    await updateDoc(ref, {
      name,
      lockedIn: true,
      bets: {
        firstGoalTeam: bet1.value,
        homeWin: bet2.value
      }
    });
  } else {
    await addDoc(collection(db, "participants"), {
      name,
      lockedIn: true,
      score: 0,
      bets: {
        firstGoalTeam: bet1.value,
        homeWin: bet2.value
      },
      createdAt: serverTimestamp()
    });
  }

  closeCouponModal();
};

const participantsQuery = query(
  collection(db, "participants"),
  orderBy("score", "desc")
);

onSnapshot(participantsQuery, (snapshot) => {
  list.innerHTML = "";
  participantsCache = [];

  snapshot.forEach((docSnap) => {
    participantsCache.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  const leaderScore = participantsCache.length
    ? Math.max(...participantsCache.map(i => i.score || 0), 0)
    : 0;

  participantsCache.forEach((data) => {
    const score = data.score || 0;
    const pct = leaderScore > 0 ? (score / leaderScore) * 100 : 0;

    const div = document.createElement("button");
    div.className = "card";
    div.type = "button";

    div.innerHTML = `
      <div class="cardTop">
        <div>
          <div class="cardName">${escapeHtml(data.name || "-")}</div>
          <div class="cardMeta">${score} p</div>
        </div>
        <div class="badge">${data.lockedIn ? "LOCKED" : "ÖPPEN"}</div>
      </div>
      <div class="bar">
        <div class="barFill" style="width:${pct}%"></div>
      </div>
    `;

    div.onclick = () => openDetailModal(data);

    list.appendChild(div);
  });
});

function findParticipantByName(name) {
  const normalized = normalizeName(name);

  return participantsCache.find((p) => normalizeName(p.name) === normalized) || null;
}

function normalizeName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function labelFirstGoalTeam(value) {
  if (value === "home") return "Hemmalag";
  if (value === "away") return "Bortalag";
  return "-";
}

function labelHomeWin(value) {
  if (value === "yes") return "Ja";
  if (value === "no") return "Nej";
  return "-";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
