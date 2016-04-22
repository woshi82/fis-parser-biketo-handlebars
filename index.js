var Handlebars = require('handlebars');
var glob = require('glob');
var Mock = require('mockjs');
var registerHandlebars = require('./src/register-handlebars');


module.exports = function(content, file, settings){
	var options = settings.opts || {},
		handleData = settings.data || {};
	registerHandlebars(content,options,file);
	function getData(){


		var mock_reg = /mock\.js$/g,
			globPath = null;
			
		options.dataRoot && (options.dataRoot.forEach(function(root){
			globPath = root+'**/*';
			glob.sync(globPath).forEach(function (dir) {
				if(mock_reg.test(dir)){
					file.cache.addDeps(dir);
					// console.log(eval(fis.util.read(dir)));
					fis.util.merge(handleData,eval(fis.util.read(dir)));
				};
			})
		}));

	};
	getData();
	var template = Handlebars.compile(content, options.compile);
	content = template(handleData);
	
	// var contents = new Buffer(template(settings.data));
  	if (fis.compile.partial && file.ext === '.handlebars' || file.isHtmlLike) {
	    content = fis.compile.partial(content, file, {
	      ext: '.html',
	      isHtmlLike: true
	    });
	}
    return content;
};