"use strict";

/*
require modules
 */
var express = require("express");
var bodyParser = require("body-parser");// require the body-parser module
var session = require("express-session");
var fileUpload = require("express-fileupload");
var mysql = require("mysql");
const { UCS2_PERSIAN_CI } = require("mysql/lib/protocol/constants/charsets");
const { contentType } = require("express/lib/response");


/*
Create our express app object
 */
var port = 8000;
var app = express();

/*
Configure middlewares
 */
app.use(session({
    secret: "ttgfhrwgedgnl7qtcoqtcg2uyaugyuegeuagu111",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}));
app.use(express.static("assets"));
app.set("view-engine", "ejs");
app.set("views", "templates");
app.use(bodyParser.urlencoded({ extended: true }));// tell our app to use the body-parser middleware
app.use(fileUpload());

/*
Configure database
 */
// configure out database connection
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "199911200",
    database: "sharePhoto"
});

// connect to the DB
con.connect(function (err) {
    if (err) {
        console.log("Error: " + err);
    } else {
        console.log("Successfully connected to DB");
    }
});

/*
Configure application Routes
 */
app.get("/", function (req, res) {
    const query = `SELECT * FROM photos`;
    con.query(query, function (err, result) {
        if (err) throw err;
        if (result.length > 0) {
            //put user's photos in a new array   
            const images = [];
            for (const item of result) {
                const imgName = item.filename;
                const imgUrl = item.url;
                const imgUserName = item.username;
                const imgLikes = item.likes;
                const imgId = item.idPhoto;
                const imgDate = item.date;
                images.push({ imgName, imgUserName,imgUrl, imgLikes, imgId, imgDate});
            }
            shuffle(images);
            /////console.log(images);
            //check the status
            var sql = `SELECT * FROM login`;
            con.query(sql, function (err, results) {
                if (err) {
                    res.send("A database error occurred: " + err);
                } else {
                    if (results.length > 0) {
                        //check status log in
                        console.log("Status: Log in");
                        res.render("index.ejs", { "username": "Me", "link": "profile", "signup": "", "link2": "", "images": images });
                    } else {
                        //check status log out
                        console.log("Status: Log out");
                        res.render("index.ejs", { "username": "Log in", "link": "login", "signup": "Sign up", "link2": "signup", "images": images });
                    }
                }
            });
        } else {
            console.log("None");
            //check the status
            var sql = `SELECT * FROM login`;
            con.query(sql, function (err, results) {
                if (err) {
                    res.send("A database error occurred: " + err);
                } else {
                    if (results.length > 0) {
                        //check status log in
                        console.log("Status: Log in");
                        var username = results[0].username;
                        res.render("index.ejs", { "username": "Me", "link": "profile", "signup": "", "link2": "", images: [] });
                    } else {
                        //check status log out
                        console.log("Status: Log out");
                        res.render("index.ejs", { "username": "Log in", "link": "login", "signup": "Sign up", "link2": "signup", images: [] });
                    }
                }
            });
        }
    });
});

app.post("/", function (req, res) {
    // set the params id
    var imgId = req.body.id;
    console.log("Like---" + imgId);
    //set variables
    const query = `SELECT * FROM photos WHERE idPhoto = "${imgId}"`;
    con.query(query, function (err, result) {
        if (err) {
            res.status(500).end()
            throw err;
        }

        if (result.length > 0) {
            const imgName = result[0].filename;
            const imgUrl = result[0].url;
            const imgUploader = result[0].username;
            const imgLikes = result[0].likes + 1;
            const imgDate = result[0].date;
            const query = `UPDATE photos SET likes = '${imgLikes}' WHERE idPhoto = '${imgId}'`;
            con.query(query, function (err, result) {
                if (err) {
                    res.status(500).end()
                    throw err;
                }

                const images = [];
                images.push({ imgId, imgName, imgUploader, imgUrl, imgLikes, imgDate });
                console.log("Like!");

                res.status(200).json({
                    id: imgId,
                    likes: imgLikes,
                }).end()
            });
        } else {
            res.status(404).end()
        }
    });

});

app.get("/:imgId/comments", function (req, res) {
    // set the params id
    var imgId = req.params.imgId;
    console.log("imgId is " + imgId);
    //check if this photo id exists
    var sqlId = `SELECT * FROM photos WHERE idPhoto = "${imgId}"`;
    con.query(sqlId, function (err, result) {
        if (err) throw err;
        if (result.length > 0) {
            //set an empty array to store the data
            const images = [];
            const imgId = result[0].idPhoto;
            const imgName = result[0].filename;
            const imgUrl = result[0].url;
            const imgUploader = result[0].username;
            const imgLikes = result[0].likes;
            //check the currentUsername
            var sql = `SELECT * FROM login`;
            con.query(sql, function (err, results) {
                if (err) throw err;
                if (results.length > 0) {
                    //get currentUsername
                    var currentUser = results[0].username;
                    console.log("currentUsername: " + currentUser);
                    images.push({ imgId, imgName, imgUploader, imgUrl, imgLikes, currentUser });
                }
            });
            console.log(images[0]);
            //check if this photo has some comments
            var sql = `SELECT * FROM photosComments WHERE idPhoto = "${imgId}"`
            con.query(sql, function (err, result) {
                if (err) throw err;
                if (result.length > 0) {
                    const imageComments = [];
                    for (const item of result) {
                        const imgCommentUsername = item.commentUsername;
                        const imgCommentsContent = item.comment;
                        var imgCommentsDate = item.date;
                        //imgCommentsDate = imgCommentsDate % 10;
                        //imgCommentsDate = imgCommentsDate.toISOString();
                        //.toString().substring(2,".");
                        imageComments.push({ imgCommentUsername, imgCommentsContent, imgCommentsDate });
                    }
                    res.render("comment.ejs", { "images": images, "imageComments": imageComments });
                    console.log(imageComments[0]);
                } else {
                    res.render("comment.ejs", { "images": images, imageComments: [] });
                }
            });
        } else {
            console.log("User entered a wrong img id");
        }
    });
});

app.post("/:imgId/comments", function (req, res) {
    // set the params id
    var imgId = req.params.imgId;
    //set variables
    var imgCommentsContent = req.body.content;
    var imgCommentUsername;
    var imgCommentsDate = new Date().toISOString().
        replace(/T/, ' ').      // replace T with a space
        replace(/\..+/, '')     // delete the dot and everything after
    console.log("new comment content is " + imgCommentsContent);
    //check the status
    var sql = `SELECT * FROM login`;
    con.query(sql, function (err, results) {
        if (err) {
            res.send("A database error occurred: " + err);
        } else {
            if (results.length > 0) {
                //check status log in
                console.log("Status: Log in");
                imgCommentUsername = results[0].username;
                if (imgCommentsContent) {
                    console.log("success!");
                    //insert the new comment into DB
                    var sql = `INSERT INTO photosComments (idPhoto, commentUsername, comment, date) VALUES ("${imgId}", "${imgCommentUsername}", "${imgCommentsContent}", "${imgCommentsDate}")`;
                    console.log(sql);
                    con.query(sql, function (err, results) {
                        if (err) {
                            res.send("Database error " + err);
                        } else {
                            //give a alert feedback
                            console.log(results);
                            let alert = require('alert');
                            alert("New comment sent!");
                        }
                    });
                    res.redirect(req.originalUrl);
                } else {
                    console.log("no comment!");
                    //give a alert feedback
                    console.log(results);
                    let alert = require('alert');
                    alert("Please enter something!");
                }
            } else {
                //check status log out
                console.log("Status: Log out");
                //give a alert feedback
                let alert = require('alert');
                alert("Please log in firstly and you can leave a comment.");
            }
        }

    });
    /*res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    req.on('data', function(data){
        content+=data;
        console.log("!!!!!!!");
    })
    res.sendStatus(200);*/
});

app.get("/:imgId/comments/delete", function (req, res) {
    console.log("get delete system");
    // set the params id
    var imgId = req.params.imgId;
    // set the params id
    var imgId = req.params.imgId;
    console.log("imgId is " + imgId);
    //check if this photo id exists
    var sqlId = `SELECT * FROM photos WHERE idPhoto = "${imgId}"`;
    con.query(sqlId, function (err, result) {
        if (err) throw err;
        if (result.length > 0) {
            //set an empty array to store the data
            const images = [];
            const imgId = result[0].idPhoto;
            const imgName = result[0].filename;
            const imgUrl = result[0].url;
            const imgUploader = result[0].username;
            const imgLikes = result[0].likes;
            //check the currentUsername
            var sql = `SELECT * FROM login`;
            con.query(sql, function (err, results) {
                if (err) throw err;
                if (results.length > 0) {
                    //get currentUsername
                    var currentUser = results[0].username;
                    console.log("currentUsername: " + currentUser);
                    images.push({ imgId, imgName, imgUploader, imgUrl, imgLikes, currentUser });
                }
            });
            console.log(images[0]);
            //check if this photo has some comments
            var sql = `SELECT * FROM photosComments WHERE idPhoto = "${imgId}"`
            con.query(sql, function (err, result) {
                if (err) throw err;
                if (result.length > 0) {
                    const imageComments = [];
                    for (const item of result) {
                        const imgCommentUsername = item.commentUsername;
                        const imgCommentsContent = item.comment;
                        var imgCommentsDate = item.date;
                        //imgCommentsDate = imgCommentsDate % 10;
                        //imgCommentsDate = imgCommentsDate.toISOString();
                        //.toString().substring(2,".");
                        imageComments.push({ imgCommentUsername, imgCommentsContent, imgCommentsDate });
                    }
                    res.render("comment.ejs", { "images": images, "imageComments": imageComments });
                    console.log(imageComments[0]);
                } else {
                    res.render("comment.ejs", { "images": images, imageComments: [] });
                }
            });
        } else {
            console.log("User entered a wrong img id");
        }
    });
});

app.post("/:imgId/comments/delete", function (req, res) {
    console.log("post delete system");
    // set the params id
    var imgId = req.params.imgId;
    console.log("Delete---imgId:" + imgId);
    var url = "/" + imgId + "/comments";
    console.log(url);
    //get the delete comment's index of this photos
    var deleteCommentIndex = req.body.delete;
    console.log("Delete---deleteCommentIndex:" + deleteCommentIndex);
    //check if this photo id exists
    var sqlId = `SELECT * FROM photos WHERE idPhoto = "${imgId}"`;
    con.query(sqlId, function (err, result) {
        if (err) throw err;
        if (result.length > 0) {
            console.log("find this photo");
            //check if this photo has some comments
            var sql = `SELECT * FROM photosComments WHERE idPhoto = "${imgId}"`
            con.query(sql, function (err, result) {
                if (err) throw err;
                if (result.length > 0) {
                    console.log("find this photo's comments");
                    for (var i = 0; i < result.length; i++) {
                        if (i == deleteCommentIndex) {
                            var deleteComment = result[i].comment;
                            console.log("this delete comments content is" + deleteComment);
                            var sqlDelete = `DELETE FROM photosComments WHERE comment = "${deleteComment}"`
                            con.query(sqlDelete, function (err, result) {
                                if (err) throw err;
                                console.log("Delete");
                                //give a alert feedback
                                let alert = require('alert');
                                alert("Deleted!");
                            });
                        } else {
                            console.log("not delete");
                        }
                        res.redirect(req.originalUrl);
                    }
                } else {
                    console.log("No comments yet");
                }
            });
        } else {
            console.log("User entered a wrong img id");
        }
    });
});

app.get("/signup", function (req, res) {
    res.render("signup.ejs", {});
});

app.post("/signup", function (req, res) {
    //set the variables
    var id;
    var username = req.body.username;;
    var pass = req.body.password;
    var firstname = req.body.firstname;
    var surname = req.body.surname;

    //check whether there is a duplicate username
    var sqlUsername = `SELECT * FROM users WHERE username = "${username}"`;
    con.query(sqlUsername, function (err, results) {
        if (err) {
            res.send("A database error occurred: " + err);
        } else {
            if (results.length == 0) {
                //check the max id of the users table
                var sqlId = `SELECT max(id) as maxID FROM users`;
                //insert the new one
                con.query(sqlId, function (err, results) {
                    if (err) {
                        res.send("A database error occurred: " + err);
                    } else {
                        //check the max id of the user information table
                        console.log(results[0].maxID);
                        id = results[0].maxID + 1;
                        //check if all the information entered
                        if (username && firstname && surname && pass) {
                            //insert the new user to the user information table
                            var sql = `INSERT INTO users (id, username, firstname, surname, password) VALUES ("${id}", "${username}", "${firstname}", "${surname}", "${pass}")`;
                            console.log(sql);
                            con.query(sql, function (err, results) {
                                if (err) {
                                    res.send("Database error " + err);
                                } else {
                                    //give a alert feedback
                                    console.log(results);
                                    let alert = require('alert');
                                    alert("Congrats! You have created your account and let's log in.");
                                    res.redirect("/login");
                                }
                            });
                        } else {
                            //give a alert feedback
                            let alert = require('alert');
                            alert("Please enter all the necessary information.");
                        }

                    }
                });
            } else {
                //give a alert feedback
                let alert = require('alert');
                alert("This username is existed, please try another name.");
            }
        }
    });
});

app.get("/login", function (req, res) {
    res.render("login.ejs", {});
});

app.post("/login", function (req, res) {
    //set the variables
    var id;
    var username = req.body.username;
    var firstname;
    var surname;
    var pass = req.body.password;

    //search the users information
    var sql = `SELECT * FROM users WHERE username = "${username}"`;
    con.query(sql, function (err, results) {
        if (err) {
            res.send("A database error occurred: " + err);
        } else {
            if (results.length > 0) {
                //search the user name succussful
                console.log("Username searched");
                if (results[0].password == pass) {
                    //check the password
                    console.log("Password correct");
                    //save this user information to the empty table "login"
                    id = results[0].id;
                    firstname = results[0].firstname;
                    surname = results[0].surname;
                    var sqlStore = `INSERT INTO login (id, username, firstname, surname, password) VALUES ("${id}", "${username}", "${firstname}", "${surname}", "${pass}")`;
                    console.log(sqlStore);
                    con.query(sqlStore, function (err, results) {
                        if (err) {
                            res.send("Database error " + err);
                        } else {
                            console.log(results);//check the login table
                            console.log("Insert log in information");
                        }
                    });
                    console.log("In.");
                    //lead to personal page
                    res.redirect("/profile");
                } else {
                    //give a alert feedback
                    let alert = require('alert');
                    alert("Please enter the correct account and password.");
                }
            } else {
                res.redirect("/login");
                console.log("No results returned");
            }
        }
    });
});

app.get("/profile", function (req, res) {
    //get the information form login table
    var sql = `SELECT * FROM login`;
    con.query(sql, function (err, results) {
        if (err) {
            res.send("A database error occurred: " + err);
        } else {
            if (results.length > 0) {
                //get username
                var username = results[0].username;
                console.log("here is profile of " + username);
                //get users photos
                const query = `SELECT * FROM photos WHERE username ="${username}"`;
                con.query(query, function (err, result) {
                    if (err) throw err;
                    if (result.length > 0) {
                        //put user's photos in a new array   
                        const images = [];
                        for (const item of result) {
                            const imgName = item.filename;
                            const imgUrl = item.url;
                            const imgUserName = item.username;
                            const imgLikes = item.likes;
                            const imgId = item.idPhoto;
                            const imgDate = item.date;
                            images.push({ imgName, imgUserName, imgUrl, imgLikes,imgId,imgDate });
                        }
                        //check the status
                        var sql = `SELECT * FROM login`;
                        con.query(sql, function (err, results) {
                            if (err) {
                                res.send("A database error occurred: " + err);
                            } else {
                                if (results.length > 0) {
                                    //check status log in
                                    console.log("Status: Log in");
                                    res.render("profile.ejs", { "username": username, "images": images });
                                } else {
                                    //check status log out
                                    console.log("Status: Log out");
                                    res.render("profile.ejs", { "username": username, "images": images });
                                }
                            }
                        });
                    } else {
                        console.log("None");
                        res.render("profile.ejs", { "username": username, images: [] });
                    }
                });
            } else {
                res.send("No results returned");
            }
        }
    });
});

app.get("/upload", function (req, res) {
    //get the information form login table
    var sql = `SELECT * FROM login`;
    con.query(sql, function (err, results) {
        if (err) {
            res.send("A database error occurred: " + err);
        } else {
            if (results.length > 0) {
                console.log(results);
                //render personal page
                var username = results[0].username;
                res.render("upload.ejs", { "username": username });
            } else {
                res.send("No results returned");
            }
        }
    });
});

app.post("/upload", function (req, res) {
    //get the information form login table
    var sql = `SELECT * FROM login`;
    con.query(sql, function (err, results) {
        if (err) {
            res.send("A database error occurred: " + err);
        } else {
            if (results.length > 0) {
                //set DB information
                var idPhoto;
                var username = results[0].username;
                console.log(username);//check the login status
                var filename = req.files.myimage.name;//get the upload pic's name
                console.log(filename);//default name
                var imgUrl;
                var likes = 0;
                var imgDate = new Date().toISOString().
                                replace(/T/, ' ').      // replace T with a space
                                replace(/\..+/, '')     // delete the dot and everything after
                            console.log("new comment content is " + imgDate);

                if (username) {
                    var sqlUsername = `SELECT COUNT(*) as count FROM photos WHERE username = "${username}"`;
                    con.query(sqlUsername, function (err, results) {
                        if (err) {
                            res.send("A database error occurred: " + err);
                        } else {
                            //this user upload how many files already
                            console.log(results[0].count);
                            var count;
                            if (results[0].count) {
                                count = results[0].count;
                            } else {
                                count = 0;
                            }
                            var newCount = count + 1;
                            //check the existing photo id
                            var sqlId = `SELECT max(idPhoto) as maxID FROM photos`;
                            con.query(sqlId, function (err, results) {
                                if (err) {
                                    res.send("A database error occurred: " + err);
                                } else {
                                    //set the new photo id
                                    console.log(results[0].maxID);
                                    idPhoto = results[0].maxID + 1;

                                    //check the file's type
                                    var extension = getExtension(filename);
                                    //if it is a normal photo type then:
                                    if (extension == "jpg" || extension == "jpeg" || extension == "png") {
                                        //rename the upload pic's name
                                        filename = username + "-" + newCount + "." + getExtension(filename);
                                        console.log(filename);

                                        //set the url
                                        imgUrl = "http://localhost:8000/uploads/" + filename;
                                        console.log(imgUrl);

                                        //save file in folder
                                        var file = req.files.myimage;
                                        file.mv("assets/uploads/" + filename);

                                        //insert data in DB
                                        var sqlPhotos = `SELECT * FROM photos`;
                                        con.query(sqlPhotos, function (err, results) {
                                            if (err) {
                                                res.send("A database error occurred: " + err);

                                            } else {
                                                var sql = `INSERT INTO photos (idPhoto, username, filename, url, likes, date) VALUES ("${idPhoto}", "${username}", "${filename}", "${imgUrl}", "${likes}", "${imgDate}")`;
                                                con.query(sql, function (err, results) {
                                                    if (err) {
                                                        res.send("Database error " + err);
                                                    } else {
                                                        console.log("Uploaded!");
                                                        res.redirect("/profile");
                                                    }
                                                });
                                            }
                                        });
                                    } else {
                                        //give a alert feedback
                                        let alert = require('alert');
                                        alert("Please upload a .jpg/.jpeg/.png file.");
                                    }
                                }
                            });
                        }
                    });
                }
            } else {
                res.send("No results returned");
            }
        }
    });
});

app.get("/logout", function (req, res) {
    //delete cookies to log out
    var sqlLog = `DELETE FROM login`;
    con.query(sqlLog, function (err, result) {
        if (err) throw err;
        console.log("Data deleted.");
        console.log("Out.");
    });
    res.redirect("/");
});

//shuffle the array: for the photos
function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

//get the extension of the file
function getExtension(filename) {
    return filename.split('.').pop();
}

// start the server
app.listen(port);
console.log("Server running on http://localhost:" + port);
