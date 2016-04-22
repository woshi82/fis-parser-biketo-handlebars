var path = require('path'),
	fs = require('fs'),
	glob = require('glob'),
	Handlebars = require('handlebars');


module.exports = function (content,options,file) {
	//Go through a partials object
	if(options.partials){
		for(var p in options.partials){
			Handlebars.registerPartial(p, options.partials[p]);
		}
	}
	//Go through a helpers object
	if(options.helpers){
		for(var h in options.helpers){
			Handlebars.registerHelper(h, options.helpers[h]);
		}
	}

	// Do not search for more than 10 nestings
	var maxDepth = 10;
	// Process only files with given extension names
	var allowedExtensions = ['hb', 'hbs', 'handlebars', 'html'];

	var isDir = function (filename) {
		var stats = fs.statSync(filename);
		return stats && stats.isDirectory();
	};

	var isHandlebars = function (filename) {
		return allowedExtensions.indexOf(filename.split('.').pop()) !== -1;
	};

	var partialName = function (filename, base) {
		var name = path.join(path.dirname(filename), path.basename(filename, path.extname(filename)));
		
		if (name.indexOf(base) === 0) {
			name = name.slice(base.length);
		}
		// Change the name of the partial to use / in the partial name, not \
		name = name.replace(/\\/g, '/');

		// Remove leading _ and / character
		var firstChar = name.charAt(0);
		if( firstChar === '_' || firstChar === '/'  ){
			name = name.substring(1);
		}
		
		return name;
	};

	var registerPartial = function (filename, base) {
		if (!isHandlebars(filename)) { return; }
		var name = partialName(filename, base);
		var template = fs.readFileSync(filename, 'utf8'),
			partialFile = fis.file(filename);
		file.cache.addDeps(filename);
		if (fis.compile.partial && partialFile.ext === '.handlebars' || partialFile.isHtmlLike) {
		    template = fis.compile.partial(template, partialFile, {
		      ext: '.html',
		      isHtmlLike: true
		    });
		}
		Handlebars.registerPartial(name, template);
	};

	var registerPartials = function (dir, base, depth) {
		if (depth > maxDepth) { return; }
		base = base || dir;
		fs.readdirSync(dir).forEach(function (basename) {
			var filename = path.join(dir, basename);
			if (isDir(filename)) {
				registerPartials(filename, base);
			} else {
				registerPartial(filename, base);
			}
		});
	};


	var globPath = options.root? options.root+'[a-z|A-Z]*/': 'src/cmp/[a-z|A-Z]*/';

	options.batch = glob.sync(globPath);
	options.batch.forEach(function (dir) {
		dir = path.normalize(dir);

		registerPartials(dir, dir, 0);
	});

	/**
	 * For handling unknown partials
	 * @method mockPartials
	 * @param  {string}   content Contents of handlebars file
	 */
	var mockPartials = function(content){
		var regex = /{{> (.*)}}/gim, match, partial;
		if(content.match(regex)){
			while((match = regex.exec(content)) !== null){
				partial = match[1];
				//Only register an empty partial if the partial has not already been registered
				if(!Handlebars.partials.hasOwnProperty(partial)){
					Handlebars.registerPartial(partial, '');
				}
			}
		}
	};

}