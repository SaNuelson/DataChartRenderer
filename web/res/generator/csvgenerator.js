const fs = require('fs');

let namedata = fs.readFileSync("FirstNames.txt",'utf-8');
let outdata = "Name, Age, Height in cm, Weight in kg,\n";
namedata.split('\n').forEach((line)=>{
    let parts = line.split(",");
    outdata += parts[0] + ", " + Math.floor(Math.random() * 100) + ", " + Math.floor(Math.random() * 200) + ", " + Math.floor(Math.random() * 120) + ",\n";
})

fs.writeFile("people.csv", outdata, 'utf-8', ()=>{});