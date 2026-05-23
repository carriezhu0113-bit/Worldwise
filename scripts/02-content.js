// ==================== CONTENT DATA ====================
let vocabData = null;
let allScenes = [];
let allWordsFlat = [];

// 推送配置缓存（避免每次查询 Supabase）
let _cachedPushConfig = null;
let _cachedPushStudent = null;

// 学生年级配置：每个学生对应一个年级/内容级别
const STUDENT_GRADES = {
  // 低年级学生：基础词汇 + 基础句子分析
  'Alisa': 'low',
  'Anna': 'low',
  'Cici': 'low',
  'Bruce': 'low',
  'Jack': 'low',
  // 高年级学生：全部模块 + 进阶句子分析
  'Sophia': 'high',
  'Howard': 'high',
  '贺乙桓': 'high',
  'Miranda': 'high'
};

// 自动推送配置：学生首次登录时自动创建
const AUTO_PUSH_CONFIGS = {
  low: {
    vocabulary: ['pet_scene_24', 'pet_scene_23'],
    grammar: ['pronoun_basic'],
    sentences: ['sentence_basic_16']
  },
  high: {
    vocabulary: ['think1_u1_4_daily'],
    grammar: ['pronoun_basic'],
    sentences: ['sentence_basic_16', 'sentence_advanced_4']
  }
};

// 按年级区分的内容配置
const GRADE_CONTENT = {
  low: {
    grammar: null,
    sentences: null,
    vocabulary: null
  },
  high: {
    grammar: null,
    sentences: null,
    vocabulary: null
  },
  default: {
    scenes: null,
    grammar: null,
    sentences: null
  },
  grade1: {
    scenes: null,
    grammar: null,
    sentences: null
  },
  grade2: {
    scenes: null,
    grammar: null,
    sentences: null
  },
  grade3: {
    scenes: null,
    grammar: null,
    sentences: null
  }
};

let currentGrade = 'default';

async function loadVocabData() {
  try {
    const resp = await fetch('vocab_data.json');
    const json = await resp.json();
    vocabData = json.scenes;
    allScenes = Object.keys(vocabData).sort();
    allWordsFlat = [];
    allScenes.forEach(sceneKey => {
      const scene = vocabData[sceneKey];
      scene.words.forEach(w => {
        allWordsFlat.push({...w, sceneKey, sceneTitle: scene.title});
      });
    });
  } catch(e) {
    console.error('加载词汇数据失败:', e);
  }
}

async function getTodayScenes() {
  const data = await getStudentData(currentUser.name);
  const startDate = data.startDate || new Date().toISOString().split('T')[0];
  if (!data.startDate) {
    data.startDate = startDate;
    await saveStudentData(currentUser.name, data);
  }
  const start = new Date(startDate);
  const now = new Date();
  const dayIndex = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const sceneStart = (dayIndex * 2) % allScenes.length;
  const todayScenes = [];
  for (let i = 0; i < 2; i++) {
    const idx = (sceneStart + i) % allScenes.length;
    todayScenes.push(allScenes[idx]);
  }
  return todayScenes;
}

function cloneVocabularyWord(word, extras = {}) {
  return {
    ...word,
    sceneKey: extras.sceneKey || word.sceneKey || '',
    sceneTitle: extras.sceneTitle || word.sceneTitle || ''
  };
}

function dedupeWords(words) {
  const seen = new Set();
  return words.filter(word => {
    const key = (word.word || '').toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getWordsFromVocabularyKeys(keys = []) {
  let words = [];
  keys.forEach(key => {
    if (MODULE_LIBRARY.vocabulary[key]) {
      const module = MODULE_LIBRARY.vocabulary[key];
      words = words.concat(module.words.map(word => cloneVocabularyWord(word, { sceneKey: key, sceneTitle: module.name })));
      return;
    }
    if (vocabData && vocabData[key]) {
      words = words.concat(vocabData[key].words.map(word => cloneVocabularyWord(word, { sceneKey: key, sceneTitle: vocabData[key].title })));
    }
  });
  return dedupeWords(words);
}

async function getTodayWords() {
  return getDefaultVocabularyWords();
}


// ==================== MODULE LIBRARY ====================
const MODULE_LIBRARY = {
  vocabulary: {
    "pet_scene_23": { name: "PET场景23-社会与文化", words: [
      {word:"country",pos:"n.",phonetic:"ˈkʌntri",meaning:"国家；乡村",phrase:"my country 我的国家",synonyms:"近: nation, state"},
      {word:"nation",pos:"n.",phonetic:"ˈneɪʃᵊn",meaning:"国家",phrase:"the whole nation 全国",synonyms:"近: country"},
      {word:"world",pos:"n.",phonetic:"wɜːld",meaning:"世界",phrase:"around the world 全世界",synonyms:"近: globe, earth"},
      {word:"language",pos:"n.",phonetic:"ˈlæŋɡwɪdʒ",meaning:"语言",phrase:"speak a language 说一种语言",synonyms:"近: tongue"},
      {word:"culture",pos:"n.",phonetic:"ˈkʌltʃə",meaning:"文化",phrase:"different culture 不同的文化",synonyms:"近: tradition"},
      {word:"tradition",pos:"n.",phonetic:"trəˈdɪʃᵊn",meaning:"传统",phrase:"family tradition 家庭传统",synonyms:"近: custom, culture"},
      {word:"custom",pos:"n.",phonetic:"ˈkʌstəm",meaning:"习俗",phrase:"local custom 当地习俗",synonyms:"近: tradition, habit"},
      {word:"festival",pos:"n.",phonetic:"ˈfestɪvᵊl",meaning:"节日",phrase:"celebrate a festival 庆祝节日",synonyms:"近: holiday, celebration"},
      {word:"celebration",pos:"n.",phonetic:"ˌselɪˈbreɪʃᵊn",meaning:"庆祝",phrase:"birthday celebration 生日庆祝",synonyms:"近: party, festival"},
      {word:"party",pos:"n.",phonetic:"ˈpɑːti",meaning:"聚会；派对",phrase:"birthday party 生日聚会",synonyms:"近: celebration, gathering"},
      {word:"gift",pos:"n.",phonetic:"ɡɪft",meaning:"礼物",phrase:"give a gift 送礼物",synonyms:"近: present"},
      {word:"present",pos:"n.",phonetic:"ˈprezᵊnt",meaning:"礼物",phrase:"birthday present 生日礼物",synonyms:"近: gift"},
      {word:"rule",pos:"n.",phonetic:"ruːl",meaning:"规则",phrase:"follow the rules 遵守规则",synonyms:"近: regulation, law"},
      {word:"law",pos:"n.",phonetic:"lɔː",meaning:"法律",phrase:"break the law 违法",synonyms:"近: rule, regulation"},
      {word:"government",pos:"n.",phonetic:"ˈɡʌvənmᵊnt",meaning:"政府",phrase:"local government 当地政府",synonyms:"近: administration"},
      {word:"people",pos:"n.",phonetic:"ˈpiːpᵊl",meaning:"人们",phrase:"many people 许多人",synonyms:"近: persons, public"},
      {word:"public",pos:"adj./n.",phonetic:"ˈpʌblɪk",meaning:"公共的；公众",phrase:"public place 公共场所",synonyms:"近: common, open"},
      {word:"society",pos:"n.",phonetic:"səˈsaɪəti",meaning:"社会",phrase:"modern society 现代社会",synonyms:"近: community"},
      {word:"community",pos:"n.",phonetic:"kəˈmjuːnəti",meaning:"社区",phrase:"local community 当地社区",synonyms:"近: society, neighborhood"},
      {word:"religion",pos:"n.",phonetic:"rɪˈlɪdʒᵊn",meaning:"宗教",phrase:"different religions 不同的宗教",synonyms:"近: faith, belief"},
      {word:"art",pos:"n.",phonetic:"ɑːt",meaning:"艺术",phrase:"work of art 艺术品",synonyms:"近: creativity"},
      {word:"music",pos:"n.",phonetic:"ˈmjuːzɪk",meaning:"音乐",phrase:"listen to music 听音乐",synonyms:"近: melody, tune"},
      {word:"film",pos:"n.",phonetic:"fɪlm",meaning:"电影",phrase:"watch a film 看电影",synonyms:"近: movie, cinema"},
      {word:"book",pos:"n.",phonetic:"bʊk",meaning:"书",phrase:"read a book 读书",synonyms:"近: novel, text"},
      {word:"story",pos:"n.",phonetic:"ˈstɔːri",meaning:"故事",phrase:"tell a story 讲故事",synonyms:"近: tale, narrative"}
    ]},
    "pet_scene_24": { name: "PET场景24-环境与自然", words: [
      {word:"environment",pos:"n.",phonetic:"ɪnˈvaɪrənmᵊnt",meaning:"环境",phrase:"protect the environment 保护环境",synonyms:"近: surroundings"},
      {word:"nature",pos:"n.",phonetic:"ˈneɪtʃə",meaning:"自然",phrase:"in nature 在自然界",synonyms:"近: wilderness"},
      {word:"earth",pos:"n.",phonetic:"ɜːθ",meaning:"地球",phrase:"on earth 在地球上",synonyms:"近: world, globe"},
      {word:"land",pos:"n.",phonetic:"lænd",meaning:"土地",phrase:"on land 在陆地上",synonyms:"近: ground, soil"},
      {word:"ground",pos:"n.",phonetic:"ɡraʊnd",meaning:"地面",phrase:"on the ground 在地上",synonyms:"近: floor, land"},
      {word:"soil",pos:"n.",phonetic:"sɔɪl",meaning:"土壤",phrase:"rich soil 肥沃的土壤",synonyms:"近: earth, dirt"},
      {word:"water",pos:"n.",phonetic:"ˈwɔːtə",meaning:"水",phrase:"clean water 干净的水",synonyms:"近: liquid"},
      {word:"air",pos:"n.",phonetic:"eə",meaning:"空气",phrase:"fresh air 新鲜空气",synonyms:"近: atmosphere"},
      {word:"fire",pos:"n.",phonetic:"ˈfaɪə",meaning:"火",phrase:"make a fire 生火",synonyms:"近: flame, blaze"},
      {word:"ice",pos:"n.",phonetic:"aɪs",meaning:"冰",phrase:"on ice 在冰上",synonyms:"近: frozen water"},
      {word:"snow",pos:"n.",phonetic:"snəʊ",meaning:"雪",phrase:"heavy snow 大雪",synonyms:"近: snowfall"},
      {word:"rain",pos:"n.",phonetic:"reɪn",meaning:"雨",phrase:"heavy rain 大雨",synonyms:"近: shower"},
      {word:"cloud",pos:"n.",phonetic:"klaʊd",meaning:"云",phrase:"in the clouds 在云中",synonyms:"近: vapor"},
      {word:"forest",pos:"n.",phonetic:"ˈfɒrɪst",meaning:"森林",phrase:"in the forest 在森林里",synonyms:"近: woods, jungle"},
      {word:"wood",pos:"n.",phonetic:"wʊd",meaning:"木头；树林",phrase:"in the wood 在树林里",synonyms:"近: forest, timber"},
      {word:"lake",pos:"n.",phonetic:"leɪk",meaning:"湖",phrase:"by the lake 在湖边",synonyms:"近: pond"},
      {word:"ocean",pos:"n.",phonetic:"ˈəʊʃᵊn",meaning:"海洋",phrase:"across the ocean 跨越海洋",synonyms:"近: sea"},
      {word:"beach",pos:"n.",phonetic:"biːtʃ",meaning:"海滩",phrase:"on the beach 在海滩上",synonyms:"近: shore, coast"},
      {word:"island",pos:"n.",phonetic:"ˈaɪlᵊnd",meaning:"岛",phrase:"on an island 在岛上",synonyms:"近: isle"},
      {word:"hill",pos:"n.",phonetic:"hɪl",meaning:"小山",phrase:"climb a hill 爬山",synonyms:"近: mountain"},
      {word:"valley",pos:"n.",phonetic:"ˈvæli",meaning:"山谷",phrase:"in the valley 在山谷里",synonyms:"近: lowland"},
      {word:"desert",pos:"n.",phonetic:"ˈdezət",meaning:"沙漠",phrase:"in the desert 在沙漠里",synonyms:"近: wasteland"},
      {word:"field",pos:"n.",phonetic:"fiːld",meaning:"田野；场地",phrase:"in the field 在田野里",synonyms:"近: meadow"},
      {word:"farm",pos:"n.",phonetic:"fɑːm",meaning:"农场",phrase:"on a farm 在农场",synonyms:"近: ranch"}
    ]},
    "pet_scene_25": { name: "PET场景25-抽象概念", words: [
      {word:"idea",pos:"n.",phonetic:"aɪˈdɪə",meaning:"想法",phrase:"good idea 好主意",synonyms:"近: thought, concept"},
      {word:"thought",pos:"n.",phonetic:"θɔːt",meaning:"思想",phrase:"deep thought 深思",synonyms:"近: idea, thinking"},
      {word:"dream",pos:"n./v.",phonetic:"driːm",meaning:"梦想；做梦",phrase:"have a dream 有一个梦想",synonyms:"近: vision, aspiration"},
      {word:"hope",pos:"n./v.",phonetic:"həʊp",meaning:"希望",phrase:"give hope 给予希望",synonyms:"近: wish, expectation"},
      {word:"wish",pos:"n./v.",phonetic:"wɪʃ",meaning:"愿望",phrase:"make a wish 许愿",synonyms:"近: desire, hope"},
      {word:"love",pos:"n.",phonetic:"lʌv",meaning:"爱",phrase:"true love 真爱",synonyms:"近: affection, care"},
      {word:"hate",pos:"n.",phonetic:"heɪt",meaning:"恨",phrase:"full of hate 充满仇恨",synonyms:"近: hatred 反: love"},
      {word:"fear",pos:"n.",phonetic:"fɪə",meaning:"恐惧",phrase:"fear of something 对...的恐惧",synonyms:"近: dread, worry"},
      {word:"courage",pos:"n.",phonetic:"ˈkʌrɪdʒ",meaning:"勇气",phrase:"have courage 有勇气",synonyms:"近: bravery"},
      {word:"luck",pos:"n.",phonetic:"lʌk",meaning:"运气",phrase:"good luck 好运",synonyms:"近: fortune, chance"},
      {word:"chance",pos:"n.",phonetic:"tʃɑːns",meaning:"机会；可能性",phrase:"take a chance 冒险 / by chance 偶然",synonyms:"近: opportunity, possibility"},
      {word:"opportunity",pos:"n.",phonetic:"ˌɒpəˈtjuːnəti",meaning:"机会",phrase:"good opportunity 好机会",synonyms:"近: chance"},
      {word:"success",pos:"n.",phonetic:"səkˈses",meaning:"成功",phrase:"achieve success 取得成功",synonyms:"近: achievement 反: failure"},
      {word:"failure",pos:"n.",phonetic:"ˈfeɪljə",meaning:"失败",phrase:"learn from failure 从失败中学习",synonyms:"近: defeat 反: success"},
      {word:"problem",pos:"n.",phonetic:"ˈprɒbləm",meaning:"问题",phrase:"solve a problem 解决问题",synonyms:"近: issue, difficulty"},
      {word:"solution",pos:"n.",phonetic:"səˈluːʃᵊn",meaning:"解决方案",phrase:"find a solution 找到解决方案",synonyms:"近: answer, remedy"},
      {word:"reason",pos:"n.",phonetic:"ˈriːzᵊn",meaning:"原因",phrase:"the reason for...的原因",synonyms:"近: cause, explanation"},
      {word:"cause",pos:"n.",phonetic:"kɔːz",meaning:"原因；引起",phrase:"the cause of...的原因",synonyms:"近: reason, source"},
      {word:"result",pos:"n.",phonetic:"rɪˈzʌlt",meaning:"结果",phrase:"as a result 结果",synonyms:"近: outcome, consequence"},
      {word:"effect",pos:"n.",phonetic:"ɪˈfekt",meaning:"影响",phrase:"have an effect on 对...有影响",synonyms:"近: impact, influence"},
      {word:"purpose",pos:"n.",phonetic:"ˈpɜːpəs",meaning:"目的",phrase:"the purpose of...的目的",synonyms:"近: goal, aim"},
      {word:"goal",pos:"n.",phonetic:"ɡəʊl",meaning:"目标",phrase:"achieve a goal 实现目标",synonyms:"近: aim, target"},
      {word:"value",pos:"n.",phonetic:"ˈvæljuː",meaning:"价值；价值观",phrase:"core values 核心价值观",synonyms:"近: worth, principle"},
      {word:"freedom",pos:"n.",phonetic:"ˈfriːdəm",meaning:"自由",phrase:"freedom of speech 言论自由",synonyms:"近: liberty, independence"},
      {word:"peace",pos:"n.",phonetic:"piːs",meaning:"和平",phrase:"world peace 世界和平",synonyms:"近: harmony, calm"},
      {word:"war",pos:"n.",phonetic:"wɔː",meaning:"战争",phrase:"at war 在战争中",synonyms:"近: conflict, battle"},
      {word:"power",pos:"n.",phonetic:"ˈpaʊə",meaning:"力量；权力",phrase:"in power 执政",synonyms:"近: strength, authority"},
      {word:"knowledge",pos:"n.",phonetic:"ˈnɒlɪdʒ",meaning:"知识",phrase:"gain knowledge 获取知识",synonyms:"近: learning, wisdom"},
      {word:"wisdom",pos:"n.",phonetic:"ˈwɪzdəm",meaning:"智慧",phrase:"words of wisdom 智慧之言",synonyms:"近: knowledge, intelligence"},
      {word:"truth",pos:"n.",phonetic:"truːθ",meaning:"真相；真理",phrase:"tell the truth 说实话",synonyms:"近: fact, reality"},
      {word:"fact",pos:"n.",phonetic:"fækt",meaning:"事实",phrase:"in fact 事实上",synonyms:"近: truth, reality"},
      {word:"experience",pos:"n.",phonetic:"ɪkˈspɪəriᵊns",meaning:"经验；经历",phrase:"work experience 工作经验",synonyms:"近: practice, background"},
      {word:"memory",pos:"n.",phonetic:"ˈmeməri",meaning:"记忆；回忆",phrase:"good memory 好记性",synonyms:"近: recollection, recall"},
      {word:"imagination",pos:"n.",phonetic:"ɪˌmædʒɪˈneɪʃᵊn",meaning:"想象力",phrase:"use your imagination 发挥想象力",synonyms:"近: creativity, vision"},
      {word:"attention",pos:"n.",phonetic:"əˈtenʃᵊn",meaning:"注意力",phrase:"pay attention to 注意",synonyms:"近: focus, concentration"}
    ]}
  },
  grammar: {
    "pronoun_basic": { name: "人称代词专项(五六年级)", review: `
<div style="text-align:left;line-height:1.8">
<h3 style="text-align:center;color:#2563eb;margin-bottom:16px">📚 人称代词复习</h3>

<div style="background:#eff6ff;border-radius:12px;padding:16px;margin-bottom:16px">
<h4 style="color:#1e40af;margin-bottom:8px">🏫 五大战队</h4>
<p>• <b>主格战队</b>（负责做动作）：I, you, he, she, it, we, they</p>
<p>• <b>宾格战队</b>（负责挨打/接受动作）：me, you, him, her, it, us, them</p>
<p>• <b>形容词性物主代词</b>（小跟班：后面必须带名词）：my, your, his, her, its, our, their</p>
<p>• <b>名词性物主代词</b>（独行侠：后面不能带名词）：mine, yours, his, hers, its, ours, theirs</p>
<p>• <b>反身代词</b>（自己）：myself, yourself, himself, herself, itself, ourselves, yourselves, themselves</p>
</div>

<div style="background:#f0fdf4;border-radius:12px;padding:16px;margin-bottom:16px">
<h4 style="color:#166534;margin-bottom:8px">📋 完整表格</h4>
<table style="width:100%;border-collapse:collapse;font-size:14px">
<tr style="background:#dcfce7"><th style="padding:8px;border:1px solid #bbf7d0">中文</th><th style="padding:8px;border:1px solid #bbf7d0">主格</th><th style="padding:8px;border:1px solid #bbf7d0">宾格</th><th style="padding:8px;border:1px solid #bbf7d0">形物代</th><th style="padding:8px;border:1px solid #bbf7d0">名物代</th><th style="padding:8px;border:1px solid #bbf7d0">反身代词</th></tr>
<tr><td style="padding:6px;border:1px solid #e5e7eb">我</td><td style="padding:6px;border:1px solid #e5e7eb">I</td><td style="padding:6px;border:1px solid #e5e7eb">me</td><td style="padding:6px;border:1px solid #e5e7eb">my + 名词</td><td style="padding:6px;border:1px solid #e5e7eb">mine</td><td style="padding:6px;border:1px solid #e5e7eb">myself</td></tr>
<tr style="background:#f9fafb"><td style="padding:6px;border:1px solid #e5e7eb">你</td><td style="padding:6px;border:1px solid #e5e7eb">you</td><td style="padding:6px;border:1px solid #e5e7eb">you</td><td style="padding:6px;border:1px solid #e5e7eb">your + 名词</td><td style="padding:6px;border:1px solid #e5e7eb">yours</td><td style="padding:6px;border:1px solid #e5e7eb">yourself</td></tr>
<tr><td style="padding:6px;border:1px solid #e5e7eb">他</td><td style="padding:6px;border:1px solid #e5e7eb">he</td><td style="padding:6px;border:1px solid #e5e7eb">him</td><td style="padding:6px;border:1px solid #e5e7eb">his + 名词</td><td style="padding:6px;border:1px solid #e5e7eb">his</td><td style="padding:6px;border:1px solid #e5e7eb">himself</td></tr>
<tr style="background:#f9fafb"><td style="padding:6px;border:1px solid #e5e7eb">她</td><td style="padding:6px;border:1px solid #e5e7eb">she</td><td style="padding:6px;border:1px solid #e5e7eb">her</td><td style="padding:6px;border:1px solid #e5e7eb">her + 名词</td><td style="padding:6px;border:1px solid #e5e7eb">hers</td><td style="padding:6px;border:1px solid #e5e7eb">herself</td></tr>
<tr><td style="padding:6px;border:1px solid #e5e7eb">它</td><td style="padding:6px;border:1px solid #e5e7eb">it</td><td style="padding:6px;border:1px solid #e5e7eb">it</td><td style="padding:6px;border:1px solid #e5e7eb">its + 名词</td><td style="padding:6px;border:1px solid #e5e7eb">its</td><td style="padding:6px;border:1px solid #e5e7eb">itself</td></tr>
<tr style="background:#f9fafb"><td style="padding:6px;border:1px solid #e5e7eb">我们</td><td style="padding:6px;border:1px solid #e5e7eb">we</td><td style="padding:6px;border:1px solid #e5e7eb">us</td><td style="padding:6px;border:1px solid #e5e7eb">our + 名词</td><td style="padding:6px;border:1px solid #e5e7eb">ours</td><td style="padding:6px;border:1px solid #e5e7eb">ourselves</td></tr>
<tr><td style="padding:6px;border:1px solid #e5e7eb">你们</td><td style="padding:6px;border:1px solid #e5e7eb">you</td><td style="padding:6px;border:1px solid #e5e7eb">you</td><td style="padding:6px;border:1px solid #e5e7eb">your + 名词</td><td style="padding:6px;border:1px solid #e5e7eb">yours</td><td style="padding:6px;border:1px solid #e5e7eb">yourselves</td></tr>
<tr style="background:#f9fafb"><td style="padding:6px;border:1px solid #e5e7eb">他们</td><td style="padding:6px;border:1px solid #e5e7eb">they</td><td style="padding:6px;border:1px solid #e5e7eb">them</td><td style="padding:6px;border:1px solid #e5e7eb">their + 名词</td><td style="padding:6px;border:1px solid #e5e7eb">theirs</td><td style="padding:6px;border:1px solid #e5e7eb">themselves</td></tr>
</table>
</div>

<div style="background:#fefce8;border-radius:12px;padding:16px;margin-bottom:16px">
<h4 style="color:#854d0e;margin-bottom:8px">🌟 核心通关口诀</h4>
<p><b>1. 主格 vs 宾格</b></p>
<p style="background:#fef9c3;padding:8px;border-radius:8px;margin:4px 0">"主格站句首，动/介后面宾格走。"</p>
<p>• 句子开头做主语、发出动作的用主格（如：<b>I</b> love school.）</p>
<p>• 在动词或介词的后面，要用宾格（如：Look at <b>me</b>. / Let <b>us</b> go.）</p>

<p style="margin-top:12px"><b>2. 形物代 vs 名物代</b></p>
<p style="background:#fef9c3;padding:8px;border-radius:8px;margin:4px 0">"有'名'用'形'，无'名'用'名'。"</p>
<p>• 空格后面紧跟着名词 → 用形容词性物主代词（This is <b>my</b> book.）</p>
<p>• 空格后面没有名词 → 用名词性物主代词（This book is <b>mine</b>.）</p>
<p>• 公式：名词性物主代词 = 形容词性物主代词 + 名词（mine = my book）</p>

<p style="margin-top:12px"><b>3. 易错双胞胎</b></p>
<p>• <b>it's</b> = It is（它是） vs <b>its</b> = 它的（物主代词）</p>
<p>• 反身代词单数 -self，复数 -selves（myself → ourselves）</p>
<p>• 对"孩子们"说话时用 <b>yourselves</b></p>
</div>

<p style="text-align:center;color:#6b7280;font-size:14px">🌟 复习好了吗？点击下面的按钮开始通关测试吧！</p>
</div>`, mc: [
      {q:"My brother and ______ like playing basketball after school.",opts:["I","me","my","mine"],ans:0,exp:"作句子的主语，用主格。My brother and I（我和我哥哥/弟弟）。"},
      {q:"Miss White is our new teacher. We all like ______ very much.",opts:["she","her","hers","herself"],ans:1,exp:"动词 like 后面接宾语，Miss White 是女性，用宾格 her。"},
      {q:"— Is this blue schoolbag yours, Tom? — No, ______ is yellow.",opts:["my","me","mine","myself"],ans:2,exp:"空格后没有名词，表示'我的书包'，用名词性物主代词 mine（相当于 my schoolbag）。"},
      {q:"The twins look the same, but ______ hobbies are quite different.",opts:["they","them","their","theirs"],ans:2,exp:"空格后有名词 hobbies（爱好），用形容词性物主代词 their 作定语。"},
      {q:"Don't worry about the little dog. It can look after ______.",opts:["it","its","itself","out"],ans:2,exp:"固定短语 look after oneself（照顾某人自己）。主语是单数动物 It，对应的反身代词是 itself。"},
      {q:"Pass ______ the salt, please. I need it for the soup.",opts:["I","me","my","mine"],ans:1,exp:"动词 pass 后面接双宾语，表示'递给我'，用人称代词宾格 me。"},
      {q:"This isn't my coat. ______ is over there on the chair.",opts:["Your","Yours","You","Me"],ans:1,exp:"空格处作主语，后面没有名词，表示'你的外套'，用名词性物主代词 yours。"},
      {q:"Excuse ______, could you tell me the way to the library?",opts:["I","my","me","mine"],ans:2,exp:"固定礼貌用语 Excuse me（打扰一下），excuse 是动词，后接宾格。"},
      {q:"The kids are having a great time in the park. Look at ______!",opts:["they","them","their","theirs"],ans:1,exp:"介词 at 后面接宾语，The kids 是复数，用宾格 them。"},
      {q:"That beautiful garden belongs to Mr. and Mrs. Green. It's ______.",opts:["they","them","their","theirs"],ans:3,exp:"表示'那是他们的（花园）'，后面无名词，用名词性物主代词 theirs。"},
      {q:"Lily, you should finish the homework by ______. Don't copy others'.",opts:["you","your","yourself","yourselves"],ans:2,exp:"呼语是 Lily（单数），by oneself 表示'独自/靠自己'，因此用 yourself。"},
      {q:"— Who is knocking at the door? — It's ______, Lucy. Open the door, please.",opts:["I","me","my","mine"],ans:1,exp:"在口语回答'是谁呀？'时，习惯用宾格 'It's me.'（是我）。"},
      {q:"The bird hurt ______ wing when it flew through the trees.",opts:["it","its","itself","it's"],ans:1,exp:"修饰名词 wing（翅膀），用形容词性物主代词 its（它的）。注意 D 选项 It's 是 It is 的缩写。"},
      {q:"Our school is big, but ______ is much bigger than ours.",opts:["you","your","yours","we"],ans:2,exp:"拿'你的学校'和'我们的学校'做对比，后面没名词，用名词性物主代词 yours。"},
      {q:"Help ______ to some fruit, children! There are plenty of apples and bananas.",opts:["you","your","yourself","yourselves"],ans:3,exp:"呼语是 children（孩子们，复数），固定短语 help yourselves to...（孩子们，请随便吃……），反身代词用复数 yourselves。"},
      {q:"My storybook is lost. Can I borrow ______?",opts:["you","your","yours","him"],ans:2,exp:"表示'借你的书用用'，后面没有名词，用名词性物主代词 yours。"},
      {q:"Grandma told ______ an exciting story about a brave knight last night.",opts:["we","us","our","ours"],ans:1,exp:"动词 told 后面接人作宾语，用宾格 us。"},
      {q:"Tim and Jim are good friends. ______ go to school together every morning.",opts:["They","Them","Their","Theirs"],ans:0,exp:"作句子的主语，指代 Tim 和 Jim，用主格 They。"},
      {q:"I can't find my eraser. Can I use ______?",opts:["she","her","hers","herself"],ans:2,exp:"表示'用她的橡皮'，后面没有名词，用名词性物主代词 hers。"},
      {q:"Let ______ help you carry this heavy box, Grandma.",opts:["I","me","my","mine"],ans:1,exp:"Let 是使役动词，后面接人称代词宾格作宾补，Let me...（让我……）。"}
    ], correct: [
      {wrong:"Him is very good at playing the piano.",right:"He is very good at playing the piano.",exp:"作句子开头的主语，必须用主格 He。"},
      {wrong:"This is my kite and that one is your.",right:"This is my kite and that one is yours.",exp:"后面没有名词，不能用形容词性物主代词 your，必须换成名词性物主代词 yours。"},
      {wrong:"Please tell we the truth about the broken vase.",right:"Please tell us the truth about the broken vase.",exp:"动词 tell 后面接宾语，用宾格 us。"},
      {wrong:"The cat is washing it face with its paws.",right:"The cat is washing its face with its paws.",exp:"修饰名词 face（脸），表示'它的脸'，用形容词性物主代词 its。"},
      {wrong:"Mrs. King invited my sister and I to her birthday party.",right:"Mrs. King invited my sister and me to her birthday party.",exp:"动词 invited 后面是宾语位置，My sister and me 共同作宾语，用宾格 me。"},
      {wrong:"These books aren't their. They belong to the school.",right:"These books aren't theirs. They belong to the school.",exp:"句尾没有名词，表示'他们的书'，用名词性物主代词 theirs。"},
      {wrong:"Us are planning a surprise party for our teacher.",right:"We are planning a surprise party for our teacher.",exp:"作全句的主语，用主格 We。"},
      {wrong:"The room is very messy. Please clean its up right now.",right:"The room is very messy. Please clean it up right now.",exp:"clean up 是'动词+副词'短语，代词作宾语要放中间，表示'把它打扫干净'，用宾格 it。"},
      {wrong:"She makes her a beautiful dress for the school play.",right:"She makes herself a beautiful dress for the school play.",exp:"当句子的主语（She）和动词的宾语是同一个人时，宾语要用反身代词，指'她给自己（herself）做衣服'。"},
      {wrong:"Look at the house. It's windows are all broken.",right:"Look at the house. Its windows are all broken.",exp:"这里需要形容词性物主代词来修饰 windows（窗户），表示'它的窗户'。It's 是 'It is'（它是）的缩写，语意不通。"}
    ]},
    "think1_u1_4": { name: "Think1 U1-4词汇(243词)", words: [
      {word:'yourself',pos:'pron.',phonetic:'',meaning:'你自己',phrase:'It\'s great to be busy, but it\'s important to look after yourself and have fun, too.',synonyms:''},
      {word:'ourselves',pos:'pron.',phonetic:'',meaning:'我们自己',phrase:'We all need to think about ourselves and do things we like, whether it is playing an instrument or taking photos.',synonyms:''},
      {word:'hobby',pos:'n.',phonetic:'',meaning:'爱好',phrase:'I have lots of hobbies.',synonyms:''},
      {word:'exercise',pos:'n.',phonetic:'',meaning:'锻炼',phrase:'I hate running and doing exercise.',synonyms:''},
      {word:'occasionally',pos:'adv.',phonetic:'',meaning:'偶尔地',phrase:'I\'m usually busy, but occasionally I\'ve got a bit of free time.',synonyms:''},
      {word:'once a week',pos:'phr.',phonetic:'',meaning:'一周一次',phrase:'I try and visit a different place in the world at least once a week.',synonyms:''},
      {word:'mobile',pos:'n.',phonetic:'',meaning:'手机',phrase:'message friends on mobile',synonyms:''},
      {word:'crossword',pos:'n.',phonetic:'',meaning:'纵横字谜',phrase:'Sometimes it\'s Sudoku, sometimes a crossword or different word game.',synonyms:''},
      {word:'imagine',pos:'v.',phonetic:'',meaning:'想象',phrase:'I like using \'street view\' and I imagine myself walking in a street somewhere.',synonyms:''},
      {word:'rugby',pos:'n.',phonetic:'',meaning:'橄榄球',phrase:'It\'s because my uncle and aunt live there and they love rugby, so I watch the games.',synonyms:''},
      {word:'about 8 hours',pos:'phr.',phonetic:'',meaning:'大约八小时',phrase:'（场景示例：I sleep about 8 hours every day.）',synonyms:''},
      {word:'less than 8 hours',pos:'phr.',phonetic:'',meaning:'少于八小时',phrase:'（场景示例：I sometimes sleep less than 8 hours on weekends.）',synonyms:''},
      {word:'at all',pos:'phr.',phonetic:'',meaning:'根本',phrase:'（场景示例：I don\'t like it at all.）',synonyms:''},
      {word:'queue',pos:'n.',phonetic:'',meaning:'队列',phrase:'（场景示例：We stood in a queue to buy tickets.）',synonyms:''},
      {word:'sudoku',pos:'n.',phonetic:'',meaning:'数独',phrase:'Sometimes it\'s sudoku, sometimes a crossword or different word game.',synonyms:''},
      {word:'fast food',pos:'n.',phonetic:'',meaning:'快餐',phrase:'（场景示例：I don\'t eat fast food very often.）',synonyms:''},
      {word:'get bored',pos:'phr.',phonetic:'',meaning:'感到无聊的',phrase:'（场景示例：I get bored when I have nothing to do.）',synonyms:''},
      {word:'app',pos:'n.',phonetic:'',meaning:'应用程序',phrase:'（场景示例：I use this app to learn English.）',synonyms:''},
      {word:'street view',pos:'n.',phonetic:'',meaning:'街景（模式）',phrase:'I like using \'street view\' and I imagine myself walking in a street somewhere.',synonyms:''},
      {word:'especially',pos:'adv.',phonetic:'',meaning:'特别是；尤其地',phrase:'（场景示例：I love fruits, especially apples.）',synonyms:''},
      {word:'at least',pos:'phr.',phonetic:'',meaning:'至少',phrase:'I try and visit a different place in the world at least once a week.',synonyms:''},
      {word:'word puzzle',pos:'phr.',phonetic:'',meaning:'字谜',phrase:'Word puzzles are OK, but number puzzles are boring.',synonyms:''},
      {word:'number puzzle',pos:'phr.',phonetic:'',meaning:'数字拼图',phrase:'Word puzzles are OK, but number puzzles are boring.',synonyms:''},
      {word:'message friends online',pos:'phr.',phonetic:'',meaning:'在网上给朋友发信息',phrase:'（场景示例：I message friends online after school.）',synonyms:''},
      {word:'ask sb. to do sth.',pos:'phr.',phonetic:'',meaning:'让某人去做某事',phrase:'（场景示例：My teacher asks me to do homework every day.）',synonyms:''},
      {word:'need to do sth.',pos:'phr.',phonetic:'',meaning:'需要做某事',phrase:'We all need to do things we like.',synonyms:''},
      {word:'do housework',pos:'phr.',phonetic:'',meaning:'做家务',phrase:'（场景示例：I do housework with my parents on Sundays.）',synonyms:''},
      {word:'give homework',pos:'phr.',phonetic:'',meaning:'布置作业',phrase:'Does your teacher give you homework every day?',synonyms:''},
      {word:'play an instrument',pos:'phr.',phonetic:'',meaning:'弹奏乐器',phrase:'We all need to do things we like, whether it is playing an instrument or taking photos.',synonyms:''},
      {word:'take photos',pos:'phr.',phonetic:'',meaning:'照照片',phrase:'We all need to do things we like, whether it is playing an instrument or taking photos.',synonyms:''},
      {word:'listen to music',pos:'phr.',phonetic:'',meaning:'听音乐',phrase:'I only listen to music when I have time.',synonyms:''},
      {word:'free time',pos:'phr.',phonetic:'',meaning:'空闲时间',phrase:'I\'m usually busy, but occasionally I\'ve got a bit of free time.',synonyms:''},
      {word:'collect things',pos:'phr.',phonetic:'',meaning:'收集物品',phrase:'And I collect things with cats on them.',synonyms:''},
      {word:'do puzzles',pos:'phr.',phonetic:'',meaning:'玩智力游戏',phrase:'I just love doing puzzles.',synonyms:''},
      {word:'a bit of',pos:'phr.',phonetic:'',meaning:'一点',phrase:'I\'m usually busy, but occasionally I\'ve got a bit of free time.',synonyms:''},
      {word:'have nothing to do',pos:'phr.',phonetic:'',meaning:'无所事事',phrase:'I can\'t stand having nothing to do.',synonyms:''},
      {word:'imagine sb. doing sth.',pos:'phr.',phonetic:'',meaning:'想象某人在做某事',phrase:'I like using \'street view\' and I imagine myself walking in a street somewhere.',synonyms:''},
      {word:'can\'t stand sth./sb.',pos:'phr.',phonetic:'',meaning:'无法忍受某事 / 某人',phrase:'（场景示例：I can\'t stand loud noise.）',synonyms:''},
      {word:'can\'t stand doing sth.',pos:'phr.',phonetic:'',meaning:'无法忍受做某事',phrase:'I can\'t stand having nothing to do.',synonyms:''},
      {word:'like doing sth.',pos:'phr.',phonetic:'',meaning:'喜欢做某事',phrase:'I like using \'street view\'.',synonyms:''},
      {word:'love doing sth.',pos:'phr.',phonetic:'',meaning:'喜爱做某事',phrase:'I love taking photos of them, too.',synonyms:''},
      {word:'hate doing sth.',pos:'phr.',phonetic:'',meaning:'讨厌做某事',phrase:'I hate running and doing exercise.',synonyms:''},
      {word:'be crazy about sth.',pos:'phr.',phonetic:'',meaning:'为某事疯狂',phrase:'I\'m crazy about the New Zealand rugby team, the All Blacks.',synonyms:''},
      {word:'old-fashioned',pos:'adj.',phonetic:'',meaning:'过时的；老旧的',phrase:'It looks a bit old-fashioned though.（不过它看起来有点过时。）',synonyms:''},
      {word:'second-hand',pos:'adj.',phonetic:'',meaning:'二手的',phrase:'But their clothes are all second-hand.（但他们的衣服都是二手的。）',synonyms:''},
      {word:'sale',pos:'n.',phonetic:'',meaning:'促销',phrase:'They\'ve got a sale on.（他们正在打折。）',synonyms:''},
      {word:'sell',pos:'v.',phonetic:'',meaning:'卖',phrase:'They\'re selling everything at 30% off the original price!（他们正在以原价七折出售所有商品！）',synonyms:''},
      {word:'crowded',pos:'adj.',phonetic:'',meaning:'拥挤的',phrase:'The shop\'s really crowded.（这家商店真的很拥挤。）',synonyms:''},
      {word:'waste',pos:'v.',phonetic:'',meaning:'浪费',phrase:'I think you\'re wasting your money and my time.（我认为你正在浪费你的钱和我的时间。）',synonyms:''},
      {word:'bright',pos:'adj.',phonetic:'',meaning:'明亮的；鲜亮的',phrase:'I love wearing bright colours.（我喜欢穿明亮的颜色。）',synonyms:''},
      {word:'remember',pos:'v.',phonetic:'',meaning:'记得',phrase:'It\'s raining - remember?（下雨了，还记得吗？）',synonyms:''},
      {word:'look',pos:'v.',phonetic:'',meaning:'看起来',phrase:'It looks a bit old-fashioned though.（不过它看起来有点过时。）',synonyms:''},
      {word:'sound',pos:'v.',phonetic:'',meaning:'听起来',phrase:'That sounds like a bad idea.（这听起来是个坏主意。）',synonyms:''},
      {word:'free',pos:'adj.',phonetic:'',meaning:'免费的',phrase:'I live in Liverpool and we have the best museums and they\'re all free.（我住在利物浦，我们有最好的博物馆，而且都是免费的。）',synonyms:''},
      {word:'blog',pos:'n.',phonetic:'',meaning:'博客',phrase:'Maybe you don\'t want to write a poem or even a blog, so try a story.（也许你不想写诗，甚至不想写博客，所以试着写一个故事。）',synonyms:''},
      {word:'perfect',pos:'adj.',phonetic:'',meaning:'完美的；理想的',phrase:'It\'s the perfect time to think about all the things I don\'t normally have time to think about.（这是一个理想的时间，去思考那些我通常没有时间思考的事情。）',synonyms:''},
      {word:'forget',pos:'v.',phonetic:'',meaning:'忘记；遗忘',phrase:'I like forgetting all about them just for a few hours every week.（我喜欢每周只花几个小时，就把它们忘得一干二净。）',synonyms:''},
      {word:'poem',pos:'n.',phonetic:'',meaning:'诗',phrase:'Maybe you don\'t want to write a poem or even a blog, so try a story.（也许你不想写诗，甚至不想写博客，所以试着写一个故事。）',synonyms:''},
      {word:'magazine',pos:'n.',phonetic:'',meaning:'杂志',phrase:'I read for at least four hours on a Sunday - books, magazines, websites, newspapers - anything.（我周日至少阅读四个小时 —— 书籍、杂志、网站、报纸 —— 任何读物都可以。）',synonyms:''},
      {word:'website',pos:'n.',phonetic:'',meaning:'网站',phrase:'I read for at least four hours on a Sunday - books, magazines, websites, newspapers - anything.（我周日至少阅读四个小时 —— 书籍、杂志、网站、报纸 —— 任何读物都可以。）',synonyms:''},
      {word:'newspaper',pos:'n.',phonetic:'',meaning:'报纸',phrase:'I read for at least four hours on a Sunday - books, magazines, websites, newspapers - anything.（我周日至少阅读四个小时 —— 书籍、杂志、网站、报纸 —— 任何读物都可以。）',synonyms:''},
      {word:'though',pos:'conj./adv.',phonetic:'',meaning:'虽然；不过',phrase:'It looks a bit old-fashioned though.（不过它看起来有点过时。）',synonyms:''},
      {word:'original price',pos:'phr.',phonetic:'',meaning:'原价',phrase:'They\'re selling everything at 30% off the original price!（他们正在以原价七折出售所有商品！）',synonyms:''},
      {word:'stuff',pos:'n.',phonetic:'',meaning:'东西（口语，不可数）',phrase:'I need to buy some stuff for school.（我需要买些上学用的东西。）',synonyms:''},
      {word:'anyway',pos:'adv.',phonetic:'',meaning:'无论如何',phrase:'It\'s raining, but we\'ll go out anyway.（虽然在下雨，但我们还是要出去。）',synonyms:''},
      {word:'valuable',pos:'adj.',phonetic:'',meaning:'很重要的；宝贵的',phrase:'Time is valuable, so don\'t waste it.（时间很宝贵，别浪费。）',synonyms:''},
      {word:'run out',pos:'phr.',phonetic:'',meaning:'用尽；用完',phrase:'I\'m asking for help because time is running out!（我请求帮助是因为时间快要用完了！）',synonyms:''},
      {word:'on my own',pos:'phr.',phonetic:'',meaning:'独自一人',phrase:'I like to walk on my own sometimes.（我有时喜欢独自散步。）',synonyms:''},
      {word:'normally',pos:'adv.',phonetic:'',meaning:'通常；正常情况下',phrase:'It\'s the perfect time to think about all the things I don\'t normally have time to think about.（这是一个理想的时间，去思考那些我通常没有时间思考的事情。）',synonyms:''},
      {word:'poetry',pos:'n.',phonetic:'',meaning:'诗集；诗歌（总称）',phrase:'She likes reading poetry in her free time.（她空闲时喜欢读诗。）',synonyms:''},
      {word:'upload',pos:'v.',phonetic:'',meaning:'上载；上传',phrase:'I need to upload this photo to my blog.（我需要把这张照片上传到我的博客上。）',synonyms:''},
      {word:'imagination',pos:'n.',phonetic:'',meaning:'想象力；想象',phrase:'Writing stories needs imagination.（写故事需要想象力。）',synonyms:''},
      {word:'blog post',pos:'phr.',phonetic:'',meaning:'博客帖子',phrase:'She wrote a new blog post yesterday.（她昨天写了一篇新的博客帖子。）',synonyms:''},
      {word:'Liverpool',pos:'n.',phonetic:'',meaning:'利物浦（英国城市名）',phrase:'I live in Liverpool and we have the best museums and they\'re all free.（我住在利物浦，我们有最好的博物馆，而且都是免费的。）',synonyms:''},
      {word:'check out',pos:'phr.',phonetic:'',meaning:'看一看；观望',phrase:'Let\'s check out that new shop downtown.（咱们去市中心那家新商店看看吧。）',synonyms:''},
      {word:'at least',pos:'phr.',phonetic:'',meaning:'至少',phrase:'I read for at least four hours on a Sunday.（我周日至少阅读四个小时。）',synonyms:''},
      {word:'banknote',pos:'n.',phonetic:'',meaning:'纸币',phrase:'This banknote is from the UK.（这张纸币来自英国。）',synonyms:''},
      {word:'represent',pos:'v.',phonetic:'',meaning:'代表',phrase:'The flag represents our country.（这面旗帜代表我们的国家。）',synonyms:''},
      {word:'various',pos:'adj.',phonetic:'',meaning:'各种各样的',phrase:'There are various books in the library.（图书馆里有各种各样的书。）',synonyms:''},
      {word:'history',pos:'n.',phonetic:'',meaning:'历史',phrase:'We learn about history at school.（我们在学校学习历史。）',synonyms:''},
      {word:'currency',pos:'n.',phonetic:'',meaning:'通货；货币',phrase:'What currency do they use in Japan?（日本用什么货币？）',synonyms:''},
      {word:'founder',pos:'n.',phonetic:'',meaning:'创立者；创始人',phrase:'He is the founder of this company.（他是这家公司的创始人。）',synonyms:''},
      {word:'well-known',pos:'adj.',phonetic:'',meaning:'众所周知的；著名的',phrase:'This is a well-known museum in London.（这是伦敦一家著名的博物馆。）',synonyms:''},
      {word:'consist',pos:'v.',phonetic:'',meaning:'包括；由…… 组成',phrase:'The team consists of five students.（这个团队由五名学生组成。）',synonyms:''},
      {word:'gallery',pos:'n.',phonetic:'',meaning:'（艺术作品的）陈列室；画廊',phrase:'We visited an art gallery last weekend.（我们上周末参观了一家艺术画廊。）',synonyms:''},
      {word:'offer',pos:'v.',phonetic:'',meaning:'提供',phrase:'The hotel offers free breakfast.（这家酒店提供免费早餐。）',synonyms:''},
      {word:'admission',pos:'n.',phonetic:'',meaning:'入场费',phrase:'The admission to the museum is free.（这家博物馆免收入场费。）',synonyms:''},
      {word:'stimulate',pos:'v.',phonetic:'',meaning:'促进；激发',phrase:'Reading can stimulate our imagination.（阅读能激发我们的想象力。）',synonyms:''},
      {word:'selected brand',pos:'phr.',phonetic:'',meaning:'选定的品牌',phrase:'The shop has a sale for its selected brand.（这家商店为其选定的品牌做促销。）',synonyms:''},
      {word:'product',pos:'n.',phonetic:'',meaning:'产品',phrase:'This product is very popular.（这个产品很受欢迎。）',synonyms:''},
      {word:'price reduction',pos:'phr.',phonetic:'',meaning:'降价',phrase:'There is a price reduction on all clothes.（所有衣服都在降价。）',synonyms:''},
      {word:'company',pos:'n.',phonetic:'',meaning:'公司',phrase:'She works in a big company.（她在一家大公司工作。）',synonyms:''},
      {word:'achieve',pos:'v.',phonetic:'',meaning:'实现；达到',phrase:'We need to work hard to achieve our goals.（我们需要努力工作来实现目标。）',synonyms:''},
      {word:'stock',pos:'n.',phonetic:'',meaning:'库存；存货',phrase:'The shop has no more of this shirt in stock.（这家商店的这款衬衫已经没库存了。）',synonyms:''},
      {word:'loyalty scheme',pos:'phr.',phonetic:'',meaning:'会员积分制度；会员计划',phrase:'The supermarket has a loyalty scheme for regular customers.（这家超市为常客提供会员积分制度。）',synonyms:''},
      {word:'purchase',pos:'n.',phonetic:'',meaning:'购买；所购物品',phrase:'This is my latest purchase.（这是我最新买的东西。）',synonyms:''},
      {word:'insect',pos:'n.',phonetic:'',meaning:'昆虫',phrase:'That\'s right, grasshoppers, worms, flies and lots of other insects.（没错，蝗虫、蠕虫、苍蝇和许多其他昆虫。）',synonyms:''},
      {word:'worm',pos:'n.',phonetic:'',meaning:'蠕虫',phrase:'That\'s right, grasshoppers, worms, flies and lots of other insects.（没错，蝗虫、蠕虫、苍蝇和许多其他昆虫。）',synonyms:''},
      {word:'fly',pos:'n.',phonetic:'',meaning:'苍蝇',phrase:'That\'s right, grasshoppers, worms, flies and lots of other insects.（没错，蝗虫、蠕虫、苍蝇和许多其他昆虫。）',synonyms:''},
      {word:'protein',pos:'n.',phonetic:'',meaning:'蛋白质',phrase:'Protein is very important for our health, and it\'s good for our hair and our skin.（蛋白质对我们的健康非常重要，对我们的头发和皮肤都有益处。）',synonyms:''},
      {word:'energy',pos:'n.',phonetic:'',meaning:'能源；能量',phrase:'The farms already use 30% of all the world\'s land: they create greenhouse gases and use a lot of water and energy.（这些农场已经使用了世界上 30% 的土地：它们产生了温室气体，消耗了大量的水和能源。）',synonyms:''},
      {word:'superfood',pos:'n.',phonetic:'',meaning:'超级食物（含高密度营养）',phrase:'They\'re the superfood of the future.（它们是未来的超级食物。）',synonyms:''},
      {word:'health',pos:'n.',phonetic:'',meaning:'健康',phrase:'Protein is very important for our health, and it\'s good for our hair and our skin.（蛋白质对我们的健康非常重要，对我们的头发和皮肤都有益处。）',synonyms:''},
      {word:'healthy',pos:'adj.',phonetic:'',meaning:'健康的',phrase:'But the Inuits eat a lot of animal fat and they are healthy.（但因纽特人吃很多动物脂肪，而且他们很健康。）',synonyms:''},
      {word:'enough',pos:'adj./adv.',phonetic:'',meaning:'足够的；足够地',phrase:'Have we got enough space on our planet for so many people?（我们的星球上有足够的空间容纳那么多的人吗？）',synonyms:''},
      {word:'seem',pos:'v.',phonetic:'',meaning:'似乎；好像',phrase:'But for people in Europe and many other countries, it seems very strange.（但对于欧洲和许多其他国家的人来说，这似乎很奇怪。）',synonyms:''},
      {word:'boiled',pos:'adj.',phonetic:'',meaning:'煮熟的；水煮的',phrase:'Maybe because they eat boiled rather than fried meat.（也许是因为他们吃的是煮熟的肉而不是油炸肉。）',synonyms:''},
      {word:'fried',pos:'adj.',phonetic:'',meaning:'油炸的',phrase:'Maybe because they eat boiled rather than fried meat.（也许是因为他们吃的是煮熟的肉而不是油炸肉。）',synonyms:''},
      {word:'choice',pos:'n.',phonetic:'',meaning:'选择',phrase:'The Inuits don\'t have a lot of choices for food.（因纽特人没有许多食物可供选择。）',synonyms:''},
      {word:'choose',pos:'v.',phonetic:'',meaning:'选择',phrase:'I choose to eat fruit every day.（我选择每天吃水果。）',synonyms:''},
      {word:'during',pos:'prep.',phonetic:'',meaning:'在…… 期间',phrase:'They sometimes find berries during the warmer months.（他们有时会在温暖的月份发现浆果。）',synonyms:''},
      {word:'rather than',pos:'phr.',phonetic:'',meaning:'而不是',phrase:'Maybe because they eat boiled rather than fried meat.（也许是因为他们吃的是煮熟的肉而不是油炸肉。）',synonyms:''},
      {word:'grasshopper',pos:'n.',phonetic:'',meaning:'蝗虫',phrase:'That\'s right, grasshoppers, worms, flies and lots of other insects.（没错，蝗虫、蠕虫、苍蝇和许多其他昆虫。）',synonyms:''},
      {word:'skin',pos:'n.',phonetic:'',meaning:'皮肤',phrase:'Protein is very important for our health, and it\'s good for our hair and our skin.（蛋白质对我们的健康非常重要，对我们的头发和皮肤都有益处。）',synonyms:''},
      {word:'hair',pos:'n.',phonetic:'',meaning:'头发',phrase:'Protein is very important for our health, and it\'s good for our hair and our skin.（蛋白质对我们的健康非常重要，对我们的头发和皮肤都有益处。）',synonyms:''},
      {word:'important',pos:'adj.',phonetic:'',meaning:'重要的',phrase:'Protein is very important for our health, and it\'s good for our hair and our skin.（蛋白质对我们的健康非常重要，对我们的头发和皮肤都有益处。）',synonyms:''},
      {word:'greenhouse gas',pos:'phr.',phonetic:'',meaning:'温室气体',phrase:'The farms already use 30% of all the world\'s land: they create greenhouse gases and use a lot of water and energy.（这些农场已经使用了世界上 30% 的土地：它们产生了温室气体，消耗了大量的水和能源。）',synonyms:''},
      {word:'create',pos:'v.',phonetic:'',meaning:'创造；产生',phrase:'The farms already use 30% of all the world\'s land: they create greenhouse gases and use a lot of water and energy.（这些农场已经使用了世界上 30% 的土地：它们产生了温室气体，消耗了大量的水和能源。）',synonyms:''},
      {word:'land',pos:'n.',phonetic:'',meaning:'土地',phrase:'The farms already use 30% of all the world\'s land: they create greenhouse gases and use a lot of water and energy.（这些农场已经使用了世界上 30% 的土地：它们产生了温室气体，消耗了大量的水和能源。）',synonyms:''},
      {word:'farm',pos:'n.',phonetic:'',meaning:'农场',phrase:'The farms already use 30% of all the world\'s land: they create greenhouse gases and use a lot of water and energy.（这些农场已经使用了世界上 30% 的土地：它们产生了温室气体，消耗了大量的水和能源。）',synonyms:''},
      {word:'already',pos:'adv.',phonetic:'',meaning:'已经',phrase:'The farms already use 30% of all the world\'s land: they create greenhouse gases and use a lot of water and energy.（这些农场已经使用了世界上 30% 的土地：它们产生了温室气体，消耗了大量的水和能源。）',synonyms:''},
      {word:'Inuit',pos:'n.',phonetic:'',meaning:'因纽特人',phrase:'But the Inuits eat a lot of animal fat and they are healthy.（但因纽特人吃很多动物脂肪，而且他们很健康。）',synonyms:''},
      {word:'animal fat',pos:'phr.',phonetic:'',meaning:'动物脂肪',phrase:'But the Inuits eat a lot of animal fat and they are healthy.（但因纽特人吃很多动物脂肪，而且他们很健康。）',synonyms:''},
      {word:'berry',pos:'n.',phonetic:'',meaning:'浆果',phrase:'They sometimes find berries during the warmer months.（他们有时会在温暖的月份发现浆果。）',synonyms:''},
      {word:'warmer',pos:'adj.',phonetic:'',meaning:'更温暖的',phrase:'They sometimes find berries during the warmer months.（他们有时会在温暖的月份发现浆果。）',synonyms:''},
      {word:'month',pos:'n.',phonetic:'',meaning:'月',phrase:'They sometimes find berries during the warmer months.（他们有时会在温暖的月份发现浆果。）',synonyms:''},
      {word:'sometimes',pos:'adv.',phonetic:'',meaning:'有时',phrase:'They sometimes find berries during the warmer months.（他们有时会在温暖的月份发现浆果。）',synonyms:''},
      {word:'strange',pos:'adj.',phonetic:'',meaning:'奇怪的',phrase:'But for people in Europe and many other countries, it seems very strange.（但对于欧洲和许多其他国家的人来说，这似乎很奇怪。）',synonyms:''},
      {word:'Europe',pos:'n.',phonetic:'',meaning:'欧洲',phrase:'But for people in Europe and many other countries, it seems very strange.（但对于欧洲和许多其他国家的人来说，这似乎很奇怪。）',synonyms:''},
      {word:'country',pos:'n.',phonetic:'',meaning:'国家',phrase:'But for people in Europe and many other countries, it seems very strange.（但对于欧洲和许多其他国家的人来说，这似乎很奇怪。）',synonyms:''},
      {word:'planet',pos:'n.',phonetic:'',meaning:'星球；行星',phrase:'Have we got enough space on our planet for so many people?（我们的星球上有足够的空间容纳那么多的人吗？）',synonyms:''},
      {word:'space',pos:'n.',phonetic:'',meaning:'空间',phrase:'Have we got enough space on our planet for so many people?（我们的星球上有足够的空间容纳那么多的人吗？）',synonyms:''},
      {word:'people',pos:'n.',phonetic:'',meaning:'人；人们',phrase:'Have we got enough space on our planet for so many people?（我们的星球上有足够的空间容纳那么多的人吗？）',synonyms:''},
      {word:'many',pos:'adj.',phonetic:'',meaning:'许多的',phrase:'Have we got enough space on our planet for so many people?（我们的星球上有足够的空间容纳那么多的人吗？）',synonyms:''},
      {word:'so many',pos:'phr.',phonetic:'',meaning:'那么多',phrase:'Have we got enough space on our planet for so many people?（我们的星球上有足够的空间容纳那么多的人吗？）',synonyms:''},
      {word:'future',pos:'n.',phonetic:'',meaning:'未来',phrase:'They\'re the superfood of the future.（它们是未来的超级食物。）',synonyms:''},
      {word:'of the future',pos:'phr.',phonetic:'',meaning:'未来的',phrase:'They\'re the superfood of the future.（它们是未来的超级食物。）',synonyms:''},
      {word:'ask for',pos:'phr.',phonetic:'',meaning:'请求；要求',phrase:'I\'m asking for help because time is running out!（我请求帮助是因为时间快要用完了！）',synonyms:''},
      {word:'ask for help',pos:'phr.',phonetic:'',meaning:'请求帮助',phrase:'I\'m asking for help because time is running out!（我请求帮助是因为时间快要用完了！）',synonyms:''},
      {word:'help',pos:'n.',phonetic:'',meaning:'帮助',phrase:'I\'m asking for help because time is running out!（我请求帮助是因为时间快要用完了！）',synonyms:''},
      {word:'because',pos:'conj.',phonetic:'',meaning:'因为',phrase:'I\'m asking for help because time is running out!（我请求帮助是因为时间快要用完了！）',synonyms:''},
      {word:'time',pos:'n.',phonetic:'',meaning:'时间',phrase:'I\'m asking for help because time is running out!（我请求帮助是因为时间快要用完了！）',synonyms:''},
      {word:'water',pos:'n.',phonetic:'',meaning:'水',phrase:'The farms already use 30% of all the world\'s land: they create greenhouse gases and use a lot of water and energy.（这些农场已经使用了世界上 30% 的土地：它们产生了温室气体，消耗了大量的水和能源。）',synonyms:''},
      {word:'a lot of',pos:'phr.',phonetic:'',meaning:'大量的',phrase:'The farms already use 30% of all the world\'s land: they create greenhouse gases and use a lot of water and energy.（这些农场已经使用了世界上 30% 的土地：它们产生了温室气体，消耗了大量的水和能源。）',synonyms:''},
      {word:'use',pos:'v.',phonetic:'',meaning:'使用；消耗',phrase:'The farms already use 30% of all the world\'s land: they create greenhouse gases and use a lot of water and energy.（这些农场已经使用了世界上 30% 的土地：它们产生了温室气体，消耗了大量的水和能源。）',synonyms:''},
      {word:'30%',pos:'phr.',phonetic:'',meaning:'百分之三十',phrase:'The farms already use 30% of all the world\'s land: they create greenhouse gases and use a lot of water and energy.（这些农场已经使用了世界上 30% 的土地：它们产生了温室气体，消耗了大量的水和能源。）',synonyms:''},
      {word:'world',pos:'n.',phonetic:'',meaning:'世界',phrase:'The farms already use 30% of all the world\'s land: they create greenhouse gases and use a lot of water and energy.（这些农场已经使用了世界上 30% 的土地：它们产生了温室气体，消耗了大量的水和能源。）',synonyms:''},
      {word:'all',pos:'adj.',phonetic:'',meaning:'所有的',phrase:'The farms already use 30% of all the world\'s land: they create greenhouse gases and use a lot of water and energy.（这些农场已经使用了世界上 30% 的土地：它们产生了温室气体，消耗了大量的水和能源。）',synonyms:''},
      {word:'all the world',pos:'phr.',phonetic:'',meaning:'全世界的',phrase:'The farms already use 30% of all the world\'s land: they create greenhouse gases and use a lot of water and energy.（这些农场已经使用了世界上 30% 的土地：它们产生了温室气体，消耗了大量的水和能源。）',synonyms:''},
      {word:'eat',pos:'v.',phonetic:'',meaning:'吃',phrase:'But the Inuits eat a lot of animal fat and they are healthy.（但因纽特人吃很多动物脂肪，而且他们很健康。）',synonyms:''},
      {word:'find',pos:'v.',phonetic:'',meaning:'发现；找到',phrase:'They sometimes find berries during the warmer months.（他们有时会在温暖的月份发现浆果。）',synonyms:''},
      {word:'lot',pos:'n.',phonetic:'',meaning:'大量；许多',phrase:'But the Inuits eat a lot of animal fat and they are healthy.（但因纽特人吃很多动物脂肪，而且他们很健康。）',synonyms:''},
      {word:'a lot',pos:'phr.',phonetic:'',meaning:'大量；非常',phrase:'But the Inuits eat a lot of animal fat and they are healthy.（但因纽特人吃很多动物脂肪，而且他们很健康。）',synonyms:''},
      {word:'lot of',pos:'phr.',phonetic:'',meaning:'大量的',phrase:'But the Inuits eat a lot of animal fat and they are healthy.（但因纽特人吃很多动物脂肪，而且他们很健康。）',synonyms:''},
      {word:'very',pos:'adv.',phonetic:'',meaning:'非常；很',phrase:'But for people in Europe and many other countries, it seems very strange.（但对于欧洲和许多其他国家的人来说，这似乎很奇怪。）',synonyms:''},
      {word:'for',pos:'prep.',phonetic:'',meaning:'对于；为了',phrase:'But for people in Europe and many other countries, it seems very strange.（但对于欧洲和许多其他国家的人来说，这似乎很奇怪。）',synonyms:''},
      {word:'other',pos:'adj.',phonetic:'',meaning:'其他的',phrase:'But for people in Europe and many other countries, it seems very strange.（但对于欧洲和许多其他国家的人来说，这似乎很奇怪。）',synonyms:''},
      {word:'many other',pos:'phr.',phonetic:'',meaning:'许多其他的',phrase:'But for people in Europe and many other countries, it seems very strange.（但对于欧洲和许多其他国家的人来说，这似乎很奇怪。）',synonyms:''},
      {word:'many other countries',pos:'phr.',phonetic:'',meaning:'许多其他国家',phrase:'But for people in Europe and many other countries, it seems very strange.（但对于欧洲和许多其他国家的人来说，这似乎很奇怪。）',synonyms:''},
      {word:'but',pos:'conj.',phonetic:'',meaning:'但是',phrase:'But the Inuits eat a lot of animal fat and they are healthy.（但因纽特人吃很多动物脂肪，而且他们很健康。）',synonyms:''},
      {word:'and',pos:'conj.',phonetic:'',meaning:'和；并且',phrase:'Protein is very important for our health, and it\'s good for our hair and our skin.（蛋白质对我们的健康非常重要，对我们的头发和皮肤都有益处。）',synonyms:''},
      {word:'good for',pos:'phr.',phonetic:'',meaning:'对……有好处',phrase:'Protein is very important for our health, and it\'s good for our hair and our skin.（蛋白质对我们的健康非常重要，对我们的头发和皮肤都有益处。）',synonyms:''},
      {word:'our',pos:'pron.',phonetic:'',meaning:'我们的',phrase:'Protein is very important for our health, and it\'s good for our hair and our skin.（蛋白质对我们的健康非常重要，对我们的头发和皮肤都有益处。）',synonyms:''},
      {word:'they',pos:'pron.',phonetic:'',meaning:'它们；他们',phrase:'They\'re the superfood of the future.（它们是未来的超级食物。）',synonyms:''},
      {word:'they\'re',pos:'pron.',phonetic:'',meaning:'它们是（they are 的缩写）',phrase:'They\'re the superfood of the future.（它们是未来的超级食物。）',synonyms:''},
      {word:'right',pos:'adv.',phonetic:'',meaning:'对的；正确的',phrase:'That\'s right, grasshoppers, worms, flies and lots of other insects.（没错，蝗虫、蠕虫、苍蝇和许多其他昆虫。）',synonyms:''},
      {word:'that\'s right',pos:'phr.',phonetic:'',meaning:'没错；对的',phrase:'That\'s right, grasshoppers, worms, flies and lots of other insects.（没错，蝗虫、蠕虫、苍蝇和许多其他昆虫。）',synonyms:''},
      {word:'lots of',pos:'phr.',phonetic:'',meaning:'许多；大量',phrase:'That\'s right, grasshoppers, worms, flies and lots of other insects.（没错，蝗虫、蠕虫、苍蝇和许多其他昆虫。）',synonyms:''},
      {word:'lots',pos:'n.',phonetic:'',meaning:'许多；大量',phrase:'That\'s right, grasshoppers, worms, flies and lots of other insects.（没错，蝗虫、蠕虫、苍蝇和许多其他昆虫。）',synonyms:''},
      {word:'other',pos:'adj.',phonetic:'',meaning:'其他的',phrase:'That\'s right, grasshoppers, worms, flies and lots of other insects.（没错，蝗虫、蠕虫、苍蝇和许多其他昆虫。）',synonyms:''},
      {word:'lots of other',pos:'phr.',phonetic:'',meaning:'许多其他的',phrase:'That\'s right, grasshoppers, worms, flies and lots of other insects.（没错，蝗虫、蠕虫、苍蝇和许多其他昆虫。）',synonyms:''}
    ]},
    "think1_u1_4_daily": { name: "📅 Think1 U1-4每日40词(按顺序推送)", words: [] }
  },
  sentences: {
    "sentence_basic_16": { name: "句子成分分析基础16题", items: [
      {sentence:"The clever boy read an interesting book.",words:["The","clever","boy","read","an","interesting","book","."],roles:[0,0,0,1,2,2,2,-1],translation:"聪明的男孩读了一本有趣的书。",exp:"主语：The clever boy（聪明的男孩）· 谓语：read（读）· 宾语：an interesting book（一本有趣的书）"},
      {sentence:"My mother cooks delicious food every day.",words:["My","mother","cooks","delicious","food","every","day","."],roles:[0,0,1,2,2,-1,-1,-1],translation:"我妈妈每天做美味的食物。",exp:"主语：My mother（我妈妈）· 谓语：cooks（做）· 宾语：delicious food（美味的食物）· 状语：every day（每天）"},
      {sentence:"The cute pandas are eating bamboo.",words:["The","cute","pandas","are","eating","bamboo","."],roles:[0,0,0,1,1,2,-1],translation:"可爱的熊猫正在吃竹子。",exp:"主语：The cute pandas（可爱的熊猫）· 谓语：are eating（正在吃）· 宾语：bamboo（竹子）"},
      {sentence:"The sun shines brightly.",words:["The","sun","shines","brightly","."],roles:[0,0,1,-1,-1],translation:"太阳明亮地照耀着。",exp:"主语：The sun（太阳）· 谓语：shines（照耀）· 本句无宾语，brightly（明亮地）是状语"},
      {sentence:"Our English teacher is very kind.",words:["Our","English","teacher","is","very","kind","."],roles:[0,0,0,1,2,2,-1],translation:"我们的英语老师非常亲切。",exp:"主语：Our English teacher（我们的英语老师）· 系动词：is（是）· 表语：very kind（非常亲切）"},
      {sentence:"Those blue flowers smell nice.",words:["Those","blue","flowers","smell","nice","."],roles:[0,0,0,1,2,-1],translation:"那些蓝色的花闻起来很好闻。",exp:"主语：Those blue flowers（那些蓝色的花）· 系动词：smell（闻起来）· 表语：nice（好闻的）"},
      {sentence:"We visited the science museum yesterday.",words:["We","visited","the","science","museum","yesterday","."],roles:[0,1,2,2,2,-1,-1],translation:"我们昨天参观了科技馆。",exp:"主语：We（我们）· 谓语：visited（参观）· 宾语：the science museum（科技馆）· 状语：yesterday（昨天）"},
      {sentence:"My father bought me a new bicycle.",words:["My","father","bought","me","a","new","bicycle","."],roles:[0,0,1,2,2,2,2,-1],translation:"我爸爸给我买了一辆新自行车。",exp:"主语：My father（我爸爸）· 谓语：bought（买）· 间接宾语：me（我）· 直接宾语：a new bicycle（一辆新自行车）"},
      {sentence:"The teacher gave us some homework.",words:["The","teacher","gave","us","some","homework","."],roles:[0,0,1,2,2,2,-1],translation:"老师给了我们一些作业。",exp:"主语：The teacher（老师）· 谓语：gave（给）· 间接宾语：us（我们）· 直接宾语：some homework（一些作业）"},
      {sentence:"The good news made Tom very happy.",words:["The","good","news","made","Tom","very","happy","."],roles:[0,0,0,1,2,2,2,-1],translation:"好消息让汤姆非常高兴。",exp:"主语：The good news（好消息）· 谓语：made（让）· 宾语：Tom（汤姆）· 宾语补足语：very happy（非常高兴）"},
      {sentence:"We call our dog Lucky.",words:["We","call","our","dog","Lucky","."],roles:[0,1,2,2,2,-1],translation:"我们叫我们的狗拉奇。",exp:"主语：We（我们）· 谓语：call（叫/称呼）· 宾语：our dog（我们的狗）· 宾语补足语：Lucky（拉奇）"},
      {sentence:"The birds are singing happily in the tree.",words:["The","birds","are","singing","happily","in","the","tree","."],roles:[0,0,1,1,-1,-1,-1,-1,-1],translation:"鸟儿们在树上快乐地唱歌。",exp:"主语：The birds（鸟儿们）· 谓语：are singing（正在唱歌）· 本句无宾语，happily（快乐地）和 in the tree（在树上）是状语"},
      {sentence:"Students must finish their work before nine o'clock.",words:["Students","must","finish","their","work","before","nine","o'clock","."],roles:[0,1,1,2,2,-1,-1,-1,-1],translation:"学生们必须在9点之前完成他们的功课。",exp:"主语：Students（学生们）· 谓语：must finish（必须完成）· 宾语：their work（他们的功课）· 状语：before nine o'clock（在9点之前）"},
      {sentence:"The girl in the red skirt plays the piano well.",words:["The","girl","in","the","red","skirt","plays","the","piano","well","."],roles:[0,0,-1,-1,-1,-1,1,2,2,-1,-1],translation:"穿红裙子的女孩钢琴弹得很好。",exp:"主语：The girl（女孩）· 谓语：plays（弹奏）· 宾语：the piano（钢琴）· 状语：well（好地）· in the red skirt 是定语修饰 girl"},
      {sentence:"I know that he likes playing football.",words:["I","know","that","he","likes","playing","football","."],roles:[0,1,2,2,2,2,2,-1],translation:"我知道他喜欢踢足球。",exp:"主语：I（我）· 谓语：know（知道）· 宾语从句：that he likes playing football（他喜欢踢足球，整个从句做宾语）"},
      {sentence:"Tom said that he lost his schoolbag.",words:["Tom","said","that","he","lost","his","schoolbag","."],roles:[0,1,2,2,2,2,2,-1],translation:"汤姆说他弄丢了书包。",exp:"主语：Tom（汤姆）· 谓语：said（说）· 宾语从句：that he lost his schoolbag（他弄丢了书包，整个从句做宾语）"}
    ]},
    "sentence_advanced_4": { name: "句子成分分析进阶4题", items: [
      {sentence:"If it rains tomorrow, we will stay at home.",words:["If","it","rains","tomorrow","we","will","stay","at","home","."],roles:[-1,-1,-1,-1,0,1,1,-1,-1,-1],translation:"如果明天下雨，我们将呆在家里。",exp:"条件状语从句：If it rains tomorrow（如果明天下雨）· 主语：we（我们）· 谓语：will stay（将呆在）· 状语：at home（在家里）"},
      {sentence:"When the bell rang, the students left the classroom.",words:["When","the","bell","rang","the","students","left","the","classroom","."],roles:[-1,-1,-1,-1,0,0,1,2,2,-1],translation:"当铃声响起的时候，学生们离开了教室。",exp:"时间状语从句：When the bell rang（当铃声响起的时候）· 主语：the students（学生们）· 谓语：left（离开）· 宾语：the classroom（教室）"},
      {sentence:"The man who is wearing a hat is my uncle.",words:["The","man","who","is","wearing","a","hat","is","my","uncle","."],roles:[0,0,-1,-1,-1,-1,-1,1,2,2,-1],translation:"戴帽子的那个人是我的叔叔。",exp:"主语：The man（那个人）· 定语从句：who is wearing a hat（戴着帽子的，修饰 The man）· 系动词：is（是）· 表语：my uncle（我的叔叔）"},
      {sentence:"I like the book which you gave me.",words:["I","like","the","book","which","you","gave","me","."],roles:[0,1,2,2,-1,-1,-1,-1,-1],translation:"我喜欢你给我的那本书。",exp:"主语：I（我）· 谓语：like（喜欢）· 宾语：the book（这本书）· 定语从句：which you gave me（你给我的，修饰 the book）"}
    ]}
  }
};

// PET 场景单词（23-25）- 必须在 getDefaultVocabularyWords 之前定义
const PET_SCENE_WORDS = [...MODULE_LIBRARY.vocabulary.pet_scene_23.words, ...MODULE_LIBRARY.vocabulary.pet_scene_24.words, ...MODULE_LIBRARY.vocabulary.pet_scene_25.words];

// 获取默认词汇（使用 PET 场景 23-25）
async function getDefaultVocabularyWords() {
  const gradeCfg = GRADE_CONTENT[currentGrade] || GRADE_CONTENT.default;
  if (Array.isArray(gradeCfg.vocabulary) && gradeCfg.vocabulary.length > 0) {
    if (typeof gradeCfg.vocabulary[0] === 'string') {
      return getWordsFromVocabularyKeys(gradeCfg.vocabulary);
    }
    return dedupeWords(gradeCfg.vocabulary.map(word => cloneVocabularyWord(word)));
  }

  // 优先使用 MODULE_LIBRARY 中的 PET 场景单词（始终可用）
  if (PET_SCENE_WORDS && PET_SCENE_WORDS.length > 0) {
    return [...PET_SCENE_WORDS];
  }

  // 如果 MODULE_LIBRARY 也没有，尝试从 vocab_data.json 加载
  const todayScenes = await getTodayScenes();
  const sceneKeys = gradeCfg.scenes || todayScenes;
  if (sceneKeys && sceneKeys.length > 0) {
    const words = getWordsFromVocabularyKeys(sceneKeys);
    if (words.length > 0) return words;
  }
  // 最后兜底：返回全部单词
  return [...allWordsFlat];
}

// 从 MODULE_LIBRARY 聚合默认内容
function getDefaultGrammarMC() {
  let result = [];
  Object.values(MODULE_LIBRARY.grammar).forEach(mod => {
    if (mod.mc) result = result.concat(mod.mc);
  });
  return result;
}

function getDefaultGrammarCorrect() {
  let result = [];
  Object.values(MODULE_LIBRARY.grammar).forEach(mod => {
    if (mod.correct) result = result.concat(mod.correct);
  });
  return result;
}

function getDefaultSentenceAnalysis() {
  let result = [];
  Object.values(MODULE_LIBRARY.sentences).forEach(mod => {
    if (mod.items) result = result.concat(mod.items);
  });
  return result;
}

function getDefaultGrammarReview() {
  let result = '';
  Object.values(MODULE_LIBRARY.grammar).forEach(mod => {
    if (mod.review) result = mod.review;
  });
  return result;
}

// 获取当前学生应该看到的内容（根据教师推送配置）
async function getContent() {
  // 如果有学生登录，检查是否有推送配置
  if (currentUser && currentUser.type === 'student') {
    const studentName = currentUser.name;
    
    // 优先使用缓存
    if (_cachedPushStudent === studentName && _cachedPushConfig !== undefined) {
      if (_cachedPushConfig) {
        return getContentFromPush(_cachedPushConfig);
      }
    } else {
      // 尝试从 localStorage 加载缓存
      const cached = localStorage.getItem('push_config_' + studentName);
      if (cached) {
        try {
          _cachedPushConfig = JSON.parse(cached);
          _cachedPushStudent = studentName;
          return getContentFromPush(_cachedPushConfig);
        } catch(e) {
          // 缓存损坏，继续
        }
      }
    }
    
    // 从 Supabase 查询（带超时）
    try {
      const { data } = await sb.from('push_configs').select('push_config').eq('student_name', studentName).single();
      if (data && data.push_config) {
        _cachedPushConfig = data.push_config;
        _cachedPushStudent = studentName;
        localStorage.setItem('push_config_' + studentName, JSON.stringify(data.push_config));
        return getContentFromPush(data.push_config);
      } else {
        _cachedPushConfig = null;
        _cachedPushStudent = studentName;
      }
    } catch(e) {
      // 无推送配置或查询失败，使用默认内容
      _cachedPushConfig = null;
      _cachedPushStudent = studentName;
    }
  }
  // 默认内容（无推送时使用）
  return {
    vocabulary: await getDefaultVocabularyWords(),
    grammarMC: getDefaultGrammarMC(),
    grammarFill: contentData.grammarFill,
    grammarCorrect: getDefaultGrammarCorrect(),
    grammarReview: getDefaultGrammarReview(),
    sentenceAnalysis: getDefaultSentenceAnalysis()
  };
}

// 根据推送配置获取内容
function getContentFromPush(pushConfig) {
  let words = [];
  let grammarMC = [];
  let grammarCorrect = [];
  let grammarReview = '';
  let sentenceAnalysis = [];

  if (pushConfig) {
    const vocabModules = pushConfig.vocabulary || [];
    words = getWordsFromVocabularyKeysWithDaily(vocabModules);
    const grammarModules = pushConfig.grammar || [];
    grammarModules.forEach(modKey => {
      if (MODULE_LIBRARY.grammar[modKey]) {
        grammarMC = grammarMC.concat(MODULE_LIBRARY.grammar[modKey].mc || []);
        grammarCorrect = grammarCorrect.concat(MODULE_LIBRARY.grammar[modKey].correct || []);
        if (MODULE_LIBRARY.grammar[modKey].review) {
          grammarReview = MODULE_LIBRARY.grammar[modKey].review;
        }
      }
    });
    const sentenceModules = pushConfig.sentences || [];
    sentenceModules.forEach(modKey => {
      if (MODULE_LIBRARY.sentences[modKey]) {
        sentenceAnalysis = sentenceAnalysis.concat(MODULE_LIBRARY.sentences[modKey].items || []);
      }
    });
  }

  return {
    vocabulary: dedupeWords(words),
    grammarMC,
    grammarFill: contentData.grammarFill,
    grammarCorrect,
    grammarReview,
    sentenceAnalysis
  };
}

// 支持每日40词顺序推送的词汇加载
function getWordsFromVocabularyKeysWithDaily(keys = []) {
  let words = [];
  keys.forEach(key => {
    // 特殊处理：think1_u1_4_daily 表示按天推送40词
    if (key === 'think1_u1_4_daily') {
      const allWords = MODULE_LIBRARY.vocabulary['think1_u1_4']?.words || [];
      const dailyCount = 40;
      // 计算从登录日到现在是第几天（以2025-09-01为起始日）
      const startDate = new Date('2025-09-01');
      const today = new Date();
      today.setHours(0,0,0,0);
      startDate.setHours(0,0,0,0);
      const dayIndex = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
      const startIdx = Math.max(0, dayIndex * dailyCount);
      const endIdx = Math.min(allWords.length, startIdx + dailyCount);
      const todayWords = allWords.slice(startIdx, endIdx);
      words = words.concat(todayWords.map(word => cloneVocabularyWord(word, { sceneKey: 'think1_u1_4_daily', sceneTitle: `Think1 U1-4 第${dayIndex+1}天(${startIdx+1}-${endIdx}词)` })));
      return;
    }
    if (MODULE_LIBRARY.vocabulary[key]) {
      const module = MODULE_LIBRARY.vocabulary[key];
      words = words.concat(module.words.map(word => cloneVocabularyWord(word, { sceneKey: key, sceneTitle: module.name })));
      return;
    }
    if (vocabData && vocabData[key]) {
      words = words.concat(vocabData[key].words.map(word => cloneVocabularyWord(word, { sceneKey: key, sceneTitle: vocabData[key].title })));
    }
  });
  return dedupeWords(words);
}

const contentData = {
  vocabulary: [],
  grammarMC: [],
  grammarFill: [
    {q:"She ______ (be) a student.",ans:"is",exp:"主语She是第三人称单数，be动词用is。"},
    {q:"They ______ (go) to the park last Sunday.",ans:"went",exp:"last Sunday是过去时间，go的过去式是went。"},
    {q:"Look! The boys ______ (swim) in the river.",ans:"are swimming",exp:"Look!提示现在进行时，结构为be + V-ing。"},
    {q:"My mother ______ (cook) dinner every day.",ans:"cooks",exp:"every day是一般现在时，主语第三人称单数，动词加s。"},
    {q:"I ______ (not finish) my homework yet.",ans:"haven't finished",exp:"yet提示现在完成时，结构为have/has + 过去分词。"}
  ],
  grammarCorrect: [],
  sentenceAnalysis: []
};
