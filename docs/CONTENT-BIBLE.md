# Content bible

How content is sourced, structured and authored. **Content is data.** Nothing
in this document should ever appear as a literal in a React component.

## Provenance is mandatory

Every content item may carry a `source_id` pointing at `content_sources`, which
records name, URL, licence, licence URL and attribution text.

This is not bookkeeping. The standard Japanese-language datasets carry real
obligations:

| Dataset                     | Typical licence | Obligation                      |
| --------------------------- | --------------- | ------------------------------- |
| JMdict / EDICT (vocabulary) | CC BY-SA        | Attribution **and** share-alike |
| KANJIDIC2 (kanji)           | CC BY-SA        | Attribution and share-alike     |
| KanjiVG (stroke order)      | CC BY-SA        | Attribution and share-alike     |
| Tatoeba (example sentences) | CC BY           | Attribution                     |

**TODO — DECISION REQUIRED:** Which sources will actually be used has not been
decided, and the licences above are indicative, not verified. Share-alike terms
in particular need a real reading before any of it ships — they can attach
conditions to derived content. Verify each licence against its current text
before import.

An attribution page can be generated from `content_sources`; it should be,
rather than maintained by hand.

## Structured, not free-form

### Furigana is stored, not computed

Furigana lives in a `jsonb` column as aligned segments:

```json
[{ "text": "食", "ruby": "た" }, { "text": "べる" }]
```

Mapping a reading onto mixed kanji/kana at render time is genuinely ambiguous —
一日 is both いちにち and ついたち — and getting it wrong is visible to the learner
on the screen where they are learning to read. Alignment is an editorial
decision made once, at authoring time. Type: `FuriganaText` in
`src/types/content.ts`.

### Prose is a closed node set

Explanations are stored as `ProseNode[]`, not HTML and not Markdown. A closed
set of nodes (`paragraph`, `heading`, `list`, `callout`, `example`) can be
rendered safely without a sanitiser, restyled by the design system, and
translated. See `src/types/content.ts`.

**TODO — DECISION REQUIRED:** confirm this node set covers the grammar
explanations we intend to write, before authoring begins in bulk.

## Authoring rules

1. **One item, one row.** A word taught in N5 and reused in N3 is the same
   `content_items` row. Never copied.
2. **Slugs are permanent.** They appear in URLs and in imports.
3. **Draft by default.** Everything is created `draft`; RLS hides it. Setting
   `published` is the act of shipping it.
4. **Publish parents first.** A published lesson inside a draft unit is
   invisible: child visibility policies check the parent.
5. **Positions are dense and 1-based** within their parent.
6. **Audio and graphics are `media_assets`**, referenced by id. No URLs in
   content columns.

## Japanese-specific requirements

These are the details that make Japanese content look wrong when neglected:

- **Font stack.** Japanese text must render in Noto Sans JP. A generic
  `sans-serif` fallback resolves to a Chinese font on many systems, drawing a
  noticeable minority of characters in the wrong regional form. Enforced by
  `:lang(ja)` in `globals.css`; mark Japanese text with `lang="ja"`.
- **Line height.** Japanese needs looser leading than Latin at the same size.
  Handled by the same rule.
- **IME safety.** Any text input accepting Japanese must not act on
  `keydown`/`input` during IME composition — the learner is mid-conversion, and
  the intermediate text is not their answer. Use `compositionstart` /
  `compositionend`. _(No input component exists yet; this is a standing
  requirement for when one does.)_
- **Pitch accent** is stored on `vocabulary.pitch_accent` (0 = heiban). Nullable
  — unknown is not the same as flat.
- **Counters and readings** vary by context (一日, 一人). Store the reading with
  the item that uses it, never derive it.

## Open questions

- **TODO — DECISION REQUIRED:** Who authors content, and through what? There is
  no CMS. Current assumption: ingestion scripts using the service-role key.
- **TODO — DECISION REQUIRED:** Where does audio come from — recorded, licensed,
  or synthesised? This affects quality expectations and cost per item.
- **TODO — DECISION REQUIRED:** Is content versioned, or edited in place? Today
  it is edited in place, and an edit silently changes what past learners saw.
- **TODO — DECISION REQUIRED:** Romaji policy. Is romaji shown at all, and if
  so, until when? It is not modelled anywhere except `kana.romaji`.
