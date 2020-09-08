import 'source-map-support/register';
import * as AWS from 'aws-sdk';
import {getEnv} from "./util";

AWS.config.update({ region: getEnv('AWS_REGION') });

const s3 = new AWS.S3();

const Bucket = 'lambda-utils-test';

interface ListObjectsKeyFields {
    IsTruncated: boolean;
    NextContinuationToken?: string;
    MaxKeys: number;
    KeyCount: number;
    keys: string[];
}

export const handler = async (_event, _context) => {
    try {
        // const objectKeys: string[] = [];

        async function accumulateObjectKeys(
            ContinuationToken?: string
        ): Promise<ListObjectsKeyFields> {
            const params = Object.assign(
                {},
                {
                    Bucket,
                },
                ContinuationToken && { ContinuationToken }
            );

            const listObjectsResponse = await s3
                .listObjectsV2(params)
                .promise();

            const {
                IsTruncated,
                NextContinuationToken,
                MaxKeys,
                KeyCount,
            } = listObjectsResponse;
            console.log({
                IsTruncated,
                NextContinuationToken,
                MaxKeys,
                KeyCount,
            });

            const keys = listObjectsResponse.Contents.map(({ Key }) => Key);

            return {
                IsTruncated,
                NextContinuationToken,
                MaxKeys,
                KeyCount,
                keys,
            };
        }

        async function deleteObjects(keys: string[]) {
            console.log(`Total count of objects to delete=${keys.length}`);
            console.log(`Started - deleteObjects`);

            const deleteParams = {
                Bucket,
                Delete: {
                    Objects: keys.map((Key) => ({ Key })),
                },
            };

            const deleteObjectsResponse = await s3
                .deleteObjects(deleteParams)
                .promise();

            console.log('deleteObjectsResponse', deleteObjectsResponse);
            console.log(`Completed - deleteObjects`);
        }

        let {
            IsTruncated,
            NextContinuationToken,
            keys,
        } = await accumulateObjectKeys();
        let ContinuationToken = NextContinuationToken;
        await deleteObjects(keys);

        while (IsTruncated) {
            const nextListObjectsKeyFields = await accumulateObjectKeys(
                ContinuationToken
            );

            await deleteObjects(nextListObjectsKeyFields.keys);

            IsTruncated = nextListObjectsKeyFields.IsTruncated;
            ContinuationToken = nextListObjectsKeyFields.NextContinuationToken;
        }
    } catch (e) {
        console.error(e);
        console.error(JSON.stringify(e, null, 2));
        throw e;
    }
};
