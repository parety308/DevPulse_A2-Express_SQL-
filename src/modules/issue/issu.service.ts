import { pool } from "../../db"
import type { IssueQuery } from "../../types";

const createIssuIntoDB = async (payload: any) => {
    const { title, description, type, reporter_id } = payload;
    const result = await pool.query(`
        INSERT INTO issues(title,description,type,reporter_id)
        VALUES($1,$2,$3,$4) RETURNING *`, [title, description, type, reporter_id]);

    return result;
};

const getAllIssuesFromDB = async ({
    sort = "newest",
    type,
    status,
}: IssueQuery) => {

    let query = `
        SELECT
            id,
            title,
            description,
            type,
            status,
            reporter_id,
            created_at,
            updated_at
        FROM issues
    `;

    const conditions: string[] = [];
    const values: any[] = [];

    if (type) {
        values.push(type);
        conditions.push(`type = $${values.length}`);
    }

    if (status) {
        values.push(status);
        conditions.push(`status = $${values.length}`);
    }

    if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY created_at ${
        sort === "oldest" ? "ASC" : "DESC"
    }`;

    // Query 1: Get issues
    const issueResult = await pool.query(query, values);

    if (issueResult.rows.length === 0) {
        return [];
    }

    // Collect unique reporter ids
    const reporterIds = [
        ...new Set(issueResult.rows.map(issue => issue.reporter_id)),
    ];

    // Query 2: Get reporters
    const reporterResult = await pool.query(
        `
        SELECT
            id,
            name,
            role
        FROM users
        WHERE id = ANY($1::int[])
        `,
        [reporterIds]
    );

    const reporterMap = new Map(
        reporterResult.rows.map(user => [user.id, user])
    );

    // Merge data
    const data = issueResult.rows.map(issue => ({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        type: issue.type,
        status: issue.status,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        reporter: reporterMap.get(issue.reporter_id),
    }));

    return data;
};

const getSingleIssuesFromDB = async (id: number) => {
    //get issue
    const issueResult = await pool.query(
        `
        SELECT
            id,
            title,
            description,
            type,
            status,
            reporter_id,
            created_at,
            updated_at
        FROM issues
        WHERE id = $1
        `,
        [id]
    );

    if (issueResult.rows.length === 0) {
        return null;
    }

    const issue = issueResult.rows[0];

    // get reporter
    const reporterResult = await pool.query(
        `
        SELECT
            id,
            name,
            role
        FROM users
        WHERE id = $1
        `,
        [issue.reporter_id]
    );

    return {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        type: issue.type,
        status: issue.status,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        reporter: reporterResult.rows[0],
    };
};

const updateIssueIntoDB = async (id: number, payload: any) => {
    const { title, description, type } = payload;
    const result = await pool.query(`
        UPDATE issues 
        SET 
        title=COALESCE($1,title),
        description=COALESCE($2,description),
        type=COALESCE($3,type)
        WHERE id=$4 RETURNING *
        `, [title, description, type, id]);
    return result;
}
const deleteIssueIntoDB = async (id: number,) => {
    const result = await pool.query(`
       DELETE FROM issues
       WHERE id=$1
       RETURNING *
`, [id]);
    return result;
}

export const issuService = { createIssuIntoDB, getAllIssuesFromDB, getSingleIssuesFromDB, updateIssueIntoDB, deleteIssueIntoDB };