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

router.post('/register', upload.single("image"), authCon.register); //회원가입
router.post('/login', authCon.login); //로그인
router.get('/logout', authCon.logout); //로그아웃
router.post('/list', authCon.list); //게시판
router.post('/write', upload.single("files"), authCon.write); //글쓰기
router.post('/view', authCon.view); //글 조회-댓글
router.post('/update', upload.single("view_update_files"), authCon.update); //글 수정
router.post('/user_update', upload.single("update_image"), authCon.user_update); //회원 정보 수정
router.post('/user_update_check', authCon.user_update_check); //회원 정보 수정 이전 비밀번호 확인

module.exports = router;