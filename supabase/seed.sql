-- ============================================================================
-- Seed data: Hiragana → あいうえお (the first real lesson).
--
-- Applied by `supabase db reset` after every migration. This is content, not
-- schema, which is why it lives here rather than in a migration -- see
-- docs/CONTENT-BIBLE.md.
--
-- Scope, deliberately: one unit, one lesson, five characters (the vowels),
-- ten practice questions (one recognition + one recall per character). Not
-- the rest of the gojūon, not Katakana, not any other level. See
-- docs/LEARNING-ENGINE.md for how a lesson's blocks are assembled and
-- rendered from exactly this shape of data.
--
-- Idempotent: every insert either targets a fixed id or upserts on its
-- natural unique key, so re-running `supabase db reset` (or this file alone)
-- reproduces the same content rather than erroring or duplicating it.
-- ============================================================================

do $$
declare
  v_level_id uuid;
  v_unit_id uuid;
  v_lesson_id uuid;
  v_source_id uuid;
  v_block_id uuid;
  v_question_id uuid;
  v_position smallint := 0;
  i int;

  -- The five vowels, in gojūon order. Every per-character array below is
  -- indexed the same way (index 1 = あ, ... index 5 = お).
  v_chars text[] := array['あ', 'い', 'う', 'え', 'お'];
  v_romaji text[] := array['a', 'i', 'u', 'e', 'o'];

  v_mnemonics text[] := array[
    'Sounds like the "a" in "father".',
    'Sounds like the "ee" in "see".',
    'A short, unrounded "oo" -- like the oo in "food", but clipped.',
    'Sounds like the "e" in "bed".',
    'Sounds like the "o" in "go".'
  ];

  -- Fixed ids so later inserts (lesson_content_items, question_options) can
  -- reference a specific character without a lookup query.
  v_item_ids uuid[] := array[
    'a0000000-0000-4000-a000-000000000001'::uuid,
    'a0000000-0000-4000-a000-000000000002'::uuid,
    'a0000000-0000-4000-a000-000000000003'::uuid,
    'a0000000-0000-4000-a000-000000000004'::uuid,
    'a0000000-0000-4000-a000-000000000005'::uuid
  ];

  -- Recognition = character → sound. Recall = sound → character.
  -- See docs/SRS.md ("Card creation") for why these two, and only these two,
  -- exist for this slice.
  v_recognition_question_ids uuid[] := array[
    'c0000000-0000-4000-c000-000000000001'::uuid,
    'c0000000-0000-4000-c000-000000000002'::uuid,
    'c0000000-0000-4000-c000-000000000003'::uuid,
    'c0000000-0000-4000-c000-000000000004'::uuid,
    'c0000000-0000-4000-c000-000000000005'::uuid
  ];
  v_recall_question_ids uuid[] := array[
    'd0000000-0000-4000-d000-000000000001'::uuid,
    'd0000000-0000-4000-d000-000000000002'::uuid,
    'd0000000-0000-4000-d000-000000000003'::uuid,
    'd0000000-0000-4000-d000-000000000004'::uuid,
    'd0000000-0000-4000-d000-000000000005'::uuid
  ];
begin
  -- The curriculum migration seeds all seven levels as 'draft'. Publishing
  -- one is content work (there is now a real lesson under it), not schema
  -- work, which is why it happens here rather than in that migration.
  select id into v_level_id from public.levels where code = 'hiragana';
  update public.levels set status = 'published' where id = v_level_id;

  insert into public.content_sources (slug, name, license, attribution_required, notes)
  values (
    'editorial',
    'In-house editorial content',
    'Proprietary',
    false,
    'Original content authored for this product; not derived from a third-party dataset. See docs/CONTENT-BIBLE.md.'
  )
  on conflict (slug) do update set name = excluded.name
  returning id into v_source_id;

  insert into public.units (level_id, slug, title, description, position, status)
  values (
    v_level_id,
    'gojuon',
    'The gojūon',
    'The core sounds of hiragana, in their traditional table order.',
    1,
    'published'
  )
  on conflict (level_id, slug) do update set status = excluded.status
  returning id into v_unit_id;

  insert into public.lessons
    (unit_id, slug, title, subtitle, position, estimated_minutes, primary_skill, status)
  values (
    v_unit_id,
    'a-i-u-e-o',
    'あいうえお',
    'The five vowel sounds',
    1,
    8,
    'hiragana',
    'published'
  )
  on conflict (unit_id, slug) do update set status = excluded.status
  returning id into v_lesson_id;

  -- ---------------------------------------------------------------------
  -- Block 1: intro (prose)
  -- ---------------------------------------------------------------------
  v_position := v_position + 1;
  insert into public.lesson_content (lesson_id, position, block_type, props, is_required)
  values (
    v_lesson_id,
    v_position,
    'prose',
    jsonb_build_object(
      'body', jsonb_build_array(
        jsonb_build_object(
          'type', 'paragraph',
          'content', jsonb_build_array(jsonb_build_object(
            'type', 'text',
            'value', 'Hiragana is the core phonetic alphabet of Japanese -- every sound in the language can be written with it. This lesson covers the first five characters: the vowels.'
          ))
        ),
        jsonb_build_object(
          'type', 'paragraph',
          'content', jsonb_build_array(jsonb_build_object(
            'type', 'text',
            'value', 'Each character stands for exactly one sound and never changes. Learn these five and you can already sound out anything written using them.'
          ))
        )
      )
    ),
    true
  )
  on conflict (lesson_id, position) do update set props = excluded.props;

  -- ---------------------------------------------------------------------
  -- Content: the five characters as content items
  -- ---------------------------------------------------------------------
  for i in 1..5 loop
    insert into public.content_items (id, item_type, slug, status, source_id)
    values (v_item_ids[i], 'kana', 'hiragana-' || v_romaji[i], 'published', v_source_id)
    on conflict (id) do update set status = excluded.status;

    insert into public.kana
      (item_id, character, script, romaji, gojuon_row, gojuon_column, variant, mnemonic)
    values (v_item_ids[i], v_chars[i], 'hiragana', v_romaji[i], 'a', v_romaji[i], 'base', v_mnemonics[i])
    on conflict (item_id) do update set mnemonic = excluded.mnemonic;
  end loop;

  -- ---------------------------------------------------------------------
  -- Block 2: the five characters presented together (kana)
  -- ---------------------------------------------------------------------
  v_position := v_position + 1;
  insert into public.lesson_content (lesson_id, position, block_type, props, is_required)
  values (v_lesson_id, v_position, 'kana', '{}'::jsonb, true)
  on conflict (lesson_id, position) do update set block_type = excluded.block_type
  returning id into v_block_id;

  for i in 1..5 loop
    insert into public.lesson_content_items (block_id, item_id, position)
    values (v_block_id, v_item_ids[i], i)
    on conflict (block_id, item_id) do update set position = excluded.position;
  end loop;

  -- ---------------------------------------------------------------------
  -- Blocks 3-7: recognition practice -- character → sound, one per vowel
  -- ---------------------------------------------------------------------
  for i in 1..5 loop
    v_question_id := v_recognition_question_ids[i];

    insert into public.questions
      (id, question_type, skill, prompt, explanation, item_id, item_direction,
       difficulty, jlpt_level, status, source_id)
    values (
      v_question_id,
      'multiple_choice',
      'hiragana',
      jsonb_build_object(
        'text', 'What sound does this character make?',
        'displayKind', 'japanese',
        'displayValue', v_chars[i],
        'optionDisplayKind', 'romaji'
      ),
      jsonb_build_object('text', v_mnemonics[i]),
      v_item_ids[i],
      'recognition',
      1,
      'hiragana',
      'published',
      v_source_id
    )
    on conflict (id) do update set
      prompt = excluded.prompt,
      explanation = excluded.explanation,
      status = excluded.status;

    delete from public.question_options where question_id = v_question_id;
    insert into public.question_options (question_id, position, content, is_correct)
    select v_question_id, gs, jsonb_build_object('text', v_romaji[gs]), (gs = i)
    from generate_series(1, 5) as gs;

    v_position := v_position + 1;
    insert into public.lesson_content (lesson_id, position, block_type, question_id, is_required)
    values (v_lesson_id, v_position, 'question', v_question_id, true)
    on conflict (lesson_id, position) do update set question_id = excluded.question_id;
  end loop;

  -- ---------------------------------------------------------------------
  -- Blocks 8-12: recall practice -- sound → character, one per vowel
  -- ---------------------------------------------------------------------
  for i in 1..5 loop
    v_question_id := v_recall_question_ids[i];

    insert into public.questions
      (id, question_type, skill, prompt, explanation, item_id, item_direction,
       difficulty, jlpt_level, status, source_id)
    values (
      v_question_id,
      'multiple_choice',
      'hiragana',
      jsonb_build_object(
        'text', 'Which character makes this sound?',
        'displayKind', 'romaji',
        'displayValue', v_romaji[i],
        'optionDisplayKind', 'japanese'
      ),
      jsonb_build_object('text', 'The sound "' || v_romaji[i] || '" is written ' || v_chars[i] || '.'),
      v_item_ids[i],
      'recall',
      1,
      'hiragana',
      'published',
      v_source_id
    )
    on conflict (id) do update set
      prompt = excluded.prompt,
      explanation = excluded.explanation,
      status = excluded.status;

    delete from public.question_options where question_id = v_question_id;
    insert into public.question_options (question_id, position, content, is_correct)
    select v_question_id, gs, jsonb_build_object('text', v_chars[gs]), (gs = i)
    from generate_series(1, 5) as gs;

    v_position := v_position + 1;
    insert into public.lesson_content (lesson_id, position, block_type, question_id, is_required)
    values (v_lesson_id, v_position, 'question', v_question_id, true)
    on conflict (lesson_id, position) do update set question_id = excluded.question_id;
  end loop;
end $$;
