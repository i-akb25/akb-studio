export type DailyReflection = {
  id: string;
  source: string;
  reference: string;
  sanskrit: string;
  transliteration: string;
  hindiMeaning: string;
  englishMeaning: string;
  personalReflection: string;
};

export const reflections = [
  {
    id: "self-uplift",
    source: "भगवद्गीता",
    reference: "6.5",
    sanskrit: "उद्धरेदात्मनात्मानं नात्मानमवसादयेत्। आत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥",
    transliteration:
      "uddhared ātmanātmānaṁ nātmānam avasādayet, ātmaiva hy ātmano bandhur ātmaiva ripur ātmanaḥ",
    hindiMeaning:
      "मनुष्य को स्वयं अपने द्वारा अपना उत्थान करना चाहिए, स्वयं को गिराना नहीं चाहिए; क्योंकि मन ही मनुष्य का मित्र है और मन ही उसका शत्रु।",
    englishMeaning:
      "I must take responsibility for raising myself rather than becoming the reason I fall behind.",
    personalReflection:
      "This reminds me that progress usually begins with the decisions I make when nobody is forcing me to make them: whether I return to the problem, keep learning, and finish what I started.",
  },
  {
    id: "right-to-action",
    source: "भगवद्गीता",
    reference: "2.47",
    sanskrit: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥",
    transliteration:
      "karmaṇy evādhikāras te mā phaleṣu kadācana, mā karma-phala-hetur bhūr mā te saṅgo 'stv akarmaṇi",
    hindiMeaning:
      "मेरा अधिकार कर्म करने में है, केवल परिणाम पर नहीं। इसलिए परिणाम की चिंता मुझे कर्म से दूर नहीं करनी चाहिए।",
    englishMeaning:
      "My responsibility is to do the work well; I cannot completely control what follows from it.",
    personalReflection:
      "When a project becomes difficult, I try to bring my attention back to the part I can actually control: understanding the problem, making sound decisions, and doing the work properly.",
  },
  {
    id: "equanimity",
    source: "भगवद्गीता",
    reference: "2.48",
    sanskrit:
      "योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय। सिद्ध्यसिद्ध्योः समो भूत्वा समत्वं योग उच्यते॥",
    transliteration:
      "yoga-sthaḥ kuru karmāṇi saṅgaṁ tyaktvā dhanañjaya, siddhy-asiddhyoḥ samo bhūtvā samatvaṁ yoga ucyate",
    hindiMeaning:
      "सफलता और असफलता दोनों में संतुलित रहकर अपना कर्म करना मुझे परिणाम से अधिक प्रक्रिया पर ध्यान देना सिखाता है।",
    englishMeaning:
      "Remaining steady through both success and failure helps me keep the quality of the process at the center.",
    personalReflection:
      "A failed build or rejected approach is useful information. It becomes easier to learn from failure when I stop treating it as a verdict on the entire effort.",
  },
  {
    id: "knowledge",
    source: "भगवद्गीता",
    reference: "4.38",
    sanskrit:
      "न हि ज्ञानेन सदृशं पवित्रमिह विद्यते। तत्स्वयं योगसंसिद्धः कालेनात्मनि विन्दति॥",
    transliteration:
      "na hi jñānena sadṛśaṁ pavitram iha vidyate, tat svayaṁ yoga-saṁsiddhaḥ kālenātmani vindati",
    hindiMeaning:
      "ज्ञान का वास्तविक मूल्य तब समझ आता है जब समय, अभ्यास और अनुभव उसे केवल सूचना से आगे ले जाते हैं।",
    englishMeaning:
      "Knowledge becomes meaningful when practice and experience turn information into understanding.",
    personalReflection:
      "I understand technology much better after I have built with it, broken something, investigated why it failed, and improved the next version.",
  },
  {
    id: "steadiness",
    source: "भगवद्गीता",
    reference: "6.26",
    sanskrit: "यतो यतो निश्चरति मनश्चञ्चलमस्थिरम्। ततस्ततो नियम्यैतदात्मन्येव वशं नयेत्॥",
    transliteration:
      "yato yato niścarati manaś cañcalam asthiram, tatas tato niyamyaitad ātmany eva vaśaṁ nayet",
    hindiMeaning: "मन जब-जब भटकता है, उसे बार-बार वापस लाना ही अभ्यास का हिस्सा है।",
    englishMeaning:
      "Whenever my attention wanders, the practice is simply to bring it back.",
    personalReflection:
      "Deep work is rarely about perfect concentration. For me it is much more about noticing distraction early and deliberately returning to the problem.",
  },
  {
    id: "truth-to-light",
    source: "बृहदारण्यक उपनिषद्",
    reference: "1.3.28",
    sanskrit: "असतो मा सद्गमय। तमसो मा ज्योतिर्गमय। मृत्योर्मा अमृतं गमय॥",
    transliteration:
      "asato mā sad gamaya, tamaso mā jyotir gamaya, mṛtyor mā amṛtaṁ gamaya",
    hindiMeaning:
      "अस्पष्टता से सत्य की ओर और अज्ञान से समझ की ओर बढ़ना मेरे लिए सीखने की मूल दिशा है।",
    englishMeaning:
      "I want learning to move me from uncertainty toward truth and from not knowing toward understanding.",
    personalReflection:
      "Engineering problems often begin with incomplete information. I enjoy replacing assumptions with measurements, vague ideas with models, and uncertainty with something I can explain.",
  },
  {
    id: "learning-together",
    source: "तैत्तिरीय उपनिषद्",
    reference: "शान्ति मन्त्र",
    sanskrit:
      "सह नाववतु। सह नौ भुनक्तु। सह वीर्यं करवावहै। तेजस्विनावधीतमस्तु मा विद्विषावहै॥",
    transliteration:
      "saha nāv avatu, saha nau bhunaktu, saha vīryaṁ karavāvahai, tejasvināv adhītam astu mā vidviṣāvahai",
    hindiMeaning:
      "अच्छी सीख केवल अकेले आगे बढ़ने में नहीं, साथ काम करने और एक-दूसरे की समझ को बेहतर बनाने में भी है।",
    englishMeaning:
      "Learning becomes stronger when people work together, exchange ideas, and help each other understand more clearly.",
    personalReflection:
      "Some of my best learning has happened while explaining an idea, reviewing someone else's approach, or discovering that another perspective exposed something I had missed.",
  },
  {
    id: "integrity",
    source: "तैत्तिरीय उपनिषद्",
    reference: "1.11",
    sanskrit: "सत्यं वद। धर्मं चर। स्वाध्यायान्मा प्रमदः॥",
    transliteration: "satyaṁ vada, dharmaṁ cara, svādhyāyān mā pramadaḥ",
    hindiMeaning:
      "सत्यनिष्ठा, जिम्मेदारी और निरंतर अध्ययन अच्छे कार्य की बुनियादी शर्तें हैं।",
    englishMeaning:
      "Integrity, responsibility, and continuing to learn are foundations of work worth trusting.",
    personalReflection:
      "I would rather document a limitation honestly than make a project sound more impressive than it is. Good engineering depends on being truthful about what works and what still needs improvement.",
  },
  {
    id: "wholeness",
    source: "ईशावास्य उपनिषद्",
    reference: "शान्ति मन्त्र",
    sanskrit: "पूर्णमदः पूर्णमिदं पूर्णात्पूर्णमुदच्यते। पूर्णस्य पूर्णमादाय पूर्णमेवावशिष्यते॥",
    transliteration:
      "pūrṇam adaḥ pūrṇam idaṁ pūrṇāt pūrṇam udacyate, pūrṇasya pūrṇam ādāya pūrṇam evāvaśiṣyate",
    hindiMeaning:
      "किसी प्रणाली को केवल उसके अलग-अलग हिस्सों से नहीं, उनके बीच के संबंधों से भी समझना पड़ता है।",
    englishMeaning:
      "Understanding a system means understanding not only its parts, but also the relationships between them.",
    personalReflection:
      "This is close to how I naturally approach engineering. One local decision can affect interfaces, data, hardware, security, performance, and the behavior of the whole system.",
  },
  {
    id: "arise-awake",
    source: "कठोपनिषद्",
    reference: "1.3.14",
    sanskrit:
      "उत्तिष्ठत जाग्रत प्राप्य वरान्निबोधत। क्षुरस्य धारा निशिता दुरत्यया दुर्गं पथस्तत्कवयो वदन्ति॥",
    transliteration:
      "uttiṣṭhata jāgrata prāpya varān nibodhata, kṣurasya dhārā niśitā duratyayā durgaṁ pathas tat kavayo vadanti",
    hindiMeaning:
      "उठना, जागरूक रहना और सीखते हुए कठिन मार्ग पर आगे बढ़ना ही विकास का हिस्सा है।",
    englishMeaning:
      "Growth asks me to stay awake, keep learning, and continue even when the path is difficult.",
    personalReflection:
      "The work worth doing is rarely the path with no friction. Difficulty often tells me where I still need patience, knowledge, or a better approach.",
  },
  {
    id: "self-knowledge",
    source: "केनोपनिषद्",
    reference: "2.5",
    sanskrit: "इह चेदवेदीदथ सत्यमस्ति न चेदिहावेदीन्महती विनष्टिः।",
    transliteration:
      "iha ced avedīd atha satyam asti, na ced ihāvedīn mahatī vinaṣṭiḥ",
    hindiMeaning:
      "जो समझ अभी प्राप्त की जा सकती है, उसे भविष्य पर टालना सीखने का अवसर खो देना है।",
    englishMeaning:
      "If something can be understood now, postponing that understanding only delays growth.",
    personalReflection:
      "I try not to leave important questions unexplored simply because the first answer is inconvenient. Understanding usually compounds when I investigate early.",
  },
  {
    id: "mind-and-focus",
    source: "भगवद्गीता",
    reference: "6.35",
    sanskrit: "असंशयं महाबाहो मनो दुर्निग्रहं चलम्। अभ्यासेन तु कौन्तेय वैराग्येण च गृह्यते॥",
    transliteration:
      "asaṁśayaṁ mahā-bāho mano durnigrahaṁ calam, abhyāsena tu kaunteya vairāgyeṇa ca gṛhyate",
    hindiMeaning:
      "मन को स्थिर करना कठिन है, लेकिन अभ्यास और अनुशासन के साथ उसे दिशा दी जा सकती है।",
    englishMeaning:
      "Focus is difficult, but practice and discipline make it trainable.",
    personalReflection:
      "Consistency matters more than waiting to feel perfectly motivated. Returning to the work regularly is what slowly turns intention into capability.",
  },
] as const satisfies readonly DailyReflection[];

function createLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function hashDateKey(dateKey: string) {
  let hash = 2166136261;

  for (const character of dateKey) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function getDailyReflection(date: Date): DailyReflection {
  const dateKey = createLocalDateKey(date);
  const reflectionIndex = hashDateKey(dateKey) % reflections.length;

  return reflections[reflectionIndex];
}
