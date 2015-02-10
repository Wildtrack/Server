var http = require("http");		//load http moduule
var exec = require('child_process').exec,
	util = require('util'),
	path = require('path'),
  events = require('events'),
  emitter = new events.EventEmitter();
  fs = require('fs');

 // var Docker = require("dockerode");
 // var docker = new Docker({host: 'http://192.168.1.10', port: 2999});

temp_directory = "/home/vagrant/data/repo";

server = http.createServer(function (req, res) {		//creates http server 
    if(req.url !== "/favicon.ico") {    //to avoid double requests

	    res.writeHead(200, {"Content-Type": "text/plain"});

	    var d = new Date();					//date object

	    console.log(d);				//log date and time to terminal 

	    console.log(req.headers);  //log headers of req object

      if(!!req.headers['x-github-delivery']){                       //if its a github web hook                  
          
          var build_history = "Build Results, Most Recent First:\n\n";          //start creating build history
          build_history = build_history.concat("Build On: ");
          build_history = build_history.concat(d);
          build_history = build_history.concat("---------------------------\n\nDocker Node---------------------- \n\n");

          pull_docker(build_history);                             //pull docker and start build

          var string = "Please visit http://".concat(req.headers.host);         //reply to github webhook with url to retreivable build status
          string = string.concat(" to view your build status and result.");

          res.end(string);                        //reponse 

      }else{                                                //if it's not a github webhook output build history

          
          fs.exists('history.txt', function(exists) {

              if(exists){
                fs.readFile('history.txt', function read(err,data){
                  if(err){
                    console.log(err)
                    res.end(err);
                  }else{
                    res.end(data);
                  }
                });
              }else{
                res.end("There have been no builds thus far.")
              }
          });
      }
	}
});

server.listen(3000);				//listens to this port on guest VM

console.log("Server running on port 3000");

emitter
  .on('info', console.info)
  .on('error', console.error)
  .on('severe', function(err) {
    console.error(err);
    process.exit(1);
  });
 
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

//Docker build machine---------------------------
function pull_docker(build_history){                //pulls docker if its not present keeps track of build status 

  console.log("Pulling docker");

  exec(util.format("sudo docker pull meneal/buildbox"), function (error, stdout, stderr) {
    if (error) {
      emitter.emit('error', error);
      build_history = build_history.concat(error)
    } else {
      emitter.emit('info', stdout.trim());
      build_history = build_history.concat(stdout.trim());
      if (stderr) {
        emitter.emit('error', stderr.trim());
        build_history = build_history.concat(stderr.trim());
      }

      build_history = build_history.concat("\n\nDependency Install, Grunt Build and Test--------------------------\n\n")

      run_docker(build_history)
     
    }    
  });
}

function run_docker(build_history){           //run docker with build script and test script run docker -> npm install -> bower install -> grunt build and test

  console.log("Running docker");

  exec(util.format("sudo docker run -v /home/vagrant/data:/vol meneal/buildbox sh -c /vol/dockerbook2.sh"), function (error, stdout, stderr) {
    if (error) {
      emitter.emit('error', error);
      build_history = build_history.concat(error);
    } else {
      emitter.emit('info', stdout.trim());
      build_history = build_history.concat(stdout.trim());
      if (stderr) {
        emitter.emit('error', stderr.trim());
        build_history = build_history.concat(stderr.trim());
      }

      fs.exists('history.txt', function(exists){              //writes to history file and history status is accessible through http
        if(exists){
          fs.readFile('history.txt', function read(err,data){         
            if(err){
              console.log(err)
              res.end(err);
            }else{
              build_history = build_history.concat(data);

              fs.writeFile('history.txt', build_history);          
            }
          });
        }else{
          fs.writeFile('history.txt', build_history);
        }  
      });

    }
  });
}

//------Local Build (currently not used)

function git_clone(url, dir) {      //clone to data/repo/

	exec(util.format('git clone %s %s', url, dir), function (error, stdout, stderr) {
    if (error) {
      emitter.emit('error', error);
    } else {
      emitter.emit('info', stdout.trim());
      if (stderr) {
        emitter.emit('error', stderr.trim());
      }
    }

    console.log("Changing to Directory"); //change to repo directory
  
    console.log('Starting directory: ' + process.cwd());
    try {
      process.chdir(temp_directory);
      console.log('New directory: ' + process.cwd());
    }
    catch (err) {
      console.log('chdir: ' + err);
    }

    console.log("npm install");

    npm_install();
  });
}

function npm_install(){     //npm install, installs dependencies from package.json

  exec(util.format('npm install'), function (error, stdout, stderr) {
    if (error) {
      emitter.emit('error', error);
    } else {
      emitter.emit('info', stdout.trim());
      if (stderr) {
        emitter.emit('error', stderr.trim());
      }
    }
    console.log("Running bower install");
    bower_install();
  });
}


function bower_install(){     //install all bower dependencies  
  exec(util.format('bower install'), function (error, stdout, stderr) {
    if (error) {
      emitter.emit('error', error);
    } else {
      emitter.emit('info', stdout.trim());
      if (stderr) {
        emitter.emit('error', stderr.trim());
      }
    }

    console.log("Running grunt");
    run_grunt();
  });
}


function run_grunt(){         //runs grunt "Done, without errors = success"
  exec(util.format('grunt'), puts);
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


