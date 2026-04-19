import { neon } from '@neondatabase/serverless';

const DB = 'postgresql://neondb_owner:npg_oLlDRTAS0tV2@ep-winter-sea-an1gmej8-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DB);
const wait = (ms) => new Promise(r => setTimeout(r, ms));

const statements = [
`CREATE TABLE IF NOT EXISTS "User" (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,"passwordHash" TEXT,"studentId" TEXT UNIQUE,faculty TEXT,role TEXT NOT NULL DEFAULT 'student',"preferredLanguages" TEXT[] DEFAULT ARRAY['English'],avatar TEXT,"readingGoal" INT DEFAULT 20,"fcmToken" TEXT,"fcmTokenMobile" TEXT,"fcmTokenWeb" TEXT,"kohaPatronId" TEXT,"isActive" BOOLEAN DEFAULT true,"createdAt" TIMESTAMPTZ DEFAULT now(),"updatedAt" TIMESTAMPTZ DEFAULT now())`,
`CREATE TABLE IF NOT EXISTS "Book" (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,"kohaId" TEXT UNIQUE,isbn TEXT,title TEXT NOT NULL,author TEXT NOT NULL,description TEXT,"coverUrl" TEXT,"fileUrl" TEXT,"fileKey" TEXT,"archiveId" TEXT,"gutenbergId" INT,"fileFormat" TEXT,category TEXT NOT NULL,faculty TEXT[] DEFAULT '{}',tags TEXT[] DEFAULT '{}',languages TEXT[] DEFAULT ARRAY['English'],"publishedYear" INT,"pageCount" INT,rating FLOAT DEFAULT 0,"ratingCount" INT DEFAULT 0,"isActive" BOOLEAN DEFAULT true,"lastSyncedFromKoha" TIMESTAMPTZ,"createdAt" TIMESTAMPTZ DEFAULT now(),"updatedAt" TIMESTAMPTZ DEFAULT now())`,
`CREATE TABLE IF NOT EXISTS "UserProgress" (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,"userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,"bookId" TEXT NOT NULL REFERENCES "Book"(id) ON DELETE CASCADE,"currentPage" INT DEFAULT 0,"currentCfi" TEXT,"percentComplete" FLOAT DEFAULT 0,"currentChapter" INT DEFAULT 0,bookmarks INT[] DEFAULT '{}',highlights JSONB DEFAULT '[]',"readingLanguage" TEXT DEFAULT 'English',"totalReadingMinutes" INT DEFAULT 0,"isCompleted" BOOLEAN DEFAULT false,"lastReadAt" TIMESTAMPTZ,"lastDevice" TEXT DEFAULT 'web',"createdAt" TIMESTAMPTZ DEFAULT now(),"updatedAt" TIMESTAMPTZ DEFAULT now(),UNIQUE("userId","bookId"))`,
`CREATE TABLE IF NOT EXISTS "ChatSession" (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,"userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,"bookId" TEXT NOT NULL REFERENCES "Book"(id) ON DELETE CASCADE,messages JSONB DEFAULT '[]',language TEXT DEFAULT 'English',model TEXT DEFAULT 'gemini-1.5-flash',"createdAt" TIMESTAMPTZ DEFAULT now(),"updatedAt" TIMESTAMPTZ DEFAULT now(),UNIQUE("userId","bookId"))`,
`CREATE TABLE IF NOT EXISTS "Podcast" (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,title TEXT NOT NULL,description TEXT,"hostName" TEXT,"coverUrl" TEXT,"rssUrl" TEXT NOT NULL UNIQUE,category TEXT,language TEXT DEFAULT 'English',"subscriberCount" INT DEFAULT 0,episodes JSONB DEFAULT '[]',"lastFetched" TIMESTAMPTZ,"isActive" BOOLEAN DEFAULT true,"createdAt" TIMESTAMPTZ DEFAULT now(),"updatedAt" TIMESTAMPTZ DEFAULT now())`,
`CREATE TABLE IF NOT EXISTS "PodcastSubscriber" ("podcastId" TEXT NOT NULL REFERENCES "Podcast"(id) ON DELETE CASCADE,"userId" TEXT NOT NULL,PRIMARY KEY ("podcastId","userId"))`,
`CREATE TABLE IF NOT EXISTS "AudioCache" (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,"bookId" TEXT REFERENCES "Book"(id) ON DELETE CASCADE,"textHash" TEXT,"chapterIndex" INT,language TEXT NOT NULL,"voiceLang" TEXT,voice TEXT,"fileKey" TEXT,"fileUrl" TEXT,"audioUrl" TEXT,"durationSeconds" INT,"generatedAt" TIMESTAMPTZ DEFAULT now(),"expiresAt" TIMESTAMPTZ,"createdAt" TIMESTAMPTZ DEFAULT now(),"updatedAt" TIMESTAMPTZ DEFAULT now(),UNIQUE("bookId","chapterIndex",language,"voiceLang"))`,
`CREATE INDEX IF NOT EXISTS idx_up_user ON "UserProgress"("userId")`,
`CREATE INDEX IF NOT EXISTS idx_up_book ON "UserProgress"("bookId")`,
`CREATE INDEX IF NOT EXISTS idx_chat ON "ChatSession"("userId","bookId")`,
`CREATE INDEX IF NOT EXISTS idx_audio_hash ON "AudioCache"("textHash")`,
`CREATE INDEX IF NOT EXISTS idx_audio_exp ON "AudioCache"("expiresAt")`,
];

for (const stmt of statements) {
  try {
    await sql.query(stmt);
    console.log('OK:', stmt.slice(0, 60));
    await wait(400);
  } catch (e) {
    console.error('ERR:', e.message.slice(0, 100), '\n on:', stmt.slice(0, 50));
    await wait(400);
  }
}
console.log('Tables done!');
