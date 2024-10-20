import { SQSRecord } from "aws-lambda";
import { IMailBody, INotificationBody, IWatchListBody } from "../interface/interfaces";
// import * as nodemailer from "nodemailer";
const nodemailer =require('nodemailer')
// import axios from "axios";
const axios =require('axios')


export const ProcessMainMessage = async (record: SQSRecord) => {

    const messageBody = JSON.parse(record.body);
    const eventType = messageBody.eventType;

    switch (eventType) {
        case 'send_email':
            await processSendMail(messageBody);
            break;
        case "send_notification":
            await processSendNotification(messageBody);
            break;
        case "add_to_watchlist":
            await processAddToWatchlist(messageBody);
            break;
        default:
            console.log(`Unknown event type: ${eventType}`);

    }


};


const processSendMail = async (bodyData: IMailBody) => {
    const { subject, mail, body } = bodyData;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: smtpUser,
            pass: smtpPass,
        }
    });


    const mailOptions = {
        from: `"ProductHub" <${smtpUser}>`,  
        to: mail,
        subject: subject,
        text: body
    };

    console.log("MAIL_OPTIONS", mailOptions)

    await transporter.sendMail(mailOptions);


}
const processAddToWatchlist = async (body: IWatchListBody) => {

    const WATCHLIST_API = process.env.WATCHLIST_API;
    if (!WATCHLIST_API) {
        throw new Error('WATCHLIST_API environment variable is not set');
    }
    try {
        const res = await axios.post(WATCHLIST_API, body);
        return res.data;
    } catch (error: any) {
        console.error('Error calling Watchlist API:', error);
        throw error;
    }
}

const processSendNotification = async (body: INotificationBody) => {
    const NOTIFICATION_API = process.env.NOTIFICATION_API;
    if (!NOTIFICATION_API) {
        throw new Error('NOTIFICATION_API environment variable is not set');
    }
    try {
        const res = await axios.post(NOTIFICATION_API, body);
        return res.data;

    } catch (error: any) {
        console.error('Error calling Notification API:', error);
        throw error;
    }
}