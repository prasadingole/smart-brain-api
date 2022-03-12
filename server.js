const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const knex = require('knex');
const Clarifai = require('clarifai');
const appConfig = require('./appConfig.js');
const { response } = require('express');
const saltRounds = 10;
const app = express();
const port = 3000;

const clarifaiApp = new Clarifai.App({
    apiKey: appConfig.clarifaiKey
});

const db = knex(appConfig.dbConfig);

app.use(bodyParser.json());
app.use(cors());

db.select('*').from('users');

app.listen(port, () => {
    console.log("Service is running on port 3000")
})


app.post("/signin", (req, res) => {
    const { email, password } = req.body;
    db.select('email', 'hash').from('login').where('email', '=', email)
        .then(data => {
            if (data.length == 1) {
                const { email, hash } = data[0];
                console.log(data[0]);
                if (bcrypt.compareSync(password, hash)) {
                    console.log("User ok")
                    db.select("*")
                        .from("users")
                        .where('email', '=', email)
                        .then(data => res.json(data[0]).send());
                } else {
                    res.status(400).json('error is loggin process').send();
                }
            } else {
                res.status(400).json('error is loggin process').send();
            }
        }).catch(err => res.status(400).json('error is loggin process').send())
})

app.post("/register", (req, res) => {

    const { email, name, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, saltRounds);
    db
        .transaction(trx => {
            trx.insert({
                hash: hashedPassword,
                email: email
            }).into('login')
                .returning('email')
                .then(loginEmail => {
                    trx('users')
                        .returning('*')
                        .insert({
                            "name": name,
                            "email": loginEmail[0],
                            "entries": 0,
                            "joined": new Date()
                        }).then(response => res.json(response[0]))
                }).then(trx.commit)
                .catch(trx.rollback)
        })
        .catch(error => res.json("Unable to add this user"));
})

app.get("/profile/:userId", (req, res) => {
    const { userId } = req.params;
    db.select('*').from('users').where({
        "id": userId
    })
        .then(response => {
            if (!response.length) {
                res.status(404).json("No user found")
            } else {
                res.json(response[0])
            }
        })
        .catch(error => res.status(404).json("No user found"))
})

app.put("/image", (req, res) => {
    let finalResponse = {};
    const { id, imageUrl } = req.body;
    console.log("id", id);
    console.log("imageUrl", imageUrl);
    clarifaiApp
        .models
        .predict(Clarifai.FACE_DETECT_MODEL, imageUrl)
        .then(response => {
            console.log(response.outputs);
        
        db('users')
        .where('id', '=', id)
        .increment('entries', 1)
        .returning("*")
        .then(user => {
            console.log(user);
            Object.assign(finalResponse, { "entries": user[0].entries,faceDetectionResponse: response });
            res.json(finalResponse);
        })
        .catch(err => res.status(400).json('entry could not be updated'))
        });
})



