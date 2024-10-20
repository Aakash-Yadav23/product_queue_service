import { SQSEvent, SQSHandler, SQSRecord } from 'aws-lambda';
// import { SQS } from 'aws-sdk';
import { ProcessDeadLetterMessage } from './process-message/dlq-process';
const { SQS } = require('aws-sdk');

const sqs = new SQS();

const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL!;
const DLQ_URL = process.env.DLQ_URL!;

exports.handler = async (event: SQSEvent) => {
    try {
        if (!process.env.SQS_QUEUE_URL || !process.env.DLQ_URL || !process.env.ADMIN_EMAIL) {
            console.error('Missing required environment variables. Please check Lambda configuration.');
            throw new Error('Lambda configuration error: Missing environment variables');
        }
        for (const record of event.Records) {
            await ProcessDeadLetterMessage(record)
        }

    } catch (error) {
        console.log("Error Dead Letter", error)
    }
}