var express = require('express');
var authCon = require('../controllers/user');
var router = express.Router();

router.post('/register', authCon.register);
router.post('/login', authCon.login);
router.post('/list', authCon.list);
router.post('/write', authCon.write);
router.post('/view', authCon.view);
router.post('/update', authCon.update);
router.get('/logout', authCon.logout);

module.exports = router;