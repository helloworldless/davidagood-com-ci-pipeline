import 'source-map-support/register';
import * as AWS from 'aws-sdk';
import {getEnv} from "./util";

AWS.config.update({ region: getEnv('AWS_REGION') });

const cloudFront = new AWS.CloudFront();

const DistributionId = getEnv('CLOUDFRONT_DISTRIBUTION_ID');

export const handler = async (_event, _context) => {
    try {
        const params = {
            DistributionId,
            InvalidationBatch: {
                CallerReference: new Date().toISOString(),
                Paths: {
                    Quantity: 1,
                    Items: [
                        '/*',
                    ]
                }
            }
        }
        console.log(`Started - Create invalidation`)
        const createInvalidationResponse = await cloudFront.createInvalidation(params).promise();
        console.log('createInvalidationResponse', createInvalidationResponse);
        console.log(`Completed - Create invalidation`)
    } catch (e) {
        console.error(e);
        console.error(JSON.stringify(e, null, 2));
        throw e;
    }
};



