var fs = require('fs');
var DigitalOceanAPI = require('digitalocean-api');
var CLIENTID= 'xx';
var APIKEY = 'xx';
var api = new DigitalOceanAPI(CLIENTID, APIKEY);
var dat = "[droplets]\n";
var div = "ansible_ssh_host=";
var nameMap = {};
var count = 0;
termFlag = true;
optionals = { ssh_key_ids: [761015], private_networking: false, backups_enabled: false };

api.dropletGetAll(function(error, droplets){
	//console.log(droplets);
	for(key in droplets){
		console.log(droplets[key].id);
		addRecord(droplets[key]);
	}
	
	fs.writeFile('out.txt', dat, function(err){
		if(err) throw err;
		console.log('out emitted');
	});
	//console.log("droplet ids are ");
	//console.log(nameMap);
	
	if(nameMap['cerberus'] === undefined){
		api.dropletNew('cerberus', 66, 11388420, 8, optionals, function(err, resp){
			if(err) console.log("Something bad happened!");
			console.log(resp);
		});
	}else{
		console.log("cerberus exists!");
	}


	if(nameMap['thanatos'] === undefined){
		api.dropletNew('thanatos', 66, 11388420, 8, optionals, function(err, resp){
			if(err) console.log("Something bad happened!");
			console.log(resp);
		});
	}else{
		console.log("thanatos exists!");
	}
	
	if(nameMap['kronos'] === undefined){
		api.dropletNew('kronos', 66, 11388420, 8, optionals, function(err, resp){
			if(err) console.log("Something bad happened!");
			console.log(resp);
		});
	}else{
		console.log("kronos exists!");
	}
});

var addRecord = function(droplets){
	var id = droplets.id;
	var name = droplets.name;
	nameMap[name] = id;
	var ip = droplets.ip_address;
	var line = name + " " + div + ip + "\n";
	dat += line;
	console.log(line);
};



if(termFlag){
	api.dropletGetAll(function(error, droplets){
		for(key in droplets){
			var id = droplets[key].id;
			api.dropletDestroy(id, function(err, resp){
				if(err) console.log(err);
				console.log(resp + " killed");
			});
		}

	});
}





