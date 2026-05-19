// ==================== DASHBOARD ====================
async function updateDashboard() {
  if (!currentUser || currentUser.type !== 'student') return;
  const data = await getStudentData(currentUser.name);
  const content = await getContent();
  const activeWords = content.vocabulary && content.vocabulary.length > 0 ? content.vocabulary : await getTodayWords();
  document.getElementById('statWords').textContent = data.wordsLearned || 0;
  document.getElementById('statTests').textContent = data.testsCompleted || 0;
  const acc = getAccuracyRate(data);
  document.getElementById('statAccuracy').textContent = acc + '%';
  document.getElementById('statErrors').textContent = data.errors.length;
  document.getElementById('errorCount').textContent = data.errors.length;

  const totalToday = activeWords.length;
  const learnedToday = activeWords.filter(w => data.wordsKnown.includes(w.word)).length;
  const progress = totalToday > 0 ? Math.round(learnedToday / totalToday * 100) : 0;
  document.getElementById('todayProgress').style.width = progress + '%';

  const wordTitles = [...new Set(activeWords.map(w => w.sceneTitle).filter(Boolean))];
  const taskTitle = wordTitles.length > 0 ? `📚 当前词汇：<b>${wordTitles.join(' + ')}</b>` : '📚 当前词汇：<b>教师推送内容</b>';
  document.getElementById('todayTask').innerHTML = `${taskTitle}<br>已学习 ${learnedToday}/${totalToday} 个单词 · 完成 ${data.testsCompleted} 次测试 · 待复习错题 ${data.errors.length} 道`;

  const totalAllWords = allWordsFlat.length;
  const totalLearned = data.wordsKnown.length;
  const totalProgress = totalAllWords > 0 ? Math.round(totalLearned / totalAllWords * 100) : 0;
  document.getElementById('trendInfo').innerHTML = data.testsCompleted > 0
    ? `📈 总进度：${totalProgress}%（${totalLearned}/${totalAllWords}词）· 正确率：${acc}% · 继续加油！每天坚持学习，从90分提升到120+！`
    : `📈 总进度：${totalProgress}%（${totalLearned}/${totalAllWords}词）· 完成更多测试后显示趋势数据`;
}
