// ==================== IRREGULAR VERBS ====================
let verbMode = 'learn';
let verbLearnIndex = 0;
let verbLearnShuffled = [];
let verbQuizIndex = 0;
let verbQuizShuffled = [];
let verbQuizAnswered = false;
let verbQuizType = 'past';
let verbQuizScore = 0;
let verbQuizTotal = 0;

function speakVerb(...texts) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    texts.forEach((text, i) => {
      const clean = text.replace(/ \/red\//g, '').replace(/\/.*/g, '').trim();
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = 'en-US';
      u.rate = 0.85;
      u.pitch = 1;
      window.speechSynthesis.speak(u);
    });
  }
}

async function initVerbs() {
  const gc = await getContent();
  verbLearnShuffled = [...gc.irregularVerbs];
  shuffleArray(verbLearnShuffled);
  verbLearnIndex = 0;
  verbMode = 'learn';
  renderVerbs();
}

function renderVerbs() {
  const container = document.getElementById('verbContent');
  const label = document.getElementById('verbModeLabel');

  if (verbMode === 'learn') {
    const v = verbLearnShuffled[verbLearnIndex];
    label.textContent = `学习模式 - 熟悉动词的过去式和过去分词 (${verbLearnIndex + 1}/${verbLearnShuffled.length})`;
    container.innerHTML = `
      <div style="text-align:center;padding:24px 0">
        <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:8px">
          <div style="font-size:40px;font-weight:700;color:#2563eb">${v.word}</div>
          <button onclick="speakVerb('${v.word}')" style="background:none;border:none;cursor:pointer;font-size:28px;padding:4px 8px;border-radius:8px" title="播放发音">🔊</button>
        </div>
        <div style="font-size:18px;color:#64748b;margin-bottom:20px">${v.meaning}</div>
        <div style="display:flex;justify-content:center;gap:32px;margin-bottom:24px">
          <div style="text-align:center;cursor:pointer" onclick="speakVerb('${v.past}')">
            <div style="font-size:13px;color:#94a3b8;margin-bottom:4px">过去式 🔊</div>
            <div style="font-size:24px;font-weight:600;color:#059669">${v.past}</div>
          </div>
          <div style="text-align:center;cursor:pointer" onclick="speakVerb('${v.pp}')">
            <div style="font-size:13px;color:#94a3b8;margin-bottom:4px">过去分词 🔊</div>
            <div style="font-size:24px;font-weight:600;color:#7c3aed">${v.pp}</div>
          </div>
        </div>
        <div style="display:flex;justify-content:center;gap:12px">
          <button class="quiz-submit" style="background:#64748b" onclick="verbPrev()"> 上一个</button>
          <button class="quiz-submit" style="background:#2563eb" onclick="verbNext()">下一个 ➡</button>
        </div>
        <div style="margin-top:16px">
          <button class="quiz-submit" style="background:#059669" onclick="startVerbQuiz()">🚀 开始考核</button>
        </div>
      </div>
    `;
    setTimeout(() => speakVerb(v.word, v.past, v.pp), 300);
  } else if (verbMode === 'quiz') {
    if (verbQuizIndex >= verbQuizShuffled.length) {
      label.textContent = '考核完成！';
      const pct = verbQuizTotal > 0 ? Math.round(verbQuizScore / verbQuizTotal * 100) : 0;
      container.innerHTML = `
        <div style="text-align:center;padding:40px">
          <h3>🎉 考核完成！</h3>
          <div style="font-size:48px;font-weight:700;color:#2563eb;margin:16px 0">${verbQuizScore}/${verbQuizTotal}</div>
          <div style="font-size:18px;color:#64748b">正确率 ${pct}%</div>
          <div style="display:flex;justify-content:center;gap:12px;margin-top:20px">
            <button class="quiz-submit" style="background:#64748b" onclick="initVerbs()">重新学习</button>
            <button class="quiz-submit" style="background:#2563eb" onclick="startVerbQuiz()">再考一次</button>
          </div>
        </div>
      `;
      return;
    }
    const v = verbQuizShuffled[verbQuizIndex];
    const qType = verbQuizType;
    label.textContent = `考核模式 - 写出${qType === 'past' ? '过去式' : '过去分词'} (${verbQuizIndex + 1}/${verbQuizShuffled.length})`;
    verbQuizAnswered = false;
    container.innerHTML = `
      <div style="text-align:center;padding:24px 0">
        <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:8px">
          <div style="font-size:16px;color:#94a3b8">${v.meaning}</div>
          <button onclick="speakVerb('${v.word}')" style="background:none;border:none;cursor:pointer;font-size:20px;padding:2px 6px;border-radius:6px" title="播放发音">🔊</button>
        </div>
        <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:20px">
          <div style="font-size:36px;font-weight:700;color:#2563eb">${v.word}</div>
        </div>
        <div style="font-size:14px;color:#64748b;margin-bottom:16px">请输入${qType === 'past' ? '过去式' : '过去分词'}：</div>
        <input type="text" class="fill-input" id="verbQuizInput" placeholder="输入答案" autocomplete="off" style="max-width:300px;text-align:center;font-size:20px">
        <button class="quiz-submit" onclick="submitVerbQuiz()" style="margin-top:16px">提交答案</button>
        <div id="verbQuizFeedback" style="margin-top:16px;text-align:center"></div>
      </div>
    `;
    setTimeout(() => {
      const inp = document.getElementById('verbQuizInput');
      if (inp) inp.focus();
    }, 100);
  }
}

function verbPrev() {
  if (verbLearnIndex > 0) {
    verbLearnIndex--;
    renderVerbs();
  }
}

function verbNext() {
  if (verbLearnIndex < verbLearnShuffled.length - 1) {
    verbLearnIndex++;
    renderVerbs();
  }
}

function startVerbQuiz() {
  verbQuizShuffled = [...verbLearnShuffled];
  shuffleArray(verbQuizShuffled);
  verbQuizIndex = 0;
  verbQuizScore = 0;
  verbQuizTotal = 0;
  verbMode = 'quiz';
  renderVerbs();
}

function submitVerbQuiz() {
  if (verbQuizAnswered) return;
  verbQuizAnswered = true;
  const v = verbQuizShuffled[verbQuizIndex];
  const input = document.getElementById('verbQuizInput').value.trim().toLowerCase();
  const correctAnswers = (verbQuizType === 'past' ? v.past : v.pp).toLowerCase().split('/').map(s => s.trim());
  verbQuizTotal++;

  const isCorrect = correctAnswers.some(a => input === a);
  const feedback = document.getElementById('verbQuizFeedback');
  const inputEl = document.getElementById('verbQuizInput');

  if (isCorrect) {
    inputEl.className = 'fill-input correct';
    verbQuizScore++;
    feedback.innerHTML = `<div class="quiz-feedback correct">✅ 正确！${v.word} → ${v.past} → ${v.pp}</div>`;
  } else {
    inputEl.className = 'fill-input wrong';
    feedback.innerHTML = `<div class="quiz-feedback wrong">❌ 错误！正确答案是：<b>${verbQuizType === 'past' ? v.past : v.pp}</b></div>`;
  }

  // 保存动词学习数据
  getStudentData(currentUser.name).then(data => {
    data.verbDone = (data.verbDone || 0) + 1;
    if (isCorrect) {
      data.verbCorrect = (data.verbCorrect || 0) + 1;
    }
    saveStudentData(currentUser.name, data);
  });

  verbQuizType = verbQuizType === 'past' ? 'pp' : 'past';

  setTimeout(() => { verbQuizIndex++; renderVerbs(); }, 2000);
}
