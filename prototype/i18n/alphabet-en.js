(() => {
  const formLabels = {
    isolated: "Isolated form",
    "simple-isolated": "Simple isolated form",
    "right-joined": "Right-joined form",
    "simple-right-joined": "Simple right-joined form",
    "dual-joined": "Dual-joined form",
    "hamza-dual-joined": "Hamza-separated dual-joined form",
    "left-joined": "Left-joined form",
    "hamza-left-joined": "Hamza-separated left-joined form"
  };
  const joined = ["isolated", "right-joined", "dual-joined", "left-joined"];
  const nonForward = ["isolated", "left-joined"];
  const carrier = ["isolated", "simple-isolated", "left-joined", "hamza-left-joined"];
  const extended = [
    "isolated",
    "simple-isolated",
    "right-joined",
    "simple-right-joined",
    "dual-joined",
    "hamza-dual-joined",
    "left-joined",
    "hamza-left-joined"
  ];

  function letter(letterId, formIds, details, meanings) {
    return {
      ...details,
      forms: Object.fromEntries(formIds.map((formId) => [formId, { label: formLabels[formId] }])),
      formExamples: Object.fromEntries(
        formIds.map((formId, index) => [
          `${letterId}:${formId}`,
          { label: formLabels[formId], meaning: meanings[index] }
        ])
      )
    };
  }

  const letterDetails = {
    be: letter("be", joined, {
      type: "Consonant",
      cue: "One dot below",
      connection: "Joins to the next letter and accepts a connection from the previous letter.",
      soundHint: "Approximate it as b, then listen to the human recording. A consonant needs a vowel to form a syllable.",
      writingHint: "Draw a smooth, level bowl and place one dot below.",
      example: "Compare it with پ, ت, and ن. The key feature of ب is one dot below."
    }, ["book", "five", "football", "heart"]),
    pe: letter("pe", joined, {
      type: "Consonant",
      cue: "Three dots below",
      connection: "Joins to the next letter and accepts a connection from the previous letter.",
      soundHint: "Approximate it as p, then listen to the human recording. A consonant needs a vowel to form a syllable.",
      writingHint: "Use the same main shape as ب, with three dots below.",
      example: "Compare it with ب. The key feature of پ is three dots below."
    }, ["many", "desk", "hat", "thread"]),
    te: letter("te", joined, {
      type: "Consonant",
      cue: "Two dots above",
      connection: "Joins to the next letter and accepts a connection from the previous letter.",
      soundHint: "Approximate it as t, then listen to the human recording. A consonant needs a vowel to form a syllable.",
      writingHint: "Use the shared main shape and place two dots above.",
      example: "Compare it with ن. The key feature of ت is two dots above."
    }, ["horse", "watermelon", "bag", "dog"]),
    nun: letter("nun", joined, {
      type: "Consonant",
      cue: "One dot above",
      connection: "Joins to the next letter and accepts a connection from the previous letter.",
      soundHint: "Approximate it as n, then listen to the human recording. A consonant needs a vowel to form a syllable.",
      writingHint: "Use the shared main shape and place one dot above.",
      example: "Compare it with ت. The key feature of ن is one dot above."
    }, ["naan", "banana", "mirror", "squirrel"]),
    jim: letter("jim", joined, {
      type: "Consonant",
      cue: "Curved shape, one dot below",
      connection: "Joins to the next letter and accepts a connection from the previous letter.",
      soundHint: "Approximate it as j, then listen to the human recording. A consonant needs a vowel to form a syllable.",
      writingHint: "First draw the curved body, then add one dot below.",
      example: "ج, چ, and خ share a similar body. Use the position and number of dots to tell them apart."
    }, ["crown", "Friday", "strawberry", "Anchorage"]),
    che: letter("che", joined, {
      type: "Consonant",
      cue: "Curved shape, three dots below",
      connection: "Joins to the next letter and accepts a connection from the previous letter.",
      soundHint: "Approximate it as ch, then listen to the human recording. A consonant needs a vowel to form a syllable.",
      writingHint: "Use the curved body of ج and add three dots below.",
      example: "The main difference between چ and ج is the number of dots below."
    }, ["hair", "tiredness", "shareholder", "sandwich"]),
    khe: letter("khe", joined, {
      type: "Consonant",
      cue: "Curved shape, one dot above",
      connection: "Joins to the next letter and accepts a connection from the previous letter.",
      soundHint: "This sound may be unfamiliar. Listen to the human recording instead of forcing an English match. A consonant needs a vowel to form a syllable.",
      writingHint: "Place one dot above the curved body, never below it.",
      example: "Learn خ with ج and چ, and focus on the dot above."
    }, ["tree", "owner", "restaurant", "sprout"]),
    dal: letter("dal", nonForward, {
      type: "Consonant",
      cue: "Short shape, no dots",
      connection: "Accepts a connection from the previous letter but normally does not join to the next one.",
      soundHint: "Approximate it as d, then listen to the human recording. A consonant needs a vowel to form a syllable.",
      writingHint: "Notice the short outline and the break before the next letter.",
      example: "In this group, a visible break is not necessarily a writing mistake."
    }, ["dad", "thermos"]),
    re: letter("re", nonForward, {
      type: "Consonant",
      cue: "Curved stroke, no dots",
      connection: "Accepts a connection from the previous letter but normally does not join to the next one.",
      soundHint: "Approximate it as r, then listen to the human recording. A consonant needs a vowel to form a syllable.",
      writingHint: "Use its curved outline to distinguish it from د.",
      example: "ر normally does not join to the next letter, so the following letter starts again."
    }, ["colour", "lion"]),
    ze: letter("ze", nonForward, {
      type: "Consonant",
      cue: "Curved stroke, one dot above",
      connection: "Accepts a connection from the previous letter but normally does not join to the next one.",
      soundHint: "Approximate it as z, then listen to the human recording. A consonant needs a vowel to form a syllable.",
      writingHint: "Start with the curved shape of ر and add one dot above.",
      example: "ز resembles ر. The key difference is one dot above."
    }, ["eye", "girl"]),
    zhe: letter("zhe", nonForward, {
      type: "Consonant",
      cue: "Curved stroke, three dots above",
      connection: "Accepts a connection from the previous letter but normally does not join to the next one.",
      soundHint: "Approximate it as zh, then listen to the human recording. A consonant needs a vowel to form a syllable.",
      writingHint: "Use the same family shape as ز, with three dots above.",
      example: "Compare ژ with ز. The number of dots is the key."
    }, ["magazine", "Paris"]),
    sin: letter("sin", joined, {
      type: "Consonant",
      cue: "Row of teeth, no dots",
      connection: "Joins to the next letter and accepts a connection from the previous letter.",
      soundHint: "Approximate it as s, then listen to the human recording. A consonant needs a vowel to form a syllable.",
      writingHint: "Keep the repeated teeth visible instead of flattening them into one line.",
      example: "س has no dots; ش has three dots above."
    }, ["tiger", "you", "garlic", "excellent"]),
    shin: letter("shin", joined, {
      type: "Consonant",
      cue: "Row of teeth, three dots above",
      connection: "Joins to the next letter and accepts a connection from the previous letter.",
      soundHint: "Approximate it as sh, then listen to the human recording. A consonant needs a vowel to form a syllable.",
      writingHint: "Draw the teeth first, then add three dots above.",
      example: "ش and س share the same body; the three dots identify ش."
    }, ["stone", "balloon", "worker", "tooth"]),
    ghayn: letter("ghayn", joined, {
      type: "Consonant",
      cue: "Rounded shape, one dot above",
      connection: "Joins to the next letter and accepts a connection from the previous letter.",
      soundHint: "This sound may be unfamiliar. First learn the shape, then listen to the human recording. A consonant needs a vowel to form a syllable.",
      writingHint: "Notice the rounded structure and one dot above.",
      example: "غ, ف, and ق all look rounded. Compare their outlines slowly."
    }, ["shoe", "goose", "rain", "blade"]),
    fe: letter("fe", joined, {
      type: "Consonant",
      cue: "Small rounded shape, one dot above",
      connection: "Joins to the next letter and accepts a connection from the previous letter.",
      soundHint: "Approximate it as f, then listen to the human recording. A consonant needs a vowel to form a syllable.",
      writingHint: "Check both the rounded outline and the one dot above.",
      example: "Use the dot count, overall size, and shape to distinguish ف from ق."
    }, ["telecommunications", "surname", "asphalt", "golf"]),
    qaf: letter("qaf", joined, {
      type: "Consonant",
      cue: "Rounded shape, two dots above",
      connection: "Joins to the next letter and accepts a connection from the previous letter.",
      soundHint: "This sound may be unfamiliar. First learn the shape, then listen to the human recording. A consonant needs a vowel to form a syllable.",
      writingHint: "Notice the two dots above and the rounded finishing stroke.",
      example: "The two dots above ق are an important clue in this group."
    }, ["white", "hand", "Kashgar", "bear"]),
    kaf: letter("kaf", joined, {
      type: "Consonant",
      cue: "Base shape of the k family",
      connection: "Joins to the next letter and accepts a connection from the previous letter.",
      soundHint: "Approximate it as k, then listen to the human recording. A consonant needs a vowel to form a syllable.",
      writingHint: "Learn this base k-family shape, then compare it with گ and ڭ.",
      example: "ك is the reference shape for this family."
    }, ["blue", "cabin", "two", "door"]),
    gaf: letter("gaf", joined, {
      type: "Consonant",
      cue: "K-family shape with an extra mark",
      connection: "Joins to the next letter and accepts a connection from the previous letter.",
      soundHint: "Approximate it as g, then listen to the human recording. A consonant needs a vowel to form a syllable.",
      writingHint: "Compare it with ك and look for the extra mark.",
      example: "گ and ك are similar, so compare them side by side."
    }, ["biologist", "carpet", "example", "Leipzig"]),
    ng: letter("ng", joined, {
      type: "Consonant",
      cue: "Nasal shape in the k family",
      connection: "Joins to the next letter and accepts a connection from the previous letter.",
      soundHint: "Listen closely to the human recording for ng. In Unit 1, begin by recognizing the letter. A consonant needs a vowel to form a syllable.",
      writingHint: "Compare it with ك and گ, and notice its own identifying mark.",
      example: "ڭ may be unfamiliar, so first learn its shape within the k family."
    }, ["sleeve", "walnut", "needle", "thousand"]),
    lam: letter("lam", joined, {
      type: "Consonant",
      cue: "Tall shape, no dots",
      connection: "Joins to the next letter and accepts a connection from the previous letter.",
      soundHint: "Approximate it as l, then listen to the human recording. A consonant needs a vowel to form a syllable.",
      writingHint: "Notice the tall stroke and the lower finishing curve.",
      example: "ل, م, and ھ have no dots, so compare their full outlines."
    }, ["lake", "people", "knowledge", "elephant"]),
    mim: letter("mim", joined, {
      type: "Consonant",
      cue: "Rounded shape, no dots",
      connection: "Joins to the next letter and accepts a connection from the previous letter.",
      soundHint: "Approximate it as m, then listen to the human recording. A consonant needs a vowel to form a syllable.",
      writingHint: "Notice the rounded part and where the joining stroke begins.",
      example: "The clear round shape of م helps distinguish it from ل and ھ."
    }, ["pen", "cat", "monkey", "Tarim"]),
    he: letter("he", joined, {
      type: "Consonant",
      cue: "Open shape, no dots",
      connection: "Joins to the next letter and accepts a connection from the previous letter.",
      soundHint: "Approximate it as h, then listen to the human recording. A consonant needs a vowel to form a syllable.",
      writingHint: "Look for the open shape and joined forms; do not confuse it with the round م.",
      example: "ھ has no dots, but its outline differs from ل and م."
    }, ["Abdullah", "bee", "farmer", "admonition"]),
    waw: letter("waw", nonForward, {
      type: "Consonant",
      cue: "Rounded shape; normally does not join forward",
      connection: "Accepts a connection from the previous letter but normally does not join to the next one.",
      soundHint: "Approximate it as w or v, then listen to the human recording. A consonant needs a vowel to form a syllable.",
      writingHint: "Remember that it normally does not join to the following letter.",
      example: "ۋ and ي are both common later in the alphabet. First compare their joining rules."
    }, ["homeland", "fruit"]),
    ye: letter("ye", joined, {
      type: "Consonant",
      cue: "Two dots below; joins on both sides",
      connection: "Joins to the next letter and accepts a connection from the previous letter.",
      soundHint: "Approximate it as y, then listen to the human recording. A consonant needs a vowel to form a syllable.",
      writingHint: "Notice the two dots below and its joined shapes.",
      example: "Later lessons will compare ي with ئى again."
    }, ["sheep", "year", "computer", "sodium"]),
    aa: letter("aa", carrier, {
      type: "Vowel",
      cue: "ئ + ا",
      connection: "Accepts a connection from the previous letter but normally does not join to the next one.",
      soundHint: "Begin with an open a sound, then listen to the human recording.",
      writingHint: "A vowel at the start of a word needs ئ as its carrier; do not practise ئ as a separate sound.",
      example: "Learn ئ together with its vowel symbol across the vowel group."
    }, ["mother", "black", "apple", "international"]),
    ae: letter("ae", carrier, {
      type: "Vowel",
      cue: "ئ + ە",
      connection: "Accepts a connection from the previous letter but normally does not join to the next one.",
      soundHint: "Begin with an e sound, then listen to the human recording.",
      writingHint: "A vowel at the start of a word needs ئ; compare the shapes of ە and ا.",
      example: "ئە and ئا both begin words with a vowel carrier, but their vowel symbols differ."
    }, ["literature", "picture", "I", "torch"]),
    o: letter("o", carrier, {
      type: "Vowel",
      cue: "ئ + و",
      connection: "Accepts a connection from the previous letter but normally does not join to the next one.",
      soundHint: "This is a rounded vowel. Listen to the human recording.",
      writingHint: "A vowel at the start of a word needs ئ; notice the و after it.",
      example: "Listen to and compare ئو, ئۇ, ئۆ, and ئۈ together."
    }, ["fire", "medicine", "melon", "geology"]),
    u: letter("u", carrier, {
      type: "Vowel",
      cue: "ئ + ۇ",
      connection: "Accepts a connection from the previous letter but normally does not join to the next one.",
      soundHint: "This is a rounded vowel. Listen to the human recording.",
      writingHint: "A vowel at the start of a word needs ئ; notice the ۇ after it.",
      example: "ئۇ and ئو look similar, so use the audio to learn the difference gradually."
    }, ["Uyghur", "drum", "money", "responsibility"]),
    oe: letter("oe", carrier, {
      type: "Vowel",
      cue: "ئ + ۆ",
      connection: "Accepts a connection from the previous letter but normally does not join to the next one.",
      soundHint: "This is a rounded vowel. Listen to the human recording.",
      writingHint: "A vowel at the start of a word needs ئ; notice the ۆ after it.",
      example: "Learn ئۆ and ئۈ with the human recordings."
    }, ["home", "country", "camel", "oesophagus"]),
    ue: letter("ue", carrier, {
      type: "Vowel",
      cue: "ئ + ۈ",
      connection: "Accepts a connection from the previous letter but normally does not join to the next one.",
      soundHint: "This is a rounded vowel. Listen to the human recording.",
      writingHint: "A vowel at the start of a word needs ئ; notice the ۈ after it.",
      example: "ئۈ and ئۇ look similar. Recognize the symbol first, then listen."
    }, ["hope", "grapes", "flower", "hopeless"]),
    ee: letter("ee", extended, {
      type: "Vowel",
      cue: "ئ + ې",
      connection: "Accepts a connection from the previous letter but normally does not join to the next one.",
      soundHint: "Listen to the human recording for this vowel.",
      writingHint: "A vowel at the start of a word needs ئ; notice the ې after it.",
      example: "Learn ئې as part of the vowel group."
    }, ["E Qianqiu", "Chengde", "field", "sea", "fast", "panda", "Zhangjiajie", "Chang'e"]),
    ii: letter("ii", extended, {
      type: "Vowel",
      cue: "ئ + ى",
      connection: "Accepts a connection from the previous letter but normally does not join to the next one.",
      soundHint: "Listen to the human recording for this vowel.",
      writingHint: "A vowel at the start of a word needs ئ; ئى is a vowel, while ي is a consonant.",
      example: "ئى and ي are easy to confuse. In Unit 1, first learn which is which."
    }, ["I Naomi", "Malawi", "trace", "penguin", "beautiful", "verb", "which", "prohibition"])
  };

  const groups = {
    "vowels-basic": { title: "ئا / ئە", goal: "Meet the most basic word-initial vowel carriers", status: "Available" },
    "dot-bone": { title: "ب / پ / ت", goal: "Compare one shared body with different dot counts", status: "Current" },
    curved: { title: "ج / چ / خ", goal: "Compare similar curves and check whether the dots are above or below", status: "Available" },
    breakers: { title: "د / ر / ز / ژ", goal: "Learn why these letters normally break before the next letter", status: "Available" },
    teeth: { title: "س / ش", goal: "Distinguish the tooth shape with no dots from the one with three dots", status: "Available" },
    "round-dots": { title: "غ / ف / ق", goal: "Recognize each shape first, then learn its sound from the human recording", status: "Available" },
    "k-family": { title: "ك / گ / ڭ", goal: "Distinguish the shapes for k, g, and ng", status: "Available" },
    "no-dot": { title: "ل / م", goal: "Use the full outline to distinguish letters without dots", status: "Available" },
    "nun-he": { title: "ن / ھ", goal: "Meet n and h in alphabet order", status: "Available" },
    "vowels-round": { title: "ئو / ئۇ / ئۆ / ئۈ", goal: "Listen to and recognize the rounded vowels together", status: "Available" },
    tail: { title: "ۋ / ئې / ئى / ي", goal: "Distinguish common letters from the final part of the alphabet", status: "Available" }
  };

  window.ANA_TILIM_ALPHABET_EN = { letterDetails, groups };
})();
