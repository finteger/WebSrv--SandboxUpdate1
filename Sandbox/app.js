const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const fs = require('fs');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const Student = require('./student.js');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();

// Our secret key is a simple text string.
const secretKey = 'your_secret_key'; 


//Use the body-parser middleware
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json());


app.set('views', './views');
app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(express.static('public/images'));
app.use(express.static('public/css'));

const url = `mongodb+srv://<your username>:<yourpassword>@cluster0.7as6vrs.mongodb.net/students`;

const connectionParams={
    useNewUrlParser: true,
    useUnifiedTopology: true
}



mongoose.connect(url, connectionParams)
 .then(() => {
    console.log('Connected to MongoDB cluster.')
 })
 .catch(() =>{
    console.log(`Error connecting to the database. n${err}`);
 });





 //High-level middleware function that verifies jwt.  
function authenticateToken(req, res, next){

    const token = req.cookies.jwt;

    if(token){

    jwt.verify(token, secretKey, (err, decoded) =>{

       if(err) {
        res.status(401).send('Invalid token');
       }    
       req.userId = decoded;
    })

} else {




}


}








app.get('/', (req, res) => {

    try{
       res.render('login.ejs');

    } catch(err){

        res.send('Server error.  Please try again later.');

    }

});


app.get('/home', async (req, res) => {

    const students = await Student.find({});
    const maxAttendanceCount = Math.max(...students.map(s => s.attendanceCount));

   res.render('attendance.ejs', { students, maxAttendanceCount});

});




app.post('/login', async function(req, res, next){



   //shorthand: const {email, password} = req.body;

   const email = req.body.email;
   const password = req.body.password;

   //Find user in the database by email
   const user = await Student.findOne({ email });

   if(!user){
   //User not found
   res.status(401).send('Invalid username or password.');
   return;
   }


   //Compare the provided password with the hashes password in the user object
   bcrypt.compare(password, user.password, (err, result) => {


   if (err){
       //Something went wrong during comparison
       console.error('Error while comparing passwords:', err);
       res.status(500).send('Internal server error');
       return;
   }

   
   if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
       return next(new Error('Invalid email address.'));
   }

   if(!password || password.length < 8){
       res.send('Password must be at least 8 characters.');
   }

   console.log(result);

   if(result){
      // Passwords match, login successful
       res.redirect('/home');

   } else {

       //Passwords do not match
       res.status(401).send('Invalid username or password'); 
     
    }

    });
});


app.get('/register', (req, res) =>{

res.render('register');

});


app.post('/register', async (req, res) => {

const {email, password, confirmPassword} = req.body;


const user  = await Student.findOne({email});

if(user){
    res.status(400).send('Username already exists.  Please try again.');
    return;
}


//Check if the passwords and confirm password match
if(password !== confirmPassword){
 res.status(400).send('Passwords do not match.');
 return;
}

//Hash the password before saving it
bcrypt.hash(req.body.password, 10, (err, hashedPassword) =>{

const user = new Student({
    email: req.body.email,
    password: hashedPassword,
});

user.save();

res.redirect('/login');

if (err){
   //Something went wrong during hashing
   console.error('Error while hashing password:', err);
   res.status(500).send('Internal server error');
    return;
}

});
});





const port = 3000;

app.listen(port, () =>{

console.log(`Successfully connected to http://localhost:${port}`);

})
