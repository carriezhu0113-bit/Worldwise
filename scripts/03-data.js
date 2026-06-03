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
  // 优先从 Supabase 读取（教师端需要看到所有学生的数据）
  let rows = [];
  try {
    const { data, error } = await sb.from('students').select('name,data,updated_at');
    if (error) {
      console.error('Supabase读取失败:', error.message, error.details);
    } else if (data) {
      rows = data;
      console.log('从 Supabase 读取到', rows.length, '个学生');
    }
  } catch(e) {
    console.error('Supabase异常:', e.message);
  }
  
  // 同时读取 localStorage 中的数据（作为补充）
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
  
  // 合并数据：以 Supabase 为主，localStorage 作为补充
  const mergedMap = new Map();
  
  // 先添加 Supabase 数据
  for (const sr of rows) {
    mergedMap.set(sr.name, {name: sr.name, ...sr.data});
  }
  
  // 再添加 localStorage 中独有的数据（Supabase 中没有的）
  for (const lr of localRows) {
    if (!mergedMap.has(lr.name)) {
      mergedMap.set(lr.name, {name: lr.name, ...lr.data});
    } else {
      // 如果两边都有，比较更新时间，使用更新的
      const existing = mergedMap.get(lr.name);
      const localTime = lr.data.lastActive || '1970';
      const serverTime = existing.lastActive || '1970';
      if (localTime > serverTime) {
        mergedMap.set(lr.name, {name: lr.name, ...lr.data});
      }
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
