(() => {
const readingUnits = [
  {
    id: "dialogue-theater",
    kind: "reading",
    readingKind: "dialogue",
    title: "第五单元：对话小剧场",
    subtitle: "很短的双人日常对话",
    status: "待审校",
    groups: [
      {
        id: "dialogue-greeting",
        title: "早上见面",
        items: [
          { id: "dialogue-greeting-1", speaker: "A", value: "ياخشىمۇسىز؟", meaning: "你好，你好吗？" },
          { id: "dialogue-greeting-2", speaker: "B", value: "ياخشى، رەھمەت. سىزچۇ؟", meaning: "很好，谢谢。您呢？" },
          { id: "dialogue-greeting-3", speaker: "A", value: "مەنمۇ ياخشى.", meaning: "我也很好。" },
          { id: "dialogue-greeting-4", speaker: "B", value: "كۆرۈشكۈنچە.", meaning: "回头见。" }
        ]
      },
      {
        id: "dialogue-family",
        title: "介绍家人",
        items: [
          { id: "dialogue-family-1", speaker: "A", value: "بۇ كىم؟", meaning: "这是谁？" },
          { id: "dialogue-family-2", speaker: "B", value: "بۇ مېنىڭ ئانام.", meaning: "这是我的妈妈。" },
          { id: "dialogue-family-3", speaker: "A", value: "دادىڭىز بارمۇ؟", meaning: "你爸爸在吗？" },
          { id: "dialogue-family-4", speaker: "B", value: "ھەئە، دادام ئۆيدە.", meaning: "是的，我爸爸在家。" }
        ]
      },
      {
        id: "dialogue-shopping",
        title: "买东西",
        items: [
          { id: "dialogue-shopping-1", speaker: "A", value: "نان بارمۇ؟", meaning: "有面包吗？" },
          { id: "dialogue-shopping-2", speaker: "B", value: "بار، قانچە لازىم؟", meaning: "有，需要多少？" },
          { id: "dialogue-shopping-3", speaker: "A", value: "ئىككى دانە لازىم.", meaning: "需要两个。" },
          { id: "dialogue-shopping-4", speaker: "B", value: "مانا، ئېلىڭ.", meaning: "给您，请拿。" }
        ]
      },
      {
        id: "dialogue-road",
        title: "问路",
        items: [
          { id: "dialogue-road-1", speaker: "A", value: "مەكتەپ قەيەردە؟", meaning: "学校在哪里？" },
          { id: "dialogue-road-2", speaker: "B", value: "ئۇ ئالدىدا.", meaning: "它在前面。" },
          { id: "dialogue-road-3", speaker: "A", value: "يىراقمۇ؟", meaning: "远吗？" },
          { id: "dialogue-road-4", speaker: "B", value: "ياق، يېقىن.", meaning: "不，近。" }
        ]
      },
      {
        id: "dialogue-school",
        title: "学校里",
        items: [
          { id: "dialogue-school-1", speaker: "A", value: "بۈگۈن دەرس بارمۇ؟", meaning: "今天有课吗？" },
          { id: "dialogue-school-2", speaker: "B", value: "ھەئە، دەرس بار.", meaning: "是的，有课。" },
          { id: "dialogue-school-3", speaker: "A", value: "كىتابىڭىز بارمۇ؟", meaning: "你有书吗？" },
          { id: "dialogue-school-4", speaker: "B", value: "بار، بۇ مېنىڭ كىتابىم.", meaning: "有，这是我的书。" }
        ]
      },
      {
        id: "dialogue-guest",
        title: "做客",
        items: [
          { id: "dialogue-guest-1", speaker: "A", value: "خۇش كەلدىڭىز.", meaning: "欢迎您。" },
          { id: "dialogue-guest-2", speaker: "B", value: "رەھمەت.", meaning: "谢谢。" },
          { id: "dialogue-guest-3", speaker: "A", value: "چاي ئىچەمسىز؟", meaning: "您喝茶吗？" },
          { id: "dialogue-guest-4", speaker: "B", value: "ھەئە، ئىچىمەن.", meaning: "是的，我喝。" }
        ]
      }
    ]
  },
  {
    id: "short-stories",
    kind: "reading",
    readingKind: "story",
    title: "第六单元：小故事",
    subtitle: "超短生活故事",
    status: "待审校",
    groups: [
      {
        id: "story-my-day",
        title: "我的一天",
        items: [
          { id: "story-my-day-1", value: "مەن ئەتىگەندە ئورنىمدىن تۇرىمەن.", meaning: "我早上起床。" },
          { id: "story-my-day-2", value: "يۈزۈمنى يۇيىمەن.", meaning: "我洗脸。" },
          { id: "story-my-day-3", value: "نان يەيمەن، چاي ئىچىمەن.", meaning: "我吃面包，喝茶。" },
          { id: "story-my-day-4", value: "كېيىن مەكتەپكە بارىمەن.", meaning: "然后我去学校。" },
          { id: "story-my-day-5", value: "كەچتە ئۆيگە قايتىمەن.", meaning: "晚上我回家。" }
        ]
      },
      {
        id: "story-my-family",
        title: "我的家",
        items: [
          { id: "story-my-family-1", value: "بىزنىڭ ئۆيىمىزدە ئاتا-ئانام بار.", meaning: "我们家里有爸爸妈妈。" },
          { id: "story-my-family-2", value: "مېنىڭ بىر ئاكام بار.", meaning: "我有一个哥哥。" },
          { id: "story-my-family-3", value: "سىڭلىم كىچىك.", meaning: "我的妹妹还小。" },
          { id: "story-my-family-4", value: "بىز بىللە تاماق يەيمىز.", meaning: "我们一起吃饭。" },
          { id: "story-my-family-5", value: "ئۆيىمىز ئىسسىق ۋە خاتىرجەم.", meaning: "我们的家温暖又安心。" }
        ]
      },
      {
        id: "story-market",
        title: "去市场",
        items: [
          { id: "story-market-1", value: "بۈگۈن ئانام بىلەن بازارغا باردىم.", meaning: "今天我和妈妈去了市场。" },
          { id: "story-market-2", value: "بازاردا كۆپ ئادەم بار ئىدى.", meaning: "市场里有很多人。" },
          { id: "story-market-3", value: "بىز پەمىدۇر ۋە بەرەڭگە ئالдуқ.", meaning: "我们买了番茄和土豆。" },
          { id: "story-market-4", value: "ئانام نانمۇ ئالدى.", meaning: "妈妈也买了面包。" },
          { id: "story-market-5", value: "كېيىن ئۆيگە قايتتۇق.", meaning: "然后我们回家了。" }
        ]
      },
      {
        id: "story-friend",
        title: "好朋友",
        items: [
          { id: "story-friend-1", value: "مېنىڭ ياخشى دوستۇم بار.", meaning: "我有一个好朋友。" },
          { id: "story-friend-2", value: "ئۇنىڭ ئىسمى ئەلى.", meaning: "他的名字叫阿里。" },
          { id: "story-friend-3", value: "بىز بىللە ئوينايمىز.", meaning: "我们一起玩。" },
          { id: "story-friend-4", value: "ئۇ ماڭا ياردەم قىلىدۇ.", meaning: "他会帮助我。" },
          { id: "story-friend-5", value: "دوستلۇق ياخشى نەرسە.", meaning: "友谊是美好的。" }
        ]
      },
      {
        id: "story-rain",
        title: "下雨天",
        items: [
          { id: "story-rain-1", value: "بۈگۈن ھاۋا بۇلۇتلۇق.", meaning: "今天天气多云。" },
          { id: "story-rain-2", value: "چۈشتىن كېيىن يامغۇر ياغدى.", meaning: "下午下雨了。" },
          { id: "story-rain-3", value: "مەن دېرىزىدىن سىرتقا قارىدىم.", meaning: "我从窗户看外面。" },
          { id: "story-rain-4", value: "يەر ھۆل بولدى.", meaning: "地面湿了。" },
          { id: "story-rain-5", value: "يامغۇر ئاۋازى يۇمشاق ئاڭلاندى.", meaning: "雨声听起来很轻柔。" }
        ]
      },
      {
        id: "story-mother-language",
        title: "我的母语",
        items: [
          { id: "story-mother-language-1", value: "مېنىڭ ئانا تىلىم ئۇيغۇر تىلى.", meaning: "我的母语是维吾尔语。" },
          { id: "story-mother-language-2", value: "مەن ھەر كۈنى بىر ئاز ئۆگىنىمەن.", meaning: "我每天学一点。" },
          { id: "story-mother-language-3", value: "بىر ھەرپنى ياخشى بىلىمەن.", meaning: "我先认真认识一个字母。" },
          { id: "story-mother-language-4", value: "كېيىن بىر سۆزنى ئوقۇيمەن.", meaning: "然后我读一个词。" },
          { id: "story-mother-language-5", value: "ئانا تىلىم قەلبىمگە يېقىن.", meaning: "我的母语离我的心很近。" }
        ]
      }
    ]
  },
  {
    id: "famous-quotes",
    kind: "reading",
    readingKind: "quote",
    title: "第七单元：名人名言",
    subtitle: "10 条维吾尔族文化名人学习短句",
    status: "待来源审校",
    groups: [
      {
        id: "quote-mahmud-kashgari",
        title: "马赫穆德·喀什噶里",
        items: [
          { id: "quote-mahmud-kashgari-line", value: "تىل بىر خەلقنى تونۇشنىڭ ئاچقۇچىدۇر.", meaning: "语言是了解一个民族的钥匙。", lesson: "学习母语，不只是学字和音，也是在认识自己的文化。", reviewStatus: "学习版译句，待来源审校" }
        ]
      },
      {
        id: "quote-yusuf-hajib",
        title: "玉素甫·哈斯·哈吉甫",
        items: [
          { id: "quote-yusuf-hajib-line", value: "بىلىم ئادەمنىڭ يولىنى يورۇتىدۇ.", meaning: "知识照亮人的道路。", lesson: "学习让人看清方向，也让日常生活更有力量。", reviewStatus: "学习版译句，待来源审校" }
        ]
      },
      {
        id: "quote-ahmet-yukneki",
        title: "艾合买提·玉克乃克",
        items: [
          { id: "quote-ahmet-yukneki-line", value: "ئەدەب ئادەمنىڭ زىننىتىدۇر.", meaning: "礼貌是人的装饰。", lesson: "说话有礼，是语言学习里最早应该养成的习惯。", reviewStatus: "学习版译句，待来源审校" }
        ]
      },
      {
        id: "quote-molla-musa",
        title: "毛拉·穆萨·赛拉米",
        items: [
          { id: "quote-molla-musa-line", value: "تارىخنى بىلگەن ئادەم ئۆزىنى ياخشىراق تونۇيدۇ.", meaning: "懂得历史的人，更能认识自己。", lesson: "文化学习不只看现在，也要慢慢了解来处。", reviewStatus: "学习版译句，待来源审校" }
        ]
      },
      {
        id: "quote-abdulkhaliq-uyghur",
        title: "阿不都哈力克·维吾尔",
        items: [
          { id: "quote-abdulkhaliq-uyghur-line", value: "ئويغانغان كۆڭۈل ئۆگىنىشتىن توختىمايدۇ.", meaning: "醒来的心不会停止学习。", lesson: "保持学习的心，比一次学很多更重要。", reviewStatus: "学习版译句，待来源审校" }
        ]
      },
      {
        id: "quote-lutpulla-mutellip",
        title: "鲁特普拉·穆塔里甫",
        items: [
          { id: "quote-lutpulla-mutellip-line", value: "ياشلىق ئۈمىد بىلەن گۈزەل.", meaning: "青春因希望而美丽。", lesson: "语言学习也需要希望，一点一点坚持就会前进。", reviewStatus: "学习版译句，待来源审校" }
        ]
      },
      {
        id: "quote-abdurehim-otkur",
        title: "阿不都热依木·吾提库尔",
        items: [
          { id: "quote-abdurehim-otkur-line", value: "ئىز قالدۇرۇش ئۈچۈن قەدەم بېسىش كېرەك.", meaning: "想留下足迹，就要迈出脚步。", lesson: "每天完成一个小练习，就是给自己留下学习的足迹。", reviewStatus: "学习版译句，待来源审校" }
        ]
      },
      {
        id: "quote-zunun-qadiri",
        title: "祖农·卡迪尔",
        items: [
          { id: "quote-zunun-qadiri-line", value: "ھېكايە ئادەمنىڭ كۆڭلىنى ئاچىدۇ.", meaning: "故事能打开人的心。", lesson: "读短故事能把词语放回生活里，更容易记住。", reviewStatus: "学习版译句，待来源审校" }
        ]
      },
      {
        id: "quote-zordun-sabir",
        title: "祖尔东·萨比尔",
        items: [
          { id: "quote-zordun-sabir-line", value: "كۈلكە ھەقىقەتنى يۇمشاق ئېيتىدۇ.", meaning: "笑声能温和地说出真实。", lesson: "语言不只表达意思，也表达态度和温度。", reviewStatus: "学习版译句，待来源审校" }
        ]
      },
      {
        id: "quote-teyipjan-eliyev",
        title: "铁依甫江·艾力耶夫",
        items: [
          { id: "quote-teyipjan-eliyev-line", value: "شېئىر يۈرەكتىكى سۆزنى ئاڭلىتىدۇ.", meaning: "诗让心里的话被听见。", lesson: "以后学习诗句时，要先感受语气，再慢慢看词。", reviewStatus: "学习版译句，待来源审校" }
        ]
      }
    ]
  },
  {
    id: "uyghur-proverbs",
    kind: "reading",
    readingKind: "proverb",
    title: "第八单元：维吾尔谚语",
    subtitle: "10 条常见智慧短句",
    status: "待母语者审校",
    groups: [
      {
        id: "proverb-bilim-kuch",
        title: "知识就是力量",
        items: [
          { id: "proverb-bilim-kuch-line", value: "بىلىم كۈچ.", meaning: "知识就是力量。", lesson: "学习越扎实，做事越有底气。", reviewStatus: "待母语者审校" }
        ]
      },
      {
        id: "proverb-yaxshi-soz",
        title: "好话暖心",
        items: [
          { id: "proverb-yaxshi-soz-line", value: "ياخشى سۆز جان ئوزۇقى.", meaning: "好话是心灵的食粮。", lesson: "温和的话能让人舒服，也能让关系更近。", reviewStatus: "待母语者审校" }
        ]
      },
      {
        id: "proverb-aqil",
        title: "智慧不看年龄",
        items: [
          { id: "proverb-aqil-line", value: "ئەقىل ياشتا ئەمەس، باشتا.", meaning: "智慧不在年龄，而在头脑。", lesson: "不要只看年纪，真正重要的是思考和判断。", reviewStatus: "待母语者审校" }
        ]
      },
      {
        id: "proverb-birlik",
        title: "团结有力量",
        items: [
          { id: "proverb-birlik-line", value: "بىرلىك بار يەردە كۈچ بار.", meaning: "有团结的地方就有力量。", lesson: "一起做事时，互相配合比单打独斗更强。", reviewStatus: "待母语者审校" }
        ]
      },
      {
        id: "proverb-emgek",
        title: "劳动受尊敬",
        items: [
          { id: "proverb-emgek-line", value: "ئەمگەك قىلغان ئەزىز.", meaning: "劳动的人值得尊敬。", lesson: "努力和付出本身就有价值。", reviewStatus: "待母语者审校" }
        ]
      },
      {
        id: "proverb-dost",
        title: "朋友见真心",
        items: [
          { id: "proverb-dost-line", value: "دوست قىيىن كۈندە بىلىنەر.", meaning: "朋友在困难时才看得出来。", lesson: "真正的朋友会在需要时出现。", reviewStatus: "待母语者审校" }
        ]
      },
      {
        id: "proverb-kitap",
        title: "书是知识源泉",
        items: [
          { id: "proverb-kitap-line", value: "كىتاب بىلىمنىڭ بۇلىقى.", meaning: "书是知识的泉源。", lesson: "多读书，会不断得到新的知识。", reviewStatus: "待母语者审校" }
        ]
      },
      {
        id: "proverb-sabr",
        title: "耐心有回报",
        items: [
          { id: "proverb-sabr-line", value: "سەۋرنىڭ ئاخىرى ئالتۇن.", meaning: "耐心的最后是金子。", lesson: "坚持到最后，常常会得到好的结果。", reviewStatus: "待母语者审校" }
        ]
      },
      {
        id: "proverb-ana-til",
        title: "母语连着心",
        items: [
          { id: "proverb-ana-til-line", value: "ئانا تىل جان تىلى.", meaning: "母语是心灵的语言。", lesson: "母语连接家庭、记忆和身份。", reviewStatus: "待母语者审校" }
        ]
      },
      {
        id: "proverb-qaduwq",
        title: "饮水不忘源",
        items: [
          { id: "proverb-qaduwq-line", value: "سۇ ئىچكەن قۇدۇقنى ئۇنتۇما.", meaning: "不要忘记喝过水的井。", lesson: "得到帮助后，要记得感恩来源。", reviewStatus: "待母语者审校" }
        ]
      }
    ]
  }
];

  window.ANA_TILIM_READING = {
    readingUnits
  };
})();
