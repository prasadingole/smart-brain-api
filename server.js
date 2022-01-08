const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const saltRounds = 10;
const app = express();
const port = 3000;
app.use(bodyParser.json());
app.use(cors());

let database;

app.get("/", (req, res) => {
    res.send(database);
})

app.listen(port, () => {
    console.log("Service is running on port 3000")
    const generatedPassword = bcrypt.hashSync("welcome@123",saltRounds);
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
    const {email,password} = req.body;
    const usr = database.users.filter(user => user.email === email)[0];
    if(usr) {
        const loginUserDetails = database.login.filter(lguser=> lguser.id === usr.id)[0];
        if(loginUserDetails) {
            bcrypt.compare(password,loginUserDetails.password,(err,result)=> {
                if(err || !result) {
                     res.status(400).json("error logging in").send() 
                } else {
                     res.json(usr).send();
                }
            })

        }   
    } else {
        res.status(400).json("error logging in").send()
    }
})

app.post("/register", (req, res) => {

    const { email, name, password } = req.body;

    database.users.push(
        {
            "id": database.nextId,
            "name": name,
            "email": email,
            "entries": 0,
            "joined": new Date()

        });

    bcrypt.hash(password, saltRounds, (err, hash) => {
        database.login.push({
            "id": database.nextId,
            "password": hash
        })
        database.nextId = database.nextId + 1;
        console.log(database)
        res.send(database.users[database.users.length - 1])
    })
})

app.get("/profile/:userId", (req, res) => {
    const { userId } = req.params;
    let usr = database.users.filter(user => user.id === parseInt(userId))[0];
    if (usr) {
        res.json(usr);
    } else {
        res.status(404).json("No user found")
    }
})

app.put("/image", (req, res) => {
    const { id } = req.body;
    let usr = database.users.filter(user => user.id === parseInt(id))[0];
    if (usr) {
        usr.entries++;;
        res.json(usr);
    } else {
        res.status(404).json("No user found")
    }
})

