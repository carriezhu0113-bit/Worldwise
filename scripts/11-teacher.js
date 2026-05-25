// ==================== TEACHER ====================
async function renderTeacherOverview() {
  const students = await getAllStudents();
  const container = document.getElementById('teacherStats');
  const totalStudents = students.length;
  const totalTests = students.reduce((s, st) => s + (st.testsCompleted || 0), 0);
  const totalCorrect = students.reduce((s, st) => s + (st.testsCorrect || 0), 0);
  const totalErrors = students.reduce((s, st) => s + (st.errors ? st.errors.length : 0), 0);
  const avgAcc = totalTests > 0 ? Math.round(totalCorrect / totalTests * 100) : 0;

  container.innerHTML = `
    <div class="stat-card"><div class="num">${totalStudents}</div><div class="label">学生总数</div></div>
    <div class="stat-card"><div class="num">${totalTests}</div><div class="label">总测试数</div></div>
    <div class="stat-card"><div class="num">${avgAcc}%</div><div class="label">平均正确率</div></div>
    <div class="stat-card"><div class="num">${totalErrors}</div><div class="label">待复习错题</div></div>
  `;

  const listContainer = document.getElementById('studentList');
  if (students.length === 0) {
    listContainer.innerHTML = '<div style="text-align:center;padding:20px;color:#94a3b8">暂无学生数据</div>';
    return;
  }
  listContainer.innerHTML = students.map(s => {
    const wordsPct = allWordsFlat.length > 0 ? Math.round((s.wordsLearned||0) / allWordsFlat.length * 100) : 0;
    const fcAcc = (s.flashcardDone||0) > 0 ? Math.round((s.flashcardCorrect||0) / s.flashcardDone * 100) : 0;
    const spAcc = (s.spellingDone||0) > 0 ? Math.round((s.spellingCorrect||0) / s.spellingDone * 100) : 0;
    const grAcc = (s.grammarDone||0) > 0 ? Math.round((s.grammarCorrect||0) / s.grammarDone * 100) : 0;
    const saAcc = (s.sentenceAnalysisDone||0) > 0 ? Math.round((s.sentenceAnalysisCorrect||0) / s.sentenceAnalysisDone * 100) : 0;
    const grWrong = (s.grammarDone||0) - (s.grammarCorrect||0);
    const saWrong = (s.sentenceAnalysisDone||0) - (s.sentenceAnalysisCorrect||0);
    const spWrong = (s.spellingDone||0) - (s.spellingCorrect||0);
    const fcWrong = (s.flashcardDone||0) - (s.flashcardCorrect||0);
    return `<div class="student-row" onclick="showStudentDetail('${s.name}')">
      <div>
        <div class="student-name">👤 ${s.name}</div>
        <div class="student-stats">📖单词${s.wordsLearned||0}词(${wordsPct}%) · ✏️拼写${s.spellingDone||0}次(错${spWrong}) · 📝语法${s.grammarDone||0}次(错${grWrong}) · 🔍句子${s.sentenceAnalysisDone||0}次(错${saWrong})</div>
        <div class="student-stats" style="margin-top:2px">闪卡${s.flashcardDone||0}次(错${fcWrong}) · 错题${(s.errors||[]).length}道 · 测试${s.testsCompleted||0}次</div>
        <div class="progress-bar"><div class="fill" style="width:${wordsPct}%"></div></div>
      </div>
      <span style="color:#2563eb">查看 →</span>
    </div>`;
  }).join('');
}

async function showStudentDetail(name) {
  switchTeacherTab('students');
  const data = await getStudentData(name);
  const acc = getAccuracyRate(data);
  const wordsPct = allWordsFlat.length > 0 ? Math.round((data.wordsLearned||0) / allWordsFlat.length * 100) : 0;
  const fcAcc = (data.flashcardDone||0) > 0 ? Math.round((data.flashcardCorrect||0) / data.flashcardDone * 100) : 0;
  const spAcc = (data.spellingDone||0) > 0 ? Math.round((data.spellingCorrect||0) / data.spellingDone * 100) : 0;
  const grAcc = (data.grammarDone||0) > 0 ? Math.round((data.grammarCorrect||0) / data.grammarDone * 100) : 0;
  const saAcc = (data.sentenceAnalysisDone||0) > 0 ? Math.round((data.sentenceAnalysisCorrect||0) / data.sentenceAnalysisDone * 100) : 0;

  document.getElementById('studentDetail').innerHTML = `
    <h3>👤 ${name} 的学习报告</h3>
    <div class="stats" style="margin-top:16px">
      <div class="stat-card"><div class="num">${data.wordsLearned||0}</div><div class="label">已学单词</div></div>
      <div class="stat-card"><div class="num">${data.testsCompleted||0}</div><div class="label">完成测试</div></div>
      <div class="stat-card"><div class="num">${acc}%</div><div class="label">总正确率</div></div>
      <div class="stat-card"><div class="num">${(data.errors||[]).length}</div><div class="label">错题数</div></div>
    </div>
    <div class="card">
      <h4>📊 各模块成绩</h4>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:14px">
        <div style="padding:10px;background:#eff6ff;border-radius:8px">
          <div style="font-weight:600;color:#2563eb">📖 单词闪卡</div>
          <div>练习${data.flashcardDone||0}次 · 正确率 <b>${fcAcc}%</b></div>
          <div style="font-size:12px;color:#64748b">认识${data.wordsKnown.length}词 · 不认识${data.wordsUnknown.length}词</div>
        </div>
        <div style="padding:10px;background:#fef3c7;border-radius:8px">
          <div style="font-weight:600;color:#d97706">✏️ 拼写</div>
          <div>练习${data.spellingDone||0}次 · 正确率 <b>${spAcc}%</b></div>
        </div>
        <div style="padding:10px;background:#fef2f2;border-radius:8px">
          <div style="font-weight:600;color:#dc2626">📝 语法</div>
          <div>练习${data.grammarDone||0}次 · 正确率 <b>${grAcc}%</b></div>
        </div>
        <div style="padding:10px;background:#f0fdf4;border-radius:8px">
          <div style="font-weight:600;color:#059669">🔍 句子分析</div>
          <div>练习${data.sentenceAnalysisDone||0}次 · 正确率 <b>${saAcc}%</b></div>
        </div>
      </div>
    </div>
    <div class="card">
      <h4>📊 学习进度</h4>
      <div class="subtitle">单词学习进度</div>
      <div class="progress-bar"><div class="fill" style="width:${wordsPct}%"></div></div>
      <div style="margin-top:4px;font-size:12px;color:#64748b">${wordsPct}% (${data.wordsLearned||0}/${allWordsFlat.length})</div>
    </div>
    <div class="card">
      <h4>❌ 错题详情 (${(data.errors||[]).length}道)</h4>
      ${(data.errors||[]).length === 0 ? '<div style="color:#94a3b8">暂无错题</div>' :
        data.errors.map(e => {
          let content = '';
          if (e.type === 'grammar_mc') content = `📝选择题：${e.question}<br>学生答案：${String.fromCharCode(65+(e.userAnswer||0))} · 正确答案：${String.fromCharCode(65+e.correct)}<br><span style="color:#64748b;font-size:12px">${e.explanation||''}</span>`;
          else if (e.type === 'grammar_fill') content = `📝填空题：${e.question}<br>学生答案：<span style="color:#ef4444">${e.userAnswer||'（未填）'}</span> · 正确答案：<span style="color:#059669">${e.correct}</span><br><span style="color:#64748b;font-size:12px">${e.explanation||''}</span>`;
          else if (e.type === 'grammar_correct') content = `📝改错题：${e.wrong}<br>学生答案：<span style="color:#ef4444">${e.userAnswer||'（未填）'}</span> · 正确答案：<span style="color:#059669">${e.correct}</span><br><span style="color:#64748b;font-size:12px">${e.explanation||''}</span>`;
          else if (e.type === 'spelling') content = `✏️听写：${e.word}<br>学生答案：<span style="color:#ef4444">${e.userAnswer||'（未填）'}</span>`;
          else if (e.type === 'sentence_analysis') content = `🔍句子分析：${e.sentence}<br>学生翻译：${e.userTranslation||'（未填写）'}<br>参考译文：${e.translation||''}<br><span style="color:#64748b;font-size:12px">${e.explanation||''}</span>`;
          return `<div style="padding:10px;background:#fef2f2;border-radius:8px;margin-bottom:8px;font-size:13px;line-height:1.6">${content}</div>`;
        }).join('')
      }
    </div>
    <div class="card">
      <h4>🎯 教学建议</h4>
      <div style="font-size:14px;line-height:1.8;color:#475569">
        ${fcAcc < 50 && data.flashcardDone > 5 ? '⚠️ 单词闪卡正确率偏低，建议加强词汇记忆训练。<br>' : ''}
        ${spAcc < 50 && data.spellingDone > 3 ? '⚠️ 拼写正确率偏低，建议增加听写练习。<br>' : ''}
        ${grAcc < 50 && data.grammarDone > 3 ? '⚠️ 语法正确率偏低，建议针对错题类型进行专项讲解。<br>' : ''}
        ${saAcc < 50 && data.sentenceAnalysisDone > 3 ? '⚠️ 句子分析正确率偏低，建议加强句子结构讲解。<br>' : ''}
        ${(data.errors||[]).length > 10 ? '📌 错题较多，建议安排错题复习课。<br>' : ''}
        ${(data.wordsLearned||0) < 10 ? '📖 单词学习进度较慢，建议增加每日单词学习量。<br>' : ''}
        ${fcAcc >= 80 && spAcc >= 80 && grAcc >= 80 ? '👍 各模块表现良好，可以加大学习难度。' : ''}
      </div>
    </div>
    <button class="quiz-submit" onclick="switchTeacherTab('overview');renderTeacherOverview()" style="margin-top:12px">← 返回学生列表</button>
  `;
}

async function renderTeacherStudents() {
  const students = await getAllStudents();
  const container = document.getElementById('studentDetail');
  if (students.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8">暂无学生数据</div>';
    return;
  }
  container.innerHTML = '<h3>👥 所有学生</h3>' + students.map(s => {
    const acc = getAccuracyRate(s);
    return `<div class="student-row" onclick="showStudentDetail('${s.name}')" style="margin-top:8px">
      <div><div class="student-name">👤 ${s.name}</div><div class="student-stats">测试${s.testsCompleted||0}次 · 正确率${acc}%</div></div>
      <span style="color:#2563eb">查看 →</span>
    </div>`;
  }).join('');
}

// 自动推送：学生首次登录时自动创建推送配置
async function autoPushForStudent(name) {
  const grade = STUDENT_GRADES[name];
  if (!grade || !AUTO_PUSH_CONFIGS[grade]) return; // 无对应配置则跳过

  // 超时保护：最多等待 3 秒
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000));

  try {
    // 先检查是否已有推送配置
    const { data } = await Promise.race([
      sb.from('push_configs').select('push_config').eq('student_name', name).single(),
      timeout
    ]);
    if (data && data.push_config) return; // 已有配置，不覆盖
  } catch(e) {
    // 无配置或超时，继续创建
  }

  // 自动创建推送配置
  const pushConfig = AUTO_PUSH_CONFIGS[grade];
  try {
    await Promise.race([
      sb.from('push_configs').upsert({
        student_name: name,
        push_config: pushConfig,
        updated_at: new Date().toISOString()
      }, { onConflict: 'student_name' }),
      timeout
    ]);

    // 清除缓存
    localStorage.removeItem('push_config_' + name);
    if (typeof _cachedPushStudent !== 'undefined' && _cachedPushStudent === name) {
      _cachedPushConfig = undefined;
      _cachedPushStudent = null;
    }
  } catch(e) {
    // 自动推送失败不影响登录流程
  }
}


// ==================== PUSH MANAGEMENT ====================
async function renderPushManagement() {
  // 加载学生列表
  const students = await getAllStudents();
  const select = document.getElementById('pushStudentSelect');
  select.innerHTML = '<option value="">-- 选择学生 --</option>' + students.map(s => `<option value="${s.name}">${s.name}</option>`).join('');

  // 渲染单词模块
  const vocabDiv = document.getElementById('pushVocabModules');
  vocabDiv.innerHTML = Object.entries(MODULE_LIBRARY.vocabulary).map(([key, mod]) => `
    <label style="display:flex;align-items:center;gap:8px;padding:10px;background:#f8fafc;border-radius:8px;cursor:pointer">
      <input type="checkbox" class="push-vocab" value="${key}">
      <span>${mod.name} (${mod.words.length}词)</span>
    </label>
  `).join('');

  // 渲染语法模块
  const grammarDiv = document.getElementById('pushGrammarModules');
  grammarDiv.innerHTML = Object.entries(MODULE_LIBRARY.grammar).map(([key, mod]) => `
    <label style="display:flex;align-items:center;gap:8px;padding:10px;background:#f8fafc;border-radius:8px;cursor:pointer">
      <input type="checkbox" class="push-grammar" value="${key}">
      <span>${mod.name} (${(mod.mc||[]).length + (mod.fill||[]).length + (mod.correct||[]).length}题)</span>
    </label>
  `).join('');

  // 渲染句子分析模块
  const sentenceDiv = document.getElementById('pushSentenceModules');
  sentenceDiv.innerHTML = Object.entries(MODULE_LIBRARY.sentences).map(([key, mod]) => `
    <label style="display:flex;align-items:center;gap:8px;padding:10px;background:#f8fafc;border-radius:8px;cursor:pointer">
      <input type="checkbox" class="push-sentence" value="${key}">
      <span>${mod.name} (${mod.items.length}题)</span>
    </label>
  `).join('');
}

async function savePushConfig() {
  const student = document.getElementById('pushStudentSelect').value;
  if (!student) {
    document.getElementById('pushMsg').innerHTML = '<span style="color:#ef4444">请先选择学生</span>';
    return;
  }

  const pushConfig = {
    vocabulary: Array.from(document.querySelectorAll('.push-vocab:checked')).map(c => c.value),
    grammar: Array.from(document.querySelectorAll('.push-grammar:checked')).map(c => c.value),
    sentences: Array.from(document.querySelectorAll('.push-sentence:checked')).map(c => c.value)
  };

  const moduleCount = pushConfig.vocabulary.length + pushConfig.grammar.length + pushConfig.sentences.length;
  if (moduleCount === 0) {
    document.getElementById('pushMsg').innerHTML = '<span style="color:#ef4444">请至少选择一个模块</span>';
    return;
  }

  try {
    await sb.from('push_configs').upsert({
      student_name: student,
      push_config: pushConfig,
      updated_at: new Date().toISOString()
    }, { onConflict: 'student_name' });

    // 清除该学生的推送配置缓存
    localStorage.removeItem('push_config_' + student);
    if (typeof _cachedPushStudent !== 'undefined' && _cachedPushStudent === student) {
      _cachedPushConfig = undefined;
      _cachedPushStudent = null;
    }

    const moduleNames = [
      ...pushConfig.vocabulary.map(k => MODULE_LIBRARY.vocabulary[k]?.name),
      ...pushConfig.grammar.map(k => MODULE_LIBRARY.grammar[k]?.name),
      ...pushConfig.sentences.map(k => MODULE_LIBRARY.sentences[k]?.name)
    ].filter(Boolean).join('、');

    document.getElementById('pushMsg').innerHTML = `<span style="color:#22c55e">✅ 已推送 ${moduleCount} 个模块给 <b>${student}</b>：<br>${moduleNames}</span>`;
  } catch(e) {
    document.getElementById('pushMsg').innerHTML = `<span style="color:#ef4444">推送失败：${e.message}</span>`;
  }
}
