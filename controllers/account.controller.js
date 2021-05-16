var data = require('../config/db.config');
var fs = require('fs');

function removeVietnameseTones(str) {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
    str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
    str = str.replace(/đ/g,"d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    // Some system encode vietnamese combining accent as individual utf-8 characters
    // Một vài bộ encode coi các dấu mũ, dấu chữ như một kí tự riêng biệt nên thêm hai dòng này
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // ̀ ́ ̃ ̉ ̣  huyền, sắc, ngã, hỏi, nặng
    str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // ˆ ̆ ̛  Â, Ê, Ă, Ơ, Ư
    // Remove extra spaces
    // Bỏ các khoảng trắng liền nhau
    str = str.replace(/ + /g," ");
    str = str.trim();
    // Remove punctuations
    // Bỏ dấu câu, kí tự đặc biệt
    str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g," ");
    return str;
}

var getInfo = function(req, res) { 
    let user = data.user_info.find(function(value){
        return req.accID == value.ID;
    });
    res.render(`${req.role}/setting`, {
        title: 'Setting',
        user: user
    });
}

var changePassword = function(req, res) {
    let user = data.user.find(function(value) {
        return req.accID == value.ID;
    });
    if(user.password != req.body.old_pass)
        res.send({msg: 'Incorrect old password !'});
    else {
        user.password = req.body.new_pass;
        fs.writeFileSync('./mockdb/user.json', JSON.stringify(data.user));
        res.send({msg: "Change password successfully"});
    }
}

var createAccount = function(req, res) {
    let user = {}
    user.ID = data.user[data.user.length - 1].ID + 1;
    user.username = req.body.username;
    user.password = req.body.password;
    user.role = req.body.role;
    let user_info = {
        "ID": user.ID,
        "email": "",
        "name": "",
        "birthday": "",
        "phone-number": "",
        "github": "",
        "preference": ""
    };
    data.user.push(user);
    data.user_info.push(user_info);
    fs.writeFileSync('./mockdb/user.json', JSON.stringify(data.user));
    fs.writeFileSync('./mockdb/user_info.json', JSON.stringify(data.user_info));
    res.send({msg: "Create successfully"});
}

var updateInfo = function(req, res) {
    data.user_info.find(function(value, index) {
        if(req.accID == value.ID) {
            data.user_info[index]['phone-number'] = req.body.phoneNumber;
            data.user_info[index].email = req.body.email;
            data.user_info[index].birthday = req.body.birthday;
            data.user_info[index].github = req.body.github;
        }
        return req.accID == value.ID;
    });
    fs.writeFileSync('./mockdb/user_info.json', JSON.stringify(data.user_info));
    res.send({msg: 'Update successfully'})
}

var listAccounts = function(req, res) {
    let user = JSON.parse(JSON.stringify(data.user_info));
    data.user.forEach(function(value, index) {
        user[index].role = value.role;
        user[index].username = value.username;
    });
    var username;
    data.user_info.find(function(value) {
        if(value.ID == req.accID) {
            username = value.name;
            return true;
        }
        return false;
    })
    user.find(function(value, index) {
        if(value.role == 'admin') {
            user.splice(index, 1);
            return true;
        }
        return false;
    })
    res.render('admin/accounts', {
        title: "Accounts",
        user: user,
        username: username
    })
}

var editAccount = function(req, res) {
    data.user.find(function(value, index) {
        if(req.body.ID == value.ID) {
            data.user[index].role = req.body.role.toLowerCase(); 
            if(data.user[index].role == 'moderator') data.user[index].role = 'mod'
            data.user[index].password = req.body.password;
            data.user[index].username = req.body.username;
            return true;
        }
        return false;
    });
    fs.writeFileSync('./mockdb/user.json', JSON.stringify(data.user));
    res.send({msg: "Edit oke"})
}
var memberSearch = function(req, res) {
    let queryString = req.query.value.toUpperCase();
    var _members = data.user_info.filter(function(value) {
        var name = removeVietnameseTones(value.name);
        return name.toUpperCase().indexOf(queryString) > -1 && queryString != ''; 
    })
    var members = JSON.parse(JSON.stringify(_members));
    members.find(function(value, index) {
        if(value.ID == req.accID) {
            members.splice(index, 1);
            return true;
        }
        return false;
    })
    res.send({members: members});
}

var getTeamMember = function(req, res) {
    var mod_user_ID = [];
    data.user.filter(function (value) {
        if (value.role == 'admin' || value.role == 'mod') {
            mod_user_ID.push(value.ID);
            return true;
        }
        return false;
    });
    var att = data.user_info.filter(function(value, index) {
        return value.preference == req.query.preference;
    })
    console.log(mod_user_ID);
    var attendees = JSON.parse(JSON.stringify(att));
    attendees = attendees.filter(function(value, index) {
        return !mod_user_ID.includes(value.ID);
    })
    console.log(attendees);
    res.send({ attendees: attendees});
}

var deleteAccount = function(req, res) {
    var ID = parseInt(req.body.ID);
    data.user.find(function(value, index) {
        if(value.ID == ID) {
            data.user.splice(index, 1);
            console.log(value.ID);
            return true;
        }
        return false
    });
    data.user_info.find(function(value, index) {
        if(value.ID == ID) {
            data.user_info.splice(index, 1);
            return true;
        }
        return false;
    });
    data.join = data.join.filter(function(value) {
        return value.userID != ID;
    });
    fs.writeFileSync('./mockdb/user.json', JSON.stringify(data.user));
    fs.writeFileSync('./mockdb/user_info.json', JSON.stringify(data.user_info));
    fs.writeFileSync('./mockdb/join.json', JSON.stringify(join.user));
    res.send({msg: "You have delete an account !"})
}

var getMember = function(req, res) {
    console.log(req.query.ID);
    var ID = parseInt(req.query.ID);
    var user_info = data.user_info.find(function(val) {
        return val.ID == ID;
    })
    data.user.find(function(val) {
        if(user_info.ID == val.ID) {
            user_info.username = val.username;
        } 
    })
    console.log(user_info);
    res.send({user: user_info});
}

module.exports = {
    getInfo,
    updateInfo,
    changePassword,
    listAccounts,
    editAccount,
    memberSearch,
    getTeamMember,
    deleteAccount,
    createAccount,
    getMember
}