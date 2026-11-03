import type { AnkiFields } from "#/src/lib/types";

const replayButton = (index: number) =>
  `<a class="replay-button soundLink" href="#" onclick="pycmd('play:a:${index}'); return false;" draggable="false">
    <svg class="playImage" viewBox="0 0 64 64" version="1.1">
        <circle cx="32" cy="32" r="29"></circle>
        <path d="M56.502,32.301l-37.502,20.101l0.329,-40.804l37.173,20.703Z"></path>
    </svg>
</a>`;

/** Fields for the development preview, shaped like a note mined with Yomitan. */
// oxfmt-ignore
export const exampleFields: AnkiFields = {
  Expression: "reluctant",
  // Shaped like Yomitan's {phonetic-transcriptions} output.
  ExpressionIPA: "<ul><li class=\"pronunciation\" data-pronunciation-type=\"phonetic-transcription\"><i>(<span class=\"tag\" data-details=\"UK\">UK</span>)</i> /rɪˈlʌk.tənt/</li><li class=\"pronunciation\" data-pronunciation-type=\"phonetic-transcription\"><i>(<span class=\"tag\" data-details=\"UK\">UK</span>)</i> [ɹɪˈlʌk.tʰn̩t]</li><li class=\"pronunciation\" data-pronunciation-type=\"phonetic-transcription\"><i>(<span class=\"tag\" data-details=\"US\">US</span>)</i> /ɹɪˈlʌk.tənt/</li><li class=\"pronunciation\" data-pronunciation-type=\"phonetic-transcription\"><i>(<span class=\"tag\" data-details=\"US\">US</span>)</i> [ɹɪˈlʌk.tn̩t]</li><li class=\"pronunciation\" data-pronunciation-type=\"phonetic-transcription\"><i>(<span class=\"tag\" data-details=\"General Australian\">General Australian</span>)</i> /rəˈlak.tənt/</li></ul>",
  ExpressionAudio: replayButton(0),
  RelatedExpression: "",
  SelectionText: "",
  MainDefinition: `<div style="text-align: left;" class="yomitan-glossary"><ol><li data-dictionary="Wiktionary"><i>(adj, Wiktionary)</i> <span><ul><li>Not wanting to take some action; unwilling.</li><li>Opposing; offering resistance.</li></ul></span></li></ol></div>`,
  DefinitionPicture: "",
  Sentence: "She was <b>reluctant</b> to leave the house in such terrible weather.",
  SentenceAudio: "",
  SentenceTranslation: "Ella no quería salir de casa con un tiempo tan horrible.",
  Picture: "",
  Glossary: `<div style="text-align: left;" class="yomitan-glossary"><ol><li data-dictionary="Wiktionary"><i>(adj, Wiktionary)</i> <span><ul><li>Not wanting to take some action; unwilling.</li><li>Opposing; offering resistance.</li></ul></span></li><li data-dictionary="WordNet"><i>(adj, WordNet)</i> <span>unwillingness to do something contrary to your custom</span></li></ol></div>`,
  Hint: "",
  IsWordAndSentenceCard: "",
  IsClickCard: "",
  IsSentenceCard: "",
  IsAudioCard: "",
  Frequency: `<ul style="text-align: left;"><li>COCA: 6418</li><li>Wikipedia: 9270</li></ul>`,
  FreqSort: "6418",
  MiscInfo: "The Old Man and the Sea",
  Tags: "yomitan",
  CardID: "1785064007553",
};
