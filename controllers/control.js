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
        if (results == "" || pw !== results[0].pw) {
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
        "SELECT id, pw, name, DATE_FORMAT(user.join,'%Y년 %m월 %d일') AS date, img FROM user WHERE id = ?",
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
  var image = req.file;
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
    } else if (!image){
      return res.render("register", {
        message: "프로필 사진을 등록하세요.",
      });
    }
    db.query(
      "INSERT INTO user VALUES(?,?,?,now(),?)",
      [id, pw, name, image.filename],
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
//게시판 검색
exports.list = (req, res) => {
  res.redirect("list?search=" + req.body.search);
};
//글쓰기
exports.write = (req, res) => {
  var { id, title, text, name, img } = req.body;
  var image = req.file;
  if(!image){ //파일입력을 안 했을 때
    var files = null;
  }else{
    var files = image.filename;
  }
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
      "INSERT INTO list VALUES(null,?,?,?,now(),0,?)",
      [id, title, text, files],
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
    var { text, user_id, list_no, view_id } = req.body;
    let sql = "INSERT INTO comment VALUES(null,?,?,?,?,now())";
    db.query(sql, [list_no, user_id, view_id, text], (error, result) => {
      if (error) throw error;
      res.status(200).redirect(`/view?no=${list_no}`);
    });
    //댓글 삭제
  } else if (getParam === "delete") {
    var { c_no, list_no } = req.body;
    let sql2 = "DELETE FROM comment WHERE c_no = ?";
    db.query(sql2, [c_no], (error, result2) => {
      if (error) throw error;
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
  var image = req.file;
  if(!image){ //파일입력을 안 했을 때
    var files = null;
  }else{
    var files = image.filename;
  }
  if (getParam === "update") {
    if (title === "") {
      res.status(200).redirect(`/update?no=${no}`);
    } else if (text === "") {
      res.status(200).redirect(`/update?no=${no}`);
    } else {
      let sql1 = `UPDATE list SET title = ?, text = ?, file = ?, date = now() WHERE no = ?`;
      db.query(sql1, [title, text, files, no], (error1, result1) => {
        if (error1) throw error1;
        res.status(200).redirect("/list");
      });
    }
  } else if (getParam === "delete") {
    db.query("DELETE FROM list WHERE no = ?", [no], (error2, result2) => {
      if (error2) throw error2;
      db.query("DELETE FROM comment WHERE list_no = ?", [no], (error3, result3) => {//해당 글의 댓글 삭제
        if (error3) throw error3;
        res.status(200).redirect("/list");
      });
    });
  }
};
//회원정보 수정 이전 비밀번호 확인
exports.user_update_check = (req, res) => {
  var {id, pw} = req.body;
  if(!pw){
    return res.status(400).render("user_update_check", {
      message: "비밀번호를 입력하세요",
      user: req.body
    });
  }
  let sql = "SELECT * FROM user WHERE id = ?";
  db.query(sql, [id], async (error, result) =>{
    if(error) throw error;
    if (pw !== result[0].pw) {
      res.status(401).render("user_update_check", {
        message: "비밀번호가 일치하지 않습니다.",
        user: req.body
      });
    }else{
      res.status(200).redirect("/user_update");
    }
  });
}
//회원정보 수정/탈퇴
exports.user_update = (req, res) => {
  var page_type = req.query.u;
  var {id, name, pw, pw_check} = req.body;
  var image = req.file;
  if(page_type === 'delete'){//탈퇴
    db.query("DELETE FROM user WHERE id = ?", [id], (error1, result1) =>{ //삭제(본인 회원정보)
      if(error1) throw error1;
      db.query("DELETE FROM list WHERE user_id = ?", [id], (error2, result2) =>{ //삭제(본인 글)
        if(error2) throw error2;
        db.query("DELETE FROM comment WHERE user_id = ?", [id], (error3, result3) =>{ //삭제(본인 댓글)
          if(error3) throw error3;
          db.query("DELETE FROM comment WHERE writer_id = ?", [id], (error4, result4) =>{ //삭제(본인 글의 댓글)
            if(error4) throw error4;
            res.cookie("jwt", "", {
              //회원 탈퇴와 동시에 쿠키 제거
              expires: new Date(Date.now() + 2 * 1000),
              httpOnly: true,
            });
            res.status(200).redirect("/");
          })
        });
      });
    });
  }else if(page_type === 'update'){//이름 수정
    let sql1 = "UPDATE user SET name = ? WHERE id = ?";
    db.query(sql1, [name, id], (error, result) => {
      if(error) throw error;
      res.status(200).redirect("/profile");
    });
  }else if(page_type === 'image'){//사진 수정
    if(!image){
      return res.render("profile_update", {
        message: "프로필 사진을 등록하세요.",
        user: req.body,
        page_type: req.query.u
      });
    }
    let sql2 = "UPDATE user SET img = ? WHERE id = ?";
    db.query(sql2, [image.filename, id], (error, result) => {
      if(error) throw error;
      res.status(200).redirect("/profile");
    })
  }else if(page_type === 'password'){//비밀번호 수정
    if(!pw || !pw_check){
      return res.render("profile_update", {
        message: "비밀번호를 입력하세요.",
        user: req.body,
        page_type: req.query.u
      });
    }else if(pw !== pw_check){
      return res.render("profile_update", {
        message: "비밀번호가 일치하지 않습니다..",
        user: req.body,
        page_type: req.query.u
      });
    }else{
      let sql3 = "UPDATE user SET pw = ? WHERE id = ?";
      db.query(sql3, [pw, id], (error, result) => {
        if(error) throw error;
        res.status(200).redirect("/profile");
      });
    }
  }
}