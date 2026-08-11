(() => {
  const sourceGroups = window.ANA_TILIM_VOCAB?.vocabGroups;
  if (!Array.isArray(sourceGroups)) {
    throw new Error("Ana Tilim vocabulary data failed to load before its English catalog.");
  }

  const makeGroup = (title, goal, sections) => ({
    title,
    goal,
    status: "Awaiting review",
    sections
  });

  const groups = {
    greetings: makeGroup("Greetings", "Common greetings and polite expressions", {
      daily: { title: "Everyday greetings" },
      polite: { title: "Polite expressions" }
    }),
    pronouns: makeGroup("Personal pronouns", "Personal, demonstrative, and common question pronouns", {
      person: { title: "People" },
      possessive: { title: "Possessives" },
      pointing: { title: "Demonstratives and questions" }
    }),
    family: makeGroup("Family and forms of address", "Family members and basic ways to address people", {
      parents: { title: "Parents and family" },
      siblings: { title: "Siblings" },
      relations: { title: "Elders and relationships" }
    }),
    numbers: makeGroup("Numbers", "Learn the basic numbers from 1 to 20 first", {
      "one-to-ten": { title: "1–10" },
      tens: { title: "Multiples of ten" },
      large: { title: "Large numbers" }
    }),
    time: makeGroup("Time", "Dates, times of day, and common time words", {
      basic: { title: "Basic time words" },
      weekdays: { title: "Days of the week" },
      months: { title: "Months" }
    }),
    body: makeGroup("Body", "Body parts and common words used when seeing a doctor", {
      head: { title: "Head" },
      body: { title: "Body" }
    }),
    food: makeGroup("Food and drinks", "Eating, drinking, and everyday table words", {
      basic: { title: "Staple foods and drinks" },
      meal: { title: "Foods and seasonings" }
    }),
    vegetables: makeGroup("Vegetables", "Common vegetable words used at the market", {
      common: { title: "Common vegetables" },
      more: { title: "More vegetables" }
    }),
    animals: makeGroup("Animals", "Familiar animals and basic animal names", {
      home: { title: "Domestic animals" },
      other: { title: "Other animals" }
    }),
    home: makeGroup("Home and objects", "Common things at home, for study, and on the go", {
      house: { title: "Around the home" },
      objects: { title: "Study and personal items" }
    }),
    colors: makeGroup("Colors", "The most common color words for describing objects", {
      basic: { title: "Basic colors" },
      more: { title: "More colors" }
    }),
    actions: makeGroup("Common actions", "Basic action words used every day", {
      learn: { title: "Seeing, listening, speaking, and writing" },
      daily: { title: "Everyday actions" }
    })
  };

  const meanings = {
    yaxshimusiz: "Hello; how are you?",
    rahmat: "Thank you",
    "kop-rahmat": "Thank you very much",
    xosh: "Goodbye; farewell",
    hayr: "Goodbye; farewell",
    assalamu: "Greeting; peace be upon you",
    waalaykum: "Reply to a greeting",
    "xush-keldingiz": "Welcome",
    erzimaydu: "You're welcome.",
    kechurung: "Sorry; please forgive me",
    yaxshi: "Good; very good",
    qandaq: "How; in what way?",
    "xeyirlik-etigen": "Good morning",
    "xeyirlik-kech": "Good evening",
    korushkunche: "See you later; goodbye",

    men: "I; me",
    sen: "You",
    siz: "You; polite you",
    "u-pronoun": "He; she; it",
    biz: "We; us",
    ular: "They; them",
    bu: "This; this one",
    shu: "That; this matter",
    mening: "My; mine",
    sening: "Your; yours",
    sizning: "Your; yours (polite or plural)",
    uning: "His; hers",
    bizning: "Our; ours",
    kim: "Who",
    nime: "What",

    "ana-family": "Mother; mum",
    "apa-family": "Mum; a family form of address",
    "ata-family": "Father; dad",
    "dada-family": "Dad; a family form of address",
    "aile-family": "Family; family members",
    "bala-family": "Child",
    "oghul-family": "Son; boy",
    "qiz-family": "Daughter; girl",
    "aka-family": "Older brother",
    "inim-family": "My younger brother; a way to address a younger brother",
    "singil-family": "Younger sister",
    "acha-family": "Older sister",
    "chong-ata-family": "Grandfather",
    "chong-ana-family": "Grandmother",
    "dost-family": "Friend",

    one: "One",
    two: "Two",
    three: "Three",
    four: "Four",
    five: "Five",
    six: "Six",
    seven: "Seven",
    eight: "Eight",
    nine: "Nine",
    ten: "Ten",
    twenty: "Twenty",
    "ten-tens": "Ten; a multiple of ten",
    thirty: "Thirty",
    forty: "Forty",
    fifty: "Fifty",
    sixty: "Sixty",
    seventy: "Seventy",
    eighty: "Eighty",
    ninety: "Ninety",
    hundred: "One hundred",
    thousand: "One thousand",
    "ten-thousand": "Ten thousand",
    "hundred-thousand": "One hundred thousand",
    million: "One million",
    "ten-million": "Ten million",
    "hundred-million": "One hundred million",
    billion: "One billion",

    bugun: "Today",
    ete: "Tomorrow",
    tunugun: "Yesterday",
    hazir: "Now",
    waqit: "Time",
    kun: "Day; sun",
    hepte: "Week; weekday",
    "ay-time": "Month; calendar month",
    yil: "Year",
    etigen: "Morning",
    chush: "Noon; dream",
    kech: "Evening",
    keche: "Night",
    dushenbe: "Monday",
    seshenbe: "Tuesday",
    charshenbe: "Wednesday",
    peyshenbe: "Thursday",
    jume: "Friday",
    shenbe: "Saturday",
    yekshembe: "Sunday",
    yanwar: "January",
    fewral: "February",
    mart: "March",
    aprel: "April",
    "may-month": "May",
    iyun: "June",
    iyul: "July",
    awghust: "August",
    sentyabr: "September",
    oktyabr: "October",
    noyabr: "November",
    dekabr: "December",

    "bash-body": "Head",
    "koz-body": "Eye",
    "qulaq-body": "Ear",
    "burun-body": "Nose",
    "eghiz-body": "Mouth",
    "qol-body": "Hand; arm",
    "put-body": "Foot; leg",
    "yurek-body": "Heart",
    "boyun-body": "Neck",
    "arqa-body": "Back; behind",
    "chish-body": "Tooth; teeth",
    "til-body": "Tongue; language",
    "chach-body": "Hair",
    "qorsaq-body": "Belly; stomach",
    "yuz-body": "Face; one hundred",

    "nan-food": "Naan; bread",
    "su-food": "Water",
    "chay-food": "Tea",
    "gosh-food": "Meat",
    "polu-food": "Pilaf",
    "mewe-food": "Fruit",
    "tuz-food": "Salt",
    "sheker-food": "Sugar",
    "may-food": "Oil",
    "sut-food": "Milk",
    "tuxum-food": "Egg",
    "guruch-food": "Rice; cooked rice",
    "shorpa-food": "Soup",
    "qetiq-food": "Yogurt",
    "beliq-food": "Fish; fish meat",

    "pemidur-vegetable": "Tomato",
    "piyaz-vegetable": "Onion",
    "yangyu-vegetable": "Potato",
    "berengge-vegetable": "Potato; regional variant",
    "sewze-vegetable": "Carrot",
    "samsaq-vegetable": "Garlic",
    "terxemek-vegetable": "Cucumber",
    "kawa-vegetable": "Pumpkin",
    "laza-vegetable": "Chili pepper",
    "koktat-vegetable": "Vegetable",
    "yesiwilek-vegetable": "Chinese cabbage; cabbage",
    "palek-vegetable": "Spinach",
    "chamghur-vegetable": "Radish; turnip",
    "badamjan-vegetable": "Eggplant",
    "qizilmuch-vegetable": "Red pepper; chili pepper",

    "it-animal": "Dog",
    "mushuk-animal": "Cat",
    "beliq-animal": "Fish",
    "qush-animal": "Bird",
    "kala-animal": "Cow",
    "qoy-animal": "Sheep",
    "toxu-animal": "Chicken",
    "at-animal": "Horse",
    "toge-animal": "Camel",
    "bore-animal": "Wolf",
    "burkut-animal": "Eagle",
    "ochke-animal": "Goat",
    "chashqan-animal": "Mouse",
    "toshqan-animal": "Rabbit",
    "yilan-animal": "Snake",

    "oy-home": "Home; room",
    "ishik-home": "Door",
    "dereze-home": "Window",
    "stol-home": "Table",
    "kitab-home": "Book",
    "orunduq-home": "Chair",
    "kariwat-home": "Bed",
    "chiragh-home": "Lamp",
    "qelem-home": "Pen",
    "depter-home": "Notebook",
    "somka-home": "Bag",
    "telefon-home": "Telephone; mobile phone",
    "achquch-home": "Key",
    "saet-home": "Watch; hour",
    "pul-home": "Money",

    "qizil-color": "Red",
    "kok-color": "Blue; sky blue",
    "yeshil-color": "Green",
    "seriq-color": "Yellow",
    "qara-color": "Black",
    "aq-color": "White",
    "toq-seriq-color": "Orange",
    "binepshe-color": "Purple",
    "qongur-color": "Brown",
    "kulreng-color": "Gray",
    "altun-color": "Gold; golden",
    "kumush-color": "Silver; silvery",
    "halreng-color": "Pink",
    "sus-kok-color": "Light blue",
    "qeniq-kok-color": "Dark blue",

    "kelish-action": "Come",
    "ketish-action": "Go; leave",
    "oqush-action": "Read; study",
    "yezish-action": "Write",
    "korush-action": "See; look",
    "anglash-action": "Listen",
    "sozlesh-action": "Speak",
    "yeyish-action": "Eat",
    "ichish-action": "Drink",
    "berish-action": "Give; go",
    "elish-action": "Take; pick up",
    "echish-action": "Open",
    "taqash-action": "Close",
    "olturush-action": "Sit",
    "bilish-action": "Know"
  };

  const defaultNote = "Look at the word form, then connect it with the English meaning.";
  const noteOverrides = {
    yaxshimusiz: "Break it into three parts: ياخشى, مۇ, and سىز.",
    "ana-family": "Learn the word form first; do not rule out ئاپا yet.",
    "apa-family": "Compare it with ئانا: the middle letter is پ.",
    "ata-family": "Its structure is similar to ئانا, but the middle letter is different."
  };
  const items = {};

  for (const sourceGroup of sourceGroups) {
    if (!groups[sourceGroup.id]) {
      throw new Error(`Missing English vocabulary group: ${sourceGroup.id}`);
    }
    for (const sourceItem of sourceGroup.items || []) {
      const meaning = meanings[sourceItem.id];
      if (typeof meaning !== "string" || !meaning.trim()) {
        throw new Error(`Missing English vocabulary meaning: ${sourceItem.id}`);
      }
      items[sourceItem.id] = {
        meaning,
        note: noteOverrides[sourceItem.id] || defaultNote
      };
    }
  }

  window.ANA_TILIM_VOCAB_EN = { groups, items };
})();
