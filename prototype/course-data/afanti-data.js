(() => {
  const unit = {
    id: "afanti-stories",
    title: "阿凡提小故事",
    subtitle: "六篇逐步变难、理智且有教育意义的无音频阅读",
    kind: "afanti",
    noAudio: true
  };
  const stories = [
  {
    "id": "listen-before-judge",
    "sequence": 1,
    "primaryTheme": "先听完整事实，再作判断",
    "title": {
      "uyghur": "ئاۋۋال ئاخىرىغىچە ئاڭلا",
      "latin": "Awwal axirighiche angla",
      "zh": "先听到最后"
    },
    "uyghur": {
      "paragraphs": [
        "بىر كۈنى، ئىككى بالا بازاردا تالاشتى. ئەنۋەر: «مەريەم مېنىڭ سېۋىتىمنى بۇزدى»، دېدى. مەريەم جاۋاب بەرمەكچى بولدى، ئەمما ئەنۋەر ئۇنى سۆزلەتمىدى.",
        "ئەپەندى ئىككى بالىنى جىمجىت ئاڭلىدى. مەريەم: «شامال سېۋەتنى يىقىتىپ، تۇتقۇچىنى سۇندۇردى. مەن پەقەت ياردەم قىلماقچى ئىدىم»، دېدى. يېنىدا بىر دۇكانچى بار ئىدى. ئۇ: «مەن كۆردۈم. شامال سېۋەتنى بۇزدى»، دېدى.",
        "ئەپەندى: «سۆزنىڭ يېرىمىنى ئاڭلاپ ھۆكۈم قىلما. ئاۋۋال ئاخىرىغىچە ئاڭلا»، دېدى. ئەنۋەر مەريەمدىن كەچۈرۈم سورىدى."
      ]
    },
    "latin": {
      "paragraphs": [
        "Bir küni, ikki bala bazarda talashti. Enwer: «Meryem mëning sëwitimni buzdi», dëdi. Meryem jawab bermekchi boldi, emma Enwer uni sözletmidi.",
        "Ependi ikki balini jimjit anglidi. Meryem: «Shamal sëwetni yiqitip, tutquchini sundurdi. Men peqet yardem qilmaqchi idim», dëdi. Yënida bir dukanchi bar idi. U: «Men kördüm. Shamal sëwetni buzdi», dëdi.",
        "Ependi: «Sözning yërimini anglap höküm qilma. Awwal axirighiche angla», dëdi. Enwer Meryemdin kechürüm soridi."
      ]
    },
    "zh": {
      "paragraphs": [
        "一天，两个孩子在市场上争吵。安瓦尔说：“玛丽亚姆弄坏了我的篮子。”玛丽亚姆想回答，可安瓦尔不让她说。",
        "阿凡提安静地听了两个孩子的话。玛丽亚姆说：“风把篮子吹倒，摔坏了提手。我只是想帮忙。”旁边有一位店主。他说：“我看见了。是风弄坏了篮子。”",
        "阿凡提说：“不要只听半句话就下判断。先听到最后。”安瓦尔向玛丽亚姆道了歉。"
      ]
    },
    "wordRange": [
      60,
      80
    ],
    "actualWordCount": 63,
    "noAudio": true,
    "question": {
      "answerId": "A",
      "uyghur": {
        "prompt": "ئەنۋەر نېمە قىلىشى كېرەك ئىدى؟",
        "choices": [
          {
            "id": "A",
            "text": "مەريەمنىڭ سۆزىنى ئاخىرىغىچە ئاڭلاش"
          },
          {
            "id": "B",
            "text": "ئۇنى دەرھال ئەيىبلەش"
          },
          {
            "id": "C",
            "text": "ھېچنېمە دېمەي كېتىش"
          }
        ],
        "correctFeedback": "توغرا. پۈتۈن سۆزنى ئاڭلاش ئادىل ھۆكۈمگە ياردەم بېرىدۇ.",
        "retryFeedback": "قايتا ئويلاڭ. ئالدىراپ ئەيىبلەش ھەقىقەتنى يوشۇرۇپ قويۇشى مۇمكىن."
      },
      "latin": {
        "prompt": "Enwer nëme qilishi kërek idi?",
        "choices": [
          {
            "id": "A",
            "text": "Meryemning sözini axirighiche anglash"
          },
          {
            "id": "B",
            "text": "Uni derhal eyiblesh"
          },
          {
            "id": "C",
            "text": "Hëchnëme dëmey këtish"
          }
        ],
        "correctFeedback": "Toghra. Pütün sözni anglash adil hökümge yardem bëridu.",
        "retryFeedback": "Qayta oylang. Aldirap eyiblesh heqiqetni yoshurup qoyushi mumkin."
      },
      "zh": {
        "prompt": "安瓦尔原本应该怎么做？",
        "choices": [
          {
            "id": "A",
            "text": "把玛丽亚姆的话听完"
          },
          {
            "id": "B",
            "text": "立刻责怪她"
          },
          {
            "id": "C",
            "text": "什么也不说就离开"
          }
        ],
        "correctFeedback": "正确。听完整段话有助于作出公正判断。",
        "retryFeedback": "再想一想。急着责怪别人，可能会遮住事实。"
      }
    },
    "moral": {
      "uyghur": "ئاۋۋال تولۇق ئاڭلا، ئاندىن ھۆكۈم قىل.",
      "latin": "Awwal toluq angla, andin höküm qil.",
      "zh": "先完整倾听，再作判断。"
    },
    "review": {
      "uyghurLanguage": "approved",
      "translationMeaning": "approved",
      "educationAndCulture": "approved",
      "originality": "approved",
      "reviewedBy": "user-product-owner-confirmation",
      "reviewedAt": "2026-08-10"
    }
  },
  {
    "id": "fair-bowl-water",
    "sequence": 2,
    "primaryTheme": "公平要看共同需要，也尊重不同劳动",
    "title": {
      "uyghur": "بىر چىنە سۇدىكى ئادىللىق",
      "latin": "Bir chine sudiki adilliq",
      "zh": "一碗水里的公平"
    },
    "uyghur": {
      "paragraphs": [
        "بىر ئىسسىق كۈنى، ئەپەندى بىلەن ئىككى بالا باغدا ئىشلىدى. سەمەت سۇ توشۇدى، زۆھرە ياش كۆچەتلەرنى تىكتى. چۈشتە ئىچىدىغان سۇدىن بىر چىنە قالدى. ھەر ئىككىسى ئۇسسىغان ئىدى.",
        "سەمەت: «مەن ئېغىر چېلەكنى كۆتۈردۈم، سۇنىڭ كۆپى ماڭا»، دېدى. زۆھرە: «مەنمۇ كۈن بويى ئىشلىدىم»، دېدى. ئەپەندى سۇنى تەڭ ئىككىگە بۆلدى.",
        "ئۇ: «سەمەت سۇ توشۇدى. زۆھرە كۆچەت تىكتى. ئىككىڭلارمۇ ئىشلىدىڭلار، ئىككىڭلارمۇ ئۇسسىدىڭلار. سۇنى تەڭ ئىچىڭلار»، دېدى. ئۇلار سۇنى ئىچتى. ئاندىن ئۇلار بىللە كۆچەتلەرگە سۇ قويدى."
      ]
    },
    "latin": {
      "paragraphs": [
        "Bir issiq küni, Ependi bilen ikki bala baghda ishlidi. Semet su toshudi, Zöhre yash köchetlerni tikti. Chüshte ichidighan sudin bir chine qaldi. Her ikkisi ussighan idi.",
        "Semet: «Men ëghir chëlekni kötürdüm, suning köpi manga», dëdi. Zöhre: «Menmu kün boyi ishlidim», dëdi. Ependi suni teng ikkige böldi.",
        "U: «Semet su toshudi. Zöhre köchet tikti. Ikkinglarmu ishlidinglar, ikkinglarmu ussidinglar. Suni teng ichinglar», dëdi. Ular suni ichti. Andin ular bille köchetlerge su qoydi."
      ]
    },
    "zh": {
      "paragraphs": [
        "一个炎热的日子，阿凡提和两个孩子在园子里劳动。萨麦提运水，祖赫拉栽种小树苗。中午，只剩一碗饮用水。两个人都很渴。",
        "萨麦提说：“我提了沉重的水桶，应该多给我一些水。”祖赫拉说：“我也劳动了一整天。”阿凡提把水平均分成两份。",
        "他说：“萨麦提运了水。祖赫拉栽了树苗。你们都劳动了，也都口渴。把水平均喝掉吧。”他们喝了水，然后一起给树苗浇水。"
      ]
    },
    "wordRange": [
      70,
      90
    ],
    "actualWordCount": 70,
    "noAudio": true,
    "question": {
      "answerId": "C",
      "uyghur": {
        "prompt": "ئەپەندى نېمىشقا سۇنى تەڭ بۆلدى؟",
        "choices": [
          {
            "id": "A",
            "text": "سەمەت چېلەكنى كۆتۈرگەنلىكى ئۈچۈن"
          },
          {
            "id": "B",
            "text": "سۇنى قالدۇرۇپ قويۇش ئۈچۈن"
          },
          {
            "id": "C",
            "text": "ھەر ئىككىسى ئەمگەك قىلغان ۋە ئۇسسىغانلىقى ئۈچۈن"
          }
        ],
        "correctFeedback": "توغرا. ئادىللىق ئىككى بالىنىڭ ئەمگىكى ۋە ئېھتىياجىنى بىللە كۆردى.",
        "retryFeedback": "قايتا ئوقۇڭ. ئەپەندى پەقەت چېلەكنىلا ئەمەس، ئىككىسىنىڭ ئۇسسۇزلۇقىنىمۇ ئويلىدى."
      },
      "latin": {
        "prompt": "Ependi nëmishqa suni teng böldi?",
        "choices": [
          {
            "id": "A",
            "text": "Semet chëlekni kötürgenliki üchün"
          },
          {
            "id": "B",
            "text": "Suni qaldurup qoyush üchün"
          },
          {
            "id": "C",
            "text": "Her ikkisi emgek qilghan we ussighanliqi üchün"
          }
        ],
        "correctFeedback": "Toghra. Adilliq ikki balining emgiki we ëhtiyajini bille kördi.",
        "retryFeedback": "Qayta oqung. Ependi peqet chëleknila emes, ikkisining ussuzluqinimu oylidi."
      },
      "zh": {
        "prompt": "阿凡提为什么把水平均分开？",
        "choices": [
          {
            "id": "A",
            "text": "因为萨麦提提了水桶"
          },
          {
            "id": "B",
            "text": "为了把水留下"
          },
          {
            "id": "C",
            "text": "因为两个人都劳动了，也都口渴"
          }
        ],
        "correctFeedback": "正确。公平同时看见了两个孩子的劳动和需要。",
        "retryFeedback": "再读一遍。阿凡提不只看水桶，也考虑了两个人的口渴。"
      }
    },
    "moral": {
      "uyghur": "ئادىللىق ھەر بىر ئادەمنىڭ ئەمگىكى ۋە ئېھتىياجىنى كۆرۈشتىن باشلىنىدۇ.",
      "latin": "Adilliq her bir ademning emgiki we ëhtiyajini körüshtin bashlinidu.",
      "zh": "公平从看见每个人的劳动和需要开始。"
    },
    "review": {
      "uyghurLanguage": "approved",
      "translationMeaning": "approved",
      "educationAndCulture": "approved",
      "originality": "approved",
      "reviewedBy": "user-product-owner-confirmation",
      "reviewedAt": "2026-08-10"
    }
  },
  {
    "id": "unverified-words",
    "sequence": 3,
    "primaryTheme": "传播消息前先找证据，谣言会伤害真实的人",
    "title": {
      "uyghur": "دەلىلسىز سۆز",
      "latin": "Delilsiz söz",
      "zh": "没有证据的话"
    },
    "uyghur": {
      "paragraphs": [
        "بازاردا «ناۋايخانىدىكى ئۇن پاكىز ئەمەس» دېگەن گەپ تارقالدى. ھېچكىم نان سېتىۋالغىلى بارمىدى. ناۋاي قايغۇرۇپ، ئەپەندىنىڭ يېنىغا كەلدى. ئۇ: «مەن ئۇننى پاكىز جايدا ساقلايمەن، لېكىن كىشىلەر ماڭا ئىشەنمەيۋاتىدۇ»، دېدى.",
        "ئەپەندى بازارغا بېرىپ: «بۇ گەپنى كىم ئۆز كۆزى بىلەن كۆردى؟» دەپ سورىدى. بىرى قوشنىسىدىن ئاڭلىغان، قوشنىسى يەنە بىر يولۇچىدىن ئاڭلىغان ئىدى. ھېچكىمدە دەلىل يوق ئىدى.",
        "ناۋاينىڭ ماقۇللۇقى بىلەن، ئەپەندى ۋە كىشىلەر ئۇننى، خالتىلارنى ۋە ساقلاش ئۆيىنى تەكشۈردى. ھەممىسى پاكىز ئىدى. ئۇ: «دەلىلسىز سۆزنى تارقاتماڭلار. بىر ئېغىز گەپ ئادەمنىڭ ئەمگىكىگە زىيان يەتكۈزۈشى مۇمكىن»، دېدى. كىشىلەر ناۋايدىن كەچۈرۈم سورىدى."
      ]
    },
    "latin": {
      "paragraphs": [
        "Bazarda «Nawayxanidiki un pakiz emes» dëgen gep tarqaldi. Hëchkim nan sëtiwalghili barmidi. Naway qayghurup, Ependining yënigha keldi. U: «Men unni pakiz jayda saqlaymen, lëkin kishiler manga ishenmeywatidu», dëdi.",
        "Ependi bazargha bërip: «Bu gepni kim öz közi bilen kördi?» dep soridi. Biri qoshnisidin anglighan, qoshnisi yene bir yoluchidin anglighan idi. Hëchkimde delil yoq idi.",
        "Nawayning maqulluqi bilen, Ependi we kishiler unni, xaltilarni we saqlash öyini tekshürdi. Hemmisi pakiz idi. U: «Delilsiz sözni tarqatmanglar. Bir ëghiz gep ademning emgikige ziyan yetküzüshi mumkin», dëdi. Kishiler nawaydin kechürüm soridi."
      ]
    },
    "zh": {
      "paragraphs": [
        "市场上传开了一句话：“面包房里的面粉不干净。”再也没有人去买馕。面包师很难过，来到阿凡提身边。他说：“我把面粉存放在干净的地方，可大家不相信我了。”",
        "阿凡提来到市场，问：“谁亲眼看见了这件事？”一个人是听邻居说的，邻居又是听一个过路人说的。谁都没有证据。",
        "得到面包师同意后，阿凡提和大家检查了面粉、面粉袋和储藏室。它们都很干净。他说：“不要传播没有证据的话。一句话可能伤害一个人的劳动成果。”大家向面包师道了歉。"
      ]
    },
    "wordRange": [
      80,
      100
    ],
    "actualWordCount": 85,
    "noAudio": true,
    "question": {
      "answerId": "B",
      "uyghur": {
        "prompt": "ئەپەندى بۇ گەپنىڭ راستلىقىنى قانداق تەكشۈردى؟",
        "choices": [
          {
            "id": "A",
            "text": "گەپنى دەرھال تارقاتتى"
          },
          {
            "id": "B",
            "text": "گۇۋاھ سوراپ، ناۋايخانىنى تەكشۈردى"
          },
          {
            "id": "C",
            "text": "ناۋايخانىنى تاقىدى"
          }
        ],
        "correctFeedback": "توغرا. ئۇ ئاڭلىغان گەپكە ئەمەس، كۆرگىلى بولىدىغان دەلىلگە قارىدى.",
        "retryFeedback": "قايتا ئوقۇڭ. بازاردا گەپ كۆپ ئىدى، ئەمما دەلىلنى تەكشۈرگەن ئىش پەقەت بىرسى."
      },
      "latin": {
        "prompt": "Ependi bu gepning rastliqini qandaq tekshürdi?",
        "choices": [
          {
            "id": "A",
            "text": "Gepni derhal tarqatti"
          },
          {
            "id": "B",
            "text": "Guwah sorap, nawayxanini tekshürdi"
          },
          {
            "id": "C",
            "text": "Nawayxanini taqidi"
          }
        ],
        "correctFeedback": "Toghra. U anglighan gepke emes, körgili bolidighan delilge qaridi.",
        "retryFeedback": "Qayta oqung. Bazarda gep köp idi, emma delilni tekshürgen ish peqet birsi."
      },
      "zh": {
        "prompt": "阿凡提怎样核实这句话是真是假？",
        "choices": [
          {
            "id": "A",
            "text": "马上传播这句话"
          },
          {
            "id": "B",
            "text": "询问目击者并检查面包房"
          },
          {
            "id": "C",
            "text": "关闭面包房"
          }
        ],
        "correctFeedback": "正确。他没有只信听来的话，而是查看可以验证的证据。",
        "retryFeedback": "再读一遍。市场上话很多，但只有一个做法是在核实证据。"
      }
    },
    "moral": {
      "uyghur": "دەلىل يوق سۆزنى راست دەپ تارقاتما.",
      "latin": "Delil yoq sözni rast dep tarqatma.",
      "zh": "不要把没有证据的话当成事实传播。"
    },
    "review": {
      "uyghurLanguage": "approved",
      "translationMeaning": "approved",
      "educationAndCulture": "approved",
      "originality": "approved",
      "reviewedBy": "user-product-owner-confirmation",
      "reviewedAt": "2026-08-10"
    }
  },
  {
    "id": "precious-time",
    "sequence": 4,
    "primaryTheme": "时间失去后不能用金钱买回，重要的事要按时做",
    "title": {
      "uyghur": "ئەڭ قىممەت ۋاقىت",
      "latin": "Eng qimmet waqit",
      "zh": "最珍贵的时间"
    },
    "uyghur": {
      "paragraphs": [
        "بىر باي ئادەم ئەپەندىدىن: «دۇنيادىكى ئەڭ قىممەت نەرسە نېمە؟ ئالتۇنمۇ، ياخشى ئاتمۇ؟» دەپ سورىدى. ئەپەندى ئۇنىڭ ئەتىسى مەيداندا كارۋان بىلەن سودا قىلىدىغانلىقىنى بىلەتتى. ئۇ: «كۈن چىققاندا مەيدانغا كېلىڭ، جاۋابنى شۇ يەردە بېرىمەن»، دېدى.",
        "ئەتىسى باي ئادەم ئالتۇنلىرىنى قايتا-قايتا ساناپ، كېچىكىپ قالدى. ئۇ مەيدانغا كەلگەندە، كارۋان يولغا چىقىپ كەتكەن ئىدى. ئۇ مۇھىم سودىنى قولدىن بېرىپ قويدى. باي ئادەم ئاچچىقلىنىپ: «بۇ پۇرسەتنى پۇل بىلەن قايتۇرۇپ كېلەمدىمەن؟» دەپ سورىدى.",
        "ئەپەندى: «پۇل بىلەن يېڭى نەرسە سېتىۋالغىلى بولىدۇ، ئەمما ئۆتكەن ۋاقىتنى سېتىۋالغىلى بولمايدۇ. مۇھىم ئىشنى ۋاقتىدا قىل»، دېدى. باي ئادەم ئالتۇنغا قارىدى ۋە تۇنجى قېتىم ۋاقتىنىمۇ قەدىرلەشنى ئۆگەندى."
      ]
    },
    "latin": {
      "paragraphs": [
        "Bir bay adem Ependidin: «Dunyadiki eng qimmet nerse nëme? Altunmu, yaxshi atmu?» dep soridi. Ependi uning etisi meydanda karwan bilen soda qilidighanliqini biletti. U: «Kün chiqqanda meydangha këling, jawabni shu yerde bërimen», dëdi.",
        "Etisi bay adem altunlirini qayta-qayta sanap, këchikip qaldi. U meydangha kelgende, karwan yolgha chiqip ketken idi. U muhim sodini qoldin bërip qoydi. Bay adem achchiqlinip: «Bu pursetni pul bilen qayturup këlemdimen?» dep soridi.",
        "Ependi: «Pul bilen yëngi nerse sëtiwalghili bolidu, emma ötken waqitni sëtiwalghili bolmaydu. Muhim ishni waqtida qil», dëdi. Bay adem altungha qaridi we tunji qëtim waqtinimu qedirleshni ögendi."
      ]
    },
    "zh": {
      "paragraphs": [
        "一个富人问阿凡提：“世上最珍贵的东西是什么？是黄金，还是一匹好马？”阿凡提知道他第二天要在广场与商队交易，便说：“太阳升起时请到广场来，我在那里回答你。”",
        "第二天，富人一遍遍数着金币，结果迟到了。他来到广场时，商队已经出发。他错过了一笔重要交易。富人生气地问：“我能用钱把这个机会买回来吗？”",
        "阿凡提说：“钱可以买到新的东西，却买不回已经过去的时间。重要的事要按时做。”富人看着黄金，第一次学会也要珍惜自己的时间。"
      ]
    },
    "wordRange": [
      90,
      110
    ],
    "actualWordCount": 93,
    "noAudio": true,
    "question": {
      "answerId": "B",
      "uyghur": {
        "prompt": "باي ئادەم نېمىشقا مۇھىم سودىنى قولدىن بېرىپ قويدى؟",
        "choices": [
          {
            "id": "A",
            "text": "ئاتى بەك ئاستا ماڭغانلىقى ئۈچۈن"
          },
          {
            "id": "B",
            "text": "ئالتۇنلىرىنى ساناپ كېچىكىپ قالغانلىقى ئۈچۈن"
          },
          {
            "id": "C",
            "text": "ئەپەندى ئۇنى چاقىرمىغانلىقى ئۈچۈن"
          }
        ],
        "correctFeedback": "توغرا. ئۇ پۇلنى ساناشقا ۋاقىت سەرپ قىلىپ، قايتمايدىغان پۇرسەتنى قولدىن بېرىپ قويدى.",
        "retryFeedback": "قايتا ئوقۇڭ. كارۋان دەل ئۇ كېچىكىپ كەلگەندە ئاللىقاچان يولغا چىققان ئىدى."
      },
      "latin": {
        "prompt": "Bay adem nëmishqa muhim sodini qoldin bërip qoydi?",
        "choices": [
          {
            "id": "A",
            "text": "Ati bek asta mangghanliqi üchün"
          },
          {
            "id": "B",
            "text": "Altunlirini sanap këchikip qalghanliqi üchün"
          },
          {
            "id": "C",
            "text": "Ependi uni chaqirmighanliqi üchün"
          }
        ],
        "correctFeedback": "Toghra. U pulni sanashqa waqit serp qilip, qaytmaydighan pursetni qoldin bërip qoydi.",
        "retryFeedback": "Qayta oqung. Karwan del u këchikip kelgende alliqachan yolgha chiqqan idi."
      },
      "zh": {
        "prompt": "富人为什么错过了重要交易？",
        "choices": [
          {
            "id": "A",
            "text": "因为他的马走得太慢"
          },
          {
            "id": "B",
            "text": "因为数金币而迟到"
          },
          {
            "id": "C",
            "text": "因为阿凡提没有叫他"
          }
        ],
        "correctFeedback": "正确。他把时间花在数钱上，错过了不会回来的机会。",
        "retryFeedback": "再读一遍。他迟到时，商队已经出发了。"
      }
    },
    "moral": {
      "uyghur": "ۋاقىت قايتىپ كەلمەيدۇ، شۇڭا مۇھىم ئىشنى ۋاقتىدا قىل.",
      "latin": "Waqit qaytip kelmeydu, shunga muhim ishni waqtida qil.",
      "zh": "时间不会回来，所以重要的事要按时做。"
    },
    "review": {
      "uyghurLanguage": "approved",
      "translationMeaning": "approved",
      "educationAndCulture": "approved",
      "originality": "approved",
      "reviewedBy": "user-product-owner-confirmation",
      "reviewedAt": "2026-08-10"
    }
  },
  {
    "id": "neighbors-tree",
    "sequence": 5,
    "primaryTheme": "共同受益的事物需要共同照料、协商分享",
    "title": {
      "uyghur": "قوشنىلارنىڭ بىر دەرەخى",
      "latin": "Qoshnilarning bir derexi",
      "zh": "邻居们的一棵树"
    },
    "uyghur": {
      "paragraphs": [
        "ئۈچ قوشنىنىڭ ھويلىسى ئارىسىدا بىر كونا ئۆرۈك دەرەخى بار ئىدى. دەرەخنىڭ يىلتىزى ئەلىنىڭ يېرىدە، شاخلىرى ئايشەمگە سايە چۈشۈرەتتى، مېۋىسى سەمەتنىڭ ھويلىسىغا چۈشەتتى. مېۋە پىشقاندا، ئۈچ قوشنا «دەرەخ مېنىڭ» دەپ تالاشتى.",
        "ئەپەندى ئۇلارغا: «ئەگەر دەرەخنى ئۈچكە بۆلسەك، قايسىڭلار يىلتىزنى سۇغىرىدۇ؟ قايسىڭلار قۇرۇق شاخنى كېسىدۇ؟» دەپ سورىدى. ھېچكىم جاۋاب بەرمىدى. چۈنكى دەرەخنىڭ ھەممە قىسمى بىر-بىرىگە لازىم ئىدى.",
        "ئۇلار بىر پىلان تۈزدى. ئەلى سۇ قويدى، ئايشەم زىيانلىق قۇرتلارنى تازىلىدى، سەمەت پىشقان مېۋىنى يىغدى. ئۇلار ئالدى بىلەن بىر سېۋەت مېۋىنى مەھەللىدىكى يالغۇز مومايغا بەردى. ئاندىن قالغان مېۋىنى ئۈچ ئائىلىگە تەڭ بۆلدى. ئەپەندى: «بىر دەرەخ كۆپ ئۆينى سايە ۋە مېۋە بىلەن بىرلەشتۈرەلەيدۇ»، دېدى. شۇ كۈندىن كېيىن قوشنىلار دەرەخنى «بىزنىڭ دەرىخىمىز» دەپ ئاتىدى."
      ]
    },
    "latin": {
      "paragraphs": [
        "Üch qoshnining hoylisi arisida bir kona örük derexi bar idi. Derexning yiltizi Elining yëride, shaxliri Ayshemge saye chüshüretti, mëwisi Semetning hoylisigha chüshetti. Mëwe pishqanda, üch qoshna «Derex mëning» dep talashti.",
        "Ependi ulargha: «Eger derexni üchke bölsek, qaysinglar yiltizni sughiridu? Qaysinglar quruq shaxni kësidu?» dep soridi. Hëchkim jawab bermidi. Chünki derexning hemme qismi bir-birige lazim idi.",
        "Ular bir pilan tüzdi. Eli su qoydi, Ayshem ziyanliq qurtlarni tazilidi, Semet pishqan mëwini yighdi. Ular aldi bilen bir sëwet mëwini mehellidiki yalghuz momaygha berdi. Andin qalghan mëwini üch ailige teng böldi. Ependi: «Bir derex köp öyni saye we mëwe bilen birleshtüreleydu», dëdi. Shu kündin këyin qoshnilar derexni «Bizning deriximiz» dep atidi."
      ]
    },
    "zh": {
      "paragraphs": [
        "三个邻居的院子之间有一棵老杏树。树根在艾力的地里，树枝给阿依谢姆遮阴，果子却落进萨麦提的院子。果子成熟时，三个邻居都争着说：“树是我的。”",
        "阿凡提问他们：“如果把树分成三份，谁来浇树根？谁来剪枯枝？”没有人回答。因为树的每一部分都离不开其他部分。",
        "他们制订了一个计划。艾力浇水，阿依谢姆清除害虫，萨麦提采摘成熟的果子。他们先送一篮果子给社区里独居的老奶奶，再把剩下的果子平均分给三家。阿凡提说：“一棵树能用树荫和果实把许多家庭连在一起。”从那天起，邻居们把它叫作“我们的树”。"
      ]
    },
    "wordRange": [
      100,
      130
    ],
    "actualWordCount": 107,
    "noAudio": true,
    "question": {
      "answerId": "C",
      "uyghur": {
        "prompt": "قوشنىلار تالاشنى قانداق توختاتتى؟",
        "choices": [
          {
            "id": "A",
            "text": "دەرەخنى كېسىۋەتتى"
          },
          {
            "id": "B",
            "text": "مېۋىنى يوشۇرۇپ قويدى"
          },
          {
            "id": "C",
            "text": "پەرۋىش قىلىش ۋە مېۋىنى بۆلۈش پىلانىنى تۈزدى"
          }
        ],
        "correctFeedback": "توغرا. ئۇلار ئىگىدارلىقنى تالاشماي، مەسئۇلىيەت بىلەن مېۋىنى ئورتاقلاشتى.",
        "retryFeedback": "قايتا ئوقۇڭ. دەرەخ ساقلىنىپ قالدى، ھەر بىر قوشنا ئۇنىڭغا بىر ئىش قىلدى."
      },
      "latin": {
        "prompt": "Qoshnilar talashni qandaq toxtatti?",
        "choices": [
          {
            "id": "A",
            "text": "Derexni kësiwetti"
          },
          {
            "id": "B",
            "text": "Mëwini yoshurup qoydi"
          },
          {
            "id": "C",
            "text": "Perwish qilish we mëwini bölüsh pilanini tüzdi"
          }
        ],
        "correctFeedback": "Toghra. Ular igidarliqni talashmay, mes'uliyet bilen mëwini ortaqlashti.",
        "retryFeedback": "Qayta oqung. Derex saqlinip qaldi, her bir qoshna uninggha bir ish qildi."
      },
      "zh": {
        "prompt": "邻居们怎样结束了争执？",
        "choices": [
          {
            "id": "A",
            "text": "砍掉了树"
          },
          {
            "id": "B",
            "text": "把果子藏起来"
          },
          {
            "id": "C",
            "text": "制订了照料树和分享果子的计划"
          }
        ],
        "correctFeedback": "正确。他们不再争所有权，而是共同承担责任并分享果实。",
        "retryFeedback": "再读一遍。树保留下来，而且每位邻居都为它做了一件事。"
      }
    },
    "moral": {
      "uyghur": "ئورتاق نېمەت ئورتاق مەسئۇلىيەت ۋە ئادىل بۆلۈشنى تەلەپ قىلىدۇ.",
      "latin": "Ortaq nëmet ortaq mes'uliyet we adil bölüshni telep qilidu.",
      "zh": "共同的益处，需要共同责任和公平分享。"
    },
    "review": {
      "uyghurLanguage": "approved",
      "translationMeaning": "approved",
      "educationAndCulture": "approved",
      "originality": "approved",
      "reviewedBy": "user-product-owner-confirmation",
      "reviewedAt": "2026-08-10"
    }
  },
  {
    "id": "wisdom-not-advantage",
    "sequence": 6,
    "primaryTheme": "真正的聪明维护公平和长期信任，不靠欺骗多拿利益",
    "title": {
      "uyghur": "ئەقىل دېگەن باشقىدىن پايدا ئېلىش ئەمەس",
      "latin": "Eqil dëgen bashqidin payda ëlish emes",
      "zh": "聪明不是占别人的便宜"
    },
    "uyghur": {
      "paragraphs": [
        "بازاردا بىر سودىگەر تەرەزىسىنىڭ بىر تەخسىسى ئاستىغا كىچىك تاش چاپلاپ قويدى. ئۇ خېرىدارغا مېۋىنى كەم بېرەتتى، ئەمما تولۇق پۇل ئالاتتى. «ھېچكىم بىلمىدى، دېمەك مەن ئەقىللىق»، دەپ ماختاندى.",
        "ئەپەندى بۇنى سەزدى. ئۇ بىر كىلو قۇرۇق ئۈزۈم سورىدى. سودىگەر ئۆلچەپ بەردى. ئەپەندى ئۈزۈمنى ئۆزى ئېلىپ كەلگەن توغرا تەرەزىدە قايتا ئۆلچىدى؛ ئۈزۈم بىر كىلوغا يەتمىدى. ئەتراپتىكى كىشىلەر سودىگەرنىڭ تەرەزىسى ئاستىدىكى يوشۇرۇن تاشنى كۆردى. سودىگەر: «سودىدا ھەر ئادەم ئۆز پايدىسىنى ئويلايدۇ»، دېدى.",
        "ئەپەندى: «پايدا ئېلىش خاتا ئەمەس، لېكىن باشقىنىڭ ھەققىنى كېمەيتىش ئەقىل ئەمەس. ھەقىقىي ئەقىل سودىگەر بىلەن خېرىدارنىڭ ئىشەنچىنى قوغدايدۇ»، دېدى. ئۇ سودىگەردىن كەم بەرگەن مېۋىلەرنىڭ ھەققىنى قايتۇرۇشنى سورىدى.",
        "سودىگەر ھەر بىر خېرىدارغا كەم بەرگەن مېۋىنىڭ پۇلىنى قايتۇردى ۋە ئۇلاردىن كەچۈرۈم سورىدى. ئۇ يوشۇرۇن تاشنى ئېلىۋېتىپ، توغرا تەرەزە ئىشلەتتى. بىر نەچچە ھەپتە ئادىل سودا قىلغاندىن كېيىن، كىشىلەر ئاستا-ئاستا دۇكانغا قايتتى. ئۇلارنىڭ ئىشەنچىمۇ ئاستا-ئاستا قايتتى. ئەپەندى: «قىسقا يول بىلەن ئالغان پايدا قىسقا بولىدۇ؛ ئىشەنچ بىلەن تاپقان نان ئۇزۇنغا يېتىدۇ»، دېدى."
      ]
    },
    "latin": {
      "paragraphs": [
        "Bazarda bir sodiger terezisining bir texsisi astigha kichik tash chaplap qoydi. U xëridargha mëwini kem bëretti, emma toluq pul alatti. «Hëchkim bilmidi, dëmek men eqilliq», dep maxtandi.",
        "Ependi buni sezdi. U bir kilo quruq üzüm soridi. Sodiger ölchep berdi. Ependi üzümni özi ëlip kelgen toghra terezide qayta ölchidi; üzüm bir kilogha yetmidi. Etraptiki kishiler sodigerning terezisi astidiki yoshurun tashni kördi. Sodiger: «Sodida her adem öz paydisini oylaydu», dëdi.",
        "Ependi: «Payda ëlish xata emes, lëkin bashqining heqqini këmeytish eqil emes. Heqiqiy eqil sodiger bilen xëridarning ishenchini qoghdaydu», dëdi. U sodigerdin kem bergen mëwilerning heqqini qayturushni soridi.",
        "Sodiger her bir xëridargha kem bergen mëwining pulini qayturdi we ulardin kechürüm soridi. U yoshurun tashni ëliwëtip, toghra tereze ishletti. Bir nechche hepte adil soda qilghandin këyin, kishiler asta-asta dukangha qaytti. Ularning ishenchimu asta-asta qaytti. Ependi: «Qisqa yol bilen alghan payda qisqa bolidu; ishench bilen tapqan nan uzungha yëtidu», dëdi."
      ]
    },
    "zh": {
      "paragraphs": [
        "市场上，一个商人在秤的一只托盘下面粘了一块小石头。他少给顾客水果，却收足额的钱。他还夸口说：“没人发现，说明我聪明。”",
        "阿凡提察觉了。他要了一公斤葡萄干。商人称好后递给他。阿凡提用自己带来的准确秤重新称量；葡萄干不到一公斤。周围的人看见了商人秤下藏着的石头。商人说：“做买卖，每个人都要考虑自己的利益。”",
        "阿凡提说：“获利没有错，但克扣别人的应得之物不是聪明。真正的智慧会保护商人和顾客之间的信任。”他要求商人退还少给水果的差额。",
        "商人把少给水果的差额退给每位顾客，并向他们道歉。他拿掉暗藏的石头，改用准确的秤。公平做了几个星期的买卖后，人们才慢慢回到店里，他们的信任也一点点恢复。阿凡提说：“走捷径得到的利益很短暂；靠信任挣来的饭能吃得长久。”"
      ]
    },
    "wordRange": [
      120,
      150
    ],
    "actualWordCount": 145,
    "noAudio": true,
    "question": {
      "answerId": "B",
      "uyghur": {
        "prompt": "نېمە ئۈچۈن سودىگەرنىڭ ھىيلىسى ھەقىقىي ئەقىل ئەمەس ئىدى؟",
        "choices": [
          {
            "id": "A",
            "text": "ئۇ مېۋىنى كۆپەيتكەنلىكى ئۈچۈن"
          },
          {
            "id": "B",
            "text": "ئۇ خېرىدارنىڭ ھەققىنى كېمەيتىپ، ئىشەنچنى بۇزغانلىقى ئۈچۈن"
          },
          {
            "id": "C",
            "text": "ئەپەندى قۇرۇق ئۈزۈمنى ياخشى كۆرمىگەنلىكى ئۈچۈن"
          }
        ],
        "correctFeedback": "توغرا. قىسقا پايدا ئۈچۈن ئادەمنى ئالداش ئىشەنچنى ۋە كېيىنكى سودىنى بۇزىدۇ.",
        "retryFeedback": "قايتا ئوقۇڭ. مەسىلە پايدا ئېلىشتا ئەمەس، خېرىدارغا تېگىشلىك مېۋىنى كەم بېرىشتە."
      },
      "latin": {
        "prompt": "Nëme üchün sodigerning hi'ylisi heqiqiy eqil emes idi?",
        "choices": [
          {
            "id": "A",
            "text": "U mëwini köpeytkenliki üchün"
          },
          {
            "id": "B",
            "text": "U xëridarning heqqini këmeytip, ishenchni buzghanliqi üchün"
          },
          {
            "id": "C",
            "text": "Ependi quruq üzümni yaxshi körmigenliki üchün"
          }
        ],
        "correctFeedback": "Toghra. Qisqa payda üchün ademni aldash ishenchni we këyinki sodini buzidu.",
        "retryFeedback": "Qayta oqung. Mesile payda ëlishta emes, xëridargha tëgishlik mëwini kem bërishte."
      },
      "zh": {
        "prompt": "为什么商人的诡计不是真正的聪明？",
        "choices": [
          {
            "id": "A",
            "text": "因为它让水果变多了"
          },
          {
            "id": "B",
            "text": "因为它克扣顾客应得之物并破坏信任"
          },
          {
            "id": "C",
            "text": "因为阿凡提不喜欢葡萄干"
          }
        ],
        "correctFeedback": "正确。为了短期利益欺骗别人，会破坏信任和以后的生意。",
        "retryFeedback": "再读一遍。问题不在获利，而在少给顾客应得的水果。"
      }
    },
    "moral": {
      "uyghur": "ئەقىل باشقىلارنى ئالداش ئەمەس؛ ئادىل يول بىلەن ھەممەيلەنگە پايدا يەتكۈزۈشتۇر.",
      "latin": "Eqil bashqilarni aldash emes; adil yol bilen hemmeylenge payda yetküzüshtur.",
      "zh": "聪明不是欺骗别人，而是用公平的方法让大家都受益。"
    },
    "review": {
      "uyghurLanguage": "approved",
      "translationMeaning": "approved",
      "educationAndCulture": "approved",
      "originality": "approved",
      "reviewedBy": "user-product-owner-confirmation",
      "reviewedAt": "2026-08-10"
    }
  }
];

  window.ANA_TILIM_AFANTI_DATA = Object.freeze({
    unit: Object.freeze(unit),
    stories: Object.freeze(stories)
  });
})();
