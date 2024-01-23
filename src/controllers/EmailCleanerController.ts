import { Request, Response } from 'express';
import EmailVerificationService from "../services/EmailCleanerService";

class EmailCleanerController {
    static verifyEmail(req: Request, res: Response) {
        const emailId = req.query.emailId as string;
        EmailVerificationService.verifyEmail(emailId)
            .then((result) => {
                res.json(result);
            })
            .catch((error) => {
                res.status(500).json({ error: 'Internal Server Error' });
            });
    }

    static async processCSV(req: Request, res: Response) {
        try {
            if (!req.file) {
                return res.status(400).send('No file uploaded.');
            }

            const csvFile: Buffer = req.file.buffer;
            const result = await EmailVerificationService.processCSV(csvFile);

            const resultTemp = { ...result };
            delete resultTemp.processedCsv;
            console.log(resultTemp);

            res.attachment('processed_data.csv').send(result.processedCsv);
            // res.json(result);
        } catch (err) {
            console.error('Error processing CSV:', err);
            res.status(500).send('Error processing CSV');
        }
    }
}

export default EmailCleanerController;