import express, {Express} from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';
import EmailCleanerController from "./controllers/EmailCleanerController";

const app: Express = express();
const PORT = process.env.PORT || 3000;
const storage = multer.memoryStorage();
const upload = multer({storage: storage});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.listen(PORT, () => {
    console.log(`[Server]: I am running at https://localhost:${PORT}`);
});

app.get('/introlines/', (req, res) => {
    res.send("service running");
});

app.get('/introlines/verify-email', EmailCleanerController.verifyEmail);

app.post('/introlines/process-csv', upload.single('csvData'), EmailCleanerController.processCSV);
