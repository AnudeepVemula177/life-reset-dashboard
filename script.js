const $=id=>document.getElementById(id),KEY="lifeResetV3",HISTORY="lifeResetHistoryV3";
function localDate(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
const todayKey=localDate(),defaults=()=>({date:todayKey,tasks:[{id:1,text:"Study or learn for 25 minutes",done:false},{id:2,text:"Move your body for a little while",done:false},{id:3,text:"Plan tomorrow before sleeping",done:false}],habits:{water:false,move:false,learn:false,plan:false},focusSeconds:0,streak:0});
function load(){try{let s=JSON.parse(localStorage.getItem(KEY));if(!s)return defaults();if(s.date!==todayKey){let oldHistory=JSON.parse(localStorage.getItem(HISTORY))||{};const oldHabits=s.habits&&typeof s.habits==='object'?s.habits:{},oldHabitsDone=Object.values(oldHabits).filter(Boolean).length;oldHistory[s.date]={...(oldHistory[s.date]||{}),tasksDone:(Array.isArray(s.tasks)?s.tasks:[]).filter(t=>t&&t.done).length,tasksTotal:Array.isArray(s.tasks)?s.tasks.length:0,habitsDone:oldHabitsDone,focusMinutes:Math.floor(Math.max(0,Number(s.focusSeconds)||0)/60),completeHabits:Object.keys(oldHabits).length>=4&&oldHabitsDone>=4};localStorage.setItem(HISTORY,JSON.stringify(oldHistory));return defaults()}return {...defaults(),...s,habits:{...defaults().habits,...s.habits}}}catch{return defaults()}}
function readHistory(){try{return JSON.parse(localStorage.getItem(HISTORY))||{}}catch{return {}}}
let state=load(),history=readHistory(),duration=1500,left=1500,interval=null,running=false,filter="all",prioritySort=false,taskQuery="",profile={name:"",focusGoal:25};
try{profile={...profile,...JSON.parse(localStorage.getItem("lifeResetProfile")||"{}")} }catch{}
function save(){try{state.date=todayKey;history[todayKey]={...(history[todayKey]||{}),tasksDone:state.tasks.filter(t=>t.done).length,tasksTotal:state.tasks.length,habitsDone:Object.values(state.habits).filter(Boolean).length,focusMinutes:Math.floor(state.focusSeconds/60),completeHabits:Object.values(state.habits).every(Boolean)};localStorage.setItem(KEY,JSON.stringify(state));localStorage.setItem(HISTORY,JSON.stringify(history));$("saveStatus").textContent="Progress saved on this browser ✓"}catch{$("saveStatus").textContent="Browser storage unavailable"}}
function toast(s){let t=$("toast");t.textContent=s;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),2100)}
function esc(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function computeStreak(){let n=0,d=new Date();const qualifies=k=>{const h=history[k];return !!(h&&(h.completeHabits||h.habitsDone>=4))};if(!qualifies(todayKey))d.setDate(d.getDate()-1);for(let i=0;i<366;i++){if(!qualifies(localDate(d)))break;n++;d.setDate(d.getDate()-1)}return n}
function renderInsights(){const chart=$("weekChart"),cal=$("streakCalendar");if(!chart||!cal)return;chart.innerHTML="";cal.innerHTML="";let days=[],base=new Date();base.setDate(base.getDate()-6);let total=0,best={label:"",pct:-1};for(let i=0;i<7;i++){let d=new Date(base);d.setDate(base.getDate()+i);let key=localDate(d),h=history[key]||{},isToday=key===todayKey;let tasksDone=isToday?state.tasks.filter(t=>t.done).length:(h.tasksDone||0),tasksTotal=isToday?state.tasks.length:(h.tasksTotal||0),habitsDone=isToday?Object.values(state.habits).filter(Boolean).length:(h.habitsDone||0),focus=isToday?Math.floor(state.focusSeconds/60):(h.focusMinutes||0);let taskPct=tasksTotal?tasksDone/tasksTotal:0,habitPct=habitsDone/4,focusPct=Math.min(focus/25,1),pct=Math.round((taskPct*0.45+habitPct*0.4+focusPct*0.15)*100);if(!tasksTotal&&!habitsDone&&!focus)pct=0;days.push({key,label:d.toLocaleDateString(undefined,{weekday:"short"}),day:d.getDate(),pct,habitsDone});total+=pct;if(pct>best.pct)best={label:d.toLocaleDateString(undefined,{weekday:"long"}),pct};let el=document.createElement("div");el.className="weekday";el.innerHTML=`<div class="bararea"><span class="barvalue">${pct}%</span><i class="weekbar" style="height:${Math.max(pct,3)}%"></i></div><small>${d.toLocaleDateString(undefined,{weekday:"short"})}</small>`;el.title=`${key}: ${pct}% progress · ${focus} focus min`;chart.appendChild(el)}$("weekSummary").textContent=Math.round(total/7)+"% average";$("weekBest").textContent=best.pct>0?"Best day: "+best.label+" ("+best.pct+"%)":"Your first win is waiting today.";days.forEach(x=>{let e=document.createElement("div");e.className="calday"+(x.key===todayKey?" is-today":"");e.innerHTML=`<span class="calbox ${x.habitsDone>=4?"all-done":x.habitsDone>0?"some-done":"not-done"}" title="${x.habitsDone} of 4 habits"></span><small>${x.label}</small><b>${x.day}</b>`;cal.appendChild(e)})}
function render(){let list=$("taskList");list.innerHTML="";let query=taskQuery.trim().toLowerCase();let shown=state.tasks.filter(t=>(filter==="all"||(filter==="active"&&!t.done)||(filter==="done"&&t.done))&&(!query||t.text.toLowerCase().includes(query)));if(prioritySort){const rank={high:0,normal:1,low:2};shown.sort((a,b)=>(a.done-b.done)||((rank[a.priority]??1)-(rank[b.priority]??1)))}shown.forEach(t=>{let row=document.createElement("div");row.className="task"+(t.done?" done":"")+" priority-"+(t.priority||"normal");row.innerHTML=`<button class="check" aria-label="Toggle task completion">✓</button><span class="txt">${esc(t.text)}</span><span class="priority-label">${({high:"HIGH",normal:"NORMAL",low:"LOW"})[t.priority||"normal"]}</span><button class="edit-task" type="button" aria-label="Edit task">Edit</button><button class="del" aria-label="Delete task">×</button>`;row.querySelector(".check").onclick=()=>{t.done=!t.done;update();toast(t.done?"Task completed — nice work!":"Task marked active")};row.querySelector(".edit-task").onclick=()=>{const next=prompt("Edit your task",t.text);if(next===null)return;const clean=next.trim();if(!clean){toast("Task cannot be empty");return}t.text=clean;update();toast("Task updated ✓")};row.querySelector(".del").onclick=()=>{state.tasks=state.tasks.filter(x=>x.id!==t.id);update();toast("Task removed")};list.appendChild(row)});$("countAll").textContent=state.tasks.length;$("countActive").textContent=state.tasks.filter(t=>!t.done).length;$("countDone").textContent=state.tasks.filter(t=>t.done).length;$("empty").hidden=shown.length>0;$("empty").textContent=state.tasks.length===0?"No tasks yet. Add one small goal to begin.":"No tasks in this filter.";let d=state.tasks.filter(t=>t.done).length,p=state.tasks.length?Math.round(d/state.tasks.length*100):0;$("done").textContent=d;$("total").textContent="/ "+state.tasks.length;$("percent").textContent=p;$("bar").style.width=p+"%";$("minutes").textContent=Math.floor(state.focusSeconds/60);let focusMins=Math.floor(state.focusSeconds/60),goal=Math.max(1,Number(profile.focusGoal)||25);$("focusGoalLabel").textContent=focusMins+" / "+goal+" min";$("focusGoalBar").style.width=Math.min(100,focusMins/goal*100)+"%";$("streak").textContent=computeStreak();$("left").textContent=(state.tasks.length-d)+" task"+(state.tasks.length-d===1?"":"s")+" left";$("taskTag").textContent=state.tasks.length+" tasks";document.querySelectorAll("[data-habit]").forEach(c=>c.checked=!!state.habits[c.dataset.habit]);let hc=Object.values(state.habits).filter(Boolean).length;$("habitCount").textContent=hc+" of 4 habits complete";$("habitBar").style.width=(hc/4*100)+"%";save();renderInsights()}
function update(){render()}
function fmt(n){return String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0")}
function timerUI(){$("clock").textContent=fmt(left);let deg=(duration-left)/duration*360;$("timerRing").style.background=`conic-gradient(var(--accent) ${deg}deg,#303652 ${deg}deg)`;$("timerStatus").textContent=running?"FOCUS IN PROGRESS":left===0?"SESSION COMPLETE":"READY WHEN YOU ARE";$("start").textContent=running?"Ⅱ Pause focus":left===0?"↻ Start again":"▶ Start focus";document.title=fmt(left)+" — Life Reset"}
function stop(){clearInterval(interval);interval=null;running=false}
function tick(){if(left>0){left--;state.focusSeconds++;timerUI();if(left%5===0)save()}if(left===0){stop();timerUI();render();toast("Focus session complete — nice work!")}}
function applyProfile(){const name=(profile.name||"").trim();$("welcomeLine").textContent=name?`WELCOME BACK, ${name.toLocaleUpperCase()} · YOUR NEXT CHAPTER STARTS HERE`:"YOUR NEXT CHAPTER STARTS HERE";$("profileName").value=profile.name||"";$("focusGoal").value=String(profile.focusGoal||25);$("heroSubtitle").textContent=name?`Your space, your pace, ${name}. Small steps still count.`:"Small steps. Real progress. One day at a time."}
$("profileForm").onsubmit=e=>{e.preventDefault();profile.name=$("profileName").value.trim();profile.focusGoal=Number($("focusGoal").value)||25;try{localStorage.setItem("lifeResetProfile",JSON.stringify(profile))}catch{}applyProfile();render();toast("Your personal setup is saved ✓")};
$("start").onclick=()=>{if(running){stop();timerUI();save();return}if(left===0)left=duration;running=true;timerUI();interval=setInterval(tick,1000)};
$("resetTimer").onclick=()=>{stop();left=duration;timerUI();toast("Timer reset")};
document.querySelectorAll("[data-min]").forEach(b=>b.onclick=()=>{stop();duration=Number(b.dataset.min)*60;left=duration;document.querySelectorAll("[data-min]").forEach(x=>x.classList.toggle("selected",x===b));timerUI()});
document.querySelectorAll("[data-filter]").forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll("[data-filter]").forEach(x=>x.classList.toggle("active",x===b));render()});
$("taskSearch").addEventListener("input",e=>{taskQuery=e.target.value;render()});$("sortTasks").onclick=()=>{prioritySort=!prioritySort;$("sortTasks").textContent=prioritySort?"↕ Default order":"↕ Priority first";render();toast(prioritySort?"High-priority tasks shown first":"Original task order restored")};
$("taskForm").onsubmit=e=>{e.preventDefault();let input=$("taskInput"),text=input.value.trim();if(!text){input.focus();return}state.tasks.push({id:Date.now(),text,done:false,priority:$("taskPriority").value});input.value="";$("taskPriority").value="normal";filter="all";document.querySelectorAll("[data-filter]").forEach(x=>x.classList.toggle("active",x.dataset.filter==="all"));update();toast("Goal added")};
$("clearDone").onclick=()=>{let n=state.tasks.length;state.tasks=state.tasks.filter(t=>!t.done);update();toast(n===state.tasks.length?"No completed tasks yet":"Completed tasks cleared")};
document.querySelectorAll("[data-habit]").forEach(c=>c.onchange=()=>{state.habits[c.dataset.habit]=c.checked;update();if(Object.values(state.habits).every(Boolean))toast("All daily habits complete! Great consistency.")});
$("resetDay").onclick=()=>{if(confirm("Reset task and habit checkmarks? Focus time will stay.")){state.tasks.forEach(t=>t.done=false);Object.keys(state.habits).forEach(k=>state.habits[k]=false);delete history[todayKey];update();toast("Today's checks reset")}};
const mobileResetButton=$("resetDayMobile");if(mobileResetButton)mobileResetButton.addEventListener("click",()=>$("resetDay").click());
$("theme").onclick=()=>{document.body.classList.toggle("mint");try{localStorage.setItem("lifeResetMint",document.body.classList.contains("mint")?"1":"0")}catch{}toast("Accent colour changed")};
try{if(localStorage.getItem("lifeResetMint")==="1")document.body.classList.add("mint")}catch{}
$("today").textContent=new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});applyProfile();render();renderInsights();timerUI();

// Portable backup: export and import this browser's Life Reset data.
$("backupData").onclick=()=>{save();const payload={app:"Life Reset",version:1,exportedAt:new Date().toISOString(),state,history,profile,theme:document.body.classList.contains("mint")?"aqua":"purple"};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`life-reset-backup-${todayKey}.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);toast("Backup downloaded ✓")};
$("importData").onclick=()=>$("importFile").click();
$("importFile").onchange=async e=>{const file=e.target.files&&e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!data||data.app!=="Life Reset"||!data.state||!Array.isArray(data.state.tasks)||!data.state.habits)throw new Error("Invalid backup");if(!confirm("Import this backup and replace the current browser data? Download a backup first if you want to keep the current progress."))return;state={...defaults(),...data.state,date:todayKey,habits:{...defaults().habits,...data.state.habits},tasks:data.state.tasks.map(t=>({id:Number(t.id)||Date.now()+Math.random(),text:String(t.text||"Untitled task").slice(0,90),done:!!t.done,priority:["high","normal","low"].includes(t.priority)?t.priority:"normal"}))};history=data.history&&typeof data.history==="object"?data.history:{};profile={...profile,...(data.profile||{})};try{localStorage.setItem("lifeResetProfile",JSON.stringify(profile));localStorage.setItem("lifeResetMint",data.theme==="aqua"?"1":"0")}catch{}document.body.classList.toggle("mint",data.theme==="aqua");save();applyProfile();render();toast("Backup restored ✓")}catch{alert("This file doesn't look like a valid Life Reset backup.")}finally{e.target.value=""}};

window.addEventListener("beforeunload",save);document.addEventListener("visibilitychange",()=>{if(document.hidden)save()});

// Date-aware quote of the day: cache once per local date, with an offline fallback.
const dailyQuotes=[
 {q:"You don't need a perfect day. You need a start.",a:"Life Reset"},
 {q:"Great things are done by a series of small things brought together.",a:"Vincent van Gogh"},
 {q:"It always seems impossible until it's done.",a:"Nelson Mandela"},
 {q:"The secret of getting ahead is getting started.",a:"Mark Twain"},
 {q:"You are never too old to set another goal or to dream a new dream.",a:"C. S. Lewis"},
 {q:"Success is the sum of small efforts, repeated day in and day out.",a:"Robert Collier"},
 {q:"Believe you can and you're halfway there.",a:"Theodore Roosevelt"},
 {q:"Action is the foundational key to all success.",a:"Pablo Picasso"}
];
function showDailyQuote(q,a,isOnline=false){const el=$("dailyQuote"),author=$("quoteAuthor"),link=$("quoteSource");if(!el||!author)return;el.textContent='“'+q+'”';author.textContent='— '+(a||'Unknown');if(link){link.hidden=!isOnline;link.setAttribute('aria-hidden',String(!isOnline));}}
async function initDailyQuote(){
 const cacheKey='lifeResetQuoteV2';
 let cached=null;
 try{cached=JSON.parse(localStorage.getItem(cacheKey)||'null')}catch{}
 if(cached&&cached.date===todayKey&&typeof cached.q==='string'&&cached.q){showDailyQuote(cached.q,cached.a, cached.online===true);return}
 const dayIndex=Math.floor(new Date(todayKey+'T12:00:00').getTime()/86400000)%dailyQuotes.length;
 const fallback=dailyQuotes[(dayIndex+dailyQuotes.length)%dailyQuotes.length];
 // Show a deterministic fallback immediately; only show ZenQuotes attribution for a real API quote.
 showDailyQuote(fallback.q,fallback.a,false);
 let quote={date:todayKey,...fallback,online:false};
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),4500);
 try{
  const response=await fetch('https://zenquotes.io/api/today',{signal:controller.signal,cache:'no-store'});
  if(!response.ok)throw new Error('Quote service unavailable');
  const data=await response.json(),item=Array.isArray(data)?data[0]:data;
  if(item&&typeof item.q==='string'&&item.q.trim()){
   quote={date:todayKey,q:item.q.trim(),a:String(item.a||'Unknown'),online:true};
   showDailyQuote(quote.q,quote.a,true);
  }
 }catch(e){/* Offline, blocked cross-origin request, timeout, or service unavailable: keep the daily fallback. */}
 finally{clearTimeout(timeout);try{localStorage.setItem(cacheKey,JSON.stringify(quote))}catch{}}
}
initDailyQuote();


// Motivational Music Mode: original procedural soundscapes via the Web Audio API.
// Playback is always manual; no third-party audio files or auto-play.
(()=>{
 const panel=$('music'),toggle=$('musicToggle'),volume=$('musicVolume');
 if(!panel||!toggle||!volume)return;
 const names={lofi:'Lo-fi flow',rain:'Rainy focus',cinematic:'Epic drive',nature:'Calm nature'};
 let mood='lofi',ctx=null,master=null,playing=false,loopId=null,step=0,nodes=[],noiseSource=null;
 const scale={lofi:[196,233.08,293.66,349.23,392,349.23,293.66,233.08],rain:[146.83,174.61,220,261.63,220,174.61],cinematic:[110,130.81,164.81,196,220,196,164.81,130.81],nature:[174.61,196,220,261.63,293.66,261.63,220,196]};
 function keep(node){nodes.push(node);return node}
 function tone(freq,when,duration,type='sine',gain=.04,detune=0){
  const osc=ctx.createOscillator(),amp=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,when);osc.detune.setValueAtTime(detune,when);amp.gain.setValueAtTime(.0001,when);amp.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),when+.08);amp.gain.setTargetAtTime(.0001,when+Math.max(.1,duration-.15),.12);osc.connect(amp);amp.connect(master);osc.start(when);osc.stop(when+duration+.5);keep(osc);keep(amp);
 }
 function chord(when,notes,volume=.018,duration=2.7){notes.forEach((n,i)=>{tone(n,when,duration,'sine',volume,i%2?3:-3);tone(n*2,when,duration,'triangle',volume*.23,0)})}
 function rainBed(){const size=ctx.sampleRate*2;const buffer=ctx.createBuffer(1,size,ctx.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<size;i++)data[i]=(Math.random()*2-1)*.24;noiseSource=ctx.createBufferSource();noiseSource.buffer=buffer;noiseSource.loop=true;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=mood==='rain'?1150:650;const gain=ctx.createGain();gain.gain.value=mood==='rain'?.13:.055;noiseSource.connect(filter);filter.connect(gain);gain.connect(master);noiseSource.start();keep(noiseSource);keep(filter);keep(gain)}
 function beat(){if(!playing||!ctx)return;const now=ctx.currentTime,notes=scale[mood]||scale.lofi;const idx=step%notes.length;
  if(mood==='lofi'){tone(notes[idx],now,1.1,'triangle',.045);if(step%4===0){tone(notes[idx]*.5,now,1.8,'sine',.07);chord(now+.03,[notes[idx],notes[(idx+2)%notes.length],notes[(idx+4)%notes.length]],.009,2.4)}if(step%2===1)tone(1200,now,.06,'sine',.006)}
  else if(mood==='rain'){tone(notes[idx],now,1.8,'sine',.025);if(step%4===0)chord(now,[notes[idx],notes[(idx+2)%notes.length]],.006,3.2)}
  else if(mood==='cinematic'){if(step%2===0){chord(now,[notes[idx],notes[(idx+2)%notes.length],notes[(idx+4)%notes.length]],.022,3.5);tone(notes[idx]*.5,now,3.4,'sine',.055)}else tone(notes[idx]*2,now,.8,'triangle',.012)}
  else {tone(notes[idx],now,2.1,'sine',.025);if(step%3===0)tone(notes[(idx+3)%notes.length]*2,now,1.6,'sine',.009)}
  step++;}
 function cleanup(){if(loopId){clearInterval(loopId);loopId=null}nodes.forEach(n=>{try{if(n.stop)n.stop()}catch{}try{n.disconnect()}catch{}});nodes=[];noiseSource=null}
 function status(text){$('musicStatus').textContent=text}
 async function start(){try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){status('This browser does not support Web Audio');return}if(!ctx)ctx=new Audio();if(ctx.state==='suspended')await ctx.resume();cleanup();master=ctx.createGain();master.gain.value=Number(volume.value)/100*.28;master.connect(ctx.destination);playing=true;step=0;if(mood==='rain'||mood==='nature')rainBed();beat();loopId=setInterval(beat,mood==='cinematic'?850:1050);toggle.textContent='Ⅱ Pause soundscape';toggle.setAttribute('aria-pressed','true');panel.classList.add('is-playing');status('Playing · '+names[mood]);$('musicNote').textContent='Soundscape is generated locally in your browser. Change mood anytime; press Pause to stop.'}catch(err){playing=false;status('Audio could not start — try Play again');toast('Could not start audio in this browser')}}
 function pause(){playing=false;if(loopId){clearInterval(loopId);loopId=null}cleanup();if(master){try{master.gain.setTargetAtTime(.0001,ctx.currentTime,.03)}catch{}try{master.disconnect()}catch{}master=null}toggle.textContent='▶ Play soundscape';toggle.setAttribute('aria-pressed','false');panel.classList.remove('is-playing');status('Paused · '+names[mood])}
 toggle.addEventListener('click',()=>{if(playing)pause();else start()});
 document.querySelectorAll('[data-mood]').forEach(button=>button.addEventListener('click',()=>{mood=button.dataset.mood;document.querySelectorAll('[data-mood]').forEach(b=>{const selected=b===button;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected))});$('musicTrackName').textContent=names[mood];status((playing?'Playing':'Ready')+' · '+names[mood]);if(playing)start()}));
 volume.addEventListener('input',()=>{$('musicVolumeValue').textContent=volume.value+'%';if(master&&ctx)master.gain.setTargetAtTime(Number(volume.value)/100*.28,ctx.currentTime,.04)});
 window.addEventListener('pagehide',()=>{if(ctx){pause();ctx.close().catch(()=>{})}});
})();

// Mood-based YouTube search and optional in-page video/playlist embedding.
(()=>{
 const searchForm=$('ytSearchForm'),searchInput=$('ytSearch'),urlInput=$('ytUrl'),loadButton=$('ytLoad'),wrap=$('ytPlayerWrap'),frame=$('ytPlayerFrame'),title=$('ytPlayerTitle'),openLink=$('ytOpenLink'),status=$('ytStatus');
 if(!searchForm||!searchInput||!urlInput||!loadButton||!wrap||!frame)return;
 const moodQueries={
  phonk:'phonk playlist drift phonk bass',
  slowed:'slowed reverb playlist phonk',
  motivation:'motivational phonk gym playlist',
  focus:'gaming phonk focus playlist'
 };
 let activeMood='phonk';
 function youtubeSearch(query){const q=String(query||'').trim();if(!q){status.textContent='Type a song or playlist name first.';searchInput.focus();return}window.open('https://www.youtube.com/results?search_query='+encodeURIComponent(q),'_blank','noopener,noreferrer');status.textContent='YouTube search opened for: '+q;}
 document.querySelectorAll('[data-yt-mood]').forEach(button=>button.addEventListener('click',()=>{
  activeMood=button.dataset.ytMood||'phonk';
  document.querySelectorAll('[data-yt-mood]').forEach(other=>{const selected=other===button;other.classList.toggle('selected',selected);other.setAttribute('aria-pressed',String(selected))});
  searchInput.value=moodQueries[activeMood]||moodQueries.phonk;
  status.textContent='Mood selected. Press “Search YouTube” to choose a track or playlist.';
 }));
 searchInput.value=moodQueries[activeMood];
 searchForm.addEventListener('submit',event=>{event.preventDefault();youtubeSearch(searchInput.value)});
 function parseYouTubeUrl(raw){
  let url;try{url=new URL(String(raw||'').trim())}catch{return null}
  const host=url.hostname.toLowerCase().replace(/^www\./,'').replace(/^m\./,'');
  if(!['youtube.com','music.youtube.com','youtu.be','youtube-nocookie.com'].includes(host))return null;
  const videoId=host==='youtu.be'?url.pathname.split('/').filter(Boolean)[0]:(url.searchParams.get('v')||url.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/)?.[1]);
  const listId=url.searchParams.get('list');
  const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{10,80}$/.test(id);
  if(videoId&&validId(videoId)){const playlistSuffix=listId&&validId(listId)?'&list='+encodeURIComponent(listId):'';return {src:'https://www.youtube-nocookie.com/embed/'+encodeURIComponent(videoId)+'?autoplay=0&playsinline=1&rel=0'+playlistSuffix,title:playlistSuffix?'YouTube video + playlist':'YouTube video',open:url.href};}
  if(listId&&validId(listId))return {src:'https://www.youtube-nocookie.com/embed/videoseries?list='+encodeURIComponent(listId)+'&autoplay=0&playsinline=1&rel=0',title:'YouTube playlist',open:url.href};
  return null;
 }
 function loadYouTube(){
  const raw=urlInput.value.trim(),parsed=parseYouTubeUrl(raw);
  if(!parsed){status.textContent='Please paste a valid YouTube video or playlist URL.';urlInput.focus();return}
  frame.replaceChildren();const iframe=document.createElement('iframe');iframe.src=parsed.src;iframe.title='YouTube music player';iframe.loading='lazy';iframe.allow='encrypted-media; picture-in-picture; web-share';iframe.referrerPolicy='strict-origin-when-cross-origin';iframe.allowFullscreen=true;frame.appendChild(iframe);
  title.textContent=parsed.title;openLink.href=parsed.open;wrap.hidden=false;status.textContent='Player ready. Press Play inside the YouTube player when you are ready.';
 }
 loadButton.addEventListener('click',loadYouTube);
 urlInput.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();loadYouTube()}});
 $('ytClear')?.addEventListener('click',()=>{frame.replaceChildren();wrap.hidden=true;status.textContent='Player closed. Choose another mood or song.'});
})();
