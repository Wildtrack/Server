var http = require("http"),			//load http moduule
    server;
var exec = require('child_process').exec,
	util = require('util'),
	path = require('path'),
  events = require('events'),
  emitter = new events.EventEmitter();

temp_directory = "/home/vagrant/data/repo";

server = http.createServer(function (req, res) {		//creates http server 
    if(req.url !== "/favicon.ico") {    //to avoid double requests

	    res.writeHead(200, {"Content-Type": "text/plain"});

	    var d = new Date();					//date object

	    console.log(d);				//log date and time to terminal 

	    console.log(req.headers);  //log headers of req object

	    git_clone("git@github.com:Wildtrack/MiniProject1.git", temp_directory); //clone project
	     //cloning starts cascade of build activies

	    res.end("Hello");				//response to client (web page) is hello
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

function cd(dir){               //unused change directory shell script can be changes to other uses
  exec(util.format('cd %s', dir), function (error, stdout, stderr) {
    if (error) {
      emitter.emit('error', error);
    } else {
      emitter.emit('info', stdout.trim());
      if (stderr) {
        emitter.emit('error', stderr.trim());
      }
    }

    console.log("Running npm install");
    ls();
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
