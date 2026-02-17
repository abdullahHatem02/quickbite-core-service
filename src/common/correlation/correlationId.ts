import {v4 as uuidv4} from 'uuid';
import type {Request, Response, NextFunction} from "express";

export function correlationId(req: Request, res: Response, next: NextFunction) {
    const id = uuidv4();
    req.correlationId = id;
    res.setHeader('X-CorrelationId', id);
    next();
}
