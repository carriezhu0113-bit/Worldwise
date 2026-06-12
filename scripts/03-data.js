// ==================== DATA MANAGEMENT ====================
// 优化版：减少 Supabase 请求频率，增加退避机制

let _cachedStudentData = null;
let _cachedStudentName = null;
let _pendingSync = null;
let _syncTimer = null;
let _consecutiveFailures = 0;
let _nextRetryDelay = 10000; // 初始重试间隔 10 秒
const MAX_RETRY_DELAY = 300000; // 最大重试间隔 5 分钟
const MAX_CONSECUTIVE_FAILURES = 5; // 连续失败 5 次后暂停同步

// 获取学生数据（优先从 localStorage，后台异步同步）
async function getStudentData(name) {
  const key = 'eng_app_student_' + name;

  if (_cachedStudentName === name && _cachedStudentData) {
    return _cachedStudentData;
  }

  // 1. 优先从 localStorage 读取（快速返回）
  const localCached = localStorage.getItem(key);
  if (localCached) {
    try {
      const localData = JSON.parse(localCached);
      _cachedStudentData = localData;
      _cachedStudentName = name;
      // 后台异步同步到云端（不阻塞）
      _syncToCloudAsync(name, localData);
      console.log('从本地缓存加载:', name);
      return localData;
    } catch(e) {
      console.error('localStorage解析失败:', e.message);
    }
  }

  // 2. 本地没有，尝试从云端读取
  let cloudData = null;
  try {
    const { data: row, error } = await sb.from('students').select('data').eq('name', name).maybeSingle();
    if (error) {
      console.warn('Supabase读取失败:', error.message);
    } else if (row && row.data) {
      cloudData = row.data;
      console.log('从云端加载数据:', name);
    }
  } catch(e) {
    console.warn('Supabase异常:', e.message);
  }

  if (cloudData) {
    _cachedStudentData = cloudData;
    _cachedStudentName = name;
    localStorage.setItem(key, JSON.stringify(cloudData));
    _consecutiveFailures = 0;
    _nextRetryDelay = 10000;
    return cloudData;
  }

  // 3. 都没有，创建新数据
  const newData = {
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
  
  _cachedStudentData = newData;
  _cachedStudentName = name;
  localStorage.setItem(key, JSON.stringify(newData));
  _syncToCloudAsync(name, newData);
  console.log('创建新学生数据:', name);
  return newData;
}

// 异步同步到云端（不阻塞 UI）
function _syncToCloudAsync(name, data) {
  _syncToCloud(name, data).catch(() => {}); // 忽略错误，避免 unhandled rejection
}

// 直接调用 Supabase REST API
async function _syncToCloud(name, data) {
  // 如果连续失败太多，暂停同步
  if (_consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
    console.warn(`连续失败 ${_consecutiveFailures} 次，暂停同步`);
    return;
  }

  const payload = {
    name: name,
    data: data,
    updated_at: new Date().toISOString()
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 秒超时

    const response = await fetch(`${SUPABASE_URL}/rest/v1/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('云端同步失败:', name, response.status, errorText);
      _handleSyncFailure(name, data);
    } else {
      console.log('云端同步成功:', name);
      _pendingSync = null;
      _consecutiveFailures = 0;
      _nextRetryDelay = 10000;
    }
  } catch(e) {
    if (e.name === 'AbortError') {
      console.warn('云端同步超时:', name);
    } else {
      console.error('云端同步异常:', e.message);
    }
    _handleSyncFailure(name, data);
  }
}

// 处理同步失败（指数退避）
function _handleSyncFailure(name, data) {
  _consecutiveFailures++;
  _pendingSync = { name, data, time: Date.now() };
  // 指数退避：10s -> 20s -> 40s -> 80s -> 160s -> 300s
  _nextRetryDelay = Math.min(_nextRetryDelay * 2, MAX_RETRY_DELAY);
  console.warn(`同步失败，下次重试间隔: ${_nextRetryDelay}ms`);
}

// 保存学生数据（不阻塞 UI）
async function saveStudentData(name, data) {
  data.lastActive = new Date().toISOString();
  
  // 1. 立即更新缓存
  _cachedStudentData = data;
  _cachedStudentName = name;
  
  // 2. 保存到 localStorage
  const key = 'eng_app_student_' + name;
  localStorage.setItem(key, JSON.stringify(data));
  
  // 3. 异步同步到云端（不等待）
  _syncToCloudAsync(name, data);
}

// 获取所有学生数据（教师端使用）
async function getAllStudents() {
  let rows = [];
  
  // 优先从 localStorage 读取（快速）
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('eng_app_student_')) {
      const name = key.replace('eng_app_student_', '');
      try {
        const data = JSON.parse(localStorage.getItem(key));
        rows.push({name, data});
      } catch(e) {}
    }
  }

  // 后台异步从云端更新（不阻塞）
  _refreshStudentsFromCloud().catch(() => {});

  return rows.map(r => ({name: r.name, ...r.data}));
}

// 后台从云端刷新学生数据
async function _refreshStudentsFromCloud() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/students?select=name,data,updated_at`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const cloudRows = await response.json();
      // 合并云端数据到 localStorage
      for (const row of cloudRows) {
        if (row.data) {
          const key = 'eng_app_student_' + row.name;
          localStorage.setItem(key, JSON.stringify(row.data));
        }
      }
      console.log('从云端刷新', cloudRows.length, '个学生数据');
      _consecutiveFailures = 0;
    }
  } catch(e) {
    console.warn('云端刷新失败:', e.message);
  }
}

// 页面关闭前确保数据同步
window.addEventListener('beforeunload', () => {
  if (_cachedStudentData && _cachedStudentName) {
    const payload = JSON.stringify({
      name: _cachedStudentName,
      data: _cachedStudentData,
      updated_at: new Date().toISOString()
    });
    fetch(`${SUPABASE_URL}/rest/v1/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: payload,
      keepalive: true
    });
  }
});

// 页面可见性变化时同步数据
document.addEventListener('visibilitychange', () => {
  if (document.hidden && _cachedStudentData && _cachedStudentName) {
    _syncToCloudAsync(_cachedStudentName, _cachedStudentData);
  }
});

// 定期同步（使用退避间隔）
setInterval(() => {
  if (_pendingSync && _consecutiveFailures < MAX_CONSECUTIVE_FAILURES) {
    _syncToCloudAsync(_pendingSync.name, _pendingSync.data);
  } else if (_cachedStudentData && _cachedStudentName && _consecutiveFailures < MAX_CONSECUTIVE_FAILURES) {
    _syncToCloudAsync(_cachedStudentName, _cachedStudentData);
  }
}, _nextRetryDelay);

// 动态调整同步间隔
setInterval(() => {
  if (_consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
    console.log('同步已暂停，等待网络恢复');
  }
}, 60000);
