# SiamVocab UI update

Changes in this package:
- Updated the primary green accent to a clean blue theme to match the supplied UI reference.
- Removed the PDF import entry from desktop/mobile navigation and removed the PDF overview panel from the dashboard.
- Simplified flashcard recall to two clear actions: “আবার শিখব” and “আমি জানি”.
- Added explicit “উত্তর দেখুন”, previous/next card navigation, and shuffle controls.
- Kept the existing vocabulary data, Supabase auth integration, and study tracking logic.

Note: PDF-related source modules remain in the repository but are no longer reachable from the app navigation/dashboard. Remove them separately only if you want the underlying PDF code and dependencies deleted too.

- Added the requested quick-learning tabs: Article Trainer, Verbs, and Sentence Practice. Article Trainer opens multiple-choice practice, Verbs opens the vocabulary library, and Sentence Practice opens listening/typed German practice.

- Preserved and restored dashboard analytics panels: mastery by CEFR level, weakest words, and sentence-building connector stats. Mastery and weakest-word data are calculated from actual vocabulary progress; sentence-building remains an honest empty-state until that activity is implemented.
- Removed the remaining PDF import shortcut from the dashboard.

- Added the uploaded A1 vocabulary dataset (1,739 words across 12 chapters) and A2 dataset (1,448 words across 12 chapters), including Bengali and English meanings and example sentences.
- Added A1/A2 chapter-aware browsing and practice selectors alongside the existing B1 chapters. A1/A2 chapter IDs are namespaced so Kapitel 1 from different levels never gets mixed together.
- Updated the local dataset migration to preserve existing favorites, SRS progress, correct/mistake counts, and user-added vocabulary while adding the new levels.
