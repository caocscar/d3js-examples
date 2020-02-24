const config = {
  region: 'us-east-2',
  accessKeyId: '',
  secretAccessKey: ''
};
const bucket = 'honda-dsrc-de-id';
const s3 = new AWS.S3(config);   
async function readS3Object(filename) { // csvParse assumes header
  return d3.csvParse(await s3.getObject({Bucket: bucket, Key: filename})
    .promise().then(r => new TextDecoder("utf-8").decode(r.Body))
  )
}