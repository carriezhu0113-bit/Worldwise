// ==================== READING ====================
let readingModule = null;
let readingStep = 'text';
let readingVocabIndex = 0;
let readingSAIndex = 0;
let readingSASelectedWords = new Set();
let readingSAWordRoles = {};
let readingSAAnswered = false;
let readingMCIndex = 0;
let readingMCSelected = -1;
let readingMCAnswered = false;

async function initReading() {
  const gc = await getContent();
  const modules = gc.readingModules || [];
  if (modules.length === 0) {
    document.getElementById('readingContent').innerHTML = '<div style="text-align:center;padding:40px;color:#64748b">暂无阅读内容</div>';
    return;
  }
  loadReadingModule(modules[0].key);
}

async function loadReadingModule(key) {
  const gc = await getContent();
  readingModule = gc.readingModuleData[key];
  if (!readingModule) return;
  readingStep = 'vocab';
  readingVocabIndex = 0;
  readingSAIndex = 0;
  readingMCIndex = 0;
  renderReading();
}

function renderReading() {
  const container = document.getElementById('readingContent');
  if (!readingModule) return;

  if (readingStep === 'vocab') {
    const vocab = readingModule.vocabulary || [];
    if (readingVocabIndex >= vocab.length) {
      readingStep = 'text';
      renderReading();
      return;
    }
    const v = vocab[readingVocabIndex];
    container.innerHTML = `
      <div style="text-align:center;padding:20px">
        <div style="font-size:14px;color:#64748b;margin-bottom:8px">重点词汇 (${readingVocabIndex + 1}/${vocab.length})</div>
        <div style="font-size:36px;font-weight:700;color:#2563eb;margin-bottom:4px">${v.word}</div>
        <div style="font-size:16px;color:#64748b;margin-bottom:12px">${v.pos || ''}</div>
        <div style="font-size:20px;color:#1e293b;margin-bottom:20px">${v.meaning}</div>
      </div>
      <button class="quiz-submit" onclick="readingVocabIndex++;renderReading()">下一个</button>
    `;
  } else if (readingStep === 'text') {
    container.innerHTML = `
      <div style="background:#f0f9ff;border-radius:12px;padding:20px;margin-bottom:16px;line-height:1.9;font-size:15px;color:#1e293b">
        ${readingModule.text.split('\n\n').map(p => `<p style="margin-bottom:12px;text-indent:2em">${p}</p>`).join('')}
      </div>
      <button class="quiz-submit" onclick="readingStep='sa';readingSAIndex=0;renderReading()"> 句子结构分析</button>
    `;
  } else if (readingStep === 'sa') {
    const items = readingModule.sentenceAnalysis || [];
    if (readingSAIndex >= items.length) {
      readingStep = 'mc';
      readingMCIndex = 0;
      renderReading();
      return;
    }
    renderReadingSA(items[readingSAIndex]);
  } else if (readingStep === 'mc') {
    const items = readingModule.mc || [];
    if (readingMCIndex >= items.length) {
      container.innerHTML = '<div style="text-align:center;padding:40px"><h3>🎉 阅读理解全部完成！</h3><p style="color:#64748b;margin-top:8px">点击首页查看学习数据</p></div>';
      return;
    }
    renderReadingMC(items[readingMCIndex]);
  }
}

function renderReadingSA(item) {
  const container = document.getElementById('readingContent');
  readingSASelectedWords = new Set();
  readingSAWordRoles = {};
  readingSAAnswered = false;
  const items = readingModule.sentenceAnalysis || [];

  let html = `
    <div style="font-size:14px;color:#64748b;margin-bottom:8px">句子结构分析 (${readingSAIndex + 1}/${items.length})</div>
    <div class="sa-legend">
      <span><span class="dot" style="background:#3b82f6"></span> 主语</span>
      <span><span class="dot" style="background:#ef4444"></span> 谓语</span>
      <span><span class="dot" style="background:#10b981"></span> 宾语</span>
      <span><span class="dot" style="background:#f59e0b"></span> 状语</span>
    </div>
    <div class="sa-sentence" id="readingSAWords">
  `;
  item.words.forEach((w, i) => {
    html += `<span class="sa-word" id="rsaw${i}" onclick="toggleReadingSAWord(${i})">${w}</span>`;
  });
  html += `</div>
    <input type="text" class="fill-input" id="readingSATranslation" placeholder="输入中文翻译" autocomplete="off" style="width:100%;margin:12px 0">
    <div class="sa-roles">
      <button class="sa-role-btn" onclick="markReadingSARole('subject')"> 主语</button>
      <button class="sa-role-btn" onclick="markReadingSARole('predicate')">🔴 谓语</button>
      <button class="sa-role-btn" onclick="markReadingSARole('object')">🟢 宾语</button>
      <button class="sa-role-btn" onclick="markReadingSARole('adverbial')"> 状语</button>
      <button class="sa-clear-btn" onclick="clearReadingSASelection()">↩ 取消选中</button>
    </div>
    <button class="quiz-submit" onclick="submitReadingSA()">提交答案</button>
    <div id="readingSAFeedback" style="margin-top:12px"></div>
  `;
  container.innerHTML = html;
}

function toggleReadingSAWord(idx) {
  if (readingSAAnswered) return;
  const el = document.getElementById('rsaw' + idx);
  if (readingSASelectedWords.has(idx)) {
    readingSASelectedWords.delete(idx);
    el.classList.remove('selected');
  } else {
    readingSASelectedWords.add(idx);
    el.classList.add('selected');
  }
}

function markReadingSARole(role) {
  if (readingSAAnswered || readingSASelectedWords.size === 0) return;
  const roleClass = 'role-' + role;
  readingSASelectedWords.forEach(idx => {
    const el = document.getElementById('rsaw' + idx);
    el.className = 'sa-word ' + roleClass;
    readingSAWordRoles[idx] = role;
  });
  readingSASelectedWords = new Set();
}

function clearReadingSASelection() {
  if (readingSAAnswered) return;
  readingSASelectedWords.forEach(idx => {
    const el = document.getElementById('rsaw' + idx);
    el.classList.remove('selected');
  });
  readingSASelectedWords = new Set();
}

async function submitReadingSA() {
  if (readingSAAnswered) return;
  const items = readingModule.sentenceAnalysis || [];
  const item = items[readingSAIndex];
  const roleMap = {subject:0, predicate:1, object:2, adverbial:3};
  const data = await getStudentData(currentUser.name);
  data.testsCompleted = (data.testsCompleted || 0) + 1;
  data.sentenceAnalysisDone = (data.sentenceAnalysisDone || 0) + 1;
  data.readingDone = (data.readingDone || 0) + 1;

  const correctSets = {0:[], 1:[], 2:[], 3:[]};
  const userSets = {0:[], 1:[], 2:[], 3:[]};
  item.words.forEach((_, i) => {
    const cr = item.roles[i];
    if (cr >= 0 && cr <= 3) correctSets[cr].push(i);
    const ur = readingSAWordRoles[i];
    if (ur && roleMap[ur] !== undefined) userSets[roleMap[ur]].push(i);
  });

  const subjectOK = correctSets[0].length === 0 ? userSets[0].length === 0 : userSets[0].some(idx => correctSets[0].includes(idx));
  const predicateOK = correctSets[1].length === 0 ? userSets[1].length === 0 : userSets[1].some(idx => correctSets[1].includes(idx));
  const hasObject = correctSets[2].length > 0;
  const objectOK = hasObject ? (userSets[2].some(idx => correctSets[2].includes(idx))) : true;
  const hasAdverbial = correctSets[3].length > 0;
  const adverbialOK = hasAdverbial ? (userSets[3].some(idx => correctSets[3].includes(idx))) : true;

  const allCorrect = subjectOK && predicateOK && objectOK && adverbialOK;

  item.words.forEach((_, i) => {
    const el = document.getElementById('rsaw' + i);
    const ur = readingSAWordRoles[i];
    const cr = item.roles[i];
    if (cr >= 0 && cr <= 3 && ur && roleMap[ur] === cr) {
      el.classList.add('role-correct');
    } else if (ur) {
      el.classList.add('role-wrong');
    }
  });

  readingSAAnswered = true;

  const userTrans = document.getElementById('readingSATranslation').value.trim();

  if (allCorrect) {
    data.testsCorrect = (data.testsCorrect || 0) + 1;
    data.sentenceAnalysisCorrect = (data.sentenceAnalysisCorrect || 0) + 1;
    data.readingCorrect = (data.readingCorrect || 0) + 1;
  } else {
    await addError({type:'reading_sa',sentence:item.sentence,correctRoles:item.roles,userRoles:readingSAWordRoles,explanation:item.exp,translation:item.translation,userTranslation:userTrans}, data);
  }
  await saveStudentData(currentUser.name, data);

  document.getElementById('readingSAFeedback').innerHTML = `
    <div class="quiz-feedback ${allCorrect?'correct':'wrong'}">${allCorrect?'✅ 正确！':'❌ 有错误，请查看解析'}</div>
    <div style="background:#f0f9ff;padding:12px;border-radius:8px;margin-top:8px;text-align:left;font-size:13px;line-height:1.8">
      <div><b>参考译文：</b>${item.translation}</div>
      <div style="margin-top:6px"><b>解析：</b>${item.exp}</div>
    </div>
    <button class="quiz-submit" style="margin-top:12px" onclick="readingSAIndex++;renderReading()">下一句</button>
  `;
}

function renderReadingMC(item) {
  const container = document.getElementById('readingContent');
  readingMCSelected = -1;
  readingMCAnswered = false;
  const items = readingModule.mc || [];

  container.innerHTML = `
    <div style="font-size:14px;color:#64748b;margin-bottom:8px">阅读理解选择题 (${readingMCIndex + 1}/${items.length})</div>
    <div class="quiz-question">${item.q}</div>
    <div class="quiz-options">
      ${item.opts.map((o,i) => `<div class="quiz-option" onclick="selectReadingMC(${i})" id="rmcopt${i}">${o}</div>`).join('')}
    </div>
    <button class="quiz-submit" id="readingMCSubmit" onclick="submitReadingMC()">提交答案</button>
    <div id="readingMCFeedback"></div>
  `;
}

function selectReadingMC(i) {
  if (readingMCAnswered) return;
  readingMCSelected = i;
  document.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
  document.getElementById('rmcopt'+i).classList.add('selected');
}

async function submitReadingMC() {
  if (readingMCAnswered || readingMCSelected < 0) return;
  readingMCAnswered = true;
  const items = readingModule.mc || [];
  const item = items[readingMCIndex];
  const correct = item.ans;
  const data = await getStudentData(currentUser.name);
  data.testsCompleted = (data.testsCompleted || 0) + 1;
  data.readingDone = (data.readingDone || 0) + 1;

  document.getElementById('rmcopt'+correct).classList.add('correct');
  if (readingMCSelected !== correct) {
    document.getElementById('rmcopt'+readingMCSelected).classList.add('wrong');
    await addError({type:'reading_mc',question:item.q,options:item.opts,correct:correct,userAnswer:readingMCSelected,explanation:item.exp}, data);
  } else {
    data.testsCorrect = (data.testsCorrect || 0) + 1;
    data.readingCorrect = (data.readingCorrect || 0) + 1;
  }
  await saveStudentData(currentUser.name, data);

  document.getElementById('readingMCFeedback').innerHTML = `
    <div class="quiz-feedback ${readingMCSelected===correct?'correct':'wrong'}">${readingMCSelected===correct?'✅ 正确！':'❌ 错误！'} ${item.exp}</div>
    <button class="quiz-submit" style="margin-top:12px" onclick="readingMCIndex++;renderReading()">下一题</button>
  `;
  document.getElementById('readingMCSubmit').disabled = true;
}
