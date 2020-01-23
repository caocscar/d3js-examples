const config = {
  region: 'us-east-2',
  accessKeyId: 'ACAKIA5WKJB44U5L53UEPM',
  secretAccessKey: 'ldcHnTTQ6EP5ylxt41Iw2blCfgHps4NM1eBWXlo4Sa/'
};
const bucket = 'honda-dsrc-de-id';
const s3 = new AWS.S3(config);   
async function readS3Object(filename) { // csvParse assumes header
  return d3.csvParse(await s3.getObject({Bucket: bucket, Key: filename})
    .promise().then(r => new TextDecoder("utf-8").decode(r.Body))
  )
}