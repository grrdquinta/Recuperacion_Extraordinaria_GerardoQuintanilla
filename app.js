import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import swaggerUI from 'swagger-ui-express';
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { config } from "./src/config.js";

// Importar rutas
import authRoutes from "./src/routes/authRoutes.js";
/*import booksRoutes from "./src/routes/booksRoutes.js";
import authorsRoutes from "./src/routes/authorsRoutes.js";
import categoriesRoutes from "./src/routes/categoriesRoutes.js";
import loansRoutes from "./src/routes/loansRoutes.js";
import reviewsRoutes from "./src/routes/reviewsRoutes.js";
import clientsRoutes from "./src/routes/clientsRoutes.js";*/
import bodyParser from "body-parser";

const app = express();

// Crear directorio uploads si no existe
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

//Archivo Swagger
/*const swaggerDocument = JSON.parse(fs.readFileSync(
    path.resolve("./gerardo-221-BinaesAPI-1.0.0-resolved.json"),
    "utf-8")
)*/



const corsOptions = {
    origin: [
        'http://localhost:5173', 
        'http://localhost:4000',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'Cookie',
        'Set-Cookie',
        'X-Requested-With',
        'Accept',
        'Origin',
        'User-Agent',
        'Cache-Control'
    ],
    exposedHeaders: [
        'Set-Cookie',
        'Authorization',
        'Content-Type'
    ],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Documentación Swagger
//app.use("/api/docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));

// Rutas principales
app.use("/api", authRoutes);
/*app.use("/api/books", booksRoutes);
app.use("/api/authors", authorsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/loans", loansRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/clients", clientsRoutes);*/

export default app;