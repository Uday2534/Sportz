import { pgTable, serial, text, integer, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';

// ENUM: match_status -> (scheduled, live, finished)
export const matchStatus = pgEnum('match_status', ['scheduled', 'live', 'finished']);

// matches table
export const matches = pgTable('matches', {
	id: serial('id').primaryKey(),
	sport: text('sport').notNull(),
	homeTeam: text('home_team').notNull(),
	awayTeam: text('away_team').notNull(),
	status: matchStatus('status').notNull().default('scheduled'),
	startTime: timestamp('start_time', { withTimezone: true }).notNull(),
	endTime: timestamp('end_time', { withTimezone: true }),
	homeScore: integer('home_score').notNull().default(0),
	awayScore: integer('away_score').notNull().default(0),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// commentary table
export const commentary = pgTable('commentary', {
	id: serial('id').primaryKey(),
	matchId: integer('match_id').references(() => matches.id).notNull(),
	minute: integer('minute'),
	sequence: integer('sequence').notNull(),
	period: text('period'),
	eventType: text('event_type'),
	actor: text('actor'),
	team: text('team'),
	message: text('message').notNull(),
	metadata: jsonb('metadata'),
	tags: text('tags').array(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

