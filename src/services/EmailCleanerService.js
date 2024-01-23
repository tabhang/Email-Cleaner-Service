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
Object.defineProperty(exports, "__esModule", { value: true });
const emailUtils_1 = require("../utils/emailUtils");
const lodash_1 = require("lodash");
const csv_parse_1 = require("csv-parse");
const statusMap = {
    "250": "safe",
    "111": "catch_all",
    "552": "inbox full",
    "550": "invalid",
    "000": "invalid",
};
class EmailVerificationService {
    static verifyEmail(emailId) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, emailUtils_1.getMxRecordsByLookup)(emailId)
                .then((mxRecords) => {
                if (mxRecords.length > 0) {
                    const minPriorityExchange = (0, lodash_1.minBy)(mxRecords, 'priority');
                    // @ts-ignore
                    return (0, emailUtils_1.sendEmailCommands)(minPriorityExchange.exchange, emailId)
                        .then((statusCode) => {
                        return {
                            email: emailId,
                            statusCode: statusCode.toString(),
                            status: statusCode in statusMap ? statusMap[statusCode] : statusMap["000"],
                        };
                    })
                        .catch((error) => {
                        console.error('Error:', error);
                        return {
                            email: emailId,
                            statusCode: error.message,
                            status: statusMap[error.message],
                        };
                    });
                }
                else {
                    // domain name does not have mx server
                    return {
                        email: emailId,
                        statusCode: "550",
                        status: statusMap["550"],
                    };
                }
            })
                .catch((error) => {
                console.error('Error:', error);
                return {
                    email: emailId,
                    statusCode: error.message,
                    status: statusMap[error.message],
                };
            });
        });
    }
    static processCSV(csvFile) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const csvData = csvFile.toString('utf-8');
                let error = 0;
                const records = [];
                let recordLength = 0;
                (0, csv_parse_1.parse)(csvData, {
                    columns: true,
                    skip_empty_lines: true,
                    from_line: 1,
                }, function (err, data) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (err) {
                            return reject('Error parsing CSV');
                        }
                        records.push(...data);
                        recordLength = records.length;
                        const processedRecords = yield Promise.all(records.map((row) => __awaiter(this, void 0, void 0, function* () {
                            const emailId = row.email;
                            try {
                                const mxRecords = yield (0, emailUtils_1.getMxRecordsByLookup)(emailId);
                                if (mxRecords.length > 0) {
                                    const minPriorityExchange = (0, lodash_1.minBy)(mxRecords, 'priority');
                                    // @ts-ignore
                                    const statusCode = yield (0, emailUtils_1.sendEmailCommands)(minPriorityExchange.exchange, emailId);
                                    let status = statusMap[statusCode];
                                    if (status === undefined) {
                                        status = statusMap["000"];
                                    }
                                    row.output = status;
                                }
                                else {
                                    // domain name does not have mx server
                                    row.output = statusMap["550"];
                                }
                            }
                            catch (error) {
                                // Handle errors for getMxRecordsByLookup and sendEmailCommands
                                console.error('Error:', error);
                                // @ts-ignore
                                row.output = statusMap[error.message];
                            }
                            if ((row.status_new === 'safe' && row.output === 'invalid') ||
                                (row.status_new === 'invalid' && row.output === 'safe') ||
                                (row.status_new === 'invalid' && row.output === 'catch_all') ||
                                (row.status_new === 'catch_all' && row.output === 'invalid')) {
                                error += 1;
                            }
                            return row;
                        })));
                        const processedCsv = (0, emailUtils_1.recordsToCsv)(processedRecords);
                        const result = {
                            noOfRecords: recordLength,
                            error: error,
                            accuracy: 100 - (error / recordLength) * 100,
                            processedCsv: processedCsv,
                        };
                        resolve(result);
                    });
                });
            });
        });
    }
}
exports.default = EmailVerificationService;
