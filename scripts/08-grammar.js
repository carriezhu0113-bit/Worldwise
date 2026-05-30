// ==================== GRAMMAR ====================
let grammarMode = 'review';
let grammarMCIndex = 0, grammarFillIndex = 0, grammarCorrectIndex = 0;
let grammarMCShuffled = [], grammarFillShuffled = [], grammarCorrectShuffled = [];
let selectedOption = -1;
let grammarAnswered = false;
let grammarReviewShown = false;
let grammarReviewContent = '';
let currentGrammarModule = '';
let grammarModules = [];

async function initGrammar() {
  const gc = await getContent();
  grammarModules = gc.grammarModules || [];
  currentGrammarModule = grammarModules.length > 0 ? grammarModules[0].key : '';
  renderGrammarSubTabs();
  if (currentGrammarModule) {
    loadGrammarModule(currentGrammarModule);
  }
}

function renderGrammarSubTabs() {
  const container = document.getElementById('grammarSubTabs');
  if (!container) return;
  container.innerHTML = grammarModules.map(m =>
    `<button onclick="loadGrammarModule('${m.key}')" style="padding:6px 14px;border:2px solid ${m.key === currentGrammarModule ? '#2563eb' : '#e2e8f0'};border-radius:20px;background:${m.key === currentGrammarModule ? '#2563eb' : '#fff'};color:${m.key === currentGrammarModule ? '#fff' : '#64748b'};cursor:pointer;font-size:13px;font-weight:500;transition:all 0.2s">${m.icon || '📝'} ${m.name}</button>`
  ).join('');
}

async function loadGrammarModule(key) {
  currentGrammarModule = key;
  renderGrammarSubTabs();
  const gc = await getContent();
  const mod = gc.grammarModuleData[key];
  if (!mod) return;

  grammarMode = 'review';
  grammarMCIndex = 0; grammarFillIndex = 0; grammarCorrectIndex = 0;
  grammarMCShuffled = [...(mod.mc || [])]; shuffleArray(grammarMCShuffled);
  grammarFillShuffled = [...(mod.fill || [])]; shuffleArray(grammarFillShuffled);
  grammarCorrectShuffled = [...(mod.correct || [])]; shuffleArray(grammarCorrectShuffled);
  selectedOption = -1;
  grammarAnswered = false;
  grammarReviewShown = false;
  grammarReviewContent = mod.review || '';
  renderGrammar();
}

function renderGrammar() {
  const container = document.getElementById('grammarContent');
  const typeLabel = document.getElementById('grammarType');

  if (grammarMode === 'review') {
    typeLabel.textContent = '📚 语法复习';
    if (grammarReviewContent) {
      container.innerHTML = `
        <div style="padding:8px 0">${grammarReviewContent}</div>
        <button class="quiz-submit" onclick="startGrammarQuiz()" style="margin-top:16px">🚀 开始通关测试</button>
      `;
    } else {
      grammarMode = 'mc';
      renderGrammar();
    }
    return;
  }

  if (grammarMode === 'mc') {
    if (grammarMCIndex >= grammarMCShuffled.length) {
      grammarMode = 'fill';
      renderGrammar();
      return;
    }
    typeLabel.textContent = '选择题 (' + (grammarMCIndex+1) + '/' + grammarMCShuffled.length + ')';
    const q = grammarMCShuffled[grammarMCIndex];
    selectedOption = -1;
    grammarAnswered = false;
    container.innerHTML = `
      <div class="quiz-question">${grammarMCIndex+1}. ${q.q}</div>
      <div class="quiz-options">
        ${q.opts.map((o,i) => `<div class="quiz-option" onclick="selectGrammarOption(${i})" id="gopt${i}">${String.fromCharCode(65+i)}. ${o}</div>`).join('')}
      </div>
      <button class="quiz-submit" id="grammarSubmit" onclick="submitGrammarMC()">提交答案</button>
      <div id="grammarFeedback"></div>
    `;
  } else if (grammarMode === 'fill') {
    if (grammarFillIndex >= grammarFillShuffled.length) {
      grammarMode = 'correct';
      renderGrammar();
      return;
    }
    typeLabel.textContent = '填空题 (' + (grammarFillIndex+1) + '/' + grammarFillShuffled.length + ')';
    const q = grammarFillShuffled[grammarFillIndex];
    grammarAnswered = false;
    container.innerHTML = `
      <div class="quiz-question">${grammarFillIndex+1}. ${q.q}</div>
      <input type="text" class="fill-input" id="fillAnswer" placeholder="输入答案" autocomplete="off">
      <button class="quiz-submit" onclick="submitGrammarFill()">提交答案</button>
      <div id="grammarFeedback"></div>
    `;
  } else if (grammarMode === 'correct') {
    if (grammarCorrectIndex >= grammarCorrectShuffled.length) {
      container.innerHTML = '<div style="text-align:center;padding:40px"><h3>🎉 语法练习全部完成！</h3><p style="color:#64748b;margin-top:8px">点击首页查看学习数据</p><button class="quiz-submit" style="margin-top:16px" onclick="loadGrammarModule(currentGrammarModule)">重新练习</button></div>';
      return;
    }
    typeLabel.textContent = '改错题 (' + (grammarCorrectIndex+1) + '/' + grammarCorrectShuffled.length + ')';
    const q = grammarCorrectShuffled[grammarCorrectIndex];
    grammarAnswered = false;
    container.innerHTML = `
      <div class="quiz-question">${grammarCorrectIndex+1}. 找出错误并改正：</div>
      <div style="background:#fef2f2;padding:12px;border-radius:8px;margin-bottom:12px;font-size:15px"><b>错误句子：</b>${q.wrong}</div>
      <input type="text" class="fill-input" id="correctAnswer" placeholder="输入改正后的单词" autocomplete="off" style="width:100%">
      <button class="quiz-submit" onclick="submitGrammarCorrect()">提交答案</button>
      <div id="grammarFeedback"></div>
    `;
  }
}

function startGrammarQuiz() {
  grammarMode = 'mc';
  renderGrammar();
}

function selectGrammarOption(i) {
  if (grammarAnswered) return;
  selectedOption = i;
  document.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
  document.getElementById('gopt'+i).classList.add('selected');
}

async function submitGrammarMC() {
  if (grammarAnswered || selectedOption < 0) return;
  grammarAnswered = true;
  const q = grammarMCShuffled[grammarMCIndex];
  const correct = q.ans;
  const data = await getStudentData(currentUser.name);
  data.testsCompleted = (data.testsCompleted || 0) + 1;
  data.grammarDone = (data.grammarDone || 0) + 1;

  document.getElementById('gopt'+correct).classList.add('correct');
  if (selectedOption !== correct) {
    document.getElementById('gopt'+selectedOption).classList.add('wrong');
    await addError({type:'grammar_mc',question:q.q,options:q.opts,correct:correct,userAnswer:selectedOption,explanation:q.exp}, data);
  } else {
    data.testsCorrect = (data.testsCorrect || 0) + 1;
    data.grammarCorrect = (data.grammarCorrect || 0) + 1;
  }
  await saveStudentData(currentUser.name, data);
  document.getElementById('grammarFeedback').innerHTML = `<div class="quiz-feedback ${selectedOption===correct?'correct':'wrong'}">${selectedOption===correct?'✅ 正确！':'❌ 错误！'} ${q.exp}</div>`;
  document.getElementById('grammarSubmit').disabled = true;
  setTimeout(() => { grammarMCIndex++; renderGrammar(); }, 2000);
}

async function submitGrammarFill() {
  if (grammarAnswered) return;
  grammarAnswered = true;
  const q = grammarFillShuffled[grammarFillIndex];
  const input = document.getElementById('fillAnswer').value.trim().toLowerCase();
  const correct = q.ans.toLowerCase();
  const data = await getStudentData(currentUser.name);
  data.testsCompleted = (data.testsCompleted || 0) + 1;
  data.grammarDone = (data.grammarDone || 0) + 1;

  const el = document.getElementById('fillAnswer');
  if (input === correct) {
    el.className = 'fill-input correct';
    data.testsCorrect = (data.testsCorrect || 0) + 1;
    data.grammarCorrect = (data.grammarCorrect || 0) + 1;
    document.getElementById('grammarFeedback').innerHTML = `<div class="quiz-feedback correct">✅ 正确！${q.exp}</div>`;
  } else {
    el.className = 'fill-input wrong';
    await addError({type:'grammar_fill',question:q.q,correct:q.ans,userAnswer:input,explanation:q.exp}, data);
    document.getElementById('grammarFeedback').innerHTML = `<div class="quiz-feedback wrong">❌ 错误！正确答案是：<b>${q.ans}</b>。${q.exp}</div>`;
  }
  await saveStudentData(currentUser.name, data);
  setTimeout(() => { grammarFillIndex++; renderGrammar(); }, 2000);
}

async function submitGrammarCorrect() {
  if (grammarAnswered) return;
  grammarAnswered = true;
  const q = grammarCorrectShuffled[grammarCorrectIndex];
  const input = document.getElementById('correctAnswer').value.trim().toLowerCase();
  const correct = q.correctWord.toLowerCase();
  const data = await getStudentData(currentUser.name);
  data.testsCompleted = (data.testsCompleted || 0) + 1;
  data.grammarDone = (data.grammarDone || 0) + 1;

  const el = document.getElementById('correctAnswer');
  if (input === correct) {
    el.className = 'fill-input correct';
    data.testsCorrect = (data.testsCorrect || 0) + 1;
    data.grammarCorrect = (data.grammarCorrect || 0) + 1;
    document.getElementById('grammarFeedback').innerHTML = `<div class="quiz-feedback correct">✅ 正确！${q.exp}</div>`;
  } else {
    el.className = 'fill-input wrong';
    await addError({type:'grammar_correct',wrong:q.wrong,correct:q.correctWord,userAnswer:input,explanation:q.exp}, data);
    document.getElementById('grammarFeedback').innerHTML = `<div class="quiz-feedback wrong"> 错误！正确答案是：<b>${q.correctWord}</b>。${q.exp}</div>`;
  }
  await saveStudentData(currentUser.name, data);
  setTimeout(() => { grammarCorrectIndex++; renderGrammar(); }, 2000);
}
