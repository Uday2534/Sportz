import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";

const arcjetKey=process.env.ARCJET_KEY
const arcjetMode=process.env.ARCJET_MODE=== 'DRY_RUN' ? 'DRY_RUN' : 'LIVE';
const isProd = process.env.NODE_ENV === "production";

if(!arcjetKey){
    if(isProd){
        throw new Error('ARCJET_KEY is missing');
    }
    console.warn('ARCJET_KEY is missing. Security middleware is disabled.');
}

export const httpArcjet=arcjetKey ?
    arcjet({
        key:arcjetKey,
        rules: [
            shield({ mode: arcjetMode }),
            ...(isProd ? [
                detectBot({
                    mode: arcjetMode,
                    allow: ['CATEGORY:SEARCH_ENGINE','CATEGORY:PREVIEW']
                })
            ] : []),
            slidingWindow({
                mode: arcjetMode,
                interval: "10s",
                max: 50
            })
        ]

    }):null

export const wsArcjet=arcjetKey ?
    arcjet({
        key:arcjetKey,
        rules: [
            shield({ mode: arcjetMode }),
            ...(isProd ? [
                detectBot({
                    mode: arcjetMode,
                    allow: ['CATEGORY:SEARCH_ENGINE','CATEGORY:PREVIEW']
                })
            ] : []),
            slidingWindow({
                mode: arcjetMode,
                interval: "10s",
                max: 50
            })
        ]

    }):null

export function securityMiddleware(){
    return async(req,res,next)=>{
        if(!httpArcjet) return next();

        try{
            const decision= await httpArcjet.protect(req);
            if(decision.isDenied()){
                if(decision.reason.isRateLimit()){
                    return res.status(429).json({error:'Too many requests'})
                }
                return res.status(403).json({error:'Forbidden'})
            }

        }
        catch(err){
            console.error('Arcjet middleware error',err)
            return res.status(503).json({error:'Service Unavailable'})
        }
        next();
    }
}
