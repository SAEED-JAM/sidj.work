# Emlagoo: Android dictation app for Persian schoolchildren

> Emlagoo, built by Sid Jameson: the official textbook audio, aligned word by word and played phrase by phrase for dictation homework. 7.6 hours of audio, 34,361 words, live on Cafe Bazaar.

Page: https://sidj.work/emlagoo/
Author: Sid Jameson (https://sidj.work/)

Built on my own Android app Iran, 2026

# Emlagoo املاگو, the dictation teacher

Every evening in Iran, a parent reads the day’s textbook lesson aloud so their child can write it down: the dictation homework. **Emlagoo does the reading.** It plays the official textbook audio a phrase at a time, pauses so the child can write, repeats, and lights up each word as it’s spoken.

[Get it on Cafe Bazaar ](https://cafebazaar.ir/app/ir.diktegoo.app) [emlagoo.ir ](https://emlagoo.ir/)

Product, design, the Flutter app, the audio pipeline, the data service and the website: me.

- **270:** installs on Cafe Bazaar so far, with in-app purchases live
- **7.6 h:** of textbook audio aligned word by word, all six grades
- **34,361:** words, each with its own start and end time
- **0.5.14:** the version on Bazaar: reminders, notices from a panel, forced updates

## The hard part

The app is simple. The data under it isn’t: to light the right word at the right moment, every word in every lesson needs a timestamp.

Below are the real timings for the start of lesson 2 in the second-grade book. Press play to watch them run. The audio belongs to Roshd, the education ministry’s network, so it isn’t played here.

### Lesson 2, “Our neighbourhood mosque”

Matched by speech recognition Respelled to the book’s spelling Inferred from neighbours

### How 32,102 words were aligned

Speech recognition gets the timing right but writes words its own way. The book has its own spelling, with marks a child is meant to learn. My aligner matches the two phonetically, keeps the book’s spelling, and only infers a word when nothing else works.

Grades 2 to 6, 94 lessons. Grade 1 has no official audiobook, so it uses a voice we recorded.

18,755 matched 13,253 respelled 94 inferred

Grade 2 3,202

Grade 3 4,599

Grade 4 5,715

Grade 5 14,004

Grade 6 4,582

## The pipeline

Raw textbook audio in, a lesson a child can follow out, and the app never needs the internet.

**Audiobook**

The official recordings of each lesson, from Roshd.

115 files

**Speech recognition**

Word-level timings, accurate to a few tenths of a second.

Whisper

**Phonetic aligner**

Mine. Matches what was heard to the book’s text and spelling.

Python

**Music removed**

The audiobooks have background music; a separation model takes it out.

Demucs

**Packed by grade**

Grades 1 and 2 ship inside the app; 3 to 6 download once, then work offline.

55 MB app

## The app

Like a teacher: phrase by phrase, a pause to write, each phrase as many times as you like.

_Image: Emlagoo welcome screen_

No account. Pick a grade and go.

_Image: Choosing a lesson from the second-grade book_

The real books and lessons, with word and phrase counts.

_Image: Setting speed, pause and repeats_

Speed, pause length and repeats, set by the parent.

_Image: A dictation in progress with the current phrase highlighted_

The current phrase, on a notebook page.

_Image: A word circled in red after being tapped_

Tap a word to hear it again, circled in the teacher’s red pen.

_Image: The end of a dictation with the correct text shown_

At the end, the right text to check against.

## Decisions that mattered

Small product, real users, real money. A few calls I’d make again.

### Offline, no account

No login, no product backend. The only server takes anonymous events and feedback for a dashboard, so the app works on a cheap phone with bad internet.

### Free where it counts

Grade 1 up to lesson 11 and the first three lessons of every grade are free. The rest is a one-time purchase per grade, or all grades for a year.

### A QA agent guards every release

Version 0.3.0 reached a teacher with a crash no test covered. Since then an agent runs every test and a smoke test of every lesson before any build can ship.

## Built with

A Flutter app, a Python toolchain for the audio, and a small site with a page for every lesson.

Flutter ExoPlayer (just_audio) Whisper Phonetic aligner (mine) Demucs Python data service and dashboard Cafe Bazaar billing Design tokens to Flutter theme Static site, one page per lesson
