import type { Request, Response } from "express";
import { issuService } from "./issu.service";
import sendResponse from "../../utility/sendResponse";
import { pool } from "../../db";

const createIssu = async (req: Request, res: Response) => {
    const payload = { ...req.body, reporter_id: req.user?.id }
    const result = await issuService.createIssuIntoDB(payload);
    // const token = req.headers.authorization;

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Issue created successfully",
        data: result.rows[0]
    })
};

const getAllIssues = async (req: Request, res: Response) => {
    const { sort = "newest", type, status } = req.query;

    const result = await issuService.getAllIssuesFromDB({
        sort: sort as string,
        type: type as string,
        status: status as string,
    });

    if (result.length === 0) {
        return sendResponse(res, {
            statusCode: 404,
            success: false,
            message: "Issue not found",
        });
    }

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Issues retrieved successfully",
        data: result,
    });
};

const getSingleIssues = async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await issuService.getSingleIssuesFromDB(Number(id));

    if (!result) {
        return sendResponse(res, {
            statusCode: 404,
            success: false,
            message: "Issue not found",
        });
    }

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Issue retrieved successfully",
        data: result,
    });
};

const updateIssue = async (req: Request, res: Response) => {
    const { id } = req.params;

    const userId = req.user?.id;
    const role = req.user?.role;

    // Find the issue being updated
    const issueResult = await pool.query(
        `
        SELECT *
        FROM issues
        WHERE id = $1
        `,
        [Number(id)]
    );

    if (issueResult.rows.length === 0) {
        return sendResponse(res, {
            statusCode: 404,
            success: false,
            message: "Issue not found",
        });
    }

    const issue = issueResult.rows[0];

    // contributor update own issue
    if (role === "contributor" && issue.reporter_id !== userId) {
        return sendResponse(res, {
            statusCode: 403,
            success: false,
            message: "Forbidden Access!",
        });
    }

    // Contributor  update when status -> open
    if (role === "contributor" && issue.status !== "open") {
        return sendResponse(res, {
            statusCode: 409,
            success: false,
            message: "Issue cannot be updated because it is not open",
        });
    }

    const result = await issuService.updateIssueIntoDB(
        Number(id),
        req.body
    );
    if (result.rows.length === 0) {
        return sendResponse(res, {
            statusCode: 404,
            success: false,
            message: "Issue not found"
        })
    }
    return sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Issue updated successfully",
        data: result.rows[0],
    });
};
const deleteIssue = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await issuService.deleteIssueIntoDB(Number(id));
    if (result.rows.length == 0) {
        return sendResponse(res, {
            statusCode: 404,
            success: false,
            message: "Issue not found"
        })
    }
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Issue Deleted successfully"
    })
}

export const issuController = { createIssu, getAllIssues, getSingleIssues, updateIssue, deleteIssue };