// OAuth with Google
require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
const passport = require('passport')
const session = require('express-session')
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const findOrCreate = require('mongoose-findorcreate')


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
  password: String,
  googleId: String
})

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = new mongoose.model('User', userSchema)

passport.use(User.createStrategy())

passport.serializeUser(function(user, done) {
  done(null, user.id)
})

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user)
  })
})


// OAuth 2.0 ----------

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/authentication",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

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


app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }))

// calback from Google Authentication
app.get('/auth/google/authentication',
passport.authenticate('google', { failureRedirect: '/login' }),
function(req, res) {
  // Successful authentication, redirect secrets page.
  res.redirect('/secrets')
})


app.get('/logout', (req,res)=>{
  req.logout()
  res.redirect('/')
})



app.listen(3000, () =>{
  console.log('Server is running on port 3000.');
})