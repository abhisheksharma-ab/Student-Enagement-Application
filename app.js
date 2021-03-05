const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
var fs = require('fs');
var path = require('path');
var multer = require('multer');

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now());
    },
});
var upload = multer({ storage: storage });

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.set("view engine", "ejs");


app.use(
    session({
        secret: "secret",
        resave: false,
        saveUninitialized: true,

    })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/stundentengagementsystem", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
mongoose.set("useCreateIndex", true);
mongoose.set('useFindAndModify', false);

var imageSchema = new mongoose.Schema({
    name: String,
    desc: String,
    img: {
        data: Buffer,
        contentType: String,
    },
});
const imgModel = new mongoose.model('Image', imageSchema);
const userschema = new mongoose.Schema({
    username: String,
    password: String,
    status: Number
});
const administrator = new mongoose.Schema({
    firstname: String,
    lastname: String,
    phonenumber: String,
    username: String,
    gender: String,
    dob: String,
    adminid: String
});

const student = new mongoose.Schema({
    firstname: String,
    lastname: String,
    phonenumber: String,
    username: String,
    password: String,
    gender: String,
    studentid: String,
    dob: String,
    semester: Number,
    department: String,
    subjects_enrolled: [[String]]
});
const subject = new mongoose.Schema({
    _id: String,
    subjectname: String,
    department: String,
    semester: Number,
});
const teacher = new mongoose.Schema({
    firstname: String,
    lastname: String,
    phonenumber: String,
    username: String,
    password: String,
    gender: String,
    teacherid: String,
    dob: String,
    department: String,
    subjects_assigned: [[String]]
});
const admincounter = new mongoose.Schema({
    _id: String,
    sequence_value: Number
})
const studentcounter = new mongoose.Schema({
    _id: String,
    sequence_value: Number
})
const teachercounter = new mongoose.Schema({
    _id: String,
    sequence_value: Number
})
const subject_teacher_mapping = new mongoose.Schema({
    _id: { teacherid: { type: String }, subjectid: { type: String } },
    teacherid: String,
    subjectid: String
})
const subject_student_mapping = new mongoose.Schema({
    _id: { studentid: { type: String }, subjectid: { type: String } },
    studentid: String,
    subjectid: String
})

var imageSchema = new mongoose.Schema({
    name: String,
    desc: String,
    img: {
        data: Buffer,
        contentType: String,
    },
});

userschema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userschema);
const Admin = new mongoose.model("Admin", administrator);
const Admincounter = new mongoose.model("Admincounter", admincounter);
const Teachercounter = new mongoose.model("Teachercounter", teachercounter);
const Studentcounter = new mongoose.model("Studentcounter", studentcounter);
const Teacher = new mongoose.model("Teacher", teacher);
const Student = new mongoose.model("Student", student);
const Subject = new mongoose.model("Subject", subject);
const Subject_teacher_mapping = new mongoose.model("Subject_teacher_mapping", subject_teacher_mapping);
const Subject_student_mapping = new mongoose.model("Subject_student_mapping", subject_student_mapping);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

function getNextSequenceValues(sequenceName) {
    return Admincounter.findOneAndUpdate(
        { _id: sequenceName },
        { $inc: { sequence_value: 1 } },
        { new: true }
    ).exec()
}

function getNextSequenceValuesforstudents(sequenceName) {
    return Studentcounter.findOneAndUpdate(
        { _id: sequenceName },
        { $inc: { sequence_value: 1 } },
        { new: true }
    ).exec()
}
function getNextSequenceValuesforteachers(sequenceName) {
    return Teachercounter.findOneAndUpdate(
        { _id: sequenceName },
        { $inc: { sequence_value: 1 } },
        { new: true }
    ).exec()
}
function createadminid() {
    h = getNextSequenceValues("adminid").then((p) => {
        h = p.sequence_value
        return h
    })
    return h
}
function createteacherid() {
    h = getNextSequenceValuesforteachers("teacherid").then((p) => {
        h = p.sequence_value
        return h
    })
    return h
}
function createstudentid() {
    h = getNextSequenceValuesforstudents("studentid").then((p) => {
        h = p.sequence_value
        return h
    })
    return h
}

Studentcounter.create({ _id: "studentid", sequence_value: 0 }).catch((err) => { })
Admincounter.create({ _id: "adminid", sequence_value: 0 }).catch((err) => { })
Teachercounter.create({ _id: "teacherid", sequence_value: 0 }).catch((err) => { })

app.get("/", function (req, res) {
    res.render("index")
})

app.get("/register", function (req, res) {
    res.render("register")
})

app.get("/xlogin", function (req, res) {
    res.render("xindex")
})
app.get('/uploadimage', (req, res) => {

    imgModel.find({}, (err, items) => {
        if (err) {
            console.log(err);
            res.status(500).send('An error occurred', err);
        } else {
            res.render('uploadimage', { items: items });
        }
    });
});
app.post("/uploadimage", upload.single('image'), (req, res) => {
    var obj = {
        name: "harish",
        desc: "harish",
        img: {
            data: fs.readFileSync(
                path.join(__dirname + '/uploads/' + req.file.filename)
            ),
            contentType: 'image/png',
        },
    };
    imgModel.create(obj, (err, item) => {
        if (err) {
            console.log(err);
        } else {
            // item.save();
            res.redirect('/');
        }
    });
})
app.post("/register", function (req, res) {

    var newid = new mongoose.mongo.ObjectId();
    User.register({
        username: req.body.email,
        status: Number(req.body.status),
        _id: newid
    }, req.body.psw[0],
        function (err) {
            if (err) {
                console.log("error")
                console.log(err);
                res.redirect("/register");
            }
            else {
                if (Number(req.body.status == 1)) {
                    createadminid().then((a) => {
                        Admin.create({ _id: newid, adminid: a, firstname: req.body.fname, lastname: req.body.lname, username: req.body.email, gender: req.body.gender, dob: req.body.dob },
                            function (err, ctd) {
                                if (err) {
                                    console.log(err)
                                }
                                else {
                                    res.redirect("/")
                                }
                            })
                    })

                }
                else if (Number(req.body.status == 2)) {
                    createteacherid().then((a) => {
                        Teacher.create({ _id: newid, teacherid: a, department: req.body.dept, firstname: req.body.fname, lastname: req.body.lname, username: req.body.email, gender: req.body.gender, dob: req.body.dob },
                            function (err, ctd) {
                                if (err) {
                                    console.log(err)
                                }
                                else {
                                    res.redirect("/")
                                }
                            })
                    })
                }
                else if (Number(req.body.status == 3)) {
                    createstudentid().then((a) => {
                        console.log(String(a).padStart(3, '0'))
                        Student.create({ _id: newid, studentid: String(a).padStart(3, '0'), firstname: req.body.fname, semester: req.body.semester, department: req.body.dept, lastname: req.body.lname, username: req.body.email, gender: req.body.gender, dob: req.body.dob },
                            function (err, ctd) {
                                if (err) {
                                    console.log(err)
                                }
                                else {
                                    res.redirect("/")
                                }
                            })
                    })
                }
            }
        })
})


app.post("/xlogin", function (req, res) {
    const uname = req.body.username
    User.findByUsername(uname).then(function (su) {
        if (su) {
            su.setPassword(req.body.password, function () {
                su.save()
                res.redirect("/register")
            })
        }
    })
})

app.post("/subjectregister", function (req, res) {
    Subject.create({ subjectname: req.body.sname, _id: req.body.scode }).then(function (done) {
        if (done) {
            res.redirect("/addsubject")
        }
    }).catch(function (err) {
        res.redirect("/register")
    })
})



app.post("/login", function (req, res) {
    console.log(req.body)
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })
    req.login(user, function (err) {
        if (err) {
            console.log(err)
        }
        else {
            passport.authenticate("local")(req, res, function () {
                User.findOne({ username: req.body.username }).then((users) => {

                    req.session.uniqueid = users._id
                    if (Number(users.status) == 1) {
                        res.redirect("/adminlogin")
                    }
                    if (Number(users.status) == 2) {
                        res.redirect("/teacherlogin")
                    }
                    if (Number(users.status) == 3) {
                        res.redirect("/studentlogin")
                    }
                }).catch((e) => {
                    console.log(e)
                })
            })
        }
    })
})

/* 
Teacher.find({}, { "firstname": 1 }).exec().then(tlist => {
            teacherlist = tlist
        })
        Student.find({}, { "firstname": 1 }).exec().then(slist => {
            studentlist = slist
            res.render("adminpage", { students: studentlist, teachers: teacherlist })
        })
*/
app.get("/adminlogin", function (req, res) {
    if (req.isAuthenticated()) {
        counts = []
        Teacher.estimatedDocumentCount().exec().then(ans => {
            counts.push(ans)
            Student.estimatedDocumentCount().exec().then(sc => {
                counts.push(sc)
                Subject.estimatedDocumentCount().exec().then(subc => {
                    counts.push(subc)
                    res.render("admin", { counts: counts })
                })
            })
        })
    }
    else {
        res.redirect("/");
    }
})

app.get("/TeacherProfiles", function (req, res) {
    if (req.isAuthenticated()) {
        Teacher.find({}, { "firstname": 1, "lastname": 1, "department": 1, "teacherid": 1 }).exec().then(tlist => {
            teacherlist = tlist
            res.render("teacherlist_adminview", { students: tlist })
        })
    }
    else {
        res.redirect('/')
    }
    //res.render("teacherlist_adminview", { students: lauda })
})
app.get("/StudentProfiles", function (req, res) {
    if (req.isAuthenticated()) {
        Student.find({}, { "firstname": 1, "lastname": 1, "department": 1, "studentid": 1, "semester": 1 }).exec().then(slist => {
            studentlist = slist
            res.render("studentlist_adminview", { students: slist })
        })
    }
    else {
        res.redirect('/')
    }
    //res.render("studentlist_adminview", { students: lauda })
})
app.get("/assignsubjects", function (req, res) {
    if (req.isAuthenticated()) {
        Teacher.find({}, { "firstname": 1, "lastname": 1, "teacherid": 1 }).exec().then(tlist => {
            teacherlist = tlist
            Subject.find({}, { "subjectname": 1, "_id": 1 }).exec().then(sublist => {
                subjectlist = sublist
                res.render('assignsubjects', {
                    subject: sublist,
                    teacher: tlist,
                });
                //res.render("teacherlist_adminview", { students: tlist })
            })
        })
    }

})
app.get("/studentlogin", function (req, res) {
    console.log(req.session.uniqueid)
    if (req.isAuthenticated()) {
        res.send("Ssuccess")
    }
    else {
        res.redirect("/");
    }
})

app.get("/teacherlogin", function (req, res) {
    console.log(req.session.uniqueid)
    if (req.isAuthenticated()) {
        res.send("Tsuccess")
    }
    else {
        res.redirect("/");
    }
})

app.get("/addsubject", function (req, res) {
    subjects = [
        {
            _id: '1',
            subjectname: 'Discrete Mathematics',
            department: 'Mathematics Department',
            semester: 1,
        }
    ];
    teachers = [
        {
            _id: 1,
            teacherid: 51,
        }
    ];
    res.render('registersubjects', {
        subject: subjects,
        teacher: teachers,
    });
})


app.post("/testroute", function (req, res) {
    console.log(req.body)
})
app.post("/assignsubjects", function (req, res) {
    Subject_teacher_mapping.create(
        {
            _id:
                { teacherid: req.body.tid, subjectid: req.body.scode },
            teacherid: req.body.tid, subjectid: req.body.scode
        }).then(Teacher.findOneAndUpdate(
            {
                teacherid: req.body.tid
            },
            {
                $push: { subjects_assigned: [req.body.sub_name, req.body.scode] }
            })).catch((err) => {
                console.log(err)
            })
})
app.post("/enrollsubject", function (req, res) {
    Subject_student_mapping.create(
        {
            _id: { studentid: req.body.sid, subjectid: req.body.scode },
            studentid: req.body.sid, subjectid: req.body.scode
        }).then(Student.findOneAndUpdate(
            {
                studentid: req.body.sid
            },
            {
                $push: { subjects_enrolled: [req.body.sub_name, req.body.scode] }
            })).catch((err) => {
                console.log(err)
            })
})

app.get("/enrollsubject", function (req, res) {
    subjects = [
        {
            _id: '1',
            subjectname: 'Discrete Mathematics',
            department: 'Mathematics Department',
            semester: 1,
        },
    ];
    res.render('subjectenroll', {
        subject: subjects,
    });
})




app.get("/admin", function (req, res) {

    res.render("admin")
})

app.get('/studentHomePage', function (req, res) {
    subjects = [
        {
            _id: '1',
            subjectname: 'Discrete Mathematics',
            department: 'Mathematics Department',
            semester: 1,
        },
        {
            _id: '2',
            subjectname: 'Introduction to embedded systems',
            department: 'Electronics and Communication',
            semester: 2,
        },
        {
            _id: 3,
            subjectname: 'history',
            department: 'humanities',
            semester: 2,
        },
        {
            _id: 4,
            subjectname: 'civics',
            department: 'humanities',
            semester: 3,
        },
        {
            _id: 5,
            subjectname: 'fluids',
            department: 'physics',
            semester: 5,
        },
        {
            _id: 6,
            subjectname: 'thermodynamics',
            department: 'mechanics',
            semester: 6,
        },
        {
            _id: 7,
            subjectname: 'english',
            department: 'humanities',
            semester: 3,
        },
        {
            _id: 8,
            subjectname: 'geography',
            department: 'humanities',
            semester: 3,
        },
    ];

    colNotifs = [
        {
            message:
                'College fest starts from 7th march along with shhf;adjfaldjfha;jdhfajsdfh',
        },
        {
            message: 'College om 7th march along with shhf;adjfaldjfha;jdhfajsdfh',
        },
        {
            message: 'College fest starts frg with shhf;adjfaldjfha;jdhfajsdfh',
        },
        {
            message:
                ' fest starts from 7th march along with shhf;adjfaldjfha;jdhfajsdfh',
        },
    ];
    teacherNotifs = [
        {
            message: 'Assignment postponed to adhfhaljfdhsl;ajfdsha',
        },
        {
            message: 'Assignment postponed to adhfhaljfdhsl;ajfdsha',
        },
        {
            message: 'Assignment postponed to adhfhaljfdhsl;ajfdsha',
        },
        {
            message: 'Assignment postponed to adhfhaljfdhsl;ajfdsha',
        },
    ];
    res.render('studentHomePage', {
        subject: subjects,
        colNotif: colNotifs,
        teacherNotifs: teacherNotifs,
    });
});
app.get("/exp", function (req, res) {
    subjects = [
        {
            _id: '1',
            subjectname: 'Discrete Mathematics',
            department: 'Mathematics Department',
            semester: 1,
        }
    ];
    teachers = [
        {
            _id: 1,
            teacherid: 51,
            firstname: 'saketh1',

        }
    ];
    res.render('exp', {
        subject: subjects,
        teacher: teachers,
    });
})
app.listen(3000, function () {
    console.log("Server is running")
})
