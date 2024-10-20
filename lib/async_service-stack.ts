import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { Construct } from 'constructs';

export class AsyncServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dlq = new sqs.Queue(this, 'DeadLetterQueue', {
      queueName: 'event-processing-dlq',
      retentionPeriod: cdk.Duration.days(14), // Retain failed messages for 14 days
    });

    const eventQue = new sqs.Queue(this, "EventProccessingQueue", {
      queueName: "event-processing-que",
      deadLetterQueue: {
        queue:dlq,
        maxReceiveCount: 2
      }
    });


    // The code that defines your stack goes here
    const eventProcessorLambda = new lambda.Function(this, "MessageProccessFunction", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "index.handler",
      environment: {
        SQS_QUEUE_URL: eventQue.queueUrl,
        DLQ_URL: dlq.queueUrl,

      }
    });

    const dlqProcessorLambda = new lambda.Function(this, "DLQProcessorLambda", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "dead-letter.handler",
      code: lambda.Code.fromAsset("lambda"),
      environment: {
        SQS_QUEUE_URL: eventQue.queueUrl,
        DLQ_URL: dlq.queueUrl,

      }
    });

    eventQue.grantConsumeMessages(eventProcessorLambda);
    dlq.grantSendMessages(eventProcessorLambda);


    eventProcessorLambda.addEventSource(new lambdaEventSources.SqsEventSource(eventQue, {
      batchSize: 10,
      maxBatchingWindow: cdk.Duration.seconds(30)
    }));



    dlq.grantConsumeMessages(dlqProcessorLambda);
    eventQue.grantSendMessages(dlqProcessorLambda);


    dlqProcessorLambda.addEventSource(new lambdaEventSources.SqsEventSource(dlq, {
      batchSize: 10,
      maxBatchingWindow: cdk.Duration.seconds(30)
    }));

    const snsSesPolicyStatement = new iam.PolicyStatement({
      actions: ['sns:Publish', 'ses:SendEmail'],
      resources: ['*'],
    });


    eventProcessorLambda.addToRolePolicy(snsSesPolicyStatement);
    dlqProcessorLambda.addToRolePolicy(snsSesPolicyStatement);


    // example resource
    // const queue = new sqs.Queue(this, 'AsyncServiceQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
