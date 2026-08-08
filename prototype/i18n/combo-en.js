(() => {
  const groups = {
    "open-a": {
      title: "Open-vowel combinations: ا",
      goal: "Connect familiar consonants to ا and watch the connected shapes change step by step.",
      status: "Current"
    },
    "soft-e": {
      title: "Soft-vowel combinations: ە",
      goal: "Use the same consonants with ە and compare how the ending changes.",
      status: "Available"
    },
    "three-step": {
      title: "Continuous connections: three letters",
      goal: "Move from two to three letters and focus on each letter's form inside the combination.",
      status: "Available"
    },
    "connection-breaks": {
      title: "Letters that break connections",
      goal: "See why letters such as د, ر, ز, ۋ and vowels do not connect forward.",
      status: "Available"
    }
  };

  const practiceReview = "Combination practice only; do not treat it as a vocabulary meaning.";
  const reviewBeforeVocabulary = "Combination practice; review it before using it as vocabulary.";
  const wordFormReview = "Word-form example; review it before formal assessment.";

  const items = {
    ba: {
      type: "Two-letter combination",
      rule: "Read from right to left: ب connects to the following letter ا to make ba.",
      hint: "ب uses its initial form before ا.",
      review: practiceReview
    },
    pa: {
      type: "Two-letter combination",
      rule: "پ connects to the following letter ا to make pa.",
      hint: "Keep the three dots below پ visible.",
      review: practiceReview
    },
    ta: {
      type: "Two-letter combination",
      rule: "ت connects to the following letter ا to make ta.",
      hint: "Keep the two dots above ت visible.",
      review: practiceReview
    },
    na: {
      type: "Two-letter combination",
      rule: "ن connects to the following letter ا to make na.",
      hint: "Keep the one dot above ن visible.",
      review: practiceReview
    },
    la: {
      type: "Two-letter combination",
      rule: "ل connects to the following letter ا to make la.",
      hint: "Learn the connected shape of ل and ا together.",
      review: practiceReview
    },
    ma: {
      type: "Two-letter combination",
      rule: "م connects to the following letter ا to make ma.",
      hint: "The round part of م becomes more compact in its initial form.",
      review: practiceReview
    },
    sa: {
      type: "Two-letter combination",
      rule: "س connects to the following letter ا to make sa.",
      hint: "Keep the teeth of س clear as its initial form connects to ا.",
      review: practiceReview
    },
    sha: {
      type: "Two-letter combination",
      rule: "ش connects to the following letter ا to make sha.",
      hint: "Compare it with سا and keep the three dots above ش visible.",
      review: practiceReview
    },
    qa: {
      type: "Two-letter combination",
      rule: "ق connects to the following letter ا to make qa.",
      hint: "The round part of ق becomes compact in its initial form before ا.",
      review: practiceReview
    },
    ka: {
      type: "Two-letter combination",
      rule: "ك connects to the following letter ا to make ka.",
      hint: "Look at the initial form of ك together with ا.",
      review: practiceReview
    },
    "be-e": {
      type: "Two-letter combination",
      rule: "ب connects to the following letter ە to make be.",
      hint: "Compare it with با; the final symbol is different.",
      review: practiceReview
    },
    "pe-e": {
      type: "Two-letter combination",
      rule: "پ connects to the following letter ە to make pe.",
      hint: "Check the three dots of پ first, then look at ە.",
      review: practiceReview
    },
    "te-e": {
      type: "Two-letter combination",
      rule: "ت connects to the following letter ە to make te.",
      hint: "Compare it with تا; the ending changes from ا to ە.",
      review: practiceReview
    },
    "ne-e": {
      type: "Two-letter combination",
      rule: "ن connects to the following letter ە to make ne.",
      hint: "The one dot above ن is the key identifying feature.",
      review: practiceReview
    },
    "le-e": {
      type: "Two-letter combination",
      rule: "ل connects to the following letter ە to make le.",
      hint: "Compare it directly with لا.",
      review: practiceReview
    },
    "me-e": {
      type: "Two-letter combination",
      rule: "م connects to the following letter ە to make me.",
      hint: "Look at the initial form of م together with the final ە.",
      review: practiceReview
    },
    "se-e": {
      type: "Two-letter combination",
      rule: "س connects to the following letter ە to make se.",
      hint: "When س connects to a different vowel, the final symbol changes.",
      review: practiceReview
    },
    "she-e": {
      type: "Two-letter combination",
      rule: "ش connects to the following letter ە to make she.",
      hint: "Compare it with سە; only ش has three dots above.",
      review: practiceReview
    },
    "qe-e": {
      type: "Two-letter combination",
      rule: "ق connects to the following letter ە to make qe.",
      hint: "The initial form of ق connects to ە.",
      review: practiceReview
    },
    "ke-e": {
      type: "Two-letter combination",
      rule: "ك connects to the following letter ە to make ke.",
      hint: "The initial form of ك connects to ە.",
      review: practiceReview
    },
    bal: {
      type: "Three-letter combination",
      rule: "Read با first, then add ل.",
      hint: "Focus on how the three letters sit together before learning a meaning.",
      review: reviewBeforeVocabulary
    },
    man: {
      type: "Three-letter combination",
      rule: "Read ما first, then add ن.",
      hint: "Notice the initial form of م and the final form of ن.",
      review: reviewBeforeVocabulary
    },
    nan: {
      type: "Three-letter combination",
      rule: "Read نا first, then add ن.",
      hint: "The same ن has an initial form at the start and a final form at the end.",
      review: reviewBeforeVocabulary
    },
    tal: {
      type: "Three-letter combination",
      rule: "Read تا first, then add ل.",
      hint: "Check the dots of ت and the position of the final ل.",
      review: reviewBeforeVocabulary
    },
    bel: {
      type: "Three-letter combination",
      rule: "ب connects to ە, but ە does not connect forward, so ل starts again.",
      hint: "Focus on the break after ە.",
      review: reviewBeforeVocabulary
    },
    kel: {
      type: "Three-letter combination",
      rule: "ك connects to ە, but ە does not connect forward, so ل starts again.",
      hint: "Here too, ە causes the following letter to start again.",
      review: reviewBeforeVocabulary
    },
    "men-combo": {
      type: "Three-letter combination",
      rule: "م connects to ە, but ە does not connect forward, so ن starts again.",
      hint: "You will meet this word form again later in vocabulary lessons.",
      review: reviewBeforeVocabulary
    },
    "sen-combo": {
      type: "Three-letter combination",
      rule: "س connects to ە, but ە does not connect forward, so ن starts again.",
      hint: "Compare it with مەن; only the first letter changes.",
      review: reviewBeforeVocabulary
    },
    "dada-connection": {
      type: "Connection-break word form",
      meaning: "Dad; a family form of address",
      rule: "Both د and ا do not connect forward, so the break in the middle stays visible.",
      hint: "This example clearly shows the does not connect forward rule.",
      review: "Spoken or family variant; review it with a native speaker."
    },
    "reng-connection": {
      type: "Connection-break word form",
      meaning: "Colour",
      rule: "ر does not connect forward, and ە does not connect forward, so ڭ starts again.",
      hint: "Notice two letters in a row that break the connection.",
      review: wordFormReview
    },
    "qiz-connection": {
      type: "Connection-break word form",
      meaning: "Girl",
      rule: "ق connects to ى, but ى does not connect forward, so ز is written separately.",
      hint: "Look at the final form of ى and the isolated form of ز.",
      review: wordFormReview
    },
    "weten-connection": {
      type: "Connection-break word form",
      meaning: "Homeland; motherland",
      rule: "Both ۋ and ە do not connect forward, so following letters start again.",
      hint: "Find each connection break before looking at ت and ن.",
      review: wordFormReview
    },
    "mewe-connection": {
      type: "Connection-break word form",
      meaning: "Fruit",
      rule: "م connects to ې, but ې does not connect forward; ۋ also does not connect forward.",
      hint: "This example practises both ې and ۋ.",
      review: wordFormReview
    },
    "toge-connection": {
      type: "Connection-break word form",
      meaning: "Camel",
      rule: "ت connects to ۆ, but ۆ does not connect forward, so گ starts again.",
      hint: "Notice how the rounded vowel ۆ breaks the connection.",
      review: wordFormReview
    }
  };

  window.ANA_TILIM_COMBOS_EN = { groups, items };
})();
