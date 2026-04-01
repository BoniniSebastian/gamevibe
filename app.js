// 🧠 PROFIL
let currentProfile = localStorage.getItem("profile") || "SB";

const sbBtn = document.getElementById("sbBtn");
const jaBtn = document.getElementById("jaBtn");
const profileCircle = document.getElementById("profileCircle");

function setProfile(p){
  currentProfile = p;
  localStorage.setItem("profile", p);
  profileCircle.innerText = p;

  sbBtn.classList.remove("active");
  jaBtn.classList.remove("active");

  if(p === "SB") sbBtn.classList.add("active");
  else jaBtn.classList.add("active");

  loadCalendar();
}

sbBtn.onclick = ()=> setProfile("SB");
jaBtn.onclick = ()=> setProfile("JA");

// 🕒 KLOCKA
function updateClock(){
  const now = new Date();
  document.getElementById("clock").innerText =
    now.getHours().toString().padStart(2,'0') + ":" +
    now.getMinutes().toString().padStart(2,'0');
}
setInterval(updateClock,1000);
updateClock();

// ⏱ TIMER
const presets = [2,5,15,25];
let index = 1;

const timer = document.getElementById("timerText");

timer.onclick = ()=>{
  index = (index+1)%presets.length;
  timer.innerText = presets[index] + "m";
};

// 📅 KALENDER
const urls = {
  SB: "https://calendar.google.com/calendar/ical/ericssonbonini%40gmail.com/public/basic.ics",
  JA: "" // fyll sen
};

async function loadCalendar(){
  const url = urls[currentProfile];
  if(!url) return;

  const res = await fetch(url);
  const text = await res.text();

  const events = text.split("BEGIN:VEVENT").slice(1);

  const container = document.getElementById("events");
  container.innerHTML = "";

  const today = new Date().toISOString().slice(0,8);

  events.forEach(e=>{
    const date = e.match(/DTSTART:(\d+)/);
    const summary = e.match(/SUMMARY:(.*)/);

    if(date && summary){
      if(date[1].startsWith(today)){
        const div = document.createElement("div");
        div.innerText = summary[1];
        container.appendChild(div);
      }
    }
  });
}

// INIT
setProfile(currentProfile);