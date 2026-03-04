import { Router} from "express";
import { createMatchSchema, listMatchesQuerySchema } from "../validation/matches.js";
import {db} from "../db/db.js";
import {matches} from "../db/schema.js"
import { getMatchStatus } from "../utils/match-status.js";
import { desc } from "drizzle-orm";

export const matchRouter=Router();
const MAX_LIMIT=100;
matchRouter.get('/',async (req,res)=>{
    const parsed=listMatchesQuerySchema.safeParse(req.query)
    if(!parsed.success){
        return res.status(400).json({error:'Invalid Query.',details:JSON.stringify(parsed.error)})
    }
    const limit=Math.min(parsed.data.limit ?? 50, MAX_LIMIT)
    try{
        const data=await db.select().from(matches).orderBy((desc(matches.createdAt))).limit(limit)
        res.json({data})
    }
    
    catch(err){
        return res.status(500).json({error:'Failed to list matches.',details:JSON.stringify(err)})
    }
})

matchRouter.post('/',async (req,res)=>{
    const parsed=createMatchSchema.safeParse(req.body)
    if(!parsed.success){
        return res.status(400).json({error:'Invalid Payload.',details:parsed.error.issues})
    }
    const {data:{startTime,endTime,awayScore,homeScore}}=parsed;
    try{
        const [event]=await db.insert(matches).values({
            ...parsed.data,
            startTime:new Date(startTime),
            endTime:new Date(endTime),
            awayScore:awayScore ?? 0,
            homeScore:homeScore ?? 0,
            status:getMatchStatus(startTime,endTime)
        }).returning()
        if(res.app.locals.broadcastMatchCreated){
            res.app.locals.broadcastMatchCreated(event);
        }
        res.status(201).json({data:event})
    }
    catch(err){
        return res.status(500).json({
            error:'Failed to create match.',
            details: err instanceof Error ? err.message : String(err)
        })
    }
})
