const STOP_WORDS = new Set(
  "a an the is am are was were be been being do does did have has had i me my you your he him his she her it its they them their we our who what where when why how about tell say show explain please can could would should will going to of in on at for from with and or but that this these those any anything know more only previous subject expand good fine thanks anurag kumar bharti ace".split(
    " ",
  ),
);

const CONCEPTS = [
  [
    "experience",
    "employment",
    "employer",
    "career",
    "internship",
    "intern",
    "trainee",
    "worked",
    "job",
  ],
  [
    "education",
    "qualification",
    "college",
    "university",
    "school",
    "degree",
    "graduation",
    "studied",
    "cgpa",
  ],
  ["married", "marry", "marriage", "wife", "husband", "wedding", "spouse"],
  ["girlfriend", "boyfriend", "dating", "single", "relationship"],
  ["friend", "friends", "friendship", "bestie"],
  ["project", "projects", "built", "building"],
  [
    "interests",
    "interest",
    "hobbies",
    "hobby",
    "painting",
    "sketching",
    "travel",
  ],
] as const;

export function isEmploymentQuestion(question: string): boolean {
  return /^(?:(?:tell me about|what is|show me)\s+)?(?:his|anurag(?:’s|'s)?|ace(?:’s|'s)?)?\s*(?:work |professional )?(?:experience|employment|career)[?.!\s]*$/i.test(
    question,
  );
}

export function meaningfulTokens(value: string): string[] {
  return [
    ...new Set(
      (value.toLowerCase().match(/[\p{L}\p{N}+#]+/gu) ?? []).filter(
        (word) => !STOP_WORDS.has(word),
      ),
    ),
  ];
}

function expandedTokens(value: string): string[] {
  const words = meaningfulTokens(value);
  return [
    ...new Set([
      ...words,
      ...CONCEPTS.flatMap((group) =>
        group.some((word) => words.includes(word)) ? group : [],
      ),
    ]),
  ];
}

/** Relevance is established before authority/freshness can boost a source. */
export function memoryRelevance(
  question: string,
  title: string,
  content: string,
): number {
  const query = meaningfulTokens(question);
  const heading = new Set(expandedTokens(title));
  const body = new Set(expandedTokens(content));
  const exactHeading = new Set(meaningfulTokens(title));
  const exactBody = new Set(meaningfulTokens(content));
  if (
    isEmploymentQuestion(question) &&
    !heading.has("experience") &&
    !body.has("experience")
  )
    return 0;
  if (!query.length)
    return /\b(?:anurag|ace)\b/i.test(question) && /^about\b/i.test(title)
      ? 12
      : 0;
  const person = question.match(/^\s*who (?:is|was)\s+(.+?)[?.!]*$/i)?.[1];
  if (person) {
    const name = meaningfulTokens(person);
    if (
      name.length &&
      !name.every((word) => heading.has(word) || body.has(word))
    )
      return 0;
  }
  const matches = query.filter((word) => heading.has(word) || body.has(word));
  if (!matches.length) return 0;
  // A broad shared word ("work", "best") must not hide an unknown named subject.
  if (matches.length / query.length < 0.45) return 0;
  return matches.reduce(
    (score, word) =>
      score +
      (exactHeading.has(word) ? 18 : heading.has(word) ? 6 : 0) +
      (exactBody.has(word) ? 9 : body.has(word) ? 4 : 0),
    0,
  );
}

/** Retain every word, including the tail of a long sentence. */
export function chunkMemory(value: string, maxCharacters = 900): string[] {
  const result: string[] = [];
  let current = "";
  for (const word of value.trim().split(/\s+/u)) {
    if (current && current.length + word.length + 1 > maxCharacters) {
      result.push(current);
      current = "";
    }
    current = current ? `${current} ${word}` : word;
  }
  if (current) result.push(current);
  return result;
}
