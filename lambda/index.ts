import { SQSEvent, SQSHandler, SQSRecord } from 'aws-lambda';
// import { SNS, SES, SQS } from 'aws-sdk';
const { SNS, SES, SQS } = require('aws-sdk');

import { ProcessMainMessage } from './process-message/main-process';

const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL!;
const DLQ_URL = process.env.DLQ_URL!;

exports.handler = async (event: SQSEvent) => {
    try {
        if (!process.env.SQS_QUEUE_URL || !process.env.DLQ_URL) {
            console.error('Missing required environment variables. Please check Lambda configuration.');
            throw new Error('Lambda configuration error: Missing environment variables');
          }
        for (const record of event.Records) {
            await ProcessMainMessage(record);
        }

    } catch (error) {
        console.error('Error processing message:', error);

    }
}