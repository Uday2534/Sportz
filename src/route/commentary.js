import { Router } from "express";
import { matchIdParamSchema } from "../validation/matches.js";
import { createCommentarySchema, listCommentaryQuerySchema } from "../validation/commentary.js";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import { desc } from "drizzle-orm";
import { eq } from "drizzle-orm";

export const commentaryRouter = Router({ mergeParams: true });

// list commentary events for a match, newest first
const MAX_LIMIT = 100;
commentaryRouter.get('/', async (req, res) => {
    // validate path parameters
    const paramsParsed = matchIdParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
        return res.status(400).json({ error: 'Invalid match id.', details: paramsParsed.error.issues });
    }

    // validate query string
    const queryParsed = listCommentaryQuerySchema.safeParse(req.query);
    if (!queryParsed.success) {
        return res.status(400).json({ error: 'Invalid query.', details: JSON.stringify(queryParsed.error) });
    }

    const limit = Math.min(queryParsed.data.limit ?? 100, MAX_LIMIT);

    try {
        const data = await db
            .select()
            .from(commentary)
            .where(eq(commentary.matchId, paramsParsed.data.id))
            .orderBy(desc(commentary.createdAt))
            .limit(limit);
        res.json({ data });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to list commentary.', details: JSON.stringify(err) });
    }
});

// create a commentary for a given match
commentaryRouter.post('/', async (req, res) => {
    const paramsParsed = matchIdParamSchema.safeParse(req.params);
    if (!paramsParsed.success) {
        return res.status(400).json({ error: 'Invalid match id.', details: paramsParsed.error.issues });
    }

    const bodyParsed = createCommentarySchema.safeParse(req.body);
    if (!bodyParsed.success) {
        return res.status(400).json({ error: 'Invalid payload.', details: bodyParsed.error.issues });
    }

    try {
        const {minute,...rest}=bodyParsed.data;
        const [record] = await db.insert(commentary).values({
            matchId: paramsParsed.data.id,
            minute,
            ...rest
        }).returning();
        if(res.app.locals.broadcastCommentary){
            res.app.locals.broadcastCommentary(record.matchId,record)
        }
        res.status(201).json({ data: record });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to create commentary.', details: JSON.stringify(err) });
    }
});