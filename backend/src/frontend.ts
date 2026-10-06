import express, { type Express } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve from either backend/src or backend/dist, independent of the working directory.
export const frontendDist = fileURLToPath(new URL('../../frontend/dist/', import.meta.url));
export function serveFrontend(app: Express) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    // Missing API endpoints and static assets must never return the SPA's HTML.
    if (req.path === '/api' || req.path.startsWith('/api/') || path.extname(req.path) || req.path.startsWith('/assets/')) return next();
    if (!req.accepts('html')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}
