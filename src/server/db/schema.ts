import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    username: text("username").notNull(),
    avatarUrl: text("avatar_url"),
    role: text("role").notNull().default("USER"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    usernameIdx: uniqueIndex("users_username_idx").on(table.username),
  })
);

export const languages = pgTable(
  "languages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    fileExtension: text("file_extension").notNull(),
  },
  (table) => ({
    nameIdx: uniqueIndex("languages_name_idx").on(table.name),
  })
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    usageCount: integer("usage_count").notNull().default(0),
  },
  (table) => ({
    nameIdx: uniqueIndex("tags_name_idx").on(table.name),
  })
);

export const snippets = pgTable("snippets", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  code: text("code").notNull(),
  languageId: uuid("language_id").references(() => languages.id),
  authorId: text("author_id").references(() => users.id),
  views: integer("views").notNull().default(0),
  favoritesCount: integer("favorites_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const snippetTags = pgTable(
  "snippet_tags",
  {
    snippetId: uuid("snippet_id").notNull().references(() => snippets.id),
    tagId: uuid("tag_id").notNull().references(() => tags.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.snippetId, table.tagId] }),
  })
);

export const collections = pgTable("collections", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const collectionSnippets = pgTable(
  "collection_snippets",
  {
    collectionId: uuid("collection_id").notNull().references(() => collections.id),
    snippetId: uuid("snippet_id").notNull().references(() => snippets.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.collectionId, table.snippetId] }),
  })
);

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  text: text("text").notNull(),
  authorId: text("author_id").notNull().references(() => users.id),
  snippetId: uuid("snippet_id").notNull().references(() => snippets.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const favorites = pgTable(
  "favorites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    snippetId: uuid("snippet_id").notNull().references(() => snippets.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueFavorite: uniqueIndex("favorites_user_snippet_idx").on(table.userId, table.snippetId),
  })
);

export const activities = pgTable("activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  entityId: text("entity_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
