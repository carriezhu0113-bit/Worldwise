// ==================== DATA MANAGEMENT ====================
// 完全依赖 Supabase 云端存储，localStorage 仅作为临时缓存
// 目标：学生在任何设备登录，都能看到相同的数据，教师端也能看到所有数据

let _cachedStudentData = null;
let _cachedStudentName = null;
let _pendingSync = null; // 待同步的数据
let _syncTimer = null;

// 获取学生数据（优先从云端拉取）
async function getStudentData(name) {
  const key = 'eng_app_student_' + name;

  // 如果缓存命中，直接返回
  if (_cachedStudentName === name && _cachedStudentData) {
    return _cachedStudentData;
  }

  // 1. 优先从 Supabase 读取最新数据
  let cloudData = null;
  try {
    const { data: row, error } = await sb.from('students').select('data').eq('name', name).maybeSingle();
    if (error) {
      console.error('Supabase读取失败:', error.message, error.details);
    } else if (row && row.data) {
      cloudData = row.data;
      console.log('从云端加载数据:', name);
    }
  } catch(e) {
    console.error('Supabase异常:', e.message);
  }

  // 2. 如果云端有数据，使用云端数据
  if (cloudData) {
    _cachedStudentData = cloudData;
    _cachedStudentName = name;
    // 备份到 localStorage
    localStorage.setItem(key, JSON.stringify(cloudData));
    return cloudData;
  }

  // 3. 云端没有，尝试从 localStorage 读取（可能是旧数据）
  const localCached = localStorage.getItem(key);
  if (localCached) {
    try {
      const localData = JSON.parse(localCached);
      _cachedStudentData = localData;
      _cachedStudentName = name;
      // 立即同步到云端
      _syncToCloud(name, localData);
      console.log('从本地缓存加载并同步:', name);
      return localData;
    } catch(e) {
      console.error('localStorage解析失败:', e.message);
    }
  }

  // 4. 都没有，创建新数据
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
  // 立即同步到云端
  _syncToCloud(name, newData);
  console.log('创建新学生数据:', name);
  return newData;
}

// 直接调用 Supabase REST API（绕过 SDK，更可靠）
async function _syncToCloud(name, data) {
  const payload = {
    name: name,
    data: data,
    updated_at: new Date().toISOString()
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('云端同步失败:', name, response.status, errorText);
      // 保存待同步数据
      _pendingSync = { name, data, time: Date.now() };
    } else {
      console.log('云端同步成功:', name);
      _pendingSync = null;
    }
  } catch(e) {
    console.error('云端同步异常:', e.message);
    _pendingSync = { name, data, time: Date.now() };
  }
}

// 保存学生数据（核心方法）
async function saveStudentData(name, data) {
  data.lastActive = new Date().toISOString();
  
  // 1. 立即更新缓存
  _cachedStudentData = data;
  _cachedStudentName = name;
  
  // 2. 保存到 localStorage
  const key = 'eng_app_student_' + name;
  localStorage.setItem(key, JSON.stringify(data));
  
  // 3. 立即同步到云端（使用 fetch 直接调用）
  await _syncToCloud(name, data);
}

// 获取所有学生数据（教师端使用）
async function getAllStudents() {
  // 直接从 Supabase 读取所有学生数据
  let rows = [];
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/students?select=name,data,updated_at`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!response.ok) {
      console.error('Supabase读取失败:', response.status);
    } else {
      rows = await response.json();
      console.log('从云端读取到', rows.length, '个学生');
    }
  } catch(e) {
    console.error('Supabase异常:', e.message);
  }

  // 如果云端读取失败，尝试从 localStorage 读取（仅作为备份）
  if (rows.length === 0) {
    console.warn('云端无数据，尝试从本地读取');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('eng_app_student_')) {
        const name = key.replace('eng_app_student_', '');
        try {
          const data = JSON.parse(localStorage.getItem(key));
          rows.push({name, data});
        } catch(e) {
          // 忽略损坏的数据
        }
      }
    }
  }

  return rows.map(r => ({name: r.name, ...r.data}));
}

// 页面关闭前确保数据同步
window.addEventListener('beforeunload', () => {
  if (_cachedStudentData && _cachedStudentName) {
    const payload = JSON.stringify({
      name: _cachedStudentName,
      data: _cachedStudentData,
      updated_at: new Date().toISOString()
    });
    // 使用 fetch keepalive（支持自定义 headers）
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
    _syncToCloud(_cachedStudentName, _cachedStudentData);
  }
});

// 定期同步（每10秒）
setInterval(() => {
  if (_cachedStudentData && _cachedStudentName) {
    _syncToCloud(_cachedStudentName, _cachedStudentData);
  }
  // 检查是否有待同步的数据
  if (_pendingSync) {
    _syncToCloud(_pendingSync.name, _pendingSync.data);
  }
}, 10000);
