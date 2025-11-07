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
import bodyParser from "body-parser";
import patientsRoutes from "./src/routes/patientsRoutes.js";
import doctorsRoutes from "./src/routes/doctorsRoutes.js";
import appointmentsRoutes from "./src/routes/appoimentsRoutes.js";
import departmentsRoutes from "./src/routes/departmentsRoutes.js";
import historiesRoutes from "./src/routes/historiesRoutes.js";
import reviewsRoutes from "./src/routes/reviewsRoutes.js";

const app = express();

// Crear directorio uploads si no existe
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

//Archivo Swagger
const swaggerDocument = JSON.parse(fs.readFileSync(
    path.resolve("./claro-130-DoctorsApi-1.0.0-resolved.json"),
    "utf-8")
)



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
app.use("/api/docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));

// Rutas principales
app.use("/api", authRoutes);
app.use("/api/pacientes", patientsRoutes);
app.use("/api/doctores", doctorsRoutes);
app.use("/api/citas", appointmentsRoutes);
app.use("/api/departamentos", departmentsRoutes);
app.use("/api/historias", historiesRoutes);
app.use("/api/resenas", reviewsRoutes); 

export default app;