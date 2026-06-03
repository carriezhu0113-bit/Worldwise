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
      console.warn('Supabase同步失败:', name, error.message, error.details);
      // 加入队列稍后重试
      _syncQueue.push({ name, data, time: Date.now() });
      if (!_syncing) processSyncQueue();
    } else {
      console.log('Supabase同步成功:', name);
    }
  } catch(e) {
    console.error('Supabase同步异常:', e.message);
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
  
  // 合并 Supabase 和 localStorage 数据（优先使用更新的数据）
  const mergedMap = new Map();
  
  // 先添加 Supabase 数据
  for (const sr of rows) {
    mergedMap.set(sr.name, {name: sr.name, ...sr.data});
  }
  
  // 再添加/覆盖 localStorage 数据（本地数据通常更新）
  for (const lr of localRows) {
    const existing = mergedMap.get(lr.name);
    if (!existing) {
      // 本地独有，直接添加
      mergedMap.set(lr.name, {name: lr.name, ...lr.data});
    } else {
      // 比较更新时间，使用更新的
      const localTime = lr.data.lastActive || lr.data.updated_at || '1970';
      const serverTime = existing.lastActive || existing.updated_at || '1970';
      if (localTime >= serverTime) {
        mergedMap.set(lr.name, {name: lr.name, ...lr.data});
      }
      // 否则保留服务器数据
    }
  }
  
  return Array.from(mergedMap.values());
}

// 页面关闭前确保数据同步
window.addEventListener('beforeunload', () => {
  if (_cachedStudentData && _cachedStudentName) {
    // 使用 fetch keepalive 确保数据发送（支持自定义 headers）
    const payload = JSON.stringify({
      name: _cachedStudentName,
      data: _cachedStudentData,
      updated_at: new Date().toISOString()
    });
    fetch(`${SUPABASE_URL}/rest/v1/students?on_conflict=name`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: payload,
      keepalive: true
    });
  }
});

// 页面可见性变化时同步数据
document.addEventListener('visibilitychange', () => {
  if (document.hidden && _cachedStudentData && _cachedStudentName) {
    syncToSupabase(_cachedStudentName, _cachedStudentData);
  }
});
