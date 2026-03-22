import { Router } from "express";
import { CreateAssignment, GetAssessment, GetAssessmentById, RegenerateAssessment, DeleteAssignment, DownloadAssignment } from "../controllers/assignment.controller.js";
import { upload } from "../config/multer.js";

export const assignmentRouter = Router()

assignmentRouter.post("/", upload.single("file"), CreateAssignment)
assignmentRouter.get("/", GetAssessment)
assignmentRouter.get("/:assessmentId", GetAssessmentById)
assignmentRouter.get("/download/:assessmentId", DownloadAssignment)
assignmentRouter.post("/:assessmentId/regenerate", RegenerateAssessment)
assignmentRouter.delete("/:assessmentId", DeleteAssignment)