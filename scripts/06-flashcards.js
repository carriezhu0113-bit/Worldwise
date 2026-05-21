// ==================== FLASHCARDS ====================
let fcIndex = 0;
let fcWords = [];
let fcWrongWords = [];
let fcAnswered = false;
let fcAutoTimer = null;

async function initFlashcards() {
  fcIndex = 0;
  const content = await getContent();
  const sourceWords = content.vocabulary && content.vocabulary.length > 0 ? content.vocabulary : PET_SCENE_WORDS;
  const allWords = [...sourceWords];
  shuffleArray(allWords);
  fcWords = allWords.slice(0, 40);
  fcWrongWords = [];
  fcAnswered = false;
  if (fcAutoTimer) clearTimeout(fcAutoTimer);
  const data = await getStudentData(currentUser.name);
  const today = new Date().toDateString();
  const todayKey = 'fcToday_' + today;
  if (!data[todayKey]) {
    data[todayKey] = fcWords.map(w => w.word);
    await saveStudentData(currentUser.name, data);
  }
  document.getElementById('fcDailyCount').textContent = `今日打卡：共 ${fcWords.length} 个单词 · 已掌握 ${(data.wordsKnown||[]).length} 词`;
  renderFlashcard();
}

function renderFlashcard() {
  if (fcIndex >= fcWords.length) {
    if (fcWrongWords.length > 0) {
      fcWords = [...fcWrongWords];
      fcWrongWords = [];
      fcIndex = 0;
      shuffleArray(fcWords);
    } else {
      document.getElementById('fcWord').textContent = '🎉 完成!';
      document.getElementById('fcPhonetic').textContent = '';
      document.getElementById('fcPos').textContent = '';
      document.getElementById('fcOptions').innerHTML = '<div style="text-align:center;padding:20px;color:#059669;font-size:18px">本轮全部完成！太棒了！</div>';
      document.getElementById('fcFeedback').innerHTML = '';
      document.getElementById('fcNextBtn').style.display = 'none';
      document.getElementById('fcProgress').textContent = fcWords.length + ' / ' + fcWords.length;
      return;
    }
  }
  fcAnswered = false;
  document.getElementById('fcNextBtn').style.display = 'none';
  document.getElementById('fcFeedback').innerHTML = '';
  const w = fcWords[fcIndex];
  document.getElementById('fcWord').textContent = w.word;
  document.getElementById('fcPhonetic').textContent = '/' + w.phonetic + '/';
  document.getElementById('fcPos').textContent = w.pos || '';
  document.getElementById('fcProgress').textContent = (fcIndex + 1) + ' / ' + fcWords.length;

  // 生成4个选项
  const correctMeaning = w.meaning;
  let options = [correctMeaning];
  const allMeanings = fcWords.filter(x => x.word !== w.word).map(x => x.meaning);
  shuffleArray(allMeanings);
  for (let i = 0; i < allMeanings.length && options.length < 4; i++) {
    if (!options.includes(allMeanings[i])) options.push(allMeanings[i]);
  }
  while (options.length < 4) options.push('暂无释义');
  shuffleArray(options);

  const correctIdx = options.indexOf(correctMeaning);
  let html = '';
  options.forEach((opt, i) => {
    html += `<button class="fc-option-btn" data-idx="${i}" onclick="fcSelectAnswer(${i},${correctIdx})">${String.fromCharCode(65+i)}. ${opt}</button>`;
  });
  document.getElementById('fcOptions').innerHTML = html;

  // 自动播放读音
  setTimeout(() => speakWord(w.word), 300);
}

function speakWord(word) {
  // 使用有道词典发音，type=0 为美音，type=1 为英音
  const audioUrl = `https://dict.youdao.com/dictvoice?type=0&audio=${encodeURIComponent(word)}`;
  const audio = new Audio(audioUrl);
  audio.play().catch(() => {
    // 如果有道发音失败，回退到浏览器语音合成
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  });
}

async function fcSelectAnswer(selected, correct) {
  if (fcAnswered) return;
  fcAnswered = true;
  const w = fcWords[fcIndex];

  // 立即更新 UI 反馈
  const btns = document.querySelectorAll('.fc-option-btn');
  btns.forEach(b => {
    b.style.pointerEvents = 'none';
    const idx = parseInt(b.dataset.idx);
    if (idx === correct) b.style.background = '#d1fae5';
    if (idx === selected && selected !== correct) b.style.background = '#fee2e2';
  });

  if (selected === correct) {
    let extra = '';
    if (w.synonyms && w.synonyms !== '暂无') extra = `<div style="margin-top:8px;font-size:13px;color:#059669">💡 ${w.synonyms}</div>`;
    if (w.phrase) extra += `<div style="font-size:13px;color:#059669">📎 ${w.phrase}</div>`;
    document.getElementById('fcFeedback').innerHTML = `<div style="color:#059669;font-size:16px;font-weight:600">✅ 正确！</div>${extra}`;
  } else {
    document.getElementById('fcFeedback').innerHTML = `<div style="color:#ef4444;font-size:16px;font-weight:600">❌ 正确答案：${w.meaning}</div><div style="margin-top:6px;font-size:13px;color:#64748b">这个单词稍后会再次出现</div>`;
  }

  document.getElementById('fcNextBtn').style.display = 'inline-block';

  // 后台保存数据
  const data = await getStudentData(currentUser.name);
  data.flashcardDone = (data.flashcardDone || 0) + 1;
  if (selected === correct) {
    data.flashcardCorrect = (data.flashcardCorrect || 0) + 1;
    if (!data.wordsKnown.includes(w.word)) data.wordsKnown.push(w.word);
    data.wordsUnknown = data.wordsUnknown.filter(x => x !== w.word);
  } else {
    if (!data.wordsUnknown.includes(w.word)) data.wordsUnknown.push(w.word);
    fcWrongWords.push(w);
  }
  data.wordsLearned = new Set([...data.wordsKnown, ...data.wordsUnknown]).size;
  await saveStudentData(currentUser.name, data);

  fcAutoTimer = setTimeout(() => { fcNextWord(); }, 5000);
}

function fcNextWord() {
  if (fcAutoTimer) clearTimeout(fcAutoTimer);
  fcIndex++;
  renderFlashcard();
}
