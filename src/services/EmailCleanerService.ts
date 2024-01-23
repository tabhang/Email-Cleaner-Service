import { getMxRecordsByLookup, sendEmailCommands, recordsToCsv } from '../utils/emailUtils';
import { minBy } from 'lodash';
import {parse} from "csv-parse";


const statusMap: { [key: string]: string } = {
    "250": "safe",
    "111": "catch_all",
    "552": "inbox full",
    "550": "invalid",
    "000": "invalid",
};

class EmailVerificationService {
    static async verifyEmail(emailId: string) {
        return getMxRecordsByLookup(emailId)
            .then((mxRecords) => {
                if (mxRecords.length > 0) {
                    const minPriorityExchange = minBy(mxRecords, 'priority');
                    // @ts-ignore
                    return sendEmailCommands(minPriorityExchange.exchange, emailId)
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
                } else {
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
    }

    static async processCSV(csvFile: Buffer): Promise<any> {
        return new Promise((resolve, reject) => {

            const csvData: string = csvFile.toString('utf-8');
            let error = 0;
            const records: any[] = [];
            let recordLength = 0;

            parse(
                csvData,
                {
                    columns: true,
                    skip_empty_lines: true,
                    from_line: 1,
                },
                async function (err, data) {
                    if (err) {
                        return reject('Error parsing CSV');
                    }

                    records.push(...data);
                    recordLength = records.length;

                    const processedRecords = await Promise.all(records.map(async (row) => {
                        const emailId = row.email;

                        try {
                            const mxRecords = await getMxRecordsByLookup(emailId);

                            if (mxRecords.length > 0) {
                                const minPriorityExchange = minBy(mxRecords, 'priority');
                                // @ts-ignore
                                const statusCode = await sendEmailCommands(minPriorityExchange.exchange, emailId);

                                let status = statusMap[statusCode];
                                if (status === undefined) {
                                    status = statusMap["000"];
                                }
                                row.output = status;
                            } else {
                                // domain name does not have mx server
                                row.output = statusMap["550"];
                            }
                        } catch (error) {
                            // Handle errors for getMxRecordsByLookup and sendEmailCommands
                            console.error('Error:', error);
                            // @ts-ignore
                            row.output = statusMap[error.message];
                        }

                        if (
                            (row.status_new === 'safe' && row.output === 'invalid') ||
                            (row.status_new === 'invalid' && row.output === 'safe') ||
                            (row.status_new === 'invalid' && row.output === 'catch_all') ||
                            (row.status_new === 'catch_all' && row.output === 'invalid')
                        ) {
                            error += 1;
                        }

                        return row;
                    }));

                    const processedCsv = recordsToCsv(processedRecords);

                    const result = {
                        noOfRecords: recordLength,
                        error: error,
                        accuracy: 100 - (error / recordLength) * 100,
                        processedCsv: processedCsv,
                    };

                    resolve(result);
                }
            );
        });
    }
}

export default EmailVerificationService;