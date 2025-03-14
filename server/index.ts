import express, { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import path from "path";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from 'dotenv';
import cors from "cors";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import fs from "fs";
import { fileURLToPath } from 'url';

dotenv.config();

// Définir __dirname pour les modules ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configuration CORS - ajuster pour autoriser toutes les origines pendant le développement
app.use(cors({
  origin: "*", // Autoriser toutes les origines pendant le développement
  credentials: true
}));

// Configuration pour analyser les requêtes JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques depuis le dossier public - placer AVANT toutes les autres routes
app.use('/uploads', express.static(path.join(__dirname, "../public/uploads"), {
  setHeaders: (res) => {
    // Permettre au navigateur de mettre en cache les images pendant 1 heure
    res.setHeader('Cache-Control', 'public, max-age=3600');
    // S'assurer que le CORS ne bloque pas les images
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
  }
}));

// Route directe pour les fichiers uploadés
app.get('/uploads/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../public/uploads', filename);
  
  console.log('Demande de fichier:', filePath);
  
  // Vérifier si le fichier existe
  if (fs.existsSync(filePath)) {
    // Permettre la mise en cache et le CORS
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    
    res.sendFile(filePath);
  } else {
    console.log('Fichier non trouvé:', filePath);
    res.status(404).send('Fichier non trouvé');
  }
});

// Servir les fichiers statiques depuis le dossier public
app.use(express.static(path.join(__dirname, "../public")));

// Ajouter des logs plus détaillés pour le débogage des fichiers statiques
app.use((req, res, next) => {
  if (req.url.startsWith("/uploads")) {
    const filePath = path.join(__dirname, "../public", req.url);
    const fileExists = fs.existsSync(filePath);
    console.log({
      url: req.url,
      filePath,
      exists: fileExists,
      method: req.method
    });
  }
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client
  const port = 5000;
  server.listen({
    port,
    host: "localhost",
  }, () => {
    log(`serving on port ${port}`);
  });
})();
