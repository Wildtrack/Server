var http = require("http"),			//load http moduule
    server;
var exec = require('child_process').exec,
	util = require('util'),
	path = require('path'),
    events = require('events'),
    emitter = new events.EventEmitter();
//git = require("gift");
server = http.createServer(function (req, res) {		//creates http server 
    if(req.url !== "/favicon.ico") {

	    res.writeHead(200, {"Content-Type": "text/plain"});

	    var d = new Date();					//date object

	    console.log(d);				//log date and time to terminal 

	    console.log(req.headers);

	  //    if(req.body.repository){
		 // 	console.log(req.body.repository);
		 // }

	    console.log(req.body);    		//will log the request object sent by githook

	    git_clone("git@github.ncsu.edu:aisobran/Analysis.git", "/home/vagrant/data/repo");

	    //git_clone(req.body.commits.repository.ssh_url, "/home/vagrant/data/repo")
	  		
	    console.log("This worked");		//log success message

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

function git_clone(url, dir) {
	exec(util.format('git clone %s %s', url, dir), puts);
}
