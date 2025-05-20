var express = require('express');
var router = express.Router();
const multer = require('multer');
const upload = multer(); // For parsing multipart/form-data

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('admin/admin',{admin:true});
});
// router.get('/sts-update', function(req, res) {
//   res.send('GET /sts-update route');
// });

router.post('/sts-update', upload.none(), function(req, res) {
  console.log(req.body);
  res.status(200).send('Success');
});

module.exports = router;
