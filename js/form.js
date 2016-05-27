function validator(form, args) {
	if (form) {
		var self = this; // to reference this inside of event listener functions
		
		// Validate listener for Inputs
		function validateListener(event) {
			self.validateHandler(event.target)
		}
		
		this.args = { // set default args
			success : args.success ? args.success : function() { form.submit() },
			fail : args.fail ?  args.fail : function(msg) { console.log(msg)}
		}
		
		this.element = form;
		this.validate_fields = this.element.querySelectorAll('.validate');
		this.message = {
			errors : 0,
			fields : []
		};
		var validateMethods = { // private prop
			required: function(element) {
				element = (element.target) ? element.target : element;
				var val = element.value;
				var required = element.hasAttribute('required');
				if (required || val.length > 0) {
					return true;
				} else {
					false;
				}
			},
			isRequired : function(element) {
				element = (element.target) ? element.target : element;
				var val = element.value;
				if (val.length > 0) {
					return true;
				} else {
					false;
				}
			},
			isNumber : function(element) {
				element = (element.target) ? element.target : element;
				var val = element.value;
				if (validateMethods.required(element)) {
					var re = /^[0-9.]+$/
					var rslt = re.test(val);
					return rslt;
				}
				else {
					return true;
				}
			},
			isEmail: function(element) {
				element = (element.target) ? element.target : element;
				var val = element.value;
				if (validateMethods.required(element)) {
					var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
					var rslt = re.test(val);
					return rslt;
				}
				else {
					return true;
				}
			},
			isChecked: function(element) {
				element = (element.target) ? element.target : element;
				var val = element.value;
				if (validateMethods.required(element)) {
					if (element.checked == true) {
						return true;
					} else {
						element.focus();
						return false;
					}
				} else {
					return true;
				}
			},
			isPhone: function(element) {
				element = (element.target) ? element.target : element;
				var val = element.value;
				if (validateMethods.required(element)) {
					var str = element.value;
					var phone2 = /^(\+\d)*\s*(\(\d{3}\)\s*)*\d{3}(-{0,1}|\s{0,1})\d{2}(-{0,1}|\s{0,1})\d{2}$/;
					if (str.match(phone2)) {
						return true;
					} else {
						element.focus();
						return false;
					}
				}
			},
			isFileExtension: function(element) {
				element = (element.target) ? element.target : element;
				var val = element.value;
				if (validateMethods.required(event.target)) {
					var alphaExp = /.*\.(gif)|(jpeg)|(jpg)|(png)$/;
					if (element.value.toLowerCase().match(alphaExp)) {
						return true;
					} else {
						return false;
					}
				} else {
					return true;
				}
			},
			isDate: function(element) {
				element = (element.target) ? element.target : element;
				var val = element.value;
				var format = "MMDDYYYY";
				if (validateMethods.required(element)) {
					if (format == null) {
						format = "MDY";
					}
					format = format.toUpperCase();
					if (format.length != 3) {
						format = "MDY";
					}
					if ((format.indexOf("M") == -1) || (format.indexOf("D") == -1) || (format.indexOf("Y") == -1)) {
						format = "MDY";
					}
					if (format.substring(0, 1) == "Y") { // If the year is first
						var reg1 = /^\d{2}(\-|\/|\.)\d{1,2}\1\d{1,2}$/;
						var reg2 = /^\d{4}(\-|\/|\.)\d{1,2}\1\d{1,2}$/;
					} else if (format.substring(1, 2) == "Y") { // If the year is second
						var reg1 = /^\d{1,2}(\-|\/|\.)\d{2}\1\d{1,2}$/;
						var reg2 = /^\d{1,2}(\-|\/|\.)\d{4}\1\d{1,2}$/;
					} else { // The year must be third
						var reg1 = /^\d{1,2}(\-|\/|\.)\d{1,2}\1\d{2}$/;
						var reg2 = /^\d{1,2}(\-|\/|\.)\d{1,2}\1\d{4}$/;
					}
					// If it doesn't conform to the right format (with either a 2 digit year or 4 digit year), fail
					if ((reg1.test(val) == false) && (reg2.test(val) == false)) {
						return false;
					}
					var parts = val.split(RegExp.$1); // Split into 3 parts based on what the divider was
					// Check to see if the 3 parts end up making a valid date
					if (format.substring(0, 1) == "M") {
						var mm = parts[0];
					} else
					if (format.substring(1, 2) == "M") {
						var mm = parts[1];
					} else {
						var mm = parts[2];
					}
					if (format.substring(0, 1) == "D") {
						var dd = parts[0];
					} else
					if (format.substring(1, 2) == "D") {
						var dd = parts[1];
					} else {
						var dd = parts[2];
					}
					if (format.substring(0, 1) == "Y") {
						var yy = parts[0];
					} else
					if (format.substring(1, 2) == "Y") {
						var yy = parts[1];
					} else {
						var yy = parts[2];
					}
					if (parseFloat(yy) <= 50) {
						yy = (parseFloat(yy) + 2000).toString();
					}
					if (parseFloat(yy) <= 99) {
						yy = (parseFloat(yy) + 1900).toString();
					}
					var dt = new Date(parseFloat(yy), parseFloat(mm) - 1, parseFloat(dd), 0, 0, 0, 0);
					if (parseFloat(dd) != dt.getDate()) {
						return false;
					}
					if (parseFloat(mm) - 1 != dt.getMonth()) {
						return false;
					}
					return true;
				} else {
					return true;
				}
			},
			isDob : function(element) {
				element = (element.target) ? element.target : element;
				var val = element.value;
				if (validateMethods.required(element)) {
					if(validateMethods.isDate(element)) {
						dob = new Date(val);
						today = new Date();
						today.setFullYear(today.getFullYear() - 5);
						return dob < today;
					}else {
						return false;
					}
				} else {
					return true;
				}
			},
			isName: function(element) {
				element = (element.target) ? element.target : element;
				var val = element.value;
				if (validateMethods.required(element)) {
					return val.length > 1;
				} else {
					return true;
				}
			},
			isPassword: function(element) {
				element = (element.target) ? element.target : element;
				var val = element.value;
				if (validateMethods.required(element)) {
					var re = /^(?=.*\d).{8,20}$/;
					var rslt = re.test(val);
					return rslt;
				} else {
					return true;
				}
			},
			isUrl: function(element) {
				element = (element.target) ? element.target : element;
				var val = element.value;
				if (validateMethods.required(element)) {
					var re = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
					var rslt = re.test(val);
					return rslt;
				} else {
					return true;
				}
			},
			isZip: function(element) {
				element = (element.target) ? element.target : element;
				var val = element.value;
				if (validateMethods.required(element)) {
					var re = /[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}/g;
					var rslt = re.test(val);
					return rslt;
				} else {
					return true;
				}
			},
			isMatch: function(element) {
				element = (element.target) ? element.target : element;
				var val 	= element.value,
					match 	= document.getElementById(element.getAttribute('val-match')).value;
				
				if (val == match) {
					return true;
				}
				else {
					return false;
				}
			}
		}
		
		this.validateHandler = function(element) {	
			var method	= element.getAttribute('data-validate'),
				message 	= element.getAttribute('data-message'),
				parent_el	= element.parentNode,
				required	= element.required;
			method = (required && !method) ? 'isRequired' : method;
			
			if(element.dataset.depends && element.value == '') {
				if(element.dataset.dependsValue && form.elements[element.dataset.depends].value !== element.dataset.dependsValue) {
					element.parentNode.classList.remove('is-error');
					element.parentNode.classList.remove('is-valid');
					return true;
				}
				if(form.elements[element.dataset.depends].value == '') {
					element.parentNode.classList.remove('is-error');
					element.parentNode.classList.remove('is-valid');
					return true;
				}
			}
			
			if(element.hasAttribute('data-min')) { 
				if(element.value.length < Number(element.getAttribute('data-min'))){
					parent_el.classList.remove('is-valid');
					parent_el.classList.add('is-error');
					element.addEventListener('input', validateListener);
					return false;
				}
			}
			
			if(element.hasAttribute('data-max')) { 
				if(element.value.length > Number(element.dataset.max)) {
					parent_el.classList.remove('is-valid');
					parent_el.classList.add('is-error');
					element.addEventListener('input', validateListener);
					return false;
				}
			}

			
			if(method) {
				if (validateMethods[method](element)) {
					parent_el.classList.remove('is-error');
					parent_el.classList.add('is-valid');
					return true;
				} else {
					parent_el.classList.remove('is-valid');
					parent_el.classList.add('is-error');
					element.addEventListener('input', validateListener);
					return false;
				}
			} else {
				return true;
			}
		}
		this.validateForm = function(event) {
			if(event.target) event.preventDefault();
			self.isValid = true;
			self.message.errors = 0;
			self.message.fields = [];
			for (i = 0; i < self.validate_fields.length; i++) {
				if (self.validateHandler(self.validate_fields[i])) {
					continue;
				}
				
				self.message.errors ++;
				self.message.fields.push(self.validate_fields[i].getAttribute('data-message'));
				self.isValid = false;
			}
			if (self.isValid) {
				self.args.success(event);
			} else {
				if (form.querySelector('.is-error .field-element')) form.querySelector('.is-error .field-element').focus();
				self.args.fail(self.message);
			}
			return false;
		}
		this.init = function() {
			for (i = 0; i < self.validate_fields.length; i++) {
				var element = self.validate_fields[i],
					method 	= element.getAttribute('data-validate'),
					isError = element.parentNode.classList.contains('is-error');
				if(isError) {
					element.addEventListener('change', function(event){
						self.validateHandler(event.target)
					});
				}
			}
		}
		this.init();
		form.addEventListener('submit', this.validateForm);
	}else { 
		return null;
	}
}

// Range slider actions
function rangeSliderControl(element, index) {
	var el_tooltip = element.nextElementSibling,
		el_val = element.value,
		// Position
		minVal = Number(element.getAttribute('min')),
		maxVal = Number(element.getAttribute('max')),
		outputW = el_tooltip.offsetWidth,
		outputPos = (el_val - minVal) / (maxVal -minVal),
		// Values
		el_val = Math.floor(el_val/12) + "' " + (el_val%12) + '"' ;
		
		// Set these
		el_tooltip.innerHTML = el_val;
		el_tooltip.style.left= outputPos * 100 + '%';
		el_tooltip.style.marginLeft = (outputW/2) * -outputPos + 'px';
	
	// Input changed
	element.addEventListener('input', sliderControlInput);
	// Mousdown
	element.addEventListener('mousedown', sliderControlMousedown);
	// Mouesup
	element.addEventListener('mouseup', sliderControlMouseup);
	
}

//**Event
function sliderControlInput(event){
		// Get the shit
		var range_marker = document.getElementById(event.target.getAttribute('data-marker'));
		var el_tooltip = event.target.nextElementSibling;
			el_val = event.target.value,
			minVal = Number(event.target.getAttribute('min')),
			maxVal = Number(event.target.getAttribute('max')),outputW = el_tooltip.offsetWidth,
			outputPos = (el_val - minVal) / (maxVal -minVal),
			el_val = Math.floor(el_val/12) + "' " + (el_val%12) + '"' ;
		
		// Set the shit
		el_tooltip.innerHTML = el_val;
		if(range_marker) range_marker.innerHTML = el_val;
		el_tooltip.style.left= outputPos * 100 + '%';
		el_tooltip.style.marginLeft = (outputW/2) * -outputPos + 'px';
		
}

//**Event
function sliderControlMousedown(){
	var el_val = event.target.value,
		el_tooltip = event.target.nextElementSibling,
		minVal = Number(event.target.getAttribute('min')),
		maxVal = Number(event.target.getAttribute('max')),
		outputW = el_tooltip.offsetWidth,
		outputPos = (el_val - minVal) / (maxVal -minVal);
	
	el_val = Math.floor(el_val/12) + "' " + (el_val%12) + '"' ;
	
	event.target.nextElementSibling.innerHTML = el_val;
	el_tooltip.style.left= outputPos * 100 + '%';
	el_tooltip.style.marginLeft = (outputW/2) * -outputPos + 'px';
		
	addClass(el_tooltip.parentNode, 'is-active');
	addClass(el_tooltip.parentNode, 'is-set');
}

//**Event
function sliderControlMouseup(){
	var el_tooltip = event.target.nextElementSibling;
}


// Field actions

function fieldControlFocus(event){
	parent = event.target.parentNode;
	parent.classList.add('is-focused');
}

function fieldControlBlur(event){
	var el_val = event.target.value,
		parent = event.target.parentNode;
	if(el_val !== '') {
		parent.classList.add('is-filled');
	}
	else {
		parent.classList.remove('is-focused');
		parent.classList.remove('is-filled');
	}
}
	

var field_elements = document.querySelectorAll('.field-element')
for (i =0; i < field_elements.length; i++) {
	console.log('Better');
	
	field_elements[i].addEventListener('focus', fieldControlFocus);
	field_elements[i].addEventListener('blur', fieldControlBlur);
}