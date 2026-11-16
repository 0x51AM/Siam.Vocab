import { UiLanguage } from '../types';

export interface Translations {
  brand: string;
  tagline: string;
  nav: {
    dashboard: string;
    study: string;
    vocabulary: string;
    account: string;
  };
  common: {
    startLearning: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    search: string;
    filter: string;
    all: string;
    loading: string;
    retry: string;
    close: string;
    listen: string;
    slowListen: string;
    favorite: string;
    demoLabel: string;
    yourPdfLabel: string;
    page: string;
    chapter: string;
    section: string;
    topic: string;
    level: string;
    source: string;
    attribution: string;
    noPhoto: string;
    fetchPhotos: string;
    changePhoto: string;
    offlineBanner: string;
    installApp: string;
    iosInstallTitle: string;
    iosInstallSteps: string;
  };
  directions: {
    label: string;
    'bn-de': string;
    'de-bn': string;
    'en-de': string;
    'de-en': string;
  };
  dashboard: {
    welcomeTitle: string;
    welcomeSubtitle: string;
    todayProgress: string;
    dailyGoal: string;
    learnedWords: string;
    dueForReview: string;
    accuracy: string;
    streak: string;
    days: string;
    wordsCount: string;
    demoNoticeTitle: string;
    demoNoticeBody: string;
    clearDemoBtn: string;
    restoreDemoBtn: string;
    quickActions: string;
    practiceFlashcards: string;
    practiceMcq: string;
    practiceImageQuiz: string;
    practiceListening: string;
    reviewMistakes: string;
    studyFavorites: string;
    recentPdfs: string;
    noPdfsYet: string;
  };
  study: {
    selectMode: string;
    selectFilter: string;
    filterAll: string;
    filterDue: string;
    filterNew: string;
    filterMistakes: string;
    filterFavorites: string;
    flashcardFlip: string;
    showImage: string;
    hideImage: string;
    exampleSentence: string;
    rateAgain: string;
    rateHard: string;
    rateGood: string;
    rateEasy: string;
    sessionComplete: string;
    sessionCompleteSub: string;
    restartSession: string;
    emptyQueueTitle: string;
    emptyQueueSub: string;
    checkAnswer: string;
    nextQuestion: string;
    correctFeedback: string;
    incorrectFeedback: string;
    typeGermanPlaceholder: string;
    playAudioPrompt: string;
    needPhotosTitle: string;
    needPhotosSub: string;
    cardsRemaining: string;
  };
  vocabulary: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    allPdfs: string;
    allTopics: string;
    allLevels: string;
    statusAll: string;
    statusDue: string;
    statusMastered: string;
    statusMistakes: string;
    statusFavorites: string;
    statusNeedsReview: string;
    needsReviewNotice: string;
    addManual: string;
    emptyTitle: string;
    emptySub: string;
    germanLabel: string;
    banglaLabel: string;
    englishLabel: string;
    pluralLabel: string;
    exampleLabel: string;
    deleteConfirm: string;
  };
  chapters: {
    heading: string;
    subheading: string;
    backToAll: string;
    openChapter: string;
    practiceChapter: string;
    allChapters: string;
    chapterLabel: string;
    masteredCount: string;
    dueCount: string;
    allSections: string;
    prevChapter: string;
    nextChapter: string;
    searchInChapter: string;
    customTitle: string;
    customSub: string;
    selectPrompt: string;
  };
  importPdf: {
    title: string;
    subtitle: string;
    dropTitle: string;
    dropSub: string;
    chooseFile: string;
    ocrModeLabel: string;
    ocrAuto: string;
    ocrForce: string;
    ocrHint: string;
    sampleB1Title: string;
    sampleB1Sub: string;
    loadSampleB1: string;
    extracting: string;
    ocrRunning: string;
    reviewTitle: string;
    reviewSubtitle: string;
    approveAll: string;
    removeDuplicates: string;
    importApproved: string;
    discardDraft: string;
    statusApproved: string;
    statusRejected: string;
    statusDuplicate: string;
    defaultTopic: string;
    defaultLevel: string;
    noEntriesTitle: string;
    noEntriesSub: string;
    saveToCloud: string;
    importSuccess: string;
  };
  account: {
    title: string;
    subtitle: string;
    cloudConnected: string;
    localModeTitle: string;
    localModeSub: string;
    signIn: string;
    signUp: string;
    signOut: string;
    email: string;
    password: string;
    syncNow: string;
    myPdfs: string;
    setupGuideTitle: string;
    setupGuideSub: string;
  };
  practiceSections: {
    articleTrainerTab: string;
    verbsTab: string;
    sentencePracticeTab: string;
    articleTrainerTitle: string;
    articleTrainerSub: string;
    verbsTitle: string;
    verbsSub: string;
    sentenceTitle: string;
    sentenceSub: string;
    sourceVocabulary: string;
    allLevels: string;
    allChapters: string;
    noItemsInScope: string;
    quizTab: string;
    browseTab: string;
    answeredLabel: string;
    accuracyLabel: string;
    streakLabel: string;
    masteredLabel: string;
    shuffleBtn: string;
    resetSessionBtn: string;
    missedOnlyBtn: string;
    allItemsBtn: string;
    chooseArticlePrompt: string;
    correctArticleFeedback: string;
    wrongArticleFeedback: string;
    meaningQuizMode: string;
    typeVerbMode: string;
    verbFormsLabel: string;
    typeVerbPlaceholder: string;
    completionMode: string;
    orderingMode: string;
    translationMode: string;
    pickMissingWord: string;
    arrangeWordsPrompt: string;
    clearOrderBtn: string;
    noSentenceTranslationInData: string;
    searchPlaceholder: string;
  };
}

export const translations: Record<UiLanguage, Translations> = {
  bn: {
    brand: 'SiamVocab',
    tagline: 'Learn German Visually. Remember Forever.',
    nav: {
      dashboard: 'ড্যাশবোর্ড',
      study: 'অনুশীলন',
      vocabulary: 'শব্দভান্ডার',
      account: 'অ্যাকাউন্ট',
    },
    common: {
      startLearning: 'পড়া শুরু করুন',
      save: 'সংরক্ষণ করুন',
      cancel: 'বাতিল',
      delete: 'মুছুন',
      edit: 'সম্পাদনা',
      search: 'খুঁজুন',
      filter: 'ফিল্টার',
      all: 'সব',
      loading: 'লোড হচ্ছে...',
      retry: 'আবার চেষ্টা করুন',
      close: 'বন্ধ করুন',
      listen: 'শুনুন',
      slowListen: 'ধীরে শুনুন',
      favorite: 'প্রিয়',
      demoLabel: 'ডেমো ডেটা',
      yourPdfLabel: 'আপনার PDF',
      page: 'পৃষ্ঠা',
      chapter: 'অধ্যায়',
      section: 'অংশ',
      topic: 'বিষয়',
      level: 'স্তর',
      source: 'উৎস',
      attribution: 'ছবির সূত্র',
      noPhoto: 'উপযুক্ত আসল ছবি পাওয়া যায়নি',
      fetchPhotos: 'আসল ছবি খুঁজুন',
      changePhoto: 'ছবি পরিবর্তন',
      offlineBanner: 'অফলাইন মোড — সংরক্ষিত ডেটা দেখানো হচ্ছে',
      installApp: 'অ্যাপ ইনস্টল করুন',
      iosInstallTitle: 'iPhone / iPad-এ ইনস্টল করুন',
      iosInstallSteps: '১. Safari-র নিচে Share বোতামে ট্যাপ করুন। ২. নিচে স্ক্রল করে "Add to Home Screen" বেছে নিন।',
    },
    directions: {
      label: 'শেখার দিক',
      'bn-de': 'বাংলা → জার্মান',
      'de-bn': 'জার্মান → বাংলা',
      'en-de': 'ইংরেজি → জার্মান',
      'de-en': 'জার্মান → ইংরেজি',
    },
    dashboard: {
      welcomeTitle: 'আজকের জার্মান শব্দ শেখা',
      welcomeSubtitle: 'ভিজ্যুয়াল ছবি, উচ্চারণ এবং স্পেসড রিপিটিশন দিয়ে স্থায়ীভাবে মনে রাখুন।',
      todayProgress: 'আজকের অগ্রগতি',
      dailyGoal: 'দৈনিক লক্ষ্য',
      learnedWords: 'আয়ত্ত করা শব্দ',
      dueForReview: 'আজ রিভিউ বাকি',
      accuracy: 'সঠিকতার হার',
      streak: 'টানা পড়া',
      days: 'দিন',
      wordsCount: 'টি শব্দ',
      demoNoticeTitle: 'বর্তমানে ডেমো ডেটা সক্রিয় আছে',
      demoNoticeBody: 'অ্যাপের সব ফিচার অনুশীলনের জন্য এখানে শব্দভান্ডার দেওয়া আছে।',
      clearDemoBtn: 'ডেমো ডেটা সরান',
      restoreDemoBtn: 'ডেমো ডেটা ফিরিয়ে আনুন',
      quickActions: 'অনুশীলন মোডসমূহ',
      practiceFlashcards: 'ফ্ল্যাশকার্ড',
      practiceMcq: 'বহুনির্বাচনী কুইজ',
      practiceImageQuiz: 'ছবি দেখে কুইজ',
      practiceListening: 'শুনে অনুশীলন',
      reviewMistakes: 'ভুল সংশোধন',
      studyFavorites: 'প্রিয় শব্দ',
      recentPdfs: 'সংরক্ষিত ডেক',
      noPdfsYet: 'কোনো অতিরিক্ত ডেক নেই।',
    },
    study: {
      selectMode: 'অনুশীলন মোড',
      selectFilter: 'কার্ড ফিল্টার',
      filterAll: 'সব শব্দ',
      filterDue: 'রিভিউ বাকি',
      filterNew: 'নতুন শব্দ',
      filterMistakes: 'ভুল করা শব্দ',
      filterFavorites: 'প্রিয় শব্দ',
      flashcardFlip: 'উত্তর দেখতে কার্ডে ট্যাপ করুন',
      showImage: 'ছবি দেখান',
      hideImage: 'ছবি লুকান',
      exampleSentence: 'উদাহরণ বাক্য',
      rateAgain: 'আবার',
      rateHard: 'কঠিন',
      rateGood: 'ভালো',
      rateEasy: 'সহজ',
      sessionComplete: 'আজকের সেশন সম্পন্ন হয়েছে!',
      sessionCompleteSub: 'দারুণ কাজ! আপনি নির্ধারিত শব্দগুলো অনুশীলন করেছেন।',
      restartSession: 'আবার অনুশীলন করুন',
      emptyQueueTitle: 'এই ফিল্টারে কোনো শব্দ নেই',
      emptyQueueSub: 'অন্য একটি ফিল্টার বা অধ্যায় বেছে নিন।',
      checkAnswer: 'উত্তর যাচাই করুন',
      nextQuestion: 'পরবর্তী প্রশ্ন',
      correctFeedback: 'সঠিক উত্তর!',
      incorrectFeedback: 'ভুল হয়েছে। সঠিক উত্তর:',
      typeGermanPlaceholder: 'জার্মান শব্দটি লিখুন (যেমন: der Himmel)...',
      playAudioPrompt: 'শব্দটি শুনতে স্পিকার বোতামে চাপুন',
      needPhotosTitle: 'ছবি কুইজের জন্য কমপক্ষে ৪টি শব্দের ছবি প্রয়োজন',
      needPhotosSub: 'নিচের বোতামে ক্লিক করে Wikimedia Commons থেকে আসল ছবি সংগ্রহ করুন।',
      cardsRemaining: 'বাকি কার্ড',
    },
    vocabulary: {
      title: 'শব্দভান্ডার লাইব্রেরি',
      subtitle: 'অধ্যায়, বিষয় ও স্তর অনুযায়ী আপনার সব জার্মান শব্দ খুঁজুন ও পরিচালনা করুন।',
      searchPlaceholder: 'জার্মান, বাংলা বা ইংরেজিতে খুঁজুন...',
      allPdfs: 'সব উৎস',
      allTopics: 'সব বিষয়',
      allLevels: 'সব স্তর',
      statusAll: 'সব',
      statusDue: 'রিভিউ বাকি',
      statusMastered: 'আয়ত্তকৃত',
      statusMistakes: 'ভুল তালিকা',
      statusFavorites: 'প্রিয়',
      statusNeedsReview: 'যাচাই প্রয়োজন',
      needsReviewNotice: 'বাংলা অর্থ অস্পষ্ট বা অসম্পূর্ণ — সম্পাদনা করে যাচাই করুন',
      addManual: 'নতুন শব্দ যোগ করুন',
      emptyTitle: 'কোনো শব্দ পাওয়া যায়নি',
      emptySub: 'আপনার সার্চ বা ফিল্টার পরিবর্তন করে দেখুন অথবা নতুন শব্দ যোগ করুন।',
      germanLabel: 'জার্মান শব্দ (আর্টিকেল ও বহুবচনসহ)',
      banglaLabel: 'বাংলা অর্থ',
      englishLabel: 'ইংরেজি অর্থ',
      pluralLabel: 'বহুবচন',
      exampleLabel: 'জার্মান উদাহরণ বাক্য',
      deleteConfirm: 'আপনি কি নিশ্চিতভাবে এই শব্দটি মুছে ফেলতে চান?',
    },
    chapters: {
      heading: '১২টি অধ্যায় (Deutsch B1)',
      subheading: 'প্রতিটি অধ্যায়ের শব্দ আলাদাভাবে সাজানো আছে। পড়ার জন্য একটি অধ্যায় বেছে নিন।',
      backToAll: 'সব ১২টি অধ্যায়',
      openChapter: 'অধ্যায় খুলুন',
      practiceChapter: 'অনুশীলন করুন',
      allChapters: 'সব ১২টি অধ্যায়',
      chapterLabel: 'অধ্যায়',
      masteredCount: 'আয়ত্তকৃত',
      dueCount: 'রিভিউ বাকি',
      allSections: 'সব অংশ (Section)',
      prevChapter: 'আগের অধ্যায়',
      nextChapter: 'পরের অধ্যায়',
      searchInChapter: 'এই অধ্যায়ে খুঁজুন (জার্মান, বাংলা বা ইংরেজি)...',
      customTitle: 'নিজস্ব ও যোগ করা শব্দ',
      customSub: 'আপনার ম্যানুয়ালি যোগ করা শব্দগুলো এখানে আলাদা রাখা হয়েছে।',
      selectPrompt: 'যেকোনো অধ্যায় বেছে নিয়ে শুধু সেই অধ্যায়ের শব্দগুলো দেখুন।',
    },
    importPdf: {
      title: 'PDF থেকে শব্দ আমদানি ও OCR',
      subtitle: 'আপনার নিজের জার্মান-বাংলা-ইংরেজি PDF আপলোড করুন। স্ক্যান করা PDF-এর জন্য স্বয়ংক্রিয় OCR ব্যবহার করা হয়।',
      dropTitle: 'এখানে PDF ফাইল ড্রপ করুন বা বাছাই করুন',
      dropSub: 'জার্মান উমলাউট (ä, ö, ü), ß, আর্টিকেল (der, die, das), বহুবচন, উদাহরণ ও পৃষ্ঠা নম্বর সংরক্ষিত থাকবে।',
      chooseFile: 'PDF ফাইল বাছাই করুন',
      ocrModeLabel: 'টেক্সট ও OCR পদ্ধতি',
      ocrAuto: 'স্বয়ংক্রিয় (টেক্সট + স্ক্যান বা ভাঙা ফন্টের জন্য OCR)',
      ocrForce: 'সব পৃষ্ঠায় Tesseract OCR চালান (স্ক্যান করা PDF)',
      ocrHint: 'যদি আপনার PDF-এ বাংলা ফন্ট (যেমন Bijoy/Sutonny) ভেঙে যায় বা স্ক্যান করা ছবি হয়, তবে OCR মোড সঠিক বাংলা ও জার্মান পড়তে সাহায্য করবে।',
      sampleB1Title: 'সংযুক্ত B1 শব্দভান্ডার ডেক পরীক্ষা করুন',
      sampleB1Sub: 'আপনি চাইলে আপনার আপলোড করা deutsch_b1_vocabulary_clean_text_version.txt ফাইলটি রিভিউ স্ক্রিনে খুলে যাচাই করে আমদানি করতে পারেন।',
      loadSampleB1: 'B1 নমুনা ডেক রিভিউতে খুলুন',
      extracting: 'PDF পৃষ্ঠা বিশ্লেষণ করা হচ্ছে...',
      ocrRunning: 'Tesseract OCR চলছে (প্রথমবার ভাষা ফাইল ডাউনলোডে কিছু সময় লাগতে পারে)...',
      reviewTitle: 'আমদানির আগে শব্দ যাচাই ও সম্পাদনা করুন',
      reviewSubtitle: 'ভুল বানান ঠিক করুন, ডুপ্লিকেট বাদ দিন এবং অনুমোদিত শব্দগুলো লাইব্রেরিতে যুক্ত করুন।',
      approveAll: 'সব অনুমোদন করুন',
      removeDuplicates: 'ডুপ্লিকেট বাদ দিন',
      importApproved: 'অনুমোদিত শব্দ আমদানি করুন',
      discardDraft: 'খসড়া বাতিল করুন',
      statusApproved: 'অনুমোদিত',
      statusRejected: 'বাদ দেওয়া',
      statusDuplicate: 'ডুপ্লিকেট',
      defaultTopic: 'নির্ধারিত বিষয়',
      defaultLevel: 'স্তর',
      noEntriesTitle: 'স্বয়ংক্রিয়ভাবে কোনো শব্দ শনাক্ত হয়নি',
      noEntriesSub: 'সব পৃষ্ঠায় OCR চালিয়ে আবার চেষ্টা করুন অথবা ম্যানুয়ালি শব্দ যোগ করুন।',
      saveToCloud: 'ব্যক্তিগত PDF ফাইল Supabase ক্লাউডে সংরক্ষণ করুন (সাইন-ইন করা থাকলে)',
      importSuccess: 'শব্দভান্ডারে সফলভাবে যোগ করা হয়েছে!',
    },
    account: {
      title: 'অ্যাকাউন্ট ও ক্লাউড সিঙ্ক (Supabase)',
      subtitle: 'আপনার শব্দভান্ডার ও শেখার অগ্রগতি সব ডিভাইসে নিরাপদে সংরক্ষণ করুন।',
      cloudConnected: 'Supabase ক্লাউডের সাথে যুক্ত',
      localModeTitle: 'লোকাল ব্রাউজার মোডে চলছে',
      localModeSub: 'আপনার শব্দ ও অগ্রগতি এখন এই ব্রাউজারে সংরক্ষিত হচ্ছে। সব ডিভাইসে সিঙ্ক করতে নিচের নির্দেশিকা অনুযায়ী আপনার নিজের ফ্রি Supabase প্রজেক্ট যুক্ত করুন।',
      signIn: 'সাইন ইন',
      signUp: 'নতুন অ্যাকাউন্ট খুলুন',
      signOut: 'সাইন আউট',
      email: 'ইমেইল ঠিকানা',
      password: 'পাসওয়ার্ড',
      syncNow: 'ক্লাউডে সিঙ্ক করুন',
      myPdfs: 'সংরক্ষিত ডেক',
      setupGuideTitle: 'সহজ Supabase ও Cloudflare Pages সেটআপ নির্দেশিকা',
      setupGuideSub: 'কোডিং না জানলেও নিচের ধাপগুলো অনুসরণ করে সহজেই আপনার অ্যাকাউন্ট ও ক্লাউড ডেটাবেস চালু করতে পারবেন।',
    },
    practiceSections: {
      articleTrainerTab: 'Article Trainer',
      verbsTab: 'Verbs',
      sentencePracticeTab: 'Sentence Practice',
      articleTrainerTitle: 'আর্টিকেল অনুশীলন (der · die · das)',
      articleTrainerSub: 'আপনার বিদ্যমান শব্দভান্ডার (A1–B1) থেকে সংগৃহীত বিশেষ্য ও সঠিক আর্টিকেল অনুশীলন করুন।',
      verbsTitle: 'জার্মান ক্রিয়া অনুশীলন (Verbs)',
      verbsSub: 'আপনার বিদ্যমান শব্দভান্ডারে থাকা জার্মান ক্রিয়া (Verb) ও অর্থ অনুশীলন করুন।',
      sentenceTitle: 'বাক্য অনুশীলন (Sentence Practice)',
      sentenceSub: 'আপনার শব্দভান্ডারের পূর্ণ জার্মান বাক্য দিয়ে শূন্যস্থান, শব্দ সাজানো এবং অনুবাদ অনুশীলন করুন।',
      sourceVocabulary: 'উৎস: বিদ্যমান জার্মান শব্দভান্ডার (A1–B1)',
      allLevels: 'সব স্তর (A1–B1)',
      allChapters: 'সব অধ্যায়',
      noItemsInScope: 'নির্বাচিত স্তর, অধ্যায় বা অনুসন্ধানে কোনো আইটেম পাওয়া যায়নি।',
      quizTab: 'কুইজ',
      browseTab: 'তালিকা ও অনুসন্ধান',
      answeredLabel: 'উত্তর দেওয়া হয়েছে',
      accuracyLabel: 'সঠিকতার হার',
      streakLabel: 'ধারাবাহিক সঠিক',
      masteredLabel: 'আয়ত্তকৃত',
      shuffleBtn: 'এলোমেলো',
      resetSessionBtn: 'নতুন সেশন',
      missedOnlyBtn: 'শুধু ভুলগুলো',
      allItemsBtn: 'সব প্রশ্ন',
      chooseArticlePrompt: 'এই জার্মান বিশেষ্যের সঠিক আর্টিকেল (der, die, das) বেছে নিন:',
      correctArticleFeedback: 'সঠিক উত্তর!',
      wrongArticleFeedback: 'ভুল হয়েছে — সঠিক আর্টিকেল:',
      meaningQuizMode: 'অর্থ কুইজ',
      typeVerbMode: 'ক্রিয়া টাইপ কুইজ',
      verbFormsLabel: 'ক্রিয়ার রূপ / প্রসঙ্গ',
      typeVerbPlaceholder: 'জার্মান ক্রিয়াটি লিখুন...',
      completionMode: 'শূন্যস্থান পূরণ',
      orderingMode: 'শব্দ সাজানো',
      translationMode: 'অনুবাদ ও শ্রবণ',
      pickMissingWord: 'বাক্যের খালি জায়গায় বসবে এমন সঠিক শব্দটি বেছে নিন:',
      arrangeWordsPrompt: 'সঠিক জার্মান বাক্যটি তৈরি করতে শব্দগুলো ক্রমানুসারে সাজান:',
      clearOrderBtn: 'মুছে আবার সাজান',
      noSentenceTranslationInData: 'এই বাক্যটির আলাদা অনুবাদ নেই — তাই শুনে ও বাক্য দেখে টাইপ করে অনুশীলন করুন।',
      searchPlaceholder: 'জার্মান, বাংলা, ইংরেজি বা অধ্যায় খুঁজুন...',
    },
  },
  en: {
    brand: 'SiamVocab',
    tagline: 'Learn German Visually. Remember Forever.',
    nav: {
      dashboard: 'Dashboard',
      study: 'Study',
      vocabulary: 'Vocabulary',
      account: 'Account',
    },
    common: {
      startLearning: 'Start Learning',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      search: 'Search',
      filter: 'Filter',
      all: 'All',
      loading: 'Loading...',
      retry: 'Retry',
      close: 'Close',
      listen: 'Listen',
      slowListen: 'Slow',
      favorite: 'Favorite',
      demoLabel: 'Demo Data',
      yourPdfLabel: 'Your PDF',
      page: 'Page',
      chapter: 'Chapter',
      section: 'Section',
      topic: 'Topic',
      level: 'Level',
      source: 'Source',
      attribution: 'Photo source',
      noPhoto: 'No suitable real photograph found',
      fetchPhotos: 'Fetch Real Photos',
      changePhoto: 'Change Photo',
      offlineBanner: 'Offline Mode — Using cached vocabulary data',
      installApp: 'Install App',
      iosInstallTitle: 'Install on iPhone / iPad',
      iosInstallSteps: '1. Tap the Share button in Safari toolbar. 2. Scroll down and tap "Add to Home Screen".',
    },
    directions: {
      label: 'Study Direction',
      'bn-de': 'Bangla → German',
      'de-bn': 'German → Bangla',
      'en-de': 'English → German',
      'de-en': 'German → English',
    },
    dashboard: {
      welcomeTitle: "Today's German Practice",
      welcomeSubtitle: 'Build lasting memory with real photographs, native pronunciation, and spaced repetition.',
      todayProgress: "Today's Progress",
      dailyGoal: 'Daily Goal',
      learnedWords: 'Mastered Words',
      dueForReview: 'Due for Review',
      accuracy: 'Accuracy',
      streak: 'Study Streak',
      days: 'days',
      wordsCount: 'words',
      demoNoticeTitle: 'Demo Data Active',
      demoNoticeBody: 'Vocabulary data is preloaded so you can practice every mode right away.',
      clearDemoBtn: 'Remove Demo Data',
      restoreDemoBtn: 'Restore Demo Data',
      quickActions: 'Learning Modes',
      practiceFlashcards: 'Flashcards',
      practiceMcq: 'Multiple Choice',
      practiceImageQuiz: 'Image Quiz',
      practiceListening: 'Listening Practice',
      reviewMistakes: 'Mistake Review',
      studyFavorites: 'Favorites',
      recentPdfs: 'Vocabulary Decks',
      noPdfsYet: 'All vocabulary chapters loaded.',
    },
    study: {
      selectMode: 'Practice Mode',
      selectFilter: 'Deck Filter',
      filterAll: 'All Words',
      filterDue: 'Due Review',
      filterNew: 'New Words',
      filterMistakes: 'Mistakes',
      filterFavorites: 'Favorites',
      flashcardFlip: 'Tap card to reveal answer',
      showImage: 'Show Photo',
      hideImage: 'Hide Photo',
      exampleSentence: 'Example Sentence',
      rateAgain: 'Again',
      rateHard: 'Hard',
      rateGood: 'Good',
      rateEasy: 'Easy',
      sessionComplete: 'Session Complete!',
      sessionCompleteSub: 'Great consistency! Your spaced repetition schedule has been updated.',
      restartSession: 'Practice Again',
      emptyQueueTitle: 'No cards match this filter',
      emptyQueueSub: 'Try another filter or select a different chapter.',
      checkAnswer: 'Check Answer',
      nextQuestion: 'Next Question',
      correctFeedback: 'Correct!',
      incorrectFeedback: 'Not quite. Correct answer:',
      typeGermanPlaceholder: 'Type the German word (e.g. der Himmel)...',
      playAudioPrompt: 'Press speaker to listen to the German word',
      needPhotosTitle: 'Image Quiz needs at least 4 cards with photos',
      needPhotosSub: 'Click below to fetch real Wikimedia Commons photographs for your vocabulary.',
      cardsRemaining: 'Remaining',
    },
    vocabulary: {
      title: 'Vocabulary Library',
      subtitle: 'Search, filter, edit, and organize your German vocabulary by chapter, topic, and level.',
      searchPlaceholder: 'Search German, Bangla, or English...',
      allPdfs: 'All Sources',
      allTopics: 'All Topics',
      allLevels: 'All Levels',
      statusAll: 'All',
      statusDue: 'Due',
      statusMastered: 'Mastered',
      statusMistakes: 'Mistakes',
      statusFavorites: 'Favorites',
      statusNeedsReview: 'Needs Review',
      needsReviewNotice: 'Bengali meaning needs manual verification — edit to confirm',
      addManual: 'Add Word',
      emptyTitle: 'No vocabulary items found',
      emptySub: 'Adjust your search or filters, or add a word manually.',
      germanLabel: 'German (with article & plural)',
      banglaLabel: 'Bangla Meaning',
      englishLabel: 'English Meaning',
      pluralLabel: 'Plural',
      exampleLabel: 'German Example Sentence',
      deleteConfirm: 'Delete this vocabulary item permanently?',
    },
    chapters: {
      heading: '12 Chapters (Deutsch B1)',
      subheading: 'Each chapter is kept separate. Select any chapter to view or study only its vocabulary.',
      backToAll: 'All 12 Chapters',
      openChapter: 'Open Chapter',
      practiceChapter: 'Practice Chapter',
      allChapters: 'All 12 Chapters',
      chapterLabel: 'Chapter',
      masteredCount: 'mastered',
      dueCount: 'due',
      allSections: 'All Sections',
      prevChapter: 'Previous',
      nextChapter: 'Next',
      searchInChapter: 'Search within this chapter (German, Bangla, or English)...',
      customTitle: 'Custom Entries',
      customSub: 'Words you added manually are organized here.',
      selectPrompt: 'Select a chapter to view only that chapter’s vocabulary.',
    },
    importPdf: {
      title: 'Import PDF & OCR Review',
      subtitle: 'Upload your German vocabulary PDFs. Scanned pages and broken fonts are processed via Tesseract.js OCR.',
      dropTitle: 'Drop a PDF file here or browse',
      dropSub: 'Preserves umlauts (ä, ö, ü), ß, articles (der, die, das), plurals, examples, and PDF page numbers.',
      chooseFile: 'Select PDF File',
      ocrModeLabel: 'Extraction Mode',
      ocrAuto: 'Smart Auto (Text extraction + OCR fallback for scanned/broken pages)',
      ocrForce: 'Force Tesseract OCR on all pages (best for scanned PDFs)',
      ocrHint: 'If a PDF uses legacy non-Unicode Bengali fonts, OCR automatically helps recover clean text without inventing words.',
      sampleB1Title: 'Try Attached B1 Sample Deck',
      sampleB1Sub: 'Load the uploaded deutsch_b1_vocabulary_clean_text_version.txt dataset into the review table so you can inspect, edit, and re-import entries.',
      loadSampleB1: 'Open B1 Sample in Review',
      extracting: 'Extracting PDF pages...',
      ocrRunning: 'Running Tesseract OCR (first run downloads language models)...',
      reviewTitle: 'Review & Clean Extracted Words Before Importing',
      reviewSubtitle: 'Edit entries, approve or reject rows, and remove duplicates. Nothing is invented.',
      approveAll: 'Approve All',
      removeDuplicates: 'Remove Duplicates',
      importApproved: 'Import Approved Words',
      discardDraft: 'Discard Draft',
      statusApproved: 'Approved',
      statusRejected: 'Rejected',
      statusDuplicate: 'Duplicate',
      defaultTopic: 'Assigned Topic',
      defaultLevel: 'Level',
      noEntriesTitle: 'No vocabulary entries detected automatically',
      noEntriesSub: 'Try re-running with Force OCR mode enabled, or add words manually.',
      saveToCloud: 'Save private PDF file to Supabase Storage (when signed in)',
      importSuccess: 'Words imported into your vocabulary library!',
    },
    account: {
      title: 'Account & Cloud Sync (Supabase)',
      subtitle: 'Keep your vocabulary and study progress synced across devices with Row Level Security.',
      cloudConnected: 'Connected to Supabase',
      localModeTitle: 'Running in Local Browser Mode',
      localModeSub: 'Your data is safely stored in this browser. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable cloud sync.',
      signIn: 'Sign In',
      signUp: 'Create Account',
      signOut: 'Sign Out',
      email: 'Email Address',
      password: 'Password',
      syncNow: 'Sync Now',
      myPdfs: 'Vocabulary Decks',
      setupGuideTitle: 'Beginner Setup Guide',
      setupGuideSub: 'Step-by-step instructions for Supabase RLS and Cloudflare Pages deployment.',
    },
    practiceSections: {
      articleTrainerTab: 'Article Trainer',
      verbsTab: 'Verbs',
      sentencePracticeTab: 'Sentence Practice',
      articleTrainerTitle: 'Article Trainer (der · die · das)',
      articleTrainerSub: 'Practice German nouns and their exact articles (der, die, das) from your vocabulary library.',
      verbsTitle: 'German Verbs Practice',
      verbsSub: 'Practice German verbs and meanings from your existing vocabulary library.',
      sentenceTitle: 'Sentence Practice',
      sentenceSub: 'Complete, reorder, and practice translating German sentences from your vocabulary library.',
      sourceVocabulary: 'Source: German Vocabulary Data (A1–B1)',
      allLevels: 'All Levels (A1–B1)',
      allChapters: 'All Chapters',
      noItemsInScope: 'No items match the selected level, chapter, or search query.',
      quizTab: 'Quiz',
      browseTab: 'Browse & Search',
      answeredLabel: 'Answered',
      accuracyLabel: 'Accuracy',
      streakLabel: 'Streak',
      masteredLabel: 'Mastered',
      shuffleBtn: 'Shuffle',
      resetSessionBtn: 'Restart',
      missedOnlyBtn: 'Missed Only',
      allItemsBtn: 'All Items',
      chooseArticlePrompt: 'Choose the correct German article (der, die, das):',
      correctArticleFeedback: 'Correct!',
      wrongArticleFeedback: 'Incorrect — Correct article:',
      meaningQuizMode: 'Meaning Quiz',
      typeVerbMode: 'Type Verb Quiz',
      verbFormsLabel: 'Verb Forms / Notes',
      typeVerbPlaceholder: 'Type the German verb...',
      completionMode: 'Sentence Completion',
      orderingMode: 'Word Ordering',
      translationMode: 'Translation & Dictation',
      pickMissingWord: 'Select the missing word for this sentence:',
      arrangeWordsPrompt: 'Click the words in order to rebuild the exact German sentence:',
      clearOrderBtn: 'Clear Order',
      noSentenceTranslationInData: 'No separate sentence translation in data — practice by listening and typing.',
      searchPlaceholder: 'Search German, Bangla, English, or chapter...',
    },
  },
  de: {
    brand: 'SiamVocab',
    tagline: 'Learn German Visually. Remember Forever.',
    nav: {
      dashboard: 'Übersicht',
      study: 'Lernen',
      vocabulary: 'Wortschatz',
      account: 'Konto',
    },
    common: {
      startLearning: 'Lernen starten',
      save: 'Speichern',
      cancel: 'Abbrechen',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      search: 'Suchen',
      filter: 'Filter',
      all: 'Alle',
      loading: 'Wird geladen...',
      retry: 'Erneut versuchen',
      close: 'Schließen',
      listen: 'Anhören',
      slowListen: 'Langsam',
      favorite: 'Favorit',
      demoLabel: 'Demodaten',
      yourPdfLabel: 'Eigenes PDF',
      page: 'Seite',
      chapter: 'Kapitel',
      section: 'Abschnitt',
      topic: 'Thema',
      level: 'Niveau',
      source: 'Quelle',
      attribution: 'Bildquelle',
      noPhoto: 'Kein passendes echtes Foto gefunden',
      fetchPhotos: 'Echte Fotos laden',
      changePhoto: 'Foto ändern',
      offlineBanner: 'Offlinemodus — Zwischengespeicherte Daten aktiv',
      installApp: 'App installieren',
      iosInstallTitle: 'Auf iPhone / iPad installieren',
      iosInstallSteps: '1. Tippen Sie in Safari auf „Teilen“. 2. Wählen Sie „Zum Home-Bildschirm“.',
    },
    directions: {
      label: 'Lernrichtung',
      'bn-de': 'Bengalisch → Deutsch',
      'de-bn': 'Deutsch → Bengalisch',
      'en-de': 'Englisch → Deutsch',
      'de-en': 'Deutsch → Englisch',
    },
    dashboard: {
      welcomeTitle: 'Heutiges Deutschtraining',
      welcomeSubtitle: 'Lernen Sie nachhaltig mit echten Fotos, Aussprache und Spaced Repetition.',
      todayProgress: 'Heutiger Fortschritt',
      dailyGoal: 'Tagesziel',
      learnedWords: 'Gemeisterte Wörter',
      dueForReview: 'Heute fällig',
      accuracy: 'Genauigkeit',
      streak: 'Lernserie',
      days: 'Tage',
      wordsCount: 'Wörter',
      demoNoticeTitle: 'Demodaten aktiv',
      demoNoticeBody: 'Der Wortschatz ist vorgeladen, damit Sie alle Übungsmodi direkt nutzen können.',
      clearDemoBtn: 'Demodaten entfernen',
      restoreDemoBtn: 'Demodaten wiederherstellen',
      quickActions: 'Lernmodi',
      practiceFlashcards: 'Karteikarten',
      practiceMcq: 'Multiple Choice',
      practiceImageQuiz: 'Bild-Quiz',
      practiceListening: 'Hörverständnis',
      reviewMistakes: 'Fehler wiederholen',
      studyFavorites: 'Favoriten',
      recentPdfs: 'Wortschatz-Decks',
      noPdfsYet: 'Alle Kapitel geladen.',
    },
    study: {
      selectMode: 'Lernmodus',
      selectFilter: 'Filter',
      filterAll: 'Alle Wörter',
      filterDue: 'Fällig',
      filterNew: 'Neue Wörter',
      filterMistakes: 'Fehler',
      filterFavorites: 'Favoriten',
      flashcardFlip: 'Tippen Sie auf die Karte, um die Antwort zu sehen',
      showImage: 'Foto zeigen',
      hideImage: 'Foto verbergen',
      exampleSentence: 'Beispielsatz',
      rateAgain: 'Nochmal',
      rateHard: 'Schwer',
      rateGood: 'Gut',
      rateEasy: 'Leicht',
      sessionComplete: 'Sitzung abgeschlossen!',
      sessionCompleteSub: 'Sehr gut! Ihr Wiederholungsplan wurde aktualisiert.',
      restartSession: 'Erneut üben',
      emptyQueueTitle: 'Keine Karten für diesen Filter',
      emptyQueueSub: 'Wählen Sie einen anderen Filter oder ein anderes Kapitel.',
      checkAnswer: 'Antwort prüfen',
      nextQuestion: 'Nächste Frage',
      correctFeedback: 'Richtig!',
      incorrectFeedback: 'Leider falsch. Richtige Antwort:',
      typeGermanPlaceholder: 'Deutsches Wort eingeben (z. B. der Himmel)...',
      playAudioPrompt: 'Lautsprecher drücken, um das Wort zu hören',
      needPhotosTitle: 'Das Bild-Quiz benötigt mindestens 4 Karten mit Fotos',
      needPhotosSub: 'Klicken Sie unten, um echte Fotos von Wikimedia Commons zu laden.',
      cardsRemaining: 'Verbleibend',
    },
    vocabulary: {
      title: 'Wortschatz-Bibliothek',
      subtitle: 'Suchen, filtern, bearbeiten und organisieren Sie Ihre Vokabeln nach Kapitel, Thema und Niveau.',
      searchPlaceholder: 'Deutsch, Bengalisch oder Englisch suchen...',
      allPdfs: 'Alle Quellen',
      allTopics: 'Alle Themen',
      allLevels: 'Alle Niveaus',
      statusAll: 'Alle',
      statusDue: 'Fällig',
      statusMastered: 'Gemeistert',
      statusMistakes: 'Fehler',
      statusFavorites: 'Favoriten',
      statusNeedsReview: 'Prüfung nötig',
      needsReviewNotice: 'Bengalische Bedeutung bitte manuell prüfen und bearbeiten',
      addManual: 'Wort hinzufügen',
      emptyTitle: 'Keine Vokabeln gefunden',
      emptySub: 'Passen Sie die Suche an oder fügen Sie ein Wort manuell hinzu.',
      germanLabel: 'Deutsch (mit Artikel & Plural)',
      banglaLabel: 'Bengalische Bedeutung',
      englishLabel: 'Englische Bedeutung',
      pluralLabel: 'Plural',
      exampleLabel: 'Deutscher Beispielsatz',
      deleteConfirm: 'Dieses Wort dauerhaft löschen?',
    },
    chapters: {
      heading: '12 Kapitel (Deutsch B1)',
      subheading: 'Jedes Kapitel wird getrennt angezeigt. Wählen Sie ein Kapitel für den jeweiligen Wortschatz.',
      backToAll: 'Alle 12 Kapitel',
      openChapter: 'Kapitel öffnen',
      practiceChapter: 'Kapitel üben',
      allChapters: 'Alle 12 Kapitel',
      chapterLabel: 'Kapitel',
      masteredCount: 'gemeistert',
      dueCount: 'fällig',
      allSections: 'Alle Abschnitte',
      prevChapter: 'Zurück',
      nextChapter: 'Weiter',
      searchInChapter: 'In diesem Kapitel suchen (Deutsch, Bengalisch, Englisch)...',
      customTitle: 'Eigene Wörter',
      customSub: 'Manuell hinzugefügte Wörter bleiben hier getrennt.',
      selectPrompt: 'Wählen Sie ein Kapitel aus, um nur dessen Vokabeln anzuzeigen.',
    },
    importPdf: {
      title: 'PDF-Import & OCR-Prüfung',
      subtitle: 'Laden Sie eigene Vokabel-PDFs hoch. Gescannte Seiten werden mit Tesseract.js OCR erkannt.',
      dropTitle: 'PDF-Datei hier ablegen oder auswählen',
      dropSub: 'Erhält Umlaute (ä, ö, ü), ß, Artikel (der, die, das), Pluralformen, Beispiele und Seitenzahlen.',
      chooseFile: 'PDF-Datei auswählen',
      ocrModeLabel: 'Extraktionsmodus',
      ocrAuto: 'Automatisch (Text + OCR bei gescannten/fehlerhaften Seiten)',
      ocrForce: 'Tesseract OCR für alle Seiten erzwingen',
      ocrHint: 'Bei älteren nicht-Unicode-Bengalisch-Schriften hilft der OCR-Modus bei der sauberen Erkennung.',
      sampleB1Title: 'Angehängtes B1-Beispielset testen',
      sampleB1Sub: 'Öffnen Sie die hochgeladene Datei deutsch_b1_vocabulary_clean_text_version.txt zur Prüfung und zum Import.',
      loadSampleB1: 'B1-Beispiel in Prüfung öffnen',
      extracting: 'PDF-Seiten werden analysiert...',
      ocrRunning: 'Tesseract OCR läuft...',
      reviewTitle: 'Extrahierte Wörter vor dem Import prüfen',
      reviewSubtitle: 'Bearbeiten, bestätigen oder verwerfen Sie Einträge und entfernen Sie Duplikate.',
      approveAll: 'Alle bestätigen',
      removeDuplicates: 'Duplikate entfernen',
      importApproved: 'Bestätigte importieren',
      discardDraft: 'Verwerfen',
      statusApproved: 'Bestätigt',
      statusRejected: 'Abgelehnt',
      statusDuplicate: 'Duplikat',
      defaultTopic: 'Thema',
      defaultLevel: 'Niveau',
      noEntriesTitle: 'Keine Einträge automatisch erkannt',
      noEntriesSub: 'Versuchen Sie den OCR-Modus oder fügen Sie Wörter manuell hinzu.',
      saveToCloud: 'Privates PDF in Supabase Storage speichern (falls angemeldet)',
      importSuccess: 'Vokabeln erfolgreich importiert!',
    },
    account: {
      title: 'Konto & Cloud-Sync (Supabase)',
      subtitle: 'Synchronisieren Sie Ihren Wortschatz und Lernfortschritt sicher mit Row Level Security.',
      cloudConnected: 'Mit Supabase verbunden',
      localModeTitle: 'Lokaler Browser-Modus',
      localModeSub: 'Daten werden lokal gespeichert. Konfigurieren Sie VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY für Cloud-Sync.',
      signIn: 'Anmelden',
      signUp: 'Registrieren',
      signOut: 'Abmelden',
      email: 'E-Mail-Adresse',
      password: 'Passwort',
      syncNow: 'Jetzt synchronisieren',
      myPdfs: 'Wortschatz-Decks',
      setupGuideTitle: 'Einrichtungsanleitung',
      setupGuideSub: 'Schritt-für-Schritt-Hilfe für Supabase und Cloudflare Pages.',
    },
    practiceSections: {
      articleTrainerTab: 'Article Trainer',
      verbsTab: 'Verbs',
      sentencePracticeTab: 'Sentence Practice',
      articleTrainerTitle: 'Artikel-Trainer (der · die · das)',
      articleTrainerSub: 'Üben Sie deutsche Nomen und ihre Artikel (der, die, das) aus Ihrem vorhandenen Wortschatz.',
      verbsTitle: 'Verben-Training',
      verbsSub: 'Üben Sie Verben und Bedeutungen aus Ihrem vorhandenen Wortschatz.',
      sentenceTitle: 'Satztraining',
      sentenceSub: 'Üben Sie Lückentexte, Wortstellung und Übersetzungen mit Sätzen aus Ihrem Wortschatz.',
      sourceVocabulary: 'Quelle: Vorhandener Wortschatz (A1–B1)',
      allLevels: 'Alle Niveaus (A1–B1)',
      allChapters: 'Alle Kapitel',
      noItemsInScope: 'Keine Einträge für dieses Niveau, Kapitel oder diese Suche gefunden.',
      quizTab: 'Quiz',
      browseTab: 'Liste & Suche',
      answeredLabel: 'Beantwortet',
      accuracyLabel: 'Genauigkeit',
      streakLabel: 'Serie',
      masteredLabel: 'Gemeistert',
      shuffleBtn: 'Mischen',
      resetSessionBtn: 'Neu starten',
      missedOnlyBtn: 'Nur Fehler',
      allItemsBtn: 'Alle',
      chooseArticlePrompt: 'Wählen Sie den passenden Artikel (der, die, das):',
      correctArticleFeedback: 'Richtig!',
      wrongArticleFeedback: 'Falsch — Richtig ist:',
      meaningQuizMode: 'Bedeutungs-Quiz',
      typeVerbMode: 'Verb eingeben',
      verbFormsLabel: 'Verbformen / Hinweise',
      typeVerbPlaceholder: 'Deutsches Verb eingeben...',
      completionMode: 'Lückensatz',
      orderingMode: 'Wortstellung',
      translationMode: 'Übersetzung & Diktat',
      pickMissingWord: 'Wählen Sie das fehlende Wort für diesen Satz:',
      arrangeWordsPrompt: 'Klicken Sie die Wörter in der richtigen Reihenfolge an:',
      clearOrderBtn: 'Zurücksetzen',
      noSentenceTranslationInData: 'Keine separate Übersetzung vorhanden — üben Sie durch Anhören und Schreiben.',
      searchPlaceholder: 'Deutsch, Bengalisch, Englisch oder Kapitel suchen...',
    },
  },
};
