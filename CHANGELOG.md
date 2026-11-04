# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Kiku EN [Unreleased]

### Changed

- Definitions show one page per dictionary by default, with a tab per dictionary
  instead of the page-picker dialog.
- Dictionary entries are restyled: part of speech and Oxford 3000/5000 as tags,
  numbered senses, examples set off (folded after two), and Wiktionary's
  grammar, etymology, synonyms and antonyms made compact.
- IPA accent labels written as flag emoji are shown as text (US, UK, England),
  and a transcription repeated for the next accent is shown once.
- README: recommended English dictionaries and their order.
- Dictionary pages are named after the dictionary's alias in Yomitan.
- `MiscInfo` is hidden when it's only the title of a Yomitan page
  ("Yomitan Popup Preview", "word - Yomitan Search").
- Translations (`wty-en-xx-gloss`) show four per sense, the rest behind "+N";
  in `yomitan/popup.css`, on hover.
- Wiktionary's sense tags ("arch") are pills with their full name ("archaic").
- External links show each site's icon, as same-size squares, instead of
  letter badges.
- Oxford's idioms are set apart from the senses, at the end of their entry,
  instead of inside the last sense (on the card and in `yomitan/popup.css`).

### Added

- Word page, opened by tapping the word on the back side: the user's cards for
  words sharing a root (_bear_, _unbearable_, _bear with_), words that sound the
  same (_bear_, _bare_), the same word and related words, with a search box.
- `yomitan/popup.css`: custom CSS for Yomitan's popup, in the card's style.

## Kiku EN [0.1.0] - 2026-11-03

First release of the English adaptation, forked from Kiku 2.1.0.

### Added

- `ExpressionIPA` field, shown on the back as one chip per pronunciation variant.
  Reads Yomitan's `{phonetic-transcriptions}`, lists, and `UK:` / `(US)` labels.
- English external links: Cambridge, Merriam-Webster, Wiktionary, YouGlish, Google Images.
- `apply` creates the note type when it does not exist, and stores files through AnkiConnect.

### Changed

- Note type `Kiku EN`, media files `_kikuen*`, and its own identifiers, so it
  coexists with Kiku in one collection.
- Related cards use the word and `RelatedExpression`; front-side heteronyms are
  told apart by IPA.
- Latin fonts by default, with IPA-friendly serifs.

### Removed

- Furigana, reading and pitch accent fields; the kanji page, tooltips and
  database; vertical writing; Japanese-only plugins; the Kiku Note Manager add-on
  and the documentation site.

## Kiku (upstream) history

## [Unreleased]

## [v2.1.0] - 2026-07-30

### Added

- New plugins: blur-hint, type-reading, fsrs-status, confetti, kanji-info-extra
- New plugin API `CardEnd`
- Warning color badge on leech tag
- New notes indicator on RelatedExpression section
- Opposite kana in reading list
- `applyBoldFormatting` to SentenceFurigana
- Support `MainDefinition` with multiple dictionaries
- Kanji page search bar
- `relatedExpressionExcludeNewCards` config
- `relatedExpressionFallback` config
- More `hide-related-expression` plugin options
- More `custom-pitch-accent-color` plugin option
- `data-orientation` and `data-layout` for expression-picture side by side layout
- Smaller SentenceTranslation on mobile
- Smaller SentenceTranslation padding

### Fixed

- Toast position on AnkiWeb
- Furigana on `AnkiNoteItem`
- Hide Expression in RelatedExpression section if `IsSentenceCard` or `IsAudioCard`
- Only hide `i` element if has no tags
- Reset definition picture index on `ankiFields` change

### Changed

- **BREAKING**: Some container elements now use custom class names instead of tailwind classes
- Optimized AnkiConnect query performance

## [v2.0.0] - 2026-06-24

Stable release. No changes from v2.0.0-beta.3.

## [v2.0.0-beta.3] - 2026-06-22

### Added

- Only override `patternName` if not heiban

### Fixed

- Can't hover ruby when there's `SentenceTranslation`
- CSS conflict with onigiri addon

## [v2.0.0-beta.2] - 2026-06-19

### Fixed

- Picture position on mobile

## [v2.0.0-beta.1] - 2026-06-19

### Added

- Tabs on kanji page
- New fields RelatedExpression and SentenceTranslation
- Go to kanji page from kanji tooltip
- Display git commit SHA on settings page
- Blue indicator for new notes
- Display duplicated cards with different reading on front side
- Dual theme with `theme` and `themeDark` settings
- New section on kanji page `関` (related terms)
- `_kiku_db_main.tar` includes `kiku_db_terms_compact.json.gz` created from jmdict
- Cache `_kiku.css` inside `document.adoptedStyleSheets`
- Indicator whether the notes query is using AnkiConnect or notes cache on kanji page
- Add loading skeleton on every UI with async state
- New spinner style
- Kiku now makes use of [Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)
- Updated docs with new pictures and videos

### Fixed

- Close dialog button on AnkiMobile not working
- Handle kanji with 2 code units
- Handle `<br/>` inside `<style>` on Glossary
- Error indicator when notes query fails
- Disable mute NSFW if running on AnkiDroid old study screen
- Use template tag instead of hidden div
- Disable AnkiDroid integration on AnkiDroid new study screen

### Changed

- **BREAKING**: Some plugin API changed. Please check the updated plugin examples
- **BREAKING**: `--pitch-color` and `--pitch-color-content` CSS variable changed to `--color-pitch` and `--color-pitch-content`
- Reduced overall gap and padding, especially on mobile
- Sort notes query result by the newest first
- Kanji tooltip is now mounted once and shared instead of per span
- Only check for AnkiConnect connection automatically on Anki Desktop
- Startup time also include the time between first code execution and the start of hydration
- Settings page can be opened from front side
- Better `capitalizeSentence` function
- Fetch all `_kiku_notes_*.json.gz` in parallel
- Picture pillar box is now clickable
- Include `html` function in plugin `ctx`
- Change plugin example to use `html` instead of `h` hyperscript
- Make `ruby rt` unselectable
- Switched from `biome` to `oxc` toolchain for linting/formatting

### Removed

- `webFonts` and `volume` settings

[Unreleased]: https://github.com/youyoumu/kiku/compare/v2.1.0...HEAD
[v2.1.0]: https://github.com/youyoumu/kiku/compare/v2.0.0...v2.1.0
[v2.0.0]: https://github.com/youyoumu/kiku/compare/v2.0.0-beta.3...v2.0.0
[v2.0.0-beta.3]: https://github.com/youyoumu/kiku/compare/v2.0.0-beta.2...v2.0.0-beta.3
[v2.0.0-beta.2]: https://github.com/youyoumu/kiku/compare/v2.0.0-beta.1...v2.0.0-beta.2
[v2.0.0-beta.1]: https://github.com/youyoumu/kiku/compare/v1.10.2...v2.0.0-beta.1
