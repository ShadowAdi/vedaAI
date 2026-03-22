import express from "express";
import helmet from "helmet";
import { CorsConfig } from "./config/cors.js";
import { CustomErrorHandler } from "./middlewares/custom-error.middleware.js";
import { healthRouter } from "./routes/health.route.js";
import { assignmentRouter } from "./routes/assignment.router.js";
import { createRouteHandler } from "uploadthing/express";
import { uploadRouter } from "./config/uploadThingRouter.js";
import { UPLOADTHING_API_KEY } from "./config/dotenv.js";

const app = express()

app.use(helmet())
CorsConfig(app)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(
    "/api/uploadthing",
    createRouteHandler({
        router: uploadRouter,
        config: {
            token: UPLOADTHING_API_KEY,
        },
    }),
);

app.use("/api/health", healthRouter)
app.use("/api/assignment", assignmentRouter)



app.get('/', (_req, res) => {
    res.json({
        service: 'veda-ai-backend',
        status: 'running',
        version: '2.1.0',
        features: {
            socketIO: 'enabled',
        },
        endpoints: {
            health: '/api/health',
        }
    });
});

app.use(CustomErrorHandler)

export default app