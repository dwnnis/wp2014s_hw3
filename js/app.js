(function(){
	//初始化parse。
	Parse.initialize("dyOrmA13aqPbb4NpevAHVeEIwt9G3MG1RNTVHgW7", "cbmRQJXC9lUXRGLihY7Y1gE7UkdNksKLWaKwN8iv");
	//編譯template engine函數();
	var templates = {};
	['loginView', 'evaluationView', 'updateSuccessView'].forEach(function (e) {
		templatetext = document.getElementById(e).text;
		templates[e] = doT.template(templatetext);
	});

	var commons = {
    loginRequiredView: function (ViewFunction) {
      return function () {
        var currentUser = Parse.User.current();
        if (currentUser) {
          ViewFunction();
        } else {
          window.location.hash = "login/" + window.location.hash;
        }
      }
    },
  	}

	
	var handlers = {
    // navbar的處理部分。
    // navbar函數判斷登入或登出。
    navbar: function(){
    	//判斷登入與否的地方
		var currentUser = Parse.User.current();
		if (currentUser){
			// 在登入後使用者所能看到的部分。      
			document.getElementById('loginButton').style.display = 'none';
			document.getElementById('evaluationButton').style.display = 'block';
			document.getElementById('logoutButton').style.display = 'block';
		} else {
			// 在登入前使用者所看到的navbarParse.User.current()狀態。
			document.getElementById('loginButton').style.display = 'block';
			document.getElementById('evaluationButton').style.display = 'none';
			document.getElementById('logoutButton').style.display = 'none';
			handlers.loginView();
		}
			//按下登入按鈕後('click')，首先登出整個parse，接著執行重新呼叫navbar的nandler
			//讓網址列變回"login/"。(window.location.hash)
			document.getElementById('logoutButton').addEventListener('click', function(){
				Parse.User.logOut();
				handlers.navbar();
				window.location.hash = 'login/';
      		});
	},
	//登入介面
	//在這段中要先檢查id是否為有效的。
	// 這邊所用的名字要先對到。(ex. loginView)
	loginView: function(redirect){
		// 確定學生id是否在修課名單內。
		var checkValidID = function(return_id) {
			var student_id = document.getElementById(return_id).value;
			return(TAHelp.getMemberlistOf(student_id) === false) ? false : true;
		}
		//展示訊息的界面。
		var showMessage = function(return_id, fn, msg){
			if(!fn()){
				// innerHTML的用途是定義印出來的範圍。
				document.getElementById(return_id).innerHTML = msg;	
				document.getElementById(return_id).style.display = 'block';
			}
			else{
				document.getElementById(return_id).style.display = 'none';
			}

		}
		// postAction是用來重整navbar。
		// redirect 是用來表示
		var postAction = function(){
			handlers.navbar();
			window.location.hash = (redirect) ? redirect : '';
		}
		
		var passwordMatch = function(){
			var signup_password = document.getElementById('form-signup-password');
			var signup_password1 = document.getElementById('form-signup-password1');
			var match = (signup_password.value ===  signup_password1.value) ? true : false;
			showMessage('form-signup-message',function(){return match;}, '密碼打錯了啦!');
			return match;
		}

		document.getElementById("content").innerHTML = templates.loginView();
		document.getElementById("form-signin-student-id").addEventListener("keyup", function(){
			showMessage('form-signin-message', function(){return checkValidID("form-signin-student-id")}, '欸他不是這班的啦!');
		});	
		document.getElementById("form-signin").addEventListener("submit",function(){
			if(!checkValidID("form-signin-student-id")){
				alert("欸欸他不是這班的啦");
				return false;
			}
			var id = document.getElementById("form-signin-student-id").value;
			var pw = document.getElementById("form-signin-password").value;
			Parse.User.logIn(id,pw,{
				success: function(){
					postAction();
				}, 
				error: function(){
					showMessage('form-signin-message', function(){
						return false;
					}, "打錯了啦!你腦袋有洞嗎?");
				}
			});
		}, false);

		
			document.getElementById("form-signup-student-id").addEventListener("keyup", function(){
				showMessage('form-signup-message', function(){return checkValidID("form-signup-student-id")}
				, '欸靠盃你不是我們班的啦');
			});
			document.getElementById("form-signup-password1").addEventListener("keyup",passwordMatch);
			document.getElementById("form-signup").addEventListener("submit", function(){
				if(!checkValidID('form-signup-student-id')){
					alert("欸你真的不是我們班的啦!");
					return false;
				}
				if(!passwordMatch()){
					return false;
				}

				var user = new Parse.User();
				//無法理解 為甚麼就算把getElementId內的內容打錯 還是有辦法把資料輸進parse裡 ㄜ阿不理解
				user.set("username", document.getElementById('form-signup-student-id').value);
				user.set("password", document.getElementById('form-signup-password').value);
				user.set("email", document.getElementById('form-signup-email').value);
				user.signUp(null, {
				success: function(user){
					postAction();
				},
				error: function(user, error){
					showMessage('form-signup-message',function (){
						return false;
					}, error.message);
				} 	
				});
			},false);
	},	
	
	//評分介面
    evaluationView: commons.loginRequiredView(function () {
		// 
		var Evaluation = Parse.Object.extend('Evaluation');
		var currentUser = Parse.User.current();
		// if(currentUser){
			console.log("hahahahaha");
			// 增設一個新的"評分"欄位。
			// ACL是用來管制權限的。
			var evaluationACL = new Parse.ACL();
			evaluationACL.setPublicReadAccess(false);
			evaluationACL.setPublicWriteAccess(false);
			evaluationACL.setReadAccess(currentUser, true);
			evaluationACL.setWriteAccess(currentUser, true);
			// 定義一個新的query,呼叫他即可查找"Evaluation"裡的所有data。
			
			var query = new Parse.Query(Evaluation);
			query.equalTo('user', currentUser);
			query.first({
				success: function(evaluation){
					// ㄜ 始終不知道這個在幹嘛。
					window.EVAL = evaluation;
					if(evaluation === undefined){
						var TeamMembers = TAHelp.getMemberlistOf(currentUser.get('username')).filter(function(e){
							return (e.StudentId !== currentUser.get('username')) ? true : false;
						}).map(function(e){
							e.scores = ['0','0','0','0'];
							return e;
						});
					} else {
						console.log("found")
						var TeamMembers = evaluation.toJSON().evaluations;
						console.log("TeamMembers is " + TeamMembers)
					}
					document.getElementById('content').innerHTML = templates.evaluationView(TeamMembers);
					console.log(TeamMembers)
					document.getElementById('evaluationForm-submit').value = (evaluation === undefined) ? '送出>_^' : '咩修改謀';
					document.getElementById('evaluationForm').addEventListener('submit',function(){
						for(var i = 0; i < TeamMembers.length; i++){
							console.log("length")
							for(var j = 0; j < TeamMembers[i].scores.length; j++){
								var e = document.getElementById('stu'+TeamMembers[i].StudentId+ '-q' + j);
								var amount = e.options[e.selectedIndex].value;
								TeamMembers[i].scores[j] = amount;
							}
						}
						if(evaluation === undefined){
							evaluation = new Evaluation();
							evaluation.set('username', currentUser);
							evaluation.setACL(evaluationACL);
 						}
 						console.log(TeamMembers);
 						evaluation.set('evaluations', TeamMembers);
						evaluation.save(null,{
							success: function(){
								document.getElementById('content').innerHTML = templates.updateSuccessView();
							}, 
							error: function(object, err){},
						});
					}, false);
				},
				error: function(){}
			});
		//}
	})
};
	/* Router */
	
	var App = Parse.Router.extend({
    // routes要用來判斷的是連結不同的view與網址之關係。
    routes: { 
      "": "indexView",
      "peer-evaluation/": "evaluationView",
      "login/*redirect": "loginView",
    },
    // 不同的view所進行的是呼叫不同的handler去改變不同的view。
    loginView: handlers.loginView,
	evaluationView: handlers.evaluationView,
	indexView: handlers.evaluationView,	
  });

  // 啟動route的地方。
  this.Router = new App();
  Parse.history.start();
  handlers.navbar();
	
})();
