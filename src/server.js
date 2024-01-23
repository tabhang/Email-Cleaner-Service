"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const multer_1 = __importDefault(require("multer"));
const EmailCleanerController_1 = __importDefault(require("./controllers/EmailCleanerController"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage: storage });
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.listen(PORT, () => {
    console.log(`[Server]: I am running at https://localhost:${PORT}`);
});
app.get('/introlines/', (req, res) => {
    res.send("service running");
});
app.get('/introlines/verify-email', EmailCleanerController_1.default.verifyEmail);
app.post('/introlines/process-csv', upload.single('csvData'), EmailCleanerController_1.default.processCSV);
