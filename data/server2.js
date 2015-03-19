var http = require("http");		//load http moduule
var exec = require('child_process').exec,
	util = require('util'),
	path = require('path'),
  events = require('events'),
  emitter = new events.EventEmitter(),
  fs = require('fs'),
  url = require('url');

var redis = require ("redis"),
  redisHost = 'pub-redis-11864.us-east-1-3.2.ec2.garantiadata.com',
  redisPort = 11864,
  redisOptions = {
    auth_pass : process.argv[2]             //enter redis password as second argument
  }                                         //sudo node server.js ________
  
redisClient = redis.createClient(redisPort, redisHost, redisOptions);

redisClient.on("error", function(err){      //track redis errors
  console.log("Error" + err);
});


var strem = require('stream');

var PassThrough = strem.PassThrough ||
  require('readable-stream').PassThrough;

var log = new PassThrough();

log.pipe(process.stdout);

var Docker = require("docker-exec");
var buildNode = [];

var count = 0;

function buildTracker(date, projectName) {        //object aggregates docker object, streams, and writable folder/files

  this.projectName = projectName.replace("/", "_");

  //this.dir = './history/' + projectName;

  //fs.mkdirSync(this.dir);

  //this.dir =  this.dir + '/' + date.toISOString();

  this.buildTime = date.toISOString();

  //fs.mkdirSync(this.dir);

  this.ds = new Docker();
  this.log = new PassThrough();

  this.buildPass = new PassThrough();
  this.firstTestPass = new PassThrough();
  this.secondTestPass = new PassThrough();
  this.commentCheckPass = new PassThrough();

  this.log.pipe(process.stdout);

  // this.buildStream = fs.createWriteStream("./" + this.dir + '/build.txt');
  // this.firstTestStream = fs.createWriteStream("./" + this.dir + '/firstTest.txt');
  // this.secondTestStream = fs.createWriteStream("./" + this.dir + '/secondTest.txt');
  // this.commentCheckStream = fs.createWriteStream("./" + this.dir + '/commentCheck.txt');

  this.buildStream = '';
  this.firstTestStream = '';
  this.secondTestStream = '';
  this.commentCheckStream = '';
  this.rejectStatus = '';
}

server = http.createServer(function (req, res) {		//creates http server 
    if(req.url !== "/favicon.ico") {    //to avoid double requests

	    //res.writeHead(200, {"Content-Type": "text/plain"});

	    var d = new Date();					//date object

	    console.log(d);				//log date and time to terminal 

	    console.log(req.headers);  //log headers of req object
      
      if(!!req.headers['x-github-delivery']){                       //if its a github web hook                  
          
          createBuildList(undefined, handleLibs('./www/js/site.js', res)); 

          console.log(req.method)   

          var body = '';

          req.on('data', function(data){
            body += data;

            if(body.length > 1e6) req.connection.destroy();
          });

          req.on('end', function(){
            var post = JSON.parse(body);

            count++;

            console.log(post);

            buildNode[count] = new buildTracker(d, post.repository.full_name);

            dockerRun(buildNode[count], post.repository.html_url);
            
          });

          var string = "Please visit http://".concat(req.headers.host);         //reply to github webhook with url to retreivable build status
          string = string.concat(" to view your build status and result.");

          res.end(string);                        //reponse 
        
      }else{                                                //if it's not a github webhook output build history 
          if(req.headers.referer != undefined){
          
          var reqURL = url.parse(req.headers.referer);

          console.log("Pathname" + reqURL.pathname);
          console.log(reqURL);

          if(reqURL.pathname.length > 1){

            buildPick = reqURL.pathname.substring(1, reqURL.pathname.length);

            createBuildList(parseInt(buildPick, 10), function(){
            var fsPath = './www/index.html';

            fs.readFile(fsPath, function(err, data){          //so instead just send the hwole file
            if(err){
                 res.writeHead(404,{"Content-type":"text/plain"});
                 res.end("Sorry the page was not found");
             }else{
                 res.writeHead(202,{"Content-type":"text/html"});
                 res.end(data);
             }
            });
          });
          }
         }else {                                              //builds on any request that is not a request for previous build history
          console.log("ELSE BUILDLIST")

          createBuildList(undefined, function(){
            var fsPath = './www/index.html';

            fs.readFile(fsPath, function(err, data){          //so instead just send the hwole file
            if(err){
                 res.writeHead(404,{"Content-type":"text/plain"});
                 res.end("Sorry the page was not found");
             }else{
                 res.writeHead(202,{"Content-type":"text/html"});
                 res.end(data);
             }
            });
          });                       

         }
      }

      var fsPath = './www/index.html';  //baseDirectory+requestUrl.pathname


      if (req.url.indexOf('jquery.min.js') != -1) {                               //find correct files for webapp
        handleLibs('./www/js/jquery.min.js', res);

      }else if (req.url.indexOf('bootstrap.min.js') != -1) {
        handleLibs('./www/js/bootstrap.min.js', res);

      }else if (req.url.indexOf('docs.min.js') != -1) {
        handleLibs('./www/js/docs.min.js', res);

      }else if (req.url.indexOf('ie10-viewport-bug-workaround.js') != -1) {
        handleLibs('./www/js/ie10-viewport-bug-workaround.js', res);

      }else if (req.url.indexOf('site.js') != -1) {
        handleLibs('./www/js/site.js', res);

      }else if (req.url.indexOf('bootstrap.min.css') != -1) {
        handleLibs('./www/css/bootstrap.min.css', res);

      }else if (req.url.indexOf('dashboard.css') != -1) {
        handleLibs('./www/css/dashboard.css', res);
      }else {
        fs.readFile(fsPath, function(err, data){          //so instead just send the hwole file
            if(err){
                 res.writeHead(404,{"Content-type":"text/plain"});
                 res.end("Sorry the page was not found");
             }else{
                 res.writeHead(202,{"Content-type":"text/html"});
                 res.end(data);
             }
          });
      }  
	}
});

function handleLibs(file, res){             //finds lib and returns

  fs.readFile(file, function (err, data) {
            if (err) console.log(err);
            else {
                //console.log('jquery.min.js');
                //res.setHeader("Content-Length", data.length);
                //res.setHeader("Content-Type", 'text/javascript');
                res.statusCode = 200;
                res.end(data);
            }
  });
}

server.listen(3000);				//listens to this port on guest VM

console.log("Server running on port 3000");

emitter
  .on('info', console.info)
  .on('error', console.error)
  .on('severe', function(err) {
    console.error(err);
    process.exit(1);
  });

function dockerRun(b, repoUrl){                 //run docker commands 
  
  b.ds.start({
          Image: 'meneal/buildbox'
      }).then(function (stream) {

          stream.pipe(b.log);
      // }).then(function() {                   //mounting bugs
      //     console.log('---> run -v /home/vagrant/data:/vol meneal/buildbox');                 //docker exec doesnt handle the mounting
      //     exec(util.format('sudo docker run -v /home/vagrant/data:/vol meneal/buildbox'), function (error, stdout, stderr){
      //       if(error) {
      //         emitter.emit('error', error)
      //       }
      //     });
      }).then(function () {
          console.log('---> apt-get install wget\n');
          return b.ds.run('apt-get install wget');
      }).then(function () {
          console.log('---> run apt-get update\n');
          return b.ds.run('apt-get update');
      }).then(function () {
          console.log('---> clone repo\n');
          return b.ds.run('git clone ' + repoUrl);
      }).then(function () {
          console.log('---> cd to maze');
          return b.ds.run('cd maze');
      }).then(function () {
          console.log('---> npm config set spin=false');
          return b.ds.run('npm config set spin=false');
      }).then(function () {
          console.log('---> run npm install');

          //b.log.pipe(b.buildStream);

          b.log.pipe(b.buildPass);

          b.buildPass.on('data', function(chunk){
            //assert.equal(typeof chunk, 'string');
            b.buildStream = b.buildStream + chunk;
          })

          return b.ds.run('npm install');
      // }).then(function () {                            //grunt build ommited for now
      //     console.log('---> run grunt');
      //     return b.ds.run('grunt');
      }).then(function (){
          b.log.unpipe(b.buildPass);
          b.buildPass.end();
      }).then(function (){
          console.log('--->npm install esprima');
          return b.ds.run('npm install esprima');
      }).then(function (){
          console.log('--->npm install underscore');
          return b.ds.run('npm install underscore');
      }).then(function (){
          console.log('--->npm test');
          // b.log.pipe(b.firstTestStream);

          b.log.pipe(b.firstTestPass);

          b.firstTestPass.on('data', function(chunk){
            //assert.equal(typeof chunk, 'string');
            b.firstTestStream = b.firstTestStream + chunk;
          })

          return b.ds.run('npm test');
      }).then(function (){
          b.log.unpipe(b.firstTestPass);
          b.firstTestPass.end();
      }).then(function (){                            
          console.log('---->  wget  https://raw.githubusercontent.com/Wildtrack/Server/Test/data/main.js');  
          return b.ds.run('wget https://raw.githubusercontent.com/Wildtrack/Server/Test/data/main.js');
      }).then(function (){
          console.log('----> node main.js backtrack.js');
          return b.ds.run('node main.js backtrack.js');
      }).then(function (){
          console.log('----> npm test');
          //b.log.pipe(b.secondTestStream);

          b.log.pipe(b.secondTestPass)

          b.secondTestPass.on('data', function(chunk){
            //assert.equal(typeof chunk, 'string');
            b.secondTestStream = b.secondTestStream + chunk;
          })

          return b.ds.run('npm test');
      }).then(function (){
          b.log.unpipe(b.secondTestPass);
          b.secondTestPass.end();
       }).then(function (){                             
          console.log('---->  wget  https://raw.githubusercontent.com/Wildtrack/Server/Test/data/commentCheck.js');  
          return b.ds.run('wget  https://raw.githubusercontent.com/Wildtrack/Server/Test/data/commentCheck.js')
      }).then(function (){
          console.log('node commentCheck.js backtrack.js main.js maze.js mazeMenu.js mazeModel.js mazeRender.js trailModel.js');
          //b.log.pipe(b.commentCheckStream);
          
          b.log.pipe(b.commentCheckPass);

          b.commentCheckPass.on('data', function(chunk){
            //assert.equal(typeof chunk, 'string');
            b.commentCheckStream = b.commentCheckStream + chunk;
          })

          return b.ds.run('node commentCheck.js backtrack.js main.js maze.js mazeMenu.js mazeModel.js mazeRender.js trailModel.js');
      }).then(function (){
          b.log.unpipe(b.commentCheckPass);
          b.commentCheckPass.end();
      }).then(function (){
          console.log("---> checking rejection status");
          rejectionCheck(b);
      }).then(function (){
          console.log("sending to redis")
          redisSend(b);
      }).then(function (code){
          console.log('Run done with exit code: ' + code);
          return b.ds.stop();
      }).then(function () {
          console.log('---> Done without error\n');
          //done();
      }).catch(function (err) {
          console.log('Done with error\n');
          console.log(err);
      });

}

function redisSend(b){

  redisClient.hmset( b.projectName, b.buildTime, JSON.stringify({
    build: b.buildStream,
    firstTest: b.firstTestStream,
    secondTest: b.secondTestStream,
    commentCheck: b.commentCheckStream,
    reject: b.rejectStatus
  }))

}

function createBuildList(build, callback){

  //var files = fs.readdirSync('./history')

  var name = 'Wildtrack_maze';  //will implement multiple project in next update

  redisClient.hgetall(name, function(err, files) {
    //console.log(files);
    console.log("Grabbed object from redis")

    var str = '';

    var i = 0;
    for(key in files){

      str = str + '\n $(".placeholder").append(' + "'<li><a href=" + '"' + i + '">' + key + "</a></li>');";
      i++;
    }

    console.log(str);

    if(build != undefined){
      buildObject = JSON.parse(files[key]);
    // } 

    // if(build != undefined  && buildObject.hasOwnProperty('')){
      //var dirPath = './history/' + files[build];

      data = buildObject.build;                                //probably use Sync instead

      str = str + textToHtml(data, ".buildHERE");

      data = buildObject.firstTest;                                  //probably use Sync instead

      str = str + textToHtml(data, ".testHERE");

      data = buildObject.secondTest;                                  //probably use Sync instead

      str = str + textToHtml(data, ".secondtestHERE");

      data = buildObject.commentCheck ;                                 //probably use Sync instead

      str = str + textToHtml(data, ".commentcheckHERE");

      data = buildObject.reject;

      str = str + textToHtml(data, ".rejectHERE");

      fs.writeFileSync('./www/js/site.js', str);

        callback;

   

    }else{
      fs.writeFileSync('./www/js/site.js', str);

        callback;

      
    }         //create build history list for webapp

  });

  
}

function textToHtml(data, tag){

  var str = ''

  data = data.toString().replace(/['"]+/g, '');

  while(data.indexOf('\n') != -1){
        index = data.indexOf('\n')

        temp = data.substring(0, index).replace(/[\r]+/g, '');

        if(temp != ''){
          str = str + '\n $("' + tag + '").append(' + "'<p>" + temp + "<\p>');";
        }

        data = data.substring(index+1, data.length);
  }        

  temp = data.replace(/[\r]+/g, '');                              

  str = str + '\n $("' + tag + '").append(' + "'<p>" + temp + "<\p>');";

  return str;          //generating html friendly text for webapp 
}

function rejectionCheck(b){     //checks rejection gate for build

  //data = fs.readFileSync( b.dir  + '/secondTest.txt').toString();

  data = b.secondTestStream;

  data = data.replace(/[\r]+/g, '');
  data = data.replace(/[\n]+/g, '');
  data = data.replace(/[ ]+/g, '');

  index = data.indexOf('Statements:');

  coverage = data.substring(index+11, index + 16);

  percent = parseFloat(coverage, 10);

  //data = fs.readFileSync( b.dir  + '/commentCheck.txt').toString();

  data = b.commentCheckStream;

  data = data.replace(/[\r]+/g, '');
  data = data.replace(/[\n]+/g, '');
  data = data.replace(/[ ]+/g, '');

  var perFuncTotal = 0;
  var count = 0

  while(data.indexOf('function') != -1){
    count++;

    index = data.indexOf('function');

    substrperfunction = data.substring(index+8, index+13);

    perFuncTotal = perFuncTotal + parseFloat(substrperfunction, 10);

    data = data.substring(index+8, data.length);
  }

  perFunc = perFuncTotal / count;

  if(percent < 50  || perFunc < 3){ 
      
      str = "Rejected";

      if(percent < 50){
        str = str + "\nStatement Coverage below 50%";
      }

      if(perFunc < 3){
        str = str + "\nNumber of line comments per function less than 3";
      }

  }else {str = "Accepted"}

  //fs.writeFileSync(b.dir + '/reject.txt', str);  

  b.rejectStatus = str;             
}

//createBuildList(undefined);

 
// Used by exec to print the result of executing a subprocess.
function puts(error, stdout, stderr) {
  if (error) {
    emitter.emit('error', error);
  } else {
    emitter.emit('info', stdout.trim());
    if (stderr) {
      emitter.emit('error', stderr.trim());
    }
  }
}



//-----------------------

function traverse(object, visitor)      //vistor pattern
{
    var key, child;

    visitor.call(null, object);
    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null) {
                traverse(child, visitor);
            }
        }
    }
}


