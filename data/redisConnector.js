var redis = require("redis");
var port = "11864";
var host = "pub-redis-11864.us-east-1-3.2.ec2.garantiadata.com";
var options = {
	auth_pass : "wildtrack"
}
var client1 = redis.createClient(port, host, options), 
    client2 = redis.createClient(port, host, options),
    msg_count = 0;

client1.on("subscribe", function (channel, count) {
    client2.publish("a nice channel", "I am sending a message.");
    client2.publish("a nice channel", "I am sending a second message.");
    client2.publish("a nice channel", "I am sending my last message.");
});

client1.on("message", function (channel, message) {
    console.log("client1 channel " + channel + ": " + message);
    msg_count += 1;
    if (msg_count === 3) {
        client1.unsubscribe();
        client1.end();
        client2.end();
    }
});

client1.incr("did a thing");
client1.subscribe("a nice channel");