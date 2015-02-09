var http = require("http"),			//load http moduule
    server;
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

	    //git_clone("git@github.com:Wildtrack/MiniProject1.git", temp_directory); //clone project
	     //cloning starts cascade of build activies

      pull_docker(function(result){
          res.end(result);
      });

	    //res.end("OK");				//response to client (web page) is hello
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

//Dockerbook---------------------------
function pull_docker(callback){

  console.log("Pulling docker");

  var response;

  exec(util.format("sudo docker pull meneal/buildbox"), function (error, stdout, stderr) {
    if (error) {
      emitter.emit('error', error);
      response = error;
      callback(response);
    } else {
      emitter.emit('info', stdout.trim());
      response = stdout.trim();
      if (stderr) {
        emitter.emit('error', stderr.trim());
        response = response.concat(stderr.trim());
      }

      fs.writeFile('output.txt', response);
      run_docker(response, callback)

      //callback(response);
    }    
  });
}

function run_docker(response,  callback){

  console.log("Running docker");

  exec(util.format("sudo docker run -v /home/vagrant/data:/vol meneal/buildbox sh -c /vol/dockerbook2.sh"), function (error, stdout, stderr) {
    if (error) {
      emitter.emit('error', error);
      response = response.concat(error);
    } else {
      emitter.emit('info', stdout.trim());
      response = response.concat(stdout.trim());
      if (stderr) {
        emitter.emit('error', stderr.trim());
        response = response.concat(stderr.trim());
      }

      callback(response);
    }
  });
}

//------Local Build (currently not used)

function docker_git_clone(){

  exec(util.format("git clone https://github.com/Wildtrack/MiniProject1"), function (error, stdout, stderr) {
    if (error) {
      emitter.emit('error', error);
    } else {
      emitter.emit('info', stdout.trim());
      if (stderr) {
        emitter.emit('error', stderr.trim());
      }
    }

    docker_cd();
  });  
}

function docker_cd(){

  exec(util.format("cd MiniProject1"), function (error, stdout, stderr) {
    if (error) {
      emitter.emit('error', error);
    } else {
      emitter.emit('info', stdout.trim());
      if (stderr) {
        emitter.emit('error', stderr.trim());
      }
    }

    docker_install_grunt();
  });  

}

function docker_install_grunt(){

  exec(util.format("npm install -g grunt-cli "), function (error, stdout, stderr) {
    if (error) {
      emitter.emit('error', error);
    } else {
      emitter.emit('info', stdout.trim());
      if (stderr) {
        emitter.emit('error', stderr.trim());
      }
    }

    docker_install_bower();
  });  
}

function docker_install_bower(){

  exec(util.format("npm install -g bower "), function (error, stdout, stderr) {
    if (error) {
      emitter.emit('error', error);
    } else {
      emitter.emit('info', stdout.trim());
      if (stderr) {
        emitter.emit('error', stderr.trim());
      }
    }

    docker_npm_install();
  });  
}

function docker_npm_install(){

  exec(util.format("npm install"), function (error, stdout, stderr) {
    if (error) {
      emitter.emit('error', error);
    } else {
      emitter.emit('info', stdout.trim());
      if (stderr) {
        emitter.emit('error', stderr.trim());
      }
    }

    docker_bower();
  });  
}

function docker_bower(){

  exec(util.format("bower --allow-root install "), function (error, stdout, stderr) {
    if (error) {
      emitter.emit('error', error);
    } else {
      emitter.emit('info', stdout.trim());
      if (stderr) {
        emitter.emit('error', stderr.trim());
      }
    }

    run_docker();
  });  
}

function docker_grunt(){
  exec(util.format("grunt"), function (error, stdout, stderr) {
    if (error) {
      emitter.emit('error', error);
    } else {
      emitter.emit('info', stdout.trim());
      if (stderr) {
        emitter.emit('error', stderr.trim());
      }
    }
  });  
}
//---------------------





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

//Dockerode Code
// function runExec(container) {
//   options = {
//     "AttachStdout": true,
//     "AttachStderr": true,
//     "Tty": false,
//     Cmd: ["env"]
//   };
//   container.exec(options, function(err, exec) {
//     if (err) return;

//     exec.start(function(err, stream) {
//       if (err) return;

//       stream.setEncoding('utf8');
//       stream.pipe(process.stdout);
//     });
//   });
// }

// function makeContainerNode(){

//   console.log("makeContainerNode");

//   docker.pull('meneal/buildbox', function (err, stream) {  
//     if(err) {console.log(err); return;}
//     else{
//       console.log(stream);
//       dockerRun();
//     }
//   });

// }

// function dockerRun(){

//   console.log("Docker Run");

//   docker.run('meneal/buildbox', '-v /home/vagrant/data:/vol meneal/buildbox sh -c /vol/dockerbook2.sh', process.stdout, function (err, data, container) {
//     console.log(data.StatusCode);
//   });
// }
