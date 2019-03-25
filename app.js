
const express = require('express');
const app = express();
//app.set('views', __dirname + '/views');
app.set('view engine','ejs');
const multer = require('multer');
const bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false })
var parseString = require('xml2js').parseString;


var ThyApiKey = "l7xx66ea9f7e7b044ec690c5423aa5eb5789";
var HereAppId = "XHKs8GRGYR0UbHLwZXM4";
var HereAppCode = "klJPvYxF8S0EbZtwvh5IOQ";

app.use(urlencodedParser);

const request = require("request");

function SI(str){
    return parseInt(str,10);
}
function con13( str ) { //2017 12 20 15 21   201903241521
    str += "";
    ans = 0;
    year = SI( str.substring( 0, 4 ) );
    mont = SI( str.substring( 4, 6 ) )-1;
    hour = SI( str.substring( 6, 8 ) );
    min = SI( str.substring( 8, 10 ) );
    sec = SI( str.substring( 10, 12 ) );

    var asd = new Date( year, mont, hour, min, sec );
    return asd.getTime();
}
function sifirkoy(str){
    if(parseInt(str,10) <= 9){
        return "0"+str;
    }
    return str;
}
function con32( date2 ) { //2017 12 20 15 21
    str = "";
    //date = new Date();
    date = new Date(date2);

    str += date.getFullYear();
    str += '-';
    str += sifirkoy(date.getMonth()+1);
    str += '-';
    str += sifirkoy(date.getDate());
    str += 'T';
    str += sifirkoy(date.getHours());
    str += ':';
    str += sifirkoy(date.getMinutes());
    str += ':00-00';
    return str;
}
function getHour(date){
    return date.substring(11,16);
}
//var x = con13( "201712201521" );


function doRequest(url) {
    return new Promise(function (resolve, reject) {
    request(url, function (error, res, body) {
        if (!error && res.statusCode == 200) {
        resolve(body);
        } else {
            resolve("Error");
        //reject(error);
        }
    });
    });
}

async function getRouteTime(StartLocation, FinishLocation, DepartureTime){
    // StartLocation = "geo!52.5,13.4";
    // FinishLocation = "geo!52.5,13.45";
   
   
   // console.log(DepartureTime);
   
   
    var query = {};
    query.uri = "https://route.api.here.com/routing/7.2/calculateroute.xml"
    query.app_id = HereAppId;
    query.app_code = HereAppCode;
    query.waypoint0 = StartLocation;
    query.waypoint1 = FinishLocation;
    query.mode = "fastest;car;traffic:enabled";
    //TODO: departure time
    query.departure = DepartureTime;


    query = "https://route.api.here.com/routing/7.2/calculateroute.json?app_id="+query.app_id+"&app_code="+query.app_code+"&waypoint0="+query.waypoint0+"&waypoint1="+query.waypoint1+"&mode="+query.mode+"&departure="+query.departure;
    //console.log(query);
    var parsedBody = await doRequest(query);
    if(parsedBody == "Error"){
        return -1;
    }
    parsedBody = JSON.parse(parsedBody);
    
    return parsedBody.response.route[0].summary.travelTime*1000;

}
async function getDepartureTime(FlightDate,FlightNumber){
    var time = "201903241925";
    return time;
}
app.get("/",async function(req,res){
    //res.render("index");
    // var asd = await getRouteTime("geo!41.044257,29.007211","geo!41.248613,28.744181","2018-07-04T17:00:00+02");
    // //console.log(result);
    // res.send(asd+"");

    var FlightDate = req.query.flightdate;
    var FlightNumber = req.query.flightnumber;
    var StartLocation = req.query.startlocation;
    var AirportName = req.query.airportname;
    var DepartureTime = req.query.departuretime;
    //StartLocation = "geo!41.044257,29.007211";

    //TODO: Get location of airport
    var FinishLocation = 0;

    if(AirportName == "IST"){
        FinishLocation = "geo!41.248613,28.744181";
    }
    FinishLocation = "geo!41.248613,28.744181";

    if(!FinishLocation || !StartLocation || !DepartureTime ){
        res.render("index",{data:""});
    }

    //TODO: Diger havalanlarini ekle


    //TODO: Get flight departure time
    //DepartureTime = await getDepartureTime(FlightDate,FlightNumber);

    //TODO: Dynamic walking delay
    var WalkingDelay = 150*60*1000;

    //1 201903241521
    //2 2018-07-04T17:00:00+02
    //3 92349238492348
    // 1-3  3-2

    //Error handling yok
    //console.log(StartLocation,FinishLocation,DepartureTime);
    var AverageRouteTime = await getRouteTime(StartLocation,FinishLocation,con32(con13( DepartureTime ) ) );
    if(AverageRouteTime == -1){
        res.render("index",{data:"Hatali bilgi girisi!"});
    }
    var PossibleAnswer = con13(DepartureTime) - AverageRouteTime;
    
    //console.log(con32(PossibleAnswer));

    var PossibleRouteTime = await getRouteTime(StartLocation,FinishLocation,con32( PossibleAnswer));    
    
    //console.log(PossibleAnswer + PossibleRouteTime + WalkingDelay ,con13( DepartureTime));

    while(PossibleAnswer + PossibleRouteTime > con13( DepartureTime)){
        PossibleAnswer -= 1*60*1000;
        var PossibleRouteTime = getRouteTime(StartLocation,FinishLocation,con32( PossibleAnswer));
    }
    var data = "Saat " + getHour(con32(con13(DepartureTime)))+"'deki ucusunuz icin en gec " + getHour(con32(PossibleAnswer-WalkingDelay)) + "'de yola cikmanizi oneririz.";
    //res.send(data);
    res.render("index",{data:data});
    //res.send(con32(PossibleAnswer-WalkingDelay));
});

app.listen(process.env.PORT || 3000, "0.0.0.0");
console.log("Connected.");
