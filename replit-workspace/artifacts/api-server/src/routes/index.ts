import { Router, type IRouter } from "express";
import healthRouter from "./health";
import emrRouter from "./emr";

const router: IRouter = Router();

router.use(healthRouter);
router.use(emrRouter);

export default router;
