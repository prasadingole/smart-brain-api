const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const knex = require('knex');
const appdb = require('./dbconfig.js');
const { response } = require('express');
const saltRounds = 10;
const app = express();
const port = 3000;

const db = knex(appdb.config);

app.use(bodyParser.json());
app.use(cors());

db.select('*').from('users');

let database;

app.get("/", (req, res) => {
    res.send(database);
})

app.listen(port, () => {
    console.log("Service is running on port 3000")
    const generatedPassword = bcrypt.hashSync("welcome@123", saltRounds);
    database = {
        "users":
            [
                {
                    "id": 111,
                    "name": "John",
                    "email": "john@gmail.com",
                    "entries": 0,
                    "joined": new Date()
                }, {
                    "id": 112,
                    "name": "Sarah",
                    "email": "sarah@gmail.com",
                    "entries": 0,
                    "joined": new Date()
                },
            ],
        "login": [{
            "id": 111,
            "password": generatedPassword
        },
        {
            "id": 112,
            "password": generatedPassword
        }],
        "nextId": 113,


    }

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
    const { id } = req.body;
    console.log("id", id)
    db('users')
        .where('id', '=', id)
        .increment('entries', 1)
        .returning("*")
        .then(user => res.json(user[0]))
        .catch(err => res.status(400).json('entry could not be updated'));
})

