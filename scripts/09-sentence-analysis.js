// ==================== SENTENCE ANALYSIS ====================
let saIndex = 0;
let saShuffled = [];
let saSelectedWords = new Set();
let saWordRoles = {};
let saAnswered = false;

async function initSentenceAnalysis() {
  saIndex = 0;
  const gc = await getContent();
  saShuffled = [...gc.sentenceAnalysis];
  shuffleArray(saShuffled);
  // 每次只取10句，避免太多
  saShuffled = saShuffled.slice(0, 10);
  saSelectedWords = new Set();
  saWordRoles = {};
  saAnswered = false;
  renderSentenceAnalysis();
}

function renderSentenceAnalysis() {
  if (saIndex >= saShuffled.length) {
    document.getElementById('saSentence').innerHTML = '<div style="text-align:center;padding:20px;width:100%">🎉 句子分析全部完成！</div>';
    document.getElementById('saFeedback').innerHTML = '';
    document.getElementById('saProgress').textContent = saShuffled.length + ' / ' + saShuffled.length;
    document.getElementById('saTranslation').style.display = 'none';
    return;
  }
  saSelectedWords = new Set();
  saWordRoles = {};
  saAnswered = false;
  const item = saShuffled[saIndex];
  document.getElementById('saProgress').textContent = (saIndex + 1) + ' / ' + saShuffled.length;
  document.getElementById('saFeedback').innerHTML = '';
  document.getElementById('saTranslation').value = '';
  document.getElementById('saTranslation').style.display = 'block';

  let html = '';
  item.words.forEach((w, i) => {
    html += `<span class="sa-word" id="saw${i}" onclick="toggleSAWord(${i})">${w}</span>`;
  });
  document.getElementById('saSentence').innerHTML = html;
}

function toggleSAWord(idx) {
  if (saAnswered) return;
  const el = document.getElementById('saw' + idx);
  if (saSelectedWords.has(idx)) {
    saSelectedWords.delete(idx);
    el.classList.remove('selected');
  } else {
    saSelectedWords.add(idx);
    el.classList.add('selected');
  }
}

function markRole(role) {
  if (saAnswered || saSelectedWords.size === 0) return;
  const roleClass = 'role-' + role;
  saSelectedWords.forEach(idx => {
    const el = document.getElementById('saw' + idx);
    el.className = 'sa-word ' + roleClass;
    saWordRoles[idx] = role;
  });
  saSelectedWords = new Set();
}

function clearSelection() {
  if (saAnswered) return;
  saSelectedWords.forEach(idx => {
    const el = document.getElementById('saw' + idx);
    el.classList.remove('selected');
  });
  saSelectedWords = new Set();
}

function roleHasCorrectHit(userSelected, correctWords) {
  if (correctWords.length === 0) {
    return userSelected.length === 0;
  }
  return userSelected.some(index => correctWords.includes(index));
}

async function submitSentenceAnalysis() {
  if (saAnswered) return;
  const item = saShuffled[saIndex];
  const roleMap = {subject:0, predicate:1, object:2, adverbial:3};
  const data = await getStudentData(currentUser.name);
  data.testsCompleted = (data.testsCompleted || 0) + 1;
  data.sentenceAnalysisDone = (data.sentenceAnalysisDone || 0) + 1;

  const correctSets = {0:[], 1:[], 2:[], 3:[]};
  const userSets = {0:[], 1:[], 2:[], 3:[]};
  item.words.forEach((_, i) => {
    const cr = item.roles[i];
    if (cr >= 0 && cr <= 3) correctSets[cr].push(i);
    const ur = saWordRoles[i];
    if (ur && roleMap[ur] !== undefined) userSets[roleMap[ur]].push(i);
  });

  const subjectOK = roleHasCorrectHit(userSets[0], correctSets[0]);
  const predicateOK = roleHasCorrectHit(userSets[1], correctSets[1]);
  const hasObject = correctSets[2].length > 0;
  const objectOK = roleHasCorrectHit(userSets[2], correctSets[2]);
  const hasAdverbial = correctSets[3].length > 0;
  const adverbialOK = roleHasCorrectHit(userSets[3], correctSets[3]);

  const allCorrect = subjectOK && predicateOK && objectOK && adverbialOK;

  item.words.forEach((_, i) => {
    const el = document.getElementById('saw' + i);
    const ur = saWordRoles[i];
    const cr = item.roles[i];
    if (cr >= 0 && cr <= 3 && ur && roleMap[ur] === cr) {
      el.classList.add('role-correct');
    } else if (ur) {
      el.classList.add('role-wrong');
    }
  });

  const userTrans = document.getElementById('saTranslation').value.trim();
  const correctTrans = item.translation;

  saAnswered = true;

  if (allCorrect) {
    data.testsCorrect = (data.testsCorrect || 0) + 1;
    data.sentenceAnalysisCorrect = (data.sentenceAnalysisCorrect || 0) + 1;
    document.getElementById('saFeedback').innerHTML = '<div class="quiz-feedback correct">✅ 找到了主语和谓语，很好！<br>' + item.exp + '<br><br>📖 参考译文：' + correctTrans + '</div><button class="quiz-submit" onclick="saIndex++;renderSentenceAnalysis()" style="margin-top:12px">下一题 →</button>';
  } else {
    let hints = [];
    if (!subjectOK) hints.push('👀 再找找主语是谁？');
    if (!predicateOK) hints.push('🔍 动词（谓语）在哪里？');
    if (!objectOK && hasObject) hints.push('🎯 宾语是动作的承受者，再试试？');
    if (!objectOK && !hasObject) hints.push('💡 这句话没有宾语哦');
    await addError({type:'sentence_analysis',sentence:item.sentence,userRoles:{...saWordRoles},correctRoles:[...item.roles],explanation:item.exp,translation:correctTrans,userTranslation:userTrans}, data);
    document.getElementById('saFeedback').innerHTML = '<div class="quiz-feedback wrong">' + hints.join('<br>') + '<br><br>📖 参考译文：' + correctTrans + '<br><br>' + item.exp + '</div><button class="quiz-submit" onclick="saIndex++;renderSentenceAnalysis()" style="margin-top:12px">下一题 →</button>';
  }
  await saveStudentData(currentUser.name, data);
}
