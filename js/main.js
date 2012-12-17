/*! 
	main.js
	
	Author: Declan Norton <decnorton.com>
*/


Storage.prototype.setObject = function(key, value) {
	this.setItem(key, JSON.stringify(value));
}
Storage.prototype.getObject = function(key) {
	var value = this.getItem(key);
	return value && JSON.parse(value);
}

$(document).ready(function() {

	if(!Modernizr.localstorage) {
		alert("Your browser doesn't support local storage!");
		return;
	}
	var Todo = function() {};
	
	Todo = function() {
		this.data = {};
		this.tasks = $('ul.tasks');
		this.item = $('<li>\
					<div class="status">\
						<input type="checkbox">\
						<label></label>\
					</div>\
					<span class="content"></span>\
					<time class="date"></time>\
					<a class="remove">&times;</a>\
				</li>');
	}
	
	Todo.prototype = {
		init : function() {
			this.loadLocal();
		},
		loadLocal : function() {
			// Grab data from Local Storage
			this.data = localStorage.getObject("data");
			if(this.data == null) {
				// If it doesn't exist, create it
				this.data = {};
			} else {
				// Sort
				var done = [];
				var notDone = [];
				for(var id in this.data) {
					var task = this.data[id];

					if(task.done) {
						done.push(task);
					} else {
						notDone.push(task);
					}
				}
				// Combine done and not done, ordering done first
				var temp = done.concat(notDone);
				for(var i=0; i < temp.length; i++) {
					var task = temp[i];
					this.addTask(task);
				}
			}
		},
		addTask : function(d) {
			$('.zilch').hide();
			
			// If it's already in the list, don't add it
			if($('[data-id="'+d.id+'"]').length > 0) {
				return;
			}
			var li = this.item.clone();
			li.attr('data-id', d.id);
			$('.content', li).html(d.content);
			
			if(d.done) {
				li.addClass('done');
				$(':checkbox', li).prop('checked', true);
			} else {
				li.removeClass('done');
				$(':checkbox', li).prop('checked', false);
			}
			
			this.tasks.prepend(li);
			// Animate it into the list
			li.hide();
			li.css('opacity', 0);
			li.width(100);
			li.slideDown(100, function() {
				li.width('');
				li.animate({ 'opacity' : 1 });
			});
		},
		newTask : function(d) {
			// Add to data object
			this.data[d.id] = d;
			// Store data object in LocalStorage
			this.update();
			// Show the task
			this.addTask(d);
		},
		
		updateTask : function(id, content) {
			if(content.length > 0) {
				// Add to data object
				this.data[id].content = content;
				// Update LocalStorage
				this.update();
			}
		},
		
		toggleTask : function(id) {
			if(this.data[id].done === true) {
				this.setAsNotDone(id);
			} else {
				this.setAsDone(id);
			}
		},
		setAsDone : function(id) {
			// Update data object
			this.data[id].done = true;
			this.update();
			
			// Grab the list item and cache it
			var item = $('[data-id="'+id+'"]');
			$(':checkbox', item).prop('checked', true);
			// Rearrange to seperate done and not-done
			
			if($('li:not(.done)').length > 1) {
				console.log('more than one task');
			}
			
			
			if(item.is('li:first') && $('li:not(.done)').length < 2) {
				item.addClass('done');
			} else {
				item.animate({ 'opacity' : 0 }, 100, function() {
					item.slideUp(100, function() {
						// Move to top of completed
						item.remove();
						if($('li.done', '.tasks').length > 0) {
							item.insertBefore('li.done:first', '.tasks');
						} else {
							item.appendTo('.tasks');	
						}
						item.addClass('done');
						item.slideDown(100, function() {
							item.animate({ 'opacity' : 1 }, 100);
						});
					});
				});
			}
			
		},
		setAsNotDone : function(id) {
			this.data[id].done = false;
			this.update();
			
			var item = $('[data-id="'+id+'"]');
			$(':checkbox', item).prop('checked', false);
			if(item.is('li:first')) {
				item.removeClass('done');
			} else {
				item.animate({ 'opacity' : 0 }, 100, function() {
					item.slideUp(100, function() {
						// Move to top 
						item.remove();
						$('.tasks').prepend(item);
						item.removeClass('done');
						item.slideDown(100, function() {
							item.animate({ 'opacity' : 1 }, 100);
						});
					});
				});
			}
		},
		removeTask : function(id) {
			// Remove from data object
			delete this.data[id];
			// Update LocalStorage
			this.update();
			
			$('[data-id="'+id+'"]').animate({ 'opacity' : 0 }, 100, function() {
				$(this).slideUp(100, function() {
					$(this).remove();
					if($('li', '.tasks').length <= 0) {
						$('.zilch').show();
					}
				});
			});
		},
		update : function() {
			localStorage.setObject('data', this.data);
		},
		clearData : function() {
			localStorage.setObject('data', {});
		},
		toXML : function() {
			var xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
			xml += "<todo>\n";
			for (var id in this.data) {
				var task = this.data[id];
				xml += '\t<task>\n';
				xml += '\t\t<id>'+task.id+'</id>\n';
				xml += '\t\t<content>'+task.content+'</content>\n';
				xml += '\t\t<date>'+task.date+'</date>\n';
				xml += '\t\t<timestamp>'+task.timestamp+'</timestamp>\n';
				xml += '\t\t<done>'+task.done+'</done>\n';
				xml += '\t</task>\n';
			}
			xml += "</todo>";
			
			return xml;
		},
		fromXML : function(xml) {
			var app = this;
			var valid = false;
			// Loop through each instance of 'task' and add it
			$(xml).find('task').each(function() {
				valid = true;
				var isDone;
				if($(this).find('done').text() == 'false')
					isDone = false;
				else isDone = true;
				var task = {
					id : $(this).find('id').text(),
					content: $(this).find('content').text(),
					date: $(this).find('date').text(),
					timestamp: $(this).find('timestamp').text(),
					done : isDone
				};
				app.newTask(task);
			});
			
			if(!valid) {
				alert('Invalid XML!');
			}
		},
		modal : function() {
			$('body').addClass('modal');
		},
		dismissModal: function() {
			$('body').removeClass('modal');
			$('.modal-content').removeClass('import export');
			$('form', '.modal-content').off('submit');
		},
		importModal : function() {
			var app = this;
			var content = $('.modal-content');
			content.addClass('import');

			$('.title', content).html('Import XML');
			$('.description', content).html('Import XML');
			
			var html = '<textarea name="xml-text" placeholder="Paste your XML here..."></textarea>';
			
			if (window.File && window.FileReader && window.FileList && window.Blob) {
				html += '<p class="or">or</p><input type="file" name="xml-file" accept="application/xml">';
			}
			
			html += '<input type="submit" value="Import">';
			
			$('form', content)
				.html(html)
				.on('submit', function(e) {
					var file = $('[name="xml-file"]')[0].files[0];
					if(file != null) {
						var reader = new FileReader();
						reader.onload = (function(f) {
							return function(e) {
								var content = e.target.result;
								app.fromXML(content);
							};
						})(file);
						
						reader.readAsText(file);
					} else {
						var xml = $('[name="xml-text"]', this).val();
						app.fromXML(xml);
					}
					
					app.dismissModal();

					e.preventDefault();
					return false;
				});
			this.modal();
		},
		exportModal : function() {
			var app = this;
			var content = $('.modal-content');
			content.addClass('export');
			
			$('.title', content).html('Export XML');
			$('.description', content).html('');
			
			var xml = this.toXML();
			
			$('form', content).html('<a class="download">Download</a><br><textarea name="export-xml">'+xml+'</textarea>');
			$('.download', content).on('click', function(e) {
				var uriContent = "data:application/xml," + encodeURIComponent(app.toXML());
				newWindow=window.open(uriContent, 'newDocument');
			});
			this.modal();
		}
		
	};
	
	var todo = new Todo();
	todo.init();

	var newTask = $('.new-task');
	
	newTask.on('submit', function(e) {
		e.preventDefault();

		var thing = $('[name="thing"]', this);
		var date = $('[name="date"]', this);
		
		var obj = {
			id : uniqid(),
			content: thing.val(),
			date: date.val(),
			timestamp: time(),
			done : false
		}
		
		thing.val('');
		date.val('');
		
		todo.newTask(obj);
		return false;
	});
	
	$(document).on('click', '.tasks li .remove', function(e) {
		var id = $(this).parent().data('id');
		todo.removeTask(id);
	});
	$(document)
		.on('dblclick', '.tasks li .content', function(e) {
			
			if($(this).parent().hasClass('done')) return;
		
			var id = $(this).parent().data('id');
			$(this).parent().addClass('editing');
			$(this)
				.prop('contenteditable', true)
				.focus()
			
		})
		.on('keydown', '.tasks li .content',  function(e) {
			if(e.keyCode == 13) {
				e.preventDefault();
				$(this).blur();
			}
		})
		.on('blur', '.tasks li .content',  function(e) {
			var id = $(this).parent().data('id');
			
			$(this).parent().removeClass('editing');
			$(this).prop('contenteditable', false);
			if($(this).html().length <=0) {
				$(this).html(todo.data[id].content);
			}
			
			todo.updateTask(id, $(this).html());
		});
	
	$(document).on('change', '.tasks li .status :checkbox', function(e) {
		var id = $(this).parent().parent().data('id');
		todo.toggleTask(id);
	});
	
	$(document).on('keyup', function(e) {
		if(e.keyCode == 88) {
			console.log(todo.toXML());
		}
	});
	
	
	$('.button-import').on('click', function(e) {
		todo.importModal();
	});
	$('.button-export').on('click', function(e) {
		todo.exportModal();
	});
	
	$('.modal-cover').on('click', function(e) {
		todo.dismissModal();
	});
});







