import { SQSRecord } from "aws-lambda";
// import {SQS } from 'aws-sdk';
const { SNS, SES, SQS } = require('aws-sdk');


const sqs = new SQS();
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL!;
const DLQ_URL = process.env.DLQ_URL!;

export const ProcessDeadLetterMessage = async (record: SQSRecord) => {

    const messageBody = JSON.parse(record.body);
    const retryCount = messageBody.retryCount || 0;

    if (retryCount < 5) {
        messageBody.retryCount = retryCount + 1;
        await sqs.sendMessage({
            QueueUrl: SQS_QUEUE_URL,
            MessageBody: JSON.stringify(messageBody)
        }).promise();
        console.log(`Message retried (${messageBody.retryCount}/5): ${record.messageId}`);

    } else {
        await handlePersistentFailure(messageBody);

    }


    await sqs.deleteMessage({
        QueueUrl: SQS_QUEUE_URL,
        ReceiptHandle: record.receiptHandle
    }).promise();

};

async function handlePersistentFailure(messageBody: any) {
    console.error('Message failed after 5 retries:', JSON.stringify(messageBody));
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const emailNotification = {
        eventType: 'send_email',
        subject: 'Persistent Message Failure Alert',
        mail: ADMIN_EMAIL,
        body: `A message has failed processing after 5 attempts. Details:\n\n${JSON.stringify(messageBody, null, 2)}`
    };

    // Send the email notification message to the main queue
    await sqs.sendMessage({
        QueueUrl: SQS_QUEUE_URL,
        MessageBody: JSON.stringify(emailNotification)
    }).promise();

    console.log('Sent email notification about persistent failure');

}