import Router from "express";
import { issuController } from "./issu.controller";
import auth from "../../middleware/auth";

const router = Router();
const USER_ROLE = {
    contributor: "contributor",
    maintainer: "maintainer"
} as const;

router.post('/', auth(USER_ROLE.contributor, USER_ROLE.maintainer), issuController.createIssu);
router.get('/', issuController.getAllIssues);
router.get('/:id', issuController.getSingleIssues);
router.patch('/:id', auth(USER_ROLE.contributor, USER_ROLE.maintainer), issuController.updateIssue);
router.delete('/:id', auth( USER_ROLE.maintainer), issuController.deleteIssue);
export const issuRouter = router;