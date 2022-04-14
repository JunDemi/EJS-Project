var express = require("express");
var db = require("../connection");
var authCon = require("../controllers/user");
var router = express.Router();
//메인화면
router.get("/", authCon.isLogin, (req, res) => {
  res.render("index", {
    user: req.user,
  });
});
//로그인화면
router.get("/login", (req, res) => {
  res.render("login");
});
//회원가입 화면
router.get("/register", (req, res) => {
  res.render("register");
});
//게시판 화면
router.get("/list", authCon.isLogin, (req, res) => {
  if (req.user) {
    let sql1 = "SELECT * FROM list ORDER BY no DESC";
    db.query(sql1, (err, result1) => {
      //게시판 목록 출력 SQL값
      if (err) throw err;
      //페이징
      var resultsPerPage = 10; //한 페이지에 보일 글 개수
      var num_result = result1.length;
      var num_pages = Math.ceil(num_result / resultsPerPage);
      let page = req.query.page ? Number(req.query.page) : 1;
      if (page > num_pages) {
        res.redirect("/list?page=" + encodeURIComponent(num_pages));
      } else if (page < 1) {
        res.redirect("/list?page=" + encodeURIComponent("1"));
      }
      //Limit 시작번호
      var start_limit = (page - 1) * resultsPerPage;
      let sql2 =
        "SELECT no, title, name, DATE_FORMAT(date,'%m월 %d일') AS date, jump, (SELECT count(*) FROM comment WHERE comment.list_no = list.no) AS c_total FROM list JOIN user ON list.user_id = user.id ORDER BY no DESC LIMIT ?, ?";
      db.query(sql2, [start_limit, resultsPerPage], (err, result2) => {
        if (err) throw err;
        let iterator = page - 5 < 1 ? 1 : page - 5;
        let end_link =
          iterator + 9 <= num_pages ? iterator + 9 : page + (num_pages - page);
        if (end_link < page + 4) {
          iterator -= page + 4 - num_pages;
        }
        res.render("list", {
          user: req.user,
          total: result1.length,
          data: result2,
          iterator,
          end_link,
          num_pages,
          page,
        });
      });
    });
  } else {
    res.redirect("/login");
  }
});
//검색결과를 출력한 게시판
router.get("/auth/list", authCon.isLogin, (req, res) => {
  if (req.user) {
    var search = req.query.search;
    let = "select * from list";
    let sql1 = `SELECT no, title, name, DATE_FORMAT(date,'%m월 %d일') AS date, jump, (SELECT count(*) FROM comment WHERE comment.list_no = list.no) AS c_total FROM list JOIN user ON list.user_id = user.id WHERE(title LIKE "%${search}%" OR name LIKE "%${search}%" OR date LIKE "%${search}%") ORDER BY no DESC`;
    db.query(sql1, (err, result1) => {
      res.render("search_list", {
        user: req.user,
        total: result1.length,
        data: result1,
        search: search
      });
    });
  } else {
    res.redirect("/login");
  }
});
//글쓰기 화면
router.get("/write", authCon.isLogin, (req, res) => {
  if (req.user) {
    res.render("write", {
      user: req.user,
    });
  } else {
    res.redirect("/login");
  }
});
//글조회 화면
router.get("/view", authCon.isLogin, (req, res) => {
  if (req.user) {
    var list_no = req.query.no;
    let jump = "UPDATE list SET jump = jump + 1 WHERE no = ?"; //조회수 증가
    db.query(jump, [list_no], (err1, result1) => {
      if (err1) throw err1;
      let sql =
        "SELECT user_id, user.name, img, DATE_FORMAT(list.date,'%Y년 %m월 %d일 %I시 %i분') AS date, title, text, file FROM list JOIN user ON list.user_id = user.id WHERE no = ?";
      db.query(sql, [list_no], (err2, result2) => {
        if (err2) throw err2;
        let sql2 =
          "SELECT c_no, list_no, comment.user_id, name, img, DATE_FORMAT(comment.date,'%m월 %d일 %H시 %i분') AS date, comment.text FROM comment JOIN user ON comment.user_id = user.id JOIN jungwook.list ON comment.list_no = list.no WHERE list_no = ? ORDER BY c_no DESC";
        db.query(sql2, [list_no], (err3, result3) => {
          if (err3) throw err3;
          res.render("view", {
            user: req.user,
            get: req.query,
            view: result2[0],
            comment: result3,
          });
        });
      });
    });
  } else {
    res.redirect("/login");
  }
});
//글수정 화면
router.get("/update", authCon.isLogin, (req, res) => {
  if (req.user) {
    let sql = "SELECT user_id, title, text, file FROM list WHERE no = ?";
    db.query(sql, [req.query.no], (err, result) => {
      if (err) throw err;
      res.render("update", {
        user: req.user,
        get: req.query,
        view: result[0],
      });
    });
  } else {
    res.redirect("/login");
  }
});
//프로필 화면
router.get("/profile", authCon.isLogin, (req, res) => {
  if (req.user) {
    var id = req.user.id;
    let sql = "SELECT COUNT(*) AS list_total, (SELECT COUNT(*) FROM comment WHERE user_id = ?) AS comment_total FROM list WHERE user_id = ?";
    db.query(sql, [id, id], (error, result) =>{
      if(error) throw error;
      res.render("profile", {
        user: req.user,
        data: result
      });
    }); 
  } else {
    res.redirect("/login");
  }
});
//프로필-정보수정 화면
router.get("/user_update", authCon.isLogin, (req, res) => {
  if (req.user) {
    var id = req.user.id;
    let sql = "SELECT name, pw, img FROM user WHERE id = ?";
    db.query(sql, [id], (error, result) =>{
      if(error) throw error;
      res.render("user_update", {
        user: req.user,
        data: result[0]
      });
    }); 
  } else {
    res.redirect("/login");
  }
});
//프로필-정보수정-비밀번호 확인 화면
router.get("/user_update_check", authCon.isLogin, (req, res) => {
  if (req.user) {
    res.render("user_update_check", {
      user: req.user,
      page_type: req.query.u
    });
  } else {
    res.redirect("/login");
  }
});
module.exports = router;
