"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordsToCsv = exports.sendEmailCommands = exports.getMxRecordsByLookup = void 0;
const dns_1 = __importDefault(require("dns"));
const uuid_1 = require("uuid");
const net_1 = __importDefault(require("net"));
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function getMxRecordsByLookup(emailId) {
    const domain = extractDomainFromEmail(emailId);
    if (!domain) {
        return Promise.reject(new Error('550'));
    }
    return new Promise((resolve, reject) => {
        dns_1.default.resolveMx(domain, (err, addresses) => {
            if (err) {
                console.error(`Error looking up MX records for ${domain}: ${err.message}`);
                reject(new Error('000'));
            }
            else {
                const mxRecords = addresses.map((mxRecord) => ({
                    priority: mxRecord.priority,
                    exchange: mxRecord.exchange,
                }));
                console.log('MX Records:', mxRecords);
                resolve(mxRecords);
            }
        });
    });
}
exports.getMxRecordsByLookup = getMxRecordsByLookup;
function sendEmailCommands(host, emailId) {
    return new Promise((resolve, reject) => {
        const id = (0, uuid_1.v4)();
        const socket = net_1.default.createConnection({ host: host, port: 25 }, () => {
            console.log('Connected to SMTP server');
            let commandCounter = 1;
            function writeToSocket(command) {
                socket.write(command, 'utf-8', () => {
                    console.log(`Sent command for id ${id} is : ${command}`);
                });
                commandCounter += 1;
            }
            let rcptStatus;
            let start = false;
            socket.on('data', (data) => {
                console.log(`Received response for id ${id} is : ${data.toString()}`);
                let responseString = data.toString().substring(0, 4);
                if (responseString.includes('220') && responseString.trim().length == 4) {
                    start = false;
                }
                else if (responseString.trim().length == 3) {
                    start = true;
                }
                let response = parseInt(data.toString().substring(0, 3));
                if (start) {
                    if (commandCounter === 1 && response === 220) {
                        writeToSocket(`HELO ${host}\r\n`);
                    }
                    else if (commandCounter === 2 && response === 250) {
                        writeToSocket('MAIL FROM: <tabhang05@gmail.com> \r\n');
                    }
                    else if (commandCounter === 3 && response === 250) {
                        writeToSocket(`RCPT TO: <${emailId}> \r\n`);
                        rcptStatus = response;
                    }
                    else if (commandCounter === 4 && response === 250) {
                        const randomEmail = generateRandomEmail(extractDomainFromEmail(emailId));
                        writeToSocket(`RCPT TO: <${randomEmail}> \r\n`);
                    }
                    else {
                        if (commandCounter === 5 && response != 250) {
                            response = rcptStatus;
                        }
                        else if (commandCounter === 5 && response == 250) {
                            response = 111;
                        }
                        socket.end();
                        console.log(`final response for id ${id} is : ${response} `);
                        resolve(response);
                    }
                }
            });
        });
        socket.on('error', (error) => {
            console.error(`Socket error: ${error.message}`);
            reject(new Error('000'));
        });
        socket.on('end', () => {
            console.log('Connection closed');
        });
    });
}
exports.sendEmailCommands = sendEmailCommands;
function recordsToCsv(records) {
    if (records.length === 0) {
        return '';
    }
    const headers = Object.keys(records[0]);
    const rows = records.map((record) => headers.map((header) => record[header]));
    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}
exports.recordsToCsv = recordsToCsv;
function generateRandomEmail(domain) {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';
    for (let i = 0; i < 8; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomString += characters.charAt(randomIndex);
    }
    return `${randomString}@${domain}`;
}
function extractDomainFromEmail(email) {
    if (!emailRegex.test(email)) {
        return null;
    }
    const [, domain] = email.split('@');
    return domain;
}
