import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import {
  activities,
  collections,
  collectionSnippets,
  comments,
  favorites,
  languages,
  snippetTags,
  snippets,
  tags,
  users,
} from "../src/server/db/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, {
  schema: {
    users,
    languages,
    tags,
    snippets,
    snippetTags,
    comments,
    favorites,
    collections,
    collectionSnippets,
    activities,
  },
});

async function main() {
  console.log("Seeding...");

  const demoUserId = "demo-user";
  await db
    .insert(users)
    .values({
      id: demoUserId,
      email: "demo@example.com",
      username: "demo",
      role: "USER",
    })
    .onConflictDoNothing();

  const languageSeed = [
    { name: "TypeScript", fileExtension: ".ts" },
    { name: "JavaScript", fileExtension: ".js" },
    { name: "C++", fileExtension: ".cpp" },
  ];

  const insertedLanguages = await db
    .insert(languages)
    .values(languageSeed)
    .onConflictDoNothing()
    .returning();

  const allLanguages =
    insertedLanguages.length > 0
      ? insertedLanguages
      : await db.select().from(languages);

  const tagSeed = ["web", "backend", "typescript", "algorithms", "api"];
  const insertedTags = await db
    .insert(tags)
    .values(tagSeed.map((name) => ({ name })))
    .onConflictDoNothing()
    .returning();

  const allTags = insertedTags.length > 0 ? insertedTags : await db.select().from(tags);

  const snippetSeed = [
    {
      title: "tRPC router пример",
      code: "export const router = t.router({});",
      languageId: allLanguages.find((l) => l.fileExtension === ".ts")?.id,
      tags: ["backend", "typescript"],
    },
    {
      title: "Express middleware",
      code: "app.use((req, res, next) => next());",
      languageId: allLanguages.find((l) => l.fileExtension === ".js")?.id,
      tags: ["backend", "api"],
    },
    {
      title: "C++ quick sort",
      code: "void quickSort(vector<int>& a) { /* ... */ }",
      languageId: allLanguages.find((l) => l.fileExtension === ".cpp")?.id,
      tags: ["algorithms"],
    },
  ];

  const insertedSnippets = await db
    .insert(snippets)
    .values(
      snippetSeed.map((item) => ({
        title: item.title,
        code: item.code,
        languageId: item.languageId,
        authorId: demoUserId,
      }))
    )
    .returning();

  for (const snippet of insertedSnippets) {
    const tagNames = snippetSeed.find((item) => item.title === snippet.title)?.tags ?? [];
    const tagIds = allTags.filter((tag) => tagNames.includes(tag.name));
    for (const tag of tagIds) {
      await db.insert(snippetTags).values({ snippetId: snippet.id, tagId: tag.id });
    }
  }

  const [firstSnippet] = insertedSnippets;
  if (firstSnippet) {
    await db.insert(comments).values({
      text: "Отличный пример",
      authorId: demoUserId,
      snippetId: firstSnippet.id,
    });

    await db.insert(favorites).values({
      userId: demoUserId,
      snippetId: firstSnippet.id,
    });
  }

  if (insertedSnippets.length > 0) {
    const collection = await db
      .insert(collections)
      .values({ name: "Моя коллекция", ownerId: demoUserId })
      .returning();

    const collectionId = collection[0]?.id;
    if (collectionId) {
      await db.insert(collectionSnippets).values(
        insertedSnippets.map((snippet) => ({
          collectionId,
          snippetId: snippet.id,
        }))
      );
    }
  }

  const tagsToUpdate = await db
    .select({ tagId: snippetTags.tagId })
    .from(snippetTags)
    .groupBy(snippetTags.tagId);

  for (const item of tagsToUpdate) {
    const count = await db.$count(snippetTags.tagId, eq(snippetTags.tagId, item.tagId));
    await db
      .update(tags)
      .set({ usageCount: count })
      .where(eq(tags.id, item.tagId));
  }

  console.log("Seed done");
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
