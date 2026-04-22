require("dotenv/config");
const { Client } = require("pg");

const demoUserId = "demo-user";

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  await client.query("BEGIN");
  try {
    await client.query(
      `INSERT INTO users (id, email, username, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [demoUserId, "demo@example.com", "demo", "USER"]
    );

    const languages = [
      { name: "TypeScript", ext: ".ts" },
      { name: "JavaScript", ext: ".js" },
      { name: "C", ext: ".c" },
      { name: "C++", ext: ".cpp" },
      { name: "C#", ext: ".cs" },
      { name: "Java", ext: ".java" },
      { name: "Python", ext: ".py" },
      { name: "Go", ext: ".go" },
      { name: "Rust", ext: ".rs" },
      { name: "Kotlin", ext: ".kt" },
      { name: "Swift", ext: ".swift" },
      { name: "PHP", ext: ".php" },
      { name: "Ruby", ext: ".rb" },
      { name: "SQL", ext: ".sql" },
      { name: "Bash", ext: ".sh" },
      { name: "HTML", ext: ".html" },
      { name: "CSS", ext: ".css" },
      { name: "Dart", ext: ".dart" },
      { name: "Scala", ext: ".scala" },
      { name: "R", ext: ".r" },
    ];

    for (const lang of languages) {
      await client.query(
        `INSERT INTO languages (name, file_extension)
         VALUES ($1, $2)
         ON CONFLICT (name) DO NOTHING`,
        [lang.name, lang.ext]
      );
    }

    const tags = ["web", "backend", "typescript", "algorithms", "api"];
    for (const tag of tags) {
      await client.query(
        `INSERT INTO tags (name, usage_count)
         VALUES ($1, 0)
         ON CONFLICT (name) DO NOTHING`,
        [tag]
      );
    }

    const languageRows = await client.query(`SELECT id, file_extension FROM languages`);
    const languageMap = new Map(languageRows.rows.map((row) => [row.file_extension, row.id]));

    const snippetSeed = [
      {
        title: "tRPC router пример",
        code: "export const router = t.router({});",
        languageExt: ".ts",
        tags: ["backend", "typescript"],
      },
      {
        title: "Express middleware",
        code: "app.use((req, res, next) => next());",
        languageExt: ".js",
        tags: ["backend", "api"],
      },
      {
        title: "C++ quick sort",
        code: "void quickSort(vector<int>& a) { /* ... */ }",
        languageExt: ".cpp",
        tags: ["algorithms"],
      },
    ];

    const snippetIds = [];
    for (const item of snippetSeed) {
      const languageId = languageMap.get(item.languageExt) || null;
      const existingSnippet = await client.query(
        `SELECT id FROM snippets
         WHERE title = $1 AND author_id = $2
         LIMIT 1`,
        [item.title, demoUserId]
      );

      if (existingSnippet.rows[0]?.id) {
        snippetIds.push({ id: existingSnippet.rows[0].id, tags: item.tags });
        continue;
      }

      const createdSnippet = await client.query(
        `INSERT INTO snippets (title, code, language_id, author_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [item.title, item.code, languageId, demoUserId]
      );
      snippetIds.push({ id: createdSnippet.rows[0].id, tags: item.tags });
    }

    const tagRows = await client.query(`SELECT id, name FROM tags WHERE name = ANY($1)`, [tags]);
    const tagMap = new Map(tagRows.rows.map((row) => [row.name, row.id]));

    for (const snippet of snippetIds) {
      for (const tagName of snippet.tags) {
        const tagId = tagMap.get(tagName);
        if (!tagId) continue;
        await client.query(
          `INSERT INTO snippet_tags (snippet_id, tag_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [snippet.id, tagId]
        );
      }
    }

    if (snippetIds[0]) {
      await client.query(
        `INSERT INTO comments (text, author_id, snippet_id)
         SELECT $1, $2, $3
         WHERE NOT EXISTS (
           SELECT 1 FROM comments WHERE text = $1 AND author_id = $2 AND snippet_id = $3
         )`,
        ["Отличный пример", demoUserId, snippetIds[0].id]
      );

      await client.query(
        `INSERT INTO favorites (user_id, snippet_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [demoUserId, snippetIds[0].id]
      );
    }

    const existingCollection = await client.query(
      `SELECT id FROM collections
       WHERE name = $1 AND owner_id = $2
       LIMIT 1`,
      ["Моя коллекция", demoUserId]
    );

    let collectionId = existingCollection.rows[0]?.id;
    if (!collectionId) {
      const collectionResult = await client.query(
        `INSERT INTO collections (name, owner_id)
         VALUES ($1, $2)
         RETURNING id`,
        ["Моя коллекция", demoUserId]
      );
      collectionId = collectionResult.rows[0]?.id;
    }

    if (collectionId) {
      for (const snippet of snippetIds) {
        await client.query(
          `INSERT INTO collection_snippets (collection_id, snippet_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [collectionId, snippet.id]
        );
      }
    }

    await client.query(`UPDATE tags SET usage_count = 0`);
    await client.query(
      `UPDATE tags SET usage_count = sub.count
       FROM (
         SELECT tag_id, COUNT(*) as count
         FROM snippet_tags
         GROUP BY tag_id
       ) as sub
       WHERE tags.id = sub.tag_id`
    );

    await client.query("COMMIT");
    console.log("Seed done");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
