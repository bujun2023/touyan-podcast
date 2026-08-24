const $=(s)=>document.querySelector(s);
let episodes=[],cats=[],cur=0,utter=null,queue=[],playing=false,autoplay=false;

fetch('data/episodes.json').then(r=>r.json()).then(data=>{
  episodes=data.episodes;cats=data.categories;
  renderCats();renderList(episodes);
  populateVoices();
  if('speechSynthesis' in window){speechSynthesis.onvoiceschanged=populateVoices;}
}).catch(err=>{console.error(err);$('#episodeList').innerHTML='<p style="color:#f66">加载节目数据失败：'+err.message+'</p>';});

function renderCats(){
  const nav=$('#catNav');
  const all=document.createElement('button');all.textContent='全部 · '+episodes.length;all.className='active';all.onclick=()=>filterCat(null,all);nav.appendChild(all);
  cats.forEach(c=>{const b=document.createElement('button');b.textContent=c.name+' · '+episodes.filter(e=>e.cat===c.id).length;b.onclick=()=>filterCat(c.id,b);nav.appendChild(b);});
}
function filterCat(id,btn){
  [...$('#catNav').children].forEach(b=>b.classList.remove('active'));btn.classList.add('active');
  renderList(id?episodes.filter(e=>e.cat===id):episodes);
}
function catOf(e){return cats.find(c=>c.id===e.cat);}
function renderList(list){
  const box=$('#episodeList');box.innerHTML='';
  list.forEach((e,idx)=>{
    const c=catOf(e);
    const card=document.createElement('article');card.className='episode';
    card.innerHTML=`
      <span class="cat-tag" style="background:${c.color}">${c.name}</span>
      <div class="schedule">🕒 ${e.schedule}</div>
      <h3>${e.title}</h3>
      <p class="summary">${e.summary}</p>
      <div class="tags">${e.tags.map(t=>'<span>#'+t+'</span>').join('')}</div>
      <div class="actions">
        <button class="primary" data-act="play">▶ 收听</button>
        <button data-act="detail">📄 详情</button>
      </div>`;
    card.querySelector('[data-act="play"]').onclick=()=>{queue=list.slice();cur=idx;startPlay(queue[cur]);};
    card.querySelector('[data-act="detail"]').onclick=()=>location.href='episode.html?id='+encodeURIComponent(e.id);
    box.appendChild(card);
  });
}
function populateVoices(){
  const sel=$('#voiceSel');if(!sel)return;
  const voices=speechSynthesis.getVoices().filter(v=>/zh|Chinese|cmn/i.test(v.lang+''+v.name));
  sel.innerHTML='';
  if(!voices.length){const o=new Option('默认发音人','');sel.add(o);return;}
  voices.forEach((v,i)=>{const o=new Option(v.name||('发音人'+(i+1)),v.voiceURI);sel.add(o);});
}

/* ===== TTS 控制 ===== */
function buildText(e){return e.body?`${e.title}。${e.body}`:`${e.title}。${e.summary}。涉及主题：${e.tags.join('、')}。触发频率：${e.schedule}。`;}
function startPlay(e){
  if(!('speechSynthesis' in window)){alert('当前浏览器不支持语音合成');return;}
  stopPlay();
  utter=new SpeechSynthesisUtterance(buildText(e));
  const vuri=$('#voiceSel').value;if(vuri){const v=speechSynthesis.getVoices().find(x=>x.voiceURI===vuri);if(v)utter.voice=v;}
  utter.rate=parseFloat($('#rate').value)||1;utter.pitch=1;utter.lang='zh-CN';
  $('#nowTitle').textContent='正在播放：'+e.title;
  utter.onend=()=>{setProgress(1);if(autoplay){const n=queue.indexOf(e);if(n>=0&&n<queue.length-1){cur=n+1;startPlay(queue[cur]);}else{playing=false;$('#nowTitle').textContent='播放结束';}}else{playing=false;}};
  utter.onboundary=(ev)=>{if(ev.name==='sentence'||ev.name==='word'){/* 粗粒度进度 */}};
  speechSynthesis.speak(utter);playing=true;
}
function stopPlay(){if('speechSynthesis' in window)speechSynthesis.cancel();playing=false;utter=null;}
function setProgress(p){$('#progressBar').style.width=(p*100).toFixed(0)+'%';}

$('#btnPlay').onclick=()=>{if(playing||!utter){if(queue.length){if(!utter){cur=0;startPlay(queue[0]);}else{speechSynthesis.resume();playing=true;}}else{alert('请先选择一期节目');}}else{speechSynthesis.pause();playing=false;}};
$('#btnPrev').onclick=()=>{if(!queue.length)return;cur=(cur-1+queue.length)%queue.length;startPlay(queue[cur]);};
$('#btnNext').onclick=()=>{if(!queue.length)return;cur=(cur+1)%queue.length;startPlay(queue[cur]);};
$('#autoplay').onchange=(e)=>{autoplay=e.target.checked;};
$('#rate').oninput=()=>{if(utter){speechSynthesis.cancel();const e=queue[cur];if(e)startPlay(e);}};
window.addEventListener('beforeunload',stopPlay);

/* ===== 每日合集入口 ===== */
fetch('data/daily_index.json').then(r=>r.json()).then(list=>{
  const box=document.getElementById('dailyBox');if(!box||!Array.isArray(list))return;
  box.innerHTML='<h2 style="font-size:20px;margin:18px 0 4px;">📅 每日合集</h2><p style="color:var(--muted);font-size:13px;margin-bottom:12px;">每天各任务产出聚合为一期合集，可逐期点开收听。</p>'
    +list.map(d=>`<a class="daily-card" href="${d.file}" style="display:block;background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:14px 16px;margin:10px 0;text-decoration:none;color:inherit;"><div style="font-weight:600;font-size:15px;">🎙 每日合集 · ${d.date}</div><div style="font-size:12px;color:var(--muted);margin-top:4px;">${d.note||'当日各投研任务产出聚合'}</div></a>`).join('');
}).catch(()=>{});
