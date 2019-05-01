const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session =  require('express-session');

const app = express();

// app.set('trust proxy', 1);  // trust first proxy, If you have your node.js behind a proxy and are using secure: true, you need to set "trust proxy"
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));

mongoose.Promise = Promise;
mongoose.connect('mongodb://localhost:27017/learnangulardb',{ useNewUrlParser: true }).then(()=>{
    console.log('Mongoose is up')
});

const User = require('./models/users');

app.use(bodyParser.json());

app.get('/', (req,res)=>{
    res.json({message:"Learn Angular API"})
});

app.post('/api/login', async (req,res)=>{
    
    const email = req.body.username;
    const password = req.body.password;

    const result = await User.findOne({email,password})

    if (!result){
        // user login is incorrect
        console.log("incorrect details");
        res.json({success: false, message:"Incorrect credentials"})
    } else {
        // make a session and set user to logged in
        console.log("loggin you win");
        res.json({success: true})
        req.session.user = email;
        req.session.save();
        console.log("current session for: "+req.session.user);
    }
});

app.get('/api/isloggedin', (req,res)=>{
    console.log("User logged in is: "+ req.session.user);
    res.json({
        status: !!req.session.user
    });
});

app.post('/api/register', async (req,res)=>{
    
    const email = req.body.username;
    const password = req.body.password;

    const existingUser = await User.findOne({email});

    if (existingUser){
        res.json({success: false, message:"Email already in use"})
        return;
    }

    // hash pwd before saving
    // store data in database
    const user = new User({
        email,
        password
    })

    const result = await user.save()
    
    res.json({success: true, message: "Welcome"});
})

app.get('/api/datac', async (req,res)=>{
    
    const currentUser = req.session.user;
    
    const user = await User.findOne({email: currentUser});

    if (!user){
        res.json({status: false, message: 'User does not exist'});
        return
    }

    res.json({status: true, email: req.session.user, quote: user.quote});
});

app.get('/api/logout', (req,res)=>{
    // req.session.user = undefined;
    // req.session.save();
    // or we can use session.destroy()
    req.session.destroy();
    res.json({success: true})
});

app.post('/api/quote', async (req,res)=>{
    console.log('current session: '+ req.session.user, req.body.value)
    const userData = await User.findOne({email: req.session.user})
    if (!userData){
        res.json({success: false, message: 'Invalid user!'})
    } else {
        await User.update({email: req.session.user},{ $set: {quote: req.body.value}});
        res.json({success: true})
    }
});

app.listen(1234, ()=> console.log('Server listening at 1234'));