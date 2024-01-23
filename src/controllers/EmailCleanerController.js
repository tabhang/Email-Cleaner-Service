"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const EmailCleanerService_1 = __importDefault(require("../services/EmailCleanerService"));
class EmailCleanerController {
    static verifyEmail(req, res) {
        const emailId = req.query.emailId;
        EmailCleanerService_1.default.verifyEmail(emailId)
            .then((result) => {
            res.json(result);
        })
            .catch((error) => {
            res.status(500).json({ error: 'Internal Server Error' });
        });
    }
    static processCSV(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!req.file) {
                    return res.status(400).send('No file uploaded.');
                }
                const csvFile = req.file.buffer;
                const result = yield EmailCleanerService_1.default.processCSV(csvFile);
                const resultTemp = Object.assign({}, result);
                delete resultTemp.processedCsv;
                console.log(resultTemp);
                res.attachment('processed_data.csv').send(result.processedCsv);
                // res.json(result);
            }
            catch (err) {
                console.error('Error processing CSV:', err);
                res.status(500).send('Error processing CSV');
            }
        });
    }
}
exports.default = EmailCleanerController;
