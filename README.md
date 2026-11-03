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
