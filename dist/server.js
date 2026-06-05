import express, {} from "express";
const app = express();
const port = 5000; // The port your express server will be running on.
// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));
// Middleware to parse JSON bodies
app.use(express.json());
// Basic route
app.get('/', (req, res) => {
    res.send('Hello, TypeScript + Express!');
});
// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
//# sourceMappingURL=server.js.map