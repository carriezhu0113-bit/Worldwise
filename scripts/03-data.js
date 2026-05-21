// ==================== DATA MANAGEMENT ====================
// 内存缓存，避免每次操作都读 Supabase
let _cachedStudentData = null;
let _cachedStudentName = null;

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
      // 后台同步 Supabase（不阻塞）
      syncToSupabase(name, _cachedStudentData);
      return _cachedStudentData;
    } catch(e) {
      // 缓存损坏，继续
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
      lastActive: new Date().toISOString()
    };
    saveStudentData(name, data);
  }

  _cachedStudentData = data;
  _cachedStudentName = name;
  return data;
}

// 后台同步到 Supabase（不阻塞）
function syncToSupabase(name, data) {
  try {
    sb.from('students').upsert({ name: name, data: data, updated_at: new Date().toISOString() }, { onConflict: 'name' });
  } catch(e) {
    // 静默失败
  }
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
  // 后台同步到 Supabase（不阻塞）
  syncToSupabase(name, data);
}

async function getAllStudents() {
  let rows = [];
  try {
    const { data } = await sb.from('students').select('name,data');
    if (data) rows = data;
  } catch(e) {
    console.log('Supabase读取失败，使用本地缓存:', e.message);
  }
  if (rows.length === 0) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('eng_app_student_')) {
        const name = key.replace('eng_app_student_', '');
        const data = JSON.parse(localStorage.getItem(key));
        rows.push({name, data});
      }
    }
  }
  return rows.map(r => ({name: r.name, ...r.data}));
}
