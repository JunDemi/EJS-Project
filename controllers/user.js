var db = require("../connection");
var jwt = require("jsonwebtoken");
var { promisify } = require("util");

//로그인-접속하기
exports.login = async (req, res) => {
  try {
    var { id, pw } = req.body;
    if (!id || !pw) {
      return res.status(400).render("login", {
        message: "아이디 및 비밀번호를 입력하세요",
      });
    }
    db.query(
      "SELECT * FROM user WHERE id = ?",
      [id],
      async (error, results) => {
        if (results == '' || pw !== results[0].pw) {
          res.status(401).render("login", {
            message: "아이디 및 비밀번호가 일치하지 않습니다.",
          });
        } else {
          var t_id = id;
          var token = jwt.sign({ id: t_id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
          });
          var cookieoption = {
            expires: new Date(
              Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
            ),
            httpOnly: true,
          };
          res.cookie("jwt", token, cookieoption);
          res.status(200).redirect("/");
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};
//로그인 접속 후 쿠키정보 가져오기
exports.isLogin = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      //쿠키 토큰 출력 -> 아이디
      var decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      db.query(
        "SELECT * FROM user WHERE id = ?",
        [decoded.id],
        (error, result) => {
          if (!result) {
            return next();
          }
          req.user = result[0];
          return next();
        }
      );
    } catch (error) {
      console.log(error);
      return next();
    }
  } else {
    next();
  }
};
//로그아웃
exports.logout = async (req, res) => {
  res.cookie("jwt", "", {
    //쿠키의 value값을 공백으로 하여 쿠키 제거
    expires: new Date(Date.now() + 2 * 1000),
    httpOnly: true,
  });
  res.status(200).redirect("/");
};
//회원가입
exports.register = (req, res) => {
  var { id, name, pw, pw_check } = req.body;
  db.query("SELECT id FROM user WHERE id = ?", [id], async (error, result) => {
    if (error) {
      console.log(error);
    }
    if (result.length > 0) {
      return res.render("register", {
        message: "이미 존재하는 아이디입니다.",
      });
    } else if (pw !== pw_check) {
      return res.render("register", {
        message: "비밀번호가 일치하지 않습니다.",
      });
    } else if (id === "") {
      return res.render("register", {
        message: "아이디를 입력하세요.",
      });
    } else if (name === "") {
      return res.render("register", {
        message: "이름을 입력하세요.",
      });
    } else if (pw === "") {
      return res.render("register", {
        message: "비밀번호를 입력하세요.",
      });
    }
    db.query(
      "INSERT INTO user VALUES(?,?,?,now(),null)",
      [id, pw, name],
      (error, result) => {
        if (error) {
          console.log(error);
        } else {
          return res.render("register", {
            message: "회원가입이 완료되었습니다.",
          });
        }
      }
    );
  });
};
//글쓰기
exports.write = (req, res) => {
  var { id, title, text } = req.body;
  if (title === "") {
    return res.render("write", {
      message: "제목을 입력하세요.",
      user: req.body,
    });
  } else if (text === "") {
    return res.render("write", {
      message: "내용을 입력하세요.",
      user: req.body,
    });
  } else {
    db.query(
      "INSERT INTO list VALUES(null,?,?,?,now(),0)",
      [id, title, text],
      (error, result) => {
        if (error) {
          console.log(error);
        } else {
          res.status(200).redirect("/list");
        }
      }
    );
  }
};
//글 조회 ---> 글 수정 / 댓글 작성
exports.view = (req, res) => {
  //댓글 전용 파라미터
  var getParam = req.query.c;
  if (getParam === "insert") {
    var { text, user_id, list_no } = req.body;
    if (text === "") {
      res.status(200).redirect(`/view?no=${list_no}`);
    } else{
      let sql = "INSERT INTO comment VALUES(null,?,?,?,now())";
      db.query(sql, [list_no, user_id, text], (error, result) => {
        if(error) throw error;
        res.status(200).redirect(`/view?no=${list_no}`);
      });
    }
  //댓글 삭제
  } else if(getParam === "delete"){
    var { c_no, list_no } = req.body;
    let sql2 = "DELETE FROM comment WHERE c_no = ?";
    db.query(sql2, [c_no], (error, result2)=> {
      if(error) throw error;
      res.status(200).redirect(`/view?no=${list_no}`);
    });
  } else {
    //글 수정작업으로 이동
    var no = req.body.no;
    res.status(200).redirect(`/update?no=${no}`);
  }
};
//글 수정 & 글 삭제
exports.update = (req, res) => {
  var getParam = req.query.u; //전송된 get 파라미터
  var { no, title, text } = req.body;
  if (getParam === "update") {
    if (title === "") {
      res.status(200).redirect(`/update?no=${no}`);
    } else if (text === "") {
      res.status(200).redirect(`/update?no=${no}`);
    } else {
      let sql1 = `UPDATE list SET title = ?,text = ? WHERE no = ?`;
      db.query(sql1, [title, text, no], (error1, result1) => {
        if (error1) throw error1;
        res.status(200).redirect("/list");
      });
    }
  } else if (getParam === "delete") {
    let sql2 = `DELETE FROM list WHERE no = ?`;
    db.query(sql2, [no], (error2, result2) => {
      if (error2) throw error2;
      res.status(200).redirect("/list");
    });
  }
};
