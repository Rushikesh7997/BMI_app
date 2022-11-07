const express = require("express")
const cors = require("cors")

const {connection} = require("./config/db")
const {UserModel} = require("./models/UserModal")
const bcrypt = require('bcrypt')
const jwt = require("jsonwebtoken")
const { authentication } = require("./middlewares/authenticatons")
const { BMIModel } = require("./models/BMIModel")
require("dotenv").config()

const app = express();

app.use(cors())
app.use(express.json())

app.get("/", (req,res)=>{
    res.send("hello")
})


// signup -> 1. /register or /signup - name, email, password
app.post("/signup", async (req,res)=>{
    const { name, email, password } = req.body 
    // console.log(name,email,password) 

    const isUser = await UserModel.findOne({email})
    if(isUser){
        res.send({"msg": "User already exist, try another email or try to login"})
    }
    else{
        bcrypt.hash(password,4, async function(err,hash){
            if(err){
                res.send({"msg" : "Something went wrong,please try again later"})
            }
            const new_user = new UserModel({
                name,
                email,
                password : hash
            })
            try{
                await new_user.save()
                res.send({"msg" : "sign up successfull"})
            }
            catch(err){
                res.send({"msg":"something went wrong, try again "})
            }
        })
    }
})

// login -> 2. /login - email, password
app.post("/login",async (req,res)=>{
    const {email,password} = req.body;
    const user = await UserModel.findOne({email})
    const hashed_password = user.password;
    const user_id = user._id;
    console.log(user)
    console.log(user_id)
    bcrypt.compare(password, hashed_password, function(err,result){
        if(err){
            res.send("something went wrong,try again later")
        }
        if(result){
            const token = jwt.sign({user_id : user}, process.env.SECRET_KEY )
            res.send({message:"Login successful", token})
        }
        else{
            res.send("login failed")
        }
    })
})

// get profile -> 3. /getProfile - name, email from the DB -
app.get("/getProfile", authentication,async (req,res)=>{
    const {user_id} = req.body 
    const user =await UserModel.findOne({_id:user_id})
    // console.log(user)
    const {name, email} = user
    res.send({name,email})
})

// calculate BMI -> 4. /calculateBMI - height(in feet), weight(kgs) -> O/P -> BMI value -> weight/(height^2) [height in m]
app.post("/calculateBMI", authentication, async (req,res)=>{
    const {height, weight, user_id} = req.body;
    const height_in_meter = Number(height)*0.3048
    const BMI = Number(weight)/(height_in_meter)**2
    const new_bmi = new BMIModel({
        BMI,
        height : height_in_meter,
        weight,
        user_id
    })
    await new_bmi.save();
    res.send({BMI})
})

// 5. /getCalculation - send History -> send all previous BMI data of that particular user
app.get("/getCalculation", authentication, async (req,res)=>{
    const {user_id} = req.body;
    const all_bmi = await BMIModel.find({user_id:user_id})
    res.send({history:all_bmi})
})


// 6. logout -> clear token on the frontend

app.listen(8000,async ()=>{
    try{
        await connection 
        console.log("connection to db sucessfully")
    }
    catch(err){
        console.log("error connction in db")
        console.log(err)
    }
    console.log("listening on port 8000")
})