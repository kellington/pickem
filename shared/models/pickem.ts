import {
  pgTable,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  unique,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const seasonStatusEnum = pgEnum("season_status", ["setup", "active", "complete"]);
export const leagueMemberRoleEnum = pgEnum("league_member_role", ["admin", "player"]);
export const leagueMemberStatusEnum = pgEnum("league_member_status", ["invited", "active", "disabled"]);
export const weekPhaseEnum = pgEnum("week_phase", ["regular", "playoff"]);
export const weekStatusEnum = pgEnum("week_status", ["setup", "open", "locked", "scored"]);
export const kickoffStatusEnum = pgEnum("kickoff_status", ["scheduled", "date_tbd", "time_tbd", "date_time_tbd"]);
export const gameResultStatusEnum = pgEnum("game_result_status", ["scheduled", "in_progress", "final", "postponed", "cancelled"]);
export const scheduleImportStatusEnum = pgEnum("schedule_import_status", ["staged", "validated", "imported", "superseded", "failed"]);

export const appUsers = pgTable("app_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  replitUserId: varchar("replit_user_id").unique(),
  replitUsername: varchar("replit_username"),
  email: varchar("email"),
  displayName: varchar("display_name"),
  avatarUrl: text("avatar_url"),
  firstSeenAt: timestamp("first_seen_at").defaultNow(),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leagueMembers = pgTable("league_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  appUserId: varchar("app_user_id").references(() => appUsers.id),
  approvedEmail: varchar("approved_email"),
  approvedReplitUsername: varchar("approved_replit_username"),
  role: leagueMemberRoleEnum("role").notNull().default("player"),
  status: leagueMemberStatusEnum("status").notNull().default("invited"),
  joinedAt: timestamp("joined_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  unique().on(t.appUserId),
]);

export const playerProfiles = pgTable("player_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leagueMemberId: varchar("league_member_id").notNull().references(() => leagueMembers.id),
  teamName: varchar("team_name").notNull(),
  initials: varchar("initials", { length: 4 }).notNull(),
  imageStorageKey: varchar("image_storage_key"),
  primaryColor: varchar("primary_color"),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  unique().on(t.leagueMemberId),
]);

export const seasons = pgTable("seasons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  year: integer("year").notNull(),
  name: varchar("name").notNull(),
  leagueTimezone: varchar("league_timezone").notNull().default("America/Edmonton"),
  regularSeasonStartWeek: integer("regular_season_start_week").notNull().default(1),
  regularSeasonEndWeek: integer("regular_season_end_week").notNull().default(18),
  droppedWeekCount: integer("dropped_week_count").notNull().default(4),
  status: seasonStatusEnum("status").notNull().default("setup"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const seasonMembers = pgTable("season_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  seasonId: varchar("season_id").notNull().references(() => seasons.id),
  leagueMemberId: varchar("league_member_id").notNull().references(() => leagueMembers.id),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  unique().on(t.seasonId, t.leagueMemberId),
]);

export const nflTeams = pgTable("nfl_teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  abbreviation: varchar("abbreviation", { length: 5 }).notNull().unique(),
  slug: varchar("slug").notNull().unique(),
  city: varchar("city").notNull(),
  name: varchar("name").notNull(),
  fullName: varchar("full_name").notNull(),
  conference: varchar("conference", { length: 3 }).notNull(),
  division: varchar("division").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const weeks = pgTable("weeks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  seasonId: varchar("season_id").notNull().references(() => seasons.id),
  phase: weekPhaseEnum("phase").notNull().default("regular"),
  weekNumber: integer("week_number").notNull(),
  label: varchar("label").notNull(),
  startsOn: timestamp("starts_on"),
  endsOn: timestamp("ends_on"),
  status: weekStatusEnum("status").notNull().default("setup"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  unique().on(t.seasonId, t.phase, t.weekNumber),
]);

export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  seasonId: varchar("season_id").notNull().references(() => seasons.id),
  weekId: varchar("week_id").notNull().references(() => weeks.id),
  sourceGameKey: varchar("source_game_key").unique(),
  awayTeamId: varchar("away_team_id").notNull().references(() => nflTeams.id),
  homeTeamId: varchar("home_team_id").notNull().references(() => nflTeams.id),
  kickoffAtUtc: timestamp("kickoff_at_utc"),
  kickoffStatus: kickoffStatusEnum("kickoff_status").notNull().default("scheduled"),
  pickCutoffAtUtc: timestamp("pick_cutoff_at_utc"),
  neutralSite: boolean("neutral_site").notNull().default(false),
  siteName: varchar("site_name"),
  siteCity: varchar("site_city"),
  siteCountry: varchar("site_country"),
  broadcast: varchar("broadcast"),
  sourceNotes: text("source_notes"),
  isSubjectToChange: boolean("is_subject_to_change").notNull().default(false),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const gameResults = pgTable("game_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull().references(() => games.id),
  status: gameResultStatusEnum("status").notNull().default("scheduled"),
  awayScore: integer("away_score"),
  homeScore: integer("home_score"),
  winningTeamId: varchar("winning_team_id").references(() => nflTeams.id),
  isTie: boolean("is_tie").notNull().default(false),
  finalizedAt: timestamp("finalized_at"),
  enteredByMemberId: varchar("entered_by_member_id").references(() => leagueMembers.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  unique().on(t.gameId),
]);

export const picks = pgTable("picks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  seasonMemberId: varchar("season_member_id").notNull().references(() => seasonMembers.id),
  weekId: varchar("week_id").notNull().references(() => weeks.id),
  gameId: varchar("game_id").notNull().references(() => games.id),
  selectedTeamId: varchar("selected_team_id").notNull().references(() => nflTeams.id),
  confidenceValue: integer("confidence_value").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => [
  unique().on(t.seasonMemberId, t.gameId),
  unique().on(t.seasonMemberId, t.weekId, t.confidenceValue),
]);

export const pickScores = pgTable("pick_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pickId: varchar("pick_id").notNull().references(() => picks.id),
  gameResultId: varchar("game_result_id").notNull().references(() => gameResults.id),
  isCorrect: boolean("is_correct").notNull(),
  pointsAwarded: integer("points_awarded").notNull(),
  scoredAt: timestamp("scored_at").defaultNow(),
}, (t) => [
  unique().on(t.pickId),
]);

export const weeklyScores = pgTable("weekly_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  seasonMemberId: varchar("season_member_id").notNull().references(() => seasonMembers.id),
  weekId: varchar("week_id").notNull().references(() => weeks.id),
  correctPickCount: integer("correct_pick_count").notNull().default(0),
  rawPoints: integer("raw_points").notNull().default(0),
  possiblePoints: integer("possible_points").notNull().default(0),
  scoredAt: timestamp("scored_at").defaultNow(),
}, (t) => [
  unique().on(t.seasonMemberId, t.weekId),
]);

export const scheduleImports = pgTable("schedule_imports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  seasonId: varchar("season_id").notNull().references(() => seasons.id),
  sourceUrl: text("source_url"),
  sourceName: varchar("source_name"),
  sourceFetchedAt: timestamp("source_fetched_at"),
  rawContentHash: varchar("raw_content_hash"),
  status: scheduleImportStatusEnum("status").notNull().default("staged"),
  notes: text("notes"),
});

export const featureIdeas = pgTable("feature_ideas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  appUserId: varchar("app_user_id").notNull().references(() => appUsers.id),
  ideaText: text("idea_text").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const scheduleImportRows = pgTable("schedule_import_rows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scheduleImportId: varchar("schedule_import_id").notNull().references(() => scheduleImports.id),
  weekNumber: integer("week_number"),
  rawDateLabel: varchar("raw_date_label"),
  rawMatchup: varchar("raw_matchup"),
  rawTime: varchar("raw_time"),
  rawBroadcast: varchar("raw_broadcast"),
  parsedAwayTeamName: varchar("parsed_away_team_name"),
  parsedHomeTeamName: varchar("parsed_home_team_name"),
  parsedNeutralSiteName: varchar("parsed_neutral_site_name"),
  parsedKickoffAtUtc: timestamp("parsed_kickoff_at_utc"),
  parseStatus: varchar("parse_status"),
  parseError: text("parse_error"),
});

export const appUsersRelations = relations(appUsers, ({ one }) => ({
  leagueMember: one(leagueMembers, {
    fields: [appUsers.id],
    references: [leagueMembers.appUserId],
  }),
}));

export const leagueMembersRelations = relations(leagueMembers, ({ one, many }) => ({
  appUser: one(appUsers, {
    fields: [leagueMembers.appUserId],
    references: [appUsers.id],
  }),
  playerProfile: one(playerProfiles, {
    fields: [leagueMembers.id],
    references: [playerProfiles.leagueMemberId],
  }),
  seasonMembers: many(seasonMembers),
}));

export const playerProfilesRelations = relations(playerProfiles, ({ one }) => ({
  leagueMember: one(leagueMembers, {
    fields: [playerProfiles.leagueMemberId],
    references: [leagueMembers.id],
  }),
}));

export const seasonsRelations = relations(seasons, ({ many }) => ({
  seasonMembers: many(seasonMembers),
  weeks: many(weeks),
  games: many(games),
}));

export const seasonMembersRelations = relations(seasonMembers, ({ one, many }) => ({
  season: one(seasons, { fields: [seasonMembers.seasonId], references: [seasons.id] }),
  leagueMember: one(leagueMembers, { fields: [seasonMembers.leagueMemberId], references: [leagueMembers.id] }),
  picks: many(picks),
  weeklyScores: many(weeklyScores),
}));

export const nflTeamsRelations = relations(nflTeams, ({ many }) => ({
  awayGames: many(games, { relationName: "awayTeam" }),
  homeGames: many(games, { relationName: "homeTeam" }),
}));

export const weeksRelations = relations(weeks, ({ one, many }) => ({
  season: one(seasons, { fields: [weeks.seasonId], references: [seasons.id] }),
  games: many(games),
  picks: many(picks),
  weeklyScores: many(weeklyScores),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  season: one(seasons, { fields: [games.seasonId], references: [seasons.id] }),
  week: one(weeks, { fields: [games.weekId], references: [weeks.id] }),
  awayTeam: one(nflTeams, { fields: [games.awayTeamId], references: [nflTeams.id], relationName: "awayTeam" }),
  homeTeam: one(nflTeams, { fields: [games.homeTeamId], references: [nflTeams.id], relationName: "homeTeam" }),
  gameResult: one(gameResults, { fields: [games.id], references: [gameResults.gameId] }),
  picks: many(picks),
}));

export const picksRelations = relations(picks, ({ one }) => ({
  seasonMember: one(seasonMembers, { fields: [picks.seasonMemberId], references: [seasonMembers.id] }),
  week: one(weeks, { fields: [picks.weekId], references: [weeks.id] }),
  game: one(games, { fields: [picks.gameId], references: [games.id] }),
  selectedTeam: one(nflTeams, { fields: [picks.selectedTeamId], references: [nflTeams.id] }),
  pickScore: one(pickScores, { fields: [picks.id], references: [pickScores.pickId] }),
}));

export type Season = typeof seasons.$inferSelect;
export type InsertSeason = typeof seasons.$inferInsert;
export type Week = typeof weeks.$inferSelect;
export type Game = typeof games.$inferSelect;
export type NflTeam = typeof nflTeams.$inferSelect;
export type Pick = typeof picks.$inferSelect;
export type InsertPick = typeof picks.$inferInsert;
export type LeagueMember = typeof leagueMembers.$inferSelect;
export type PlayerProfile = typeof playerProfiles.$inferSelect;
export type SeasonMember = typeof seasonMembers.$inferSelect;
export type WeeklyScore = typeof weeklyScores.$inferSelect;
export type GameResult = typeof gameResults.$inferSelect;
export type PickScore = typeof pickScores.$inferSelect;
