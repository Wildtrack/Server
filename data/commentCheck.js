var esprima = require('esprima');
var fs = require("fs");

var lineCount = 0;
var loc = 0;
var blockCount = 0;
var funcCount = 0;

function main(){
	console.log("===================")
	for(var i = 2; i < process.argv.length; i++){
		lineCount = 0;
		blockCount = 0;
		funcCount = 0;
		var file = process.argv[i];
		console.log(file);
		console.log("===================");
		//console.log("GETTING COMMENTS");
		getComments(file);
		//console.log("GETTTING CODE DATA");
		getCodeDat(file);
		getLoc(file);
		analyze();
		console.log("===================");
		
	}
}

function analyze(){
	var lCom_per_loc = lineCount / loc;
	var bCom_per_loc = blockCount / loc;
	var bCom_per_func = blockCount / funcCount;
	var lCom_per_func = lineCount / funcCount;

	console.log("Number of line comments per total number of lines of code " + lCom_per_loc);
	console.log("Number of block comments per total number of lines of code " + bCom_per_loc);
	console.log("Number of line comments per number of function " + lCom_per_func);
	console.log("Number of block comments per function " + bCom_per_func);
}


function getLoc(filename){
	var buf = fs.readFileSync(filename, "utf8");
	var opts = {loc: true };
	var res = esprima.parse(buf, opts).loc;
	loc = res.end.line;
}

function getCodeDat(filename){
	
	var buf = fs.readFileSync(filename, "utf8");
	var opts = {loc: true };

	var res = esprima.parse(buf, opts);

	//console.log(res);
	
	traverse(res, function(node){
		if(node.type === 'Property' && node.value.type === "FunctionExpression"){
			funcCount++;
		}
		if(node.type === "ExpressionStatement" && node.expression.type === "AssignmentExpression"){
			if(node.expression.right.type === "FunctionExpression"){
				funcCount++;
			}
		}
	});

	//console.log("funcCount is " + funcCount);
}



function getComments(filename){
	var buf = fs.readFileSync(filename, "utf8");
	var opts = {comment: true, loc: true };

	var res = esprima.parse(buf, opts).comments;

	//console.log(res);
	
	traverse(res, function(node){
		if(node.type === 'Line'){
			lineCount++;
		}
		if(node.type == 'Block'){
			blockCount++;
		}
	});

	//console.log("lineCount is " + lineCount);
	//console.log("blockCount is " + blockCount)
}


//Stolen from main.js in test generation homework.
function traverse(object, visitor) 
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

main();