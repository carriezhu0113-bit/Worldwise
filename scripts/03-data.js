// ==================== DATA MANAGEMENT ====================
// 内存缓存，避免每次操作都读 Supabase
let _cachedStudentData = null;
let _cachedStudentName = null;
let _syncQueue = [];
let _syncing = false;

async function getStudentData(name) {
  const key = 'eng_app_student_' + name;

  // 优先使用内存缓存
  if (_cachedStudentName === name && _cachedStudentData) {
    return _cachedStudentData;
  }

  // 其次使用 localStorage
  const cached = localStorage.getItem(key);
  if (cached) {
    try {
      _cachedStudentData = JSON.parse(cached);
      _cachedStudentName = name;
      // 立即同步到 Supabase（确保数据不丢失）
      await syncToSupabase(name, _cachedStudentData);
      return _cachedStudentData;
    } catch(e) {
      console.log('localStorage解析失败:', e.message);
    }
  }

  // 最后尝试从 Supabase 读取
  let data = null;
  try {
    const { data: row } = await sb.from('students').select('data').eq('name', name).maybeSingle();
    if (row && row.data) {
      data = row.data;
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch(e) {
    console.log('Supabase读取失败，使用本地缓存:', e.message);
  }

  if (!data) {
    data = {
      name: name,
      wordsLearned: 0,
      wordsKnown: [],
      wordsUnknown: [],
      testsCompleted: 0,
      testsCorrect: 0,
      errors: [],
      spellingDone: 0,
      spellingCorrect: 0,
      grammarDone: 0,
      grammarCorrect: 0,
      sentenceAnalysisDone: 0,
      sentenceAnalysisCorrect: 0,
      flashcardDone: 0,
      flashcardCorrect: 0,
      readingDone: 0,
      readingCorrect: 0,
      verbDone: 0,
      verbCorrect: 0,
      lastActive: new Date().toISOString(),
      sessions: []
    };
    saveStudentData(name, data);
  }

  _cachedStudentData = data;
  _cachedStudentName = name;
  return data;
}

// 同步到 Supabase（带队列和重试）
async function syncToSupabase(name, data) {
  try {
    const { error } = await sb.from('students').upsert(
      { name: name, data: data, updated_at: new Date().toISOString() },
      { onConflict: 'name' }
    );
    if (error) {
      console.log('Supabase同步失败:', name, error.message);
      // 加入队列稍后重试
      _syncQueue.push({ name, data, time: Date.now() });
      if (!_syncing) processSyncQueue();
    }
  } catch(e) {
    console.log('Supabase同步异常:', e.message);
    _syncQueue.push({ name, data, time: Date.now() });
    if (!_syncing) processSyncQueue();
  }
}

// 处理同步队列
async function processSyncQueue() {
  if (_syncQueue.length === 0 || _syncing) return;
  _syncing = true;
  
  while (_syncQueue.length > 0) {
    const item = _syncQueue.shift();
    try {
      const { error } = await sb.from('students').upsert(
        { name: item.name, data: item.data, updated_at: new Date().toISOString() },
        { onConflict: 'name' }
      );
      if (error) {
        // 重试失败，放回队列
        _syncQueue.unshift(item);
        await new Promise(r => setTimeout(r, 2000)); // 等待2秒再重试
      }
    } catch(e) {
      _syncQueue.unshift(item);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  _syncing = false;
}

function getAccuracyRate(data) {
  const totalAttempts = data && data.testsCompleted ? data.testsCompleted : 0;
  const totalCorrect = data && data.testsCorrect ? data.testsCorrect : 0;
  if (totalAttempts <= 0) return 0;
  return Math.round(totalCorrect / totalAttempts * 100);
}

async function saveStudentData(name, data) {
  const key = 'eng_app_student_' + name;
  data.lastActive = new Date().toISOString();
  localStorage.setItem(key, JSON.stringify(data));
  // 更新内存缓存
  _cachedStudentData = data;
  _cachedStudentName = name;
  // 同步到 Supabase（确保数据不丢失）
  await syncToSupabase(name, data);
}

async function getAllStudents() {
  let rows = [];
  try {
    const { data } = await sb.from('students').select('name,data');
    if (data) rows = data;
  } catch(e) {
    console.log('Supabase读取失败，使用本地缓存:', e.message);
  }
  
  // 同时读取 localStorage 中的数据
  const localRows = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('eng_app_student_')) {
      const name = key.replace('eng_app_student_', '');
      try {
        const data = JSON.parse(localStorage.getItem(key));
        localRows.push({name, data});
      } catch(e) {
        // 忽略损坏的数据
      }
    }
  }
  
  // 合并 Supabase 和 localStorage 数据（localStorage 优先，因为可能更新）
  const nameSet = new Set();
  const mergedRows = [];
  
  // 先添加 localStorage 数据（本地可能更新）
  for (const lr of localRows) {
    nameSet.add(lr.name);
    mergedRows.push(lr);
  }
  
  // 再添加 Supabase 中独有的数据
  for (const sr of rows) {
    if (!nameSet.has(sr.name)) {
      mergedRows.push(sr);
    } else {
      // 如果 Supabase 数据更新，使用 Supabase 的
      const local = localRows.find(lr => lr.name === sr.name);
      if (local && sr.data && sr.data.updated_at > (local.data.updated_at || '1970')) {
        const idx = mergedRows.findIndex(r => r.name === sr.name);
        mergedRows[idx] = sr;
      }
    }
  }
  
  return mergedRows.map(r => ({name: r.name, ...r.data}));
}

// 页面关闭前确保数据同步
window.addEventListener('beforeunload', () => {
  if (_cachedStudentData && _cachedStudentName) {
    // 使用 sendBeacon 确保数据发送
    const payload = JSON.stringify({
      name: _cachedStudentName,
      data: _cachedStudentData,
      updated_at: new Date().toISOString()
    });
    navigator.sendBeacon(
      `${SUPABASE_URL}/rest/v1/students?on_conflict=name`,
      new Blob([payload], { type: 'application/json' })
    );
  }
});

// 页面可见性变化时同步数据
document.addEventListener('visibilitychange', () => {
  if (document.hidden && _cachedStudentData && _cachedStudentName) {
    syncToSupabase(_cachedStudentName, _cachedStudentData);
  }
});
