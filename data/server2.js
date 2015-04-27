var http = require("http");		//load http moduule
var exec = require('child_process').exec,
	util = require('util'),
	path = require('path'),
  events = require('events'),
  emitter = new events.EventEmitter(),
  fs = require('fs'),
  url = require('url');

var canary = false;

var strem = require('stream');

var PassThrough = strem.PassThrough ||
  require('readable-stream').PassThrough;

var log = new PassThrough();

log.pipe(process.stdout);

var Docker = require("docker-exec");
var Dockerode = require('dockerode');

var docker = new Dockerode();
var buildNode = [];

var count = 0;

function buildTracker(date) {        //object aggregates docker object, streams, and writable folder/files

  this.name = date.toISOString();

  this.dir = './history/' + this.name;



  fs.mkdirSync(this.dir);

  this.ds = new Docker();
  this.log = new PassThrough();

  this.log.pipe(process.stdout);

  this.buildStream = fs.createWriteStream("./" + this.dir + '/build.txt');
  this.firstTestStream = fs.createWriteStream("./" + this.dir + '/firstTest.txt');
  this.secondTestStream = fs.createWriteStream("./" + this.dir + '/secondTest.txt');
  this.commentCheckStream = fs.createWriteStream("./" + this.dir + '/commentCheck.txt');

  this.imageId = '';
  this.imageAlias = '';

  this.accepted = false;

  this.canary = false;
}

server = http.createServer(function (req, res) {		//creates http server 
    if(req.url !== "/favicon.ico") {    //to avoid double requests

	    //res.writeHead(200, {"Content-Type": "text/plain"});

	    var d = new Date();					//date object

	    console.log(d);				//log date and time to terminal 

	    console.log(req.headers);  //log headers of req object
      
      if(!!req.headers['x-github-delivery']){                       //if its a github web hook                  
          
          createBuildList(undefined); 

          var body = ''

          req.on('data', function(data){

            body += data;

            if(body.length > 1e6) req.connection.destroy();

          }); 

          req.on('end', function(){

            post = JSON.parse(body);

            console.log(post.repository.url)

            buildNode[count] = new buildTracker(d);

            if(post.head_commit){
              console.log(post.head_commit.message)

              var message = post.head_commit.message;

              if(message.indexOf('canary') != -1){
                buildNode[count].canary = true;
              }
            }
            dockerRun(buildNode[count]);

            count++;

          })                       

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

            createBuildList(parseInt(buildPick, 10));
          }
         }else {                                              //builds on any request that is not a request for previous build history

          createBuildList(undefined);                       

         }
      }

      var fsPath = './www/index.html';  //baseDirectory+requestUrl.pathname


      if (req.url.indexOf('jquery.min.js') != -1) {                               //find correct files for webapp
        fs.readFile('./www/js/jquery.min.js', function (err, data) {
            if (err) console.log(err);
            else {
                console.log('jquery.min.js');
                res.setHeader("Content-Length", data.length);
                res.setHeader("Content-Type", 'text/javascript');
                res.statusCode = 200;
                res.end(data);
            }
        });
      }else if (req.url.indexOf('bootstrap.min.js') != -1) {
        fs.readFile('./www/js/bootstrap.min.js', function (err, data) {
            if (err) console.log(err);
            else {
                console.log('bootstrap.min.js');
                res.setHeader("Content-Length", data.length);
                res.setHeader("Content-Type", 'text/javascript');
                res.statusCode = 200;
                res.end(data);
            }
        });
      }else if (req.url.indexOf('docs.min.js') != -1) {
        fs.readFile('./www/js/docs.min.js', function (err, data) {
            if (err) console.log(err);
            else {
                console.log('docs.min.js');
                res.setHeader("Content-Length", data.length);
                res.setHeader("Content-Type", 'text/javascript');
                res.statusCode = 200;
                res.end(data);
            }
        });
      }else if (req.url.indexOf('ie10-viewport-bug-workaround.js') != -1) {
        fs.readFile('./www/js/ie10-viewport-bug-workaround.js', function (err, data) {
            if (err) console.log(err);
            else {
                console.log('ie10-viewport-bug-workaround.js');
                res.setHeader("Content-Length", data.length);
                res.setHeader("Content-Type", 'text/javascript');
                res.statusCode = 200;
                res.end(data);
            }
        });
      }else if (req.url.indexOf('site.js') != -1) {
        fs.readFile('./www/js/site.js', function (err, data) {
            if (err) console.log(err);
            else {
                console.log('site.js');
                res.setHeader("Content-Length", data.length);
                res.setHeader("Content-Type", 'text/javascript');
                res.statusCode = 200;
                res.end(data);
            }
        });
      }else if (req.url.indexOf('bootstrap.min.css') != -1) {
        fs.readFile('./www/css/bootstrap.min.css', function (err, data) {
            if (err) console.log(err);
            else {
                console.log('/misc/myscript.js: fs.readFile is successful');
                res.setHeader("Content-Length", data.length);
                res.setHeader("Content-Type", 'text/css');
                res.statusCode = 200;
                res.end(data);
            }
        });
      }else if (req.url.indexOf('dashboard.css') != -1) {
        fs.readFile('./www/css/dashboard.css', function (err, data) {
            if (err) console.log(err);
            else {
                console.log('/misc/myscript.js: fs.readFile is successful');
                res.setHeader("Content-Length", data.length);
                res.setHeader("Content-Type", 'text/css');
                res.statusCode = 200;
                res.end(data);
            }
        });
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

server.listen(80);				//listens to this port on guest VM

console.log("Server running on port 3000");

emitter
  .on('info', console.info)
  .on('error', console.error)
  .on('severe', function(err) {
    console.error(err);
    process.exit(1);
  });

function dockerRun(b){                 //run docker commands 
  
  b.ds.start({
          Image: 'meneal/buildbox'
      }).then(function (stream) {

          stream.pipe(b.log);

          docker.listContainers(function (err, containers) {                //get docker info
            
            b.imageId = containers[0].Id
            b.imageAlias = containers[0].Names[0].substring(1, containers[0].Names[0].length)

            containers.forEach(function (containerInfo) {
            //   //docker.getContainer(containerInfo.Id).stop(cb);

              console.log(containerInfo)

            //   b.imageId = containerInfo[0].Id                      //most recent container
            });
          });
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
          return b.ds.run('git clone https://github.com/Wildtrack/maze.git');
      }).then(function () {
          console.log('---> cd to maze');
          return b.ds.run('cd maze');
      }).then(function () {
          console.log('---> npm config set spin=false');
          return b.ds.run('npm config set spin=false');
      }).then(function () {
          console.log('---> run npm install');
          b.log.pipe(b.buildStream);
          return b.ds.run('npm install');
      // }).then(function () {                            //grunt build ommited for now
      //     console.log('---> run grunt');
      //     return b.ds.run('grunt');
      }).then(function (){
          b.log.unpipe(b.buildStream);
          b.buildStream.end();
      }).then(function (){
          console.log('--->npm install esprima');
          return b.ds.run('npm install esprima');
      }).then(function (){
          console.log('--->npm install underscore');
          return b.ds.run('npm install underscore');
      }).then(function (){
          console.log('--->npm test');
          b.log.pipe(b.firstTestStream);
          return b.ds.run('npm test');
      }).then(function (){
          b.log.unpipe(b.firstTestStream);
          b.firstTestStream.end();
      }).then(function (){                             //since mounting is not working this won't work
          console.log('---->  wget  https://raw.githubusercontent.com/Wildtrack/Server/Test/data/main.js');  
          return b.ds.run('wget https://raw.githubusercontent.com/Wildtrack/Server/Test/data/main.js');
      }).then(function (){
          console.log('----> node main.js backtrack.js');
          return b.ds.run('node main.js backtrack.js');
      }).then(function (){
          console.log('----> npm test');
          b.log.pipe(b.secondTestStream);
          return b.ds.run('npm test');
      }).then(function (){
          b.log.unpipe(b.secondTestStream);
          b.secondTestStream.end();
       }).then(function (){                             //since mounting is not working this won't work
          console.log('---->  wget  https://raw.githubusercontent.com/Wildtrack/Server/Test/data/commentCheck.js');  
          return b.ds.run('wget  https://raw.githubusercontent.com/Wildtrack/Server/Test/data/commentCheck.js')
      }).then(function (){
          console.log('node commentCheck.js backtrack.js main.js maze.js mazeMenu.js mazeModel.js mazeRender.js trailModel.js');
          b.log.pipe(b.commentCheckStream);
          return b.ds.run('node commentCheck.js backtrack.js main.js maze.js mazeMenu.js mazeModel.js mazeRender.js trailModel.js');
      }).then(function (){
          b.log.unpipe(b.commentCheckTestStream);
          b.commentCheckStream.end();
      }).then(function (){
          console.log("---> checking rejection status");
          rejectionCheck(b);
      }).then(function (code) {
          console.log('Run done with exit code: ' + code);
          
          if(b.accepted){
             console.log('node maze/server.js &')
             exec(util.format('sudo docker run ' + b.imageAlias + ' node maze/server.js'), function(err, output){

              if(err){
                console.log(err)
              }

              console.log('dockercommit');
              dockerCommit(b);
             })

             //return b.ds.run('node maze/server.js &');
           }else{
            return b.ds.stop();
           }

      // }).then(function(){

          

      }).then(function () {
          console.log('---> Done without error\n');
          //done();
      }).catch(function (err) {
          console.log('Done with error\n');
          console.log(err);
      });

}

function createBuildList(build){

  var files = fs.readdirSync('./history')

  var str = '';

  for(var i = 1; i < files.length; i++){

    str = str + '\n $(".placeholder").append(' + "'<li><a href=" + '"' + i + '">' + files[i] + "</a></li>');";
  }

  console.log(str);

  if(build != undefined  && fs.existsSync('./history/' + files[build] + '/reject.txt')){
     var dirPath = './history/' + files[build];

     data = fs.readFileSync(dirPath + '/build.txt')                                  //probably use Sync instead

     str = str + textToHtml(data, ".buildHERE");

     data = fs.readFileSync(dirPath + '/firstTest.txt')                                  //probably use Sync instead

     str = str + textToHtml(data, ".testHERE");

     data = fs.readFileSync(dirPath + '/secondTest.txt')                                  //probably use Sync instead

     str = str + textToHtml(data, ".secondtestHERE");

     data = fs.readFileSync(dirPath + '/commentCheck.txt') ;                                 //probably use Sync instead

     str = str + textToHtml(data, ".commentcheckHERE");

     data = fs.readFileSync(dirPath + '/reject.txt');

     str = str + textToHtml(data, ".rejectHERE");

     fs.writeFileSync('./www/js/site.js', str);

  }else{
      fs.writeFileSync('./www/js/site.js', str);
  }         //create build history list for webapp
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

  data = fs.readFileSync( b.dir  + '/secondTest.txt').toString();

  data = data.replace(/[\r]+/g, '');
  data = data.replace(/[\n]+/g, '');
  data = data.replace(/[ ]+/g, '');

  index = data.indexOf('Statements:');

  coverage = data.substring(index+11, index + 16);

  percent = parseFloat(coverage, 10);

  data = fs.readFileSync( b.dir  + '/commentCheck.txt').toString();

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

  if(percent < 5 || perFunc < 1){     //set percent 5 and 3 for demonstrating automated deployment
      
      str = "Rejected";

      if(percent < 50){
        str = str + "\nStatement Coverage below 50%";
      }

      if(perFunc < 3){
        str = str + "\nNumber of line comments per function less than 3";
      }

  }else {
    
    str = "Accepted"

    b.accepted = true;

   

    // if(b.canary){
    //   sendToCanary();
    // }else {sendToLive();}

  }

  fs.writeFileSync(b.dir + '/reject.txt', str);               
}

createBuildList(undefined);

function dockerCommit(b){

  var executionString = 'sudo docker commit ' + b.imageAlias + ' wildtrack/' + b.imageAlias;

  console.log(executionString);

  exec(util.format(executionString),function (error, stdout, stderr){
            
    if(error) {
      emitter.emit('error', error)
    }

    console.log(stdout)

    var pushString = 'sudo docker push wildtrack/' + b.imageAlias;

    console.log(pushString);

    exec(util.format(pushString),function (error, stdout, stderr){

      if(error){
        emitter.emit('error', error);
      }

      console.log(stdout);

      if(b.canary){
        return liveDeploy(b);
      }else{
        return canaryDeploy(b);
      }
      
    })

  });
}

function liveDeploy(b){

  tempJSON = {
    "AWSEBDockerrunVersion": "1",
    "Image": {
      "Name": 'wildtrack/' + b.imageAlias
    },
    "Ports": [
      {
        "ContainerPort": "80"
      }
    ],
    "Volumes": []
  }

  fs.writeFileSync('./liveDockerDeploy/Dockerrun.aws.json', JSON.stringify(tempJSON));

  exec(util.format('eb deploy liveDockerDeploy-dev'),{cwd: '/root/Server/data/liveDockerDeploy/'}, function (error, stdout, stderr){

      if(error){
        console.log('error', error);
      }

      console.log(stdout);

      return b.ds.stop();
      
  })

  
}

function canaryDeploy(b){

  tempJSON = {
    "AWSEBDockerrunVersion": "1",
    "Image": {
      "Name": 'wildtrack/' + b.imageAlias
    },
    "Ports": [
      {
        "ContainerPort": "80"
      }
    ],
    "Volumes": []
  }

  fs.writeFileSync('./canaryDockerDeploy/Dockerrun.aws.json', JSON.stringify(tempJSON))

  exec(util.format('eb deploy canaryDockerDeploy-dev'),{cwd: '/root/Server/data/canaryDockerDeploy/'}, function (error, stdout, stderr){

      if(error){
        console.log('error', error);
      }

      console.log(stdout);

      return b.ds.stop();
      
  })

  
}



 
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


