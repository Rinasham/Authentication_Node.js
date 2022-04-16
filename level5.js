// cookie and session
require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
const passport = require('passport')
const session = require('express-session')
const passportLocalMongoose = require('passport-local-mongoose')
// passport-localはrequireしなくて大丈夫


const app = express()


app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({extended: true}))
app.use(express.static('public'))

//----------------- cookie and session setup 1 ---------------------

const secret = process.env.SECRET5

app.use(session({
  secret:secret,
  resave: false,
  saveUninitialized: true
}))

app.use(passport.initialize())
app.use(passport.session())

//-----------------------------------------------

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true})

//----------------- cookie and session setup 2 ---------------------

const userSchema = new mongoose.Schema({
  email: String,
  password: String
})

userSchema.plugin(passportLocalMongoose)

const User = new mongoose.model('User', userSchema)

passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

//-----------------------------------------------


app.get('/', (req, res)=> {
  res.render('home')
})

app.get('/login', (req, res)=> {
  res.render('login')
})

app.post('/login', (req, res) => {
  const user = new User({
    username : req.body.username,
    password : req.body.password
  })
  req.login(user, (err)=>{
    if(err){
      console.log(err)
    } else {
      passport.authenticate('local')(req, res, function(){
        console.log('authenticationの中')
        res.redirect('/secrets')
      })
    }
  })
})

app.get('/register', (req, res)=> {
  res.render('register')
})

app.post('/register', (req, res)=> {

  User.register({username : req.body.username},
    req.body.password,
    (err, user)=>{
      console.log('authenticationの前、登録直後');
      if(err){
        console.log(err)
        res.redirect('/register')
      } else {
        passport.authenticate('local')(req, res, function(){
          console.log('authenticationの中')
          res.redirect('/secrets')
        })
      }
  })
})

app.get('/secrets', (req, res)=>{
  console.log('secretsにredirect中');
  if(req.isAuthenticated()){
    res.render('secrets')
  } else {
    res.redirect('/login')
  }
})

app.get('/logout', (req,res)=>{
  req.logout()
  res.redirect('/')
})



app.listen(3000, () =>{
  console.log('Server is running on port 3000.');
})