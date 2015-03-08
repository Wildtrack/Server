var esprima = require("esprima");
var options = {tokens:true, tolerant: true, loc: true, range: true };
//var faker = require("faker");
var fs = require("fs");
//faker.locale = "en";
//var mock = require('mock-fs');
var _ = require('underscore');

function main()
{
	var args = process.argv.slice(2);

	if( args.length == 0 )
	{
		console.log("Usage: node main.js <filename>");
		process.exit();
	}
	var filePath = args[0];

	extractInstFunc(filePath);

	constraints(filePath);

	generateTestCases(filePath);

}

function extractInstFunc(filename){
	var buf = fs.readFileSync(filename, "utf8");
	var opts = {loc: true };

	var fn = filename.split('.');
	fn = fn.slice(1);

	var res = esprima.parse(buf, opts);

	//console.log(res);
	var params = [];
	var instantiateName = null;

	traverse(res, function(node){
		if(node.type === 'AssignmentExpression' && node.left != null){
			if(node.left.object != null && node.right.type != null && 
				node.left.property != null){
				if(node.right.type === 'ObjectExpression'){
					instantiateName = node.left.property.name;
				}
			}
		}	
	});
	console.log("instatntiate name is " + instantiateName);
}



function genManipObjects(filename){

	var buf = fs.readFileSync(filename, "utf8");
	var opts = {loc: true };

	var fn = filename.split('.');
	fn = fn.slice(1);

	var res = esprima.parse(buf, opts);

	//console.log(res);
	var params = [];
	var instantiateName = null;

	traverse(res, function(node){
		if(node.type === 'VariableDeclarator' && node.init != null){
			if(node.init.type === "FunctionExpression"){
				console.log("node name is " + node.id.name);
				console.log("We have an object sir.");	
				for(var i = 0; i < node.init.params.length; i++){
					params[i] = node.init.params[i];
					console.log("params are " + node.init.params[i].name);
				}
			}
		}
		
	});

	//mockObject =
	//console.log("f uncCount is " + funcCount);
}



function fakeDemo()
{
	console.log( faker.phone.phoneNumber() );
	console.log( faker.phone.phoneNumberFormat() );
	console.log( faker.phone.phoneFormats() );
}

var functionConstraints =
{
}

var mockFileLibrary = 
{
	pathExists:
	{
		'path/fileExists': {}
	},
	fileWithContent:
	{
		pathContent: 
		{	
  			file1: 'text content',
		}
	},
	fileNoContent:
	{
		path:
		{
			file1: '',
		}
	}
};

function generateTestCases(filePath)
{
	var farr = filePath.split('.');
	var fn  = farr[0];
	var content = "var " + fn + " = require('../" + fn + "');\nvar subject = new " + fn + ".model();\n";
	for ( var funcName in functionConstraints )
	{
		var params = {};

		// initialize params
		for (var i =0; i < functionConstraints[funcName].params.length; i++ )
		{
			var paramName = functionConstraints[funcName].params[i];
			//params[paramName] = '\'' + faker.phone.phoneNumber()+'\'';
			params[paramName] = '\'\'';
		}
		console.log("params are ");
		console.log( params );

		// update parameter values based on known constraints.
		var constraints = functionConstraints[funcName].constraints;
		// Handle global constraints...
		var fileWithContent = _.some(constraints, {mocking: 'fileWithContent' });
		var pathExists      = _.some(constraints, {mocking: 'pathExists' });
		var fileNoContent   = _.some(constraints, {mocking: 'fileNoContent'})



		for( var c = 0; c < constraints.length; c++ )
		{
			var constraint = constraints[c];
			if( params.hasOwnProperty( constraint.ident ) )
			{
				params[constraint.ident] = constraint.value;
			}
		}

		// Prepare function arguments.
		var args = Object.keys(params).map( function(k) {return params[k]; }).join(",");


		if( pathExists || fileWithContent || fileNoContent )
		{
			content += generateMockFsTestCases(pathExists,fileWithContent,!fileNoContent,funcName,args);
			// Bonus...generate constraint variations test cases....
			content += generateMockFsTestCases(!pathExists,!fileWithContent,funcName,args);
			content += generateMockFsTestCases(pathExists,!fileWithContent,!fileNoContent,funcName,args);
			content += generateMockFsTestCases(!pathExists,fileWithContent,!fileNoContent,funcName,args);
			content += generateMockFsTestCases(!pathExists,!fileWithContent,fileNoContent,funcName,args);
		}
		else
		{
			// Emit simple test case.
			content += "subject.{0}({1});\n".format(funcName, args );
		}

	}


	fs.writeFileSync('./test/test.js', content, "utf8");

}

function generateMockFsTestCases (pathExists,fileWithContent,fileNoContent,funcName,args) 
{
	var testCase = "";
	// Insert mock data based on constraints.
	var mergedFS = {};
	if( pathExists )
	{
		for (var attrname in mockFileLibrary.pathExists) { mergedFS[attrname] = mockFileLibrary.pathExists[attrname]; }
	}
	if( fileWithContent )
	{
		for (var attrname in mockFileLibrary.fileWithContent) { mergedFS[attrname] = mockFileLibrary.fileWithContent[attrname]; }
	}
	if( fileNoContent )
	{
		for (var attrname in mockFileLibrary.fileNoContent) { mergedFS[attrname] = mockFileLibrary.fileNoContent[attrname]; }
	}

	testCase += 
	"mock(" +
		JSON.stringify(mergedFS)
		+
	");\n";

	testCase += "\tsubject.{0}({1});\n".format(funcName, args );
	testCase+="mock.restore();\n";
	return testCase;
}

function constraints(filePath)
{
	var buf = fs.readFileSync(filePath, "utf8");
	var result = esprima.parse(buf, options);

	var farr = filePath.split('.');
	var fn  = farr[0];

	console.log('filename is ' + fn);

	//console.log("we are inside");
	traverse(result, function (node) 
	{
		if (node.type === 'ExpressionStatement' && 
			node.expression.left != null && node.expression.right != null) 
		{
			if(node.expression.left.property != null && 
				node.expression.left.property.type == "Identifier" && 
				node.expression.right.type === "FunctionExpression" && 
				node.expression.left.property.name != null){


				var funcName = node.expression.left.property.name;
				
				//This is essentially a set of blacklisted functions that break
				//everything.
				if(funcName === "model" || funcName === "onTrack" ||
					funcName === "forwardSearch" || funcName === "forwardTraverse" ||
					funcName === "backwardSearch" || funcName === "backwardTraverse"){
					//donothing
					console.log("we are here");
				}else{
					console.log("func name is " + funcName);

					var params = node.expression.right.params.map(function(p) {return p.name});

					functionConstraints[funcName] = {constraints:[], params: params};

					// Check for expressions using argument.
					traverse(node, function(child)
					{
						if( child.type === 'BinaryExpression' && child.operator == "==")
						{
							if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
							{
								// get expression from original source code:
								//var expression = buf.substring(child.range[0], child.range[1]);
								var rightHand = buf.substring(child.right.range[0], child.right.range[1])
								functionConstraints[funcName].constraints.push( 
									{
										ident: child.left.name,
										value: rightHand
									});
							}
						}

						if( child.type === 'BinaryExpression' && child.operator == "<")
						{
							if( child.left.type == 'Identifier' && params.indexOf( child.left.name ) > -1)
							{
								// get expression from original source code:
								//var expression = buf.substring(child.range[0], child.range[1]);
								var rightHand = buf.substring(child.right.range[0], child.right.range[1])
								functionConstraints[funcName].constraints.push( 
									{
										ident: child.left.name,
										value: rightHand
									});
							}
						}

						if( child.type == "CallExpression" && 
							 child.callee.property &&
							 child.callee.property.name =="readFileSync" )
						{
							for( var p =0; p < params.length; p++ )
							{
								if( child.arguments[0].name == params[p] )
								{
									functionConstraints[funcName].constraints.push( 
									{
										// A fake path to a file
										ident: params[p],
										value: "'pathContent/file1'",
										mocking: 'fileWithContent'
									});
								}
							}
						}

						if( child.type == "CallExpression" &&
							 child.callee.property &&
							 child.callee.property.name =="existsSync")
						{
							for( var p =0; p < params.length; p++ )
							{
								if( child.arguments[0].name == params[p] )
								{
									functionConstraints[funcName].constraints.push( 
									{
										// A fake path to a file
										ident: params[p],
										value: "'path/fileExists'",
										mocking: 'fileExists'
									});
								}
							}
						}

					});

					console.log( functionConstraints[funcName]);
				}
			}
		}
	});
}

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

function traverseWithCancel(object, visitor)
{
    var key, child;

    if( visitor.call(null, object) )
    {
	    for (key in object) {
	        if (object.hasOwnProperty(key)) {
	            child = object[key];
	            if (typeof child === 'object' && child !== null) {
	                traverseWithCancel(child, visitor);
	            }
	        }
	    }
 	 }
}

function functionName( node )
{
	if( node.id )
	{
		return node.id.name;
	}
	return "";
}


if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

main();