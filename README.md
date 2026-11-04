# 菊 Kiku EN

An Anki note type for learning English vocabulary by sentence mining: a fork of
[Kiku](https://github.com/youyoumu/kiku) by youyoumu, adapted from Japanese to
English.

Kiku EN keeps what is useful for any language (the interactive card, related
cards from your collection, merging duplicate contexts, field groups, themes,
plugins, AnkiDroid integration) and replaces the Japanese-specific parts:

| Kiku (Japanese)                            | Kiku EN                                                  |
| ------------------------------------------ | -------------------------------------------------------- |
| Furigana and reading fields                | `ExpressionIPA`, shown as one chip per variant (UK, US…) |
| Pitch accent graphs and colours            | Covered by IPA, which marks stress (ˈ ˌ)                 |
| Kanji page, kanji tooltips, kanji database | Removed                                                  |
| Related cards by kanji and reading         | Related cards by word and `RelatedExpression`            |
| Cards sharing a kanji                      | Word family and homophones from your collection          |
| Front side shows homographs with a reading | Shows heteronyms with their IPA (_read_ /riːd/, /rɛd/)   |
| JPDB, Jisho, Google Japan links            | Cambridge, Merriam-Webster, Wiktionary, YouGlish, Images |
| Japanese fonts, vertical writing           | Latin fonts, with IPA-friendly serifs (Charis, Gentium)  |

Kiku EN uses its own note type name (`Kiku EN`), media files (`_kikuen*`) and
identifiers, so it can live in the same collection as Kiku.

## Fields

| Field                                                                   | Yomitan marker                                    |
| ----------------------------------------------------------------------- | ------------------------------------------------- |
| `Expression`                                                            | `{expression}`                                    |
| `ExpressionIPA`                                                         | `{phonetic-transcriptions}`                       |
| `ExpressionAudio`                                                       | `{audio}`                                         |
| `RelatedExpression`                                                     |                                                   |
| `SelectionText`                                                         | `{popup-selection-text}`                          |
| `MainDefinition`                                                        | `{glossary-first}`                                |
| `DefinitionPicture`                                                     |                                                   |
| `Sentence`                                                              | `{cloze-prefix}<b>{cloze-body}</b>{cloze-suffix}` |
| `SentenceAudio`                                                         | from your sentence audio tool                     |
| `SentenceTranslation`                                                   | your translation                                  |
| `Picture`                                                               | `{screenshot}`                                    |
| `Glossary`                                                              | `{glossary}`                                      |
| `Hint`                                                                  |                                                   |
| `IsWordAndSentenceCard`, `IsClickCard`, `IsSentenceCard`, `IsAudioCard` | card type flags, as in Kiku                       |
| `Frequency`                                                             | `{frequencies}`                                   |
| `FreqSort`                                                              | `{frequency-harmonic-rank}`                       |
| `MiscInfo`                                                              | `{document-title}`                                |

`{phonetic-transcriptions}` needs an IPA dictionary installed in Yomitan, such
as the Wiktionary IPA dictionaries from
[wiktionary-to-yomitan](https://github.com/yomidevs/wiktionary-to-yomitan).
`ExpressionIPA` also accepts IPA typed by hand: `UK: /ˈwɔːtə/, US: /ˈwɑːtər/`.

## Dictionaries

The glossary is shown one page per dictionary, in Yomitan's order (the
_Definition → Style_ setting has the other layouts). A setup that works well,
in this order:

| Dictionary        | Kind        | Why                                                                        |
| ----------------- | ----------- | -------------------------------------------------------------------------- |
| `seth-oald-extra` | definitions | Oxford Advanced Learner's: plain definitions, examples, Oxford 3000/5000   |
| `wty-en-es-gloss` | definitions | Translations into Spanish (or the `wty-en-xx-gloss` for your language)     |
| `wty-en-en`       | definitions | Wiktionary: the catch-all for slang, archaic and rare words; has etymology |
| `seth-oald-ipa`   | IPA         | One US and one UK transcription, so these come first on the card           |
| `wty-en-en-ipa`   | IPA         | Every accent Wiktionary knows, and the other readings of heteronyms        |
| `yzk-freq-en`     | frequency   | Sorts Yomitan's results (rank, ascending) and fills `Frequency`/`FreqSort` |

Flags in accent labels (🇺🇸, 🇬🇧) are shown as text, since Windows doesn't draw
flag emoji.

Pages are named after each dictionary's alias in Yomitan (_Dictionaries →
Alias_), e.g. `Oxford`, `Español`, `Wiktionary`. Keep Yomitan's _Compact tags_
off: the card reads the dictionary from the last tag of each entry.

On a card, `MiscInfo` is hidden when it's only the title of Yomitan's own
search page or settings preview.

## Word family and homophones

On the back side, next to the related cards, Kiku EN lists your other cards in
the word's family and the ones that sound the same:

> **bear** · _family_ bear with · unbearable · _sounds like_ bare

- **Family**: words that share a root once common prefixes and suffixes are
  taken off (_un-_, _re-_, _mis-_, _-able_, _-ness_, _-ing_…, with spelling
  changes like _happy_ → _happiness_). Phrasal verbs count by their verb:
  _get over_ is family of _get_, not of _take over_.
- **Sounds like**: different words whose pronunciations shown on the card are
  the same (_bear_ /ber/ and _bare_ /ber/), whatever the IPA notation.

Both only look at your own cards, so a false friend like _early_ / _ear_ only
shows up if you have both. As with related cards, unstudied cards are left out
unless _Related Expression → Exclude New Cards_ is off.

### Yomitan popup

[`yomitan/popup.css`](yomitan/popup.css) restyles Yomitan's popup to match:
pronunciations on one line (Oxford's US and UK, with Wiktionary's accents on
hover), one card per entry coloured by dictionary, tag pills, numbered senses
and two examples per sense (hover for the rest). Paste it into _Settings →
Appearance → Configure custom CSS → Popup CSS_. It works with the light and dark
themes.

## Install

Requires Node.js 24+, and Anki running with
[AnkiConnect](https://ankiweb.net/shared/info/2055492159).

```sh
corepack pnpm install
cd packages/note
corepack pnpm apply
```

`apply` builds the note, stores its files in Anki's media folder and creates
the `Kiku EN` note type, or updates it if it already exists. Your
`_kikuen_plugin.js` and `_kikuen_plugin.css` are kept if present.

## Development

```sh
cd packages/note
corepack pnpm test        # unit tests
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm dev         # preview at http://localhost:5173/?side=front (or back)
```

The preview shows Anki media when `ANKI_COLLECTION_MEDIA_PATH` is set in
`packages/note/.env` (see `.env.example`).

## Credits

Kiku EN is based on [Kiku](https://github.com/youyoumu/kiku) by youyoumu,
under the MIT License. See [LICENSE](LICENSE).
