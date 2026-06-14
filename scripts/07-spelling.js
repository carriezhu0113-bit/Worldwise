// ==================== SPELLING ====================
let spIndex = 0;
let spWords = [];

async function initSpelling() {
  spIndex = 0;
  const content = await getContent();
  const sourceWords = content.vocabulary && content.vocabulary.length > 0 ? content.vocabulary : PET_SCENE_WORDS;
  const vocabularyMap = new Map(sourceWords.map(word => [word.word, word]));
  // 从今天的闪卡单词中随机选10个进行听写
  const data = await getStudentData(currentUser.name);
  const today = new Date().toDateString();
  const todayKey = 'fcToday_' + today;
  let todayWords = data[todayKey] || [];
  // 如果今天还没做闪卡，从全部单词中取40个
  if (todayWords.length === 0) {
    const allWords = [...sourceWords];
    shuffleArray(allWords);
    todayWords = allWords.slice(0, 40).map(w => w.word);
  }
  // 从今日单词中随机选10个
  shuffleArray(todayWords);
  const dictWords = todayWords.slice(0, 10).map(word => {
    return vocabularyMap.get(word) || {word: word};
  });
  spWords = dictWords;
  shuffleArray(spWords);
  document.getElementById('spellingInput').value = '';
  document.getElementById('spellingFeedback').innerHTML = '';
  renderSpelling();
}

function renderSpelling() {
  if (spIndex >= spWords.length) {
    document.getElementById('spellingHint').innerHTML = '🎉 拼写练习完成！';
    document.getElementById('spellingProgress').textContent = spWords.length + ' / ' + spWords.length;
    return;
  }
  const w = spWords[spIndex];
  document.getElementById('spellingLen').textContent = w.word.length;
  document.getElementById('spellingProgress').textContent = (spIndex + 1) + ' / ' + spWords.length;
  document.getElementById('spellingInput').value = '';
  document.getElementById('spellingInput').className = 'spelling-input';
  document.getElementById('spellingFeedback').innerHTML = '';
}

function playSpellingWord() {
  if (spIndex >= spWords.length) return;
  const word = spWords[spIndex].word;
  const audioUrl = `https://dict.youdao.com/dictvoice?type=0&audio=${encodeURIComponent(word)}`;
  const audio = new Audio(audioUrl);
  audio.play().catch(() => {
    // Fallback to browser speech synthesis
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.7;
      speechSynthesis.speak(utterance);
    }
  });
}

async function checkSpelling() {
  if (spIndex >= spWords.length) return;
  const input = document.getElementById('spellingInput').value.trim().toLowerCase();
  const correct = spWords[spIndex].word.toLowerCase();
  const data = await getStudentData(currentUser.name);
  data.spellingDone = (data.spellingDone || 0) + 1;

  if (input === correct) {
    data.spellingCorrect = (data.spellingCorrect || 0) + 1;
    document.getElementById('spellingInput').className = 'spelling-input correct';
    document.getElementById('spellingFeedback').innerHTML = '<span style="color:#059669">✅ 正确！</span>';
  } else {
    document.getElementById('spellingInput').className = 'spelling-input wrong';
    document.getElementById('spellingFeedback').innerHTML = `<span style="color:#ef4444">❌ 错误！正确答案是：<b>${spWords[spIndex].word}</b></span>`;
    await addError({type:'spelling',word:spWords[spIndex].word,userAnswer:input}, data);
  }
  await saveStudentData(currentUser.name, data);
  setTimeout(() => { spIndex++; renderSpelling(); }, 1500);
}
