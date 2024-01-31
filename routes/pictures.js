var express = require('express');
var router = express.Router();
const fs = require('fs');
var path = require('path');
const AWS = require("aws-sdk");
const s3 = new AWS.S3()
const { requiresAuth } = require('express-openid-connect');

// Or
/* GET pictures listing. */
router.get('/', requiresAuth(), async function(req, res, next) {
  console.log(req.oidc.user);
  var params = {
    Bucket: process.env.CYCLIC_BUCKET_NAME,
    Delimiter: '/',
    Prefix: req.oidc.user.nickname + '/'
  };
  var allObjects = await s3.listObjects(params).promise();
  var keys = allObjects?.Contents.map( x=> x.Key);
  const pictures = await Promise.all(keys.map(async (key) => {
    let my_file = await s3.getObject({
      Bucket: process.env.CYCLIC_BUCKET_NAME,
      Key: key,
    }).promise();
    return {
        src: Buffer.from(my_file.Body).toString('base64'),
        name: key.split("/").pop()
    }
  }));
  res.render('pictures', { pictures: pictures});
});

router.get('/:pictureName', requiresAuth(), async function(req, res,
  next) {
  let my_file = await s3.getObject({
    Bucket: process.env.CYCLIC_BUCKET_NAME,
    Key: "public/" + req.params.pictureName,
   }).promise();
  const picture = {
     src: Buffer.from(my_file.Body).toString('base64'),
     name: req.params.pictureName
   }
  res.render('pictureDetails', { picture: picture});
  });

router.post('/', requiresAuth(), async function(req, res, next) {
  const file = req.files.file;
  console.log(req.files);
  await s3.putObject({
    Body: file.data,
    Bucket: process.env.CYCLIC_BUCKET_NAME,
    Key: req.oidc.user.nickname + "/" + file.name,
  }).promise()
  res.end();
});

module.exports = router;