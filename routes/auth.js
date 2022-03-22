var express = require('express');
var authCon = require('../controllers/user');
var router = express.Router();
var multer = require("multer");
var storage = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, './public');
    },
    filename: (req, file, cb) => {
        //console.log(file);
        cb(null, Date.now() + '--' + file.originalname);
    }
});
var upload = multer({storage: storage}); 


router.post('/register', upload.single("image"), authCon.register);
router.post('/login', authCon.login);
router.post('/list', authCon.list);
router.post('/write', authCon.write);
router.post('/view', authCon.view);
router.post('/update', authCon.update);
router.get('/logout', authCon.logout);

module.exports = router;