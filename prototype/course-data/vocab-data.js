(() => {
const vocabTopicDefinitions = [
  {
    id: "greetings",
    title: "问候",
    goal: "常用问候和礼貌表达",
    words: [
      ["yaxshimusiz", "ياخشىمۇسىز", "yaxshimusiz", "你好、你好吗", ["ياخشى", "مۇ", "سىز"], "先分成 ياخشى、مۇ、سىز 三块看。"],
      ["rahmat", "رەھمەت", "rehmet", "谢谢", ["رە", "ھمەت"]],
      ["kop-rahmat", "كۆپ رەھمەت", "köp rehmet", "非常感谢"],
      ["xosh", "خوش", "xosh", "再见、告别", ["خ", "و", "ش"]],
      ["xush-keldingiz", "خۇش كەلدىڭىز", "xush keldingiz", "欢迎"],
      ["marhaba", "مەرھابا", "merhaba", "不客气、请"],
      ["kechurung", "كەچۈرۈڭ", "kechürüng", "对不起、请原谅"],
      ["yaxshi", "ياخشى", "yaxshi", "好、很好"],
      ["qandaq", "قانداق", "qandaq", "怎么样、如何"],
      ["xeyirlik-etigen", "خەيرلىك ئەتىگەن", "xeyirlik etigen", "早上好"],
      ["xeyirlik-kech", "خەيرلىك كەچ", "xeyirlik kech", "晚上好"],
      ["korushkunche", "كۆرۈشكىچە", "körüshkiche", "回头见、再会"]
    ]
  },
  {
    id: "pronouns",
    title: "人称代词",
    goal: "人称、指示和常见疑问代词",
    words: [
      ["men", "مەن", "men", "我", ["م", "ە", "ن"]],
      ["sen", "سەن", "sen", "你", ["س", "ە", "ن"]],
      ["siz", "سىز", "siz", "你、您", ["س", "ى", "ز"]],
      ["u-pronoun", "ئۇ", "u", "他、她、它", ["ئ", "ۇ"]],
      ["biz", "بىز", "biz", "我们", ["ب", "ى", "ز"]],
      ["ular", "ئۇلار", "ular", "他们、她们"],
      ["bu", "بۇ", "bu", "这个"],
      ["shu", "شۇ", "shu", "那个、这件"],
      ["mening", "مېنىڭ", "mëning", "我的"],
      ["sening", "سېنىڭ", "sëning", "你的"],
      ["sizning", "سىزنىڭ", "sizning", "您的、你们的"],
      ["uning", "ئۇنىڭ", "uning", "他的、她的"],
      ["bizning", "بىزنىڭ", "bizning", "我们的"],
      ["kim", "كىم", "kim", "谁"],
      ["nime", "نېمە", "nëme", "什么"]
    ]
  },
  {
    id: "family",
    title: "称呼",
    goal: "家庭成员和最基础人物称呼",
    words: [
      ["ana-family", "ئانا", "ana", "妈妈、母亲", ["ئا", "ن", "ا"], "先记词形，不急着排除 ئاپا。"],
      ["apa-family", "ئاپا", "apa", "妈妈、家庭称呼变体", ["ئا", "پ", "ا"], "和 ئانا 比较：中间是 پ。"],
      ["ata-family", "ئاتا", "ata", "爸爸、父亲", ["ئا", "ت", "ا"], "和 ئانا 结构相似，中间字母不同。"],
      ["dada-family", "دادا", "dada", "爸爸、家庭称呼变体", ["د", "ا", "د", "ا"]],
      ["aile-family", "ئائىلە", "aile", "家庭、家人", ["ئا", "ئى", "لە"]],
      ["bala-family", "بالا", "bala", "孩子"],
      ["oghul-family", "ئوغۇل", "oghul", "儿子、男孩", ["ئو", "غ", "ۇل"]],
      ["qiz-family", "قىز", "qiz", "女儿、女孩", ["ق", "ى", "ز"]],
      ["aka-family", "ئاكا", "aka", "哥哥、兄长", ["ئا", "ك", "ا"]],
      ["inim-family", "ئىنىم", "inim", "我的弟弟、弟弟称呼", ["ئى", "نى", "م"]],
      ["singil-family", "سىڭىل", "singil", "妹妹", ["سى", "ڭى", "ل"]],
      ["acha-family", "ئاچا", "acha", "姐姐"],
      ["chong-ata-family", "چوڭ ئاتا", "chong ata", "爷爷、祖父"],
      ["chong-ana-family", "چوڭ ئانا", "chong ana", "奶奶、祖母"],
      ["dost-family", "دوست", "dost", "朋友"]
    ]
  },
  {
    id: "numbers",
    title: "数字",
    goal: "先学 1 到 20 的基础数字",
    words: [
      ["one", "بىر", "bir", "一", ["ب", "ى", "ر"]],
      ["two", "ئىككى", "ikki", "二", ["ئى", "ك", "كى"]],
      ["three", "ئۈچ", "üch", "三", ["ئۈ", "چ"]],
      ["four", "تۆت", "töt", "四", ["ت", "ۆ", "ت"]],
      ["five", "بەش", "besh", "五", ["ب", "ە", "ش"]],
      ["six", "ئالتە", "alte", "六", ["ئا", "ل", "تە"]],
      ["seven", "يەتتە", "yette", "七", ["يە", "ت", "تە"]],
      ["eight", "سەككىز", "sekkiz", "八", ["سە", "ك", "كىز"]],
      ["nine", "توققۇز", "toqquz", "九", ["تو", "ق", "قۇز"]],
      ["ten", "ئون", "on", "十", ["ئو", "ن"]],
      ["twenty", "يىگىرمە", "yigirme", "二十"],
      ["ten-tens", "ئون", "on", "十、整十数"],
      ["thirty", "ئوتتۇز", "ottuz", "三十"],
      ["forty", "قىرىق", "qiriq", "四十"],
      ["fifty", "ئەللىك", "ellik", "五十"],
      ["sixty", "ئاتمىش", "atmish", "六十"],
      ["seventy", "يەتمىش", "yetmish", "七十"],
      ["eighty", "سەكسەن", "seksen", "八十"],
      ["ninety", "توقسان", "toqsan", "九十"],
      ["hundred", "يۈز", "yüz", "百"],
      ["thousand", "مىڭ", "ming", "千"],
      ["ten-thousand", "ئون مىڭ", "on ming", "万、十千"],
      ["hundred-thousand", "يۈز مىڭ", "yüz ming", "十万"],
      ["million", "بىر مىليون", "bir milyon", "百万"],
      ["ten-million", "ئون مىليون", "on milyon", "千万"],
      ["hundred-million", "يۈز مىليون", "yüz milyon", "亿、一亿"],
      ["billion", "بىر مىليارد", "bir milyard", "十亿"]
    ]
  },
  {
    id: "time",
    title: "时间",
    goal: "日期、一天中的时间和常见时间词",
    words: [
      ["bugun", "بۈگۈن", "bügün", "今天"],
      ["ete", "ئەتە", "ete", "明天"],
      ["tunugun", "تۈنۈگۈن", "tünügün", "昨天"],
      ["hazir", "ھازىر", "hazir", "现在"],
      ["waqit", "ۋاقىت", "waqit", "时间"],
      ["kun", "كۈن", "kün", "天、太阳"],
      ["hepte", "ھەپتە", "hepte", "星期、周"],
      ["ay-time", "ئاي", "ay", "月、月份"],
      ["yil", "يىل", "yil", "年"],
      ["etigen", "ئەتىگەن", "etigen", "早晨"],
      ["chush", "چۈش", "chüsh", "中午、梦"],
      ["kech", "كەچ", "kech", "晚上"],
      ["keche", "كېچە", "këche", "夜晚"],
      ["dushenbe", "دۈشەنبە", "düshenbe", "星期一"],
      ["seshenbe", "سەيشەنبە", "seyshenbe", "星期二"],
      ["charshenbe", "چارشەنبە", "charshenbe", "星期三"],
      ["peyshenbe", "پەيشەنبە", "peyshenbe", "星期四"],
      ["jume", "جۈمە", "jüme", "星期五"],
      ["shenbe", "شەنبە", "shenbe", "星期六"],
      ["yekshembe", "يەكشەنبە", "yekshembe", "星期日"],
      ["yanwar", "يانۋار", "yanwar", "一月"],
      ["fewral", "فېۋرال", "fëwral", "二月"],
      ["mart", "مارت", "mart", "三月"],
      ["aprel", "ئاپرېل", "aprël", "四月"],
      ["may-month", "ماي", "may", "五月"],
      ["iyun", "ئىيۇن", "iyun", "六月"],
      ["iyul", "ئىيۇل", "iyul", "七月"],
      ["awghust", "ئاۋغۇست", "awghust", "八月"],
      ["sentyabr", "سېنتەبىر", "sentyabir", "九月"],
      ["oktyabr", "ئۆكتەبىر", "öktyabir", "十月"],
      ["noyabr", "نويابىر", "noyabir", "十一月"],
      ["dekabr", "دېكابىر", "dëkabir", "十二月"]
    ]
  },
  {
    id: "body",
    title: "身体",
    goal: "身体部位和看病时常见词",
    words: [
      ["bash-body", "باش", "bash", "头"],
      ["koz-body", "كۆز", "köz", "眼睛"],
      ["qulaq-body", "قۇلاق", "qulaq", "耳朵"],
      ["burun-body", "بۇرۇن", "burun", "鼻子"],
      ["eghiz-body", "ئېغىز", "ëghiz", "嘴"],
      ["qol-body", "قول", "qol", "手、胳膊"],
      ["put-body", "پۇت", "put", "脚、腿"],
      ["yurek-body", "يۈرەك", "yürek", "心"],
      ["boyun-body", "بويۇن", "boyun", "脖子"],
      ["arqa-body", "ئارقا", "arqa", "背、后面"],
      ["chish-body", "چىش", "chish", "牙齿"],
      ["til-body", "تىل", "til", "舌头、语言"],
      ["chach-body", "چاچ", "chach", "头发"],
      ["qorsaq-body", "قورساق", "qorsaq", "肚子"],
      ["yuz-body", "يۈز", "yüz", "脸、一百"]
    ]
  },
  {
    id: "food",
    title: "食物饮料",
    goal: "吃饭、喝水和日常餐桌词",
    words: [
      ["nan-food", "نان", "nan", "馕、面包"],
      ["su-food", "سۇ", "su", "水"],
      ["chay-food", "چاي", "chay", "茶"],
      ["gosh-food", "گۆش", "gösh", "肉"],
      ["polu-food", "پولو", "polo", "抓饭"],
      ["mewe-food", "مېۋە", "mëwe", "水果"],
      ["tuz-food", "تۇز", "tuz", "盐"],
      ["sheker-food", "شېكەر", "shëker", "糖"],
      ["may-food", "ماي", "may", "油"],
      ["sut-food", "سۈت", "süt", "牛奶"],
      ["tuxum-food", "تۇخۇم", "tuxum", "鸡蛋"],
      ["guruch-food", "گۈرۈچ", "gürüch", "米、米饭"],
      ["shorpa-food", "شورپا", "shorpa", "汤"],
      ["qetiq-food", "قېتىق", "qëtiq", "酸奶"],
      ["beliq-food", "بېلىق", "bëliq", "鱼、鱼肉"]
    ]
  },
  {
    id: "vegetables",
    title: "蔬菜",
    goal: "菜市场里常见的蔬菜词",
    words: [
      ["pemidur-vegetable", "پەمىدۇر", "pemidur", "番茄、西红柿", ["پە", "مى", "دۇر"]],
      ["piyaz-vegetable", "پىياز", "piyaz", "洋葱", ["پى", "يا", "ز"]],
      ["yangyu-vegetable", "ياڭيۇ", "yangyu", "土豆、马铃薯", ["يا", "ڭ", "يۇ"]],
      ["berengge-vegetable", "بەرەڭگە", "berengge", "土豆、马铃薯变体"],
      ["sewze-vegetable", "سەۋزە", "sewze", "胡萝卜", ["سە", "ۋ", "زە"]],
      ["samsaq-vegetable", "سامساق", "samsaq", "大蒜", ["سا", "م", "ساق"]],
      ["terxemek-vegetable", "تەرخەمەك", "terxemek", "黄瓜", ["تەر", "خە", "مەك"]],
      ["kawa-vegetable", "كاۋا", "kawa", "南瓜"],
      ["laza-vegetable", "لازا", "laza", "辣椒"],
      ["koktat-vegetable", "كۆكتات", "köktat", "蔬菜"],
      ["yesiwilek-vegetable", "يېسىۋىلەك", "yësiwilek", "白菜、卷心菜"],
      ["palek-vegetable", "پالەك", "palek", "菠菜"],
      ["chamghur-vegetable", "چامغۇر", "chamghur", "萝卜、芜菁"],
      ["badamjan-vegetable", "بادامجان", "badamjan", "茄子"],
      ["qizilmuch-vegetable", "قىزىلمۇچ", "qizilmuch", "红椒、辣椒"]
    ]
  },
  {
    id: "animals",
    title: "动物",
    goal: "身边常见动物和基础动物名",
    words: [
      ["it-animal", "ئىت", "it", "狗", ["ئى", "ت"]],
      ["mushuk-animal", "مۈشۈك", "müshük", "猫", ["مۈ", "شۈ", "ك"]],
      ["beliq-animal", "بېلىق", "bëliq", "鱼", ["بې", "لى", "ق"]],
      ["qush-animal", "قۇش", "qush", "鸟", ["ق", "ۇ", "ش"]],
      ["kala-animal", "كالا", "kala", "牛", ["ك", "ا", "لا"]],
      ["qoy-animal", "قوي", "qoy", "羊", ["قو", "ي"]],
      ["toxu-animal", "توخۇ", "toxu", "鸡", ["ت", "و", "خۇ"]],
      ["at-animal", "ئات", "at", "马"],
      ["toge-animal", "تۆگە", "töge", "骆驼"],
      ["bore-animal", "بۆرە", "böre", "狼"],
      ["burkut-animal", "بۈركۈت", "bürküt", "鹰"],
      ["ochke-animal", "ئۆچكە", "öchke", "山羊"],
      ["chashqan-animal", "چاشقان", "chashqan", "老鼠"],
      ["toshqan-animal", "توشقان", "toshqan", "兔子"],
      ["yilan-animal", "يىلان", "yilan", "蛇"]
    ]
  },
  {
    id: "home",
    title: "家和物品",
    goal: "家里、学习和随身常见物品",
    words: [
      ["oy-home", "ئۆي", "öy", "家、房间"],
      ["ishik-home", "ئىشىك", "ishik", "门"],
      ["dereze-home", "دېرىزە", "dërize", "窗户"],
      ["stol-home", "ئۈستەل", "üstel", "桌子"],
      ["kitab-home", "كىتاب", "kitab", "书"],
      ["orunduq-home", "ئورۇندۇق", "orunduq", "椅子"],
      ["kariwat-home", "كارىۋات", "kariwat", "床"],
      ["chiragh-home", "چىراغ", "chiragh", "灯"],
      ["qelem-home", "قەلەم", "qelem", "笔"],
      ["depter-home", "دەپتەر", "depter", "本子"],
      ["somka-home", "سومكا", "somka", "包"],
      ["telefon-home", "تېلېفون", "telefon", "电话、手机"],
      ["achquch-home", "ئاچقۇچ", "achquch", "钥匙"],
      ["saet-home", "سائەت", "saet", "表、小时"],
      ["pul-home", "پۇل", "pul", "钱"]
    ]
  },
  {
    id: "colors",
    title: "颜色",
    goal: "描述物品时最常用的颜色词",
    words: [
      ["qizil-color", "قىزىل", "qizil", "红色"],
      ["kok-color", "كۆك", "kök", "蓝色、天空色"],
      ["yeshil-color", "يېشىل", "yëshil", "绿色"],
      ["seriq-color", "سېرىق", "sëriq", "黄色"],
      ["qara-color", "قارا", "qara", "黑色"],
      ["aq-color", "ئاق", "aq", "白色"],
      ["toq-seriq-color", "توق سېرىق", "toq sëriq", "橙色"],
      ["binepshe-color", "بىنەپشە", "binepshe", "紫色"],
      ["qongur-color", "قوڭۇر", "qongur", "棕色"],
      ["kulreng-color", "كۈلرەڭ", "külreng", "灰色"],
      ["altun-color", "ئالتۇن", "altun", "金色"],
      ["kumush-color", "كۈمۈش", "kümüsh", "银色"],
      ["halreng-color", "ھالرەڭ", "halreng", "粉色"],
      ["sus-kok-color", "سۇس كۆك", "sus kök", "浅蓝色"],
      ["qeniq-kok-color", "قېنىق كۆك", "qëniq kök", "深蓝色"]
    ]
  },
  {
    id: "actions",
    title: "常用动作",
    goal: "每天会用到的基础动作词",
    words: [
      ["kelish-action", "كېلىش", "këlish", "来"],
      ["ketish-action", "كېتىش", "këtish", "走、离开"],
      ["oqush-action", "ئوقۇش", "oqush", "读、学习"],
      ["yezish-action", "يېزىش", "yëzish", "写"],
      ["korush-action", "كۆرۈش", "körüsh", "看见、看"],
      ["anglash-action", "ئاڭلاش", "anglash", "听"],
      ["sozlesh-action", "سۆزلەش", "sözlesh", "说话"],
      ["yeyish-action", "يېيىش", "yëyish", "吃"],
      ["ichish-action", "ئىچىش", "ichish", "喝"],
      ["berish-action", "بېرىش", "bërish", "给、去"],
      ["elish-action", "ئېلىش", "ëlish", "拿、取"],
      ["echish-action", "ئېچىش", "ëchish", "打开"],
      ["taqash-action", "تاقاش", "taqash", "关闭"],
      ["olturush-action", "ئولتۇرۇش", "olturush", "坐"],
      ["bilish-action", "بىلىش", "bilish", "知道"]
    ]
  }
];

const vocabSectionDefinitions = {
  greetings: [
    ["daily", "日常问候", ["yaxshimusiz", "xeyirlik-etigen", "xeyirlik-kech", "qandaq", "yaxshi"]],
    ["polite", "礼貌用语", ["rahmat", "kop-rahmat", "marhaba", "kechurung", "xush-keldingiz", "xosh", "korushkunche"]]
  ],
  pronouns: [
    ["person", "人称", ["men", "sen", "siz", "u-pronoun", "biz", "ular"]],
    ["possessive", "所属", ["mening", "sening", "sizning", "uning", "bizning"]],
    ["pointing", "指示和疑问", ["bu", "shu", "kim", "nime"]]
  ],
  family: [
    ["parents", "父母和家庭", ["ana-family", "apa-family", "ata-family", "dada-family", "aile-family", "bala-family"]],
    ["siblings", "兄弟姐妹", ["oghul-family", "qiz-family", "aka-family", "inim-family", "singil-family", "acha-family"]],
    ["relations", "长辈和关系", ["chong-ata-family", "chong-ana-family", "dost-family"]]
  ],
  numbers: [
    ["one-to-ten", "1-10", ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"]],
    ["tens", "整十数", ["ten-tens", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]],
    ["large", "大数", ["hundred", "thousand", "ten-thousand", "hundred-thousand", "million", "ten-million", "hundred-million", "billion"]]
  ],
  time: [
    ["basic", "基础时间", ["bugun", "ete", "tunugun", "hazir", "waqit", "kun", "hepte", "ay-time", "yil", "etigen", "chush", "kech", "keche"]],
    ["weekdays", "星期", ["dushenbe", "seshenbe", "charshenbe", "peyshenbe", "jume", "shenbe", "yekshembe"]],
    ["months", "月份", ["yanwar", "fewral", "mart", "aprel", "may-month", "iyun", "iyul", "awghust", "sentyabr", "oktyabr", "noyabr", "dekabr"]]
  ],
  body: [
    ["head", "头部", ["bash-body", "koz-body", "qulaq-body", "burun-body", "eghiz-body", "chish-body", "til-body", "chach-body", "yuz-body"]],
    ["body", "身体", ["qol-body", "put-body", "yurek-body", "boyun-body", "arqa-body", "qorsaq-body"]]
  ],
  food: [
    ["basic", "主食饮料", ["nan-food", "su-food", "chay-food", "sut-food", "polu-food", "guruch-food", "shorpa-food", "qetiq-food"]],
    ["meal", "食物和调味", ["gosh-food", "mewe-food", "tuz-food", "sheker-food", "may-food", "tuxum-food", "beliq-food"]]
  ],
  vegetables: [
    ["common", "常见蔬菜", ["pemidur-vegetable", "piyaz-vegetable", "yangyu-vegetable", "berengge-vegetable", "sewze-vegetable", "terxemek-vegetable", "koktat-vegetable"]],
    ["more", "补充蔬菜", ["samsaq-vegetable", "kawa-vegetable", "laza-vegetable", "yesiwilek-vegetable", "palek-vegetable", "chamghur-vegetable", "badamjan-vegetable", "qizilmuch-vegetable"]]
  ],
  animals: [
    ["home", "家养动物", ["it-animal", "mushuk-animal", "kala-animal", "qoy-animal", "toxu-animal", "at-animal", "ochke-animal"]],
    ["other", "其他动物", ["beliq-animal", "qush-animal", "toge-animal", "bore-animal", "burkut-animal", "chashqan-animal", "toshqan-animal", "yilan-animal"]]
  ],
  home: [
    ["house", "家里", ["oy-home", "ishik-home", "dereze-home", "stol-home", "orunduq-home", "kariwat-home", "chiragh-home"]],
    ["objects", "学习和随身", ["kitab-home", "qelem-home", "depter-home", "somka-home", "telefon-home", "achquch-home", "saet-home", "pul-home"]]
  ],
  colors: [
    ["basic", "基础颜色", ["qizil-color", "kok-color", "yeshil-color", "seriq-color", "qara-color", "aq-color"]],
    ["more", "扩展颜色", ["toq-seriq-color", "binepshe-color", "qongur-color", "kulreng-color", "altun-color", "kumush-color", "halreng-color", "sus-kok-color", "qeniq-kok-color"]]
  ],
  actions: [
    ["learn", "看听说写", ["oqush-action", "yezish-action", "korush-action", "anglash-action", "sozlesh-action", "bilish-action"]],
    ["daily", "日常动作", ["kelish-action", "ketish-action", "yeyish-action", "ichish-action", "berish-action", "elish-action", "echish-action", "taqash-action", "olturush-action"]]
  ]
};

function defaultParts(value) {
  return value.split(/\s+/).filter(Boolean);
}

function makeVocabItem(topic, entry) {
  const [id, value, latin, meaning, parts, tip] = entry;

  return {
    id,
    value,
    latin,
    meaning,
    theme: topic.title,
    parts: parts && parts.length ? parts : defaultParts(value),
    standardNote: `${topic.title}候选词，需母语者确认标准写法、发音和教学顺序。`,
    variantNote: "地区说法、口语用法和同义词关系待审校。",
    acceptableAnswer: "现阶段只练词形，不设最终可接受答案。",
    testPolicy: "可做词形辨认和输入；中文含义暂作预览。",
    reviewStatus: "待母语者审校",
    sourceNote: "参考公开学习者词表和常用入门主题，进入项目审校队列。",
    tip: tip || "先看词形，再结合中文预览。"
  };
}

function makeVocabSections(topic, items) {
  const definitions = vocabSectionDefinitions[topic.id] || [];
  const itemIds = new Set(items.map((item) => item.id));

  return definitions
    .map(([id, title, ids]) => ({
      id,
      title,
      itemIds: ids.filter((itemId) => itemIds.has(itemId))
    }))
    .filter((section) => section.itemIds.length > 0);
}

const vocabGroups = vocabTopicDefinitions.map((topic) => {
  const items = topic.words.map((entry) => makeVocabItem(topic, entry));

  return {
    id: topic.id,
    kind: "vocab",
    title: topic.title,
    letters: items.map((item) => item.value),
    goal: topic.goal,
    status: "待审校",
    sections: makeVocabSections(topic, items),
    items
  };
});

  window.ANA_TILIM_VOCAB = {
    vocabGroups
  };
})();
