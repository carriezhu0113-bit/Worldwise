// ==================== LOGIN ====================
async function studentLogin() {
  const name = document.getElementById('studentName').value.trim();
  if (!name) { alert('请输入姓名'); return; }
  currentUser = {type:'student', name:name};
  currentGrade = STUDENT_GRADES[name] || 'default';

  // 记录学习会话开始时间
  const data = await getStudentData(name);
  data.sessions = data.sessions || [];
  data.sessions.push({startTime: new Date().toISOString(), endTime: null, modules: []});
  await saveStudentData(name, data);

  // 自动推送：检查该学生是否已有推送配置，没有则自动创建
  await autoPushForStudent(name);

  // 先显示界面，不等待 Supabase
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');
  document.getElementById('displayName').textContent = ' ' + name;
  document.getElementById('studentTabs').classList.remove('hidden');
  document.getElementById('teacherTabs').classList.add('hidden');
  switchTab('dashboard');
  updateDashboard();

  // 后台加载数据
  getStudentData(name);
}

function teacherLogin() {
  const pw = document.getElementById('teacherPassword').value;
  if (pw !== TEACHER_PASSWORD) { alert('密码错误'); return; }
  currentUser = {type:'teacher'};
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');
  document.getElementById('displayName').textContent = '👩‍🏫 教师端';
  document.getElementById('studentTabs').classList.add('hidden');
  document.getElementById('teacherTabs').classList.remove('hidden');
  switchTeacherTab('overview');
  renderTeacherOverview();
}

function logout() {
  // 记录学习会话结束时间
  if (currentUser && currentUser.type === 'student') {
    getStudentData(currentUser.name).then(data => {
      data.sessions = data.sessions || [];
      const lastSession = data.sessions.find(s => !s.endTime);
      if (lastSession) {
        lastSession.endTime = new Date().toISOString();
        saveStudentData(currentUser.name, data);
      }
    });
  }
  currentUser = null;
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('mainApp').classList.add('hidden');
  document.getElementById('studentName').value = '';
  document.getElementById('teacherPassword').value = '';
}


// ==================== TAB SWITCHING ====================
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('#studentTabs .tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('#studentTabs .tab').forEach(t => {
    if (t.textContent.includes(getTabLabel(tab))) t.classList.add('active');
  });
  ['dashboard','flashcards','spelling','grammar','verbs','sentence','reading','errors'].forEach(t => {
    document.getElementById('tab-'+t).classList.add('hidden');
  });
  document.getElementById('tab-'+tab).classList.remove('hidden');

  if (tab === 'dashboard') updateDashboard();
  if (tab === 'flashcards') initFlashcards();
  if (tab === 'spelling') initSpelling();
  if (tab === 'grammar') initGrammar();
  if (tab === 'verbs') initVerbs();
  if (tab === 'sentence') initSentenceAnalysis();
  if (tab === 'reading') initReading();
  if (tab === 'errors') renderErrors();
}

function getTabLabel(tab) {
  const map = {dashboard:'首页',flashcards:'闪卡',spelling:'听写',grammar:'语法',verbs:'动词',sentence:'句子分析',reading:'阅读',errors:'错题'};
  return map[tab] || '';
}

function switchTeacherTab(tab) {
  currentTeacherTab = tab;
  document.querySelectorAll('#teacherTabs .tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('#teacherTabs .tab').forEach(t => {
    if (t.textContent.includes(tab === 'overview' ? '总览' : tab === 'students' ? '学生' : '内容')) t.classList.add('active');
  });
  ['teacher-overview','teacher-students','teacher-content'].forEach(t => {
    document.getElementById(t).classList.add('hidden');
  });
  document.getElementById('teacher-'+tab).classList.remove('hidden');
  if (tab === 'overview') renderTeacherOverview();
  if (tab === 'students') renderTeacherStudents();
  if (tab === 'content') renderPushManagement();
}
