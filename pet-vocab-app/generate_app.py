import json

# Read vocabulary data
with open('/Users/zhubaizhen/Library/Mobile Documents/iCloud~md~obsidian/Documents/CarrieThinking/pet-vocab-app/vocab_data.json', 'r', encoding='utf-8') as f:
    vocab_data = json.load(f)

# Convert to JavaScript format
js_data = json.dumps(vocab_data['scenes'], ensure_ascii=False, indent=2)

# HTML template with multi-student support
html_template = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PET词汇学习 - 多学生版</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f5f5;
      color: #333;
      line-height: 1.6;
    }
    .header {
      background: #1a1a1a;
      color: white;
      padding: 1rem;
      text-align: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .header h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .user-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 1rem;
      background: #333;
      font-size: 0.9rem;
    }
    .user-info .name { color: #4CAF50; font-weight: bold; }
    .nav { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
    .nav button {
      background: #333;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .nav button:hover { background: #555; }
    .nav button.active { background: #4CAF50; }
    .container { max-width: 800px; margin: 0 auto; padding: 1rem; }
    
    .login-container {
      max-width: 400px;
      margin: 2rem auto;
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    .login-container h2 { text-align: center; margin-bottom: 1rem; }
    .login-container input {
      width: 100%;
      padding: 1rem;
      margin: 0.5rem 0;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
    }
    .login-container button {
      width: 100%;
      padding: 1rem;
      margin: 0.5rem 0;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
    }
    .btn-primary { background: #4CAF50; color: white; }
    .btn-primary:hover { background: #45a049; }
    .btn-secondary { background: #2196F3; color: white; }
    .btn-secondary:hover { background: #1976D2; }
    .btn-warning { background: #FF9800; color: white; }
    .btn-warning:hover { background: #F57C00; }
    .btn-danger { background: #f44336; color: white; }
    .btn-danger:hover { background: #d32f2f; }
    .btn:disabled { background: #ccc; cursor: not-allowed; }
    
    .scene-selector {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
      margin: 1rem 0;
    }
    .scene-card {
      background: white;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: transform 0.2s;
    }
    .scene-card:hover { transform: translateY(-2px); }
    .scene-card.completed { border-left: 4px solid #4CAF50; }
    .scene-card.in-progress { border-left: 4px solid #FF9800; }
    .scene-card h3 { margin-bottom: 0.5rem; }
    .progress-bar {
      background: #e0e0e0;
      height: 8px;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 0.5rem;
    }
    .progress-fill {
      background: #4CAF50;
      height: 100%;
      transition: width 0.3s;
    }
    
    .flashcard {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      padding: 2rem;
      text-align: center;
      margin: 2rem 0;
      min-height: 300px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      position: relative;
    }
    .flashcard .word { font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem; }
    .flashcard .phonetic { font-size: 1.2rem; color: #666; margin-bottom: 0.5rem; }
    .flashcard .pos { font-size: 1rem; color: #999; margin-bottom: 1rem; }
    .flashcard .meaning { font-size: 1.5rem; color: #333; margin-bottom: 1rem; }
    .flashcard .phrase { font-size: 1rem; color: #666; margin-bottom: 0.5rem; }
    .flashcard .synonyms { font-size: 0.9rem; color: #999; }
    .flashcard .hint {
      position: absolute;
      bottom: 1rem;
      left: 50%;
      transform: translateX(-50%);
      color: #999;
      font-size: 0.8rem;
    }
    .controls {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      margin: 1rem 0;
    }
    .btn {
      flex: 1;
      padding: 1rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .quiz-container { background: white; padding: 2rem; border-radius: 12px; margin: 1rem 0; }
    .quiz-question { font-size: 1.2rem; margin-bottom: 1rem; }
    .quiz-options { display: grid; gap: 0.5rem; }
    .quiz-option {
      padding: 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .quiz-option:hover { border-color: #2196F3; background: #f0f8ff; }
    .quiz-option.correct { border-color: #4CAF50; background: #e8f5e9; }
    .quiz-option.wrong { border-color: #f44336; background: #ffebee; }
    .quiz-input {
      width: 100%;
      padding: 1rem;
      font-size: 1.2rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      margin: 1rem 0;
    }
    .quiz-feedback {
      padding: 1rem;
      border-radius: 8px;
      margin: 1rem 0;
    }
    .quiz-feedback.correct { background: #e8f5e9; color: #2e7d32; }
    .quiz-feedback.wrong { background: #ffebee; color: #c62828; }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin: 1rem 0;
    }
    .stat-card {
      background: white;
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
    }
    .stat-card .number { font-size: 2rem; font-weight: bold; color: #4CAF50; }
    .stat-card .label { color: #666; }
    
    .mode-selector {
      display: flex;
      gap: 1rem;
      margin: 1rem 0;
    }
    .mode-btn {
      flex: 1;
      padding: 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;
    }
    .mode-btn:hover { border-color: #4CAF50; }
    .mode-btn.active { border-color: #4CAF50; background: #e8f5e9; }
    
    .word-counter { text-align: center; margin: 1rem 0; color: #666; }
    .day-badge {
      display: inline-block;
      background: #4CAF50;
      color: white;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      margin-bottom: 0.5rem;
    }
    .hidden { display: none; }
    
    .student-list {
      background: white;
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
    }
    .student-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #e0e0e0;
      cursor: pointer;
    }
    .student-item:hover { background: #f5f5f5; }
    .student-item:last-child { border-bottom: none; }
    .student-name { font-weight: bold; }
    .student-stats { display: flex; gap: 1rem; font-size: 0.9rem; }
    .wrong-word-list {
      background: white;
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
    }
    .wrong-word-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem;
      border-bottom: 1px solid #f0f0f0;
    }
    .wrong-count {
      background: #f44336;
      color: white;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
    }
    .tab-buttons {
      display: flex;
      gap: 0.5rem;
      margin: 1rem 0;
    }
    .tab-btn {
      flex: 1;
      padding: 0.5rem;
      border: none;
      background: #e0e0e0;
      cursor: pointer;
      border-radius: 4px;
    }
    .tab-btn.active { background: #4CAF50; color: white; }
    .student-detail {
      background: white;
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>PET词汇学习 - 多学生版</h1>
    <p style="font-size: 0.9rem; margin-bottom: 0.5rem;">共25个场景 | 684个核心词汇</p>
  </div>

  <div id="login-view" class="container">
    <div class="login-container">
      <h2>欢迎使用PET词汇学习</h2>
      <div class="tab-buttons">
        <button class="tab-btn active" onclick="showLoginTab('student')">学生登录</button>
        <button class="tab-btn" onclick="showLoginTab('teacher')">教师登录</button>
      </div>
      
      <div id="student-login">
        <input type="text" id="student-name" placeholder="输入你的姓名">
        <button class="btn btn-primary" onclick="studentLogin()">开始学习</button>
        <p style="text-align: center; margin-top: 1rem; color: #666; font-size: 0.9rem;">
          首次使用会自动创建学习记录
        </p>
      </div>
      
      <div id="teacher-login" class="hidden">
        <input type="password" id="teacher-password" placeholder="输入教师密码">
        <button class="btn btn-secondary" onclick="teacherLogin()">查看学生进度</button>
        <p style="text-align: center; margin-top: 1rem; color: #666; font-size: 0.9rem;">
          默认密码：teacher123
        </p>
      </div>
    </div>
  </div>

  <div id="student-view" class="hidden">
    <div class="user-info">
      <span>学生：<span class="name" id="current-student-name"></span></span>
      <button onclick="logout()" style="background: none; border: none; color: white; cursor: pointer;">退出登录</button>
    </div>
    
    <div class="container">
      <div class="nav">
        <button onclick="showStudentHome()" class="active" id="nav-home">学习首页</button>
        <button onclick="showMyStats()" id="nav-stats">我的统计</button>
        <button onclick="showMyWrongWords()" id="nav-wrong">错题本</button>
      </div>

      <div id="home-view">
        <h2 style="margin: 1rem 0;">选择学习场景（每天一个）</h2>
        <div class="scene-selector" id="scene-list"></div>
      </div>

      <div id="mode-view" class="hidden">
        <h2 id="scene-title" style="margin: 1rem 0;"></h2>
        <div class="mode-selector">
          <div class="mode-btn" onclick="startFlashcards()">
            <h3>📚 单词学习</h3>
            <p>闪卡模式，逐个学习</p>
          </div>
          <div class="mode-btn" onclick="startQuiz('choice')">
            <h3>✏️ 选择题练习</h3>
            <p>四选一，测试记忆</p>
          </div>
          <div class="mode-btn" onclick="startQuiz('spell')">
            <h3>📝 拼写练习</h3>
            <p>根据中文拼写单词</p>
          </div>
        </div>
        <button class="btn btn-secondary" onclick="showStudentHome()" style="width: 100%; margin-top: 1rem;">返回</button>
      </div>

      <div id="flashcard-view" class="hidden">
        <div class="word-counter">
          <span id="card-counter">1 / 20</span>
        </div>
        <div class="flashcard" id="flashcard" onclick="toggleCard()">
          <div class="word" id="card-word">word</div>
          <div class="phonetic" id="card-phonetic">/wɜːd/</div>
          <div class="pos" id="card-pos">n.</div>
          <div class="meaning" id="card-meaning">单词</div>
          <div class="phrase" id="card-phrase">短语搭配</div>
          <div class="synonyms" id="card-synonyms">近义词/反义词</div>
          <div class="hint">点击翻转查看释义</div>
        </div>
        <div class="controls">
          <button class="btn btn-secondary" onclick="prevCard()" id="btn-prev">上一个</button>
          <button class="btn btn-warning" onclick="markKnown()">✓ 已掌握</button>
          <button class="btn btn-primary" onclick="nextCard()" id="btn-next">下一个</button>
        </div>
        <button class="btn btn-secondary" onclick="showMode()" style="width: 100%;">返回</button>
      </div>

      <div id="quiz-view" class="hidden">
        <div class="word-counter">
          <span id="quiz-counter">1 / 20</span>
          <span style="margin-left: 1rem;">得分: <span id="quiz-score">0</span></span>
        </div>
        <div class="quiz-container">
          <div class="quiz-question" id="quiz-question"></div>
          <div id="quiz-content"></div>
          <div id="quiz-feedback" class="hidden"></div>
          <button class="btn btn-primary" onclick="nextQuiz()" id="btn-next-quiz" style="width: 100%; margin-top: 1rem;">下一题</button>
        </div>
        <button class="btn btn-secondary" onclick="showMode()" style="width: 100%;">返回</button>
      </div>

      <div id="my-stats-view" class="hidden">
        <h2 style="margin: 1rem 0;">我的学习统计</h2>
        <div class="stats">
          <div class="stat-card">
            <div class="number" id="stat-total">0</div>
            <div class="label">总词汇数</div>
          </div>
          <div class="stat-card">
            <div class="number" id="stat-learned">0</div>
            <div class="label">已学习</div>
          </div>
          <div class="stat-card">
            <div class="number" id="stat-mastered">0</div>
            <div class="label">已掌握</div>
          </div>
          <div class="stat-card">
            <div class="number" id="stat-accuracy">0%</div>
            <div class="label">正确率</div>
          </div>
        </div>
        <h3 style="margin: 1rem 0;">各场景进度</h3>
        <div id="scene-progress"></div>
        <button class="btn btn-secondary" onclick="showStudentHome()" style="width: 100%; margin-top: 1rem;">返回</button>
      </div>

      <div id="my-wrong-view" class="hidden">
        <h2 style="margin: 1rem 0;">我的错题本</h2>
        <div id="wrong-words-list"></div>
        <button class="btn btn-secondary" onclick="showStudentHome()" style="width: 100%; margin-top: 1rem;">返回</button>
      </div>
    </div>
  </div>

  <div id="teacher-view" class="hidden">
    <div class="user-info">
      <span>教师端</span>
      <button onclick="logout()" style="background: none; border: none; color: white; cursor: pointer;">退出登录</button>
    </div>
    
    <div class="container">
      <div class="nav">
        <button onclick="showTeacherStudents()" class="active" id="nav-teachers-students">学生列表</button>
        <button onclick="showTeacherWrongWords()" id="nav-teacher-wrong">错题分析</button>
      </div>

      <div id="teacher-students-view">
        <h2 style="margin: 1rem 0;">所有学生进度</h2>
        <div class="student-list" id="student-list"></div>
        <button class="btn btn-secondary" onclick="logout()" style="width: 100%; margin-top: 1rem;">退出</button>
      </div>

      <div id="teacher-wrong-view" class="hidden">
        <h2 style="margin: 1rem 0;">学生错题分析</h2>
        <div id="teacher-wrong-words"></div>
        <button class="btn btn-secondary" onclick="showTeacherStudents()" style="width: 100%; margin-top: 1rem;">返回</button>
      </div>
    </div>
  </div>

  <script>
    const vocabData = """ + js_data + """;

    const TEACHER_PASSWORD = 'teacher123';
    let currentUser = null;
    let currentScene = null;
    let currentCardIndex = 0;
    let currentQuizIndex = 0;
    let quizScore = 0;
    let quizType = 'choice';
    let isCardFlipped = false;

    function getAllStudentsData() {
      const data = localStorage.getItem('pet_all_students');
      return data ? JSON.parse(data) : {};
    }

    function saveAllStudentsData(data) {
      localStorage.setItem('pet_all_students', JSON.stringify(data));
    }

    function getStudentData(name) {
      const allData = getAllStudentsData();
      if (!allData[name]) {
        allData[name] = {
          name: name,
          learnedWords: {},
          masteredWords: {},
          quizStats: { total: 0, correct: 0 },
          wrongWords: {},
          createdAt: new Date().toISOString()
        };
        saveAllStudentsData(allData);
      }
      return allData[name];
    }

    function saveStudentData(name, data) {
      const allData = getAllStudentsData();
      allData[name] = data;
      saveAllStudentsData(allData);
    }

    function studentLogin() {
      const name = document.getElementById('student-name').value.trim();
      if (!name) {
        alert('请输入姓名');
        return;
      }
      currentUser = { type: 'student', name: name };
      getStudentData(name);
      showStudentView();
    }

    function teacherLogin() {
      const password = document.getElementById('teacher-password').value;
      if (password !== TEACHER_PASSWORD) {
        alert('密码错误');
        return;
      }
      currentUser = { type: 'teacher' };
      showTeacherView();
    }

    function logout() {
      currentUser = null;
      document.getElementById('student-name').value = '';
      document.getElementById('teacher-password').value = '';
      showView('login-view');
    }

    function showLoginTab(tab) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');
      
      if (tab === 'student') {
        document.getElementById('student-login').classList.remove('hidden');
        document.getElementById('teacher-login').classList.add('hidden');
      } else {
        document.getElementById('student-login').classList.add('hidden');
        document.getElementById('teacher-login').classList.remove('hidden');
      }
    }

    function showStudentView() {
      document.getElementById('current-student-name').textContent = currentUser.name;
      showView('student-view');
      showStudentHome();
    }

    function showTeacherView() {
      showView('teacher-view');
      showTeacherStudents();
    }

    function showView(viewId) {
      ['login-view', 'student-view', 'teacher-view'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
      });
      document.getElementById(viewId).classList.remove('hidden');
    }

    function showStudentHome() {
      renderSceneList();
      showStudentSection('home-view');
      updateNav('nav-home');
    }

    function showStudentSection(sectionId) {
      ['home-view', 'mode-view', 'flashcard-view', 'quiz-view', 'my-stats-view', 'my-wrong-view'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
      });
      document.getElementById(sectionId).classList.remove('hidden');
    }

    function updateNav(activeId) {
      document.querySelectorAll('#student-view .nav button').forEach(btn => btn.classList.remove('active'));
      document.getElementById(activeId)?.classList.add('active');
    }

    function renderSceneList() {
      const container = document.getElementById('scene-list');
      container.innerHTML = '';
      const studentData = getStudentData(currentUser.name);
      
      Object.keys(vocabData).forEach((key, index) => {
        const scene = vocabData[key];
        const totalWords = scene.words.length;
        const learnedCount = scene.words.filter(w => studentData.learnedWords[w.word]).length;
        const masteredCount = scene.words.filter(w => studentData.masteredWords[w.word]).length;
        const progress = totalWords > 0 ? (learnedCount / totalWords * 100).toFixed(0) : 0;
        
        const card = document.createElement('div');
        card.className = `scene-card ${masteredCount === totalWords && totalWords > 0 ? 'completed' : learnedCount > 0 ? 'in-progress' : ''}`;
        card.onclick = () => selectScene(key);
        card.innerHTML = `
          <div class="day-badge">第${index + 1}天</div>
          <h3>${scene.title}</h3>
          <p style="color: #666; font-size: 0.9rem;">${scene.subtitle}</p>
          <p style="margin-top: 0.5rem;">${learnedCount}/${totalWords} 已学习</p>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
          <p style="margin-top: 0.5rem; font-size: 0.8rem; color: #4CAF50;">${masteredCount} 个已掌握</p>
        `;
        container.appendChild(card);
      });
    }

    function selectScene(key) {
      currentScene = key;
      document.getElementById('scene-title').textContent = `${vocabData[key].title} - ${vocabData[key].subtitle}`;
      showStudentSection('mode-view');
    }

    function showMode() {
      showStudentSection('mode-view');
    }

    function startFlashcards() {
      currentCardIndex = 0;
      isCardFlipped = false;
      showStudentSection('flashcard-view');
      updateCard();
    }

    function updateCard() {
      const words = vocabData[currentScene].words;
      const word = words[currentCardIndex];
      
      document.getElementById('card-word').textContent = word.word;
      document.getElementById('card-phonetic').textContent = `/${word.phonetic}/`;
      document.getElementById('card-pos').textContent = word.pos;
      document.getElementById('card-meaning').textContent = word.meaning;
      document.getElementById('card-phrase').textContent = word.phrase;
      document.getElementById('card-synonyms').textContent = word.synonyms;
      document.getElementById('card-counter').textContent = `${currentCardIndex + 1} / ${words.length}`;
      
      isCardFlipped = false;
      document.getElementById('card-meaning').style.display = 'none';
      document.getElementById('card-phrase').style.display = 'none';
      document.getElementById('card-synonyms').style.display = 'none';
      document.querySelector('.hint').textContent = '点击翻转查看释义';
      
      document.getElementById('btn-prev').disabled = currentCardIndex === 0;
      document.getElementById('btn-next').disabled = currentCardIndex === words.length - 1;
      
      const studentData = getStudentData(currentUser.name);
      studentData.learnedWords[word.word] = true;
      saveStudentData(currentUser.name, studentData);
    }

    function toggleCard() {
      isCardFlipped = !isCardFlipped;
      document.getElementById('card-meaning').style.display = isCardFlipped ? 'block' : 'none';
      document.getElementById('card-phrase').style.display = isCardFlipped ? 'block' : 'none';
      document.getElementById('card-synonyms').style.display = isCardFlipped ? 'block' : 'none';
      document.querySelector('.hint').textContent = isCardFlipped ? '点击返回英文面' : '点击翻转查看释义';
    }

    function prevCard() {
      if (currentCardIndex > 0) {
        currentCardIndex--;
        updateCard();
      }
    }

    function nextCard() {
      const words = vocabData[currentScene].words;
      if (currentCardIndex < words.length - 1) {
        currentCardIndex++;
        updateCard();
      }
    }

    function markKnown() {
      const word = vocabData[currentScene].words[currentCardIndex];
      const studentData = getStudentData(currentUser.name);
      studentData.masteredWords[word.word] = true;
      saveStudentData(currentUser.name, studentData);
      nextCard();
    }

    function startQuiz(type) {
      quizType = type;
      currentQuizIndex = 0;
      quizScore = 0;
      showStudentSection('quiz-view');
      updateQuiz();
    }

    function updateQuiz() {
      const words = vocabData[currentScene].words;
      const word = words[currentQuizIndex];
      
      document.getElementById('quiz-counter').textContent = `${currentQuizIndex + 1} / ${words.length}`;
      document.getElementById('quiz-score').textContent = quizScore;
      document.getElementById('quiz-feedback').className = 'hidden';
      document.getElementById('btn-next-quiz').disabled = true;
      
      if (quizType === 'choice') {
        document.getElementById('quiz-question').textContent = `单词 "${word.word}" 的中文意思是？`;
        
        const options = [word];
        const allWords = Object.values(vocabData).flatMap(s => s.words);
        while (options.length < 4) {
          const random = allWords[Math.floor(Math.random() * allWords.length)];
          if (!options.find(o => o.word === random.word)) {
            options.push(random);
          }
        }
        
        options.sort(() => Math.random() - 0.5);
        
        const container = document.getElementById('quiz-content');
        container.innerHTML = `
          <div class="quiz-options">
            ${options.map((opt, i) => `
              <div class="quiz-option" onclick="checkAnswer('${opt.word}', '${word.word}', this)">
                ${opt.meaning}
              </div>
            `).join('')}
          </div>
        `;
      } else {
        document.getElementById('quiz-question').textContent = `请拼写单词：${word.meaning}`;
        document.getElementById('quiz-content').innerHTML = `
          <input type="text" class="quiz-input" id="spell-input" placeholder="输入英文单词..." onkeypress="if(event.key==='Enter')checkSpell('${word.word}')">
          <button class="btn btn-primary" onclick="checkSpell('${word.word}')" style="width: 100%;">提交答案</button>
        `;
        setTimeout(() => document.getElementById('spell-input')?.focus(), 100);
      }
    }

    function checkAnswer(selected, correct, element) {
      const options = document.querySelectorAll('.quiz-option');
      options.forEach(opt => opt.style.pointerEvents = 'none');
      
      const feedback = document.getElementById('quiz-feedback');
      feedback.className = 'quiz-feedback';
      
      const studentData = getStudentData(currentUser.name);
      
      if (selected === correct) {
        element.classList.add('correct');
        feedback.classList.add('correct');
        feedback.textContent = '✓ 正确！';
        quizScore++;
        studentData.quizStats.correct++;
      } else {
        element.classList.add('wrong');
        options.forEach(opt => {
          if (opt.textContent.trim() === vocabData[currentScene].words[currentQuizIndex].meaning) {
            opt.classList.add('correct');
          }
        });
        feedback.classList.add('wrong');
        feedback.textContent = `✗ 错误！正确答案是：${vocabData[currentScene].words[currentQuizIndex].meaning}`;
        
        if (!studentData.wrongWords[correct]) {
          studentData.wrongWords[correct] = {
            word: correct,
            meaning: vocabData[currentScene].words[currentQuizIndex].meaning,
            count: 0
          };
        }
        studentData.wrongWords[correct].count++;
      }
      
      feedback.classList.remove('hidden');
      studentData.quizStats.total++;
      saveStudentData(currentUser.name, studentData);
      document.getElementById('btn-next-quiz').disabled = false;
    }

    function checkSpell(correct) {
      const input = document.getElementById('spell-input');
      const answer = input.value.trim().toLowerCase();
      const feedback = document.getElementById('quiz-feedback');
      feedback.className = 'quiz-feedback';
      
      const studentData = getStudentData(currentUser.name);
      
      if (answer === correct.toLowerCase()) {
        feedback.classList.add('correct');
        feedback.textContent = '✓ 正确！';
        quizScore++;
        studentData.quizStats.correct++;
      } else {
        feedback.classList.add('wrong');
        feedback.textContent = `✗ 错误！正确拼写是：${correct}`;
        
        if (!studentData.wrongWords[correct]) {
          studentData.wrongWords[correct] = {
            word: correct,
            meaning: vocabData[currentScene].words[currentQuizIndex].meaning,
            count: 0
          };
        }
        studentData.wrongWords[correct].count++;
      }
      
      feedback.classList.remove('hidden');
      input.disabled = true;
      studentData.quizStats.total++;
      saveStudentData(currentUser.name, studentData);
      document.getElementById('btn-next-quiz').disabled = false;
    }

    function nextQuiz() {
      const words = vocabData[currentScene].words;
      if (currentQuizIndex < words.length - 1) {
        currentQuizIndex++;
        updateQuiz();
      } else {
        const accuracy = words.length > 0 ? ((quizScore / words.length) * 100).toFixed(0) : 0;
        alert(`练习完成！\\n得分：${quizScore}/${words.length}\\n正确率：${accuracy}%`);
        showMode();
      }
    }

    function showMyStats() {
      const studentData = getStudentData(currentUser.name);
      const totalWords = Object.values(vocabData).reduce((sum, scene) => sum + scene.words.length, 0);
      const learnedCount = Object.keys(studentData.learnedWords).length;
      const masteredCount = Object.keys(studentData.masteredWords).length;
      const accuracy = studentData.quizStats.total > 0 ? ((studentData.quizStats.correct / studentData.quizStats.total) * 100).toFixed(0) : 0;
      
      document.getElementById('stat-total').textContent = totalWords;
      document.getElementById('stat-learned').textContent = learnedCount;
      document.getElementById('stat-mastered').textContent = masteredCount;
      document.getElementById('stat-accuracy').textContent = `${accuracy}%`;
      
      const progressContainer = document.getElementById('scene-progress');
      progressContainer.innerHTML = '';
      
      Object.keys(vocabData).forEach((key, index) => {
        const scene = vocabData[key];
        const totalWords = scene.words.length;
        const learnedCount = scene.words.filter(w => studentData.learnedWords[w.word]).length;
        const masteredCount = scene.words.filter(w => studentData.masteredWords[w.word]).length;
        const progress = totalWords > 0 ? (learnedCount / totalWords * 100).toFixed(0) : 0;
        
        const div = document.createElement('div');
        div.style.cssText = 'background: white; padding: 1rem; border-radius: 8px; margin: 0.5rem 0;';
        div.innerHTML = `
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span><strong>第${index + 1}天</strong> ${scene.title}</span>
            <span>${learnedCount}/${totalWords}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
          <div style="font-size: 0.8rem; color: #666; margin-top: 0.5rem;">已掌握: ${masteredCount} 个</div>
        `;
        progressContainer.appendChild(div);
      });
      
      showStudentSection('my-stats-view');
      updateNav('nav-stats');
    }

    function showMyWrongWords() {
      const studentData = getStudentData(currentUser.name);
      const container = document.getElementById('wrong-words-list');
      container.innerHTML = '';
      
      const wrongWords = Object.values(studentData.wrongWords);
      if (wrongWords.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">暂无错题，继续加油！</p>';
      } else {
        wrongWords.sort((a, b) => b.count - a.count);
        
        const div = document.createElement('div');
        div.className = 'wrong-word-list';
        div.innerHTML = wrongWords.map(w => `
          <div class="wrong-word-item">
            <div>
              <strong>${w.word}</strong>
              <div style="font-size: 0.9rem; color: #666;">${w.meaning}</div>
            </div>
            <div class="wrong-count">错${w.count}次</div>
          </div>
        `).join('');
        container.appendChild(div);
      }
      
      showStudentSection('my-wrong-view');
      updateNav('nav-wrong');
    }

    function showTeacherStudents() {
      const allData = getAllStudentsData();
      const container = document.getElementById('student-list');
      container.innerHTML = '';
      
      const students = Object.values(allData);
      if (students.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">暂无学生学习记录</p>';
      } else {
        students.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        container.innerHTML = students.map(s => {
          const totalWords = Object.values(vocabData).reduce((sum, scene) => sum + scene.words.length, 0);
          const learnedCount = Object.keys(s.learnedWords).length;
          const masteredCount = Object.keys(s.masteredWords).length;
          const accuracy = s.quizStats.total > 0 ? ((s.quizStats.correct / s.quizStats.total) * 100).toFixed(0) : 0;
          const wrongCount = Object.keys(s.wrongWords).length;
          
          return `
            <div class="student-item" onclick="showStudentDetail('${s.name}')">
              <div>
                <div class="student-name">${s.name}</div>
                <div style="font-size: 0.8rem; color: #666;">注册时间: ${new Date(s.createdAt).toLocaleDateString()}</div>
              </div>
              <div class="student-stats">
                <span>已学: ${learnedCount}/${totalWords}</span>
                <span>掌握: ${masteredCount}</span>
                <span>正确率: ${accuracy}%</span>
                <span>错题: ${wrongCount}</span>
              </div>
            </div>
          `;
        }).join('');
      }
      
      showTeacherSection('teacher-students-view');
      updateTeacherNav('nav-teachers-students');
    }

    function showTeacherSection(sectionId) {
      ['teacher-students-view', 'teacher-wrong-view'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
      });
      document.getElementById(sectionId).classList.remove('hidden');
    }

    function updateTeacherNav(activeId) {
      document.querySelectorAll('#teacher-view .nav button').forEach(btn => btn.classList.remove('active'));
      document.getElementById(activeId)?.classList.add('active');
    }

    function showStudentDetail(name) {
      const studentData = getStudentData(name);
      const container = document.getElementById('teacher-students-view');
      
      const totalWords = Object.values(vocabData).reduce((sum, scene) => sum + scene.words.length, 0);
      const learnedCount = Object.keys(studentData.learnedWords).length;
      const masteredCount = Object.keys(studentData.masteredWords).length;
      const accuracy = studentData.quizStats.total > 0 ? ((studentData.quizStats.correct / studentData.quizStats.total) * 100).toFixed(0) : 0;
      
      container.innerHTML = `
        <h2 style="margin: 1rem 0;">${name} 的学习详情</h2>
        <div class="stats">
          <div class="stat-card">
            <div class="number">${totalWords}</div>
            <div class="label">总词汇数</div>
          </div>
          <div class="stat-card">
            <div class="number">${learnedCount}</div>
            <div class="label">已学习</div>
          </div>
          <div class="stat-card">
            <div class="number">${masteredCount}</div>
            <div class="label">已掌握</div>
          </div>
          <div class="stat-card">
            <div class="number">${accuracy}%</div>
            <div class="label">正确率</div>
          </div>
        </div>
        <h3 style="margin: 1rem 0;">错题详情</h3>
        <div class="wrong-word-list">
          ${Object.values(studentData.wrongWords).length === 0 ? 
            '<p style="text-align: center; color: #666;">暂无错题</p>' :
            Object.values(studentData.wrongWords)
              .sort((a, b) => b.count - a.count)
              .map(w => `
                <div class="wrong-word-item">
                  <div>
                    <strong>${w.word}</strong>
                    <div style="font-size: 0.9rem; color: #666;">${w.meaning}</div>
                  </div>
                  <div class="wrong-count">错${w.count}次</div>
                </div>
              `).join('')
          }
        </div>
        <button class="btn btn-secondary" onclick="showTeacherStudents()" style="width: 100%; margin-top: 1rem;">返回学生列表</button>
      `;
    }

    function showTeacherWrongWords() {
      const allData = getAllStudentsData();
      const container = document.getElementById('teacher-wrong-words');
      container.innerHTML = '';
      
      const allWrongWords = {};
      Object.values(allData).forEach(student => {
        Object.entries(student.wrongWords).forEach(([word, data]) => {
          if (!allWrongWords[word]) {
            allWrongWords[word] = { word: word, meaning: data.meaning, students: {}, totalCount: 0 };
          }
          allWrongWords[word].students[student.name] = data.count;
          allWrongWords[word].totalCount += data.count;
        });
      });
      
      const wrongWords = Object.values(allWrongWords);
      if (wrongWords.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">暂无错题记录</p>';
      } else {
        wrongWords.sort((a, b) => b.totalCount - a.totalCount);
        
        const div = document.createElement('div');
        div.className = 'wrong-word-list';
        div.innerHTML = wrongWords.map(w => `
          <div class="wrong-word-item" style="flex-direction: column; gap: 0.5rem;">
            <div style="display: flex; justify-content: space-between; width: 100%;">
              <div>
                <strong>${w.word}</strong>
                <div style="font-size: 0.9rem; color: #666;">${w.meaning}</div>
              </div>
              <div class="wrong-count">共错${w.totalCount}次</div>
            </div>
            <div style="font-size: 0.8rem; color: #666;">
              ${Object.entries(w.students).map(([name, count]) => `${name}: ${count}次`).join(' | ')}
            </div>
          </div>
        `).join('');
        container.appendChild(div);
      }
      
      showTeacherSection('teacher-wrong-view');
      updateTeacherNav('nav-teacher-wrong');
    }
  </script>
</body>
</html>"""

# Write the HTML file
with open('/Users/zhubaizhen/Library/Mobile Documents/iCloud~md~obsidian/Documents/CarrieThinking/pet-vocab-app/index.html', 'w', encoding='utf-8') as f:
    f.write(html_template)

print(f"Generated index.html successfully!")
print(f"Total words: {sum(len(s['words']) for s in vocab_data['scenes'].values())}")
print(f"Total scenes: {len(vocab_data['scenes'])}")
