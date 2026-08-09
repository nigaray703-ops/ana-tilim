(() => {
const readingUnits = [
  {
    id: "grammar-basics",
    kind: "reading",
    readingKind: "grammar",
    title: "第四单元：语法入门",
    subtitle: "先看规则，再读例句",
    status: "待母语者审校",
    groups: [
      {
        id: "grammar-word-order",
        title: "主语 + 宾语 + 动词",
        items: [
          {
            id: "grammar-word-order-1",
            pattern: "谁 + 什么 + 做什么",
            value: "مەن كىتاب ئوقۇيمەن.",
            meaning: "我读书。",
            lesson: "维语常见语序是主语、宾语、动词；动词通常放在句末。",
            reviewStatus: "待母语者审校"
          },
          {
            id: "grammar-word-order-2",
            pattern: "谁 + 什么 + 做什么",
            value: "مەن چاي ئىچىمەن.",
            meaning: "我喝茶。",
            lesson: "先找最后的动词，再往前看谁在做、做什么。",
            reviewStatus: "待母语者审校"
          },
          {
            id: "grammar-word-order-3",
            pattern: "谁 + 哪里 + 做什么",
            value: "ئۇ بازارغا بارىدۇ.",
            meaning: "他/她去市场。",
            lesson: "去哪里这类成分也常放在动词前面。",
            reviewStatus: "待母语者审校"
          }
        ]
      },
      {
        id: "grammar-copula",
        title: "A 是 B",
        items: [
          {
            id: "grammar-copula-1",
            pattern: "A + B",
            value: "بۇ قەلەم.",
            meaning: "这是笔。",
            lesson: "现在时的“是”常常不单独写出来，A 和 B 直接并列。",
            reviewStatus: "待母语者审校"
          },
          {
            id: "grammar-copula-2",
            pattern: "A + 身份",
            value: "مەن ئوقۇغۇچى.",
            meaning: "我是学生。",
            lesson: "人称和身份直接放在一起，就能表达“我是……”。",
            reviewStatus: "待母语者审校"
          },
          {
            id: "grammar-copula-3",
            pattern: "A + 身份",
            value: "ئۇ دوختۇر.",
            meaning: "他/她是医生。",
            lesson: "第三人称没有性别区分，ئۇ 可以指他、她或它。",
            reviewStatus: "待母语者审校"
          }
        ]
      },
      {
        id: "grammar-negative-emes",
        title: "不是",
        items: [
          {
            id: "grammar-negative-emes-1",
            pattern: "A + B + ئەمەس",
            value: "بۇ كىتاب ئەمەس.",
            meaning: "这不是书。",
            lesson: "名词句或形容词句的否定，常把 ئەمەس 放在句末。",
            reviewStatus: "待母语者审校"
          },
          {
            id: "grammar-negative-emes-2",
            pattern: "A + 身份 + ئەمەس",
            value: "ئۇ دوختۇر ئەمەس.",
            meaning: "他/她不是医生。",
            lesson: "先说对象和身份，最后用 ئەمەس 否定。",
            reviewStatus: "待母语者审校"
          },
          {
            id: "grammar-negative-emes-3",
            pattern: "A + 身份 + ئەمەس",
            value: "مەن مۇئەللىم ئەمەس.",
            meaning: "我不是老师。",
            lesson: "先记住句尾否定，比一开始背很多变化更稳。",
            reviewStatus: "待母语者审校"
          }
        ]
      },
      {
        id: "grammar-yes-no-mu",
        title: "是 / 否疑问",
        items: [
          {
            id: "grammar-yes-no-mu-1",
            pattern: "句子 + مۇ؟",
            value: "بۇ كىتابمۇ؟",
            meaning: "这是书吗？",
            lesson: "能回答“是/不是”的问题，常把 مۇ 连在前一个词后面。",
            reviewStatus: "待母语者审校"
          },
          {
            id: "grammar-yes-no-mu-2",
            pattern: "形容词 + مۇ؟",
            value: "سىز ياخشىمۇ؟",
            meaning: "您好吗？",
            lesson: "مۇ 是问题标记，前面的词是这句的判断重点。",
            reviewStatus: "待母语者审校"
          },
          {
            id: "grammar-yes-no-mu-3",
            pattern: "bar / yoq + مۇ؟",
            value: "سىزدە كىتاب بارمۇ؟",
            meaning: "您有书吗？",
            lesson: "有/没有句也可以用 مۇ 来问。",
            reviewStatus: "待母语者审校"
          }
        ]
      },
      {
        id: "grammar-question-words",
        title: "谁 / 什么 / 哪里",
        items: [
          {
            id: "grammar-question-words-1",
            pattern: "A + كىم؟",
            value: "بۇ كىم؟",
            meaning: "这是谁？",
            lesson: "有疑问词时，通常不再加 مۇ。",
            reviewStatus: "待母语者审校"
          },
          {
            id: "grammar-question-words-2",
            pattern: "A + نېمە؟",
            value: "بۇ نېمە؟",
            meaning: "这是什么？",
            lesson: "疑问词放在要询问的位置。",
            reviewStatus: "待母语者审校"
          },
          {
            id: "grammar-question-words-3",
            pattern: "地点 + قەيەردە؟",
            value: "مەكتەپ قەيەردە؟",
            meaning: "学校在哪里？",
            lesson: "问地点时，用 قەيەردە。",
            reviewStatus: "待母语者审校"
          }
        ]
      },
      {
        id: "grammar-bar-yoq",
        title: "有 / 没有",
        items: [
          {
            id: "grammar-bar-yoq-1",
            pattern: "某处/某人处 + 名词 + بار",
            value: "مەندە قەلەم بار.",
            meaning: "我有笔。",
            lesson: "بار 表示有、存在，常放在句末。",
            reviewStatus: "待母语者审校"
          },
          {
            id: "grammar-bar-yoq-2",
            pattern: "某处/某人处 + 名词 + يوق",
            value: "مەندە قەلەم يوق.",
            meaning: "我没有笔。",
            lesson: "يوق 表示没有、不存在，也常放在句末。",
            reviewStatus: "待母语者审校"
          },
          {
            id: "grammar-bar-yoq-3",
            pattern: "时间/地点 + 名词 + بار",
            value: "بۈگۈن كىنو بار.",
            meaning: "今天有电影。",
            lesson: "时间或地点可以放在句首，说明哪里或什么时候有。",
            reviewStatus: "待母语者审校"
          }
        ]
      }
    ]
  },
  {
    id: "sentence-patterns",
    kind: "reading",
    readingKind: "sentence",
    title: "第五单元：基础句型",
    subtitle: "把日常词汇放进短句里",
    status: "待审校",
    groups: [
      {
        id: "sentence-this-that",
        title: "这是…… / 那是……",
        items: [
          { id: "sentence-this-that-1", value: "بۇ قەلەم.", meaning: "这是笔。", reviewStatus: "待母语者审校" },
          { id: "sentence-this-that-2", value: "بۇ كىتاب.", meaning: "这是书。", reviewStatus: "待母语者审校" },
          { id: "sentence-this-that-3", value: "ئۇ مەكتەپ.", meaning: "那是学校。", reviewStatus: "待母语者审校" },
          { id: "sentence-this-that-4", value: "ئۇ مۇئەللىم.", meaning: "那是老师。", reviewStatus: "待母语者审校" }
        ]
      },
      {
        id: "sentence-who-what",
        title: "谁？什么？哪里？",
        items: [
          { id: "sentence-who-what-1", value: "بۇ كىم؟", meaning: "这是谁？", reviewStatus: "待母语者审校" },
          { id: "sentence-who-what-2", value: "بۇ نېمە؟", meaning: "这是什么？", reviewStatus: "待母语者审校" },
          { id: "sentence-who-what-3", value: "مەكتەپ قەيەردە؟", meaning: "学校在哪里？", reviewStatus: "待母语者审校" },
          { id: "sentence-who-what-4", value: "سىز قانداقسىز؟", meaning: "您怎么样？", reviewStatus: "待母语者审校" }
        ]
      },
      {
        id: "sentence-i-you",
        title: "我是…… / 你是……",
        items: [
          { id: "sentence-i-you-1", value: "مەن ئوقۇغۇچى.", meaning: "我是学生。", reviewStatus: "待母语者审校" },
          { id: "sentence-i-you-2", value: "سىز مۇئەللىم.", meaning: "您是老师。", reviewStatus: "待母语者审校" },
          { id: "sentence-i-you-3", value: "ئۇ دوختۇر.", meaning: "他/她是医生。", reviewStatus: "待母语者审校" },
          { id: "sentence-i-you-4", value: "بۇ مېنىڭ دوستۇم.", meaning: "这是我的朋友。", reviewStatus: "待母语者审校" }
        ]
      },
      {
        id: "sentence-have",
        title: "我有…… / 我没有……",
        items: [
          { id: "sentence-have-1", value: "مەندە قەلەم بار.", meaning: "我有笔。", reviewStatus: "待母语者审校" },
          { id: "sentence-have-2", value: "مەندە قەلەم يوق.", meaning: "我没有笔。", reviewStatus: "待母语者审校" },
          { id: "sentence-have-3", value: "سىزدە كىتاب بارمۇ؟", meaning: "您有书吗？", reviewStatus: "待母语者审校" },
          { id: "sentence-have-4", value: "بىزدە نان بار.", meaning: "我们有馕。", reviewStatus: "待母语者审校" }
        ]
      },
      {
        id: "sentence-like-need",
        title: "我要…… / 我喜欢……",
        items: [
          { id: "sentence-like-need-1", value: "ماڭا سۇ لازىم.", meaning: "我要水。", reviewStatus: "待母语者审校" },
          { id: "sentence-like-need-2", value: "ماڭا نان لازىم.", meaning: "我要馕。", reviewStatus: "待母语者审校" },
          { id: "sentence-like-need-3", value: "مەن چاي ئىچىمەن.", meaning: "我喝茶。", reviewStatus: "待母语者审校" },
          { id: "sentence-like-need-4", value: "مەن ئانا تىلىمنى ياخشى كۆرىمەن.", meaning: "我喜欢我的母语。", reviewStatus: "待母语者审校" }
        ]
      },
      {
        id: "sentence-time",
        title: "时间和日期",
        items: [
          { id: "sentence-time-1", value: "بۈگۈن قايسى كۈن؟", meaning: "今天星期几？", reviewStatus: "待母语者审校" },
          { id: "sentence-time-2", value: "بۈگۈن دۈشەنبە.", meaning: "今天是星期一。", reviewStatus: "待母语者审校" },
          { id: "sentence-time-3", value: "ھازىر سائەت قانچە؟", meaning: "现在几点？", reviewStatus: "待母语者审校" },
          { id: "sentence-time-4", value: "ھازىر سائەت سەككىز.", meaning: "现在八点。", reviewStatus: "待母语者审校" }
        ]
      },
      {
        id: "sentence-no",
        title: "不是 / 没有 / 不做",
        items: [
          { id: "sentence-no-1", value: "بۇ كىتاب ئەمەس.", meaning: "这不是书。", reviewStatus: "待母语者审校" },
          { id: "sentence-no-2", value: "ئۇ ئۆيدە يوق.", meaning: "他/她不在家。", reviewStatus: "待母语者审校" },
          { id: "sentence-no-3", value: "مەن چاي ئىچمەيمەن.", meaning: "我不喝茶。", reviewStatus: "待母语者审校" },
          { id: "sentence-no-4", value: "ئۇ بازارغا بارمايدۇ.", meaning: "他/她不去市场。", reviewStatus: "待母语者审校" }
        ]
      },
      {
        id: "sentence-question",
        title: "简单疑问句",
        items: [
          { id: "sentence-question-1", value: "بۇ كىتابمۇ؟", meaning: "这是书吗？", reviewStatus: "待母语者审校" },
          { id: "sentence-question-2", value: "سىز ياخشىمۇ؟", meaning: "您好吗？", reviewStatus: "待母语者审校" },
          { id: "sentence-question-3", value: "سىز چاي ئىچەمسىز؟", meaning: "您喝茶吗？", reviewStatus: "待母语者审校" },
          { id: "sentence-question-4", value: "ئۇ كېلەمدۇ؟", meaning: "他/她来吗？", reviewStatus: "待母语者审校" }
        ]
      }
    ]
  },
  {
    id: "dialogue-theater",
    kind: "reading",
    readingKind: "dialogue",
    title: "第六单元：对话小剧场",
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
          { id: "dialogue-greeting-4", speaker: "B", value: "كۆرۈشكىچە.", meaning: "回头见。" }
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
    title: "第七单元：小故事",
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
          { id: "story-market-3", value: "بىز پەمىدۇر ۋە بەرەڭگە ئالدۇق.", meaning: "我们买了番茄和土豆。" },
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
    title: "第八单元：名人名言",
    subtitle: "10 位名人，每位 3 条学习句",
    status: "待来源审校",
    groups: [
      {
        id: "quote-mahmud-kashgari",
        title: "马赫穆德·喀什噶里",
        titleUyghur: "مەھمۇد قەشقىرى",
        intro: "11 世纪语言学家，《突厥语大词典》的作者，常被视为突厥语言文化的重要记录者。",
        items: [
          { id: "quote-mahmud-kashgari-line-1", value: "تىل بىر خەلقنى تونۇشنىڭ ئاچقۇچىدۇر.", meaning: "语言是了解一个民族的钥匙。", lesson: "学习母语，也是在认识自己的文化。", reviewStatus: "学习版译句，待来源审校" },
          { id: "quote-mahmud-kashgari-line-2", value: "لۇغەت خەلقنىڭ ئەسلىمىسىنى ساقلايدۇ.", meaning: "词典也能保存民族的记忆。", lesson: "词语记录生活，也记录来处。", reviewStatus: "学习版译句，待来源审校" },
          { id: "quote-mahmud-kashgari-line-3", value: "تىل ئۆگىنىش دۇنيانى كۆرۈشنى ئۆگىنىشتۇر.", meaning: "学习语言，就是学习看世界的方法。", lesson: "语言会改变我们理解世界的方式。", reviewStatus: "学习版译句，待来源审校" }
        ]
      },
      {
        id: "quote-yusuf-hajib",
        title: "玉素甫·哈斯·哈吉甫",
        titleUyghur: "يۈسۈپ خاس ھاجىپ",
        intro: "11 世纪思想家、诗人，《福乐智慧》的作者，作品重视知识、品德和治理智慧。",
        items: [
          { id: "quote-yusuf-hajib-line-1", value: "بىلىم ئادەمنىڭ يولىنى يورۇتىدۇ.", meaning: "知识照亮人的道路。", lesson: "学习让人看清方向。", reviewStatus: "学习版译句，待来源审校" },
          { id: "quote-yusuf-hajib-line-2", value: "ياخشى سۆز كۆڭۈلنى يورۇتىدۇ.", meaning: "好话能照亮人的心。", lesson: "语言也能带来温度。", reviewStatus: "学习版译句，待来源审校" },
          { id: "quote-yusuf-hajib-line-3", value: "ئەقىل بىلەن يول تاپىلىدۇ.", meaning: "有智慧，才能找到路。", lesson: "做选择时要先思考。", reviewStatus: "学习版译句，待来源审校" }
        ]
      },
      {
        id: "quote-ahmet-yukneki",
        title: "艾合买提·玉克乃克",
        titleUyghur: "ئەھمەد يۈكنەكى",
        intro: "中世纪文学人物，《真理的入门》常与他的名字联系在一起，作品重视礼仪和道德。",
        items: [
          { id: "quote-ahmet-yukneki-line-1", value: "ئەدەب ئادەمنىڭ زىننىتىدۇر.", meaning: "礼貌是人的装饰。", lesson: "说话有礼，是语言学习的重要习惯。", reviewStatus: "学习版译句，待来源审校" },
          { id: "quote-ahmet-yukneki-line-2", value: "ياخشى خۇلق ئادەمنى گۈزەل قىلىدۇ.", meaning: "好的品行让人更美。", lesson: "语言和品行常常连在一起。", reviewStatus: "学习版译句，待来源审校" },
          { id: "quote-ahmet-yukneki-line-3", value: "نادانلىق يولنى قاراڭغۇ قىلىدۇ.", meaning: "无知会让道路变暗。", lesson: "学习能让人少走弯路。", reviewStatus: "学习版译句，待来源审校" }
        ]
      },
      {
        id: "quote-molla-musa",
        title: "毛拉·穆萨·赛拉米",
        titleUyghur: "موللا مۇسا سايرامى",
        intro: "近代历史书写者，常被提到与新疆地方史、文化记录相关。",
        items: [
          { id: "quote-molla-musa-line-1", value: "تارىخنى بىلگەن ئادەم ئۆزىنى ياخشىراق تونۇيدۇ.", meaning: "懂得历史的人，更能认识自己。", lesson: "了解来处，才能看清自己。", reviewStatus: "学习版译句，待来源审校" },
          { id: "quote-molla-musa-line-2", value: "يېزىلغان سۆز ئۇنتۇلغان ئىشنى ساقلايدۇ.", meaning: "写下来的话能保存被遗忘的事。", lesson: "记录能保护记忆。", reviewStatus: "学习版译句，待来源审校" },
          { id: "quote-molla-musa-line-3", value: "ئۆتكەننى بىلىش بۈگۈنگە ياردەم بېرىدۇ.", meaning: "了解过去，会帮助今天。", lesson: "历史能给现在提供参照。", reviewStatus: "学习版译句，待来源审校" }
        ]
      },
      {
        id: "quote-abdulkhaliq-uyghur",
        title: "阿不都哈力克·维吾尔",
        titleUyghur: "ئابدۇخالىق ئۇيغۇر",
        intro: "20 世纪维吾尔诗人，作品常与觉醒、学习和青年精神联系在一起。",
        items: [
          { id: "quote-abdulkhaliq-uyghur-line-1", value: "ئويغانغان كۆڭۈل ئۆگىنىشتىن توختىمايدۇ.", meaning: "醒来的心不会停止学习。", lesson: "学习贵在一直向前。", reviewStatus: "学习版译句，待来源审校" },
          { id: "quote-abdulkhaliq-uyghur-line-2", value: "ياشلارنىڭ يولى بىلىم بىلەن ئېچىلىدۇ.", meaning: "青年的路靠知识打开。", lesson: "年轻时学习，会给未来打基础。", reviewStatus: "学习版译句，待来源审校" },
          { id: "quote-abdulkhaliq-uyghur-line-3", value: "ئانا تىل كۆڭۈلنى ئويغىتىدۇ.", meaning: "母语能唤醒内心。", lesson: "母语学习也关乎身份记忆。", reviewStatus: "学习版译句，待来源审校" }
        ]
      },
      {
        id: "quote-lutpulla-mutellip",
        title: "鲁特普拉·穆塔里甫",
        titleUyghur: "لۇتپۇللا مۇتەللىپ",
        intro: "20 世纪维吾尔诗人，常被记住为年轻、有激情的文学人物。",
        items: [
          { id: "quote-lutpulla-mutellip-line-1", value: "ياشلىق ئۈمىد بىلەن گۈزەل.", meaning: "青春因希望而美丽。", lesson: "学习也需要希望。", reviewStatus: "学习版译句，待来源审校" },
          { id: "quote-lutpulla-mutellip-line-2", value: "يۈرەكتىكى ئوت سۆزگە ئايلىنىدۇ.", meaning: "心里的火会变成语言。", lesson: "表达来自真实的情感。", reviewStatus: "学习版译句，待来源审校" },
          { id: "quote-lutpulla-mutellip-line-3", value: "ۋەتەننى سۆيگەن ئادەم تىلىنىمۇ سۆيىدۇ.", meaning: "热爱家园的人，也会热爱自己的语言。", lesson: "语言和情感常常相连。", reviewStatus: "学习版译句，待来源审校" }
        ]
      },
      {
        id: "quote-abdurehim-otkur",
        title: "阿不都热依木·吾提库尔",
        titleUyghur: "ئابدۇرېھىم ئۆتكۈر",
        intro: "现代维吾尔作家、诗人，作品常与历史记忆、足迹和文化传承联系在一起。",
        items: [
          { id: "quote-abdurehim-otkur-line-1", value: "ئىز قالدۇرۇش ئۈچۈن قەدەم بېسىش كېرەك.", meaning: "想留下足迹，就要迈出脚步。", lesson: "每天练一点，也是在留下足迹。", reviewStatus: "学习版译句，待来源审校" },
          { id: "quote-abdurehim-otkur-line-2", value: "ھەر قەدەم بىر يولنىڭ باشلىنىشى.", meaning: "每一步都是一条路的开始。", lesson: "小进步也值得认真对待。", reviewStatus: "学习版译句，待来源审校" },
          { id: "quote-abdurehim-otkur-line-3", value: "ئەسلىمە يوقالمىسا، يولمۇ يوقالمايدۇ.", meaning: "记忆不丢，路就不会丢。", lesson: "文化记忆会给人方向。", reviewStatus: "学习版译句，待来源审校" }
        ]
      },
      {
        id: "quote-zunun-qadiri",
        title: "祖农·卡迪尔",
        titleUyghur: "زۇنۇن قادىرى",
        intro: "现代维吾尔作家，作品常与小说、戏剧和日常生活叙事联系在一起。",
        items: [
          { id: "quote-zunun-qadiri-line-1", value: "ھېكايە ئادەمنىڭ كۆڭلىنى ئاچىدۇ.", meaning: "故事能打开人的心。", lesson: "故事能把词语放回生活。", reviewStatus: "学习版译句，待来源审校" },
          { id: "quote-zunun-qadiri-line-2", value: "كىچىك ئادەمنىڭ تۇرمۇشىمۇ چوڭ مەنىگە ئىگە.", meaning: "普通人的生活也有大的意义。", lesson: "日常生活值得被表达。", reviewStatus: "学习版译句，待来源审校" },
          { id: "quote-zunun-qadiri-line-3", value: "سەھنە ئادەمنىڭ ئاۋازىنى ئاڭلىتىدۇ.", meaning: "舞台能让人的声音被听见。", lesson: "表达需要被看见和听见。", reviewStatus: "学习版译句，待来源审校" }
        ]
      },
      {
        id: "quote-zordun-sabir",
        title: "祖尔东·萨比尔",
        titleUyghur: "زوردۇن سابىر",
        intro: "现代维吾尔作家，常以小说和幽默、生活观察被读者记住。",
        items: [
          { id: "quote-zordun-sabir-line-1", value: "كۈلكە ھەقىقەتنى يۇمشاق ئېيتىدۇ.", meaning: "笑声能温和地说出真实。", lesson: "幽默也能表达认真。", reviewStatus: "学习版译句，待来源审校" },
          { id: "quote-zordun-sabir-line-2", value: "تۇرمۇشنى كۆزىتىش يازغۇچىنىڭ دەرسى.", meaning: "观察生活，是作家的课堂。", lesson: "语言从生活里来。", reviewStatus: "学习版译句，待来源审校" },
          { id: "quote-zordun-sabir-line-3", value: "ئاددىي سۆز چوڭ مەنىنى كۆتۈرىدۇ.", meaning: "简单的话也能承载大的意思。", lesson: "简单表达也可以有力量。", reviewStatus: "学习版译句，待来源审校" }
        ]
      },
      {
        id: "quote-teyipjan-eliyev",
        title: "铁依甫江·艾力耶夫",
        titleUyghur: "تېيىپجان ئېلىيېف",
        intro: "现代维吾尔诗人，常与诗歌、抒情和文学教育联系在一起。",
        items: [
          { id: "quote-teyipjan-eliyev-line-1", value: "شېئىر يۈرەكتىكى سۆزنى ئاڭلىتىدۇ.", meaning: "诗让心里的话被听见。", lesson: "诗歌适合先感受语气。", reviewStatus: "学习版译句，待来源审校" },
          { id: "quote-teyipjan-eliyev-line-2", value: "گۈزەل سۆز كۆڭۈلگە گۈل تىكىدۇ.", meaning: "美好的话会在心里种花。", lesson: "好语言能留下美感。", reviewStatus: "学习版译句，待来源审校" },
          { id: "quote-teyipjan-eliyev-line-3", value: "شېئىر تىلنىڭ ناخشىسىدۇر.", meaning: "诗是语言的歌。", lesson: "诗歌让语言更有声音。", reviewStatus: "学习版译句，待来源审校" }
        ]
      }
    ]
  },
  {
    id: "uyghur-proverbs",
    kind: "reading",
    readingKind: "proverb",
    title: "第九单元：维吾尔谚语",
    subtitle: "10 个主题，每组 3 条智慧短句",
    status: "待母语者审校",
    groups: [
      {
        id: "proverb-bilim-kuch",
        title: "知识就是力量",
        items: [
          { id: "proverb-bilim-kuch-line-1", value: "بىلىم كۈچ.", meaning: "知识就是力量。", lesson: "学习越扎实，做事越有底气。", reviewStatus: "待母语者审校" },
          { id: "proverb-bilim-kuch-line-2", value: "ئۆگەنگەن نەرسە يوقاپ كەتمەيدۇ.", meaning: "学到的东西不会丢。", lesson: "真正掌握的知识会留下来。", reviewStatus: "待母语者审校" },
          { id: "proverb-bilim-kuch-line-3", value: "ئۆگەنمىگەن ئادەمنىڭ يولى تارىيىدۇ.", meaning: "不学的人，路会变窄。", lesson: "学习能给人生更多选择。", reviewStatus: "待母语者审校" }
        ]
      },
      {
        id: "proverb-yaxshi-soz",
        title: "好话暖心",
        items: [
          { id: "proverb-yaxshi-soz-line-1", value: "ياخشى سۆز جان ئوزۇقى.", meaning: "好话是心灵的食粮。", lesson: "温和的话能让人舒服。", reviewStatus: "待母语者审校" },
          { id: "proverb-yaxshi-soz-line-2", value: "ياخشى گەپ يۈرەكنى ئىللىتىدۇ.", meaning: "好话能暖人心。", lesson: "说话方式会影响关系。", reviewStatus: "待母语者审校" },
          { id: "proverb-yaxshi-soz-line-3", value: "تىلدىكى شېرىنلىك كۆڭۈلگە بارىدۇ.", meaning: "话里的甜，会走进心里。", lesson: "礼貌表达更容易被接受。", reviewStatus: "待母语者审校" }
        ]
      },
      {
        id: "proverb-aqil",
        title: "智慧不看年龄",
        items: [
          { id: "proverb-aqil-line-1", value: "ئەقىل ياشتا ئەمەس، باشتا.", meaning: "智慧不在年龄，而在头脑。", lesson: "重要的是思考和判断。", reviewStatus: "待母语者审校" },
          { id: "proverb-aqil-line-2", value: "ئەقىللىق ئادەم ئالدىنى ئويلايدۇ.", meaning: "聪明人会提前思考。", lesson: "先想清楚，再行动。", reviewStatus: "待母语者审校" },
          { id: "proverb-aqil-line-3", value: "سۆزنى ئويلاپ سۆزلە.", meaning: "说话前先想一想。", lesson: "谨慎说话能减少误会。", reviewStatus: "待母语者审校" }
        ]
      },
      {
        id: "proverb-birlik",
        title: "团结有力量",
        items: [
          { id: "proverb-birlik-line-1", value: "بىرلىك بار يەردە كۈچ بار.", meaning: "有团结的地方就有力量。", lesson: "合作比单打独斗更强。", reviewStatus: "待母语者审校" },
          { id: "proverb-birlik-line-2", value: "يالغۇز قولدىن ئاۋاز چىقماس.", meaning: "一只手拍不响。", lesson: "很多事需要一起完成。", reviewStatus: "待母语者审校" },
          { id: "proverb-birlik-line-3", value: "كۆپنىڭ كۈچى كۆپ.", meaning: "人多力量大。", lesson: "集体能带来更大的力量。", reviewStatus: "待母语者审校" }
        ]
      },
      {
        id: "proverb-emgek",
        title: "劳动受尊敬",
        items: [
          { id: "proverb-emgek-line-1", value: "ئەمگەك قىلغان ئەزىز.", meaning: "劳动的人值得尊敬。", lesson: "努力和付出本身就有价值。", reviewStatus: "待母语者审校" },
          { id: "proverb-emgek-line-2", value: "ئەمگەك مېۋىسى تاتلىق.", meaning: "劳动的果实是甜的。", lesson: "付出之后才会有收获。", reviewStatus: "待母语者审校" },
          { id: "proverb-emgek-line-3", value: "تېرىقماي ھوسۇل بولماس.", meaning: "不播种，就没有收成。", lesson: "结果来自前面的努力。", reviewStatus: "待母语者审校" }
        ]
      },
      {
        id: "proverb-dost",
        title: "朋友见真心",
        items: [
          { id: "proverb-dost-line-1", value: "دوست قىيىن كۈندە بىلىنەر.", meaning: "朋友在困难时才看得出来。", lesson: "真正的朋友会在需要时出现。", reviewStatus: "待母语者审校" },
          { id: "proverb-dost-line-2", value: "ياخشى دوست يولدا قالدۇرماس.", meaning: "好朋友不会把你丢在路上。", lesson: "朋友之间要互相扶持。", reviewStatus: "待母语者审校" },
          { id: "proverb-dost-line-3", value: "دوست سۆزى ئاچچىق بولسىمۇ پايدىلىق.", meaning: "朋友的话即使苦，也有益。", lesson: "真诚提醒有时不一定顺耳。", reviewStatus: "待母语者审校" }
        ]
      },
      {
        id: "proverb-kitap",
        title: "书是知识源泉",
        items: [
          { id: "proverb-kitap-line-1", value: "كىتاب بىلىمنىڭ بۇلىقى.", meaning: "书是知识的泉源。", lesson: "读书能不断得到新知识。", reviewStatus: "待母语者审校" },
          { id: "proverb-kitap-line-2", value: "كىتاب ئوقۇغان كۆپ بىلىدۇ.", meaning: "读书的人知道得多。", lesson: "阅读会扩展见识。", reviewStatus: "待母语者审校" },
          { id: "proverb-kitap-line-3", value: "كىتاب ئادەمنىڭ جىمجىت دوستى.", meaning: "书是人的安静朋友。", lesson: "书会陪人慢慢成长。", reviewStatus: "待母语者审校" }
        ]
      },
      {
        id: "proverb-sabr",
        title: "耐心有回报",
        items: [
          { id: "proverb-sabr-line-1", value: "سەۋرنىڭ ئاخىرى ئالتۇن.", meaning: "耐心的最后是金子。", lesson: "坚持常常会得到好结果。", reviewStatus: "待母语者审校" },
          { id: "proverb-sabr-line-2", value: "سەۋر قىلغان يەتكەن.", meaning: "有耐心的人能到达。", lesson: "慢慢来，也能走到目标。", reviewStatus: "待母语者审校" },
          { id: "proverb-sabr-line-3", value: "ئالدىرىغان ئىش پۈتمەس.", meaning: "太着急，事情反而做不好。", lesson: "急躁会影响结果。", reviewStatus: "待母语者审校" }
        ]
      },
      {
        id: "proverb-ana-til",
        title: "母语连着心",
        items: [
          { id: "proverb-ana-til-line-1", value: "ئانا تىل جان تىلى.", meaning: "母语是心灵的语言。", lesson: "母语连接家庭、记忆和身份。", reviewStatus: "待母语者审校" },
          { id: "proverb-ana-til-line-2", value: "ئانا تىلىنى بىلگەن ئۆزىنى بىلىدۇ.", meaning: "懂母语的人，更懂自己。", lesson: "语言也会帮助人认识身份。", reviewStatus: "待母语者审校" },
          { id: "proverb-ana-til-line-3", value: "تىل بار يەردە ئەسلىمە بار.", meaning: "有语言的地方，就有记忆。", lesson: "语言保存着生活痕迹。", reviewStatus: "待母语者审校" }
        ]
      },
      {
        id: "proverb-qaduwq",
        title: "饮水不忘源",
        items: [
          { id: "proverb-qaduwq-line-1", value: "سۇ ئىچكەن قۇدۇقنى ئۇنتۇما.", meaning: "不要忘记喝过水的井。", lesson: "得到帮助后，要记得来源。", reviewStatus: "待母语者审校" },
          { id: "proverb-qaduwq-line-2", value: "ياخشىلىقنى ئۇنتۇما.", meaning: "不要忘记别人的好。", lesson: "感恩会让关系更长久。", reviewStatus: "待母语者审校" },
          { id: "proverb-qaduwq-line-3", value: "رەھمەت ئېيتقان كۆڭۈل يېقىنلىشىدۇ.", meaning: "会说谢谢，心就会更近。", lesson: "感谢是一种很重要的表达。", reviewStatus: "待母语者审校" }
        ]
      }
    ]
  }
];

  window.ANA_TILIM_READING = {
    readingUnits
  };
})();
