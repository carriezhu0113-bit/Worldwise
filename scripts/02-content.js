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
    vocabulary: ['pet_scene_24', 'pet_scene_23', 'low_subject_material', 'low_adverbs', 'low_jobs_colors'],
    grammar: ['pronoun_basic', 'present_simple_continuous', 'prepositional_phrases'],
    sentences: ['sentence_basic_16']
  },
  high: {
    vocabulary: ['think1_u1_4_daily'],
    grammar: ['pronoun_basic', 'present_simple_continuous', 'prepositional_phrases'],
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
    "low_subject_material": { name: "学科与材料", words: [
      {word:"geography",pos:"n.",phonetic:"dʒiˈɒɡrəfi",meaning:"地理",phrase:"study geography 学习地理",synonyms:"近: earth science"},
      {word:"history",pos:"n.",phonetic:"ˈhɪstri",meaning:"历史",phrase:"learn history 学习历史",synonyms:"近: the past"},
      {word:"sports",pos:"n.",phonetic:"spɔːts",meaning:"体育运动",phrase:"play sports 做运动",synonyms:"近: athletics, games"},
      {word:"maths",pos:"n.",phonetic:"mæθs",meaning:"数学",phrase:"do maths 做数学题",synonyms:"近: mathematics"},
      {word:"language",pos:"n.",phonetic:"ˈlæŋɡwɪdʒ",meaning:"语言",phrase:"speak a language 说一种语言",synonyms:"近: tongue"},
      {word:"music",pos:"n.",phonetic:"ˈmjuːzɪk",meaning:"音乐",phrase:"listen to music 听音乐",synonyms:"近: melody, tune"},
      {word:"science",pos:"n.",phonetic:"ˈsaɪᵊns",meaning:"科学",phrase:"science class 科学课",synonyms:"近: natural science"},
      {word:"IT",pos:"n.",phonetic:"aɪ tiː",meaning:"信息技术",phrase:"IT skills 信息技术技能",synonyms:"近: information technology"},
      {word:"art",pos:"n.",phonetic:"ɑːt",meaning:"艺术；美术",phrase:"art class 美术课",synonyms:"近: creativity"},
      {word:"favourite",pos:"adj.",phonetic:"ˈfeɪvərɪt",meaning:"最喜欢的",phrase:"my favourite subject 我最喜欢的科目",synonyms:"近: preferred"},
      {word:"subject",pos:"n.",phonetic:"ˈsʌbdʒɪkt",meaning:"科目；学科",phrase:"school subject 学校科目",synonyms:"近: topic, course"},
      {word:"metal",pos:"n.",phonetic:"ˈmetᵊl",meaning:"金属",phrase:"made of metal 金属制成的",synonyms:"近: iron, steel"},
      {word:"wool",pos:"n.",phonetic:"wʊl",meaning:"羊毛",phrase:"made of wool 羊毛制成的",synonyms:"近: fleece"},
      {word:"plastic",pos:"n./adj.",phonetic:"ˈplæstɪk",meaning:"塑料（的）",phrase:"plastic bottle 塑料瓶",synonyms:"近: synthetic"},
      {word:"wood",pos:"n.",phonetic:"wʊd",meaning:"木头",phrase:"made of wood 木头制成的",synonyms:"近: timber, forest"},
      {word:"silver",pos:"n./adj.",phonetic:"ˈsɪlvə",meaning:"银（的）",phrase:"silver ring 银戒指",synonyms:"近: metallic"},
      {word:"glass",pos:"n.",phonetic:"ɡlɑːs",meaning:"玻璃",phrase:"made of glass 玻璃制成的",synonyms:"近: crystal"},
      {word:"gold",pos:"n./adj.",phonetic:"ɡəʊld",meaning:"金（的）",phrase:"gold medal 金牌",synonyms:"近: golden"},
      {word:"striped",pos:"adj.",phonetic:"straɪpt",meaning:"有条纹的",phrase:"striped shirt 条纹衬衫",synonyms:"近: striated"},
      {word:"spotted",pos:"adj.",phonetic:"ˈspɒtɪd",meaning:"有斑点的",phrase:"spotted dress 波点连衣裙",synonyms:"近: dotted, speckled"}
    ]},
    "low_adverbs": { name: "常用副词", words: [
      {word:"quickly",pos:"adv.",phonetic:"ˈkwɪkli",meaning:"快速地",phrase:"run quickly 快速地跑",synonyms:"近: fast, rapidly"},
      {word:"fast",pos:"adv./adj.",phonetic:"fɑːst",meaning:"快地；快速的",phrase:"run fast 跑得快",synonyms:"近: quickly, rapid"},
      {word:"loudly",pos:"adv.",phonetic:"ˈlaʊdli",meaning:"大声地",phrase:"speak loudly 大声说话",synonyms:"近: noisily 反: quietly"},
      {word:"slowly",pos:"adv.",phonetic:"ˈsləʊli",meaning:"慢慢地",phrase:"walk slowly 慢慢地走",synonyms:"近: gradually 反: quickly"},
      {word:"quietly",pos:"adv.",phonetic:"ˈkwaɪətli",meaning:"安静地",phrase:"sit quietly 安静地坐着",synonyms:"近: silently 反: loudly"},
      {word:"beautifully",pos:"adv.",phonetic:"ˈbjuːtɪfʊli",meaning:"美丽地；优美地",phrase:"sing beautifully 唱得优美",synonyms:"近: wonderfully, gracefully"}
    ]},
    "low_jobs_colors": { name: "职业与颜色", words: [
      {word:"cook",pos:"n.",phonetic:"kʊk",meaning:"厨师",phrase:"a good cook 一个好厨师",synonyms:"近: chef"},
      {word:"waiter",pos:"n.",phonetic:"ˈwetə",meaning:"服务员",phrase:"a waiter in a restaurant 餐厅服务员",synonyms:"近: server"},
      {word:"actor",pos:"n.",phonetic:"ˈæktə",meaning:"演员",phrase:"a famous actor 著名演员",synonyms:"近: performer"},
      {word:"journalist",pos:"n.",phonetic:"ˈdʒːnəlɪst",meaning:"记者",phrase:"a TV journalist 电视记者",synonyms:"近: reporter"},
      {word:"artist",pos:"n.",phonetic:"ɑːtɪst",meaning:"艺术家；画家",phrase:"a great artist 伟大的艺术家",synonyms:"近: painter, creator"},
      {word:"driver",pos:"n.",phonetic:"ˈdraɪvə",meaning:"司机",phrase:"a bus driver 公交车司机",synonyms:"近: chauffeur"},
      {word:"photographer",pos:"n.",phonetic:"fəˈtɒɡrəfə",meaning:"摄影师",phrase:"a wedding photographer 婚礼摄影师",synonyms:"近: cameraman"},
      {word:"designer",pos:"n.",phonetic:"dɪˈzaɪnə",meaning:"设计师",phrase:"a fashion designer 时装设计师",synonyms:"近: creator, stylist"},
      {word:"singer",pos:"n.",phonetic:"ˈsŋə",meaning:"歌手",phrase:"a pop singer 流行歌手",synonyms:"近: vocalist"},
      {word:"costume",pos:"n.",phonetic:"ˈkɒstjuːm",meaning:"服装；戏服",phrase:"a Halloween costume 万圣节服装",synonyms:"近: outfit, dress"},
      {word:"bright",pos:"adj.",phonetic:"braɪt",meaning:"明亮的；鲜艳的",phrase:"a bright colour 鲜艳的颜色",synonyms:"近: vivid, shiny 反: dark"},
      {word:"light",pos:"adj.",phonetic:"laɪt",meaning:"浅色的；轻的",phrase:"light blue 浅蓝色",synonyms:"近: pale 反: dark"},
      {word:"dark",pos:"adj.",phonetic:"dɑːk",meaning:"深色的；黑暗的",phrase:"dark green 深绿色",synonyms:"近: deep 反: light, bright"}
    ]},
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
      {wrong:"Him is very good at playing the piano.",right:"He is very good at playing the piano.",correctWord:"He",exp:"作句子开头的主语，必须用主格 He。"},
      {wrong:"This is my kite and that one is your.",right:"This is my kite and that one is yours.",correctWord:"yours",exp:"后面没有名词，不能用形容词性物主代词 your，必须换成名词性物主代词 yours。"},
      {wrong:"Please tell we the truth about the broken vase.",right:"Please tell us the truth about the broken vase.",correctWord:"us",exp:"动词 tell 后面接宾语，用宾格 us。"},
      {wrong:"The cat is washing it face with its paws.",right:"The cat is washing its face with its paws.",correctWord:"its",exp:"修饰名词 face（脸），表示'它的脸'，用形容词性物主代词 its。"},
      {wrong:"Mrs. King invited my sister and I to her birthday party.",right:"Mrs. King invited my sister and me to her birthday party.",correctWord:"me",exp:"动词 invited 后面是宾语位置，My sister and me 共同作宾语，用宾格 me。"},
      {wrong:"These books aren't their. They belong to the school.",right:"These books aren't theirs. They belong to the school.",correctWord:"theirs",exp:"句尾没有名词，表示'他们的书'，用名词性物主代词 theirs。"},
      {wrong:"Us are planning a surprise party for our teacher.",right:"We are planning a surprise party for our teacher.",correctWord:"We",exp:"作全句的主语，用主格 We。"},
      {wrong:"The room is very messy. Please clean its up right now.",right:"The room is very messy. Please clean it up right now.",correctWord:"it",exp:"clean up 是'动词+副词'短语，代词作宾语要放中间，表示'把它打扫干净'，用宾格 it。"},
      {wrong:"She makes her a beautiful dress for the school play.",right:"She makes herself a beautiful dress for the school play.",correctWord:"herself",exp:"当句子的主语（She）和动词的宾语是同一个人时，宾语要用反身代词，指'她给自己（herself）做衣服'。"},
      {wrong:"Look at the house. It's windows are all broken.",right:"Look at the house. Its windows are all broken.",correctWord:"Its",exp:"这里需要形容词性物主代词来修饰 windows（窗户），表示'它的窗户'。It's 是 'It is'（它是）的缩写，语意不通。"}
    ]},
    "present_simple_continuous": { name: "一般现在时与现在进行时(五年级)", review: `
<div style="text-align:left;line-height:1.8">
<h3 style="text-align:center;color:#2563eb;margin-bottom:16px">📚 一般现在时 vs 现在进行时</h3>

<div style="background:#eff6ff;border-radius:12px;padding:16px;margin-bottom:16px">
<h4 style="color:#1e40af;margin-bottom:8px">⏰ 一般现在时（Simple Present）</h4>
<p>• <b>用法</b>：表示经常性、习惯性的动作，或客观事实、真理</p>
<p>• <b>结构</b>：主语 + 动词原形（第三人称单数加 -s/-es）</p>
<p>• <b>常见时间状语</b>：every day, every week, usually, often, sometimes, always, never, on Mondays</p>
<p style="background:#fef9c3;padding:8px;border-radius:8px;margin:6px 0">例：She <b>goes</b> to school every day.（她每天去上学。）</p>
<p style="background:#fef9c3;padding:8px;border-radius:8px;margin:6px 0">例：The sun <b>rises</b> in the east.（太阳从东方升起。）</p>
</div>

<div style="background:#f0fdf4;border-radius:12px;padding:16px;margin-bottom:16px">
<h4 style="color:#166534;margin-bottom:8px">🔄 现在进行时（Present Continuous）</h4>
<p>• <b>用法</b>：表示现在（说话瞬间）正在进行的动作，或现阶段正在做的事</p>
<p>• <b>结构</b>：主语 + am/is/are + 动词-ing</p>
<p>• <b>常见时间状语</b>：now, right now, at the moment, at present, today, Look!, Listen!</p>
<p style="background:#dcfce7;padding:8px;border-radius:8px;margin:6px 0">例：She <b>is doing</b> her homework now.（她现在正在做作业。）</p>
<p style="background:#dcfce7;padding:8px;border-radius:8px;margin:6px 0">例：<b>Look!</b> The boys <b>are playing</b> football.（看！男孩们正在踢足球。）</p>
</div>

<div style="background:#fefce8;border-radius:12px;padding:16px;margin-bottom:16px">
<h4 style="color:#854d0e;margin-bottom:8px">🌟 核心对比</h4>
<table style="width:100%;border-collapse:collapse;font-size:14px">
<tr style="background:#fef9c3"><th style="padding:8px;border:1px solid #fde68a">对比项</th><th style="padding:8px;border:1px solid #fde68a">一般现在时</th><th style="padding:8px;border:1px solid #fde68a">现在进行时</th></tr>
<tr><td style="padding:6px;border:1px solid #e5e7eb">含义</td><td style="padding:6px;border:1px solid #e5e7eb">经常/习惯/事实</td><td style="padding:6px;border:1px solid #e5e7eb">此刻正在进行</td></tr>
<tr style="background:#f9fafb"><td style="padding:6px;border:1px solid #e5e7eb">标志词</td><td style="padding:6px;border:1px solid #e5e7eb">every day, usually, often</td><td style="padding:6px;border:1px solid #e5e7eb">now, at the moment, Look!</td></tr>
<tr><td style="padding:6px;border:1px solid #e5e7eb">例句</td><td style="padding:6px;border:1px solid #e5e7eb">I <b>play</b> tennis every Sunday.</td><td style="padding:6px;border:1px solid #e5e7eb">I <b>am playing</b> tennis now.</td></tr>
</table>
</div>

<div style="background:#fef2f2;border-radius:12px;padding:16px;margin-bottom:16px">
<h4 style="color:#991b1b;margin-bottom:8px">⚠️ 重点：第三人称单数变化规则</h4>
<p>• 一般情况加 <b>-s</b>：play → plays, read → reads</p>
<p>• 以 s, x, ch, sh, o 结尾加 <b>-es</b>：go → goes, watch → watches, wash → washes</p>
<p>• 以辅音字母 + y 结尾，变 y 为 i 加 <b>-es</b>：study → studies, fly → flies</p>
<p>• 不规则：have → <b>has</b>, be → <b>is</b>, do → <b>does</b></p>
<p style="background:#fee2e2;padding:8px;border-radius:8px;margin:6px 0">❗ 只有主语是 <b>he / she / it / 单数名词</b> 时，动词才用三单形式！</p>
</div>

<div style="background:#f5f3ff;border-radius:12px;padding:16px;margin-bottom:16px">
<h4 style="color:#5b21b6;margin-bottom:8px">📋 否定句和疑问句</h4>
<p><b>一般现在时：</b></p>
<p>• 否定：主语 + don't / doesn't + 动词原形（注意：doesn't 后动词还原！）</p>
<p style="background:#ede9fe;padding:8px;border-radius:8px;margin:4px 0">例：She <b>doesn't like</b> coffee.（她不喜欢咖啡。）</p>
<p>• 疑问：Do / Does + 主语 + 动词原形？</p>
<p style="background:#ede9fe;padding:8px;border-radius:8px;margin:4px 0">例：<b>Does</b> he <b>play</b> basketball?（他打篮球吗？）</p>

<p style="margin-top:12px"><b>现在进行时：</b></p>
<p>• 否定：主语 + am/is/are + not + 动词-ing</p>
<p style="background:#ede9fe;padding:8px;border-radius:8px;margin:4px 0">例：They <b>are not sleeping</b> now.（他们现在没在睡觉。）</p>
<p>• 疑问：Am / Is / Are + 主语 + 动词-ing？</p>
<p style="background:#ede9fe;padding:8px;border-radius:8px;margin:4px 0">例：<b>Is</b> she <b>reading</b> a book?（她正在看书吗？）</p>
</div>

<p style="text-align:center;color:#6b7280;font-size:14px">🌟 复习好了吗？点击下面的按钮开始通关测试吧！</p>
</div>`, mc: [
      {q:"Look! The children ______ in the pool.",opts:["swim","swims","are swimming","swimming"],ans:2,exp:"Look! 提示现在进行时，结构为 be + doing。主语 The children 是复数，用 are swimming。"},
      {q:"My father ______ to work by car every day.",opts:["go","goes","is going","going"],ans:1,exp:"every day 是一般现在时标志词。主语 My father 是第三人称单数，动词用 goes。"},
      {q:"— What ______ you doing now? — I'm reading a book.",opts:["do","does","are","is"],ans:2,exp:"now 提示现在进行时，疑问句结构为 Be + 主语 + doing？主语 you 搭配 are。"},
      {q:"She usually ______ her homework after dinner.",opts:["do","does","is doing","doing"],ans:1,exp:"usually 是一般现在时标志词。主语 She 是第三人称单数，do 的三单形式是 does。"},
      {q:"Listen! Someone ______ at the door.",opts:["knock","knocks","is knocking","knocked"],ans:2,exp:"Listen! 提示现在进行时，表示此刻正在发生的动作。Someone 是单数，用 is knocking。"},
      {q:"Tom ______ like playing computer games.",opts:["don't","doesn't","isn't","aren't"],ans:1,exp:"一般现在时否定句，主语 Tom 是第三人称单数，用 doesn't + 动词原形。"},
      {q:"We ______ watching a movie at the moment.",opts:["is","are","do","does"],ans:1,exp:"at the moment 提示现在进行时。主语 We 搭配 are。"},
      {q:"The earth ______ around the sun.",opts:["move","moves","is moving","moved"],ans:1,exp:"客观事实用一般现在时。The earth 是第三人称单数，用 moves。"},
      {q:"— ______ your sister ______ English every morning? — Yes, she does.",opts:["Does; read","Is; reading","Do; read","Is; read"],ans:0,exp:"every morning 是一般现在时。主语 your sister 是三单，疑问句用 Does + 主语 + 动词原形。"},
      {q:"Be quiet! The baby ______.",opts:["sleep","sleeps","is sleeping","sleeping"],ans:2,exp:"Be quiet! 暗示此刻正在发生的事，用现在进行时。The baby 是单数，用 is sleeping。"},
      {q:"I ______ not interested in playing the piano.",opts:["do","does","am","is"],ans:2,exp:"be interested in 是固定搭配。主语 I 搭配 am。"},
      {q:"My mother ______ dinner in the kitchen now.",opts:["cook","cooks","is cooking","cooking"],ans:2,exp:"now 提示现在进行时。主语 My mother 是单数，用 is cooking。"},
      {q:"He ______ his teeth every morning and every night.",opts:["brush","brushes","is brushing","brushed"],ans:1,exp:"every morning and every night 是一般现在时标志。主语 He 是三单，brush 以 sh 结尾加 -es。"},
      {q:"______ they playing football on the playground today?",opts:["Do","Does","Are","Is"],ans:2,exp:"today 在此表示现阶段正在做的事，用现在进行时。主语 they 搭配 Are。"},
      {q:"Water ______ at 100 degrees Celsius.",opts:["boil","boils","is boiling","boiled"],ans:1,exp:"科学事实/客观真理用一般现在时。Water 是不可数名词（三单），用 boils。"}
    ], fill: [
      {q:"She ______ (go) to school by bus every day.",ans:"goes",exp:"every day 是一般现在时标志，主语 She 是三单，go 加 -es。"},
      {q:"Look! The cat ______ (sleep) on the sofa.",ans:"is sleeping",exp:"Look! 提示现在进行时，主语 The cat 是单数，用 is sleeping。"},
      {q:"My brother ______ (not like) vegetables.",ans:"doesn't like",exp:"一般现在时否定句，主语 My brother 是三单，用 doesn't + 动词原形。"},
      {q:"They ______ (play) basketball on the playground at the moment.",ans:"are playing",exp:"at the moment 提示现在进行时，主语 They 是复数，用 are playing。"},
      {q:"______ (do) your father watch TV in the evening?",ans:"Does",exp:"一般现在时疑问句，主语 your father 是三单，用 Does 开头。"},
      {q:"Listen! The birds ______ (sing) in the tree.",ans:"are singing",exp:"Listen! 提示现在进行时，主语 The birds 是复数，用 are singing。"},
      {q:"She ______ (study) English every morning.",ans:"studies",exp:"every morning 是一般现在时标志，主语 She 是三单，study 变 y 为 i 加 -es。"},
      {q:"I ______ (not do) my homework right now.",ans:"am not doing",exp:"right now 提示现在进行时，主语 I 搭配 am not doing。"},
      {q:"The sun ______ (rise) in the east every day.",ans:"rises",exp:"客观事实用一般现在时，主语 The sun 是三单，用 rises。"},
      {q:"______ (be) your mother cooking dinner now?",ans:"Is",exp:"now 提示现在进行时疑问句，主语 your mother 是单数，用 Is 开头。"}
    ], correct: [
      {wrong:"She go to school every day.",right:"She goes to school every day.",correctWord:"goes",exp:"主语 She 是第三人称单数，一般现在时动词要加 -es，go → goes。"},
      {wrong:"Look! They plays football on the playground.",right:"Look! They are playing football on the playground.",correctWord:"are playing",exp:"Look! 提示现在进行时，结构为 be + doing。They 搭配 are playing。"},
      {wrong:"He don't like eating carrots.",right:"He doesn't like eating carrots.",correctWord:"doesn't",exp:"一般现在时否定句，主语 He 是三单，用 doesn't，不能用 don't。"},
      {wrong:"My sister is watch TV at the moment.",right:"My sister is watching TV at the moment.",correctWord:"watching",exp:"at the moment 提示现在进行时，结构为 is + doing，watch → watching。"},
      {wrong:"Does she reading a book now?",right:"Is she reading a book now?",correctWord:"Is",exp:"now 提示现在进行时，疑问句用 Is/Are 开头，不是 Does。"}
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
  grammar: {
    "prepositional_phrases": { name: "介词短语(形容词+介词)", review: `
<div style="text-align:left;line-height:1.8">
<h3 style="text-align:center;color:#2563eb;margin-bottom:16px">📚 介词短语复习</h3>

<div style="background:#fefce8;border-radius:12px;padding:16px;margin-bottom:16px">
<h4 style="color:#854d0e;margin-bottom:8px">📐 核心句型结构</h4>
<div style="background:#fef9c3;padding:12px;border-radius:8px;text-align:center;font-size:18px;font-weight:bold;margin-bottom:12px">
主语 + be + 形容词 + 介词 + 名词
</div>
<p><b>例句：</b></p>
<p>• She <b>is</b> good <b>at</b> maths.（她擅长数学。）</p>
<p>• He <b>is</b> afraid <b>of</b> dogs.（他害怕狗。）</p>
<p>• I <b>am</b> interested <b>in</b> sport.（我对运动感兴趣。）</p>
<div style="background:#fee2e2;padding:12px;border-radius:8px;margin-top:12px">
<p style="font-weight:bold;color:#991b1b;margin:0">⚠️ 重要规则：介词后面只能接名词（或名词短语）</p>
<p style="margin:6px 0 0">✅ good at <b>maths</b>（名词）</p>
<p style="margin:4px 0 0">✅ good at <b>playing</b> games（动名词，本质是名词）</p>
<p style="margin:4px 0 0">❌ good at <b>play</b> games（动词原形，错误）</p>
</div>
</div>

<div style="background:#eff6ff;border-radius:12px;padding:16px;margin-bottom:16px">
<h4 style="color:#1e40af;margin-bottom:8px">📌 形容词 + 介词 固定搭配</h4>
<table style="width:100%;border-collapse:collapse;font-size:14px">
<tr style="background:#dbeafe"><th style="padding:8px;border:1px solid #93c5fd">搭配</th><th style="padding:8px;border:1px solid #93c5fd">中文意思</th><th style="padding:8px;border:1px solid #93c5fd">例句</th></tr>
<tr><td style="padding:6px;border:1px solid #e5e7eb"><b>afraid of</b> ...</td><td style="padding:6px;border:1px solid #e5e7eb">害怕...</td><td style="padding:6px;border:1px solid #e5e7eb">He's afraid <b>of</b> dogs.（他害怕狗。）</td></tr>
<tr style="background:#f9fafb"><td style="padding:6px;border:1px solid #e5e7eb"><b>angry with</b> somebody</td><td style="padding:6px;border:1px solid #e5e7eb">生某人的气</td><td style="padding:6px;border:1px solid #e5e7eb">Why are you angry <b>with</b> me?（你为什么生我的气？）</td></tr>
<tr><td style="padding:6px;border:1px solid #e5e7eb"><b>angry about</b> something</td><td style="padding:6px;border:1px solid #e5e7eb">对某事生气</td><td style="padding:6px;border:1px solid #e5e7eb">Are you angry <b>about</b> last night?（你对昨晚的事生气吗？）</td></tr>
<tr style="background:#f9fafb"><td style="padding:6px;border:1px solid #e5e7eb"><b>different from/to</b> ...</td><td style="padding:6px;border:1px solid #e5e7eb">与...不同</td><td style="padding:6px;border:1px solid #e5e7eb">Lisa is very different <b>from</b> her sister.（Lisa和她姐姐很不一样。）</td></tr>
<tr><td style="padding:6px;border:1px solid #e5e7eb"><b>fed up with</b> ...</td><td style="padding:6px;border:1px solid #e5e7eb">对...感到厌烦</td><td style="padding:6px;border:1px solid #e5e7eb">I'm fed up <b>with</b> my job.（我对我的工作厌烦了。）</td></tr>
<tr style="background:#f9fafb"><td style="padding:6px;border:1px solid #e5e7eb"><b>full of</b> ...</td><td style="padding:6px;border:1px solid #e5e7eb">充满...</td><td style="padding:6px;border:1px solid #e5e7eb">The room was full <b>of</b> people.（房间里挤满了人。）</td></tr>
<tr><td style="padding:6px;border:1px solid #e5e7eb"><b>good at</b> ...</td><td style="padding:6px;border:1px solid #e5e7eb">擅长...</td><td style="padding:6px;border:1px solid #e5e7eb">Are you good <b>at</b> maths?（你擅长数学吗？）</td></tr>
<tr style="background:#f9fafb"><td style="padding:6px;border:1px solid #e5e7eb"><b>interested in</b> ...</td><td style="padding:6px;border:1px solid #e5e7eb">对...感兴趣</td><td style="padding:6px;border:1px solid #e5e7eb">I'm not interested <b>in</b> sport.（我对运动不感兴趣。）</td></tr>
<tr><td style="padding:6px;border:1px solid #e5e7eb"><b>married to</b> ...</td><td style="padding:6px;border:1px solid #e5e7eb">和...结婚</td><td style="padding:6px;border:1px solid #e5e7eb">Sue is married <b>to</b> a dentist.（Sue嫁给了一位牙医。）</td></tr>
<tr style="background:#f9fafb"><td style="padding:6px;border:1px solid #e5e7eb"><b>nice/kind of</b> sb <b>to</b> ...</td><td style="padding:6px;border:1px solid #e5e7eb">某人真好，做了...</td><td style="padding:6px;border:1px solid #e5e7eb">It was kind <b>of</b> you <b>to</b> help us.（你真好，帮助了我们。）</td></tr>
<tr><td style="padding:6px;border:1px solid #e5e7eb"><b>be nice/kind to</b> somebody</td><td style="padding:6px;border:1px solid #e5e7eb">对某人友好</td><td style="padding:6px;border:1px solid #e5e7eb">He's always very nice <b>to</b> me.（他总是对我很好。）</td></tr>
<tr style="background:#f9fafb"><td style="padding:6px;border:1px solid #e5e7eb"><b>sorry about</b> a situation</td><td style="padding:6px;border:1px solid #e5e7eb">对某情况感到抱歉</td><td style="padding:6px;border:1px solid #e5e7eb">I'm sorry <b>about</b> that.（对此我很抱歉。）</td></tr>
<tr><td style="padding:6px;border:1px solid #e5e7eb"><b>sorry for/about</b> doing</td><td style="padding:6px;border:1px solid #e5e7eb">为做了某事道歉</td><td style="padding:6px;border:1px solid #e5e7eb">I'm sorry <b>for</b> not phoning you.（我很抱歉没给你打电话。）</td></tr>
<tr style="background:#f9fafb"><td style="padding:6px;border:1px solid #e5e7eb"><b>be/feel sorry for</b> sb</td><td style="padding:6px;border:1px solid #e5e7eb">为某人感到难过/同情</td><td style="padding:6px;border:1px solid #e5e7eb">I feel sorry <b>for</b> them.（我为他们感到难过。）</td></tr>
</table>
</div>

<div style="background:#f0fdf4;border-radius:12px;padding:16px;margin-bottom:16px">
<h4 style="color:#166534;margin-bottom:8px">📌 介词 + -ing 形式</h4>
<p>介词（of/at/for 等）后面的动词要用 <b>-ing</b> 形式：</p>
<p style="background:#dcfce7;padding:8px;border-radius:8px;margin:6px 0">I'm not very good <b>at telling</b> stories.</p>
<p style="background:#dcfce7;padding:8px;border-radius:8px;margin:6px 0">Are you fed up <b>with doing</b> the same thing every day?</p>
<p style="background:#dcfce7;padding:8px;border-radius:8px;margin:6px 0">I'm sorry <b>for not phoning</b> you yesterday.</p>
<p style="background:#dcfce7;padding:8px;border-radius:8px;margin:6px 0">Thank you <b>for helping</b> me.</p>
<p style="background:#dcfce7;padding:8px;border-radius:8px;margin:6px 0">Tom left <b>without saying</b> goodbye.</p>
</div>

<div style="background:#fefce8;border-radius:12px;padding:16px;margin-bottom:16px">
<h4 style="color:#854d0e;margin-bottom:8px">🌟 核心口诀</h4>
<p><b>1. 形容词 + 介词 = 固定搭配，不能随便换</b></p>
<p>• afraid <b>of</b>（怕...）≠ afraid <b>with</b> ❌</p>
<p>• good <b>at</b>（擅长）≠ good <b>in</b> ❌</p>
<p>• interested <b>in</b>（对...感兴趣）≠ interested <b>at</b> ❌</p>

<p style="margin-top:12px"><b>2. 介词后面跟动词 → 必须加 -ing</b></p>
<p>• good at <b>telling</b> ✅ / good at <b>tell</b> ❌</p>
<p>• sorry for <b>not phoning</b> ✅ / sorry for <b>not phone</b> ❌</p>

<p style="margin-top:12px"><b>3. 易混淆搭配</b></p>
<p>• angry <b>with</b> 人 / angry <b>about</b> 事</p>
<p>• sorry <b>about</b> 情况 / sorry <b>for</b> 做了某事 / sorry <b>for</b> 某人</p>
<p>• kind <b>of</b> you <b>to</b> do（你真好，做了...）/ kind <b>to</b> somebody（对某人友好）</p>
</div>

<p style="text-align:center;color:#6b7280;font-size:14px">复习好了吗？点击下面的按钮开始通关测试吧！</p>
</div>`, mc: [
      {q:"She's very good ______ languages.",opts:["in","at","on","for"],ans:1,exp:"good at 是固定搭配，表示'擅长'。"},
      {q:"I'm not interested ______ sport.",opts:["at","on","in","for"],ans:2,exp:"interested in 是固定搭配，表示'对...感兴趣'。"},
      {q:"He's afraid ______ dogs.",opts:["with","about","in","of"],ans:3,exp:"afraid of 是固定搭配，表示'害怕...'。"},
      {q:"Sue is married ______ a dentist.",opts:["with","to","for","at"],ans:1,exp:"married to 是固定搭配，表示'和...结婚'。"},
      {q:"I'm fed up ______ my job.",opts:["of","about","with","for"],ans:2,exp:"fed up with 是固定搭配，表示'对...感到厌烦'。"},
      {q:"The room was full ______ people.",opts:["with","of","in","by"],ans:1,exp:"full of 是固定搭配，表示'充满...'。"},
      {q:"Lisa is very different ______ her sister.",opts:["to","with","at","from"],ans:3,exp:"different from 是固定搭配，表示'与...不同'。"},
      {q:"It was kind ______ you to help us.",opts:["to","for","of","with"],ans:2,exp:"It was kind of you to... 是固定句型，表示'你真好，做了...'。"},
      {q:"He's always very nice ______ me.",opts:["of","for","about","to"],ans:3,exp:"be nice to somebody 是固定搭配，表示'对某人友好'。"},
      {q:"I feel sorry ______ them. They are in a difficult situation.",opts:["about","for","of","with"],ans:1,exp:"feel sorry for somebody 表示'为某人感到难过/同情'。"},
      {q:"I'm sorry ______ not phoning you yesterday.",opts:["about","of","with","for"],ans:3,exp:"sorry for doing something 表示'为做了某事道歉'。"},
      {q:"Why are you angry ______ me? What have I done?",opts:["about","for","with","of"],ans:2,exp:"angry with somebody 表示'生某人的气'。"},
      {q:"Are you angry ______ last night?",opts:["with","for","about","of"],ans:2,exp:"angry about something 表示'对某事生气'。"},
      {q:"I'm sorry ______ that. I can't help you.",opts:["for","about","with","of"],ans:1,exp:"sorry about a situation 表示'对某个情况感到抱歉'。"},
      {q:"I'm not very good ______ stories.",opts:["in","for","at","on"],ans:2,exp:"good at 是固定搭配。后面跟动词要用 -ing 形式：good at telling stories。"},
      {q:"Thank you ______ helping me.",opts:["of","for","about","with"],ans:1,exp:"Thank you for doing something 是固定搭配，表示'谢谢你做了...'。"},
      {q:"Tom left without ______ goodbye.",opts:["say","says","saying","said"],ans:2,exp:"without 是介词，后面跟动词要用 -ing 形式。"},
      {q:"Are you fed up with ______ the same thing every day?",opts:["do","does","doing","did"],ans:2,exp:"with 是介词，后面跟动词要用 -ing 形式。"},
      {q:"Mark is thinking of ______ a new car.",opts:["buy","buys","buying","bought"],ans:2,exp:"of 是介词，后面跟动词要用 -ing 形式。"},
      {q:"She's interested ______ in the cinema.",opts:["go","goes","going","went"],ans:2,exp:"interested in 后面跟动词要用 -ing 形式。"}
    ], fill: [
      {q:"He's afraid ___ dogs.",ans:"of",exp:"afraid of 是固定搭配。"},
      {q:"She's very good ___ maths.",ans:"at",exp:"good at 是固定搭配。"},
      {q:"I'm not interested ___ sport.",ans:"in",exp:"interested in 是固定搭配。"},
      {q:"Sue is married ___ a dentist.",ans:"to",exp:"married to 是固定搭配。"},
      {q:"I'm fed up ___ my job.",ans:"with",exp:"fed up with 是固定搭配。"}
    ], correct: [
      {wrong:"He's afraid with dogs.",right:"He's afraid of dogs.",correctWord:"of",exp:"afraid 后面跟 of，不是 with。"},
      {wrong:"She's very good in languages.",right:"She's very good at languages.",correctWord:"at",exp:"good 后面跟 at，不是 in。"},
      {wrong:"I'm not interested at sport.",right:"I'm not interested in sport.",correctWord:"in",exp:"interested 后面跟 in，不是 at。"},
      {wrong:"Tom left without say goodbye.",right:"Tom left without saying goodbye.",correctWord:"saying",exp:"without 是介词，后面跟动词要用 -ing 形式。"},
      {wrong:"I'm sorry for not phone you.",right:"I'm sorry for not phoning you.",correctWord:"phoning",exp:"for 是介词，后面跟动词要用 -ing 形式。"}
    ]}
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
  },
  reading: {
    "icarus_myth": {
      name: " 伊卡洛斯的神话",
      text: `One morning on the island of Crete, Icarus and his father Daedalus were in their workshop. Daedalus was an inventor. Suddenly, King Minos arrived and he spoke to Daedalus. 'I'd like you to build me a labyrinth,' he said. 'I want to put that Minotaur inside it.' The Minotaur was a terrible monster. He had the head of a bull and the body of a man.

King Minos was pleased when he saw Daedalus's work. He put the Minotaur inside the labyrinth. Then he locked Daedalus and Icarus inside a tower. 'What are you doing?' said Daedalus. 'Well,' said the King, 'you know the secret of how to get out of the labyrinth. And I don't want anyone else to know it.'

Daedalus and his son felt sad. Days passed, then Daedalus had an idea. He collected feathers from the birds that flew to the window of the tower. Then he made wings with the feathers. He used wax from a candle to stick the feathers together.

Daedalus told Icarus what to do. 'Follow me. Don't go too high because the sun will melt the wax in your wings. Don't go too low because the sea will make the feathers in your wings wet. Are you ready? Go!' Daedalus and Icarus jumped out of the window. They flew away from the island, and away from King Minos.

Daedalus flew in front, Icarus followed behind. Icarus loved flying. He was just like a bird! He forgot his father's words and he flew higher and higher. But as he got nearer to the sun, the wax between the feathers began to melt.

When Daedalus looked behind him, he couldn't see his son. 'Icarus!' he shouted. 'Icarus! Where are you?' Daedalus looked down. There were feathers in the sea. Daedalus went to the nearest island. He sat and looked at the sea for a long time, and he felt sad for his son. That island is now called Icaria, and the sea around it is called the Icarian Sea.`,
      vocabulary: [
        {word:"inventor",pos:"n.",meaning:"发明家"},
        {word:"labyrinth",pos:"n.",meaning:"迷宫"},
        {word:"monster",pos:"n.",meaning:"怪物"},
        {word:"secret",pos:"n.",meaning:"秘密"},
        {word:"feather",pos:"n.",meaning:"羽毛"},
        {word:"wax",pos:"n.",meaning:"蜡"},
        {word:"melt",pos:"v.",meaning:"融化"},
        {word:"collect",pos:"v.",meaning:"收集"}
      ],
      sentenceAnalysis: [
        {sentence:"One morning on the island of Crete, Icarus and his father Daedalus were in their workshop.",words:["One","morning","on","the","island","of","Crete",",","Icarus","and","his","father","Daedalus","were","in","their","workshop","."],roles:[3,3,3,3,3,3,3,-1,0,0,0,0,0,1,2,2,2,-1],translation:"一天早上，在克里特岛上，伊卡洛斯和他的父亲代达罗斯在他们的工作室里。",exp:"时间状语：One morning（一天早上）· 地点状语：on the island of Crete（在克里特岛上）· 主语：Icarus and his father Daedalus（伊卡洛斯和他的父亲代达罗斯）· 系动词：were（在）· 表语：in their workshop（在他们的工作室里）"},
        {sentence:"The Minotaur was a terrible monster.",words:["The","Minotaur","was","a","terrible","monster","."],roles:[0,0,1,2,2,2,-1],translation:"米诺陶是一个可怕的怪物。",exp:"主语：The Minotaur（米诺陶）· 系动词：was（是）· 表语：a terrible monster（一个可怕的怪物）"},
        {sentence:"King Minos was pleased when he saw Daedalus's work.",words:["King","Minos","was","pleased","when","he","saw","Daedalus's","work","."],roles:[0,0,1,2,3,3,3,3,3,-1],translation:"当米诺斯国王看到代达罗斯的作品时，他很高兴。",exp:"主语：King Minos（米诺斯国王）· 系动词：was（是）· 表语：pleased（高兴的）· 时间状语从句：when he saw Daedalus's work（当他看到代达罗斯的作品时）"},
        {sentence:"Then he locked Daedalus and Icarus inside a tower.",words:["Then","he","locked","Daedalus","and","Icarus","inside","a","tower","."],roles:[3,0,1,2,2,2,3,3,3,-1],translation:"然后他把代达罗斯和伊卡洛斯锁在塔里。",exp:"状语：Then（然后）· 主语：he（他）· 谓语：locked（锁）· 宾语：Daedalus and Icarus（代达罗斯和伊卡洛斯）· 地点状语：inside a tower（在塔里）"},
        {sentence:"He collected feathers from the birds that flew to the window of the tower.",words:["He","collected","feathers","from","the","birds","that","flew","to","the","window","of","the","tower","."],roles:[0,1,2,3,3,3,3,3,3,3,3,3,3,3,-1],translation:"他收集了飞到塔窗口的鸟的羽毛。",exp:"主语：He（他）· 谓语：collected（收集）· 宾语：feathers（羽毛）· 状语：from the birds that flew to the window of the tower（从飞到塔窗口的鸟身上）"},
        {sentence:"He used wax from a candle to stick the feathers together.",words:["He","used","wax","from","a","candle","to","stick","the","feathers","together","."],roles:[0,1,2,3,3,3,3,3,3,3,3,-1],translation:"他用蜡烛的蜡把羽毛粘在一起。",exp:"主语：He（他）· 谓语：used（使用）· 宾语：wax（蜡）· 状语：from a candle（从蜡烛上）· 目的状语：to stick the feathers together（把羽毛粘在一起）"},
        {sentence:"Don't go too high because the sun will melt the wax in your wings.",words:["Don't","go","too","high","because","the","sun","will","melt","the","wax","in","your","wings","."],roles:[3,1,3,3,3,3,3,3,3,3,3,3,3,3,-1],translation:"不要飞得太高，因为太阳会融化你翅膀上的蜡。",exp:"否定祈使句：Don't go too high（不要飞得太高）· 原因状语从句：because the sun will melt the wax in your wings（因为太阳会融化你翅膀上的蜡）"},
        {sentence:"Don't go too low because the sea will make the feathers in your wings wet.",words:["Don't","go","too","low","because","the","sea","will","make","the","feathers","in","your","wings","wet","."],roles:[3,1,3,3,3,3,3,3,3,3,3,3,3,3,3,-1],translation:"不要飞得太低，因为海水会弄湿你翅膀上的羽毛。",exp:"否定祈使句：Don't go too low（不要飞得太低）· 原因状语从句：because the sea will make the feathers in your wings wet（因为海水会弄湿你翅膀上的羽毛）"},
        {sentence:"But as he got nearer to the sun, the wax between the feathers began to melt.",words:["But","as","he","got","nearer","to","the","sun",",","the","wax","between","the","feathers","began","to","melt","."],roles:[3,3,3,3,3,3,3,3,-1,0,0,0,0,0,1,2,2,-1],translation:"但是当他离太阳越来越近时，羽毛之间的蜡开始融化。",exp:"转折连词+时间状语从句：But as he got nearer to the sun（但是当他离太阳越来越近时）· 主语：the wax between the feathers（羽毛之间的蜡）· 谓语：began to melt（开始融化）"},
        {sentence:"He sat and looked at the sea for a long time, and he felt sad for his son.",words:["He","sat","and","looked","at","the","sea","for","a","long","time",",","and","he","felt","sad","for","his","son","."],roles:[0,1,1,1,1,1,1,3,3,3,3,-1,3,0,1,2,3,3,3,-1],translation:"他坐着看了大海很久，他为他的儿子感到悲伤。",exp:"主语：He（他）· 谓语：sat and looked at the sea（坐着看大海）· 状语：for a long time（很久）· 并列句：and he felt sad for his son（他为他的儿子感到悲伤）"}
      ],
      mc: [
        {q:"Why did King Minos lock Daedalus and Icarus in the tower?",opts:["A. Because they were bad people.","B. Because Daedalus knew the secret of the labyrinth.","C. Because the King wanted to punish them.","D. Because the tower was their home."],ans:1,exp:"国王说：'你知道如何走出迷宫的秘密，我不想让其他人知道。'所以他把他们锁在塔里。"},
        {q:"What did Daedalus use to make the wings?",opts:["A. Paper and glue.","B. Wood and nails.","C. Feathers and wax.","D. Cloth and thread."],ans:2,exp:"文中提到：'He collected feathers from the birds... He used wax from a candle to stick the feathers together.'他用羽毛和蜡制作了翅膀。"},
        {q:"What did Daedalus warn Icarus NOT to do?",opts:["A. Not to fly too fast or too slow.","B. Not to fly too high or too low.","C. Not to fly during the night.","D. Not to fly over the sea."],ans:1,exp:"代达罗斯警告儿子：'Don't go too high because the sun will melt the wax... Don't go too low because the sea will make the feathers wet.'不要飞得太高或太低。"},
        {q:"What happened to Icarus in the end?",opts:["A. He flew safely to another island.","B. He landed on the nearest island.","C. The wax melted and he fell into the sea.","D. He flew back to the tower."],ans:2,exp:"文中描述：'as he got nearer to the sun, the wax between the feathers began to melt.'蜡融化后他坠入海中。"}
      ]
    },
    "don_quixote": {
      name: " 堂吉诃德大战风车",
      intro: `<div style="margin-bottom:12px"><strong>📚 作品信息</strong><br>作者：塞万提斯（Miguel de Cervantes）｜西班牙｜1605年｜世界文学名著</div><div style="margin-bottom:8px"><strong>👤 主要人物</strong><br>• <strong>堂吉诃德</strong>（Don Quixote）—— 沉迷骑士小说的乡绅，幻想自己是骑士<br>• <strong>桑丘</strong>（Sancho Panza）—— 堂吉诃德的忠实仆人<br>• <strong>罗西南特</strong>（Rocinante）—— 堂吉诃德的瘦马</div><div><strong>📖 故事简介</strong><br>一位西班牙乡绅沉迷骑士小说，幻想自己成为骑士，穿上盔甲、骑着瘦马，带着仆人踏上冒险之旅。他最著名的'冒险'就是把风车当成巨人去战斗，闹出许多令人啼笑皆非的故事。</div>`,
      text: `Narrator: A long time ago in Spain in a land called La Mancha, there was a quiet village with a large house. The man who lived in the house was called Alonso Quijano. Alonso read books all day about brave knights. He read so much that sometimes he forgot to eat or sleep. He dreamed about saving women in danger and fighting dragons. One day he decided to become a knight and he changed his name to Don Quixote. He put on his grandfather's armour and he rode his horse Rocinante. He asked his good friend Sancho Panza to join him and he promised to pay him lots of money in return. This story is about one of their fantastic adventures ...

Quixote: Look, Sancho! Our next great adventure. Can you see them?
Sancho: What?
Quixote: Thirty or forty giants over there.
Sancho: What giants?
Quixote: Over there! Look how long their arms are. They're moving in all directions.
Sancho: Dear friend. You think they look like giants but they're windmills and the arms you can see are their sails blowing in the wind.

Quixote: Be quiet, Sancho! And prepare my horse for me! If you are afraid, you can stay here.
Sancho: No, I'm not afraid. What I mean is ...
Quixote: Let's go, Rocinante.

[Don Quixote and his horse ride quickly towards the windmills.]

Quixote: Don't run, unkind giants!

[The windmill catches Don Quixote and Rocinante and then throws them down.]

Sancho: Friend! Are you alright? I told you that ...
Quixote: Be quiet, Sancho! Someone changed the giants into windmills. It's magic!
Sancho: Yes, yes, my friend. Let me help you.

Narrator: And they continued on their journey to find their next adventure.`,
      vocabulary: [
        {word:"windmill",pos:"n.",meaning:"风车"},
        {word:"in danger",pos:"phrase",meaning:"处于危险中"},
        {word:"knight",pos:"n.",meaning:"骑士"},
        {word:"armour",pos:"n.",meaning:"盔甲"},
        {word:"promise",pos:"v.",meaning:"承诺；答应"},
        {word:"in return",pos:"phrase",meaning:"作为回报"},
        {word:"adventure",pos:"n.",meaning:"冒险；奇遇"},
        {word:"giant",pos:"n.",meaning:"巨人"}
      ],
      sentenceAnalysis: [
        {sentence:"A long time ago in Spain in a land called La Mancha, there was a quiet village with a large house.",words:["A","long","time","ago","in","Spain","in","a","land","called","La","Mancha",",","there","was","a","quiet","village","with","a","large","house","."],roles:[3,3,3,3,3,3,3,3,3,3,3,3,-1,0,1,2,2,2,3,3,3,3,-1],translation:"很久以前，在西班牙一个叫拉曼查的地方，有一个安静的小村庄，村里有一座大房子。",exp:"时间状语：A long time ago（很久以前）· 地点状语：in Spain in a land called La Mancha（在西班牙一个叫拉曼查的地方）· 主语：there（引导词）· 谓语：was（有）· 表语：a quiet village with a large house（一个有座大房子的安静村庄）"},
        {sentence:"The man who lived in the house was called Alonso Quijano.",words:["The","man","who","lived","in","the","house","was","called","Alonso","Quijano","."],roles:[0,0,0,0,0,0,0,1,1,2,2,-1],translation:"住在那座房子里的人叫阿隆索·吉哈诺。",exp:"主语：The man（那个人）· 定语从句：who lived in the house（住在那座房子里的）· 谓语：was called（被称为）· 表语：Alonso Quijano（阿隆索·吉哈诺）"},
        {sentence:"He read so much that sometimes he forgot to eat or sleep.",words:["He","read","so","much","that","sometimes","he","forgot","to","eat","or","sleep","."],roles:[0,1,3,3,3,3,0,1,2,2,2,2,-1],translation:"他读书读得太多，以至于有时候他忘了吃饭和睡觉。",exp:"主语：He（他）· 谓语：read（读）· 程度状语：so much（如此多）· 结果状语从句：that sometimes he forgot to eat or sleep（以至于有时候他忘了吃饭或睡觉）"},
        {sentence:"You think they look like giants but they're windmills and the arms you can see are their sails blowing in the wind.",words:["You","think","they","look","like","giants","but","they","'re","windmills","and","the","arms","you","can","see","are","their","sails","blowing","in","the","wind","."],roles:[0,1,2,2,2,2,3,0,1,2,3,0,0,0,0,0,1,2,2,2,3,3,3,-1],translation:"你以为它们看起来像巨人，但它们是风车，你能看到的那些'手臂'其实是它们在风中吹动的帆。",exp:"第一分句：You think they look like giants（你以为它们看起来像巨人）· 转折：but（但是）· 第二分句：they're windmills（它们是风车）· 并列：and（而且）· 第三分句：the arms you can see are their sails blowing in the wind（你能看到的那些手臂是它们在风中吹动的帆）"},
        {sentence:"If you are afraid, you can stay here.",words:["If","you","are","afraid",",","you","can","stay","here","."],roles:[3,3,3,3,-1,0,1,1,3,-1],translation:"如果你害怕的话，你可以留在这里。",exp:"条件状语从句：If you are afraid（如果你害怕）· 主语：you（你）· 谓语：can stay（可以留下）· 地点状语：here（在这里）"}
      ],
      mc: [
        {q:"Why did Alonso Quijano change his name to Don Quixote?",opts:["A. Because he wanted to be rich.","B. Because he decided to become a knight.","C. Because his friend told him to.","D. Because he didn't like his old name."],ans:1,exp:"文中提到：'One day he decided to become a knight and he changed his name to Don Quixote.'他决定成为一名骑士，所以改了名字。"},
        {q:"What did Don Quixote think the windmills were?",opts:["A. Houses","B. Trees","C. Giants","D. Dragons"],ans:2,exp:"堂吉诃德说：'Thirty or forty giants over there.'他把风车当成了巨人。"},
        {q:"What did Sancho try to tell Don Quixote?",opts:["A. The giants were very dangerous.","B. They were windmills, not giants.","C. He should go home.","D. The horse was tired."],ans:1,exp:"桑丘说：'You think they look like giants but they're windmills.'他试图告诉堂吉德那是风车不是巨人。"},
        {q:"After the windmill threw Don Quixote down, what did he believe happened?",opts:["A. He was very tired and needed to rest.","B. Sancho was right all along.","C. Someone used magic to change the giants into windmills.","D. He wanted to give up his adventure."],ans:2,exp:"堂吉诃德说：'Someone changed the giants into windmills. It's magic!'他认为是有人用魔法把巨人变成了风车。"}
      ]
    }
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

// 后台异步检查推送配置更新（不阻塞页面加载）
async function checkPushConfigUpdate(studentName) {
  try {
    const { data } = await sb.from('push_configs').select('push_config').eq('student_name', studentName).single();
    if (data && data.push_config) {
      const currentJson = JSON.stringify(_cachedPushConfig);
      const newJson = JSON.stringify(data.push_config);
      if (currentJson !== newJson) {
        _cachedPushConfig = data.push_config;
        localStorage.setItem('push_config_' + studentName, JSON.stringify(data.push_config));
        console.log('推送配置已更新');
      }
    }
  } catch(e) {}
}

// 获取当前学生应该看到的内容（根据教师推送配置）
async function getContent() {
  // 如果有学生登录，检查是否有推送配置
  if (currentUser && currentUser.type === 'student') {
    const studentName = currentUser.name;
    
    // 优先使用内存缓存或 localStorage 缓存（快速返回，避免等待网络）
    if (_cachedPushStudent === studentName && _cachedPushConfig !== undefined) {
      if (_cachedPushConfig) {
        // 后台异步检查更新（不阻塞）
        checkPushConfigUpdate(studentName);
        return getContentFromPush(_cachedPushConfig);
      }
    } else {
      const cached = localStorage.getItem('push_config_' + studentName);
      if (cached) {
        try {
          _cachedPushConfig = JSON.parse(cached);
          _cachedPushStudent = studentName;
          // 后台异步检查更新
          checkPushConfigUpdate(studentName);
          return getContentFromPush(_cachedPushConfig);
        } catch(e) {
          // 缓存损坏，继续
        }
      }
    }
    
    // 无缓存时才等待 Supabase 查询
    try {
      const { data } = await sb.from('push_configs').select('push_config').eq('student_name', studentName).single();
      if (data && data.push_config) {
        _cachedPushConfig = data.push_config;
        _cachedPushStudent = studentName;
        localStorage.setItem('push_config_' + studentName, JSON.stringify(data.push_config));
        return getContentFromPush(data.push_config);
      }
    } catch(e) {
      // 查询失败
    }
    
    _cachedPushConfig = null;
    _cachedPushStudent = studentName;
  }
  // 默认内容（无推送时使用）
  const grammarModuleKeys = currentUser && STUDENT_GRADES[currentUser.name] === 'high'
    ? ['pronoun_basic', 'present_simple_continuous', 'prepositional_phrases']
    : ['pronoun_basic', 'present_simple_continuous', 'prepositional_phrases'];
  const grammarModules = grammarModuleKeys.map(k => ({key: k, name: MODULE_LIBRARY.grammar[k]?.name || k, icon: k === 'pronoun_basic' ? '👤' : '⏰'}));
  const grammarModuleData = {};
  grammarModuleKeys.forEach(k => {
    const mod = MODULE_LIBRARY.grammar[k];
    if (mod) grammarModuleData[k] = {review: mod.review || '', mc: mod.mc || [], fill: mod.fill || [], correct: mod.correct || []};
  });

  const readingModuleKeys = ['icarus_myth', 'don_quixote'];
  const readingModules = readingModuleKeys.map(k => ({key: k, name: MODULE_LIBRARY.reading[k]?.name || k}));
  const readingModuleData = {};
  readingModuleKeys.forEach(k => {
    const mod = MODULE_LIBRARY.reading[k];
    if (mod) readingModuleData[k] = {intro: mod.intro || '', text: mod.text || '', vocabulary: mod.vocabulary || [], sentenceAnalysis: mod.sentenceAnalysis || [], mc: mod.mc || []};
  });

  return {
    vocabulary: await getDefaultVocabularyWords(),
    grammarModules,
    grammarModuleData,
    readingModules,
    readingModuleData,
    grammarMC: getDefaultGrammarMC(),
    grammarFill: contentData.grammarFill,
    grammarCorrect: getDefaultGrammarCorrect(),
    grammarReview: getDefaultGrammarReview(),
    sentenceAnalysis: getDefaultSentenceAnalysis(),
    irregularVerbs: currentUser && STUDENT_GRADES[currentUser.name] === 'high' ? contentData.irregularVerbs : contentData.irregularVerbsLow
  };
}

// 根据推送配置获取内容
function getContentFromPush(pushConfig) {
  let words = [];
  let grammarMC = [];
  let grammarCorrect = [];
  let grammarReview = '';
  let sentenceAnalysis = [];

  let grammarModuleKeys = pushConfig ? (pushConfig.grammar ? [...pushConfig.grammar] : []) : [];
  // 自动补充介词短语模块（确保所有学生都能看到）
  if (!grammarModuleKeys.includes('prepositional_phrases')) {
    grammarModuleKeys.push('prepositional_phrases');
  }
  const grammarModules = grammarModuleKeys.map(k => ({key: k, name: MODULE_LIBRARY.grammar[k]?.name || k, icon: k === 'pronoun_basic' ? '👤' : '⏰'}));
  const grammarModuleData = {};
  grammarModuleKeys.forEach(k => {
    const mod = MODULE_LIBRARY.grammar[k];
    if (mod) grammarModuleData[k] = {review: mod.review || '', mc: mod.mc || [], fill: mod.fill || [], correct: mod.correct || []};
  });

  if (pushConfig) {
    const vocabModules = pushConfig.vocabulary || [];
    words = getWordsFromVocabularyKeysWithDaily(vocabModules);
    grammarModuleKeys.forEach(modKey => {
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

  let readingModuleKeys = pushConfig && pushConfig.reading && pushConfig.reading.length > 0 ? [...pushConfig.reading] : ['icarus_myth', 'don_quixote'];
  // 自动补充堂吉诃德阅读模块（确保所有学生都能看到）
  if (!readingModuleKeys.includes('don_quixote')) {
    readingModuleKeys.push('don_quixote');
  }
  const readingModules = readingModuleKeys.map(k => ({key: k, name: MODULE_LIBRARY.reading[k]?.name || k}));
  const readingModuleData = {};
  readingModuleKeys.forEach(k => {
    const mod = MODULE_LIBRARY.reading[k];
    if (mod) readingModuleData[k] = {intro: mod.intro || '', text: mod.text || '', vocabulary: mod.vocabulary || [], sentenceAnalysis: mod.sentenceAnalysis || [], mc: mod.mc || []};
  });

  return {
    vocabulary: dedupeWords(words),
    grammarModules,
    grammarModuleData,
    readingModules,
    readingModuleData,
    grammarMC,
    grammarFill: contentData.grammarFill,
    grammarCorrect,
    grammarReview,
    sentenceAnalysis,
    irregularVerbs: currentUser && STUDENT_GRADES[currentUser.name] === 'high' ? contentData.irregularVerbs : contentData.irregularVerbsLow
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
  sentenceAnalysis: [],
  irregularVerbs: [
    {word:'cost',meaning:'花费',past:'cost',pp:'cost'},
    {word:'cut',meaning:'切；割',past:'cut',pp:'cut'},
    {word:'hit',meaning:'击打',past:'hit',pp:'hit'},
    {word:'hurt',meaning:'使受伤；伤害',past:'hurt',pp:'hurt'},
    {word:'let',meaning:'让；允许',past:'let',pp:'let'},
    {word:'put',meaning:'放；安置',past:'put',pp:'put'},
    {word:'read',meaning:'阅读',past:'read /red/',pp:'read /red/'},
    {word:'be',meaning:'是',past:'was/were',pp:'been'},
    {word:'become',meaning:'变成；成为',past:'became',pp:'become'},
    {word:'begin',meaning:'开始',past:'began',pp:'begun'},
    {word:'bite',meaning:'咬',past:'bit',pp:'bitten'},
    {word:'break',meaning:'打破；弄坏',past:'broke',pp:'broken'},
    {word:'bring',meaning:'带来；拿来',past:'brought',pp:'brought'},
    {word:'build',meaning:'建造；建筑',past:'built',pp:'built'},
    {word:'burn',meaning:'燃烧；烧毁',past:'burnt/burned',pp:'burnt/burned'},
    {word:'pay',meaning:'支付；付钱',past:'paid',pp:'paid'},
    {word:'ride',meaning:'骑（马、自行车等）',past:'rode',pp:'ridden'},
    {word:'ring',meaning:'（铃、电话等）响',past:'rang',pp:'rung'},
    {word:'run',meaning:'跑；奔跑',past:'ran',pp:'run'},
    {word:'say',meaning:'说；讲',past:'said',pp:'said'},
    {word:'see',meaning:'看见',past:'saw',pp:'seen'},
    {word:'sell',meaning:'卖；销售',past:'sold',pp:'sold'},
    {word:'send',meaning:'发送；寄',past:'sent',pp:'sent'},
    {word:'buy',meaning:'买；购买',past:'bought',pp:'bought'},
    {word:'catch',meaning:'抓住；接住',past:'caught',pp:'caught'},
    {word:'come',meaning:'来；来到',past:'came',pp:'come'},
    {word:'do',meaning:'做；干',past:'did',pp:'done'},
    {word:'dig',meaning:'挖；掘',past:'dug',pp:'dug'},
    {word:'draw',meaning:'画',past:'drew',pp:'drawn'},
    {word:'dream',meaning:'做梦；梦见',past:'dreamt/dreamed',pp:'dreamt/dreamed'},
    {word:'drink',meaning:'喝；饮',past:'drank',pp:'drunk'},
    {word:'drive',meaning:'驾驶；开车',past:'drove',pp:'driven'},
    {word:'eat',meaning:'吃',past:'ate',pp:'eaten'},
    {word:'fall',meaning:'落下；跌倒',past:'fell',pp:'fallen'},
    {word:'feel',meaning:'感觉；觉得',past:'felt',pp:'felt'},
    {word:'find',meaning:'找到；发现',past:'found',pp:'found'},
    {word:'forget',meaning:'忘记；遗忘',past:'forgot',pp:'forgotten'},
    {word:'get',meaning:'得到；获得',past:'got',pp:'got/gotten'},
    {word:'give',meaning:'给；给予',past:'gave',pp:'given'},
    {word:'go',meaning:'去；走',past:'went',pp:'gone'},
    {word:'grow',meaning:'生长；种植',past:'grew',pp:'grown'},
    {word:'have',meaning:'有；吃；喝',past:'had',pp:'had'},
    {word:'hear',meaning:'听见；听到',past:'heard',pp:'heard'},
    {word:'hide',meaning:'隐藏；躲藏',past:'hid',pp:'hidden'},
    {word:'hold',meaning:'拿着；握住',past:'held',pp:'held'},
    {word:'keep',meaning:'保持；保留',past:'kept',pp:'kept'},
    {word:'know',meaning:'知道；了解',past:'knew',pp:'known'},
    {word:'leave',meaning:'离开；留下',past:'left',pp:'left'},
    {word:'lend',meaning:'借出；借给',past:'lent',pp:'lent'},
    {word:'lose',meaning:'丢失；失去',past:'lost',pp:'lost'},
    {word:'make',meaning:'制作；制造',past:'made',pp:'made'},
    {word:'mean',meaning:'意思是；意味着',past:'meant',pp:'meant'},
    {word:'meet',meaning:'遇见；会面',past:'met',pp:'met'},
    {word:'show',meaning:'展示；显示',past:'showed',pp:'shown/showed'},
    {word:'sing',meaning:'唱歌',past:'sang',pp:'sung'},
    {word:'sit',meaning:'坐',past:'sat',pp:'sat'},
    {word:'sleep',meaning:'睡觉',past:'slept',pp:'slept'},
    {word:'speak',meaning:'说（某种语言）；讲话',past:'spoke',pp:'spoken'},
    {word:'spell',meaning:'拼写',past:'spelt/spelled',pp:'spelt/spelled'},
    {word:'spend',meaning:'花费；度过',past:'spent',pp:'spent'},
    {word:'stand',meaning:'站立',past:'stood',pp:'stood'},
    {word:'swim',meaning:'游泳',past:'swam',pp:'swum'},
    {word:'take',meaning:'拿；取；乘坐',past:'took',pp:'taken'},
    {word:'teach',meaning:'教；讲授',past:'taught',pp:'taught'},
    {word:'tell',meaning:'告诉；讲述',past:'told',pp:'told'},
    {word:'think',meaning:'想；认为',past:'thought',pp:'thought'},
    {word:'wake',meaning:'醒来；唤醒',past:'woke',pp:'woken'},
    {word:'wear',meaning:'穿；戴',past:'wore',pp:'worn'},
    {word:'win',meaning:'赢；获胜',past:'won',pp:'won'},
    {word:'write',meaning:'写',past:'wrote',pp:'written'}
  ],
  irregularVerbsLow: [
    {word:'be',meaning:'是',past:'was/were',pp:'been'},
    {word:'become',meaning:'变成；成为',past:'became',pp:'become'},
    {word:'begin',meaning:'开始',past:'began',pp:'begun'},
    {word:'break',meaning:'打破；弄坏',past:'broke',pp:'broken'},
    {word:'bring',meaning:'带来；拿来',past:'brought',pp:'brought'},
    {word:'build',meaning:'建造；建筑',past:'built',pp:'built'},
    {word:'buy',meaning:'买；购买',past:'bought',pp:'bought'},
    {word:'catch',meaning:'抓住；接住',past:'caught',pp:'caught'},
    {word:'come',meaning:'来；来到',past:'came',pp:'come'},
    {word:'cost',meaning:'花费',past:'cost',pp:'cost'},
    {word:'cut',meaning:'切；割',past:'cut',pp:'cut'},
    {word:'do',meaning:'做；干',past:'did',pp:'done'},
    {word:'draw',meaning:'画',past:'drew',pp:'drawn'},
    {word:'drink',meaning:'喝；饮',past:'drank',pp:'drunk'},
    {word:'drive',meaning:'驾驶；开车',past:'drove',pp:'driven'},
    {word:'eat',meaning:'吃',past:'ate',pp:'eaten'},
    {word:'fall',meaning:'落下；跌倒',past:'fell',pp:'fallen'},
    {word:'feel',meaning:'感觉；觉得',past:'felt',pp:'felt'},
    {word:'find',meaning:'找到；发现',past:'found',pp:'found'},
    {word:'forget',meaning:'忘记；遗忘',past:'forgot',pp:'forgotten'},
    {word:'get',meaning:'得到；获得',past:'got',pp:'got'},
    {word:'give',meaning:'给；给予',past:'gave',pp:'given'},
    {word:'go',meaning:'去；走',past:'went',pp:'gone'},
    {word:'have',meaning:'有；吃；喝',past:'had',pp:'had'},
    {word:'hear',meaning:'听见；听到',past:'heard',pp:'heard'},
    {word:'hit',meaning:'击打',past:'hit',pp:'hit'},
    {word:'hurt',meaning:'使受伤；伤害',past:'hurt',pp:'hurt'},
    {word:'keep',meaning:'保持；保留',past:'kept',pp:'kept'},
    {word:'know',meaning:'知道；了解',past:'knew',pp:'known'},
    {word:'leave',meaning:'离开；留下',past:'left',pp:'left'},
    {word:'let',meaning:'让；允许',past:'let',pp:'let'},
    {word:'lose',meaning:'丢失；失去',past:'lost',pp:'lost'},
    {word:'make',meaning:'制作；制造',past:'made',pp:'made'},
    {word:'meet',meaning:'遇见；会面',past:'met',pp:'met'},
    {word:'pay',meaning:'支付；付钱',past:'paid',pp:'paid'},
    {word:'put',meaning:'放；安置',past:'put',pp:'put'},
    {word:'read',meaning:'阅读',past:'read /red/',pp:'read /red/'},
    {word:'run',meaning:'跑；奔跑',past:'ran',pp:'run'},
    {word:'say',meaning:'说；讲',past:'said',pp:'said'},
    {word:'see',meaning:'看见',past:'saw',pp:'seen'}
  ]
};
