// ==================== ERRORS ====================
function buildErrorRecord(err) {
  return {
    ...err,
    id: Date.now() + Math.floor(Math.random() * 1000),
    reviewed: 0,
    nextReview: Date.now()
  };
}

async function addError(err, studentData = null) {
  const errorRecord = buildErrorRecord(err);
  if (studentData) {
    studentData.errors = studentData.errors || [];
    studentData.errors.push(errorRecord);
    return errorRecord;
  }

  const data = await getStudentData(currentUser.name);
  data.errors = data.errors || [];
  data.errors.push(errorRecord);
  await saveStudentData(currentUser.name, data);
  return errorRecord;
}

async function renderErrors() {
  const data = await getStudentData(currentUser.name);
  const container = document.getElementById('errorContent');
  document.getElementById('errorCount').textContent = data.errors.length;

  if (data.errors.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#64748b">🎉 没有错题，太棒了！</div>';
    return;
  }

  const now = Date.now();
  const dueErrors = data.errors.filter(e => e.nextReview <= now);
  const futureErrors = data.errors.filter(e => e.nextReview > now);

  let html = '';
  if (dueErrors.length > 0) {
    html += `<div class="subtitle" style="color:#ef4444">🔴 待复习错题 (${dueErrors.length}道)</div>`;
    dueErrors.forEach(e => {
      html += renderErrorItem(e, true);
    });
  }
  if (futureErrors.length > 0) {
    html += `<div class="subtitle" style="color:#94a3b8;margin-top:16px">⏳ 等待复习 (${futureErrors.length}道)</div>`;
    futureErrors.forEach(e => {
      html += renderErrorItem(e, false);
    });
  }
  container.innerHTML = html;
}

function renderErrorItem(e, isDue) {
  let content = '';
  if (e.type === 'grammar_mc') {
    content = `<b>选择题：</b>${e.question}<br>你的答案：${String.fromCharCode(65+e.userAnswer)} · 正确答案：${String.fromCharCode(65+e.correct)}<br><span style="color:#64748b">${e.explanation||''}</span>`;
  } else if (e.type === 'grammar_fill') {
    content = `<b>填空题：</b>${e.question}<br>你的答案：${e.userAnswer} · 正确答案：${e.correct}<br><span style="color:#64748b">${e.explanation||''}</span>`;
  } else if (e.type === 'grammar_correct') {
    content = `<b>改错题：</b>${e.wrong}<br>你的答案：${e.userAnswer} · 正确答案：${e.correct}<br><span style="color:#64748b">${e.explanation||''}</span>`;
  } else if (e.type === 'spelling') {
    content = `<b>拼写：</b>${e.word}<br>你的答案：${e.userAnswer}`;
  } else if (e.type === 'reading') {
    content = `<b>阅读理解：</b>${e.passage}<br>${e.question}<br>你的答案：${String.fromCharCode(65+e.userAnswer)} · 正确答案：${String.fromCharCode(65+e.correct)}`;
  } else if (e.type === 'sentence_analysis') {
    content = `<b>句子分析：</b>${e.sentence}<br>你的翻译：${e.userTranslation||'（未填写）'}<br>📖 参考译文：${e.translation||''}<br><span style="color:#64748b">${e.explanation||''}</span>`;
  }
  return `<div style="background:${isDue?'#fef2f2':'#f8fafc'};padding:12px;border-radius:8px;margin-bottom:8px;font-size:14px;line-height:1.6">
    ${content}
    ${isDue ? `<button style="margin-top:8px;padding:6px 16px;background:#059669;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px" onclick="reviewError(${e.id})">✅ 已掌握</button>` : ''}
  </div>`;
}

async function reviewError(id) {
  const data = await getStudentData(currentUser.name);
  const err = data.errors.find(e => e.id === id);
  if (!err) return;
  err.reviewed = (err.reviewed || 0) + 1;
  const intervals = [1, 3, 7, 14, 30];
  const days = intervals[Math.min(err.reviewed, intervals.length - 1)];
  err.nextReview = Date.now() + days * 24 * 60 * 60 * 1000;
  if (err.reviewed >= 5) {
    data.errors = data.errors.filter(e => e.id !== id);
  }
  await saveStudentData(currentUser.name, data);
  renderErrors();
}
