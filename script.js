/* LIFE RESET — dashboard behavior + Anime Physique module */
(() => {
  "use strict";
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const STORE = "lifeResetDashboard_v3";
  const PHYSIQUE_STORE = "lifeResetPhysique_v1";
  const RPG_STORE = "lifeResetRPG_v1";
  const todayKey = () => new Date().toLocaleDateString("en-CA");
  const dateLabel = (d = new Date()) => d.toLocaleDateString(undefined, {month:"short", day:"numeric"});
  const safeParse = (v, fallback) => { try { return v ? JSON.parse(v) : fallback; } catch { return fallback; } };
  const defaultData = () => ({
    tasks: [
      {id: makeId(), text:"Review one topic", done:false, priority:"normal"},
      {id: makeId(), text:"Move for 15 minutes", done:false, priority:"normal"},
      {id: makeId(), text:"Plan tomorrow", done:false, priority:"normal"}
    ],
    habits:{}, daily:{}, focusMinutes:0, streak:0, lastActive:"", profile:{name:"",goal:25}, theme:"violet",
    musicFavorites:[], lastUpdated:new Date().toISOString()
  });
  function makeId(){ return (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
  let data = safeParse(localStorage.getItem(STORE), null) || defaultData();
  if (!Array.isArray(data.tasks)) data.tasks = [];
  if (!data.habits || typeof data.habits !== "object") data.habits = {};
  if (!data.daily || typeof data.daily !== "object") data.daily = {};
  if (!data.profile) data.profile = {name:"",goal:25};
  let rpgData = safeParse(localStorage.getItem(RPG_STORE), {xp:0, ledger:{}, unlocked:[]});
  if (!Number.isFinite(rpgData.xp)) rpgData.xp = 0;
  if (!rpgData.ledger || typeof rpgData.ledger !== "object") rpgData.ledger = {};
  if (!Array.isArray(rpgData.unlocked)) rpgData.unlocked = [];
  function saveRPG(){ try { localStorage.setItem(RPG_STORE, JSON.stringify(rpgData)); } catch(e){ console.warn("Could not save RPG progress",e); } }
  function awardXP(key, amount, label){
    if (rpgData.ledger[key]) return false;
    rpgData.ledger[key] = {amount, label, at:new Date().toISOString()};
    rpgData.xp += amount;
    saveRPG();
    renderRPG();
    toast(`+${amount} XP · ${label}`);
    return true;
  }
  function rpgLevel(xp=rpgData.xp){ return Math.floor(Math.max(0,xp)/100)+1; }
  function renderRPG(){
    const xp=Math.max(0,Number(rpgData.xp)||0), level=rpgLevel(xp), into=xp%100;
    const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value;};
    set("rpgLevel",`LVL ${level}`); set("rpgXP",xp);
    set("rpgNext",`${100-into} XP to Level ${level+1}`);
    const bar=$("#rpgBar"); if(bar)bar.style.width=`${into}%`;
    const todayPrefix=`${todayKey()}|`;
    const todayXP=Object.entries(rpgData.ledger).reduce((sum,[key,item])=>sum+(key.startsWith(todayPrefix)?Number(item.amount)||0:0),0);
    set("rpgTodayXP",todayXP); set("rpgStreak",`${calculateStreak()} day${calculateStreak()===1?"":"s"}`);
    const badges=[
      {id:"first-task",icon:"🌱",name:"First Step",desc:"Complete your first task",ok:Object.keys(rpgData.ledger).some(k=>k.includes("|task|"))},
      {id:"focus-five",icon:"⚡",name:"Focus Warrior",desc:"Finish 5 focus sessions",ok:Object.keys(rpgData.ledger).filter(k=>k.includes("|focus|")).length>=5},
      {id:"first-workout",icon:"🥊",name:"Training Arc",desc:"Log your first workout",ok:Object.keys(rpgData.ledger).some(k=>k.includes("|workout|"))},
      {id:"streak-seven",icon:"🔥",name:"Consistency",desc:"Reach a 7-day activity streak",ok:calculateStreak()>=7},
      {id:"level-five",icon:"👑",name:"Level Up",desc:"Reach Level 5",ok:level>=5}
    ];
    badges.forEach(b=>{if(b.ok&&!rpgData.unlocked.includes(b.id)){rpgData.unlocked.push(b.id);saveRPG();}});
    set("rpgAchievementCount",`${badges.filter(b=>rpgData.unlocked.includes(b.id)).length} / ${badges.length}`);
    const box=$("#rpgBadges");
    if(box){box.innerHTML="";badges.forEach(b=>{const el=document.createElement("div");el.className="rpg-badge"+(rpgData.unlocked.includes(b.id)?" unlocked":" locked");el.title=b.desc;el.innerHTML=`<span>${b.icon}</span><b>${b.name}</b><small>${rpgData.unlocked.includes(b.id)?"UNLOCKED":b.desc}</small>`;box.append(el);});}
    set("rpgMessage",into>=75?"Almost there — one more useful action!":into>=40?"Nice momentum. Keep stacking small wins.":"Your next level starts with one small win.");
  }
  let activeFilter = "all", searchTerm = "", prioritySort = false;
  let timerSeconds = 25 * 60, timerInterval = null, timerRunning = false;
  let audioContext = null, audioNodes = [], audioTimer = null, musicPlaying = false;
  let currentYt = null, pendingFavoriteUrl = "", pendingFavoriteTitle = "";
  const habits = ["water","move","learn","plan"];
  const habitNames = {water:"Drink water",move:"Move your body",learn:"Learn something",plan:"Plan tomorrow"};
  const quotes = [
    ["You don't need a perfect day. You need a start.","Life Reset"],
    ["Discipline is choosing what you want most over what you want now.","Life Reset"],
    ["Small progress is still progress. Keep going.","Life Reset"],
    ["Your future is built by the things you repeat.","Life Reset"],
    ["Do the next useful thing. Then do it again.","Life Reset"]
  ];
  function toast(message){
    const el = $("#toast"); if(!el) return;
    el.textContent = message; el.classList.add("show");
    clearTimeout(toast._timer); toast._timer = setTimeout(()=>el.classList.remove("show"),2400);
  }
  function save(){
    data.lastUpdated = new Date().toISOString();
    try { localStorage.setItem(STORE, JSON.stringify(data)); }
    catch(e){ console.warn("Could not save Life Reset data", e); }
    const status = $("#saveStatus"); if(status) status.textContent = "Saved just now · this browser";
  }
  function currentDay(){
    const key = todayKey();
    if(!data.daily[key]) data.daily[key] = {habits:{},focusMinutes:0};
    return data.daily[key];
  }
  function getDoneTasks(){ return data.tasks.filter(t=>t.done).length; }
  function getDoneHabits(){ const h=currentDay().habits || {}; return habits.filter(k=>h[k]).length; }
  function dayProgress(key=todayKey()){
    const d=data.daily[key] || {habits:{}};
    const tasks=(d.tasks || []);
    const taskTotal=tasks.length || data.tasks.length;
    const taskDone=tasks.length ? tasks.filter(t=>t.done).length : data.tasks.filter(t=>t.done).length;
    const habitObj=d.habits || {};
    const habitDone=habits.filter(k=>habitObj[k]).length;
    const total=taskTotal+habits.length;
    return total ? Math.round((taskDone+habitDone)/total*100) : 0;
  }
  function snapshotDay(){
    const d=currentDay();
    d.habits = Object.fromEntries(habits.map(k=>[k,!!d.habits?.[k]]));
    d.tasks = data.tasks.map(t=>({id:t.id,text:t.text,done:!!t.done,priority:t.priority||"normal"}));
    d.focusMinutes = d.focusMinutes || 0;
  }
  function renderTasks(){
    const list=$("#taskList"); if(!list) return;
    let tasks=data.tasks.filter(t=>(activeFilter==="all" || (activeFilter==="done" ? t.done : !t.done)) && t.text.toLowerCase().includes(searchTerm));
    if(prioritySort) tasks.sort((a,b)=>({high:0,normal:1,low:2}[a.priority||"normal"]-({high:0,normal:1,low:2}[b.priority||"normal"])) || Number(a.done)-Number(b.done));
    list.innerHTML="";
    tasks.forEach(task=>{
      const row=document.createElement("div"); row.className=`task ${task.done?"done":""} priority-${task.priority||"normal"}`; row.dataset.id=task.id;
      const check=document.createElement("button"); check.type="button"; check.className="check"; check.textContent="✓"; check.setAttribute("aria-label",task.done?"Mark task active":"Complete task");
      check.addEventListener("click",()=>{const wasDone=task.done;task.done=!task.done;if(!wasDone&&task.done)awardXP(`${todayKey()}|task|${task.id}`,10,"Task complete");snapshotDay();save();renderAll();});
      const txt=document.createElement("span"); txt.className="txt"; txt.textContent=task.text;
      const priority=document.createElement("span"); priority.className="priority-label"; priority.textContent=({high:"HIGH",normal:"NORMAL",low:"LOW"})[task.priority||"normal"];
      const edit=document.createElement("button"); edit.type="button"; edit.className="edit-task"; edit.textContent="Edit"; edit.setAttribute("aria-label","Edit task");
      edit.addEventListener("click",()=>{const next=prompt("Edit task",task.text); if(next===null)return; const val=next.trim(); if(!val){toast("Task text cannot be empty.");return;} task.text=val.slice(0,90); snapshotDay();save();renderAll();});
      const del=document.createElement("button"); del.type="button"; del.className="del"; del.textContent="×"; del.setAttribute("aria-label","Delete task");
      del.addEventListener("click",()=>{data.tasks=data.tasks.filter(t=>t.id!==task.id);snapshotDay();save();renderAll();toast("Task removed.");});
      row.append(check,txt,priority,edit,del); list.append(row);
    });
    $("#empty").hidden=tasks.length>0;
    $("#done").textContent=getDoneTasks(); $("#total").textContent=`/ ${data.tasks.length}`;
    $("#taskTag").textContent=`${data.tasks.length} task${data.tasks.length===1?"":"s"}`;
    $("#left").textContent=`${data.tasks.length-getDoneTasks()} tasks left`;
    $("#countAll").textContent=data.tasks.length;
    $("#countActive").textContent=data.tasks.filter(t=>!t.done).length;
    $("#countDone").textContent=getDoneTasks();
    $$(".filter").forEach(b=>b.classList.toggle("active",b.dataset.filter===activeFilter));
  }
  function renderHabits(){
    const d=currentDay();
    $$("[data-habit]").forEach(input=>{input.checked=!!d.habits?.[input.dataset.habit];});
    const count=getDoneHabits();
    $("#habitCount").textContent=`${count} of ${habits.length} habits complete`;
    $("#habitBar").style.width=`${count/habits.length*100}%`;
    const done=getDoneTasks(), total=data.tasks.length;
    $("#percent").textContent=total+habits.length?Math.round((done+count)/(total+habits.length)*100):0;
    $("#bar").style.width=`${$("#percent").textContent}%`;
  }
  function renderStats(){
    $("#today").textContent=new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});
    $("#minutes").textContent=Math.round(data.focusMinutes||0);
    $("#streak").textContent=calculateStreak();
    const name=(data.profile.name||"").trim();
    $("#welcomeLine").textContent=name?`WELCOME BACK, ${name.toUpperCase()}`:"YOUR NEXT CHAPTER STARTS HERE";
    $("#heroSubtitle").textContent=name?`${name}, small steps. Real progress. One day at a time.`:"Small steps. Real progress. One day at a time.";
    $("#focusGoal").value=String(data.profile.goal||25);
    $("#profileName").value=data.profile.name||"";
    $("#focusGoalLabel").textContent=`${Math.round(data.focusMinutes||0)} / ${data.profile.goal||25} min`;
    $("#focusGoalBar").style.width=`${Math.min(100,(data.focusMinutes||0)/(data.profile.goal||25)*100)}%`;
  }
  function calculateStreak(){
    let count=0; const d=new Date();
    for(let i=0;i<365;i++){
      const key=new Date(d.getFullYear(),d.getMonth(),d.getDate()-i).toLocaleDateString("en-CA");
      const day=data.daily[key];
      const complete=day && (habits.every(k=>day.habits?.[k]) || (day.tasks?.length && day.tasks.every(t=>t.done)));
      if(complete) count++; else if(i===0) continue; else break;
    }
    data.streak=count; return count;
  }
  function renderWeek(){
    const chart=$("#weekChart"); if(!chart)return;
    chart.innerHTML=""; const days=[];
    for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const key=d.toLocaleDateString("en-CA");days.push({d,key,p:dayProgress(key)});}
    const avg=Math.round(days.reduce((s,x)=>s+x.p,0)/7);
    $("#weekSummary").textContent=`${avg}% average`;
    const best=days.reduce((a,b)=>b.p>a.p?b:a,days[0]);
    $("#weekBest").textContent=best.p?`Best: ${best.d.toLocaleDateString(undefined,{weekday:"short"})} · ${best.p}%`:"Start with one small win today.";
    days.forEach(x=>{
      const col=document.createElement("div");col.className="weekday";
      const area=document.createElement("div");area.className="bararea";
      const value=document.createElement("span");value.className="barvalue";value.textContent=`${x.p}%`;
      const bar=document.createElement("i");bar.className="weekbar";bar.style.height=`${Math.max(3,x.p)}%`;
      area.append(value,bar);const label=document.createElement("small");label.textContent=x.d.toLocaleDateString(undefined,{weekday:"short"}).slice(0,2);
      col.append(area,label);chart.append(col);
    });
    const cal=$("#streakCalendar");cal.innerHTML="";
    days.forEach(x=>{
      const day=data.daily[x.key]||{habits:{}}, n=habits.filter(k=>day.habits?.[k]).length;
      const cell=document.createElement("div");cell.className="calday"+(x.key===todayKey()?" is-today":"");
      const box=document.createElement("i");box.className="calbox "+(n===habits.length?"all-done":n?"some-done":"not-done");
      const label=document.createElement("small");label.textContent=x.d.toLocaleDateString(undefined,{weekday:"short"}).slice(0,2);
      const num=document.createElement("b");num.textContent=x.d.getDate();
      cell.append(box,label,num);cal.append(cell);
    });
  }
  function renderAll(){snapshotDay();renderTasks();renderHabits();renderStats();renderWeek();renderRPG();save();}
  $("#taskForm").addEventListener("submit",e=>{
    e.preventDefault();const input=$("#taskInput"), text=input.value.trim();if(!text){input.focus();return;}
    data.tasks.push({id:makeId(),text:text.slice(0,90),done:false,priority:$("#taskPriority").value||"normal"});
    input.value="";snapshotDay();save();renderAll();toast("Task added.");
  });
  $("#taskSearch").addEventListener("input",e=>{searchTerm=e.target.value.trim().toLowerCase();renderTasks();});
  $$(".filter").forEach(b=>b.addEventListener("click",()=>{activeFilter=b.dataset.filter;renderTasks();}));
  $("#sortTasks").addEventListener("click",()=>{prioritySort=!prioritySort;$("#sortTasks").textContent=prioritySort?"↕ Natural order":"↕ Priority first";renderTasks();});
  $("#clearDone").addEventListener("click",()=>{data.tasks=data.tasks.filter(t=>!t.done);snapshotDay();save();renderAll();toast("Completed tasks cleared.");});
  $$("[data-habit]").forEach(input=>input.addEventListener("change",()=>{currentDay().habits[input.dataset.habit]=input.checked;if(input.checked)awardXP(`${todayKey()}|habit|${input.dataset.habit}`,15,"Habit complete");snapshotDay();save();renderAll();}));
  function resetDay(){currentDay().habits={};data.tasks.forEach(t=>t.done=false);snapshotDay();save();renderAll();toast("Today's checks reset.");}
  $("#resetDay").addEventListener("click",resetDay);$("#resetDayMobile").addEventListener("click",resetDay);
  $("#theme").addEventListener("click",()=>{document.body.classList.toggle("mint");data.theme=document.body.classList.contains("mint")?"mint":"violet";save();});
  if(data.theme==="mint")document.body.classList.add("mint");
  $("#profileForm").addEventListener("submit",e=>{e.preventDefault();data.profile.name=$("#profileName").value.trim().slice(0,32);data.profile.goal=Number($("#focusGoal").value)||25;save();renderStats();toast("Your setup is saved.");});
  $("#backupData").addEventListener("click",()=>{
    const blob=new Blob([JSON.stringify({version:3,exportedAt:new Date().toISOString(),data,physique:safeParse(localStorage.getItem(PHYSIQUE_STORE),null)},null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`life-reset-backup-${todayKey()}.json`;a.click();URL.revokeObjectURL(a.href);toast("Backup downloaded.");
  });
  $("#importData").addEventListener("click",()=>$("#importFile").click());
  $("#importFile").addEventListener("change",async e=>{
    const file=e.target.files?.[0];if(!file)return;
    try{
      const parsed=JSON.parse(await file.text());const incoming=parsed.data||parsed;
      if(!Array.isArray(incoming.tasks)||!incoming.profile)throw new Error("This doesn't look like a Life Reset backup.");
      data={...defaultData(),...incoming};if(parsed.physique)localStorage.setItem(PHYSIQUE_STORE,JSON.stringify(parsed.physique));save();renderAll();loadPhysique();toast("Backup imported.");
    }catch(err){toast(err.message||"Could not import this file.");}
    e.target.value="";
  });

  // Focus timer
  function updateClock(){const m=Math.floor(timerSeconds/60),s=timerSeconds%60;$("#clock").textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;$("#timerRing").style.background=`conic-gradient(var(--accent) ${Math.max(0,1-timerSeconds/(Number($("#selectedMinutes")?.value||25)*60))*360}deg,#303652 0deg)`;}
  function stopTimer(){clearInterval(timerInterval);timerInterval=null;timerRunning=false;$("#start").textContent="▶ Start focus";$("#timerStatus").textContent="READY WHEN YOU ARE";}
  $$(".presets button").forEach(b=>b.addEventListener("click",()=>{stopTimer();timerSeconds=Number(b.dataset.min)*60;$$(".presets button").forEach(x=>x.classList.toggle("selected",x===b));updateClock();}));
  $("#start").addEventListener("click",()=>{
    if(timerRunning){stopTimer();return;}
    timerRunning=true;$("#start").textContent="Ⅱ Pause";$("#timerStatus").textContent="FOCUS IN PROGRESS";
    timerInterval=setInterval(()=>{
      timerSeconds--;updateClock();
      if(timerSeconds<=0){stopTimer();const mins=Number($(".presets button.selected")?.dataset.min||25);data.focusMinutes=(data.focusMinutes||0)+mins;currentDay().focusMinutes=(currentDay().focusMinutes||0)+mins;save();renderStats();awardXP(`${todayKey()}|focus|${makeId()}`,20,"Focus session complete");toast(`Focus complete · ${mins} minutes logged.`);$("#timerStatus").textContent="SESSION COMPLETE";}
    },1000);
  });
  $("#resetTimer").addEventListener("click",()=>{stopTimer();timerSeconds=Number($(".presets button.selected")?.dataset.min||25)*60;updateClock();});
  updateClock();

  // Quote card
  const quote=quotes[new Date().getDate()%quotes.length];$("#dailyQuote").textContent=quote[0];$("#quoteAuthor").textContent=`— ${quote[1]}`;

  // YouTube player and saved favorites
  const ytMoods={phonk:"phonk drift music",slowed:"slowed reverb anime music",motivation:"gym motivation music",focus:"gaming focus music"};
  function videoIdFromUrl(url){
    try{
      const u=new URL(url);
      if(u.hostname.includes("youtu.be"))return u.pathname.split("/").filter(Boolean)[0]||null;
      if(u.hostname.includes("youtube.com")||u.hostname.includes("youtube-nocookie.com")){
        if(u.searchParams.get("v"))return u.searchParams.get("v");
        const parts=u.pathname.split("/").filter(Boolean);
        if(["embed","shorts","live"].includes(parts[0]))return parts[1]||null;
      }
    }catch{}
    return null;
  }
  function loadYoutube(url,title="Selected YouTube track"){
    let u;try{u=new URL(url);}catch{toast("Paste a valid YouTube link.");return;}
    const allowed=["youtube.com","www.youtube.com","m.youtube.com","music.youtube.com","youtu.be","www.youtu.be","youtube-nocookie.com","www.youtube-nocookie.com"];
    if(!allowed.includes(u.hostname)){toast("Please use a YouTube link.");return;}
    const id=videoIdFromUrl(url), playlist=u.searchParams.get("list");
    if(!id&&!playlist){toast("That link doesn't include a video or playlist ID.");return;}
    const embed=id?`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}${playlist?`?list=${encodeURIComponent(playlist)}`:""}`:`https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(playlist)}`;
    $("#ytPlayerFrame").innerHTML="";
    const frame=document.createElement("iframe");frame.src=embed;frame.title="YouTube music player";frame.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";frame.allowFullscreen=true;frame.referrerPolicy="strict-origin-when-cross-origin";
    $("#ytPlayerFrame").append(frame);$("#ytPlayerWrap").hidden=false;$("#ytPlayerTitle").textContent=title;$("#ytOpenLink").href=url;
    currentYt={url,title};$("#ytStatus").textContent="Player loaded. Press play inside the player when you're ready.";
    $("#miniMusicJump").hidden=false;$("#miniMusicLabel").textContent=title;$("#miniMusicJump").setAttribute("aria-label",`Jump to ${title}`);
  }
  $("#ytSearchForm").addEventListener("submit",e=>{
    e.preventDefault();const q=$("#ytSearch").value.trim()||ytMoods[$(".yt-mood.selected")?.dataset.ytMood||"phonk"];
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,"_blank","noopener");$("#ytStatus").textContent=`YouTube search opened for “${q}”. Paste a video link to play it here.`;
  });
  $$(".yt-mood").forEach(b=>b.addEventListener("click",()=>{$$(".yt-mood").forEach(x=>{x.classList.toggle("selected",x===b);x.setAttribute("aria-pressed",String(x===b));});$("#ytSearch").value=ytMoods[b.dataset.ytMood]||"";}));
  $("#ytLoad").addEventListener("click",()=>loadYoutube($("#ytUrl").value.trim()));
  $("#ytUrl").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();loadYoutube(e.target.value.trim());}});
  $("#ytClear").addEventListener("click",()=>{$("#ytPlayerFrame").innerHTML="";$("#ytPlayerWrap").hidden=true;currentYt=null;$("#miniMusicJump").hidden=true;});
  $("#miniMusicJump").addEventListener("click",()=>$("#music").scrollIntoView({behavior:"smooth",block:"start"}));
  $("#ytSaveFavorite").addEventListener("click",()=>{
    if(!currentYt){const url=$("#ytUrl").value.trim();if(url){const id=videoIdFromUrl(url);if(id||url.includes("list="))currentYt={url,title:"YouTube favorite"};} }
    if(!currentYt){toast("Load a YouTube video or playlist first.");return;}
    pendingFavoriteUrl=currentYt.url;pendingFavoriteTitle=currentYt.title||"YouTube favorite";
    $("#favoriteName").value=pendingFavoriteTitle;$("#favoriteModal").hidden=false;$("#favoriteName").focus();
  });
  function closeFavoriteModal(){$("#favoriteModal").hidden=true;pendingFavoriteUrl="";pendingFavoriteTitle="";}
  $("#favoriteModalClose").addEventListener("click",closeFavoriteModal);$("#favoriteCancel").addEventListener("click",closeFavoriteModal);
  $("#favoriteModal").addEventListener("click",e=>{if(e.target===$("#favoriteModal"))closeFavoriteModal();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#favoriteModal").hidden)closeFavoriteModal();});
  $("#favoriteForm").addEventListener("submit",e=>{
    e.preventDefault();const name=$("#favoriteName").value.trim();if(!name||!pendingFavoriteUrl)return;
    data.musicFavorites=data.musicFavorites||[];if(!data.musicFavorites.some(f=>f.url===pendingFavoriteUrl)){data.musicFavorites.unshift({id:makeId(),name:name.slice(0,70),url:pendingFavoriteUrl});}
    else data.musicFavorites=data.musicFavorites.map(f=>f.url===pendingFavoriteUrl?{...f,name:name.slice(0,70)}:f);
    save();renderFavorites();closeFavoriteModal();toast("Favorite saved.");
  });
  function renderFavorites(){
    const box=$("#ytFavorites");box.innerHTML="";
    (data.musicFavorites||[]).forEach(f=>{
      const row=document.createElement("div");row.className="yt-favorite-row";
      const play=document.createElement("button");play.type="button";play.className="yt-favorite-play";play.textContent=`♫ ${f.name}`;play.title=f.name;play.addEventListener("click",()=>{loadYoutube(f.url,f.name);$("#music").scrollIntoView({behavior:"smooth",block:"start"});});
      const remove=document.createElement("button");remove.type="button";remove.className="yt-favorite-remove";remove.textContent="×";remove.setAttribute("aria-label",`Remove ${f.name}`);remove.addEventListener("click",()=>{data.musicFavorites=data.musicFavorites.filter(x=>x.id!==f.id);save();renderFavorites();});
      row.append(play,remove);box.append(row);
    });
  }
  renderFavorites();

  // Web Audio soundscapes — starts only after an explicit user action.
  const moods={
    lofi:{name:"Lo-fi flow",freq:220,interval:2.7,type:"sine"},
    rain:{name:"Rainy focus",freq:165,interval:3.4,type:"triangle"},
    cinematic:{name:"Epic drive",freq:110,interval:1.8,type:"sawtooth"},
    nature:{name:"Calm nature",freq:261.6,interval:4.1,type:"sine"}
  };
  let selectedMood="lofi", volume=.35;
  function stopAudio(){
    clearInterval(audioTimer);audioTimer=null;audioNodes.forEach(n=>{try{n.stop?.();n.disconnect?.();}catch{}});audioNodes=[];
    musicPlaying=false;$(".music-panel").classList.remove("is-playing");$("#musicToggle").textContent="▶ Play soundscape";$("#musicToggle").setAttribute("aria-pressed","false");$("#musicStatus").textContent="Paused";
  }
  function playAudio(){
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC){toast("Your browser does not support generated audio.");return;}
    if(!audioContext)audioContext=new AC();audioContext.resume();
    stopAudio();musicPlaying=true;$(".music-panel").classList.add("is-playing");$("#musicToggle").textContent="Ⅱ Pause soundscape";$("#musicToggle").setAttribute("aria-pressed","true");$("#musicStatus").textContent="Playing · generated locally";
    const mood=moods[selectedMood];
    const createTone=(freq,type="sine",gain=.035)=>{
      const osc=audioContext.createOscillator(),g=audioContext.createGain();
      osc.type=type;osc.frequency.value=freq;g.gain.value=gain*volume;osc.connect(g);g.connect(audioContext.destination);osc.start();audioNodes.push(osc,g);
    };
    createTone(mood.freq,mood.type,.035);createTone(mood.freq*1.5,"sine",.012);
    audioTimer=setInterval(()=>{if(!musicPlaying)return;const osc=audioContext.createOscillator(),g=audioContext.createGain();osc.type="sine";osc.frequency.value=mood.freq*(1+Math.floor(Math.random()*5)/8);g.gain.setValueAtTime(.0001,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(Math.max(.0002,.012*volume),audioContext.currentTime+.08);g.gain.exponentialRampToValueAtTime(.0001,audioContext.currentTime+1.5);osc.connect(g);g.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+1.6);audioNodes.push(osc,g);},mood.interval*1000);
  }
  $$(".mood-button").forEach(b=>b.addEventListener("click",()=>{$$(".mood-button").forEach(x=>{x.classList.toggle("selected",x===b);x.setAttribute("aria-pressed",String(x===b));});selectedMood=b.dataset.mood;$("#musicTrackName").textContent=moods[selectedMood].name;if(musicPlaying)playAudio();else $("#musicStatus").textContent="Ready when you are";}));
  $("#musicToggle").addEventListener("click",()=>musicPlaying?stopAudio():playAudio());
  $("#musicVolume").addEventListener("input",e=>{volume=Number(e.target.value)/100;$("#musicVolumeValue").textContent=`${e.target.value}%`;if(musicPlaying)playAudio();});

  // Anime Physique: character reference is fixed; only training variables adapt.
  const physiqueProfiles={
    garou:{name:"Garou",chip:"ATHLETIC BUILD",desc:"A lean, athletic reference emphasizing movement quality, relative strength and conditioning.",focus:["Shoulders & back","Core stability","Leg strength","Conditioning"],bias:"athletic"},
    saitama:{name:"Saitama",chip:"BODYWEIGHT BASE",desc:"A simple, repeatable fitness reference centered on basic strength, steady conditioning and consistency.",focus:["Push strength","Leg endurance","Core control","Cardio base"],bias:"bodyweight"},
    goku:{name:"Goku",chip:"BALANCED POWER",desc:"A muscular, balanced reference emphasizing progressive strength, full-body training and recovery.",focus:["Chest & back","Shoulders & arms","Leg strength","Core & conditioning"],bias:"power"},
    toji:{name:"Toji",chip:"ATHLETIC STRENGTH",desc:"An athletic reference emphasizing strength, grip, mobility and conditioning.",focus:["Back & shoulders","Grip strength","Core stability","Conditioning"],bias:"athletic"},
    vegeta:{name:"Vegeta",chip:"POWER BUILD",desc:"A strength-focused reference emphasizing progressive resistance, balanced muscle development and recovery.",focus:["Shoulders & chest","Back strength","Leg strength","Core stability"],bias:"power"}
    ,asta:{name:"Asta",chip:"BODYWEIGHT ATHLETIC",desc:"A bodyweight-focused reference emphasizing repeatable strength, athletic movement, trunk control and conditioning.",focus:["Push strength","Leg endurance","Core stability","Conditioning"],bias:"athletic"}
    ,broly:{name:"Broly",chip:"MUSCULAR STRENGTH",desc:"A muscular reference emphasizing gradual resistance progression, balanced muscle development and adequate recovery.",focus:["Chest & shoulders","Back strength","Leg strength","Core stability"],bias:"power"}
    ,baki:{name:"Baki Hanma",chip:"COMBAT ATHLETIC",desc:"A combat-athletic reference emphasizing total-body strength, mobility, conditioning and controlled bodyweight work.",focus:["Full-body strength","Core & grip","Mobility","Conditioning"],bias:"athletic"}
  };
  let physiqueData=safeParse(localStorage.getItem(PHYSIQUE_STORE),{character:"garou",experience:"beginner",equipment:"home",days:4,duration:30,history:[]});
  if(!physiqueData.history)physiqueData.history=[];
  if(!physiqueData.completed)physiqueData.completed={};
  function savePhysique(){localStorage.setItem(PHYSIQUE_STORE,JSON.stringify(physiqueData));}
  function setText(id,text){const el=$("#"+id);if(el)el.textContent=text;}
  function workoutTemplate(character,equipment,experience,duration){
    const profiles={
      garou:[
        ["Day 1 · Upper body","Push-ups, backpack rows, pike push-ups, plank"],
        ["Day 2 · Lower body","Squats, reverse lunges, glute bridges, calf raises"],
        ["Day 3 · Conditioning","Brisk intervals, mountain climbers, dead bugs"],
        ["Day 4 · Full body","Incline push-ups, rows, split squats, side plank"],
        ["Day 5 · Optional mobility","Easy walk, hip mobility, shoulder mobility"]
      ],
      saitama:[
        ["Day 1 · Strength A","Squats, incline push-ups, glute bridges, dead bugs"],
        ["Day 2 · Cardio + mobility","Brisk walk, step-ups, gentle full-body mobility"],
        ["Day 3 · Strength B","Reverse lunges, wall/incline push-ups, bird dogs"],
        ["Day 4 · Easy conditioning","Walk or cycle at a pace where you can talk"],
        ["Day 5 · Optional full body","Squats, push-ups variation, calf raises, plank"]
      ],
      goku:[
        ["Day 1 · Upper body","Push-ups or bench press, rows, shoulder press, curls"],
        ["Day 2 · Lower body","Squat variation, hip hinge, lunges, calf raises"],
        ["Day 3 · Recovery","Easy walk, mobility, relaxed stretching"],
        ["Day 4 · Upper + core","Incline press, pulldown/rows, lateral raises, plank"],
        ["Day 5 · Full body","Squat, row, push movement, carry or dead bug"]
      ],
      toji:[
        ["Day 1 · Upper strength","Push-ups or bench press, rows, shoulder press, plank"],
        ["Day 2 · Lower + core","Squats, reverse lunges, glute bridges, dead bugs"],
        ["Day 3 · Conditioning","Brisk intervals, step-ups, controlled mountain climbers"],
        ["Day 4 · Grip + full body","Rows, carries or towel holds, split squats, side plank"],
        ["Day 5 · Optional mobility","Easy walk, shoulder and hip mobility"]
      ],
      vegeta:[
        ["Day 1 · Push strength","Push-ups or bench press, shoulder press, triceps extensions"],
        ["Day 2 · Legs","Squat variation, hip hinge, reverse lunges, calf raises"],
        ["Day 3 · Recovery","Easy walk, relaxed stretching, mobility"],
        ["Day 4 · Pull + core","Rows, pulldown, curls, plank"],
        ["Day 5 · Full body","Squat, row, push movement, dead bug"]
      ],
      asta:[
        ["Day 1 · Push + core","Push-ups, incline push-ups, dead bugs, plank"],
        ["Day 2 · Legs","Squats, reverse lunges, glute bridges, calf raises"],
        ["Day 3 · Conditioning","Brisk walk intervals, step-ups, gentle mountain climbers"],
        ["Day 4 · Full body","Push-ups, squats, rows if available, side plank"],
        ["Day 5 · Optional mobility","Easy walk, shoulder and hip mobility"]
      ],
      broly:[
        ["Day 1 · Upper strength","Push-ups or bench press, rows, shoulder press"],
        ["Day 2 · Lower strength","Squats, hip hinge, reverse lunges, calf raises"],
        ["Day 3 · Recovery","Easy walk, relaxed stretching, mobility"],
        ["Day 4 · Upper + arms","Incline push-ups/press, rows, curls, triceps work"],
        ["Day 5 · Full body","Squat, row, push movement, dead bug"]
      ],
      baki:[
        ["Day 1 · Full-body strength","Push-ups, squats, rows if available, plank"],
        ["Day 2 · Conditioning","Brisk intervals, step-ups, controlled mountain climbers"],
        ["Day 3 · Mobility + recovery","Easy walk, hip mobility, shoulder mobility"],
        ["Day 4 · Strength + core","Split squats, push-ups, rows, side plank"],
        ["Day 5 · Athletic conditioning","Low-impact intervals, carries if available, dead bugs"]
      ]
    };
    let list=profiles[character].slice();
    const n=Number(physiqueData.days)||4;
    if(n===3) list=[list[0],list[1],list[3]];
    if(n===4) list=list.slice(0,4);
    if(n===5) list=list.slice(0,5);
    const difficulty={beginner:"2 sets · controlled pace",intermediate:"3 sets · steady pace",advanced:"3–4 sets · challenging but clean reps"}[experience];
    const equipmentText=equipment==="home"?"Home / no equipment":equipment==="basic"?"Basic equipment": "Gym variations";
    return list.map((item,i)=>{
      let exercises=item[1];
      if(equipment==="home")exercises=exercises.replace(/bench press/g,"push-up variation").replace(/shoulder press/g,"pike push-up").replace(/pulldown\/rows/g,"backpack rows").replace(/rows/g,"backpack rows").replace(/cycle/g,"walk");
      if(equipment==="basic")exercises=exercises.replace(/backpack rows/g,"dumbbell or band rows").replace(/push-ups or bench press/g,"push-ups or dumbbell press").replace(/pulldown\/rows/g,"band pulldowns or rows");
      if(equipment==="gym")exercises=exercises.replace(/backpack rows/g,"cable or machine rows").replace(/push-ups or bench press/g,"bench press or push-ups").replace(/hip hinge/g,"Romanian deadlift");
      let sets=duration==="20"?"2 sets · short rests":duration==="45"?"3 sets · 60–90 sec rest":duration==="60"?"3–4 sets · 60–120 sec rest":difficulty;
      if(experience==="beginner")sets=duration==="20"?"1–2 sets · comfortable pace":`2 sets · 60–90 sec rest`;
      return {title:item[0],exercises,meta:`${sets} · ${equipmentText}`};
    });
  }
  function renderPhysique(){
    const profile=physiqueProfiles[physiqueData.character]||physiqueProfiles.garou;
    $$(".physique-character").forEach(b=>{const on=b.dataset.character===physiqueData.character;b.classList.toggle("selected",on);b.setAttribute("aria-pressed",String(on));});
    setText("physiqueLevelChip",profile.chip);setText("physiqueCharacterName",profile.name);setText("physiqueDescription",profile.desc);
    const characterImage=$("#physiqueCharacterImage");
    if(characterImage){
      const key=physiqueData.character;
      characterImage.onerror=()=>{
        if(key==="baki" && !characterImage.dataset.bakiFallbackTried){
          characterImage.dataset.bakiFallbackTried="1";
          characterImage.src="baki-hanma-reference.jpg";
          return;
        }
        characterImage.style.display="none";
        const wrap=characterImage.closest(".physique-hero-image");
        if(wrap){
          let msg=wrap.querySelector(".physique-image-fallback");
          if(!msg){msg=document.createElement("div");msg.className="physique-image-fallback";msg.textContent="Character image missing — upload the reference JPG beside index.html.";wrap.append(msg);}
          msg.style.display="block";
        }
      };
      characterImage.onload=()=>{
        characterImage.style.display="block";
        const wrap=characterImage.closest(".physique-hero-image");
        const msg=wrap&&wrap.querySelector(".physique-image-fallback");
        if(msg)msg.style.display="none";
      };
      characterImage.dataset.bakiFallbackTried="";
      characterImage.style.display="block";
      characterImage.src=(key==="baki"?"baki-reference.jpg":`${key}-reference.jpg`);
      characterImage.alt=`${profile.name} character reference`;
      setText("physiqueImageCaption",`${profile.name.toUpperCase()} · CHARACTER REFERENCE`);
    }
    const focus=$("#physiqueFocusList");focus.innerHTML="";profile.focus.forEach(t=>{const s=document.createElement("span");s.textContent=t;focus.append(s);});
    setText("physiqueScheduleTag",`${physiqueData.days} DAYS`);
    const workout=$("#physiqueWorkout");workout.innerHTML="";
    const todayKey=new Date().toISOString().slice(0,10);
    const planDays=workoutTemplate(physiqueData.character,physiqueData.equipment,physiqueData.experience,String(physiqueData.duration));
    let completedToday=0;
    planDays.forEach(day=>{
      const key=`${todayKey}|${physiqueData.character}|${day.title}`;
      const done=Boolean(physiqueData.completed[key]);
      if(done)completedToday++;
      const el=document.createElement("div");el.className=`workout-day${done?" is-complete":""}`;
      const top=document.createElement("div");top.className="workout-day-top";
      const b=document.createElement("b");b.textContent=day.title;
      const checkLabel=document.createElement("label");checkLabel.className="workout-complete";
      const check=document.createElement("input");check.type="checkbox";check.checked=done;check.setAttribute("aria-label",`Mark ${day.title} complete`);
      const checkText=document.createElement("span");checkText.textContent=done?"Completed":"Complete";
      check.addEventListener("change",()=>{
        if(check.checked){
          physiqueData.completed[key]=true;
          physiqueData.history.unshift({id:makeId(),date:new Date().toISOString(),character:physiqueData.character,type:day.title,effort:"Completed"});
          physiqueData.history=physiqueData.history.slice(0,100);
          toast("Workout day completed. Nice work!");
        }else{
          delete physiqueData.completed[key];
          const match=physiqueData.history.findIndex(item=>item.type===day.title&&item.effort==="Completed"&&item.date.slice(0,10)===todayKey&&item.character===physiqueData.character);
          if(match>=0)physiqueData.history.splice(match,1);
          toast("Workout marked incomplete.");
        }
        savePhysique();renderPhysique();
      });
      checkLabel.append(check,checkText);
      const small=document.createElement("small");small.textContent=done?"DONE":"PLAN";
      top.append(b,checkLabel,small);
      const p=document.createElement("p");p.textContent=`${day.exercises}. ${day.meta}. Warm up for 5 minutes and stop with a few good reps left.`;
      el.append(top,p);workout.append(el);
    });
    setText("physiqueDailyProgressText",`${completedToday} of ${planDays.length} completed today`);
    const progressBar=$("#physiqueDailyProgress");
    if(progressBar)progressBar.style.width=`${planDays.length?Math.round(completedToday/planDays.length*100):0}%`;
    const meals=[
      ["🌅","Breakfast","Idli or dosa with sambar; or oats/poha plus curd, milk or eggs if you eat them."],
      ["🍱","Lunch","Rice or roti, dal/rajma/chole, vegetables and curd or another protein source."],
      ["🥜","Snack","Banana, roasted chana, peanuts, milk/curd or seasonal fruit."],
      ["🌙","Dinner","Roti or rice with dal/paneer/soy/tofu/eggs/chicken (as preferred) and vegetables."]
    ];
    const diet=$("#physiqueDiet");diet.innerHTML="";
    meals.forEach(m=>{const row=document.createElement("div");row.className="diet-row";const icon=document.createElement("span");icon.className="diet-icon";icon.textContent=m[0];const body=document.createElement("div");const b=document.createElement("b");b.textContent=m[1];const p=document.createElement("p");p.textContent=m[2];body.append(b,p);row.append(icon,body);diet.append(row);});
    const history=physiqueData.history||[], weekAgo=Date.now()-7*86400000;
    setText("physiqueWorkoutCount",history.length);setText("physiqueWeekCount",history.filter(x=>new Date(x.date).getTime()>=weekAgo).length);
    setText("physiqueProgressTag",`${history.length} WORKOUT${history.length===1?"":"S"}`);
    setText("physiqueConsistency",history.length?`${Math.min(100,Math.round(history.length/12*100))}% to 12-session milestone`:"Start today");
    const box=$("#physiqueHistory");box.innerHTML="";
    history.slice(0,6).forEach(item=>{const row=document.createElement("div");row.className="physique-history-row";const left=document.createElement("b");left.textContent=item.type;const right=document.createElement("span");right.textContent=`${dateLabel(new Date(item.date))} · ${item.effort}`;row.append(left,right);box.append(row);});
    if(!history.length){const p=document.createElement("p");p.className="physique-diet-note";p.textContent="Your first logged session will appear here. Start with a comfortable level and build gradually.";box.append(p);}
  }
  function loadPhysique(){
    $("#physiqueExperience").value=physiqueData.experience||"beginner";$("#physiqueEquipment").value=physiqueData.equipment||"home";
    $("#physiqueDays").value=String(physiqueData.days||4);$("#physiqueDuration").value=String(physiqueData.duration||30);renderPhysique();
  }
  $$(".physique-character").forEach(b=>b.addEventListener("click",()=>{physiqueData.character=b.dataset.character;savePhysique();renderPhysique();}));
  $("#generatePhysiquePlan").addEventListener("click",()=>{
    physiqueData.experience=$("#physiqueExperience").value;physiqueData.equipment=$("#physiqueEquipment").value;
    physiqueData.days=Number($("#physiqueDays").value);physiqueData.duration=Number($("#physiqueDuration").value);
    savePhysique();renderPhysique();toast("Your training plan has been updated.");
  });
  $("#logPhysiqueWorkout").addEventListener("click",()=>{
    physiqueData.history.unshift({id:makeId(),date:new Date().toISOString(),character:physiqueData.character,type:$("#physiqueWorkoutType").value,effort:$("#physiqueEffort").value});
    physiqueData.history=physiqueData.history.slice(0,100);
    awardXP(`${todayKey()}|workout|${makeId()}`,30,"Workout logged");
    savePhysique();renderPhysique();toast("Workout logged. Consistency wins.");
  });
  loadPhysique();
  renderRPG();

  snapshotDay();renderAll();save();
})();
/* Character reference asset mapping */
const physiqueReferenceAssets = {
  asta: "asta-reference.jpg",
  broly: "broly-reference.jpg",
  baki: "baki-hanma-reference.jpg",
  toji: "toji-reference.jpg",
  vegeta: "vegeta-reference.jpg",
  goku: "goku-reference.jpg",
  garou: "garou-reference.jpg"
};
