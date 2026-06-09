
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
  

// src/app.ts
import express from "express";
import cors from "cors";

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/config/index.ts
import dotenv from "dotenv";
dotenv.config();
console.log(
  "CONNECTING_STRING exists:",
  !!process.env.CONNECTING_STRING
);
var config = {
  port: process.env.PORT,
  connectingString: process.env.CONNECTING_STRING,
  accessTokenSecret: process.env.AccessTokeSecret_JWT
};

// src/db/index.ts
import { Pool } from "pg";
console.log(
  "CONNECTING_STRING exists:",
  !!process.env.CONNECTING_STRING
);
var pool = new Pool({
  connectionString: config.connectingString
});
var initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(30) NOT NULL,
      email VARCHAR(30) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'contributor' CHECK (role IN ('contributor', 'maintainer')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS issues (
      id SERIAL PRIMARY KEY,
      title VARCHAR(150) NOT NULL,
      description TEXT NOT NULL,
      type VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'feature_request')),
      status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
      reporter_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log("Database connected successfully");
};

// src/modules/auth/auth.service.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
var SignUpUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(`
        INSERT INTO users (name,email,password,role) VALUES($1,$2,$3,COALESCE($4,'contributor')) RETURNING *`, [name, email, hashedPassword, role]);
  return result;
};
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const result = await pool.query(`
        SELECT * FROM users WHERE email=$1 `, [email]);
  if (result.rows.length === 0) {
    throw new Error("Invalid email or password");
  }
  const userData = result.rows[0];
  const isMatched = await bcrypt.compare(password, userData.password);
  if (!isMatched) {
    throw new Error("Invalid email or password");
  }
  const jwtPayload = {
    id: userData.id,
    name: userData.name,
    role: userData.role,
    email: userData.email
  };
  const accessToken = jwt.sign(jwtPayload, config.accessTokenSecret, { expiresIn: "1d" });
  delete userData.password;
  return { userData, accessToken };
};
var userService = { SignUpUserIntoDB, loginUserIntoDB };

// src/modules/auth/auth.controller.ts
var SignUpUser = async (req, res) => {
  try {
    const result = await userService.SignUpUserIntoDB(req.body);
    const user = result.rows[0];
    delete user.password;
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user
    });
  } catch (error) {
    if (error.code === "23505") {
      throw new Error("Email already exists");
    }
    throw error;
  }
};
var loginUser = async (req, res) => {
  try {
    const result = await userService.loginUserIntoDB(req.body);
    res.status(200).json({
      success: true,
      message: "User login successfully",
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
var userController = { SignUpUser, loginUser };

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", userController.SignUpUser);
router.post("/login", userController.loginUser);
var userRouter = router;

// src/modules/issue/issu.route.ts
import Router2 from "express";

// src/modules/issue/issu.service.ts
var createIssuIntoDB = async (payload) => {
  const { title, description, type, reporter_id } = payload;
  const result = await pool.query(`
        INSERT INTO issues(title,description,type,reporter_id)
        VALUES($1,$2,$3,$4) RETURNING *`, [title, description, type, reporter_id]);
  return result;
};
var getAllIssuesFromDB = async ({
  sort = "newest",
  type,
  status
}) => {
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
  const conditions = [];
  const values = [];
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
  query += ` ORDER BY created_at ${sort === "oldest" ? "ASC" : "DESC"}`;
  const issueResult = await pool.query(query, values);
  if (issueResult.rows.length === 0) {
    return [];
  }
  const reporterIds = [
    ...new Set(issueResult.rows.map((issue) => issue.reporter_id))
  ];
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
    reporterResult.rows.map((user) => [user.id, user])
  );
  const data = issueResult.rows.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
    reporter: reporterMap.get(issue.reporter_id)
  }));
  return data;
};
var getSingleIssuesFromDB = async (id) => {
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
    reporter: reporterResult.rows[0]
  };
};
var updateIssueIntoDB = async (id, payload) => {
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
};
var deleteIssueIntoDB = async (id) => {
  const result = await pool.query(`
       DELETE FROM issues
       WHERE id=$1
       RETURNING *
`, [id]);
  return result;
};
var issuService = { createIssuIntoDB, getAllIssuesFromDB, getSingleIssuesFromDB, updateIssueIntoDB, deleteIssueIntoDB };

// src/utility/sendResponse.ts
var sendResponse = (res, data) => {
  return res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data?.data,
    error: data.error
    // accessToken: result,
  });
};
var sendResponse_default = sendResponse;

// src/modules/issue/issu.controller.ts
var createIssu = async (req, res) => {
  const payload = { ...req.body, reporter_id: req.user?.id };
  const result = await issuService.createIssuIntoDB(payload);
  sendResponse_default(res, {
    statusCode: 201,
    success: true,
    message: "Issue created successfully",
    data: result.rows[0]
  });
};
var getAllIssues = async (req, res) => {
  const { sort = "newest", type, status } = req.query;
  const result = await issuService.getAllIssuesFromDB({
    sort,
    type,
    status
  });
  if (result.length === 0) {
    return sendResponse_default(res, {
      statusCode: 404,
      success: false,
      message: "Issue not found"
    });
  }
  sendResponse_default(res, {
    statusCode: 200,
    success: true,
    message: "Issues retrieved successfully",
    data: result
  });
};
var getSingleIssues = async (req, res) => {
  const { id } = req.params;
  const result = await issuService.getSingleIssuesFromDB(Number(id));
  if (!result) {
    return sendResponse_default(res, {
      statusCode: 404,
      success: false,
      message: "Issue not found"
    });
  }
  sendResponse_default(res, {
    statusCode: 200,
    success: true,
    message: "Issue retrieved successfully",
    data: result
  });
};
var updateIssue = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const role = req.user?.role;
  const issueResult = await pool.query(
    `
        SELECT *
        FROM issues
        WHERE id = $1
        `,
    [Number(id)]
  );
  if (issueResult.rows.length === 0) {
    return sendResponse_default(res, {
      statusCode: 404,
      success: false,
      message: "Issue not found"
    });
  }
  const issue = issueResult.rows[0];
  if (role === "contributor" && issue.reporter_id !== userId) {
    return sendResponse_default(res, {
      statusCode: 403,
      success: false,
      message: "Forbidden Access!"
    });
  }
  if (role === "contributor" && issue.status !== "open") {
    return sendResponse_default(res, {
      statusCode: 409,
      success: false,
      message: "Issue cannot be updated because it is not open"
    });
  }
  const result = await issuService.updateIssueIntoDB(
    Number(id),
    req.body
  );
  if (result.rows.length === 0) {
    return sendResponse_default(res, {
      statusCode: 404,
      success: false,
      message: "Issue not found"
    });
  }
  return sendResponse_default(res, {
    statusCode: 200,
    success: true,
    message: "Issue updated successfully",
    data: result.rows[0]
  });
};
var deleteIssue = async (req, res) => {
  const { id } = req.params;
  const result = await issuService.deleteIssueIntoDB(Number(id));
  if (result.rows.length == 0) {
    return sendResponse_default(res, {
      statusCode: 404,
      success: false,
      message: "Issue not found"
    });
  }
  sendResponse_default(res, {
    statusCode: 200,
    success: true,
    message: "Issue Deleted successfully"
  });
};
var issuController = { createIssu, getAllIssues, getSingleIssues, updateIssue, deleteIssue };

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return sendResponse_default(res, {
          statusCode: 401,
          success: false,
          message: "Unauthorized Access"
        });
      }
      const decoded = jwt2.verify(
        token,
        config.accessTokenSecret
      );
      const userData = await pool.query(
        `SELECT * FROM users WHERE email=$1`,
        [decoded.email]
      );
      if (userData.rows.length === 0) {
        return sendResponse_default(res, {
          statusCode: 404,
          success: false,
          message: "User not found!"
        });
      }
      const user = userData.rows[0];
      if (roles.length && !roles.includes(user.role)) {
        return sendResponse_default(res, {
          statusCode: 403,
          success: false,
          message: "Forbidden Access!"
        });
      }
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };
      next();
    } catch (error) {
      return sendResponse_default(res, {
        statusCode: 401,
        success: false,
        message: "Invalid or expired token"
      });
    }
  };
};
var auth_default = auth;

// src/modules/issue/issu.route.ts
var router2 = Router2();
var USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer"
};
router2.post("/", auth_default(USER_ROLE.contributor, USER_ROLE.maintainer), issuController.createIssu);
router2.get("/", issuController.getAllIssues);
router2.get("/:id", issuController.getSingleIssues);
router2.patch("/:id", auth_default(USER_ROLE.contributor, USER_ROLE.maintainer), issuController.updateIssue);
router2.delete("/:id", auth_default(USER_ROLE.maintainer), issuController.deleteIssue);
var issuRouter = router2;

// src/app.ts
var app = express();
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [
      "http://localhost:5000",
      "https://dev-pulse-three-blond.vercel.app"
    ],
    credentials: true
  })
);
app.use(express.json());
app.use("/api/auth", userRouter);
app.use("/api/issues", issuRouter);
try {
  app.get("/", (req, res) => {
    res.status(200).json({
      message: "Express and SQL Server Running ",
      author: "MD Parvez Hasan"
    });
  });
} catch (error) {
  console.log(error);
}
var app_default = app;

// src/server.ts
var main = async () => {
  initDB();
  app_default.listen(config.port, () => {
    console.log(`Server is running on http://localhost:${config.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map