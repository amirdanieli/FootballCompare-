const express = require('express');
const path = require('path');
const Joi = require('joi');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const catchAsync = require('./utils/catchAsync');
const requireLogin = require('./utils/requireLogin');
const ExpressError = require('./utils/ExpressError');
const { error } = require('console');
const User = require('./models/user')
const bcrypt = require('bcrypt')
const session = require('express-session');
const crypto = require('crypto');
const flash = require('connect-flash');
const helmet = require('helmet');

mongoose.connect('mongodb://localhost:27017/transferSuggestor');

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected!");
});

function generateRandomString(length) {
    return crypto.randomBytes(length).toString('hex');
  }
  
const randomSecret = generateRandomString(32);

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use('/utils', express.static('utils'));

const jsonFilePath = path.join(__dirname, 'data', 'all_pl_player_data.json');
app.use('/data', express.static(path.join(__dirname, 'data')));

const sessionConfig = {
    name: 'session',
    secret: randomSecret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(express.static(path.join(__dirname, 'data')));
app.use(session(sessionConfig));
app.use(flash());
app.use(helmet({ contentSecurityPolicy: false })); 

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})


app.get('/', (req, res) => {
    const sessionIsActive = !!req.session.user_id; 
    res.render('home', { user_id: sessionIsActive });
})

app.get('/pages/login', (req, res) => {
    const sessionIsActive = !!req.session.user_id;
    res.render('pages/login', { user_id: sessionIsActive });
})

app.post('/login', catchAsync(async (req, res) => { 
    const loginSchema = Joi.object({
        user: Joi.object({
            email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'edu', 'gov'] } }).required(),
            password: Joi.string()
            .pattern(/^[^\s]{3,30}$/).required().min(8),
        })
    })
    const {error} = loginSchema.validate(req.body);
    if(error){
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    }

    const foundUser = await User.findAndValidate(req.body.user.email, req.body.user.password);
    if (foundUser) {
    req.flash('success', 'Welcome ' + foundUser.fName + "! You've succesfully logged in!");

        req.session.user_id = foundUser._id;
        const returnTo = req.session.returnTo || '/';
        res.redirect(returnTo);

        delete req.session.returnTo;
    }

    req.flash('error', 'Invalid credentials');
    res.redirect('/pages/login');
}));

app.get('/pages/register', (req, res) => {
    const sessionIsActive = !!req.session.user_id; 
    res.render('pages/register', { user_id: sessionIsActive })
})


app.post('/register', catchAsync(async (req, res, next) => {
    const registerSchema = Joi.object({
        user: Joi.object({
            fName: Joi.string().required(),
            lName: Joi.string().required(),
            email: Joi.string()
        .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net', 'org', 'edu', 'gov'] } }).required(),
            password: Joi.string()
        .pattern(/^[^\s]{3,30}$/).required().min(8),
        })
    })
    const {error} = registerSchema.validate(req.body);
    if(error){
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    }
    const user = new User(req.body.user);
    await user.save();
    req.flash('success', 'Welcome! Registered successfully')
    req.session.user_id = user._id;
    res.redirect('/');
}))

app.post('/logout', (req, res) => {
    req.session.user_id = null;
    req.flash('success', 'Logged out successfully');
    res.redirect('/');
})

app.get('/pages/playercompare', requireLogin, (req, res) => {
    const sessionIsActive = !!req.session.user_id; 
    res.render('pages/playerCompare', { user_id: sessionIsActive });
})

app.get('/pages/radarChart', requireLogin, (req, res) => {
    const sessionIsActive = !!req.session.user_id; 
    res.render('pages/radarChart', { user_id: sessionIsActive });
})

app.get('/pages/transferSuggest', requireLogin, (req, res) => {
    const sessionIsActive = !!req.session.user_id; 
    res.render('pages/transferSuggest', { user_id: sessionIsActive });
})

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found!', 404))
});

app.use((err, req, res, next) => {
    const sessionIsActive = !!req.session.user_id; 
    const {message = 'Something went wrong', statusCode = 500 } = err;
    res.status(statusCode).render('../utils/error', { err, user_id: sessionIsActive });
})


app.listen(3000, () => {
    console.log("Serving on port 3000!")
})