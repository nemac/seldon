if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
        "use strict";
        if (this == null) {
            throw new TypeError();
        }
        var t = Object(this);
        var len = t.length >>> 0;
        if (len === 0) {
            return -1;
        }
        var n = 0;
        if (arguments.length > 0) {
            n = Number(arguments[1]);
            if (n != n) { // shortcut for verifying if it's NaN
                n = 0;
            } else if (n != 0 && n != Infinity && n != -Infinity) {
                n = (n > 0 || -1) * Math.floor(Math.abs(n));
            }
        }
        if (n >= len) {
            return -1;
        }
        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
        for (; k < len; k++) {
            if (k in t && t[k] === searchElement) {
                return k;
            }
        }
        return -1;
    }
}
/*global describe, it, beforeEach, expect, xit, jasmine */

(function (ns) {
    "use strict";

    var namespace = function (ns, aliases, func) {
        var nsRegExp = /^([a-zA-Z]+)(\.[a-zA-Z]*)*$/,
            nsArray,
            currentNS,
            i;

        //check to assure ns is a properly formatted namespace string
        if (ns.match(nsRegExp) === null || ns === "window") {
            throw new Error("namespace: " + ns + " is a malformed namespace string");
        }

        //check to assure that if alias is defined that func is defined
        if (aliases !== undefined && func === undefined) {
            if (typeof (aliases) === "function") {
                func = aliases;
                aliases = undefined;
            } else if (typeof (aliases) === "object") {
                throw new Error("namespace: if second argument exists, final function argument must exist");
            } else if (typeof (aliases) !== "object") {
                throw new Error("namespace: second argument must be an object of aliased local namespaces");
            }
        } else if (typeof (aliases) !== "object" && typeof (func) === "function") {
            throw new Error("namespace: second argument must be an object of aliased local namespaces");
        }

        //parse namespace string
        nsArray = ns.split(".");

        //set the root namespace to window (if it's not explictly stated)
        if (nsArray[0] === "window") {
            currentNS = window;
        } else {
            currentNS = (window[nsArray[0]] === undefined) ? window[nsArray[0]] = {} : window[nsArray[0]];
        }

        //confirm func is actually a function
        if (func !== undefined && typeof (func) !== "function") {
            throw new Error("namespace: last parameter must be a function that accepts a namespace parameter");
        }

        //build namespace
        for (i = 1; i < nsArray.length; i = i + 1) {
            if (currentNS[nsArray[i]] === undefined) {
                currentNS[nsArray[i]] = {};
            }
            currentNS = currentNS[nsArray[i]];
        }

        //namespaces.push(currentNS);
        //namespace = currentNS;

        //if the function was defined, but no aliases run it on the current namespace
        if (aliases === undefined && func) {
            func(currentNS);
        } else if (func) {
            for (i in aliases) {
                if (aliases.hasOwnProperty(i)) {
                    aliases[i] = namespace(aliases[i]);
                }
            }
            func.call(aliases, currentNS);
        }

        //return namespace
        return currentNS;
    };

    return namespace(ns, function (exports) {
        exports.namespace = namespace;
    });
}("window.jermaine.util"));
window.jermaine.util.namespace("window.jermaine.util", function (ns) {
    "use strict";
    var EventEmitter = function () {
        var that = this,
            listeners = {};

        //an registers event and a listener
        this.on = function (event, listener) {
            if (typeof(event) !== "string") {
                throw new Error("EventEmitter: first argument to 'on' should be a string");
            }
            if (typeof(listener) !== "function") {
                throw new Error("EventEmitter: second argument to 'on' should be a function");
            }
            if (!listeners[event]) {
                listeners[event] = [];
            }
            listeners[event].push(listener);
            return that;
        };

        //alias addListener
        this.addListener = this.on;
    
        this.once = function (event, listener) {
            var f = function () {
                listener(arguments);
                that.removeListener(event, f);
            };

            that.on(event, f);
            return that;
        };

        this.removeListener = function (event, listener) {
            var index;

            if (typeof(event) !== "string") {
                throw new Error("EventEmitter: first parameter to removeListener method must be a string representing an event");
            }
            if (typeof(listener) !== "function") {
                throw new Error("EventEmitter: second parameter must be a function to remove as an event listener");
            }

            index = listeners[event].indexOf(listener);

            if (index !== -1) {
                //remove it from the list
                listeners[event].splice(index,1);
            }

            return that;
        };

        this.removeAllListeners = function (event) {
            if (typeof(event) !== "string") {
                throw new Error("EventEmitter: parameter to removeAllListeners should be a string representing an event");
            }

            if (listeners[event] !== undefined) {
                listeners[event] = [];
            }
            
            return that;
        };
    
        this.setMaxListeners = function (number) {
            return that;
        };

        //get the listeners for an event
        this.listeners = function (event) {
            if (typeof(event) !== 'string') {
                throw new Error("EventEmitter: listeners method must be called with the name of an event");
            } else if (listeners[event] === undefined) {
                return [];
            }
            return listeners[event];
        };

        //execute each of the listeners in order with the specified arguments
        this.emit = function (event, data) {
            var i,
                params;


            if (arguments.length > 1) {
                params = [];
            }

            for (i = 1; i < arguments.length; ++i) {
                params.push(arguments[i]);
            }

            if (listeners[event] !== undefined) {
                for (i = 0; i < listeners[event].length; i=i+1) {
                    listeners[event][i].apply(this, params);
                }
            }
        };

        return that;
    }; //end EventEmitter

    ns.EventEmitter = EventEmitter;
});
window.jermaine.util.namespace("window.jermaine", function (ns) {
    "use strict";
    var that = this,
        Validator,
        validators = {};

    Validator = function (spec) {
        var validatorFunction = function (arg) {
            var result, 
                resultObject = {},
                errorMessage;
            result = spec.call(resultObject, arg);
            if (!result) {
                errorMessage = resultObject.message || "validator failed with parameter " + arg;
                throw new Error(errorMessage);
            }
            return result;
        };
        return validatorFunction;
    };

    Validator.addValidator = function (name, v) {
        if (name === undefined || typeof(name) !== "string") {
            throw new Error("addValidator requires a name to be specified as the first parameter");
        }

        if (v === undefined || typeof(v) !== "function") {
            throw new Error("addValidator requires a function as the second parameter");
        }

        if (validators[name] === undefined) {
            validators[name] = function (expected) {
                return new Validator(function (val) {
                    var resultObject = {"actual":val, "param":val},
                        result = v.call(resultObject, expected);
                    this.message = resultObject.message;
                    return result;
                });
            };
        } else {
            throw new Error("Validator '" + name +"' already defined");
        }
    };

    Validator.getValidator = function (name) {
        var result;

        if (name === undefined) {
            throw new Error("Validator: getValidator method requires a string parameter");
        } else if (typeof (name) !== "string") {
            throw new Error("Validator: parameter to getValidator method must be a string");
        }

        result = validators[name];

        if (result === undefined) {
            throw new Error("Validator: '" + name + "' does not exist");
        }

        return result;
    };


    Validator.validators = function () {
        var prop,
            result = [];
        for (prop in validators) {
            if (validators.hasOwnProperty(prop)) {
                result.push(prop);
            }
        }

        return result;
    };

    Validator.addValidator("isGreaterThan", function (val) {
        this.message = this.param + " should be greater than " + val;
        return this.param > val;
    });

    Validator.addValidator("isLessThan", function (val) {
        this.message = this.param + " should be less than " + val;
        return this.param < val;
    });

    Validator.addValidator("isA", function (val) {
        var types = ["string", "number", "boolean", "function", "object"];
        if (typeof(val) === "string" && types.indexOf(val) > -1) {
            this.message = this.param + " should be a " + val;
            return typeof(this.param) === val;
        } else if (val === 'integer') {
            // special case for 'integer'; since javascript has no integer type,
            // just check for number type and check that it's numerically an int
            if (this.param.toString !== undefined)  {
                this.message = this.param.toString() + " should be an integer";
            } else {
                this.message = "parameter should be an integer";
            }
            return (typeof(this.param) === 'number') && (parseInt(this.param,10) === this.param);
        } else if (typeof(val) === "string") {
            throw new Error("Validator: isA accepts a string which is one of " + types);
        } else {
            throw new Error("Validator: isA only accepts a string for a primitive types for the time being");
        }
    });

    validators.isAn = validators.isA;

    Validator.addValidator("isOneOf", function (val) {
        this.message = this.param + " should be one of the set: " + val;
        return val.indexOf(this.param) > -1;
    });

    ns.Validator = Validator;
});
/*
  + what about isNotGreaterThan()?, isNotLessThan()?  Or, better still: a general 'not' operator, as in jasmine?
*/

window.jermaine.util.namespace("window.jermaine", function (ns) {
    "use strict";

    var staticValidators = {};

    var Attr = function (name) {
        var validators = [],
            that = this,
            errorMessage = "invalid setter call for " + name,
            defaultValueOrFunction,
            getDefaultValue,
            i,
            prop,
            addValidator,
            immutable = false,
            validator,
            delegate,
            AttrList = window.jermaine.AttrList,
            Validator = window.jermaine.Validator,
            EventEmitter = window.jermaine.util.EventEmitter;



        /* This is the validator that combines all the specified validators */
        validator = function (thingBeingValidated) {
            for (i = 0; i < validators.length; ++i) {
                validators[i](thingBeingValidated);
            }
            return true;
        };

        getDefaultValue = function() {
            return (typeof(defaultValueOrFunction) === 'function') ? defaultValueOrFunction() : defaultValueOrFunction;
        };

        if (name === undefined || typeof(name) !== 'string') {
            throw new Error("Attr: constructor requires a name parameter which must be a string");
        }

        this.validatesWith = function (v) {
            if (typeof(v) === 'function') {
                validators.push(new Validator(v));
                return this;
            } else {
                throw new Error("Attr: validator must be a function");
            }
        };

        this.defaultsTo = function (value) {
            defaultValueOrFunction = value;
            return this;
        };

        this.isImmutable = function () {
            immutable = true;
            return this;
        };

        this.isMutable = function () {
            immutable = false;
            return this;
        };

        this.name = function () {
            return name;
        };

        this.clone = function () {
            var result = (this instanceof AttrList)?new AttrList(name):new Attr(name),
                i;

            for (i = 0; i < validators.length; ++i) {
                result.validatesWith(validators[i]);
            }

            result.defaultsTo(defaultValueOrFunction);
            if (immutable) {
                result.isImmutable();
            }

            return result;
        };

        //syntactic sugar
        this.and = this;
        this.which = this;

        this.validator = function () {
            return validator;
        };

        this.addTo = function (obj) {
            var attribute,
                listener,
                defaultValue;

            if (!obj || typeof(obj) !== 'object') {
                throw new Error("Attr: addAttr method requires an object parameter");
            }

            defaultValue = getDefaultValue();

            if (defaultValue !== undefined && validator(defaultValue)) {
                attribute = defaultValue;
            } else if (defaultValue !== undefined && !validator(defaultValue)) {
                throw new Error("Attr: Default value of " + defaultValue + " does not pass validation for " + name);
            }

            obj[name] = function (newValue) {
                var emittedData = [],
                    emit = true,
                    i;

                if (newValue !== undefined) {
                    //setter
                    if (immutable && attribute !== undefined) {
                        throw new Error("cannot set the immutable property " + name + " after it has been set");
                    } else
                    if (!validator(newValue)) {
                        throw new Error(errorMessage);
                    } else {
                        if ((obj instanceof EventEmitter || obj.on && obj.emitter().emit) && newValue !== null && newValue.on) {
                            //first, we remove the old listener if it exists
                            if (attribute && attribute.emitter().listeners("change").length > 0 && typeof(listener) === "function") {
                                attribute.emitter().removeListener("change", listener);
                            }
                            //then we create and add the new listener
                            listener =  function (data) {
                                for (i = 0; i < data.length && emit; ++i) {
                                    if (data[i].origin === obj) {
                                        emit = false;
                                    }
                                }

                                if (emit && data.push) {
                                    data.push({key:name, origin:obj});
                                    obj.emitter().emit("change", data);
                                }
                            };
                            if (newValue.on && newValue.emitter) {
                                newValue.emitter().on("change", listener);
                            }
                        }

                        //finally set the value
                        attribute = newValue;
                        emittedData.push({key:name, value:newValue, origin:obj});

                        if ((obj instanceof EventEmitter || obj.on && obj.emitter().emit)) {
                            obj.emitter().emit("change", emittedData);
                        }
                    }
                    return obj;
                } else {
                    return attribute;
                }
            };
        };

        //add a single validator object to the attribute
        addValidator = function (name) {
            that[name] = function (param) {
                validators.push(Validator.getValidator(name)(param));
                return that;
            };
        };

        //add the validators to the attribute
        for (i = 0; i < Validator.validators().length; ++i) {
            addValidator(Validator.validators()[i]);
        }
    };

    ns.Attr = Attr;
});
window.jermaine.util.namespace("window.jermaine", function (ns) {
    "use strict";

    function AttrList(name) {
        var that = this;

        //this is where the inheritance happens now
        ns.Attr.call(this, name);

        var delegate = function (obj, func) {
            return function () { return obj[func].apply(obj, arguments); };
        };

        //syntactic sugar to keep things grammatically correct
        this.validateWith = this.validatesWith;

        //disable defaultsTo and isImmutable until we figure out how to make it make sense
        this.defaultsTo = function () {
            //no op
        };

        this.isImmutable = function () {
            //no op
        };

        this.isMutable = function () {
            //no op
        };

        this.eachOfWhich = this;

        this.addTo = function (obj) {
            var prop,
            arr = [],
            actualList = {};
            if(!obj || typeof(obj) !== 'object') {
                throw new Error("AttrList: addTo method requires an object parameter");                
            } else {
                actualList.pop = delegate(arr, "pop");
                
                actualList.add = function (obj) {
                    if ((that.validator())(obj)) {
                        arr.push(obj);
                        return this;         
                    } else {
                        throw new Error(that.errorMessage());
                    }
                };

                actualList.replace = function (index, obj) {
                    if ((typeof(index) !== 'number') || (parseInt(index, 10) !== index)) {
                        throw new Error("AttrList: replace method requires index parameter to be an integer");
                    }

                    if (index < 0 || index >= this.size()) {
                        throw new Error("AttrList: replace method index parameter out of bounds");
                    }

                    if (!(that.validator())(obj)) {
                        throw new Error(that.errorMessage());
                    }

                    arr[index] = obj;
                    return this;
                };

                actualList.at = function (index) {
                    if (index < 0 || index >= this.size()) {
                        throw new Error("AttrList: Index out of bounds");
                    }
                    return arr[index];
                };

                //to keep things more java-y
                actualList.get = actualList.at;

                actualList.size = function () {
                    return arr.length;
                };

                obj[name] = function () {
                    return actualList;
                };
            }
        };
    }

    //this needs to stay if we're going to use instanceof
    //but note we override all of the methods via delegation
    //so it's not doing anything except for making an AttrList
    //an instance of Attr
    AttrList.prototype = new window.jermaine.Attr(name);

    ns.AttrList = AttrList;
});
window.jermaine.util.namespace("window.jermaine", function (ns) {
    "use strict";

    var Method = function (name, method) {
        if (!name || typeof(name) !== "string") { 
            throw new Error("Method: constructor requires a name parameter which must be a string");
        } else if (!method || typeof(method) !== "function") {
            throw new Error("Method: second parameter must be a function");
        }
        
        this.addTo = function (obj) {
            if (!obj || typeof(obj) !== 'object') {
                throw new Error("Method: addTo method requires an object parameter");
            }
            
            obj[name] = method;
        };
    };
    ns.Method = Method;
});
window.jermaine.util.namespace("window.jermaine", function (ns) {
    "use strict";
    function Model(specification) {
        var that = this,
            methods = {},
            attributes = {},
            pattern,
            getObserver,
            setObserver,
            modified = true,
            requiredConstructorArgs = [],
            optionalConstructorArgs = [],
            parents = [],
            Method = ns.Method,
            Attr = ns.Attr,
            AttrList = ns.AttrList,
            EventEmitter = ns.util.EventEmitter,
            property,
            listProperties,
            create,
            isImmutable,
            initializer = function () {},
            constructor = function () {},
            model = function () {
                if (modified) {
                    create();
                }
                return constructor.apply(this, arguments);
            };


        //make instances of models instances of eventemitters
        //model.prototype = new EventEmitter();

        //temporary fix so API stays the same
        if (arguments.length > 1) {
            specification = arguments[arguments.length-1];
        }

        //handle specification function
        if (specification && typeof(specification) === "function") {
            model = new Model();
            specification.call(model);
            return model;
        } else if (specification) {
            throw new Error("Model: specification parameter must be a function");
        }

        /********** BEGIN PRIVATE METHODS ****************/
        /* private method that abstracts hasA/hasMany */
        var hasAProperty = function (type, name) {
            var Property,
                methodName,
                attribute;

            //Property is one of Attr or AttrList
            Property = type==="Attr"?Attr:AttrList;

            //methodName is either hasA or hasMany
            methodName = type==="Attr"?"hasA":"hasMany";

            modified = true;
            
            if (typeof(name) === 'string') {
                attribute = new Property(name);
                attributes[name] = attribute;
                return attribute;
            } else {
                throw new Error("Model: " + methodName + " parameter must be a string");
            }
        };

        /* private method that abstracts attribute/method */
        property = function (type, name) {
            var result;

            if (typeof(name) !== "string") {
                throw new Error("Model: expected string argument to " + type + " method, but recieved " + name);
            }

            result = type==="attribute" ? attributes[name] : methods[name];

            if (result === undefined) {
                throw new Error("Model: " + type + " " + name  + " does not exist!");
            }

            return result;
        };

        /* private method that abstracts attributes/methods */
        listProperties = function (type) {
            var i,
            list = [],
            properties = type==="attributes"?attributes:methods;

            for (i in properties) {
                if (properties.hasOwnProperty(i)) {
                    list.push(i);
                }
            }

            return list;
        };

        /* private function that creates the constructor */
        create = function (name) {
            var that = this,
                i, j,
                err;

            //validate the model first
            model.validate();

            constructor = function () {
                var that = this,
                    i,
                    attribute,
                    emitter,
                    addProperties;

                if (!(this instanceof model)) {
                    throw new Error("Model: instances must be created using the new operator");
                }

                //utility function that adds methods and attributes
                addProperties = function (obj, type) {
                    var properties = type==="attributes" ? attributes : methods,
                    i;
                    for (i in properties) {
                        if (properties.hasOwnProperty(i)) {
                            //if the object is immutable, all attributes should be immutable
                            if(properties === attributes && isImmutable) {
                                properties[i].isImmutable();
                            }
                            properties[i].addTo(obj);
                        }
                    }
                };

                emitter = new EventEmitter();

                this.emitter = function () {
                    return emitter;
                };

                //expose the the on method
                this.on = function (event, listener) {
                    that.emitter().on(event, function (data) {
                        listener.call(that, data);
                    });
                };

                //add attributes
                addProperties(this, "attributes");
                addProperties(this, "methods");

                if (pattern !== undefined) {
                    this.toString = pattern;
                }

                //use constructor args to build object
                if(arguments.length > 0) {
                    if (arguments.length < requiredConstructorArgs.length) {
                        //construct and throw error
                        err = "Constructor requires ";
                        for(i = 0; i < requiredConstructorArgs.length; ++i) {
                            err += requiredConstructorArgs[i];
                            err += i===requiredConstructorArgs.length-1?"":", ";
                        }
                        err += " to be specified";
                        throw new Error(err);
                    } else {
                        for (i = 0; i < arguments.length; ++i) {
                            attribute = i < requiredConstructorArgs.length?
                                requiredConstructorArgs[i]:
                                optionalConstructorArgs[i-requiredConstructorArgs.length];


                            if (model.attribute(attribute) instanceof AttrList) {
                                //make sure that arguments[i] is an array
                                if (Object.prototype.toString.call(arguments[i]) !== "[object Array]") {
                                    throw new Error("Model: Constructor requires 'names' attribute to be set with an Array");
                                } else {
                                    //iterate over the array adding the elements
                                    for (j = 0; j < arguments[i].length; ++j) {
                                        this[attribute]().add(arguments[i][j]);
                                    }
                                }
                            } else {
                                //go ahead and set it like normal
                                this[attribute](arguments[i]);
                            }
                        }
                    }
                }
                initializer.call(this);
            };
            return constructor;
        };
        /*********** END PRIVATE METHODS **************/


        /*********** BEGIN PUBLIC API *****************/
        model.hasA = function (attr) {
            return hasAProperty("Attr", attr);
        };
        
        model.hasAn = model.hasA;
        model.hasSome = model.hasA;
        
        model.hasMany = function (attrs) {
            return hasAProperty("AttrList", attrs);
        };

        model.isA = function (parent) {
            var i,
                parentAttributes,
                parentMethods,
                isAModel;

            modified = true;

            //checks to make sure a potentialModel has all attributes of a model
            isAModel = function (potentialModel) {
                var i,
                    M = new Model();
                for (i in M) {
                    if (M.hasOwnProperty(i) && typeof(potentialModel[i]) !== typeof(M[i])) {
                        return false;
                    }
                }
                return true;
            };

            //confirm parent is a model via duck-typing
            if (typeof (parent) !== "function" || !isAModel(parent)) {
                throw new Error("Model: parameter sent to isA function must be a Model");
            }

            //only allow single inheritance for now
            if (parents.length === 0) {
                parents.push(parent);
            } else {
                throw new Error("Model: Model only supports single inheritance at this time");
            }

            //add attributes and methods to current model
            parentAttributes = parents[0].attributes();
            for (i = 0; i < parentAttributes.length; ++i) {
                if (attributes[parentAttributes[i]] === undefined) {
                    attributes[parentAttributes[i]] = parents[0].attribute(parentAttributes[i]).clone();
                    //subclass attributes are mutable by default
                    attributes[parentAttributes[i]].isMutable();
                }
            }

            parentMethods = parents[0].methods();
            for (i = 0; i < parentMethods.length; ++i) {
                if (methods[parentMethods[i]] === undefined) {
                    methods[parentMethods[i]] = parents[0].method(parentMethods[i]);
                }
            }            

            for (i = 0; i < parents.length; i++) {
                model.prototype = new parents[i]();
            }
        };

        model.isAn = model.isA;

        model.parent = function () {
            return parents[0].apply(this, arguments);
        };

        model.attribute = function (attr) {
            return property("attribute", attr);
        };

        model.attributes = function () {
            return listProperties("attributes");
        };

        model.method = function (m) {
            return property("method", m);
        };
        
        model.methods = function () {
            return listProperties("methods");
        };

        model.isBuiltWith = function () {
            var optionalParamFlag = false,
            i;

            modified = true;
            requiredConstructorArgs = [];
            optionalConstructorArgs = [];

            for (i = 0; i < arguments.length; ++i) {
                if (typeof(arguments[i]) === "string" && arguments[i].charAt(0) !== '%') {
                    //in required parms
                    if (optionalParamFlag) {
                        //throw error
                        throw new Error("Model: isBuiltWith requires parameters preceded with a % to be the final parameters before the optional function");
                    } else {
                        //insert into required array
                        requiredConstructorArgs.push(arguments[i]);
                    }
                } else if(typeof(arguments[i]) === "string" && arguments[i].charAt(0) === '%') {
                    //in optional parms
                    optionalParamFlag = true;
                    //insert into optional array
                    optionalConstructorArgs.push(arguments[i].slice(1));
                } else if(typeof(arguments[i]) === "function" && i === arguments.length - 1) {
                    //init function
                    initializer = arguments[i];
                } else {
                    throw new Error("Model: isBuiltWith parameters must be strings except for a function as the optional final parameter");
                }
            }
        };
        
        model.isImmutable = function () {
            isImmutable = true;
        };

        model.looksLike = function (p) {
            modified = true;
            pattern = p;
        };

        model.respondsTo = function (methodName, methodBody) {
            var m = new Method(methodName, methodBody);
            modified = true;
            methods[methodName] = m;
        };
        
        model.validate = function () {
            var i,
            attributes = this.attributes(),
            methods = this.methods();

            //check to make sure that isBuiltWith has actual attributes
            for (i = 0; i < requiredConstructorArgs.length; ++i) {
                try {
                    this.attribute(requiredConstructorArgs[i]);
                } catch (e) {
                    throw new Error(requiredConstructorArgs[i] + ", specified in the isBuiltWith method, is not an attribute");
                }
            }

            for (i = 0; i < optionalConstructorArgs.length; ++i) {
                try {
                    this.attribute(optionalConstructorArgs[i]);
                } catch (e) {
                    throw new Error(optionalConstructorArgs[i] + ", specified in the isBuiltWith method, is not an attribute");
                }
            }

            //check for method/attribute collisions
            for (i = 0; i < attributes.length; i++) {
                if (methods.indexOf(attributes[i]) > -1) {
                    throw new Error("Model: invalid model specification to " + attributes[i] + " being both an attribute and method");
                }
            }

            //check to make sure that all attributes are requiredConstructorArgs if the object is immutable
            if (isImmutable) {
                for (i = 0; i < attributes.length; i++) {
                    if (requiredConstructorArgs.indexOf(attributes[i]) < 0) {
                        throw new Error("immutable objects must have all attributes required in a call to isBuiltWith");
                    }
                }
            }

            //set modifiedSinceLastValidation to false
            modified = false;
        };
        /************** END PUBLIC API ****************/


        
        //here we are returning our model object
        //which is a function with a bunch of methods that
        //manipulate how the function behaves
        return model;
    }

    ns.Model = Model;
});
/*! jQuery v1.7.2 jquery.com | jquery.org/license */
(function(a,b){function cy(a){return f.isWindow(a)?a:a.nodeType===9?a.defaultView||a.parentWindow:!1}function cu(a){if(!cj[a]){var b=c.body,d=f("<"+a+">").appendTo(b),e=d.css("display");d.remove();if(e==="none"||e===""){ck||(ck=c.createElement("iframe"),ck.frameBorder=ck.width=ck.height=0),b.appendChild(ck);if(!cl||!ck.createElement)cl=(ck.contentWindow||ck.contentDocument).document,cl.write((f.support.boxModel?"<!doctype html>":"")+"<html><body>"),cl.close();d=cl.createElement(a),cl.body.appendChild(d),e=f.css(d,"display"),b.removeChild(ck)}cj[a]=e}return cj[a]}function ct(a,b){var c={};f.each(cp.concat.apply([],cp.slice(0,b)),function(){c[this]=a});return c}function cs(){cq=b}function cr(){setTimeout(cs,0);return cq=f.now()}function ci(){try{return new a.ActiveXObject("Microsoft.XMLHTTP")}catch(b){}}function ch(){try{return new a.XMLHttpRequest}catch(b){}}function cb(a,c){a.dataFilter&&(c=a.dataFilter(c,a.dataType));var d=a.dataTypes,e={},g,h,i=d.length,j,k=d[0],l,m,n,o,p;for(g=1;g<i;g++){if(g===1)for(h in a.converters)typeof h=="string"&&(e[h.toLowerCase()]=a.converters[h]);l=k,k=d[g];if(k==="*")k=l;else if(l!=="*"&&l!==k){m=l+" "+k,n=e[m]||e["* "+k];if(!n){p=b;for(o in e){j=o.split(" ");if(j[0]===l||j[0]==="*"){p=e[j[1]+" "+k];if(p){o=e[o],o===!0?n=p:p===!0&&(n=o);break}}}}!n&&!p&&f.error("No conversion from "+m.replace(" "," to ")),n!==!0&&(c=n?n(c):p(o(c)))}}return c}function ca(a,c,d){var e=a.contents,f=a.dataTypes,g=a.responseFields,h,i,j,k;for(i in g)i in d&&(c[g[i]]=d[i]);while(f[0]==="*")f.shift(),h===b&&(h=a.mimeType||c.getResponseHeader("content-type"));if(h)for(i in e)if(e[i]&&e[i].test(h)){f.unshift(i);break}if(f[0]in d)j=f[0];else{for(i in d){if(!f[0]||a.converters[i+" "+f[0]]){j=i;break}k||(k=i)}j=j||k}if(j){j!==f[0]&&f.unshift(j);return d[j]}}function b_(a,b,c,d){if(f.isArray(b))f.each(b,function(b,e){c||bD.test(a)?d(a,e):b_(a+"["+(typeof e=="object"?b:"")+"]",e,c,d)});else if(!c&&f.type(b)==="object")for(var e in b)b_(a+"["+e+"]",b[e],c,d);else d(a,b)}function b$(a,c){var d,e,g=f.ajaxSettings.flatOptions||{};for(d in c)c[d]!==b&&((g[d]?a:e||(e={}))[d]=c[d]);e&&f.extend(!0,a,e)}function bZ(a,c,d,e,f,g){f=f||c.dataTypes[0],g=g||{},g[f]=!0;var h=a[f],i=0,j=h?h.length:0,k=a===bS,l;for(;i<j&&(k||!l);i++)l=h[i](c,d,e),typeof l=="string"&&(!k||g[l]?l=b:(c.dataTypes.unshift(l),l=bZ(a,c,d,e,l,g)));(k||!l)&&!g["*"]&&(l=bZ(a,c,d,e,"*",g));return l}function bY(a){return function(b,c){typeof b!="string"&&(c=b,b="*");if(f.isFunction(c)){var d=b.toLowerCase().split(bO),e=0,g=d.length,h,i,j;for(;e<g;e++)h=d[e],j=/^\+/.test(h),j&&(h=h.substr(1)||"*"),i=a[h]=a[h]||[],i[j?"unshift":"push"](c)}}}function bB(a,b,c){var d=b==="width"?a.offsetWidth:a.offsetHeight,e=b==="width"?1:0,g=4;if(d>0){if(c!=="border")for(;e<g;e+=2)c||(d-=parseFloat(f.css(a,"padding"+bx[e]))||0),c==="margin"?d+=parseFloat(f.css(a,c+bx[e]))||0:d-=parseFloat(f.css(a,"border"+bx[e]+"Width"))||0;return d+"px"}d=by(a,b);if(d<0||d==null)d=a.style[b];if(bt.test(d))return d;d=parseFloat(d)||0;if(c)for(;e<g;e+=2)d+=parseFloat(f.css(a,"padding"+bx[e]))||0,c!=="padding"&&(d+=parseFloat(f.css(a,"border"+bx[e]+"Width"))||0),c==="margin"&&(d+=parseFloat(f.css(a,c+bx[e]))||0);return d+"px"}function bo(a){var b=c.createElement("div");bh.appendChild(b),b.innerHTML=a.outerHTML;return b.firstChild}function bn(a){var b=(a.nodeName||"").toLowerCase();b==="input"?bm(a):b!=="script"&&typeof a.getElementsByTagName!="undefined"&&f.grep(a.getElementsByTagName("input"),bm)}function bm(a){if(a.type==="checkbox"||a.type==="radio")a.defaultChecked=a.checked}function bl(a){return typeof a.getElementsByTagName!="undefined"?a.getElementsByTagName("*"):typeof a.querySelectorAll!="undefined"?a.querySelectorAll("*"):[]}function bk(a,b){var c;b.nodeType===1&&(b.clearAttributes&&b.clearAttributes(),b.mergeAttributes&&b.mergeAttributes(a),c=b.nodeName.toLowerCase(),c==="object"?b.outerHTML=a.outerHTML:c!=="input"||a.type!=="checkbox"&&a.type!=="radio"?c==="option"?b.selected=a.defaultSelected:c==="input"||c==="textarea"?b.defaultValue=a.defaultValue:c==="script"&&b.text!==a.text&&(b.text=a.text):(a.checked&&(b.defaultChecked=b.checked=a.checked),b.value!==a.value&&(b.value=a.value)),b.removeAttribute(f.expando),b.removeAttribute("_submit_attached"),b.removeAttribute("_change_attached"))}function bj(a,b){if(b.nodeType===1&&!!f.hasData(a)){var c,d,e,g=f._data(a),h=f._data(b,g),i=g.events;if(i){delete h.handle,h.events={};for(c in i)for(d=0,e=i[c].length;d<e;d++)f.event.add(b,c,i[c][d])}h.data&&(h.data=f.extend({},h.data))}}function bi(a,b){return f.nodeName(a,"table")?a.getElementsByTagName("tbody")[0]||a.appendChild(a.ownerDocument.createElement("tbody")):a}function U(a){var b=V.split("|"),c=a.createDocumentFragment();if(c.createElement)while(b.length)c.createElement(b.pop());return c}function T(a,b,c){b=b||0;if(f.isFunction(b))return f.grep(a,function(a,d){var e=!!b.call(a,d,a);return e===c});if(b.nodeType)return f.grep(a,function(a,d){return a===b===c});if(typeof b=="string"){var d=f.grep(a,function(a){return a.nodeType===1});if(O.test(b))return f.filter(b,d,!c);b=f.filter(b,d)}return f.grep(a,function(a,d){return f.inArray(a,b)>=0===c})}function S(a){return!a||!a.parentNode||a.parentNode.nodeType===11}function K(){return!0}function J(){return!1}function n(a,b,c){var d=b+"defer",e=b+"queue",g=b+"mark",h=f._data(a,d);h&&(c==="queue"||!f._data(a,e))&&(c==="mark"||!f._data(a,g))&&setTimeout(function(){!f._data(a,e)&&!f._data(a,g)&&(f.removeData(a,d,!0),h.fire())},0)}function m(a){for(var b in a){if(b==="data"&&f.isEmptyObject(a[b]))continue;if(b!=="toJSON")return!1}return!0}function l(a,c,d){if(d===b&&a.nodeType===1){var e="data-"+c.replace(k,"-$1").toLowerCase();d=a.getAttribute(e);if(typeof d=="string"){try{d=d==="true"?!0:d==="false"?!1:d==="null"?null:f.isNumeric(d)?+d:j.test(d)?f.parseJSON(d):d}catch(g){}f.data(a,c,d)}else d=b}return d}function h(a){var b=g[a]={},c,d;a=a.split(/\s+/);for(c=0,d=a.length;c<d;c++)b[a[c]]=!0;return b}var c=a.document,d=a.navigator,e=a.location,f=function(){function J(){if(!e.isReady){try{c.documentElement.doScroll("left")}catch(a){setTimeout(J,1);return}e.ready()}}var e=function(a,b){return new e.fn.init(a,b,h)},f=a.jQuery,g=a.$,h,i=/^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,j=/\S/,k=/^\s+/,l=/\s+$/,m=/^<(\w+)\s*\/?>(?:<\/\1>)?$/,n=/^[\],:{}\s]*$/,o=/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,p=/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,q=/(?:^|:|,)(?:\s*\[)+/g,r=/(webkit)[ \/]([\w.]+)/,s=/(opera)(?:.*version)?[ \/]([\w.]+)/,t=/(msie) ([\w.]+)/,u=/(mozilla)(?:.*? rv:([\w.]+))?/,v=/-([a-z]|[0-9])/ig,w=/^-ms-/,x=function(a,b){return(b+"").toUpperCase()},y=d.userAgent,z,A,B,C=Object.prototype.toString,D=Object.prototype.hasOwnProperty,E=Array.prototype.push,F=Array.prototype.slice,G=String.prototype.trim,H=Array.prototype.indexOf,I={};e.fn=e.prototype={constructor:e,init:function(a,d,f){var g,h,j,k;if(!a)return this;if(a.nodeType){this.context=this[0]=a,this.length=1;return this}if(a==="body"&&!d&&c.body){this.context=c,this[0]=c.body,this.selector=a,this.length=1;return this}if(typeof a=="string"){a.charAt(0)!=="<"||a.charAt(a.length-1)!==">"||a.length<3?g=i.exec(a):g=[null,a,null];if(g&&(g[1]||!d)){if(g[1]){d=d instanceof e?d[0]:d,k=d?d.ownerDocument||d:c,j=m.exec(a),j?e.isPlainObject(d)?(a=[c.createElement(j[1])],e.fn.attr.call(a,d,!0)):a=[k.createElement(j[1])]:(j=e.buildFragment([g[1]],[k]),a=(j.cacheable?e.clone(j.fragment):j.fragment).childNodes);return e.merge(this,a)}h=c.getElementById(g[2]);if(h&&h.parentNode){if(h.id!==g[2])return f.find(a);this.length=1,this[0]=h}this.context=c,this.selector=a;return this}return!d||d.jquery?(d||f).find(a):this.constructor(d).find(a)}if(e.isFunction(a))return f.ready(a);a.selector!==b&&(this.selector=a.selector,this.context=a.context);return e.makeArray(a,this)},selector:"",jquery:"1.7.2",length:0,size:function(){return this.length},toArray:function(){return F.call(this,0)},get:function(a){return a==null?this.toArray():a<0?this[this.length+a]:this[a]},pushStack:function(a,b,c){var d=this.constructor();e.isArray(a)?E.apply(d,a):e.merge(d,a),d.prevObject=this,d.context=this.context,b==="find"?d.selector=this.selector+(this.selector?" ":"")+c:b&&(d.selector=this.selector+"."+b+"("+c+")");return d},each:function(a,b){return e.each(this,a,b)},ready:function(a){e.bindReady(),A.add(a);return this},eq:function(a){a=+a;return a===-1?this.slice(a):this.slice(a,a+1)},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},slice:function(){return this.pushStack(F.apply(this,arguments),"slice",F.call(arguments).join(","))},map:function(a){return this.pushStack(e.map(this,function(b,c){return a.call(b,c,b)}))},end:function(){return this.prevObject||this.constructor(null)},push:E,sort:[].sort,splice:[].splice},e.fn.init.prototype=e.fn,e.extend=e.fn.extend=function(){var a,c,d,f,g,h,i=arguments[0]||{},j=1,k=arguments.length,l=!1;typeof i=="boolean"&&(l=i,i=arguments[1]||{},j=2),typeof i!="object"&&!e.isFunction(i)&&(i={}),k===j&&(i=this,--j);for(;j<k;j++)if((a=arguments[j])!=null)for(c in a){d=i[c],f=a[c];if(i===f)continue;l&&f&&(e.isPlainObject(f)||(g=e.isArray(f)))?(g?(g=!1,h=d&&e.isArray(d)?d:[]):h=d&&e.isPlainObject(d)?d:{},i[c]=e.extend(l,h,f)):f!==b&&(i[c]=f)}return i},e.extend({noConflict:function(b){a.$===e&&(a.$=g),b&&a.jQuery===e&&(a.jQuery=f);return e},isReady:!1,readyWait:1,holdReady:function(a){a?e.readyWait++:e.ready(!0)},ready:function(a){if(a===!0&&!--e.readyWait||a!==!0&&!e.isReady){if(!c.body)return setTimeout(e.ready,1);e.isReady=!0;if(a!==!0&&--e.readyWait>0)return;A.fireWith(c,[e]),e.fn.trigger&&e(c).trigger("ready").off("ready")}},bindReady:function(){if(!A){A=e.Callbacks("once memory");if(c.readyState==="complete")return setTimeout(e.ready,1);if(c.addEventListener)c.addEventListener("DOMContentLoaded",B,!1),a.addEventListener("load",e.ready,!1);else if(c.attachEvent){c.attachEvent("onreadystatechange",B),a.attachEvent("onload",e.ready);var b=!1;try{b=a.frameElement==null}catch(d){}c.documentElement.doScroll&&b&&J()}}},isFunction:function(a){return e.type(a)==="function"},isArray:Array.isArray||function(a){return e.type(a)==="array"},isWindow:function(a){return a!=null&&a==a.window},isNumeric:function(a){return!isNaN(parseFloat(a))&&isFinite(a)},type:function(a){return a==null?String(a):I[C.call(a)]||"object"},isPlainObject:function(a){if(!a||e.type(a)!=="object"||a.nodeType||e.isWindow(a))return!1;try{if(a.constructor&&!D.call(a,"constructor")&&!D.call(a.constructor.prototype,"isPrototypeOf"))return!1}catch(c){return!1}var d;for(d in a);return d===b||D.call(a,d)},isEmptyObject:function(a){for(var b in a)return!1;return!0},error:function(a){throw new Error(a)},parseJSON:function(b){if(typeof b!="string"||!b)return null;b=e.trim(b);if(a.JSON&&a.JSON.parse)return a.JSON.parse(b);if(n.test(b.replace(o,"@").replace(p,"]").replace(q,"")))return(new Function("return "+b))();e.error("Invalid JSON: "+b)},parseXML:function(c){if(typeof c!="string"||!c)return null;var d,f;try{a.DOMParser?(f=new DOMParser,d=f.parseFromString(c,"text/xml")):(d=new ActiveXObject("Microsoft.XMLDOM"),d.async="false",d.loadXML(c))}catch(g){d=b}(!d||!d.documentElement||d.getElementsByTagName("parsererror").length)&&e.error("Invalid XML: "+c);return d},noop:function(){},globalEval:function(b){b&&j.test(b)&&(a.execScript||function(b){a.eval.call(a,b)})(b)},camelCase:function(a){return a.replace(w,"ms-").replace(v,x)},nodeName:function(a,b){return a.nodeName&&a.nodeName.toUpperCase()===b.toUpperCase()},each:function(a,c,d){var f,g=0,h=a.length,i=h===b||e.isFunction(a);if(d){if(i){for(f in a)if(c.apply(a[f],d)===!1)break}else for(;g<h;)if(c.apply(a[g++],d)===!1)break}else if(i){for(f in a)if(c.call(a[f],f,a[f])===!1)break}else for(;g<h;)if(c.call(a[g],g,a[g++])===!1)break;return a},trim:G?function(a){return a==null?"":G.call(a)}:function(a){return a==null?"":(a+"").replace(k,"").replace(l,"")},makeArray:function(a,b){var c=b||[];if(a!=null){var d=e.type(a);a.length==null||d==="string"||d==="function"||d==="regexp"||e.isWindow(a)?E.call(c,a):e.merge(c,a)}return c},inArray:function(a,b,c){var d;if(b){if(H)return H.call(b,a,c);d=b.length,c=c?c<0?Math.max(0,d+c):c:0;for(;c<d;c++)if(c in b&&b[c]===a)return c}return-1},merge:function(a,c){var d=a.length,e=0;if(typeof c.length=="number")for(var f=c.length;e<f;e++)a[d++]=c[e];else while(c[e]!==b)a[d++]=c[e++];a.length=d;return a},grep:function(a,b,c){var d=[],e;c=!!c;for(var f=0,g=a.length;f<g;f++)e=!!b(a[f],f),c!==e&&d.push(a[f]);return d},map:function(a,c,d){var f,g,h=[],i=0,j=a.length,k=a instanceof e||j!==b&&typeof j=="number"&&(j>0&&a[0]&&a[j-1]||j===0||e.isArray(a));if(k)for(;i<j;i++)f=c(a[i],i,d),f!=null&&(h[h.length]=f);else for(g in a)f=c(a[g],g,d),f!=null&&(h[h.length]=f);return h.concat.apply([],h)},guid:1,proxy:function(a,c){if(typeof c=="string"){var d=a[c];c=a,a=d}if(!e.isFunction(a))return b;var f=F.call(arguments,2),g=function(){return a.apply(c,f.concat(F.call(arguments)))};g.guid=a.guid=a.guid||g.guid||e.guid++;return g},access:function(a,c,d,f,g,h,i){var j,k=d==null,l=0,m=a.length;if(d&&typeof d=="object"){for(l in d)e.access(a,c,l,d[l],1,h,f);g=1}else if(f!==b){j=i===b&&e.isFunction(f),k&&(j?(j=c,c=function(a,b,c){return j.call(e(a),c)}):(c.call(a,f),c=null));if(c)for(;l<m;l++)c(a[l],d,j?f.call(a[l],l,c(a[l],d)):f,i);g=1}return g?a:k?c.call(a):m?c(a[0],d):h},now:function(){return(new Date).getTime()},uaMatch:function(a){a=a.toLowerCase();var b=r.exec(a)||s.exec(a)||t.exec(a)||a.indexOf("compatible")<0&&u.exec(a)||[];return{browser:b[1]||"",version:b[2]||"0"}},sub:function(){function a(b,c){return new a.fn.init(b,c)}e.extend(!0,a,this),a.superclass=this,a.fn=a.prototype=this(),a.fn.constructor=a,a.sub=this.sub,a.fn.init=function(d,f){f&&f instanceof e&&!(f instanceof a)&&(f=a(f));return e.fn.init.call(this,d,f,b)},a.fn.init.prototype=a.fn;var b=a(c);return a},browser:{}}),e.each("Boolean Number String Function Array Date RegExp Object".split(" "),function(a,b){I["[object "+b+"]"]=b.toLowerCase()}),z=e.uaMatch(y),z.browser&&(e.browser[z.browser]=!0,e.browser.version=z.version),e.browser.webkit&&(e.browser.safari=!0),j.test(" ")&&(k=/^[\s\xA0]+/,l=/[\s\xA0]+$/),h=e(c),c.addEventListener?B=function(){c.removeEventListener("DOMContentLoaded",B,!1),e.ready()}:c.attachEvent&&(B=function(){c.readyState==="complete"&&(c.detachEvent("onreadystatechange",B),e.ready())});return e}(),g={};f.Callbacks=function(a){a=a?g[a]||h(a):{};var c=[],d=[],e,i,j,k,l,m,n=function(b){var d,e,g,h,i;for(d=0,e=b.length;d<e;d++)g=b[d],h=f.type(g),h==="array"?n(g):h==="function"&&(!a.unique||!p.has(g))&&c.push(g)},o=function(b,f){f=f||[],e=!a.memory||[b,f],i=!0,j=!0,m=k||0,k=0,l=c.length;for(;c&&m<l;m++)if(c[m].apply(b,f)===!1&&a.stopOnFalse){e=!0;break}j=!1,c&&(a.once?e===!0?p.disable():c=[]:d&&d.length&&(e=d.shift(),p.fireWith(e[0],e[1])))},p={add:function(){if(c){var a=c.length;n(arguments),j?l=c.length:e&&e!==!0&&(k=a,o(e[0],e[1]))}return this},remove:function(){if(c){var b=arguments,d=0,e=b.length;for(;d<e;d++)for(var f=0;f<c.length;f++)if(b[d]===c[f]){j&&f<=l&&(l--,f<=m&&m--),c.splice(f--,1);if(a.unique)break}}return this},has:function(a){if(c){var b=0,d=c.length;for(;b<d;b++)if(a===c[b])return!0}return!1},empty:function(){c=[];return this},disable:function(){c=d=e=b;return this},disabled:function(){return!c},lock:function(){d=b,(!e||e===!0)&&p.disable();return this},locked:function(){return!d},fireWith:function(b,c){d&&(j?a.once||d.push([b,c]):(!a.once||!e)&&o(b,c));return this},fire:function(){p.fireWith(this,arguments);return this},fired:function(){return!!i}};return p};var i=[].slice;f.extend({Deferred:function(a){var b=f.Callbacks("once memory"),c=f.Callbacks("once memory"),d=f.Callbacks("memory"),e="pending",g={resolve:b,reject:c,notify:d},h={done:b.add,fail:c.add,progress:d.add,state:function(){return e},isResolved:b.fired,isRejected:c.fired,then:function(a,b,c){i.done(a).fail(b).progress(c);return this},always:function(){i.done.apply(i,arguments).fail.apply(i,arguments);return this},pipe:function(a,b,c){return f.Deferred(function(d){f.each({done:[a,"resolve"],fail:[b,"reject"],progress:[c,"notify"]},function(a,b){var c=b[0],e=b[1],g;f.isFunction(c)?i[a](function(){g=c.apply(this,arguments),g&&f.isFunction(g.promise)?g.promise().then(d.resolve,d.reject,d.notify):d[e+"With"](this===i?d:this,[g])}):i[a](d[e])})}).promise()},promise:function(a){if(a==null)a=h;else for(var b in h)a[b]=h[b];return a}},i=h.promise({}),j;for(j in g)i[j]=g[j].fire,i[j+"With"]=g[j].fireWith;i.done(function(){e="resolved"},c.disable,d.lock).fail(function(){e="rejected"},b.disable,d.lock),a&&a.call(i,i);return i},when:function(a){function m(a){return function(b){e[a]=arguments.length>1?i.call(arguments,0):b,j.notifyWith(k,e)}}function l(a){return function(c){b[a]=arguments.length>1?i.call(arguments,0):c,--g||j.resolveWith(j,b)}}var b=i.call(arguments,0),c=0,d=b.length,e=Array(d),g=d,h=d,j=d<=1&&a&&f.isFunction(a.promise)?a:f.Deferred(),k=j.promise();if(d>1){for(;c<d;c++)b[c]&&b[c].promise&&f.isFunction(b[c].promise)?b[c].promise().then(l(c),j.reject,m(c)):--g;g||j.resolveWith(j,b)}else j!==a&&j.resolveWith(j,d?[a]:[]);return k}}),f.support=function(){var b,d,e,g,h,i,j,k,l,m,n,o,p=c.createElement("div"),q=c.documentElement;p.setAttribute("className","t"),p.innerHTML="   <link/><table></table><a href='/a' style='top:1px;float:left;opacity:.55;'>a</a><input type='checkbox'/>",d=p.getElementsByTagName("*"),e=p.getElementsByTagName("a")[0];if(!d||!d.length||!e)return{};g=c.createElement("select"),h=g.appendChild(c.createElement("option")),i=p.getElementsByTagName("input")[0],b={leadingWhitespace:p.firstChild.nodeType===3,tbody:!p.getElementsByTagName("tbody").length,htmlSerialize:!!p.getElementsByTagName("link").length,style:/top/.test(e.getAttribute("style")),hrefNormalized:e.getAttribute("href")==="/a",opacity:/^0.55/.test(e.style.opacity),cssFloat:!!e.style.cssFloat,checkOn:i.value==="on",optSelected:h.selected,getSetAttribute:p.className!=="t",enctype:!!c.createElement("form").enctype,html5Clone:c.createElement("nav").cloneNode(!0).outerHTML!=="<:nav></:nav>",submitBubbles:!0,changeBubbles:!0,focusinBubbles:!1,deleteExpando:!0,noCloneEvent:!0,inlineBlockNeedsLayout:!1,shrinkWrapBlocks:!1,reliableMarginRight:!0,pixelMargin:!0},f.boxModel=b.boxModel=c.compatMode==="CSS1Compat",i.checked=!0,b.noCloneChecked=i.cloneNode(!0).checked,g.disabled=!0,b.optDisabled=!h.disabled;try{delete p.test}catch(r){b.deleteExpando=!1}!p.addEventListener&&p.attachEvent&&p.fireEvent&&(p.attachEvent("onclick",function(){b.noCloneEvent=!1}),p.cloneNode(!0).fireEvent("onclick")),i=c.createElement("input"),i.value="t",i.setAttribute("type","radio"),b.radioValue=i.value==="t",i.setAttribute("checked","checked"),i.setAttribute("name","t"),p.appendChild(i),j=c.createDocumentFragment(),j.appendChild(p.lastChild),b.checkClone=j.cloneNode(!0).cloneNode(!0).lastChild.checked,b.appendChecked=i.checked,j.removeChild(i),j.appendChild(p);if(p.attachEvent)for(n in{submit:1,change:1,focusin:1})m="on"+n,o=m in p,o||(p.setAttribute(m,"return;"),o=typeof p[m]=="function"),b[n+"Bubbles"]=o;j.removeChild(p),j=g=h=p=i=null,f(function(){var d,e,g,h,i,j,l,m,n,q,r,s,t,u=c.getElementsByTagName("body")[0];!u||(m=1,t="padding:0;margin:0;border:",r="position:absolute;top:0;left:0;width:1px;height:1px;",s=t+"0;visibility:hidden;",n="style='"+r+t+"5px solid #000;",q="<div "+n+"display:block;'><div style='"+t+"0;display:block;overflow:hidden;'></div></div>"+"<table "+n+"' cellpadding='0' cellspacing='0'>"+"<tr><td></td></tr></table>",d=c.createElement("div"),d.style.cssText=s+"width:0;height:0;position:static;top:0;margin-top:"+m+"px",u.insertBefore(d,u.firstChild),p=c.createElement("div"),d.appendChild(p),p.innerHTML="<table><tr><td style='"+t+"0;display:none'></td><td>t</td></tr></table>",k=p.getElementsByTagName("td"),o=k[0].offsetHeight===0,k[0].style.display="",k[1].style.display="none",b.reliableHiddenOffsets=o&&k[0].offsetHeight===0,a.getComputedStyle&&(p.innerHTML="",l=c.createElement("div"),l.style.width="0",l.style.marginRight="0",p.style.width="2px",p.appendChild(l),b.reliableMarginRight=(parseInt((a.getComputedStyle(l,null)||{marginRight:0}).marginRight,10)||0)===0),typeof p.style.zoom!="undefined"&&(p.innerHTML="",p.style.width=p.style.padding="1px",p.style.border=0,p.style.overflow="hidden",p.style.display="inline",p.style.zoom=1,b.inlineBlockNeedsLayout=p.offsetWidth===3,p.style.display="block",p.style.overflow="visible",p.innerHTML="<div style='width:5px;'></div>",b.shrinkWrapBlocks=p.offsetWidth!==3),p.style.cssText=r+s,p.innerHTML=q,e=p.firstChild,g=e.firstChild,i=e.nextSibling.firstChild.firstChild,j={doesNotAddBorder:g.offsetTop!==5,doesAddBorderForTableAndCells:i.offsetTop===5},g.style.position="fixed",g.style.top="20px",j.fixedPosition=g.offsetTop===20||g.offsetTop===15,g.style.position=g.style.top="",e.style.overflow="hidden",e.style.position="relative",j.subtractsBorderForOverflowNotVisible=g.offsetTop===-5,j.doesNotIncludeMarginInBodyOffset=u.offsetTop!==m,a.getComputedStyle&&(p.style.marginTop="1%",b.pixelMargin=(a.getComputedStyle(p,null)||{marginTop:0}).marginTop!=="1%"),typeof d.style.zoom!="undefined"&&(d.style.zoom=1),u.removeChild(d),l=p=d=null,f.extend(b,j))});return b}();var j=/^(?:\{.*\}|\[.*\])$/,k=/([A-Z])/g;f.extend({cache:{},uuid:0,expando:"jQuery"+(f.fn.jquery+Math.random()).replace(/\D/g,""),noData:{embed:!0,object:"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",applet:!0},hasData:function(a){a=a.nodeType?f.cache[a[f.expando]]:a[f.expando];return!!a&&!m(a)},data:function(a,c,d,e){if(!!f.acceptData(a)){var g,h,i,j=f.expando,k=typeof c=="string",l=a.nodeType,m=l?f.cache:a,n=l?a[j]:a[j]&&j,o=c==="events";if((!n||!m[n]||!o&&!e&&!m[n].data)&&k&&d===b)return;n||(l?a[j]=n=++f.uuid:n=j),m[n]||(m[n]={},l||(m[n].toJSON=f.noop));if(typeof c=="object"||typeof c=="function")e?m[n]=f.extend(m[n],c):m[n].data=f.extend(m[n].data,c);g=h=m[n],e||(h.data||(h.data={}),h=h.data),d!==b&&(h[f.camelCase(c)]=d);if(o&&!h[c])return g.events;k?(i=h[c],i==null&&(i=h[f.camelCase(c)])):i=h;return i}},removeData:function(a,b,c){if(!!f.acceptData(a)){var d,e,g,h=f.expando,i=a.nodeType,j=i?f.cache:a,k=i?a[h]:h;if(!j[k])return;if(b){d=c?j[k]:j[k].data;if(d){f.isArray(b)||(b in d?b=[b]:(b=f.camelCase(b),b in d?b=[b]:b=b.split(" ")));for(e=0,g=b.length;e<g;e++)delete d[b[e]];if(!(c?m:f.isEmptyObject)(d))return}}if(!c){delete j[k].data;if(!m(j[k]))return}f.support.deleteExpando||!j.setInterval?delete j[k]:j[k]=null,i&&(f.support.deleteExpando?delete a[h]:a.removeAttribute?a.removeAttribute(h):a[h]=null)}},_data:function(a,b,c){return f.data(a,b,c,!0)},acceptData:function(a){if(a.nodeName){var b=f.noData[a.nodeName.toLowerCase()];if(b)return b!==!0&&a.getAttribute("classid")===b}return!0}}),f.fn.extend({data:function(a,c){var d,e,g,h,i,j=this[0],k=0,m=null;if(a===b){if(this.length){m=f.data(j);if(j.nodeType===1&&!f._data(j,"parsedAttrs")){g=j.attributes;for(i=g.length;k<i;k++)h=g[k].name,h.indexOf("data-")===0&&(h=f.camelCase(h.substring(5)),l(j,h,m[h]));f._data(j,"parsedAttrs",!0)}}return m}if(typeof a=="object")return this.each(function(){f.data(this,a)});d=a.split(".",2),d[1]=d[1]?"."+d[1]:"",e=d[1]+"!";return f.access(this,function(c){if(c===b){m=this.triggerHandler("getData"+e,[d[0]]),m===b&&j&&(m=f.data(j,a),m=l(j,a,m));return m===b&&d[1]?this.data(d[0]):m}d[1]=c,this.each(function(){var b=f(this);b.triggerHandler("setData"+e,d),f.data(this,a,c),b.triggerHandler("changeData"+e,d)})},null,c,arguments.length>1,null,!1)},removeData:function(a){return this.each(function(){f.removeData(this,a)})}}),f.extend({_mark:function(a,b){a&&(b=(b||"fx")+"mark",f._data(a,b,(f._data(a,b)||0)+1))},_unmark:function(a,b,c){a!==!0&&(c=b,b=a,a=!1);if(b){c=c||"fx";var d=c+"mark",e=a?0:(f._data(b,d)||1)-1;e?f._data(b,d,e):(f.removeData(b,d,!0),n(b,c,"mark"))}},queue:function(a,b,c){var d;if(a){b=(b||"fx")+"queue",d=f._data(a,b),c&&(!d||f.isArray(c)?d=f._data(a,b,f.makeArray(c)):d.push(c));return d||[]}},dequeue:function(a,b){b=b||"fx";var c=f.queue(a,b),d=c.shift(),e={};d==="inprogress"&&(d=c.shift()),d&&(b==="fx"&&c.unshift("inprogress"),f._data(a,b+".run",e),d.call(a,function(){f.dequeue(a,b)},e)),c.length||(f.removeData(a,b+"queue "+b+".run",!0),n(a,b,"queue"))}}),f.fn.extend({queue:function(a,c){var d=2;typeof a!="string"&&(c=a,a="fx",d--);if(arguments.length<d)return f.queue(this[0],a);return c===b?this:this.each(function(){var b=f.queue(this,a,c);a==="fx"&&b[0]!=="inprogress"&&f.dequeue(this,a)})},dequeue:function(a){return this.each(function(){f.dequeue(this,a)})},delay:function(a,b){a=f.fx?f.fx.speeds[a]||a:a,b=b||"fx";return this.queue(b,function(b,c){var d=setTimeout(b,a);c.stop=function(){clearTimeout(d)}})},clearQueue:function(a){return this.queue(a||"fx",[])},promise:function(a,c){function m(){--h||d.resolveWith(e,[e])}typeof a!="string"&&(c=a,a=b),a=a||"fx";var d=f.Deferred(),e=this,g=e.length,h=1,i=a+"defer",j=a+"queue",k=a+"mark",l;while(g--)if(l=f.data(e[g],i,b,!0)||(f.data(e[g],j,b,!0)||f.data(e[g],k,b,!0))&&f.data(e[g],i,f.Callbacks("once memory"),!0))h++,l.add(m);m();return d.promise(c)}});var o=/[\n\t\r]/g,p=/\s+/,q=/\r/g,r=/^(?:button|input)$/i,s=/^(?:button|input|object|select|textarea)$/i,t=/^a(?:rea)?$/i,u=/^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,v=f.support.getSetAttribute,w,x,y;f.fn.extend({attr:function(a,b){return f.access(this,f.attr,a,b,arguments.length>1)},removeAttr:function(a){return this.each(function(){f.removeAttr(this,a)})},prop:function(a,b){return f.access(this,f.prop,a,b,arguments.length>1)},removeProp:function(a){a=f.propFix[a]||a;return this.each(function(){try{this[a]=b,delete this[a]}catch(c){}})},addClass:function(a){var b,c,d,e,g,h,i;if(f.isFunction(a))return this.each(function(b){f(this).addClass(a.call(this,b,this.className))});if(a&&typeof a=="string"){b=a.split(p);for(c=0,d=this.length;c<d;c++){e=this[c];if(e.nodeType===1)if(!e.className&&b.length===1)e.className=a;else{g=" "+e.className+" ";for(h=0,i=b.length;h<i;h++)~g.indexOf(" "+b[h]+" ")||(g+=b[h]+" ");e.className=f.trim(g)}}}return this},removeClass:function(a){var c,d,e,g,h,i,j;if(f.isFunction(a))return this.each(function(b){f(this).removeClass(a.call(this,b,this.className))});if(a&&typeof a=="string"||a===b){c=(a||"").split(p);for(d=0,e=this.length;d<e;d++){g=this[d];if(g.nodeType===1&&g.className)if(a){h=(" "+g.className+" ").replace(o," ");for(i=0,j=c.length;i<j;i++)h=h.replace(" "+c[i]+" "," ");g.className=f.trim(h)}else g.className=""}}return this},toggleClass:function(a,b){var c=typeof a,d=typeof b=="boolean";if(f.isFunction(a))return this.each(function(c){f(this).toggleClass(a.call(this,c,this.className,b),b)});return this.each(function(){if(c==="string"){var e,g=0,h=f(this),i=b,j=a.split(p);while(e=j[g++])i=d?i:!h.hasClass(e),h[i?"addClass":"removeClass"](e)}else if(c==="undefined"||c==="boolean")this.className&&f._data(this,"__className__",this.className),this.className=this.className||a===!1?"":f._data(this,"__className__")||""})},hasClass:function(a){var b=" "+a+" ",c=0,d=this.length;for(;c<d;c++)if(this[c].nodeType===1&&(" "+this[c].className+" ").replace(o," ").indexOf(b)>-1)return!0;return!1},val:function(a){var c,d,e,g=this[0];{if(!!arguments.length){e=f.isFunction(a);return this.each(function(d){var g=f(this),h;if(this.nodeType===1){e?h=a.call(this,d,g.val()):h=a,h==null?h="":typeof h=="number"?h+="":f.isArray(h)&&(h=f.map(h,function(a){return a==null?"":a+""})),c=f.valHooks[this.type]||f.valHooks[this.nodeName.toLowerCase()];if(!c||!("set"in c)||c.set(this,h,"value")===b)this.value=h}})}if(g){c=f.valHooks[g.type]||f.valHooks[g.nodeName.toLowerCase()];if(c&&"get"in c&&(d=c.get(g,"value"))!==b)return d;d=g.value;return typeof d=="string"?d.replace(q,""):d==null?"":d}}}}),f.extend({valHooks:{option:{get:function(a){var b=a.attributes.value;return!b||b.specified?a.value:a.text}},select:{get:function(a){var b,c,d,e,g=a.selectedIndex,h=[],i=a.options,j=a.type==="select-one";if(g<0)return null;c=j?g:0,d=j?g+1:i.length;for(;c<d;c++){e=i[c];if(e.selected&&(f.support.optDisabled?!e.disabled:e.getAttribute("disabled")===null)&&(!e.parentNode.disabled||!f.nodeName(e.parentNode,"optgroup"))){b=f(e).val();if(j)return b;h.push(b)}}if(j&&!h.length&&i.length)return f(i[g]).val();return h},set:function(a,b){var c=f.makeArray(b);f(a).find("option").each(function(){this.selected=f.inArray(f(this).val(),c)>=0}),c.length||(a.selectedIndex=-1);return c}}},attrFn:{val:!0,css:!0,html:!0,text:!0,data:!0,width:!0,height:!0,offset:!0},attr:function(a,c,d,e){var g,h,i,j=a.nodeType;if(!!a&&j!==3&&j!==8&&j!==2){if(e&&c in f.attrFn)return f(a)[c](d);if(typeof a.getAttribute=="undefined")return f.prop(a,c,d);i=j!==1||!f.isXMLDoc(a),i&&(c=c.toLowerCase(),h=f.attrHooks[c]||(u.test(c)?x:w));if(d!==b){if(d===null){f.removeAttr(a,c);return}if(h&&"set"in h&&i&&(g=h.set(a,d,c))!==b)return g;a.setAttribute(c,""+d);return d}if(h&&"get"in h&&i&&(g=h.get(a,c))!==null)return g;g=a.getAttribute(c);return g===null?b:g}},removeAttr:function(a,b){var c,d,e,g,h,i=0;if(b&&a.nodeType===1){d=b.toLowerCase().split(p),g=d.length;for(;i<g;i++)e=d[i],e&&(c=f.propFix[e]||e,h=u.test(e),h||f.attr(a,e,""),a.removeAttribute(v?e:c),h&&c in a&&(a[c]=!1))}},attrHooks:{type:{set:function(a,b){if(r.test(a.nodeName)&&a.parentNode)f.error("type property can't be changed");else if(!f.support.radioValue&&b==="radio"&&f.nodeName(a,"input")){var c=a.value;a.setAttribute("type",b),c&&(a.value=c);return b}}},value:{get:function(a,b){if(w&&f.nodeName(a,"button"))return w.get(a,b);return b in a?a.value:null},set:function(a,b,c){if(w&&f.nodeName(a,"button"))return w.set(a,b,c);a.value=b}}},propFix:{tabindex:"tabIndex",readonly:"readOnly","for":"htmlFor","class":"className",maxlength:"maxLength",cellspacing:"cellSpacing",cellpadding:"cellPadding",rowspan:"rowSpan",colspan:"colSpan",usemap:"useMap",frameborder:"frameBorder",contenteditable:"contentEditable"},prop:function(a,c,d){var e,g,h,i=a.nodeType;if(!!a&&i!==3&&i!==8&&i!==2){h=i!==1||!f.isXMLDoc(a),h&&(c=f.propFix[c]||c,g=f.propHooks[c]);return d!==b?g&&"set"in g&&(e=g.set(a,d,c))!==b?e:a[c]=d:g&&"get"in g&&(e=g.get(a,c))!==null?e:a[c]}},propHooks:{tabIndex:{get:function(a){var c=a.getAttributeNode("tabindex");return c&&c.specified?parseInt(c.value,10):s.test(a.nodeName)||t.test(a.nodeName)&&a.href?0:b}}}}),f.attrHooks.tabindex=f.propHooks.tabIndex,x={get:function(a,c){var d,e=f.prop(a,c);return e===!0||typeof e!="boolean"&&(d=a.getAttributeNode(c))&&d.nodeValue!==!1?c.toLowerCase():b},set:function(a,b,c){var d;b===!1?f.removeAttr(a,c):(d=f.propFix[c]||c,d in a&&(a[d]=!0),a.setAttribute(c,c.toLowerCase()));return c}},v||(y={name:!0,id:!0,coords:!0},w=f.valHooks.button={get:function(a,c){var d;d=a.getAttributeNode(c);return d&&(y[c]?d.nodeValue!=="":d.specified)?d.nodeValue:b},set:function(a,b,d){var e=a.getAttributeNode(d);e||(e=c.createAttribute(d),a.setAttributeNode(e));return e.nodeValue=b+""}},f.attrHooks.tabindex.set=w.set,f.each(["width","height"],function(a,b){f.attrHooks[b]=f.extend(f.attrHooks[b],{set:function(a,c){if(c===""){a.setAttribute(b,"auto");return c}}})}),f.attrHooks.contenteditable={get:w.get,set:function(a,b,c){b===""&&(b="false"),w.set(a,b,c)}}),f.support.hrefNormalized||f.each(["href","src","width","height"],function(a,c){f.attrHooks[c]=f.extend(f.attrHooks[c],{get:function(a){var d=a.getAttribute(c,2);return d===null?b:d}})}),f.support.style||(f.attrHooks.style={get:function(a){return a.style.cssText.toLowerCase()||b},set:function(a,b){return a.style.cssText=""+b}}),f.support.optSelected||(f.propHooks.selected=f.extend(f.propHooks.selected,{get:function(a){var b=a.parentNode;b&&(b.selectedIndex,b.parentNode&&b.parentNode.selectedIndex);return null}})),f.support.enctype||(f.propFix.enctype="encoding"),f.support.checkOn||f.each(["radio","checkbox"],function(){f.valHooks[this]={get:function(a){return a.getAttribute("value")===null?"on":a.value}}}),f.each(["radio","checkbox"],function(){f.valHooks[this]=f.extend(f.valHooks[this],{set:function(a,b){if(f.isArray(b))return a.checked=f.inArray(f(a).val(),b)>=0}})});var z=/^(?:textarea|input|select)$/i,A=/^([^\.]*)?(?:\.(.+))?$/,B=/(?:^|\s)hover(\.\S+)?\b/,C=/^key/,D=/^(?:mouse|contextmenu)|click/,E=/^(?:focusinfocus|focusoutblur)$/,F=/^(\w*)(?:#([\w\-]+))?(?:\.([\w\-]+))?$/,G=function(
a){var b=F.exec(a);b&&(b[1]=(b[1]||"").toLowerCase(),b[3]=b[3]&&new RegExp("(?:^|\\s)"+b[3]+"(?:\\s|$)"));return b},H=function(a,b){var c=a.attributes||{};return(!b[1]||a.nodeName.toLowerCase()===b[1])&&(!b[2]||(c.id||{}).value===b[2])&&(!b[3]||b[3].test((c["class"]||{}).value))},I=function(a){return f.event.special.hover?a:a.replace(B,"mouseenter$1 mouseleave$1")};f.event={add:function(a,c,d,e,g){var h,i,j,k,l,m,n,o,p,q,r,s;if(!(a.nodeType===3||a.nodeType===8||!c||!d||!(h=f._data(a)))){d.handler&&(p=d,d=p.handler,g=p.selector),d.guid||(d.guid=f.guid++),j=h.events,j||(h.events=j={}),i=h.handle,i||(h.handle=i=function(a){return typeof f!="undefined"&&(!a||f.event.triggered!==a.type)?f.event.dispatch.apply(i.elem,arguments):b},i.elem=a),c=f.trim(I(c)).split(" ");for(k=0;k<c.length;k++){l=A.exec(c[k])||[],m=l[1],n=(l[2]||"").split(".").sort(),s=f.event.special[m]||{},m=(g?s.delegateType:s.bindType)||m,s=f.event.special[m]||{},o=f.extend({type:m,origType:l[1],data:e,handler:d,guid:d.guid,selector:g,quick:g&&G(g),namespace:n.join(".")},p),r=j[m];if(!r){r=j[m]=[],r.delegateCount=0;if(!s.setup||s.setup.call(a,e,n,i)===!1)a.addEventListener?a.addEventListener(m,i,!1):a.attachEvent&&a.attachEvent("on"+m,i)}s.add&&(s.add.call(a,o),o.handler.guid||(o.handler.guid=d.guid)),g?r.splice(r.delegateCount++,0,o):r.push(o),f.event.global[m]=!0}a=null}},global:{},remove:function(a,b,c,d,e){var g=f.hasData(a)&&f._data(a),h,i,j,k,l,m,n,o,p,q,r,s;if(!!g&&!!(o=g.events)){b=f.trim(I(b||"")).split(" ");for(h=0;h<b.length;h++){i=A.exec(b[h])||[],j=k=i[1],l=i[2];if(!j){for(j in o)f.event.remove(a,j+b[h],c,d,!0);continue}p=f.event.special[j]||{},j=(d?p.delegateType:p.bindType)||j,r=o[j]||[],m=r.length,l=l?new RegExp("(^|\\.)"+l.split(".").sort().join("\\.(?:.*\\.)?")+"(\\.|$)"):null;for(n=0;n<r.length;n++)s=r[n],(e||k===s.origType)&&(!c||c.guid===s.guid)&&(!l||l.test(s.namespace))&&(!d||d===s.selector||d==="**"&&s.selector)&&(r.splice(n--,1),s.selector&&r.delegateCount--,p.remove&&p.remove.call(a,s));r.length===0&&m!==r.length&&((!p.teardown||p.teardown.call(a,l)===!1)&&f.removeEvent(a,j,g.handle),delete o[j])}f.isEmptyObject(o)&&(q=g.handle,q&&(q.elem=null),f.removeData(a,["events","handle"],!0))}},customEvent:{getData:!0,setData:!0,changeData:!0},trigger:function(c,d,e,g){if(!e||e.nodeType!==3&&e.nodeType!==8){var h=c.type||c,i=[],j,k,l,m,n,o,p,q,r,s;if(E.test(h+f.event.triggered))return;h.indexOf("!")>=0&&(h=h.slice(0,-1),k=!0),h.indexOf(".")>=0&&(i=h.split("."),h=i.shift(),i.sort());if((!e||f.event.customEvent[h])&&!f.event.global[h])return;c=typeof c=="object"?c[f.expando]?c:new f.Event(h,c):new f.Event(h),c.type=h,c.isTrigger=!0,c.exclusive=k,c.namespace=i.join("."),c.namespace_re=c.namespace?new RegExp("(^|\\.)"+i.join("\\.(?:.*\\.)?")+"(\\.|$)"):null,o=h.indexOf(":")<0?"on"+h:"";if(!e){j=f.cache;for(l in j)j[l].events&&j[l].events[h]&&f.event.trigger(c,d,j[l].handle.elem,!0);return}c.result=b,c.target||(c.target=e),d=d!=null?f.makeArray(d):[],d.unshift(c),p=f.event.special[h]||{};if(p.trigger&&p.trigger.apply(e,d)===!1)return;r=[[e,p.bindType||h]];if(!g&&!p.noBubble&&!f.isWindow(e)){s=p.delegateType||h,m=E.test(s+h)?e:e.parentNode,n=null;for(;m;m=m.parentNode)r.push([m,s]),n=m;n&&n===e.ownerDocument&&r.push([n.defaultView||n.parentWindow||a,s])}for(l=0;l<r.length&&!c.isPropagationStopped();l++)m=r[l][0],c.type=r[l][1],q=(f._data(m,"events")||{})[c.type]&&f._data(m,"handle"),q&&q.apply(m,d),q=o&&m[o],q&&f.acceptData(m)&&q.apply(m,d)===!1&&c.preventDefault();c.type=h,!g&&!c.isDefaultPrevented()&&(!p._default||p._default.apply(e.ownerDocument,d)===!1)&&(h!=="click"||!f.nodeName(e,"a"))&&f.acceptData(e)&&o&&e[h]&&(h!=="focus"&&h!=="blur"||c.target.offsetWidth!==0)&&!f.isWindow(e)&&(n=e[o],n&&(e[o]=null),f.event.triggered=h,e[h](),f.event.triggered=b,n&&(e[o]=n));return c.result}},dispatch:function(c){c=f.event.fix(c||a.event);var d=(f._data(this,"events")||{})[c.type]||[],e=d.delegateCount,g=[].slice.call(arguments,0),h=!c.exclusive&&!c.namespace,i=f.event.special[c.type]||{},j=[],k,l,m,n,o,p,q,r,s,t,u;g[0]=c,c.delegateTarget=this;if(!i.preDispatch||i.preDispatch.call(this,c)!==!1){if(e&&(!c.button||c.type!=="click")){n=f(this),n.context=this.ownerDocument||this;for(m=c.target;m!=this;m=m.parentNode||this)if(m.disabled!==!0){p={},r=[],n[0]=m;for(k=0;k<e;k++)s=d[k],t=s.selector,p[t]===b&&(p[t]=s.quick?H(m,s.quick):n.is(t)),p[t]&&r.push(s);r.length&&j.push({elem:m,matches:r})}}d.length>e&&j.push({elem:this,matches:d.slice(e)});for(k=0;k<j.length&&!c.isPropagationStopped();k++){q=j[k],c.currentTarget=q.elem;for(l=0;l<q.matches.length&&!c.isImmediatePropagationStopped();l++){s=q.matches[l];if(h||!c.namespace&&!s.namespace||c.namespace_re&&c.namespace_re.test(s.namespace))c.data=s.data,c.handleObj=s,o=((f.event.special[s.origType]||{}).handle||s.handler).apply(q.elem,g),o!==b&&(c.result=o,o===!1&&(c.preventDefault(),c.stopPropagation()))}}i.postDispatch&&i.postDispatch.call(this,c);return c.result}},props:"attrChange attrName relatedNode srcElement altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(a,b){a.which==null&&(a.which=b.charCode!=null?b.charCode:b.keyCode);return a}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(a,d){var e,f,g,h=d.button,i=d.fromElement;a.pageX==null&&d.clientX!=null&&(e=a.target.ownerDocument||c,f=e.documentElement,g=e.body,a.pageX=d.clientX+(f&&f.scrollLeft||g&&g.scrollLeft||0)-(f&&f.clientLeft||g&&g.clientLeft||0),a.pageY=d.clientY+(f&&f.scrollTop||g&&g.scrollTop||0)-(f&&f.clientTop||g&&g.clientTop||0)),!a.relatedTarget&&i&&(a.relatedTarget=i===a.target?d.toElement:i),!a.which&&h!==b&&(a.which=h&1?1:h&2?3:h&4?2:0);return a}},fix:function(a){if(a[f.expando])return a;var d,e,g=a,h=f.event.fixHooks[a.type]||{},i=h.props?this.props.concat(h.props):this.props;a=f.Event(g);for(d=i.length;d;)e=i[--d],a[e]=g[e];a.target||(a.target=g.srcElement||c),a.target.nodeType===3&&(a.target=a.target.parentNode),a.metaKey===b&&(a.metaKey=a.ctrlKey);return h.filter?h.filter(a,g):a},special:{ready:{setup:f.bindReady},load:{noBubble:!0},focus:{delegateType:"focusin"},blur:{delegateType:"focusout"},beforeunload:{setup:function(a,b,c){f.isWindow(this)&&(this.onbeforeunload=c)},teardown:function(a,b){this.onbeforeunload===b&&(this.onbeforeunload=null)}}},simulate:function(a,b,c,d){var e=f.extend(new f.Event,c,{type:a,isSimulated:!0,originalEvent:{}});d?f.event.trigger(e,null,b):f.event.dispatch.call(b,e),e.isDefaultPrevented()&&c.preventDefault()}},f.event.handle=f.event.dispatch,f.removeEvent=c.removeEventListener?function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c,!1)}:function(a,b,c){a.detachEvent&&a.detachEvent("on"+b,c)},f.Event=function(a,b){if(!(this instanceof f.Event))return new f.Event(a,b);a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||a.returnValue===!1||a.getPreventDefault&&a.getPreventDefault()?K:J):this.type=a,b&&f.extend(this,b),this.timeStamp=a&&a.timeStamp||f.now(),this[f.expando]=!0},f.Event.prototype={preventDefault:function(){this.isDefaultPrevented=K;var a=this.originalEvent;!a||(a.preventDefault?a.preventDefault():a.returnValue=!1)},stopPropagation:function(){this.isPropagationStopped=K;var a=this.originalEvent;!a||(a.stopPropagation&&a.stopPropagation(),a.cancelBubble=!0)},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=K,this.stopPropagation()},isDefaultPrevented:J,isPropagationStopped:J,isImmediatePropagationStopped:J},f.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(a,b){f.event.special[a]={delegateType:b,bindType:b,handle:function(a){var c=this,d=a.relatedTarget,e=a.handleObj,g=e.selector,h;if(!d||d!==c&&!f.contains(c,d))a.type=e.origType,h=e.handler.apply(this,arguments),a.type=b;return h}}}),f.support.submitBubbles||(f.event.special.submit={setup:function(){if(f.nodeName(this,"form"))return!1;f.event.add(this,"click._submit keypress._submit",function(a){var c=a.target,d=f.nodeName(c,"input")||f.nodeName(c,"button")?c.form:b;d&&!d._submit_attached&&(f.event.add(d,"submit._submit",function(a){a._submit_bubble=!0}),d._submit_attached=!0)})},postDispatch:function(a){a._submit_bubble&&(delete a._submit_bubble,this.parentNode&&!a.isTrigger&&f.event.simulate("submit",this.parentNode,a,!0))},teardown:function(){if(f.nodeName(this,"form"))return!1;f.event.remove(this,"._submit")}}),f.support.changeBubbles||(f.event.special.change={setup:function(){if(z.test(this.nodeName)){if(this.type==="checkbox"||this.type==="radio")f.event.add(this,"propertychange._change",function(a){a.originalEvent.propertyName==="checked"&&(this._just_changed=!0)}),f.event.add(this,"click._change",function(a){this._just_changed&&!a.isTrigger&&(this._just_changed=!1,f.event.simulate("change",this,a,!0))});return!1}f.event.add(this,"beforeactivate._change",function(a){var b=a.target;z.test(b.nodeName)&&!b._change_attached&&(f.event.add(b,"change._change",function(a){this.parentNode&&!a.isSimulated&&!a.isTrigger&&f.event.simulate("change",this.parentNode,a,!0)}),b._change_attached=!0)})},handle:function(a){var b=a.target;if(this!==b||a.isSimulated||a.isTrigger||b.type!=="radio"&&b.type!=="checkbox")return a.handleObj.handler.apply(this,arguments)},teardown:function(){f.event.remove(this,"._change");return z.test(this.nodeName)}}),f.support.focusinBubbles||f.each({focus:"focusin",blur:"focusout"},function(a,b){var d=0,e=function(a){f.event.simulate(b,a.target,f.event.fix(a),!0)};f.event.special[b]={setup:function(){d++===0&&c.addEventListener(a,e,!0)},teardown:function(){--d===0&&c.removeEventListener(a,e,!0)}}}),f.fn.extend({on:function(a,c,d,e,g){var h,i;if(typeof a=="object"){typeof c!="string"&&(d=d||c,c=b);for(i in a)this.on(i,c,d,a[i],g);return this}d==null&&e==null?(e=c,d=c=b):e==null&&(typeof c=="string"?(e=d,d=b):(e=d,d=c,c=b));if(e===!1)e=J;else if(!e)return this;g===1&&(h=e,e=function(a){f().off(a);return h.apply(this,arguments)},e.guid=h.guid||(h.guid=f.guid++));return this.each(function(){f.event.add(this,a,e,d,c)})},one:function(a,b,c,d){return this.on(a,b,c,d,1)},off:function(a,c,d){if(a&&a.preventDefault&&a.handleObj){var e=a.handleObj;f(a.delegateTarget).off(e.namespace?e.origType+"."+e.namespace:e.origType,e.selector,e.handler);return this}if(typeof a=="object"){for(var g in a)this.off(g,c,a[g]);return this}if(c===!1||typeof c=="function")d=c,c=b;d===!1&&(d=J);return this.each(function(){f.event.remove(this,a,d,c)})},bind:function(a,b,c){return this.on(a,null,b,c)},unbind:function(a,b){return this.off(a,null,b)},live:function(a,b,c){f(this.context).on(a,this.selector,b,c);return this},die:function(a,b){f(this.context).off(a,this.selector||"**",b);return this},delegate:function(a,b,c,d){return this.on(b,a,c,d)},undelegate:function(a,b,c){return arguments.length==1?this.off(a,"**"):this.off(b,a,c)},trigger:function(a,b){return this.each(function(){f.event.trigger(a,b,this)})},triggerHandler:function(a,b){if(this[0])return f.event.trigger(a,b,this[0],!0)},toggle:function(a){var b=arguments,c=a.guid||f.guid++,d=0,e=function(c){var e=(f._data(this,"lastToggle"+a.guid)||0)%d;f._data(this,"lastToggle"+a.guid,e+1),c.preventDefault();return b[e].apply(this,arguments)||!1};e.guid=c;while(d<b.length)b[d++].guid=c;return this.click(e)},hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)}}),f.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(a,b){f.fn[b]=function(a,c){c==null&&(c=a,a=null);return arguments.length>0?this.on(b,null,a,c):this.trigger(b)},f.attrFn&&(f.attrFn[b]=!0),C.test(b)&&(f.event.fixHooks[b]=f.event.keyHooks),D.test(b)&&(f.event.fixHooks[b]=f.event.mouseHooks)}),function(){function x(a,b,c,e,f,g){for(var h=0,i=e.length;h<i;h++){var j=e[h];if(j){var k=!1;j=j[a];while(j){if(j[d]===c){k=e[j.sizset];break}if(j.nodeType===1){g||(j[d]=c,j.sizset=h);if(typeof b!="string"){if(j===b){k=!0;break}}else if(m.filter(b,[j]).length>0){k=j;break}}j=j[a]}e[h]=k}}}function w(a,b,c,e,f,g){for(var h=0,i=e.length;h<i;h++){var j=e[h];if(j){var k=!1;j=j[a];while(j){if(j[d]===c){k=e[j.sizset];break}j.nodeType===1&&!g&&(j[d]=c,j.sizset=h);if(j.nodeName.toLowerCase()===b){k=j;break}j=j[a]}e[h]=k}}}var a=/((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,d="sizcache"+(Math.random()+"").replace(".",""),e=0,g=Object.prototype.toString,h=!1,i=!0,j=/\\/g,k=/\r\n/g,l=/\W/;[0,0].sort(function(){i=!1;return 0});var m=function(b,d,e,f){e=e||[],d=d||c;var h=d;if(d.nodeType!==1&&d.nodeType!==9)return[];if(!b||typeof b!="string")return e;var i,j,k,l,n,q,r,t,u=!0,v=m.isXML(d),w=[],x=b;do{a.exec(""),i=a.exec(x);if(i){x=i[3],w.push(i[1]);if(i[2]){l=i[3];break}}}while(i);if(w.length>1&&p.exec(b))if(w.length===2&&o.relative[w[0]])j=y(w[0]+w[1],d,f);else{j=o.relative[w[0]]?[d]:m(w.shift(),d);while(w.length)b=w.shift(),o.relative[b]&&(b+=w.shift()),j=y(b,j,f)}else{!f&&w.length>1&&d.nodeType===9&&!v&&o.match.ID.test(w[0])&&!o.match.ID.test(w[w.length-1])&&(n=m.find(w.shift(),d,v),d=n.expr?m.filter(n.expr,n.set)[0]:n.set[0]);if(d){n=f?{expr:w.pop(),set:s(f)}:m.find(w.pop(),w.length===1&&(w[0]==="~"||w[0]==="+")&&d.parentNode?d.parentNode:d,v),j=n.expr?m.filter(n.expr,n.set):n.set,w.length>0?k=s(j):u=!1;while(w.length)q=w.pop(),r=q,o.relative[q]?r=w.pop():q="",r==null&&(r=d),o.relative[q](k,r,v)}else k=w=[]}k||(k=j),k||m.error(q||b);if(g.call(k)==="[object Array]")if(!u)e.push.apply(e,k);else if(d&&d.nodeType===1)for(t=0;k[t]!=null;t++)k[t]&&(k[t]===!0||k[t].nodeType===1&&m.contains(d,k[t]))&&e.push(j[t]);else for(t=0;k[t]!=null;t++)k[t]&&k[t].nodeType===1&&e.push(j[t]);else s(k,e);l&&(m(l,h,e,f),m.uniqueSort(e));return e};m.uniqueSort=function(a){if(u){h=i,a.sort(u);if(h)for(var b=1;b<a.length;b++)a[b]===a[b-1]&&a.splice(b--,1)}return a},m.matches=function(a,b){return m(a,null,null,b)},m.matchesSelector=function(a,b){return m(b,null,null,[a]).length>0},m.find=function(a,b,c){var d,e,f,g,h,i;if(!a)return[];for(e=0,f=o.order.length;e<f;e++){h=o.order[e];if(g=o.leftMatch[h].exec(a)){i=g[1],g.splice(1,1);if(i.substr(i.length-1)!=="\\"){g[1]=(g[1]||"").replace(j,""),d=o.find[h](g,b,c);if(d!=null){a=a.replace(o.match[h],"");break}}}}d||(d=typeof b.getElementsByTagName!="undefined"?b.getElementsByTagName("*"):[]);return{set:d,expr:a}},m.filter=function(a,c,d,e){var f,g,h,i,j,k,l,n,p,q=a,r=[],s=c,t=c&&c[0]&&m.isXML(c[0]);while(a&&c.length){for(h in o.filter)if((f=o.leftMatch[h].exec(a))!=null&&f[2]){k=o.filter[h],l=f[1],g=!1,f.splice(1,1);if(l.substr(l.length-1)==="\\")continue;s===r&&(r=[]);if(o.preFilter[h]){f=o.preFilter[h](f,s,d,r,e,t);if(!f)g=i=!0;else if(f===!0)continue}if(f)for(n=0;(j=s[n])!=null;n++)j&&(i=k(j,f,n,s),p=e^i,d&&i!=null?p?g=!0:s[n]=!1:p&&(r.push(j),g=!0));if(i!==b){d||(s=r),a=a.replace(o.match[h],"");if(!g)return[];break}}if(a===q)if(g==null)m.error(a);else break;q=a}return s},m.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)};var n=m.getText=function(a){var b,c,d=a.nodeType,e="";if(d){if(d===1||d===9||d===11){if(typeof a.textContent=="string")return a.textContent;if(typeof a.innerText=="string")return a.innerText.replace(k,"");for(a=a.firstChild;a;a=a.nextSibling)e+=n(a)}else if(d===3||d===4)return a.nodeValue}else for(b=0;c=a[b];b++)c.nodeType!==8&&(e+=n(c));return e},o=m.selectors={order:["ID","NAME","TAG"],match:{ID:/#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,CLASS:/\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,NAME:/\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,ATTR:/\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(?:(['"])(.*?)\3|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/,TAG:/^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,CHILD:/:(only|nth|last|first)-child(?:\(\s*(even|odd|(?:[+\-]?\d+|(?:[+\-]?\d*)?n\s*(?:[+\-]\s*\d+)?))\s*\))?/,POS:/:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,PSEUDO:/:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/},leftMatch:{},attrMap:{"class":"className","for":"htmlFor"},attrHandle:{href:function(a){return a.getAttribute("href")},type:function(a){return a.getAttribute("type")}},relative:{"+":function(a,b){var c=typeof b=="string",d=c&&!l.test(b),e=c&&!d;d&&(b=b.toLowerCase());for(var f=0,g=a.length,h;f<g;f++)if(h=a[f]){while((h=h.previousSibling)&&h.nodeType!==1);a[f]=e||h&&h.nodeName.toLowerCase()===b?h||!1:h===b}e&&m.filter(b,a,!0)},">":function(a,b){var c,d=typeof b=="string",e=0,f=a.length;if(d&&!l.test(b)){b=b.toLowerCase();for(;e<f;e++){c=a[e];if(c){var g=c.parentNode;a[e]=g.nodeName.toLowerCase()===b?g:!1}}}else{for(;e<f;e++)c=a[e],c&&(a[e]=d?c.parentNode:c.parentNode===b);d&&m.filter(b,a,!0)}},"":function(a,b,c){var d,f=e++,g=x;typeof b=="string"&&!l.test(b)&&(b=b.toLowerCase(),d=b,g=w),g("parentNode",b,f,a,d,c)},"~":function(a,b,c){var d,f=e++,g=x;typeof b=="string"&&!l.test(b)&&(b=b.toLowerCase(),d=b,g=w),g("previousSibling",b,f,a,d,c)}},find:{ID:function(a,b,c){if(typeof b.getElementById!="undefined"&&!c){var d=b.getElementById(a[1]);return d&&d.parentNode?[d]:[]}},NAME:function(a,b){if(typeof b.getElementsByName!="undefined"){var c=[],d=b.getElementsByName(a[1]);for(var e=0,f=d.length;e<f;e++)d[e].getAttribute("name")===a[1]&&c.push(d[e]);return c.length===0?null:c}},TAG:function(a,b){if(typeof b.getElementsByTagName!="undefined")return b.getElementsByTagName(a[1])}},preFilter:{CLASS:function(a,b,c,d,e,f){a=" "+a[1].replace(j,"")+" ";if(f)return a;for(var g=0,h;(h=b[g])!=null;g++)h&&(e^(h.className&&(" "+h.className+" ").replace(/[\t\n\r]/g," ").indexOf(a)>=0)?c||d.push(h):c&&(b[g]=!1));return!1},ID:function(a){return a[1].replace(j,"")},TAG:function(a,b){return a[1].replace(j,"").toLowerCase()},CHILD:function(a){if(a[1]==="nth"){a[2]||m.error(a[0]),a[2]=a[2].replace(/^\+|\s*/g,"");var b=/(-?)(\d*)(?:n([+\-]?\d*))?/.exec(a[2]==="even"&&"2n"||a[2]==="odd"&&"2n+1"||!/\D/.test(a[2])&&"0n+"+a[2]||a[2]);a[2]=b[1]+(b[2]||1)-0,a[3]=b[3]-0}else a[2]&&m.error(a[0]);a[0]=e++;return a},ATTR:function(a,b,c,d,e,f){var g=a[1]=a[1].replace(j,"");!f&&o.attrMap[g]&&(a[1]=o.attrMap[g]),a[4]=(a[4]||a[5]||"").replace(j,""),a[2]==="~="&&(a[4]=" "+a[4]+" ");return a},PSEUDO:function(b,c,d,e,f){if(b[1]==="not")if((a.exec(b[3])||"").length>1||/^\w/.test(b[3]))b[3]=m(b[3],null,null,c);else{var g=m.filter(b[3],c,d,!0^f);d||e.push.apply(e,g);return!1}else if(o.match.POS.test(b[0])||o.match.CHILD.test(b[0]))return!0;return b},POS:function(a){a.unshift(!0);return a}},filters:{enabled:function(a){return a.disabled===!1&&a.type!=="hidden"},disabled:function(a){return a.disabled===!0},checked:function(a){return a.checked===!0},selected:function(a){a.parentNode&&a.parentNode.selectedIndex;return a.selected===!0},parent:function(a){return!!a.firstChild},empty:function(a){return!a.firstChild},has:function(a,b,c){return!!m(c[3],a).length},header:function(a){return/h\d/i.test(a.nodeName)},text:function(a){var b=a.getAttribute("type"),c=a.type;return a.nodeName.toLowerCase()==="input"&&"text"===c&&(b===c||b===null)},radio:function(a){return a.nodeName.toLowerCase()==="input"&&"radio"===a.type},checkbox:function(a){return a.nodeName.toLowerCase()==="input"&&"checkbox"===a.type},file:function(a){return a.nodeName.toLowerCase()==="input"&&"file"===a.type},password:function(a){return a.nodeName.toLowerCase()==="input"&&"password"===a.type},submit:function(a){var b=a.nodeName.toLowerCase();return(b==="input"||b==="button")&&"submit"===a.type},image:function(a){return a.nodeName.toLowerCase()==="input"&&"image"===a.type},reset:function(a){var b=a.nodeName.toLowerCase();return(b==="input"||b==="button")&&"reset"===a.type},button:function(a){var b=a.nodeName.toLowerCase();return b==="input"&&"button"===a.type||b==="button"},input:function(a){return/input|select|textarea|button/i.test(a.nodeName)},focus:function(a){return a===a.ownerDocument.activeElement}},setFilters:{first:function(a,b){return b===0},last:function(a,b,c,d){return b===d.length-1},even:function(a,b){return b%2===0},odd:function(a,b){return b%2===1},lt:function(a,b,c){return b<c[3]-0},gt:function(a,b,c){return b>c[3]-0},nth:function(a,b,c){return c[3]-0===b},eq:function(a,b,c){return c[3]-0===b}},filter:{PSEUDO:function(a,b,c,d){var e=b[1],f=o.filters[e];if(f)return f(a,c,b,d);if(e==="contains")return(a.textContent||a.innerText||n([a])||"").indexOf(b[3])>=0;if(e==="not"){var g=b[3];for(var h=0,i=g.length;h<i;h++)if(g[h]===a)return!1;return!0}m.error(e)},CHILD:function(a,b){var c,e,f,g,h,i,j,k=b[1],l=a;switch(k){case"only":case"first":while(l=l.previousSibling)if(l.nodeType===1)return!1;if(k==="first")return!0;l=a;case"last":while(l=l.nextSibling)if(l.nodeType===1)return!1;return!0;case"nth":c=b[2],e=b[3];if(c===1&&e===0)return!0;f=b[0],g=a.parentNode;if(g&&(g[d]!==f||!a.nodeIndex)){i=0;for(l=g.firstChild;l;l=l.nextSibling)l.nodeType===1&&(l.nodeIndex=++i);g[d]=f}j=a.nodeIndex-e;return c===0?j===0:j%c===0&&j/c>=0}},ID:function(a,b){return a.nodeType===1&&a.getAttribute("id")===b},TAG:function(a,b){return b==="*"&&a.nodeType===1||!!a.nodeName&&a.nodeName.toLowerCase()===b},CLASS:function(a,b){return(" "+(a.className||a.getAttribute("class"))+" ").indexOf(b)>-1},ATTR:function(a,b){var c=b[1],d=m.attr?m.attr(a,c):o.attrHandle[c]?o.attrHandle[c](a):a[c]!=null?a[c]:a.getAttribute(c),e=d+"",f=b[2],g=b[4];return d==null?f==="!=":!f&&m.attr?d!=null:f==="="?e===g:f==="*="?e.indexOf(g)>=0:f==="~="?(" "+e+" ").indexOf(g)>=0:g?f==="!="?e!==g:f==="^="?e.indexOf(g)===0:f==="$="?e.substr(e.length-g.length)===g:f==="|="?e===g||e.substr(0,g.length+1)===g+"-":!1:e&&d!==!1},POS:function(a,b,c,d){var e=b[2],f=o.setFilters[e];if(f)return f(a,c,b,d)}}},p=o.match.POS,q=function(a,b){return"\\"+(b-0+1)};for(var r in o.match)o.match[r]=new RegExp(o.match[r].source+/(?![^\[]*\])(?![^\(]*\))/.source),o.leftMatch[r]=new RegExp(/(^(?:.|\r|\n)*?)/.source+o.match[r].source.replace(/\\(\d+)/g,q));o.match.globalPOS=p;var s=function(a,b){a=Array.prototype.slice.call(a,0);if(b){b.push.apply(b,a);return b}return a};try{Array.prototype.slice.call(c.documentElement.childNodes,0)[0].nodeType}catch(t){s=function(a,b){var c=0,d=b||[];if(g.call(a)==="[object Array]")Array.prototype.push.apply(d,a);else if(typeof a.length=="number")for(var e=a.length;c<e;c++)d.push(a[c]);else for(;a[c];c++)d.push(a[c]);return d}}var u,v;c.documentElement.compareDocumentPosition?u=function(a,b){if(a===b){h=!0;return 0}if(!a.compareDocumentPosition||!b.compareDocumentPosition)return a.compareDocumentPosition?-1:1;return a.compareDocumentPosition(b)&4?-1:1}:(u=function(a,b){if(a===b){h=!0;return 0}if(a.sourceIndex&&b.sourceIndex)return a.sourceIndex-b.sourceIndex;var c,d,e=[],f=[],g=a.parentNode,i=b.parentNode,j=g;if(g===i)return v(a,b);if(!g)return-1;if(!i)return 1;while(j)e.unshift(j),j=j.parentNode;j=i;while(j)f.unshift(j),j=j.parentNode;c=e.length,d=f.length;for(var k=0;k<c&&k<d;k++)if(e[k]!==f[k])return v(e[k],f[k]);return k===c?v(a,f[k],-1):v(e[k],b,1)},v=function(a,b,c){if(a===b)return c;var d=a.nextSibling;while(d){if(d===b)return-1;d=d.nextSibling}return 1}),function(){var a=c.createElement("div"),d="script"+(new Date).getTime(),e=c.documentElement;a.innerHTML="<a name='"+d+"'/>",e.insertBefore(a,e.firstChild),c.getElementById(d)&&(o.find.ID=function(a,c,d){if(typeof c.getElementById!="undefined"&&!d){var e=c.getElementById(a[1]);return e?e.id===a[1]||typeof e.getAttributeNode!="undefined"&&e.getAttributeNode("id").nodeValue===a[1]?[e]:b:[]}},o.filter.ID=function(a,b){var c=typeof a.getAttributeNode!="undefined"&&a.getAttributeNode("id");return a.nodeType===1&&c&&c.nodeValue===b}),e.removeChild(a),e=a=null}(),function(){var a=c.createElement("div");a.appendChild(c.createComment("")),a.getElementsByTagName("*").length>0&&(o.find.TAG=function(a,b){var c=b.getElementsByTagName(a[1]);if(a[1]==="*"){var d=[];for(var e=0;c[e];e++)c[e].nodeType===1&&d.push(c[e]);c=d}return c}),a.innerHTML="<a href='#'></a>",a.firstChild&&typeof a.firstChild.getAttribute!="undefined"&&a.firstChild.getAttribute("href")!=="#"&&(o.attrHandle.href=function(a){return a.getAttribute("href",2)}),a=null}(),c.querySelectorAll&&function(){var a=m,b=c.createElement("div"),d="__sizzle__";b.innerHTML="<p class='TEST'></p>";if(!b.querySelectorAll||b.querySelectorAll(".TEST").length!==0){m=function(b,e,f,g){e=e||c;if(!g&&!m.isXML(e)){var h=/^(\w+$)|^\.([\w\-]+$)|^#([\w\-]+$)/.exec(b);if(h&&(e.nodeType===1||e.nodeType===9)){if(h[1])return s(e.getElementsByTagName(b),f);if(h[2]&&o.find.CLASS&&e.getElementsByClassName)return s(e.getElementsByClassName(h[2]),f)}if(e.nodeType===9){if(b==="body"&&e.body)return s([e.body],f);if(h&&h[3]){var i=e.getElementById(h[3]);if(!i||!i.parentNode)return s([],f);if(i.id===h[3])return s([i],f)}try{return s(e.querySelectorAll(b),f)}catch(j){}}else if(e.nodeType===1&&e.nodeName.toLowerCase()!=="object"){var k=e,l=e.getAttribute("id"),n=l||d,p=e.parentNode,q=/^\s*[+~]/.test(b);l?n=n.replace(/'/g,"\\$&"):e.setAttribute("id",n),q&&p&&(e=e.parentNode);try{if(!q||p)return s(e.querySelectorAll("[id='"+n+"'] "+b),f)}catch(r){}finally{l||k.removeAttribute("id")}}}return a(b,e,f,g)};for(var e in a)m[e]=a[e];b=null}}(),function(){var a=c.documentElement,b=a.matchesSelector||a.mozMatchesSelector||a.webkitMatchesSelector||a.msMatchesSelector;if(b){var d=!b.call(c.createElement("div"),"div"),e=!1;try{b.call(c.documentElement,"[test!='']:sizzle")}catch(f){e=!0}m.matchesSelector=function(a,c){c=c.replace(/\=\s*([^'"\]]*)\s*\]/g,"='$1']");if(!m.isXML(a))try{if(e||!o.match.PSEUDO.test(c)&&!/!=/.test(c)){var f=b.call(a,c);if(f||!d||a.document&&a.document.nodeType!==11)return f}}catch(g){}return m(c,null,null,[a]).length>0}}}(),function(){var a=c.createElement("div");a.innerHTML="<div class='test e'></div><div class='test'></div>";if(!!a.getElementsByClassName&&a.getElementsByClassName("e").length!==0){a.lastChild.className="e";if(a.getElementsByClassName("e").length===1)return;o.order.splice(1,0,"CLASS"),o.find.CLASS=function(a,b,c){if(typeof b.getElementsByClassName!="undefined"&&!c)return b.getElementsByClassName(a[1])},a=null}}(),c.documentElement.contains?m.contains=function(a,b){return a!==b&&(a.contains?a.contains(b):!0)}:c.documentElement.compareDocumentPosition?m.contains=function(a,b){return!!(a.compareDocumentPosition(b)&16)}:m.contains=function(){return!1},m.isXML=function(a){var b=(a?a.ownerDocument||a:0).documentElement;return b?b.nodeName!=="HTML":!1};var y=function(a,b,c){var d,e=[],f="",g=b.nodeType?[b]:b;while(d=o.match.PSEUDO.exec(a))f+=d[0],a=a.replace(o.match.PSEUDO,"");a=o.relative[a]?a+"*":a;for(var h=0,i=g.length;h<i;h++)m(a,g[h],e,c);return m.filter(f,e)};m.attr=f.attr,m.selectors.attrMap={},f.find=m,f.expr=m.selectors,f.expr[":"]=f.expr.filters,f.unique=m.uniqueSort,f.text=m.getText,f.isXMLDoc=m.isXML,f.contains=m.contains}();var L=/Until$/,M=/^(?:parents|prevUntil|prevAll)/,N=/,/,O=/^.[^:#\[\.,]*$/,P=Array.prototype.slice,Q=f.expr.match.globalPOS,R={children:!0,contents:!0,next:!0,prev:!0};f.fn.extend({find:function(a){var b=this,c,d;if(typeof a!="string")return f(a).filter(function(){for(c=0,d=b.length;c<d;c++)if(f.contains(b[c],this))return!0});var e=this.pushStack("","find",a),g,h,i;for(c=0,d=this.length;c<d;c++){g=e.length,f.find(a,this[c],e);if(c>0)for(h=g;h<e.length;h++)for(i=0;i<g;i++)if(e[i]===e[h]){e.splice(h--,1);break}}return e},has:function(a){var b=f(a);return this.filter(function(){for(var a=0,c=b.length;a<c;a++)if(f.contains(this,b[a]))return!0})},not:function(a){return this.pushStack(T(this,a,!1),"not",a)},filter:function(a){return this.pushStack(T(this,a,!0),"filter",a)},is:function(a){return!!a&&(typeof a=="string"?Q.test(a)?f(a,this.context).index(this[0])>=0:f.filter(a,this).length>0:this.filter(a).length>0)},closest:function(a,b){var c=[],d,e,g=this[0];if(f.isArray(a)){var h=1;while(g&&g.ownerDocument&&g!==b){for(d=0;d<a.length;d++)f(g).is(a[d])&&c.push({selector:a[d],elem:g,level:h});g=g.parentNode,h++}return c}var i=Q.test(a)||typeof a!="string"?f(a,b||this.context):0;for(d=0,e=this.length;d<e;d++){g=this[d];while(g){if(i?i.index(g)>-1:f.find.matchesSelector(g,a)){c.push(g);break}g=g.parentNode;if(!g||!g.ownerDocument||g===b||g.nodeType===11)break}}c=c.length>1?f.unique(c):c;return this.pushStack(c,"closest",a)},index:function(a){if(!a)return this[0]&&this[0].parentNode?this.prevAll().length:-1;if(typeof a=="string")return f.inArray(this[0],f(a));return f.inArray(a.jquery?a[0]:a,this)},add:function(a,b){var c=typeof a=="string"?f(a,b):f.makeArray(a&&a.nodeType?[a]:a),d=f.merge(this.get(),c);return this.pushStack(S(c[0])||S(d[0])?d:f.unique(d))},andSelf:function(){return this.add(this.prevObject)}}),f.each({parent:function(a){var b=a.parentNode;return b&&b.nodeType!==11?b:null},parents:function(a){return f.dir(a,"parentNode")},parentsUntil:function(a,b,c){return f.dir(a,"parentNode",c)},next:function(a){return f.nth(a,2,"nextSibling")},prev:function(a){return f.nth(a,2,"previousSibling")},nextAll:function(a){return f.dir(a,"nextSibling")},prevAll:function(a){return f.dir(a,"previousSibling")},nextUntil:function(a,b,c){return f.dir(a,"nextSibling",c)},prevUntil:function(a,b,c){return f.dir(a,"previousSibling",c)},siblings:function(a){return f.sibling((a.parentNode||{}).firstChild,a)},children:function(a){return f.sibling(a.firstChild)},contents:function(a){return f.nodeName(a,"iframe")?a.contentDocument||a.contentWindow.document:f.makeArray(a.childNodes)}},function(a,b){f.fn[a]=function(c,d){var e=f.map(this,b,c);L.test(a)||(d=c),d&&typeof d=="string"&&(e=f.filter(d,e)),e=this.length>1&&!R[a]?f.unique(e):e,(this.length>1||N.test(d))&&M.test(a)&&(e=e.reverse());return this.pushStack(e,a,P.call(arguments).join(","))}}),f.extend({filter:function(a,b,c){c&&(a=":not("+a+")");return b.length===1?f.find.matchesSelector(b[0],a)?[b[0]]:[]:f.find.matches(a,b)},dir:function(a,c,d){var e=[],g=a[c];while(g&&g.nodeType!==9&&(d===b||g.nodeType!==1||!f(g).is(d)))g.nodeType===1&&e.push(g),g=g[c];return e},nth:function(a,b,c,d){b=b||1;var e=0;for(;a;a=a[c])if(a.nodeType===1&&++e===b)break;return a},sibling:function(a,b){var c=[];for(;a;a=a.nextSibling)a.nodeType===1&&a!==b&&c.push(a);return c}});var V="abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",W=/ jQuery\d+="(?:\d+|null)"/g,X=/^\s+/,Y=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,Z=/<([\w:]+)/,$=/<tbody/i,_=/<|&#?\w+;/,ba=/<(?:script|style)/i,bb=/<(?:script|object|embed|option|style)/i,bc=new RegExp("<(?:"+V+")[\\s/>]","i"),bd=/checked\s*(?:[^=]|=\s*.checked.)/i,be=/\/(java|ecma)script/i,bf=/^\s*<!(?:\[CDATA\[|\-\-)/,bg={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],area:[1,"<map>","</map>"],_default:[0,"",""]},bh=U(c);bg.optgroup=bg.option,bg.tbody=bg.tfoot=bg.colgroup=bg.caption=bg.thead,bg.th=bg.td,f.support.htmlSerialize||(bg._default=[1,"div<div>","</div>"]),f.fn.extend({text:function(a){return f.access(this,function(a){return a===b?f.text(this):this.empty().append((this[0]&&this[0].ownerDocument||c).createTextNode(a))},null,a,arguments.length)},wrapAll:function(a){if(f.isFunction(a))return this.each(function(b){f(this).wrapAll(a.call(this,b))});if(this[0]){var b=f(a,this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode&&b.insertBefore(this[0]),b.map(function(){var a=this;while(a.firstChild&&a.firstChild.nodeType===1)a=a.firstChild;return a}).append(this)}return this},wrapInner:function(a){if(f.isFunction(a))return this.each(function(b){f(this).wrapInner(a.call(this,b))});return this.each(function(){var b=f(this),c=b.contents();c.length?c.wrapAll(a):b.append(a)})},wrap:function(a){var b=f.isFunction(a);return this.each(function(c){f(this).wrapAll(b?a.call(this,c):a)})},unwrap:function(){return this.parent().each(function(){f.nodeName(this,"body")||f(this).replaceWith(this.childNodes)}).end()},append:function(){return this.domManip(arguments,!0,function(a){this.nodeType===1&&this.appendChild(a)})},prepend:function(){return this.domManip(arguments,!0,function(a){this.nodeType===1&&this.insertBefore(a,this.firstChild)})},before:function(){if(this[0]&&this[0].parentNode)return this.domManip(arguments,!1,function(a){this.parentNode.insertBefore(a,this)});if(arguments.length){var a=f
.clean(arguments);a.push.apply(a,this.toArray());return this.pushStack(a,"before",arguments)}},after:function(){if(this[0]&&this[0].parentNode)return this.domManip(arguments,!1,function(a){this.parentNode.insertBefore(a,this.nextSibling)});if(arguments.length){var a=this.pushStack(this,"after",arguments);a.push.apply(a,f.clean(arguments));return a}},remove:function(a,b){for(var c=0,d;(d=this[c])!=null;c++)if(!a||f.filter(a,[d]).length)!b&&d.nodeType===1&&(f.cleanData(d.getElementsByTagName("*")),f.cleanData([d])),d.parentNode&&d.parentNode.removeChild(d);return this},empty:function(){for(var a=0,b;(b=this[a])!=null;a++){b.nodeType===1&&f.cleanData(b.getElementsByTagName("*"));while(b.firstChild)b.removeChild(b.firstChild)}return this},clone:function(a,b){a=a==null?!1:a,b=b==null?a:b;return this.map(function(){return f.clone(this,a,b)})},html:function(a){return f.access(this,function(a){var c=this[0]||{},d=0,e=this.length;if(a===b)return c.nodeType===1?c.innerHTML.replace(W,""):null;if(typeof a=="string"&&!ba.test(a)&&(f.support.leadingWhitespace||!X.test(a))&&!bg[(Z.exec(a)||["",""])[1].toLowerCase()]){a=a.replace(Y,"<$1></$2>");try{for(;d<e;d++)c=this[d]||{},c.nodeType===1&&(f.cleanData(c.getElementsByTagName("*")),c.innerHTML=a);c=0}catch(g){}}c&&this.empty().append(a)},null,a,arguments.length)},replaceWith:function(a){if(this[0]&&this[0].parentNode){if(f.isFunction(a))return this.each(function(b){var c=f(this),d=c.html();c.replaceWith(a.call(this,b,d))});typeof a!="string"&&(a=f(a).detach());return this.each(function(){var b=this.nextSibling,c=this.parentNode;f(this).remove(),b?f(b).before(a):f(c).append(a)})}return this.length?this.pushStack(f(f.isFunction(a)?a():a),"replaceWith",a):this},detach:function(a){return this.remove(a,!0)},domManip:function(a,c,d){var e,g,h,i,j=a[0],k=[];if(!f.support.checkClone&&arguments.length===3&&typeof j=="string"&&bd.test(j))return this.each(function(){f(this).domManip(a,c,d,!0)});if(f.isFunction(j))return this.each(function(e){var g=f(this);a[0]=j.call(this,e,c?g.html():b),g.domManip(a,c,d)});if(this[0]){i=j&&j.parentNode,f.support.parentNode&&i&&i.nodeType===11&&i.childNodes.length===this.length?e={fragment:i}:e=f.buildFragment(a,this,k),h=e.fragment,h.childNodes.length===1?g=h=h.firstChild:g=h.firstChild;if(g){c=c&&f.nodeName(g,"tr");for(var l=0,m=this.length,n=m-1;l<m;l++)d.call(c?bi(this[l],g):this[l],e.cacheable||m>1&&l<n?f.clone(h,!0,!0):h)}k.length&&f.each(k,function(a,b){b.src?f.ajax({type:"GET",global:!1,url:b.src,async:!1,dataType:"script"}):f.globalEval((b.text||b.textContent||b.innerHTML||"").replace(bf,"/*$0*/")),b.parentNode&&b.parentNode.removeChild(b)})}return this}}),f.buildFragment=function(a,b,d){var e,g,h,i,j=a[0];b&&b[0]&&(i=b[0].ownerDocument||b[0]),i.createDocumentFragment||(i=c),a.length===1&&typeof j=="string"&&j.length<512&&i===c&&j.charAt(0)==="<"&&!bb.test(j)&&(f.support.checkClone||!bd.test(j))&&(f.support.html5Clone||!bc.test(j))&&(g=!0,h=f.fragments[j],h&&h!==1&&(e=h)),e||(e=i.createDocumentFragment(),f.clean(a,i,e,d)),g&&(f.fragments[j]=h?e:1);return{fragment:e,cacheable:g}},f.fragments={},f.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){f.fn[a]=function(c){var d=[],e=f(c),g=this.length===1&&this[0].parentNode;if(g&&g.nodeType===11&&g.childNodes.length===1&&e.length===1){e[b](this[0]);return this}for(var h=0,i=e.length;h<i;h++){var j=(h>0?this.clone(!0):this).get();f(e[h])[b](j),d=d.concat(j)}return this.pushStack(d,a,e.selector)}}),f.extend({clone:function(a,b,c){var d,e,g,h=f.support.html5Clone||f.isXMLDoc(a)||!bc.test("<"+a.nodeName+">")?a.cloneNode(!0):bo(a);if((!f.support.noCloneEvent||!f.support.noCloneChecked)&&(a.nodeType===1||a.nodeType===11)&&!f.isXMLDoc(a)){bk(a,h),d=bl(a),e=bl(h);for(g=0;d[g];++g)e[g]&&bk(d[g],e[g])}if(b){bj(a,h);if(c){d=bl(a),e=bl(h);for(g=0;d[g];++g)bj(d[g],e[g])}}d=e=null;return h},clean:function(a,b,d,e){var g,h,i,j=[];b=b||c,typeof b.createElement=="undefined"&&(b=b.ownerDocument||b[0]&&b[0].ownerDocument||c);for(var k=0,l;(l=a[k])!=null;k++){typeof l=="number"&&(l+="");if(!l)continue;if(typeof l=="string")if(!_.test(l))l=b.createTextNode(l);else{l=l.replace(Y,"<$1></$2>");var m=(Z.exec(l)||["",""])[1].toLowerCase(),n=bg[m]||bg._default,o=n[0],p=b.createElement("div"),q=bh.childNodes,r;b===c?bh.appendChild(p):U(b).appendChild(p),p.innerHTML=n[1]+l+n[2];while(o--)p=p.lastChild;if(!f.support.tbody){var s=$.test(l),t=m==="table"&&!s?p.firstChild&&p.firstChild.childNodes:n[1]==="<table>"&&!s?p.childNodes:[];for(i=t.length-1;i>=0;--i)f.nodeName(t[i],"tbody")&&!t[i].childNodes.length&&t[i].parentNode.removeChild(t[i])}!f.support.leadingWhitespace&&X.test(l)&&p.insertBefore(b.createTextNode(X.exec(l)[0]),p.firstChild),l=p.childNodes,p&&(p.parentNode.removeChild(p),q.length>0&&(r=q[q.length-1],r&&r.parentNode&&r.parentNode.removeChild(r)))}var u;if(!f.support.appendChecked)if(l[0]&&typeof (u=l.length)=="number")for(i=0;i<u;i++)bn(l[i]);else bn(l);l.nodeType?j.push(l):j=f.merge(j,l)}if(d){g=function(a){return!a.type||be.test(a.type)};for(k=0;j[k];k++){h=j[k];if(e&&f.nodeName(h,"script")&&(!h.type||be.test(h.type)))e.push(h.parentNode?h.parentNode.removeChild(h):h);else{if(h.nodeType===1){var v=f.grep(h.getElementsByTagName("script"),g);j.splice.apply(j,[k+1,0].concat(v))}d.appendChild(h)}}}return j},cleanData:function(a){var b,c,d=f.cache,e=f.event.special,g=f.support.deleteExpando;for(var h=0,i;(i=a[h])!=null;h++){if(i.nodeName&&f.noData[i.nodeName.toLowerCase()])continue;c=i[f.expando];if(c){b=d[c];if(b&&b.events){for(var j in b.events)e[j]?f.event.remove(i,j):f.removeEvent(i,j,b.handle);b.handle&&(b.handle.elem=null)}g?delete i[f.expando]:i.removeAttribute&&i.removeAttribute(f.expando),delete d[c]}}}});var bp=/alpha\([^)]*\)/i,bq=/opacity=([^)]*)/,br=/([A-Z]|^ms)/g,bs=/^[\-+]?(?:\d*\.)?\d+$/i,bt=/^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i,bu=/^([\-+])=([\-+.\de]+)/,bv=/^margin/,bw={position:"absolute",visibility:"hidden",display:"block"},bx=["Top","Right","Bottom","Left"],by,bz,bA;f.fn.css=function(a,c){return f.access(this,function(a,c,d){return d!==b?f.style(a,c,d):f.css(a,c)},a,c,arguments.length>1)},f.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=by(a,"opacity");return c===""?"1":c}return a.style.opacity}}},cssNumber:{fillOpacity:!0,fontWeight:!0,lineHeight:!0,opacity:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":f.support.cssFloat?"cssFloat":"styleFloat"},style:function(a,c,d,e){if(!!a&&a.nodeType!==3&&a.nodeType!==8&&!!a.style){var g,h,i=f.camelCase(c),j=a.style,k=f.cssHooks[i];c=f.cssProps[i]||i;if(d===b){if(k&&"get"in k&&(g=k.get(a,!1,e))!==b)return g;return j[c]}h=typeof d,h==="string"&&(g=bu.exec(d))&&(d=+(g[1]+1)*+g[2]+parseFloat(f.css(a,c)),h="number");if(d==null||h==="number"&&isNaN(d))return;h==="number"&&!f.cssNumber[i]&&(d+="px");if(!k||!("set"in k)||(d=k.set(a,d))!==b)try{j[c]=d}catch(l){}}},css:function(a,c,d){var e,g;c=f.camelCase(c),g=f.cssHooks[c],c=f.cssProps[c]||c,c==="cssFloat"&&(c="float");if(g&&"get"in g&&(e=g.get(a,!0,d))!==b)return e;if(by)return by(a,c)},swap:function(a,b,c){var d={},e,f;for(f in b)d[f]=a.style[f],a.style[f]=b[f];e=c.call(a);for(f in b)a.style[f]=d[f];return e}}),f.curCSS=f.css,c.defaultView&&c.defaultView.getComputedStyle&&(bz=function(a,b){var c,d,e,g,h=a.style;b=b.replace(br,"-$1").toLowerCase(),(d=a.ownerDocument.defaultView)&&(e=d.getComputedStyle(a,null))&&(c=e.getPropertyValue(b),c===""&&!f.contains(a.ownerDocument.documentElement,a)&&(c=f.style(a,b))),!f.support.pixelMargin&&e&&bv.test(b)&&bt.test(c)&&(g=h.width,h.width=c,c=e.width,h.width=g);return c}),c.documentElement.currentStyle&&(bA=function(a,b){var c,d,e,f=a.currentStyle&&a.currentStyle[b],g=a.style;f==null&&g&&(e=g[b])&&(f=e),bt.test(f)&&(c=g.left,d=a.runtimeStyle&&a.runtimeStyle.left,d&&(a.runtimeStyle.left=a.currentStyle.left),g.left=b==="fontSize"?"1em":f,f=g.pixelLeft+"px",g.left=c,d&&(a.runtimeStyle.left=d));return f===""?"auto":f}),by=bz||bA,f.each(["height","width"],function(a,b){f.cssHooks[b]={get:function(a,c,d){if(c)return a.offsetWidth!==0?bB(a,b,d):f.swap(a,bw,function(){return bB(a,b,d)})},set:function(a,b){return bs.test(b)?b+"px":b}}}),f.support.opacity||(f.cssHooks.opacity={get:function(a,b){return bq.test((b&&a.currentStyle?a.currentStyle.filter:a.style.filter)||"")?parseFloat(RegExp.$1)/100+"":b?"1":""},set:function(a,b){var c=a.style,d=a.currentStyle,e=f.isNumeric(b)?"alpha(opacity="+b*100+")":"",g=d&&d.filter||c.filter||"";c.zoom=1;if(b>=1&&f.trim(g.replace(bp,""))===""){c.removeAttribute("filter");if(d&&!d.filter)return}c.filter=bp.test(g)?g.replace(bp,e):g+" "+e}}),f(function(){f.support.reliableMarginRight||(f.cssHooks.marginRight={get:function(a,b){return f.swap(a,{display:"inline-block"},function(){return b?by(a,"margin-right"):a.style.marginRight})}})}),f.expr&&f.expr.filters&&(f.expr.filters.hidden=function(a){var b=a.offsetWidth,c=a.offsetHeight;return b===0&&c===0||!f.support.reliableHiddenOffsets&&(a.style&&a.style.display||f.css(a,"display"))==="none"},f.expr.filters.visible=function(a){return!f.expr.filters.hidden(a)}),f.each({margin:"",padding:"",border:"Width"},function(a,b){f.cssHooks[a+b]={expand:function(c){var d,e=typeof c=="string"?c.split(" "):[c],f={};for(d=0;d<4;d++)f[a+bx[d]+b]=e[d]||e[d-2]||e[0];return f}}});var bC=/%20/g,bD=/\[\]$/,bE=/\r?\n/g,bF=/#.*$/,bG=/^(.*?):[ \t]*([^\r\n]*)\r?$/mg,bH=/^(?:color|date|datetime|datetime-local|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i,bI=/^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/,bJ=/^(?:GET|HEAD)$/,bK=/^\/\//,bL=/\?/,bM=/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,bN=/^(?:select|textarea)/i,bO=/\s+/,bP=/([?&])_=[^&]*/,bQ=/^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/,bR=f.fn.load,bS={},bT={},bU,bV,bW=["*/"]+["*"];try{bU=e.href}catch(bX){bU=c.createElement("a"),bU.href="",bU=bU.href}bV=bQ.exec(bU.toLowerCase())||[],f.fn.extend({load:function(a,c,d){if(typeof a!="string"&&bR)return bR.apply(this,arguments);if(!this.length)return this;var e=a.indexOf(" ");if(e>=0){var g=a.slice(e,a.length);a=a.slice(0,e)}var h="GET";c&&(f.isFunction(c)?(d=c,c=b):typeof c=="object"&&(c=f.param(c,f.ajaxSettings.traditional),h="POST"));var i=this;f.ajax({url:a,type:h,dataType:"html",data:c,complete:function(a,b,c){c=a.responseText,a.isResolved()&&(a.done(function(a){c=a}),i.html(g?f("<div>").append(c.replace(bM,"")).find(g):c)),d&&i.each(d,[c,b,a])}});return this},serialize:function(){return f.param(this.serializeArray())},serializeArray:function(){return this.map(function(){return this.elements?f.makeArray(this.elements):this}).filter(function(){return this.name&&!this.disabled&&(this.checked||bN.test(this.nodeName)||bH.test(this.type))}).map(function(a,b){var c=f(this).val();return c==null?null:f.isArray(c)?f.map(c,function(a,c){return{name:b.name,value:a.replace(bE,"\r\n")}}):{name:b.name,value:c.replace(bE,"\r\n")}}).get()}}),f.each("ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "),function(a,b){f.fn[b]=function(a){return this.on(b,a)}}),f.each(["get","post"],function(a,c){f[c]=function(a,d,e,g){f.isFunction(d)&&(g=g||e,e=d,d=b);return f.ajax({type:c,url:a,data:d,success:e,dataType:g})}}),f.extend({getScript:function(a,c){return f.get(a,b,c,"script")},getJSON:function(a,b,c){return f.get(a,b,c,"json")},ajaxSetup:function(a,b){b?b$(a,f.ajaxSettings):(b=a,a=f.ajaxSettings),b$(a,b);return a},ajaxSettings:{url:bU,isLocal:bI.test(bV[1]),global:!0,type:"GET",contentType:"application/x-www-form-urlencoded; charset=UTF-8",processData:!0,async:!0,accepts:{xml:"application/xml, text/xml",html:"text/html",text:"text/plain",json:"application/json, text/javascript","*":bW},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText"},converters:{"* text":a.String,"text html":!0,"text json":f.parseJSON,"text xml":f.parseXML},flatOptions:{context:!0,url:!0}},ajaxPrefilter:bY(bS),ajaxTransport:bY(bT),ajax:function(a,c){function w(a,c,l,m){if(s!==2){s=2,q&&clearTimeout(q),p=b,n=m||"",v.readyState=a>0?4:0;var o,r,u,w=c,x=l?ca(d,v,l):b,y,z;if(a>=200&&a<300||a===304){if(d.ifModified){if(y=v.getResponseHeader("Last-Modified"))f.lastModified[k]=y;if(z=v.getResponseHeader("Etag"))f.etag[k]=z}if(a===304)w="notmodified",o=!0;else try{r=cb(d,x),w="success",o=!0}catch(A){w="parsererror",u=A}}else{u=w;if(!w||a)w="error",a<0&&(a=0)}v.status=a,v.statusText=""+(c||w),o?h.resolveWith(e,[r,w,v]):h.rejectWith(e,[v,w,u]),v.statusCode(j),j=b,t&&g.trigger("ajax"+(o?"Success":"Error"),[v,d,o?r:u]),i.fireWith(e,[v,w]),t&&(g.trigger("ajaxComplete",[v,d]),--f.active||f.event.trigger("ajaxStop"))}}typeof a=="object"&&(c=a,a=b),c=c||{};var d=f.ajaxSetup({},c),e=d.context||d,g=e!==d&&(e.nodeType||e instanceof f)?f(e):f.event,h=f.Deferred(),i=f.Callbacks("once memory"),j=d.statusCode||{},k,l={},m={},n,o,p,q,r,s=0,t,u,v={readyState:0,setRequestHeader:function(a,b){if(!s){var c=a.toLowerCase();a=m[c]=m[c]||a,l[a]=b}return this},getAllResponseHeaders:function(){return s===2?n:null},getResponseHeader:function(a){var c;if(s===2){if(!o){o={};while(c=bG.exec(n))o[c[1].toLowerCase()]=c[2]}c=o[a.toLowerCase()]}return c===b?null:c},overrideMimeType:function(a){s||(d.mimeType=a);return this},abort:function(a){a=a||"abort",p&&p.abort(a),w(0,a);return this}};h.promise(v),v.success=v.done,v.error=v.fail,v.complete=i.add,v.statusCode=function(a){if(a){var b;if(s<2)for(b in a)j[b]=[j[b],a[b]];else b=a[v.status],v.then(b,b)}return this},d.url=((a||d.url)+"").replace(bF,"").replace(bK,bV[1]+"//"),d.dataTypes=f.trim(d.dataType||"*").toLowerCase().split(bO),d.crossDomain==null&&(r=bQ.exec(d.url.toLowerCase()),d.crossDomain=!(!r||r[1]==bV[1]&&r[2]==bV[2]&&(r[3]||(r[1]==="http:"?80:443))==(bV[3]||(bV[1]==="http:"?80:443)))),d.data&&d.processData&&typeof d.data!="string"&&(d.data=f.param(d.data,d.traditional)),bZ(bS,d,c,v);if(s===2)return!1;t=d.global,d.type=d.type.toUpperCase(),d.hasContent=!bJ.test(d.type),t&&f.active++===0&&f.event.trigger("ajaxStart");if(!d.hasContent){d.data&&(d.url+=(bL.test(d.url)?"&":"?")+d.data,delete d.data),k=d.url;if(d.cache===!1){var x=f.now(),y=d.url.replace(bP,"$1_="+x);d.url=y+(y===d.url?(bL.test(d.url)?"&":"?")+"_="+x:"")}}(d.data&&d.hasContent&&d.contentType!==!1||c.contentType)&&v.setRequestHeader("Content-Type",d.contentType),d.ifModified&&(k=k||d.url,f.lastModified[k]&&v.setRequestHeader("If-Modified-Since",f.lastModified[k]),f.etag[k]&&v.setRequestHeader("If-None-Match",f.etag[k])),v.setRequestHeader("Accept",d.dataTypes[0]&&d.accepts[d.dataTypes[0]]?d.accepts[d.dataTypes[0]]+(d.dataTypes[0]!=="*"?", "+bW+"; q=0.01":""):d.accepts["*"]);for(u in d.headers)v.setRequestHeader(u,d.headers[u]);if(d.beforeSend&&(d.beforeSend.call(e,v,d)===!1||s===2)){v.abort();return!1}for(u in{success:1,error:1,complete:1})v[u](d[u]);p=bZ(bT,d,c,v);if(!p)w(-1,"No Transport");else{v.readyState=1,t&&g.trigger("ajaxSend",[v,d]),d.async&&d.timeout>0&&(q=setTimeout(function(){v.abort("timeout")},d.timeout));try{s=1,p.send(l,w)}catch(z){if(s<2)w(-1,z);else throw z}}return v},param:function(a,c){var d=[],e=function(a,b){b=f.isFunction(b)?b():b,d[d.length]=encodeURIComponent(a)+"="+encodeURIComponent(b)};c===b&&(c=f.ajaxSettings.traditional);if(f.isArray(a)||a.jquery&&!f.isPlainObject(a))f.each(a,function(){e(this.name,this.value)});else for(var g in a)b_(g,a[g],c,e);return d.join("&").replace(bC,"+")}}),f.extend({active:0,lastModified:{},etag:{}});var cc=f.now(),cd=/(\=)\?(&|$)|\?\?/i;f.ajaxSetup({jsonp:"callback",jsonpCallback:function(){return f.expando+"_"+cc++}}),f.ajaxPrefilter("json jsonp",function(b,c,d){var e=typeof b.data=="string"&&/^application\/x\-www\-form\-urlencoded/.test(b.contentType);if(b.dataTypes[0]==="jsonp"||b.jsonp!==!1&&(cd.test(b.url)||e&&cd.test(b.data))){var g,h=b.jsonpCallback=f.isFunction(b.jsonpCallback)?b.jsonpCallback():b.jsonpCallback,i=a[h],j=b.url,k=b.data,l="$1"+h+"$2";b.jsonp!==!1&&(j=j.replace(cd,l),b.url===j&&(e&&(k=k.replace(cd,l)),b.data===k&&(j+=(/\?/.test(j)?"&":"?")+b.jsonp+"="+h))),b.url=j,b.data=k,a[h]=function(a){g=[a]},d.always(function(){a[h]=i,g&&f.isFunction(i)&&a[h](g[0])}),b.converters["script json"]=function(){g||f.error(h+" was not called");return g[0]},b.dataTypes[0]="json";return"script"}}),f.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/javascript|ecmascript/},converters:{"text script":function(a){f.globalEval(a);return a}}}),f.ajaxPrefilter("script",function(a){a.cache===b&&(a.cache=!1),a.crossDomain&&(a.type="GET",a.global=!1)}),f.ajaxTransport("script",function(a){if(a.crossDomain){var d,e=c.head||c.getElementsByTagName("head")[0]||c.documentElement;return{send:function(f,g){d=c.createElement("script"),d.async="async",a.scriptCharset&&(d.charset=a.scriptCharset),d.src=a.url,d.onload=d.onreadystatechange=function(a,c){if(c||!d.readyState||/loaded|complete/.test(d.readyState))d.onload=d.onreadystatechange=null,e&&d.parentNode&&e.removeChild(d),d=b,c||g(200,"success")},e.insertBefore(d,e.firstChild)},abort:function(){d&&d.onload(0,1)}}}});var ce=a.ActiveXObject?function(){for(var a in cg)cg[a](0,1)}:!1,cf=0,cg;f.ajaxSettings.xhr=a.ActiveXObject?function(){return!this.isLocal&&ch()||ci()}:ch,function(a){f.extend(f.support,{ajax:!!a,cors:!!a&&"withCredentials"in a})}(f.ajaxSettings.xhr()),f.support.ajax&&f.ajaxTransport(function(c){if(!c.crossDomain||f.support.cors){var d;return{send:function(e,g){var h=c.xhr(),i,j;c.username?h.open(c.type,c.url,c.async,c.username,c.password):h.open(c.type,c.url,c.async);if(c.xhrFields)for(j in c.xhrFields)h[j]=c.xhrFields[j];c.mimeType&&h.overrideMimeType&&h.overrideMimeType(c.mimeType),!c.crossDomain&&!e["X-Requested-With"]&&(e["X-Requested-With"]="XMLHttpRequest");try{for(j in e)h.setRequestHeader(j,e[j])}catch(k){}h.send(c.hasContent&&c.data||null),d=function(a,e){var j,k,l,m,n;try{if(d&&(e||h.readyState===4)){d=b,i&&(h.onreadystatechange=f.noop,ce&&delete cg[i]);if(e)h.readyState!==4&&h.abort();else{j=h.status,l=h.getAllResponseHeaders(),m={},n=h.responseXML,n&&n.documentElement&&(m.xml=n);try{m.text=h.responseText}catch(a){}try{k=h.statusText}catch(o){k=""}!j&&c.isLocal&&!c.crossDomain?j=m.text?200:404:j===1223&&(j=204)}}}catch(p){e||g(-1,p)}m&&g(j,k,m,l)},!c.async||h.readyState===4?d():(i=++cf,ce&&(cg||(cg={},f(a).unload(ce)),cg[i]=d),h.onreadystatechange=d)},abort:function(){d&&d(0,1)}}}});var cj={},ck,cl,cm=/^(?:toggle|show|hide)$/,cn=/^([+\-]=)?([\d+.\-]+)([a-z%]*)$/i,co,cp=[["height","marginTop","marginBottom","paddingTop","paddingBottom"],["width","marginLeft","marginRight","paddingLeft","paddingRight"],["opacity"]],cq;f.fn.extend({show:function(a,b,c){var d,e;if(a||a===0)return this.animate(ct("show",3),a,b,c);for(var g=0,h=this.length;g<h;g++)d=this[g],d.style&&(e=d.style.display,!f._data(d,"olddisplay")&&e==="none"&&(e=d.style.display=""),(e===""&&f.css(d,"display")==="none"||!f.contains(d.ownerDocument.documentElement,d))&&f._data(d,"olddisplay",cu(d.nodeName)));for(g=0;g<h;g++){d=this[g];if(d.style){e=d.style.display;if(e===""||e==="none")d.style.display=f._data(d,"olddisplay")||""}}return this},hide:function(a,b,c){if(a||a===0)return this.animate(ct("hide",3),a,b,c);var d,e,g=0,h=this.length;for(;g<h;g++)d=this[g],d.style&&(e=f.css(d,"display"),e!=="none"&&!f._data(d,"olddisplay")&&f._data(d,"olddisplay",e));for(g=0;g<h;g++)this[g].style&&(this[g].style.display="none");return this},_toggle:f.fn.toggle,toggle:function(a,b,c){var d=typeof a=="boolean";f.isFunction(a)&&f.isFunction(b)?this._toggle.apply(this,arguments):a==null||d?this.each(function(){var b=d?a:f(this).is(":hidden");f(this)[b?"show":"hide"]()}):this.animate(ct("toggle",3),a,b,c);return this},fadeTo:function(a,b,c,d){return this.filter(":hidden").css("opacity",0).show().end().animate({opacity:b},a,c,d)},animate:function(a,b,c,d){function g(){e.queue===!1&&f._mark(this);var b=f.extend({},e),c=this.nodeType===1,d=c&&f(this).is(":hidden"),g,h,i,j,k,l,m,n,o,p,q;b.animatedProperties={};for(i in a){g=f.camelCase(i),i!==g&&(a[g]=a[i],delete a[i]);if((k=f.cssHooks[g])&&"expand"in k){l=k.expand(a[g]),delete a[g];for(i in l)i in a||(a[i]=l[i])}}for(g in a){h=a[g],f.isArray(h)?(b.animatedProperties[g]=h[1],h=a[g]=h[0]):b.animatedProperties[g]=b.specialEasing&&b.specialEasing[g]||b.easing||"swing";if(h==="hide"&&d||h==="show"&&!d)return b.complete.call(this);c&&(g==="height"||g==="width")&&(b.overflow=[this.style.overflow,this.style.overflowX,this.style.overflowY],f.css(this,"display")==="inline"&&f.css(this,"float")==="none"&&(!f.support.inlineBlockNeedsLayout||cu(this.nodeName)==="inline"?this.style.display="inline-block":this.style.zoom=1))}b.overflow!=null&&(this.style.overflow="hidden");for(i in a)j=new f.fx(this,b,i),h=a[i],cm.test(h)?(q=f._data(this,"toggle"+i)||(h==="toggle"?d?"show":"hide":0),q?(f._data(this,"toggle"+i,q==="show"?"hide":"show"),j[q]()):j[h]()):(m=cn.exec(h),n=j.cur(),m?(o=parseFloat(m[2]),p=m[3]||(f.cssNumber[i]?"":"px"),p!=="px"&&(f.style(this,i,(o||1)+p),n=(o||1)/j.cur()*n,f.style(this,i,n+p)),m[1]&&(o=(m[1]==="-="?-1:1)*o+n),j.custom(n,o,p)):j.custom(n,h,""));return!0}var e=f.speed(b,c,d);if(f.isEmptyObject(a))return this.each(e.complete,[!1]);a=f.extend({},a);return e.queue===!1?this.each(g):this.queue(e.queue,g)},stop:function(a,c,d){typeof a!="string"&&(d=c,c=a,a=b),c&&a!==!1&&this.queue(a||"fx",[]);return this.each(function(){function h(a,b,c){var e=b[c];f.removeData(a,c,!0),e.stop(d)}var b,c=!1,e=f.timers,g=f._data(this);d||f._unmark(!0,this);if(a==null)for(b in g)g[b]&&g[b].stop&&b.indexOf(".run")===b.length-4&&h(this,g,b);else g[b=a+".run"]&&g[b].stop&&h(this,g,b);for(b=e.length;b--;)e[b].elem===this&&(a==null||e[b].queue===a)&&(d?e[b](!0):e[b].saveState(),c=!0,e.splice(b,1));(!d||!c)&&f.dequeue(this,a)})}}),f.each({slideDown:ct("show",1),slideUp:ct("hide",1),slideToggle:ct("toggle",1),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){f.fn[a]=function(a,c,d){return this.animate(b,a,c,d)}}),f.extend({speed:function(a,b,c){var d=a&&typeof a=="object"?f.extend({},a):{complete:c||!c&&b||f.isFunction(a)&&a,duration:a,easing:c&&b||b&&!f.isFunction(b)&&b};d.duration=f.fx.off?0:typeof d.duration=="number"?d.duration:d.duration in f.fx.speeds?f.fx.speeds[d.duration]:f.fx.speeds._default;if(d.queue==null||d.queue===!0)d.queue="fx";d.old=d.complete,d.complete=function(a){f.isFunction(d.old)&&d.old.call(this),d.queue?f.dequeue(this,d.queue):a!==!1&&f._unmark(this)};return d},easing:{linear:function(a){return a},swing:function(a){return-Math.cos(a*Math.PI)/2+.5}},timers:[],fx:function(a,b,c){this.options=b,this.elem=a,this.prop=c,b.orig=b.orig||{}}}),f.fx.prototype={update:function(){this.options.step&&this.options.step.call(this.elem,this.now,this),(f.fx.step[this.prop]||f.fx.step._default)(this)},cur:function(){if(this.elem[this.prop]!=null&&(!this.elem.style||this.elem.style[this.prop]==null))return this.elem[this.prop];var a,b=f.css(this.elem,this.prop);return isNaN(a=parseFloat(b))?!b||b==="auto"?0:b:a},custom:function(a,c,d){function h(a){return e.step(a)}var e=this,g=f.fx;this.startTime=cq||cr(),this.end=c,this.now=this.start=a,this.pos=this.state=0,this.unit=d||this.unit||(f.cssNumber[this.prop]?"":"px"),h.queue=this.options.queue,h.elem=this.elem,h.saveState=function(){f._data(e.elem,"fxshow"+e.prop)===b&&(e.options.hide?f._data(e.elem,"fxshow"+e.prop,e.start):e.options.show&&f._data(e.elem,"fxshow"+e.prop,e.end))},h()&&f.timers.push(h)&&!co&&(co=setInterval(g.tick,g.interval))},show:function(){var a=f._data(this.elem,"fxshow"+this.prop);this.options.orig[this.prop]=a||f.style(this.elem,this.prop),this.options.show=!0,a!==b?this.custom(this.cur(),a):this.custom(this.prop==="width"||this.prop==="height"?1:0,this.cur()),f(this.elem).show()},hide:function(){this.options.orig[this.prop]=f._data(this.elem,"fxshow"+this.prop)||f.style(this.elem,this.prop),this.options.hide=!0,this.custom(this.cur(),0)},step:function(a){var b,c,d,e=cq||cr(),g=!0,h=this.elem,i=this.options;if(a||e>=i.duration+this.startTime){this.now=this.end,this.pos=this.state=1,this.update(),i.animatedProperties[this.prop]=!0;for(b in i.animatedProperties)i.animatedProperties[b]!==!0&&(g=!1);if(g){i.overflow!=null&&!f.support.shrinkWrapBlocks&&f.each(["","X","Y"],function(a,b){h.style["overflow"+b]=i.overflow[a]}),i.hide&&f(h).hide();if(i.hide||i.show)for(b in i.animatedProperties)f.style(h,b,i.orig[b]),f.removeData(h,"fxshow"+b,!0),f.removeData(h,"toggle"+b,!0);d=i.complete,d&&(i.complete=!1,d.call(h))}return!1}i.duration==Infinity?this.now=e:(c=e-this.startTime,this.state=c/i.duration,this.pos=f.easing[i.animatedProperties[this.prop]](this.state,c,0,1,i.duration),this.now=this.start+(this.end-this.start)*this.pos),this.update();return!0}},f.extend(f.fx,{tick:function(){var a,b=f.timers,c=0;for(;c<b.length;c++)a=b[c],!a()&&b[c]===a&&b.splice(c--,1);b.length||f.fx.stop()},interval:13,stop:function(){clearInterval(co),co=null},speeds:{slow:600,fast:200,_default:400},step:{opacity:function(a){f.style(a.elem,"opacity",a.now)},_default:function(a){a.elem.style&&a.elem.style[a.prop]!=null?a.elem.style[a.prop]=a.now+a.unit:a.elem[a.prop]=a.now}}}),f.each(cp.concat.apply([],cp),function(a,b){b.indexOf("margin")&&(f.fx.step[b]=function(a){f.style(a.elem,b,Math.max(0,a.now)+a.unit)})}),f.expr&&f.expr.filters&&(f.expr.filters.animated=function(a){return f.grep(f.timers,function(b){return a===b.elem}).length});var cv,cw=/^t(?:able|d|h)$/i,cx=/^(?:body|html)$/i;"getBoundingClientRect"in c.documentElement?cv=function(a,b,c,d){try{d=a.getBoundingClientRect()}catch(e){}if(!d||!f.contains(c,a))return d?{top:d.top,left:d.left}:{top:0,left:0};var g=b.body,h=cy(b),i=c.clientTop||g.clientTop||0,j=c.clientLeft||g.clientLeft||0,k=h.pageYOffset||f.support.boxModel&&c.scrollTop||g.scrollTop,l=h.pageXOffset||f.support.boxModel&&c.scrollLeft||g.scrollLeft,m=d.top+k-i,n=d.left+l-j;return{top:m,left:n}}:cv=function(a,b,c){var d,e=a.offsetParent,g=a,h=b.body,i=b.defaultView,j=i?i.getComputedStyle(a,null):a.currentStyle,k=a.offsetTop,l=a.offsetLeft;while((a=a.parentNode)&&a!==h&&a!==c){if(f.support.fixedPosition&&j.position==="fixed")break;d=i?i.getComputedStyle(a,null):a.currentStyle,k-=a.scrollTop,l-=a.scrollLeft,a===e&&(k+=a.offsetTop,l+=a.offsetLeft,f.support.doesNotAddBorder&&(!f.support.doesAddBorderForTableAndCells||!cw.test(a.nodeName))&&(k+=parseFloat(d.borderTopWidth)||0,l+=parseFloat(d.borderLeftWidth)||0),g=e,e=a.offsetParent),f.support.subtractsBorderForOverflowNotVisible&&d.overflow!=="visible"&&(k+=parseFloat(d.borderTopWidth)||0,l+=parseFloat(d.borderLeftWidth)||0),j=d}if(j.position==="relative"||j.position==="static")k+=h.offsetTop,l+=h.offsetLeft;f.support.fixedPosition&&j.position==="fixed"&&(k+=Math.max(c.scrollTop,h.scrollTop),l+=Math.max(c.scrollLeft,h.scrollLeft));return{top:k,left:l}},f.fn.offset=function(a){if(arguments.length)return a===b?this:this.each(function(b){f.offset.setOffset(this,a,b)});var c=this[0],d=c&&c.ownerDocument;if(!d)return null;if(c===d.body)return f.offset.bodyOffset(c);return cv(c,d,d.documentElement)},f.offset={bodyOffset:function(a){var b=a.offsetTop,c=a.offsetLeft;f.support.doesNotIncludeMarginInBodyOffset&&(b+=parseFloat(f.css(a,"marginTop"))||0,c+=parseFloat(f.css(a,"marginLeft"))||0);return{top:b,left:c}},setOffset:function(a,b,c){var d=f.css(a,"position");d==="static"&&(a.style.position="relative");var e=f(a),g=e.offset(),h=f.css(a,"top"),i=f.css(a,"left"),j=(d==="absolute"||d==="fixed")&&f.inArray("auto",[h,i])>-1,k={},l={},m,n;j?(l=e.position(),m=l.top,n=l.left):(m=parseFloat(h)||0,n=parseFloat(i)||0),f.isFunction(b)&&(b=b.call(a,c,g)),b.top!=null&&(k.top=b.top-g.top+m),b.left!=null&&(k.left=b.left-g.left+n),"using"in b?b.using.call(a,k):e.css(k)}},f.fn.extend({position:function(){if(!this[0])return null;var a=this[0],b=this.offsetParent(),c=this.offset(),d=cx.test(b[0].nodeName)?{top:0,left:0}:b.offset();c.top-=parseFloat(f.css(a,"marginTop"))||0,c.left-=parseFloat(f.css(a,"marginLeft"))||0,d.top+=parseFloat(f.css(b[0],"borderTopWidth"))||0,d.left+=parseFloat(f.css(b[0],"borderLeftWidth"))||0;return{top:c.top-d.top,left:c.left-d.left}},offsetParent:function(){return this.map(function(){var a=this.offsetParent||c.body;while(a&&!cx.test(a.nodeName)&&f.css(a,"position")==="static")a=a.offsetParent;return a})}}),f.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(a,c){var d=/Y/.test(c);f.fn[a]=function(e){return f.access(this,function(a,e,g){var h=cy(a);if(g===b)return h?c in h?h[c]:f.support.boxModel&&h.document.documentElement[e]||h.document.body[e]:a[e];h?h.scrollTo(d?f(h).scrollLeft():g,d?g:f(h).scrollTop()):a[e]=g},a,e,arguments.length,null)}}),f.each({Height:"height",Width:"width"},function(a,c){var d="client"+a,e="scroll"+a,g="offset"+a;f.fn["inner"+a]=function(){var a=this[0];return a?a.style?parseFloat(f.css(a,c,"padding")):this[c]():null},f.fn["outer"+a]=function(a){var b=this[0];return b?b.style?parseFloat(f.css(b,c,a?"margin":"border")):this[c]():null},f.fn[c]=function(a){return f.access(this,function(a,c,h){var i,j,k,l;if(f.isWindow(a)){i=a.document,j=i.documentElement[d];return f.support.boxModel&&j||i.body&&i.body[d]||j}if(a.nodeType===9){i=a.documentElement;if(i[d]>=i[e])return i[d];return Math.max(a.body[e],i[e],a.body[g],i[g])}if(h===b){k=f.css(a,c),l=parseFloat(k);return f.isNumeric(l)?l:k}f(a).css(c,h)},c,a,arguments.length,null)}}),a.jQuery=a.$=f,typeof define=="function"&&define.amd&&define.amd.jQuery&&define("jquery",[],function(){return f})})(window);
window.jermaine.util.namespace("window.multigraph", function (ns) {
    "use strict";
    window.multigraph.jQuery = jQuery.noConflict();
});
if (!window.multigraph) {
    window.multigraph = {};
}

window.multigraph.util = jermaine.util;
/**
sprintf() for JavaScript 0.7-beta1
http://www.diveintojavascript.com/projects/javascript-sprintf

Copyright (c) Alexandru Marasteanu <alexaholic [at) gmail (dot] com>
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of sprintf() for JavaScript nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL Alexandru Marasteanu BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


Changelog:
2010.09.06 - 0.7-beta1
  - features: vsprintf, support for named placeholders
  - enhancements: format cache, reduced global namespace pollution

2010.05.22 - 0.6:
 - reverted to 0.4 and fixed the bug regarding the sign of the number 0
 Note:
 Thanks to Raphael Pigulla <raph (at] n3rd [dot) org> (http://www.n3rd.org/)
 who warned me about a bug in 0.5, I discovered that the last update was
 a regress. I appologize for that.

2010.05.09 - 0.5:
 - bug fix: 0 is now preceeded with a + sign
 - bug fix: the sign was not at the right position on padded results (Kamal Abdali)
 - switched from GPL to BSD license

2007.10.21 - 0.4:
 - unit test and patch (David Baird)

2007.09.17 - 0.3:
 - bug fix: no longer throws exception on empty paramenters (Hans Pufal)

2007.09.11 - 0.2:
 - feature: added argument swapping

2007.04.03 - 0.1:
 - initial release
**/

var sprintf = (function() {
	function get_type(variable) {
		return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
	}
	function str_repeat(input, multiplier) {
		for (var output = []; multiplier > 0; output[--multiplier] = input) {/* do nothing */}
		return output.join('');
	}

	var str_format = function() {
		if (!str_format.cache.hasOwnProperty(arguments[0])) {
			str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
		}
		return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
	};

	str_format.format = function(parse_tree, argv) {
		var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
		for (i = 0; i < tree_length; i++) {
			node_type = get_type(parse_tree[i]);
			if (node_type === 'string') {
				output.push(parse_tree[i]);
			}
			else if (node_type === 'array') {
				match = parse_tree[i]; // convenience purposes only
				if (match[2]) { // keyword argument
					arg = argv[cursor];
					for (k = 0; k < match[2].length; k++) {
						if (!arg.hasOwnProperty(match[2][k])) {
							throw(sprintf('[sprintf] property "%s" does not exist', match[2][k]));
						}
						arg = arg[match[2][k]];
					}
				}
				else if (match[1]) { // positional argument (explicit)
					arg = argv[match[1]];
				}
				else { // positional argument (implicit)
					arg = argv[cursor++];
				}

				if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
					throw(sprintf('[sprintf] expecting number but found %s', get_type(arg)));
				}
				switch (match[8]) {
					case 'b': arg = arg.toString(2); break;
					case 'c': arg = String.fromCharCode(arg); break;
					case 'd': arg = parseInt(arg, 10); break;
					case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
					case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
					case 'o': arg = arg.toString(8); break;
					case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
					case 'u': arg = Math.abs(arg); break;
					case 'x': arg = arg.toString(16); break;
					case 'X': arg = arg.toString(16).toUpperCase(); break;
				}
				arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
				pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
				pad_length = match[6] - String(arg).length;
				pad = match[6] ? str_repeat(pad_character, pad_length) : '';
				output.push(match[5] ? arg + pad : pad + arg);
			}
		}
		return output.join('');
	};

	str_format.cache = {};

	str_format.parse = function(fmt) {
		var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
		while (_fmt) {
			if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
				parse_tree.push(match[0]);
			}
			else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
				parse_tree.push('%');
			}
			else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
				if (match[2]) {
					arg_names |= 1;
					var field_list = [], replacement_field = match[2], field_match = [];
					if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
						field_list.push(field_match[1]);
						while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
							if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
								field_list.push(field_match[1]);
							}
							else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
								field_list.push(field_match[1]);
							}
							else {
								throw('[sprintf] invalid format string');
							}
						}
					}
					else {
						throw('[sprintf] invalid format string');
					}
					match[2] = field_list;
				}
				else {
					arg_names |= 2;
				}
				if (arg_names === 3) {
					throw('[sprintf] mixing positional and named placeholders is not (yet) supported');
				}
				parse_tree.push(match);
			}
			else {
				throw('[sprintf] invalid format string');
			}
			_fmt = _fmt.substring(match[0].length);
		}
		return parse_tree;
	};

	return str_format;
})();

var vsprintf = function(fmt, argv) {
	argv.unshift(fmt);
	return sprintf.apply(null, argv);
};
(function() {
    "use strict";

    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }
 
    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }
}());
window.multigraph.util.namespace("window.multigraph.utilityFunctions", function (ns) {
    "use strict";

    ns.getKeys = function (obj) {
        var keys = [],
            key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
        return keys;
    };

    ns.insertDefaults = function (elem, defaults, attributes) {
        var i;
        for (i = 0; i < attributes.length; i++) {
            if (defaults[attributes[i]] !== undefined && typeof(defaults[attributes[i]]) !== "object") {
                if (elem.attributes().indexOf(attributes[i]) > -1) {
                    elem.attribute(attributes[i]).defaultsTo(defaults[attributes[i]]);
                }
            }
        }
        return elem;
    };

/*
    ns.parseInteger = function (number) {
        return parseInt(number, 10);
    };

    ns.parseIntegerOrUndefined = function (number) {
        number = parseInt(number, 10);
        return isNaN(number) === true ? undefined : number;
    };

    ns.parseDouble = function (number) {
        return Number(number);
    };

    ns.parseDoubleOrUndefined = function (number) {
        number = parseFloat(number);
        return isNaN(number) === true ? undefined : number;
    };
*/

    ns.getDefaultValuesFromXSD = function () {
        
        return {
            "window": {
//              "width": undefined,
//              "height": undefined,
                "border": 2,
                "margin" : function () { return new window.multigraph.math.Insets(/*top*/2, /*left*/2, /*bottom*/2, /*right*/2); },
                "padding": function () { return new window.multigraph.math.Insets(/*top*/5, /*left*/5, /*bottom*/5, /*right*/5); },
                "bordercolor": "0x000000"
            },
            "legend": {
                "icon" : {
                    "height": 30,
                    "width": 40,
                    "border": 1
                },
                "visible": undefined,
                "base": function () { return new window.multigraph.math.Point(1,1); },
                "anchor": function () { return new window.multigraph.math.Point(1,1); },
                "position": function () { return new window.multigraph.math.Point(0,0); },
                "frame": "plot",
                "color": function () { return new window.multigraph.math.RGBColor.parse("0xffffff"); },
                "bordercolor": function () { return new window.multigraph.math.RGBColor.parse("0x000000"); },
                "opacity": 1.0,
                "border": 1,
                "rows": undefined,
                "columns": undefined,
                "cornerradius": 0,
                "padding": 0
            },
            "background": {
                "img": {
                    "src": undefined,
                    "anchor": function () { return new window.multigraph.math.Point(-1,-1); },
                    "base": function () { return new window.multigraph.math.Point(-1,-1); },
                    "position": function () { return new window.multigraph.math.Point(0,0); },
                    "frame": "padding"
                },
                "color": "0xffffff"
            },
            "plotarea": {
                "margin" : function () { return new window.multigraph.math.Insets(/*top*/10 , /*left*/38, /*bottom*/35, /*right*/35); },
                "border": 0,
                "bordercolor": "0xeeeeee"
            },
            "title": {
                "content": undefined,
                "anchor": function () { return new window.multigraph.math.Point(0,1); },
                "base": function () { return new window.multigraph.math.Point(0,1); },
                "position": function () { return new window.multigraph.math.Point(0,0); },
                "border": "0",
//                "color": "0xffffff",
//                "bordercolor": "0x000000",
                "opacity": 1.0,
                "padding": "0",
                "cornerradius": undefined
            },
            "horizontalaxis": {
                "title": {
                    "content": undefined,
//                    "fontname": "default",
//                    "fontsize": "12",
//                    "fontcolor": "0x000000",
                    "anchor": function () { return new window.multigraph.math.Point(0,-20); },
                    "position": function () { return new window.multigraph.math.Point(0,1); },
                    "angle": 0
                },
                "labels": {
                    "label": {
                        "format": undefined,
                        // NOTE: the Labeler object's default values for position and anchor should be undefined.
                        //       If those attributes are not specified in the MUGL, the Labeler's
                        //       initializeGeometry() method sets them to one of the context-dependent values
                        //       below.
                        "position": undefined,
                        "anchor": undefined,

                        "position-horizontal-top"    : function () { return new window.multigraph.math.Point(0, 5); },
                        "position-horizontal-bottom" : function () { return new window.multigraph.math.Point(0, -5); },
                        "position-vertical-right"    : function () { return new window.multigraph.math.Point(5, 0); },
                        "position-vertical-left"     : function () { return new window.multigraph.math.Point(-8, 0); },

                        "anchor-horizontal-top"      : function () { return new window.multigraph.math.Point(0, -1); },
                        "anchor-horizontal-bottom"   : function () { return new window.multigraph.math.Point(0, 1); },
                        "anchor-vertical-right"      : function () { return new window.multigraph.math.Point(-1, 0); },
                        "anchor-vertical-left"       : function () { return new window.multigraph.math.Point(1, 0); },

                        "angle": 0.0,
                        "spacing": undefined,
                        "densityfactor": undefined
//                        "fontname": undefined,
//                        "fontsize": undefined,
//                        "fontcolor": undefined
                    },
//                    "fontname": "default",
//                    "fontsize": "12",
//                    "fontcolor": "0x000000",
//                    "format": "%1d",
//                    "visible": "true",
                    "start-number": function () { return new window.multigraph.core.NumberValue(0); },
                    "start-datetime": function () { return new window.multigraph.core.DatetimeValue(0); },
                    "angle": 0.0,
                    "position": function () { return new window.multigraph.math.Point(0,0); },
                    "anchor": function () { return new window.multigraph.math.Point(0,0); },
//                    "spacing": "10000 5000 2000 1000 500 200 100 50 20 10 5 2 1 0.1 0.01 0.001",
//                    "defaultDatetimeSpacing": "1000Y 500Y 200Y 100Y 50Y 20Y 10Y 5Y 2Y 1Y 6M 3M 2M 1M 7D 3D 2D 1D 12H 6H 3H 2H 1H",
                    "function": undefined,
                    "densityfactor": undefined
                },
                "grid": {
                    "color": function () { return new window.multigraph.math.RGBColor.parse("0xeeeeee"); },
                    "visible": false
                },
                "pan": {
                    "allowed": true,
                    "min": undefined,
                    "max": undefined
                },
                "zoom": {
                    "allowed": true,
                    "min": undefined,
                    "max": undefined,
                    "anchor": null
                },
                "binding": {
                    "id": undefined,
                    "min": undefined,
                    "max": undefined
                },
                "id": undefined,
                "type": "number",
//                "length": 1.0,
                "length" : function () { return new window.multigraph.math.Displacement(1,0); },
                "position": function () { return new window.multigraph.math.Point(0,0); },
                "pregap": 0,
                "postgap": 0,
                "anchor": -1,
                "base": function () { return new window.multigraph.math.Point(-1,-1); },
                "min": "auto",
                "minoffset": 0,
                //"minposition": -1,
                "minposition": function () { return new window.multigraph.math.Displacement(-1,0); },
                "max": "auto",
                "maxoffset": 0,
                //"maxposition": 1,
                "maxposition": function () { return new window.multigraph.math.Displacement(1,0); },
                "positionbase": undefined,
//                "color": "0x000000",
                "color": function () { return new window.multigraph.math.RGBColor(0,0,0); },
                "tickmin": -3,
                "tickmax": 3,
                "highlightstyle": "axis",
                "linewidth": 1,
                "orientation": undefined
            },
            "verticalaxis": {
                "title": {
                    "content": undefined,
//                    "fontname": "default",
//                    "fontsize": "12",
//                    "fontcolor": "0x000000",
                    "anchor": function () { return new window.multigraph.math.Point(0,-20); },
                    "position": function () { return new window.multigraph.math.Point(0,1); },
                    "angle": "0"
                },
                "labels": {
                    "label": {
                        "format": undefined,
                        "start": undefined,
                        "angle": undefined,
                        "position": undefined,
                        "anchor": undefined,
                        "spacing": undefined,
                        "densityfactor": undefined
//                        "fontname": undefined,
//                        "fontsize": undefined,
//                        "fontcolor": undefined
                    },
//                    "fontname": "default",
//                    "fontsize": "12",
//                    "fontcolor": "0x000000",
                    "format": "%1d",
                    "visible": "true",
                    "start": "0",
                    "angle": "0.0",
                    "position": "0 0",
                    "anchor": "0 0",
//                    "spacing": "10000 5000 2000 1000 500 200 100 50 20 10 5 2 1 0.1 0.01 0.001",
//                    "defaultDatetimeSpacing": "1000Y 500Y 200Y 100Y 50Y 20Y 10Y 5Y 2Y 1Y 6M 3M 2M 1M 7D 3D 2D 1D 12H 6H 3H 2H 1H",
                    "function": undefined,
                    "densityfactor": undefined
                },
                "grid": {
//                    "color": "0xeeeeee",
                    "visible": "false"
                },
                "pan": {
                    "allowed": "yes",
                    "min": undefined,
                    "max": undefined
                },
                "zoom": {
                    "allowed": "yes",
                    "min": undefined,
                    "max": undefined,
                    "anchor": "none"
                },
                "binding": {
                    "id": undefined,
                    "min": undefined,
                    "max": undefined
                },
                "id": undefined,
                "type": "number",
//                "length": "1.0",
                "position": "0 0",
                "pregap": "0",
                "postgap": "0",
                "anchor": "-1",
                "base": "-1 1",
                "min": "auto",
                "minoffset": "0",
                "minposition": "-1",
                "max": "auto",
                "maxoffset": "0",
                "maxposition": "1",
                "positionbase": undefined,
//                "color": "0x000000",
                "tickmin": "-3",
                "tickmax": "3",
                "highlightstyle": "axis",
                "linewidth": "1",
                "orientation": undefined
            },
            "plot": {
                "legend": {
                    "visible": true,
                    "label": undefined
                },
                "horizontalaxis": {
                    "variable": {
                        "ref": undefined,
                        "factor": undefined
                    },
                    "constant": {
                        "value": undefined
                    },
                    "ref": undefined
                },
                "verticalaxis": {
                    "variable": {
                        "ref": undefined,
                        "factor": undefined
                    },
                    "constant": {
                        "value": undefined
                    },
                    "ref": undefined
                },
                "filter": {
                    "option": {
                        "name": undefined,
                        "value": undefined
                    },
                    "type": undefined
                },
                "renderer":{
                    "option": {
                        "name": undefined,
                        "value": undefined,
                        "min": undefined,
                        "max": undefined
                    },
                    "type": function () { return window.multigraph.core.Renderer.Type.parse("line"); }
                },
                "datatips":{
                    "variable": {
                        "format": undefined
                    },
//                    "visible": "false",
                    "format": undefined,
//                    "bgcolor": "0xeeeeee",
                    "bgalpha": "1.0",
                    "border": 1,
//                    "bordercolor": "0x000000",
                    "pad": 2
                }
            },
            "data": {
                "variables": {
                    "variable": {
                        "id": undefined,
                        "column": undefined,
                        "type": "number",
                        "missingvalue": undefined,
                        "missingop": undefined
                    },
                    "missingvalue": "-9000",
                    "missingop": "eq"
                },
                "values": {
                    "content": undefined
                },
                "csv": {
                    "location": undefined
                },
                "service": {
                    "location": undefined
                }
            }
        };
        
    };
});
window.multigraph.util.namespace("window.multigraph.utilityFunctions", function (ns) {
    "use strict";

    ns.serializeScalarAttributes = function (elem, scalarAttributes, attributeStrings) {
        var i;

        for (i = 0; i < scalarAttributes.length; i++) {
            if (elem[scalarAttributes[i]]() !== undefined) {
                attributeStrings.push(scalarAttributes[i] + '="' + elem[scalarAttributes[i]]() + '"');
            }
        }

        return attributeStrings;
    };

    ns.serializeChildModels = function (elem, children, childStrings, serialize) {
        var i;

        for (i = 0; i < children.length; i++) {
            if (elem[children[i]]()) {
                childStrings.push(elem[children[i]]()[serialize]());
            }
        }

        return childStrings;
    };
});
window.multigraph.util.namespace("window.multigraph.utilityFunctions", function (ns) {
    "use strict";
    
    ns.validateNumberRange = function (number, lowerBound, upperBound) {
        return typeof(number) === "number" && number >= lowerBound && number <= upperBound;
    };

    // This function, from http://javascript.crockford.com/remedial.html, should correctly
    // return 'array' for any Array object, including [].
    ns.typeOf = function(value) {
        var s = typeof value;
        if (s === 'object') {
            if (value) {
                //NOTE: Crockford used "=="   ?????!!!!!  mbp Fri Sep 28 08:44:34 2012
                //if (Object.prototype.toString.call(value) == '[object Array]') {
                if (Object.prototype.toString.call(value) === '[object Array]') {
                    s = 'array';
                }
            } else {
                s = 'null';
            }
        }
        return s;
    };

});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    /*
     * DataValue is a POJSO (plain old javascript object) that simply
     * serves as an ecapsulation for several generic
     * data-value-related constants and functions.  There is no actual
     * DataValue model that can be instantiated; all data values are
     * instances of either the NumberValue or DatetimeValue model.
     */

    var DataValue = {};

    DataValue.NUMBER = "number";
    DataValue.DATETIME = "datetime";
    DataValue.UNKNOWN = "unknown";

    /*
     * Return a list of the type constants above
     */
    DataValue.types = function () {
        return [ DataValue.NUMBER, DataValue.DATETIME, DataValue.UNKNOWN ];
    };

    /*
     * Create a new DataValue subtype of a given type by parsing a string
     */
    DataValue.parseType = function (string) {
        if (string.toLowerCase() === DataValue.NUMBER) { return DataValue.NUMBER; }
        if (string.toLowerCase() === DataValue.DATETIME) { return DataValue.DATETIME; }
        throw new Error("unknown DataValue type: " + string);
    };

    /*
     * This function converts a "type" enum object to a string.  In reality, the objects ARE
     * the strings, so we just return the object.
     */
    DataValue.serializeType = function (type) {
        return type;
    };

    /*
     * Return true or false depending on whether obj is an instance of a DataValue type
     */
    DataValue.isInstance = function (obj) {
        // Note: we also accept null values
        return ((obj===null) || (obj && (typeof(obj.getRealValue) === "function") && (typeof(obj.compareTo) === "function")));
    };

    /*
     * Create a new DataValue subtype of a given type from a real value
     */
    DataValue.create = function (type, realValue) {
        if (type === DataValue.NUMBER) {
            return new ns.NumberValue(realValue);
        } else if (type === DataValue.DATETIME) {
            return new ns.DatetimeValue(realValue);
        }
        throw new Error("attempt to parse an unknown DataValue type");
    };

    /*
     * Create a new DataValue subtype of a given type by parsing a string
     */
    DataValue.parse = function (type, string) {
        if (type === DataValue.NUMBER) {
            return ns.NumberValue.parse(string);
        } else if (type === DataValue.DATETIME) {
            return ns.DatetimeValue.parse(string);
        }
        throw new Error("attempt to parse an unknown DataValue type");
    };

    /*
     * Enum values for comparison operators.  These should be lowercase strings --- they're used as
     * actual method names below.
     */
    DataValue.LT = "lt";
    DataValue.LE = "le";
    DataValue.EQ = "eq";
    DataValue.GE = "ge";
    DataValue.GT = "gt";
    DataValue.NE = "ne";

    var comparatorFuncs = {};
    comparatorFuncs[DataValue.LT] = function (x) { return this.compareTo(x)   < 0; };
    comparatorFuncs[DataValue.LE] = function (x) { return this.compareTo(x)  <= 0; };
    comparatorFuncs[DataValue.EQ] = function (x) { return this.compareTo(x) === 0; };
    comparatorFuncs[DataValue.GE] = function (x) { return this.compareTo(x)  >= 0; };
    comparatorFuncs[DataValue.GT] = function (x) { return this.compareTo(x)   > 0; };
    comparatorFuncs[DataValue.NE] = function (x) { return this.compareTo(x) !== 0; };

    /*
     * Mix the 5 comparator function into another object:
     */
    DataValue.mixinComparators = function (obj) {
        obj[DataValue.LT] = comparatorFuncs[DataValue.LT];
        obj[DataValue.LE] = comparatorFuncs[DataValue.LE];
        obj[DataValue.EQ] = comparatorFuncs[DataValue.EQ];
        obj[DataValue.GE] = comparatorFuncs[DataValue.GE];
        obj[DataValue.GT] = comparatorFuncs[DataValue.GT];
        obj[DataValue.NE] = comparatorFuncs[DataValue.NE];
    };

    /*
     * The comparators function returns a list of the 5 comparator
     * functions, to be used like an enum type.
     */
    DataValue.comparators = function () {
        return [ DataValue.LT, DataValue.LE, DataValue.EQ, DataValue.GE, DataValue.GT, DataValue.NE ];
    };

    /*
     * Convert a string to a comparator enum object:
     */
    DataValue.parseComparator = function (string) {
        if (typeof(string) === "string") {
            switch (string.toLowerCase()) {
            case "lt": return DataValue.LT;
            case "le": return DataValue.LE;
            case "eq": return DataValue.EQ;
            case "ge": return DataValue.GE;
            case "gt": return DataValue.GT;
            case "ne": return DataValue.NE;
            }
        }
        throw new Error(string + " should be one of 'lt', 'le', 'eq', 'ge', 'gt', 'ne'.");
    };

    ns.DataValue = DataValue;

});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";
    var DataMeasure = {};
    /*
     * Return true or false depending on whether obj is an instance of a DataMeasure type
     */
    DataMeasure.isInstance = function (obj) {
        return (obj && (typeof(obj.getRealValue) === "function") && (!obj.compareTo));
    };

    /*
     * Create a new DataMeasure subtype of a given type by parsing a string
     */
    DataMeasure.parse = function (type, string) {
        if (type === ns.DataValue.NUMBER) {
            return ns.NumberMeasure.parse(string);
        } else if (type === ns.DataValue.DATETIME) {
            return ns.DatetimeMeasure.parse(string);
        }
        throw new Error("attempt to parse an unknown DataMeasure type");
    };

    ns.DataMeasure = DataMeasure;

});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";
    var DataFormatter = {};
    /*
     * Return true or false depending on whether obj is an instance of a DataFormatter type
     */
    DataFormatter.isInstance = function (obj) {
        return (obj && (typeof(obj.format) === "function") && (typeof(obj.getMaxLength) === "function"));
    };

    /*
     * Create a new DataFormatter subtype of a given type
     */
    DataFormatter.create = function (type, format) {
        if (type === ns.DataValue.NUMBER) {
            return new ns.NumberFormatter(format);
        } else if (type === ns.DataValue.DATETIME) {
            return new ns.DatetimeFormatter(format);
        }
        throw new Error("attempt to create an unknown DataFormatter type");
    };

    ns.DataFormatter = DataFormatter;

});
window.multigraph.util.namespace("window.multigraph.math", function (ns) {
    "use strict";

    ns.Box = new window.jermaine.Model( "Box", function () {
        this.hasA("width").which.isA("number");
        this.hasA("height").which.isA("number");
        this.isBuiltWith("width", "height");
    });
    
});
window.multigraph.util.namespace("window.multigraph.math", function (ns) {
    "use strict";

    /**
     * A Displacement represents a geometric position along a line
     * segment, expressed in terms of two quantities: a relative
     * position called 'a', and an absolute offset called 'b'.  The
     * length of the line segment is not known in advance --- the idea
     * is that the Displacement object encapsulates a rule for
     * determining a location along ANY line segment.  The Displacement
     * has methods which take the line segment length as an argument
     * and return the computed final position.
     *
     * There are two different position-calcuating methods,
     * corresponding to two different interpretations of the relative
     * value 'a':
     *
     * 'relative length':
     *     'a' is a number between 0 and 1, representing a fraction of
     *       the total length of the line segment; the relative
     *       position determined by 'a' is the fraction 'a' of the
     *       total length of the segment.
     *     In this case, the position-calculating method
     *       calculateLength(L) returns the number a * L + b, which
     *       corresponds to moving 'a' of the way along the length L,
     *       then adding 'b':
     *             [--------------------------------X------------]
     *             |<---- a * L --->|<---- b ------>|
     *             |<------------------  L  -------------------->|
     *
     * 'relative coordinate':
     *     'a' is a number between -1 and 1, representing a coordinate
     *       value in a [-1,1] coordinate system along the line
     *       segment
     *     In this case, the position-calculating method
     *       calculateCoordinate(L) returns the number (a+1) * L/2 +
     *       b.  which corresponds to moving to the position
     *       determined by the 'a' coordinate, then adding 'b':
     *             [------------------------------------X--------]
     *             |<--- (a+1) * L/2 --->|<---- b ----->|
     *             |<------------------  L  -------------------->|
     *
     */
    ns.Displacement = new window.jermaine.Model( "Displacement", function () {
        
        this.hasA("a").which.validatesWith(function (a) {
            return window.multigraph.utilityFunctions.validateNumberRange(a, -1.0, 1.0);
        });
        this.hasA("b").which.isA("integer").and.defaultsTo(0);
        this.isBuiltWith("a", "%b");

        this.respondsTo("calculateLength", function (totalLength) {
            return this.a() * totalLength + this.b();
        });

        this.respondsTo("calculateCoordinate", function (totalLength) {
            return (this.a() + 1) * totalLength/2.0 + this.b();
        });

        this.respondsTo("serialize", function () {
            var output = this.a().toString(10);
            if (this.b() !== undefined && this.b() !== 0) {
                if (this.b() >= 0) {
                    output += "+";
                }
                output += this.b().toString(10);
            }
            return output;
        });

    });

    ns.Displacement.regExp = /^([\+\-]?[0-9\.]+)([+\-])([0-9\.+\-]+)$/;

    ns.Displacement.parse = function (string) {
        /**
         * parse a string into a Displacement.  The string should be of one of the following forms:
         *     "A+B"  ==>  a=A  b=B
         *     "A-B"  ==>  a=A  b=-B
         *     "A"    ==>  a=A  b=0
         *     "+A"   ==>  a=A  b=0
         *     "-A"   ==>  a=-A b=0
         **/
        var ar = ns.Displacement.regExp.exec(string),
            d,
            a,
            b,
            sign;
        if (string === undefined) {
            d = new ns.Displacement(1);
        } else if (ar !== null) {
            a = parseFloat(ar[1]);
            b = parseFloat(ar[3]);
            switch (ar[2]) {
            case "+":
                sign = 1;
                break;
            case "-":
                sign = -1;
                break;
            default:
                sign = 0;
                break;
            }
            /*
              if (isNaN(a) || sign == 0 || isNaN(b)) {
              throw new ParseError('parse error');
              }
            */
            d = new ns.Displacement(a, sign * b);
        } else {
            a = parseFloat(string);
            /*n
              if (isNaN(a)) {
              throw new ParseError('parse error');
              }
            */
            d = new ns.Displacement(a);
        }
        return d;
    };
});
window.multigraph.util.namespace("window.multigraph.math", function (ns) {
    "use strict";

    var Enum = function (name) {

        var instances = {};

        var Enum = function (key) {
            if (instances[key] !== undefined) {
                throw new Error("attempt to redefine "+name+" Enum with key '"+key+"'");
            }
            this.enumType = name;
            this.key = key;
            instances[key] = this;
        };

        Enum.parse = function (key) {
            return instances[key];
        };

        Enum.prototype.toString = function () {
            return this.key;
        };

        Enum.isInstance = function (obj) {
            return (obj !== undefined && obj !== null && obj.enumType === name);
        };

        return Enum;
    };

    ns.Enum = Enum;
});
window.multigraph.util.namespace("window.multigraph.math", function (ns) {
    "use strict";

    ns.Insets = new window.jermaine.Model( "Insets", function () {
        this.hasA("top").which.isA("number");
        this.hasA("left").which.isA("number");
        this.hasA("bottom").which.isA("number");
        this.hasA("right").which.isA("number");
        this.respondsTo("set", function (top, left, bottom, right) {
            this.top(top);
            this.left(left);
            this.bottom(bottom);
            this.right(right);
        });
        this.isBuiltWith("top", "left", "bottom", "right");
    });
    
});
window.multigraph.util.namespace("window.multigraph.math", function (ns) {
    "use strict";

    ns.Point = new window.jermaine.Model( "Point", function () {
        this.hasA("x").which.isA("number");
        this.hasA("y").which.isA("number");
        this.isBuiltWith("x", "y");
        this.respondsTo("serialize", function () {
            return this.x() + "," + this.y();
        });
        this.respondsTo("eq", function (p) {
            return ((this.x()===p.x()) && (this.y()===p.y()));
        });
    });

    ns.Point.regExp = /^\s*([0-9\-\+\.eE]+)(,|\s+|\s*,\s+|\s+,\s*)([0-9\-\+\.eE]+)\s*$/;

    ns.Point.parse = function (string) {
        var ar = ns.Point.regExp.exec(string),
            p;
        // ar[1] is x value
        // ar[2] is separator between x and y
        // ar[3] is y value
        
        if (!ar || (ar.length !== 4)) {
            throw new Error("cannot parse string '"+string+"' as a Point");
        }
        return new ns.Point(parseFloat(ar[1]), parseFloat(ar[3]));
    };
});
window.multigraph.util.namespace("window.multigraph.math", function (ns) {
    "use strict";

    ns.RGBColor = new window.jermaine.Model( "RGBColor", function () {
        
        this.hasA("r").which.validatesWith(function (r) {
            return window.multigraph.utilityFunctions.validateNumberRange(r, 0, 1.0);
        });
        this.hasA("g").which.validatesWith(function (g) {
            return window.multigraph.utilityFunctions.validateNumberRange(g, 0, 1.0);
        });
        this.hasA("b").which.validatesWith(function (b) {
            return window.multigraph.utilityFunctions.validateNumberRange(b, 0, 1.0);
        });

        var numberToHex = function (number) {
            number = parseInt(number * 255, 10).toString(16);
            if (number.length === 1) {
                number = "0" + number;
            }
            return number;
        };

        this.respondsTo("getHexString", function (prefix) {
            if (!prefix) {
                prefix = "0x";
            }
            return prefix + numberToHex(this.r()) + numberToHex(this.g()) + numberToHex(this.b());
        });

        this.respondsTo("toRGBA", function (alpha) {
            if (alpha === undefined) {
                alpha = 1.0;
            }
            if (typeof(alpha) !== "number") {
                throw new Error("RGBColor.toRGBA: The argument, if present, must be a number");
            }
            return "rgba(" + (255*this.r()) + ", " + (255*this.g()) + ", " + (255*this.b()) + ", " + alpha + ")";
        });

        this.respondsTo("eq", function (color) {
            return ((this.r()===color.r()) && (this.g()===color.g()) && (this.b()===color.b()));
        });

        this.isBuiltWith("r", "g", "b");

    });

    ns.RGBColor.parse = function (input) {
        var red,
            green,
            blue,
            grey,
            parsedInput,
            colorObj;

        if (input === undefined) {
            return undefined;
        } else if (typeof(input) === "string") {
            parsedInput = input.toLowerCase();

            switch (parsedInput) {
            case "black":
                red = 0;
                green = 0;
                blue = 0;
                break;
            case "red":
                red = 1;
                green = 0;
                blue = 0;
                break;
            case "green":
                red = 0;
                green = 1;
                blue = 0;
                break;
            case "blue":
                red = 0;
                green = 0;
                blue = 1;
                break;
            case "yellow":
                red = 1;
                green = 1;
                blue = 0;
                break;
            case "magenta":
                red = 1;
                green = 0;
                blue = 1;
                break;
            case "cyan":
                red = 0;
                green = 1;
                blue = 1;
                break;
            case "white":
                red = 1;
                green = 1;
                blue = 1;
                break;
            case "grey":
                grey = parseInt("ee", 16) / 255;
                red = grey;
                green = grey;
                blue = grey;
                break;
            case "skyblue":
                red = parseInt("87", 16) / 255;
                green = parseInt("ce", 16) / 255;
                blue = parseInt("eb", 16) / 255;
                break;
            case "khaki":
                red = parseInt("f0", 16) / 255;
                green = parseInt("e6", 16) / 255;
                blue = parseInt("8c", 16) / 255;
                break;
            case "orange":
                red = parseInt("ff", 16) / 255;
                green = parseInt("a5", 16) / 255;
                blue = parseInt("00", 16) / 255;
                break;
            case "salmon":
                red = parseInt("fa", 16) / 255;
                green = parseInt("80", 16) / 255;
                blue = parseInt("72", 16) / 255;
                break;
            case "olive":
                red = parseInt("9a", 16) / 255;
                green = parseInt("cd", 16) / 255;
                blue = parseInt("32", 16) / 255;
                break;
            case "sienna":
                red = parseInt("a0", 16) / 255;
                green = parseInt("52", 16) / 255;
                blue = parseInt("2d", 16) / 255;
                break;
            case "pink":
                red = parseInt("ff", 16) / 255;
                green = parseInt("b5", 16) / 255;
                blue = parseInt("c5", 16) / 255;
                break;
            case "violet":
                red = parseInt("ee", 16) / 255;
                green = parseInt("82", 16) / 255;
                blue = parseInt("ee", 16) / 255;
                break;
            default:
                parsedInput = parsedInput.replace(/(0(x|X)|#)/, "");
                if (parsedInput.search(new RegExp(/([^0-9a-f])/)) !== -1) {
                    throw new Error("'" + input + "' is not a valid color");
                }

                if (parsedInput.length === 6) {
                    red = parseInt(parsedInput.substring(0,2), 16) / 255;
                    green = parseInt(parsedInput.substring(2,4), 16) / 255;
                    blue = parseInt(parsedInput.substring(4,6), 16) / 255;
                } else if (parsedInput.length === 3) {
                    red = parseInt(parsedInput.charAt(0), 16) / 15;
                    green = parseInt(parsedInput.charAt(1), 16) / 15;
                    blue = parseInt(parsedInput.charAt(2), 16) / 15;
                } else {
                    throw new Error("'" + input + "' is not a valid color");
                }
                break;
            }
            colorObj = new ns.RGBColor(red, green, blue);
            return colorObj;
        }
        throw new Error("'" + input + "' is not a valid color");
    };
});
window.multigraph.util.namespace("window.multigraph.math", function (ns) {
    "use strict";

    ns.util = {
        "interp": function (x, x0, x1, y0, y1) {
            // return the 'y' coordinate of the point on the line segment
            // connecting the two points (x0,y0) and (x1,y1) whose 'x'
            // coordinate is x
            return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
        },
        "safe_interp": function (x, x0, x1, y0, y1) {
            // same as "interp", but if the line is vertical (x0 === x1), return
            // the average of the two y values, rather than NaN
            if (x0 === x1) { return (y0 + y1) / 2; }
            return ns.util.interp(x, x0, x1, y0, y1);
        }
    };

});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var rendererList,
        Renderer,
        RendererOption,
        defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
        attributes = window.multigraph.utilityFunctions.getKeys(defaultValues.plot.renderer),
        Type = new window.multigraph.math.Enum("RendererType");

    Renderer = new window.jermaine.Model( "Renderer", function () {
        this.hasA("type").which.validatesWith(Type.isInstance);
        this.hasA("plot").which.validatesWith(function (plot) {
            return plot instanceof ns.Plot;
        });

        this.respondsTo("setUpMissing", function () {
            // A call to this method results in the addition (or replacement) of a method called "isMissing()"
            // that can be used to test whether a value meets the "missing" criteria of one of this renderer's
            // plot's data columns.  The point of having this "setUpMissing()" method create the "isMissing()"
            // method, rather than just coding the "isMissing()" method directly here, is so that we can capture
            // a pointer to the plot's data object via a closure, for faster access, rather than coding
            // this.plot().data() in "isMissing()", which adds the overhead of 2 getter calls to each invocation.
            //
            // NOTE: This is awkward.  What we really want is for this stuff to happen automatically when
            // the renderer's "plot" attribute is set.  Can Jermaine be modified to allow us to write
            // a custom setter, so that we can execute this code automatically when the render's "plot"
            // attribute is set ???
            var data;
            if (!this.plot()) {
                //console.log("Warning: renderer.setUpMissing() called for renderer that has no plot ref");
                // this should really eventually throw an error
                return;
            }

            // for ConstantPlot, create function that always returns false, since it has no data
            if (this.plot() instanceof ns.ConstantPlot) {
                this.isMissing = function (p) {
                    return false;
                };
                return;
            };

            if (!this.plot().data()) {
                // this should eventually throw an error
                //console.log("Warning: renderer.setUpMissing() called for renderer whose plot has no data ref");
                return;
            }
            data = this.plot().data();
            this.isMissing = function (p) {
                var i;
                for (i=1; i<p.length; ++i) {
                    if (data.isMissing(p[i], i)) {
                        return true;
                    }
                }
                return false;
            };
        });

        this.isBuiltWith("type");

        window.multigraph.utilityFunctions.insertDefaults(this, defaultValues.plot.renderer, attributes);

        this.respondsTo("transformPoint", function (input) {
            var output = [],
                haxis = this.plot().horizontalaxis(),
                vaxis = this.plot().verticalaxis(),
                i;

            output[0] = haxis.dataValueToAxisValue(input[0]);
            for (i = 1; i<input.length; ++i) {
                output[i] = vaxis.dataValueToAxisValue(input[i]);
            }
            return output;
        });

        var equalOrUndefined = function (a, b) {
            return ((a===b) || ((a===undefined) && (b===undefined)));
        };

        this.respondsTo("setOption", function (name, value, min, max) {
            var rendererOpt,
                rendererOpts,
                i;
            if (!this.optionsMetadata[name]) {
                throw new Error("attempt to set unknown renderer option '"+name+"'");
            }
            rendererOpts = this.options()[name]();
            for (i=0; i<rendererOpts.size(); ++i) {
                if (equalOrUndefined(rendererOpts.at(i).min(), min) &&
                    equalOrUndefined(rendererOpts.at(i).max(), max)) {
                    rendererOpts.at(i).value(value);
                    return;
                }
            }
            // If we get this far, it means we didn't find an existing option in the list with matching min/max
            // settings, so we create a new one and append it to the end of the list:
            rendererOpt = new (this.optionsMetadata[name].type)();
            rendererOpt.value(value);
            rendererOpt.min(min);
            rendererOpt.max(max);
            rendererOpts.add(rendererOpt);
        });

        this.respondsTo("setOptionFromString", function (name, stringValue, stringMin, stringMax) {
            var rendererOpt;
            if (!this.optionsMetadata[name]) {
                // If this renderer has no option named "name", bail out immediately.  This should eventually
                // throw an error, but for now we just quietly ignore it, to eliminate error conditions coming
                // from unimplemented options.
                //console.log("WARNING: renderer has no option named '" + name + "'");
                return;
            }
            rendererOpt = new (this.optionsMetadata[name].type)();
            rendererOpt.parseValue(stringValue, this);
            if (this.plot() && this.plot().verticalaxis()) {
                if (stringMin !== undefined) {
                    rendererOpt.min( ns.DataValue.parse( this.plot().verticalaxis().type(), stringMin ));
                }
                if (stringMax !== undefined) {
                    rendererOpt.max( ns.DataValue.parse( this.plot().verticalaxis().type(), stringMax ));
                }
            }
            this.setOption(name, rendererOpt.value(), rendererOpt.min(), rendererOpt.max());
        });


        this.respondsTo("getOptionValue", function (optionName, /*optional:*/value) {
            var i,
                options,
                optionList;

            options = this.options();
            if (typeof(options[optionName]) !== "function") {
                throw new Error('unknown option "'+optionName+'"');
            }
            optionList = options[optionName]();
            if (!optionList) {
                throw new Error('unknown option "'+optionName+'"');
            }
            //NOTE: options are stored in reverse order; default one is always in the '0' position.
            //  Search through them starting at the END of the list, going backwards!
            for (i=optionList.size()-1; i>=0; --i) {
                var option = optionList.at(i);
                if (((option.min()===undefined) || (value===undefined) || option.min().le(value)) &&
                    ((option.max()===undefined) || (value===undefined) || option.max().gt(value))) {
                    return option.value();
                }
            }
                
        });

        // method must be overridden by subclass:
        this.respondsTo("begin", function () {
        });
        // method must be overridden by subclass:
        this.respondsTo("dataPoint", function (point) {
        });
        // method must be overridden by subclass:
        this.respondsTo("end", function () {
        });

    });

    /*
     * Private list of known renderers.  This list is populated from within individual
     * renderer submodel implementations by calls to Renderer.addType.
     */
    rendererList = [];

    /*
     * Add a renderer submodel to the list of known renders.  rendererObj should be
     * an object with two properties:
     *    'type'  : the type of the renderer -- a string, which is the value expected
     *              for the type attribute of the mugl <renderer> tag.
     *    'model' : the renderer submodel
     */
    Renderer.addType = function (rendererObj) {
        rendererList.push(rendererObj);
    };

    /*
     * Factory method: create an instance of a renderer submodel based on its type (a string).
     */
    Renderer.create = function (type) {
        var i,
            renderer;
        for (i=0; i<rendererList.length; ++i) {
            if (rendererList[i].type === type) {
                renderer = new (rendererList[i].model)();
                renderer.type(type);
                return renderer;
            }
        }
        throw new Error('Renderer.create: attempt to create a renderer of unknown type');
    };

    Renderer.declareOptions = function (renderer, OptionsModelName, options) {
        var i,
            OptionsModel,
            optionsMetadata,
            declareOption = function(optionName, optionType) {
                // NOTE: this call to hasMany() has to be in a function here, rather than just
                // being written inline where it is used below, because we need a closure to
                // capture value of options[i].type as optionType, for use in the validation
                // function.  Otherwise, the validator captures the 'options' array and the
                // local loop variable i instead, and evaluates options[i].type when validation
                // is performed!
                OptionsModel.hasMany(optionName).eachOfWhich.validatesWith(function (v) {
                    return v instanceof optionType;
                });
            };

        OptionsModel    = window.jermaine.Model(OptionsModelName, function () {});
        optionsMetadata = {};
        for (i=0; i<options.length; ++i) {
            declareOption(options[i].name, options[i].type);
            optionsMetadata[options[i].name] = {
                "type"    : options[i].type,
                "default" : options[i]["default"]
            };
        }
        renderer.hasA("options").isImmutable().defaultsTo(function () { return new OptionsModel(); });
        renderer.prototype.optionsMetadata = optionsMetadata;

        renderer.isBuiltWith(function () {
            // populate options with default values stored in options metadata (which was populated by declareOptions):
            var opt, ropt;
            for (opt in this.optionsMetadata) {
                if (this.optionsMetadata.hasOwnProperty(opt)) {
                    ropt = new (this.optionsMetadata[opt].type)(this.optionsMetadata[opt]["default"]);
                    this.options()[opt]().add( ropt );
                }
            }
        });

    };


    Renderer.Option = new window.jermaine.Model( "Renderer.Option", function () {
        this.hasA("min").which.validatesWith(ns.DataValue.isInstance);
        this.hasA("max").which.validatesWith(ns.DataValue.isInstance);
    });


    Renderer.RGBColorOption = new window.jermaine.Model( "Renderer.RGBColorOption", function () {
        this.isA(Renderer.Option);
        this.hasA("value").which.validatesWith(function (v) {
            return v instanceof window.multigraph.math.RGBColor || v === null;
        });
        this.isBuiltWith("value");
        this.respondsTo("serializeValue", function () {
            return this.value().getHexString();
        });
        this.respondsTo("parseValue", function (string) {
            this.value( window.multigraph.math.RGBColor.parse(string) );
        });
        this.respondsTo("valueEq", function (value) {
            return this.value().eq(value);
        });

    });

    Renderer.NumberOption = new window.jermaine.Model( "Renderer.NumberOption", function () {
        this.isA(Renderer.Option);
        this.hasA("value").which.isA("number");
        this.isBuiltWith("value");
        this.respondsTo("serializeValue", function () {
            return this.value().toString();
        });
        this.respondsTo("parseValue", function (string) {
            this.value( parseFloat(string) );
        });
        this.respondsTo("valueEq", function (value) {
            return (this.value()===value);
        });
    });

    Renderer.DataValueOption = new window.jermaine.Model( "Renderer.DataValueOption", function () {
        this.isA(Renderer.Option);
        this.hasA("value").which.validatesWith(function (value) {
            return ns.DataValue.isInstance(value) || value === null;
        });
        this.isBuiltWith("value");
        this.respondsTo("serializeValue", function () {
            return this.value();
        });
        this.respondsTo("valueEq", function (value) {
            return this.value().eq(value);
        });
    });

    Renderer.VerticalDataValueOption = new window.jermaine.Model( "Renderer.DataValueOption", function () {
        this.isA(Renderer.DataValueOption);
        this.isBuiltWith("value");
        this.respondsTo("parseValue", function (string, renderer) {
            this.value( ns.DataValue.parse(renderer.plot().verticalaxis().type(), string) );
        });
        
    });

    Renderer.HorizontalDataValueOption = new window.jermaine.Model( "Renderer.DataValueOption", function () {
        this.isA(Renderer.DataValueOption);
        this.isBuiltWith("value");
        this.respondsTo("parseValue", function (string, renderer) {
            this.value( ns.DataValue.parse(renderer.plot().horizontalaxis().type(), string) );
        });
        
    });

    Renderer.DataMeasureOption = new window.jermaine.Model( "Renderer.DataMeasureOption", function () {
        this.isA(Renderer.Option);
        this.hasA("value").which.validatesWith(function (value) {
            return ns.DataMeasure.isInstance(value) || value === null;
        });
        this.isBuiltWith("value");
        this.respondsTo("serializeValue", function () {
            return this.value();
        });
        this.respondsTo("valueEq", function (value) {
            return this.value().eq(value);
        });
    });

    Renderer.VerticalDataMeasureOption = new window.jermaine.Model( "Renderer.DataMeasureOption", function () {
        this.isA(Renderer.DataMeasureOption);
        this.respondsTo("parseValue", function (string, renderer) {
            this.value( ns.DataMeasure.parse(renderer.plot().verticalaxis().type(), string) );
        });
        
    });

    Renderer.HorizontalDataMeasureOption = new window.jermaine.Model( "Renderer.DataMeasureOption", function () {
        this.isA(Renderer.DataMeasureOption);
        this.isBuiltWith("value");
        this.respondsTo("parseValue", function (string, renderer) {
            this.value( ns.DataMeasure.parse(renderer.plot().horizontalaxis().type(), string) );
        });
        
    });

    Renderer.POINTLINE = new Type("pointline");
    Renderer.POINT     = new Type("point");
    Renderer.LINE      = new Type("line");
    Renderer.BAR       = new Type("bar");
    Renderer.FILL      = new Type("fill");
    Renderer.BAND      = new Type("band");
    Renderer.RANGEBAR  = new Type("rangebar");
    Renderer.LINEERROR = new Type("lineerror");
    Renderer.BARERROR  = new Type("barerror");

    Renderer.Type = Type;

    ns.Renderer = Renderer;
});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
        attributes = window.multigraph.utilityFunctions.getKeys(defaultValues.data.variables.variable),
        DataValue = ns.DataValue,
        DataVariable = new window.jermaine.Model( "DataVariable", function () {
            this.hasA("id").which.isA("string");
            this.hasA("column").which.isA("integer");
            this.hasA("type").which.isOneOf(DataValue.types()).and.defaultsTo(ns.DataValue.NUMBER);
            this.hasA("data").which.validatesWith(function (data) {
                return data instanceof window.multigraph.core.Data;
            });
            this.hasA("missingvalue").which.validatesWith(DataValue.isInstance);

            this.hasA("missingop").which.isOneOf(DataValue.comparators());
            this.isBuiltWith("id", "%column", "%type");

            window.multigraph.utilityFunctions.insertDefaults(this, defaultValues.data.variables.variable, attributes);
        });

    ns.DataVariable = DataVariable;

});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var DataVariable = ns.DataVariable,
        Data,
        i;

    Data = new window.jermaine.Model(function () {
        var Data = this;

        //private find function
        var find = function (idOrColumn, thing, columns) {
            var result = -1;
            for (i = 0; i < columns.size(); ++i) {
                if (columns.at(i)[idOrColumn]() === thing) {
                    result = i;
                }
            }
            return result;
        };

        /**
         * Set the 'data' attribute of each of this data object's columns
         * to point to the data object itself.
         */
        this.respondsTo("initializeColumns", function () {
            var i;
            for (i=0; i<this.columns().size(); ++i) {
                this.columns().at(i).data(this);
            }
        });

        this.hasMany("columns").eachOfWhich.validateWith(function (column) {
            this.message = "Data: constructor parameter should be an array of DataVariable objects";
            return column instanceof DataVariable;
        });

        this.hasA("readyCallback").which.isA("function");

        this.hasA("defaultMissingvalue").which.isA("string");
        this.hasA("defaultMissingop").which.isA("string").and.defaultsTo("eq");

        this.isBuiltWith("columns", function () {
            this.initializeColumns();
        });

        this.respondsTo("columnIdToColumnNumber", function (id) {
            var column;

            if (typeof(id) !== "string") {
                throw new Error("Data: columnIdToColumnNumber expects parameter to be a string");
            }
            
            column = find("id", id, this.columns()) !== -1?this.columns().at(find("id", id, this.columns())):undefined;

            if (column === undefined) {
                throw new Error("Data: no column with the label " + id);
            }
            
            return column.column();
        });

        this.respondsTo("columnIdToDataVariable", function (id) {
            var dv;
            
            if (typeof(id) !== "string") {
                throw new Error("Data: columnIdToDataVariable requires a string parameter");
            }
            
            dv = find("id", id, this.columns()) !== -1?this.columns().at(find("id", id, this.columns())):undefined;

            if (dv === undefined) {
                throw new Error("Data: no column with the label " + id);
            }

            return dv;
        });

        this.respondsTo("getColumnId", function (column) {
            var result;

            if (typeof(column) !== "number") {
                throw new Error("Data: getColumnId method expects an integer");
            }

            result = find("column", column, this.columns());

            if (result === -1) {
                throw new Error("Data: column " + column + " does not exist");
            }
            
            return this.columns().at(result).id();
        });

        this.respondsTo("getColumns", function () {
            var result = [],
                         columns = this.columns(),
                         i;

            for (i = 0; i < columns.size(); ++i) {
                result.push(columns.at(i));
            }

            return result;
        });

        this.respondsTo("getBounds", function (columnId) {
            //no op
        });

        this.respondsTo("getIterator", function () {
            //no op
        });

        this.respondsTo("onReady", function (readyHandler) {
            //no op
        });

        this.respondsTo("pause", function() {
            //no op
        });
        this.respondsTo("resume", function() {
            //no op
        });

        this.respondsTo("isMissing", function (value, i) {
            // This method should return true if the DataValue "value" meets the "missing" criteria of
            // the i-th column
            var column;
            if (i < 0 || i >= this.columns().size()) {
                throw new Error("metadata.isMissing(): index out of range");
            }
            column = this.columns().at(i);
            if (!column.missingvalue() || !column.missingop()) {
                return false;
            }
            return value[column.missingop()](column.missingvalue());
        });
    });

    ns.Data = Data;
});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var Plot;

    Plot = new window.jermaine.Model( "Plot", function () {
        this.hasA("legend").which.validatesWith(function (legend) {
            return legend instanceof ns.PlotLegend;
        });
        this.hasA("horizontalaxis").which.validatesWith(function (axis) {
            return axis instanceof ns.Axis;
        });
        this.hasA("verticalaxis").which.validatesWith(function (axis) {
            return axis instanceof ns.Axis;
        });
        this.hasA("renderer").which.validatesWith(function (renderer) {
            return renderer instanceof ns.Renderer;
        });
    });

    ns.Plot = Plot;
});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    /**
        @name ArrayData
        @constructor
        @param {array} columns
    */
    ns.ArrayData = window.jermaine.Model(function () {
        var ArrayData = this;

        this.isA(ns.Data);
        this.hasAn("array");
        this.isBuiltWith("columns", "array", function () {
            this.initializeColumns();
        });

        /**
            @method ArrayData#getIterator
            @param columnIDs
            @param min
            @param max
            @param buffer
            @return ArrayData
        */
        this.respondsTo("getIterator", function (columnIds, min, max, buffer) {
            return ArrayData.getArrayDataIterator(this, columnIds, min, max, buffer);
        });

        /**
            @method ArrayData#onReady
            @param callback
        */

        this.respondsTo("onReady", function (callback) {
            this.readyCallback(callback);
            callback(this.array()[0][0], this.array()[this.array().length-1][0]);
        });


       /**
            @method ArrayData#getArrayDataIterator
            @param {string array} arrayData
            @param columnIDs
            @param min
            @param max
            @param buffer
            @throws {error} Throws error if arrayData is not an array of strings
            @return iter
       */
        ArrayData.getArrayDataIterator = function (arrayData, columnIds, min, max, buffer) {
            var iter = {},
                arraySlice = [],
                curr = 0,
                i, j,
                projection,
                firstIndex,
                lastIndex,
                currentIndex,
                columnIndices,
                array = arrayData.array();

            buffer = buffer || 0;

            // columnIds argument should be an array of strings
            if (Object.prototype.toString.apply(columnIds) !== "[object Array]") {
                throw new Error("ArrayData: getIterator method requires that the first parameter be an array of strings");
            } else {
                for (i = 0; i < columnIds.length; ++i) {
                    if (typeof(columnIds[i]) !== "string") {
                        throw new Error("ArrayData: getIterator method requires that the first parameter be an array of strings");
                    }
                }
            }

            //min,max arguments should be data values
            if (!ns.DataValue.isInstance(min) || !ns.DataValue.isInstance(max)) {
                throw new Error("ArrayData: getIterator method requires the second and third argument to be number values");
            }

            //buffer argument should be an integer
            if (typeof(buffer) !== "number") {
                throw new Error("ArrayData: getIterator method requires last argument to be an integer");
            }

            // if we have no data, return an empty iterator
            if (array.length === 0) {
                return {
                    "next"    : function () {},
                    "hasNext" : function () { return false; }
                };
            }

            // find the index of the first row in the array whose column0 value is >= min
            for (firstIndex=0; firstIndex<array.length; ++firstIndex) {
                if (array[firstIndex][0].ge(min)) {
                    break;
                }
            }
            // back up 'buffer' steps
            firstIndex = firstIndex - buffer;
            if (firstIndex < 0) {
                firstIndex = 0;
            }
            
            // find the index of the last row in the array whose column0 value is <= max
            if (firstIndex === array.length-1) {
                lastIndex = firstIndex;
            } else {
                for (lastIndex=firstIndex; lastIndex<array.length-1; ++lastIndex) {
                    if (array[lastIndex+1][0].gt(max)) {
                        break;
                    }
                }
            }
            // move forward 'buffer' steps
            lastIndex = lastIndex + buffer;
            if (lastIndex > array.length-1) {
                lastIndex = array.length-1;
            }

            columnIndices = [];
            for (j = 0;j < columnIds.length; ++j) {
                var k = arrayData.columnIdToColumnNumber(columnIds[j]);
                columnIndices.push( k );
            }

            currentIndex = firstIndex;
                
            return {
                next : function() {
                    var projection = [],
                        i;
                    if (currentIndex > lastIndex) {
                        return null;
                    }
                    for (i=0; i<columnIndices.length; ++i) {
                        projection.push(array[currentIndex][columnIndices[i]]);
                    }
                    ++currentIndex;
                    return projection;
                },
                hasNext : function() {
                    return currentIndex <= lastIndex;
                }
            };
            
        };

        /**
            IMPORTANT NOTE: dataVariableArray is a plain javascript array of DataVariable instances; it is NOT a jermaine attr_list.
            @method ArrayData#textToDataValuesArray
            @param dataVariableArray
            @param text
            @return {array} dataValues
            @todo If the number of comma-separated values on the current line is not the same as the number of columns in the metadata, should throw an error.
       */
        ArrayData.textToDataValuesArray = function (dataVariableArray, text) {
            //IMPORTANT NOTE: dataVariableArray is a plain javascript array of DataVariable instances; it
            //is NOT a jermaine attr_list.
            var dataValues = [],
                lines = text.split("\n"),
                i;
            for (i=0; i<lines.length; ++i) {
                if (/\d/.test(lines[i])) { // skip line unless it contains a digit
                    var stringValuesThisRow = lines[i].split(/\s*,\s*/),
                        dataValuesThisRow = [],
                        j;
                    if (stringValuesThisRow.length === dataVariableArray.length) {
                        for (j=0; j<stringValuesThisRow.length; ++j) {
                            dataValuesThisRow.push(ns.DataValue.parse(dataVariableArray[j].type(), stringValuesThisRow[j]));
                        }
                        dataValues.push( dataValuesThisRow );
                    //} else {
                        // we get here if the number of comma-separated values on the current line
                        // (lines[i]) is not the same as the number of columns in the metadata.  This
                        // should probably throw an error, or something like that.  For now, though, we
                        // just ignore it.
                        ////console.log('bad line: ' + lines[i]);
                    }
                }
            }
            return dataValues;
        };

    });
});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var Axis,
        defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
        attributes = window.multigraph.utilityFunctions.getKeys(defaultValues.horizontalaxis),
        Orientation = new window.multigraph.math.Enum("AxisOrientation");

    Axis = new window.jermaine.Model( "Axis", function () {
        this.hasA("title").which.validatesWith(function (title) {
            return title instanceof ns.AxisTitle;
        });
        this.hasMany("labelers").which.validatesWith(function (labelers) {
            return labelers instanceof ns.Labeler;
        });
        this.hasA("grid").which.validatesWith(function (grid) {
            return grid instanceof ns.Grid;
        });
        this.hasA("pan").which.validatesWith(function (pan) {
            return pan instanceof ns.Pan;
        });
        this.hasA("zoom").which.validatesWith(function (zoom) {
            return zoom instanceof ns.Zoom;
        });
        this.hasA("binding").which.validatesWith(function (binding) {
            return binding instanceof ns.Binding;
        });
        this.hasAn("id").which.validatesWith(function (id) {
            return typeof(id) === "string";
        });
        this.hasA("type").which.isOneOf(ns.DataValue.types());
        this.hasA("length").which.validatesWith(function (length) {
            return length instanceof window.multigraph.math.Displacement;
        });
        this.hasA("position").which.validatesWith(function (position) {
            return position instanceof window.multigraph.math.Point;
        });
        this.hasA("pregap").which.isA("number");
        this.hasA("postgap").which.isA("number");
        this.hasAn("anchor").which.isA("number");
        this.hasA("base").which.validatesWith(function (base) {
            return base instanceof window.multigraph.math.Point;
        });

        // The "min" attribute stores the "min" value from the mugl file, if there was one -- as a string!!!
        this.hasA("min").which.isA("string");

        // The "dataMin" attribute is the current min DataValue for the axis
        this.hasA("dataMin").which.validatesWith(function (x) {
            return ns.DataValue.isInstance(x);
        });
        // Convenience method for checking to see if dataMin has been set or not
        this.respondsTo("hasDataMin", function () {
            return this.dataMin() !== undefined;
        });

                                             
        this.hasA("minoffset").which.isA("number");
        this.hasA("minposition").which.validatesWith(function (minposition) {
            return minposition instanceof window.multigraph.math.Displacement;
        });

        // The "max" attribute stores the "max" value from the mugl file, if there was one -- as a string!!!
        this.hasA("max").which.isA("string");

        // The "dataMax" attribute is the current max DataValue for the axis
        this.hasA("dataMax").which.validatesWith(function (x) {
            return ns.DataValue.isInstance(x);
        });
        // Convenience method for checking to see if dataMax has been set or not
        this.respondsTo("hasDataMax", function () {
            return this.dataMax() !== undefined;
        });



        this.hasA("maxoffset").which.isA("number");
        this.hasA("maxposition").which.validatesWith(function (maxposition) {
            return maxposition instanceof window.multigraph.math.Displacement;
        });


        this.hasA("positionbase").which.validatesWith(function (positionbase) {
            //deprecated
            return typeof(positionbase) === "string";
        });
        this.hasA("color").which.validatesWith(function (color) {
            return color instanceof window.multigraph.math.RGBColor;
        });
        this.hasA("tickmin").which.isA("integer");
        this.hasA("tickmax").which.isA("integer");
        this.hasA("highlightstyle").which.validatesWith(function (highlightstyle) {
            return typeof(highlightstyle) === "string";
        });
        this.hasA("linewidth").which.isA("integer");
        this.hasA("orientation").which.validatesWith(Orientation.isInstance);
/*
        this.hasA("orientation").which.validatesWith(function (orientation) {
            return (orientation === Axis.HORIZONTAL) || (orientation === Axis.VERTICAL);
        });
*/
        this.isBuiltWith("orientation", function () {
            if (this.grid() === undefined) {
                this.grid(new ns.Grid());
            }
            this.zoom(new ns.Zoom());
            this.pan(new ns.Pan());
        });

        this.hasA("pixelLength").which.isA("number");
        this.hasA("parallelOffset").which.isA("number");
        this.hasA("perpOffset").which.isA("number");

        this.hasA("axisToDataRatio").which.isA("number");

        this.respondsTo("initializeGeometry", function (graph) {
            var i;
            if (this.orientation() === Axis.HORIZONTAL) {
                this.pixelLength(this.length().calculateLength( graph.plotBox().width() ));
                this.parallelOffset( this.position().x() + (this.base().x() + 1) * graph.plotBox().width()/2 - (this.anchor() + 1) * this.pixelLength() / 2 );
                this.perpOffset( this.position().y() + (this.base().y() + 1) * graph.plotBox().height() / 2 );
            } else {
                this.pixelLength( this.length().calculateLength( graph.plotBox().height() ) );
                this.parallelOffset( this.position().y() + (this.base().y() + 1) * graph.plotBox().height()/2 - (this.anchor() + 1) * this.pixelLength() / 2 );
                this.perpOffset( this.position().x() + (this.base().x() + 1) * graph.plotBox().width() / 2 );
            }
            this.minoffset(this.minposition().calculateCoordinate(this.pixelLength()));
            this.maxoffset(this.pixelLength() - this.maxposition().calculateCoordinate(this.pixelLength()));
            if (this.hasDataMin() && this.hasDataMax()) {
                this.computeAxisToDataRatio();
            }
            for (i=0; i<this.labelers().size(); ++i) {
                this.labelers().at(i).initializeGeometry(graph);
            }
        });

        this.respondsTo("computeAxisToDataRatio", function () {
            if (this.hasDataMin() && this.hasDataMax()) {
                this.axisToDataRatio((this.pixelLength() - this.maxoffset() - this.minoffset()) / (this.dataMax().getRealValue() - this.dataMin().getRealValue()));
            }
        });

        this.respondsTo("dataValueToAxisValue", function (v) {
            return this.axisToDataRatio() * ( v.getRealValue() - this.dataMin().getRealValue() ) + this.minoffset() + this.parallelOffset();
        });

        this.respondsTo("axisValueToDataValue", function (a) {
            return ns.DataValue.create( this.type(),
                                        ( this.dataMin().getRealValue() +
                                          ( a - this.minoffset() - this.parallelOffset() ) / this.axisToDataRatio()) );
        });

        this.hasA("currentLabeler").which.validatesWith(function (labeler) {
            return labeler===null || labeler instanceof ns.Labeler;
        });
        this.hasA("currentLabelDensity").which.isA("number");

        this.respondsTo("prepareRender", function (graphicsContext) {
            // Decide which labeler to use: take the one with the largest density <= 0.8.
            // Unless all have density > 0.8, in which case we take the first one.  This assumes
            // that the labelers list is ordered in increasing order of label density.
            // This function sets the currentLabeler and currentLabelDensity attributes.
            var currentLabeler,
                currentLabelDensity = 0,
                density = 0,
                densityThreshold = 0.8,
                i,
                labelers = this.labelers(),
                nlabelers = this.labelers().size();
            if (nlabelers<=0) {
                currentLabeler = null;
            } else {
                currentLabeler = labelers.at(0);
                currentLabelDensity = currentLabeler.getLabelDensity(graphicsContext);
                i = 1;
                while (i<nlabelers) {
                    density = labelers.at(i).getLabelDensity(graphicsContext);
                    if (density > densityThreshold) {
                        break;
                    } else {
                        currentLabeler = labelers.at(i);
                        currentLabelDensity = density;
                        ++i;
                    }
                }
            }
            this.currentLabeler(currentLabeler);
            this.currentLabelDensity(currentLabelDensity);
        });

        this.respondsTo("doPan", function (pixelBase, pixelDisplacement) {
            var offset,
                newRealMin,
                newRealMax;

            if (!this.pan().allowed()) { return; }
            offset = pixelDisplacement / this.axisToDataRatio();
            newRealMin = this.dataMin().getRealValue() - offset;
            newRealMax = this.dataMax().getRealValue() - offset;
            if (pixelDisplacement < 0 && this.pan().min() && newRealMin < this.pan().min().getRealValue()) {
                newRealMax += (this.pan().min().getRealValue() - newRealMin);
                newRealMin = this.pan().min().getRealValue();
            }
            if (pixelDisplacement > 0 && this.pan().max() && newRealMax > this.pan().max().getRealValue()) {
                newRealMin -= (newRealMax - this.pan().max().getRealValue());
                newRealMax = this.pan().max();
            }
            this.dataMin(ns.DataValue.create(this.type(), newRealMin));
            this.dataMax(ns.DataValue.create(this.type(), newRealMax));
        });

        this.respondsTo("doZoom", function (pixelBase, pixelDisplacement) {
            var baseRealValue,
                factor,
                newMin,
                newMax,
                d;
            if (!this.zoom().allowed()) {
                return;
            }
            baseRealValue = this.axisValueToDataValue(pixelBase).getRealValue();
            if (this.zoom().anchor() !== undefined) {
                baseRealValue = this.zoom().anchor().getRealValue();
            }
            factor = 10 * Math.abs(pixelDisplacement / (this.pixelLength() - this.maxoffset() - this.minoffset()));
            /*TODO: uncomment after this.reversed() has been implemented
            if (this.reversed()) { factor = -factor; }
            */
            if (pixelDisplacement <= 0) {
                newMin = ns.DataValue.create(this.type(),
                                             (this.dataMin().getRealValue() - baseRealValue) * ( 1 + factor ) + baseRealValue);
                newMax = ns.DataValue.create(this.type(),
                                             (this.dataMax().getRealValue() - baseRealValue) * ( 1 + factor ) + baseRealValue);
            } else {
                newMin = ns.DataValue.create(this.type(),
                                             (this.dataMin().getRealValue() - baseRealValue) * ( 1 - factor ) + baseRealValue);
                newMax = ns.DataValue.create(this.type(),
                                             (this.dataMax().getRealValue() - baseRealValue) * ( 1 - factor ) + baseRealValue);
            }
            if (this.pan().min() && newMin.lt(this.pan().min())) {
                newMin = this.pan().min();
            }
            if (this.pan().max() && newMax.gt(this.pan().max())) {
                newMax = this.pan().max();
            }
        
            if ((this.dataMin().le(this.dataMax()) && newMin.lt(newMax)) ||
                (this.dataMin().ge(this.dataMax()) && newMin.gt(newMax))) {
                if (this.zoom().max() && (newMax.gt(newMin.add(this.zoom().max())))) {
                    d = (newMax.getRealValue() - newMin.getRealValue() - this.zoom().max().getRealValue()) / 2;
                    newMax = newMax.addRealValue(-d);
                    newMin = newMin.addRealValue(d);
                } else if (this.zoom().min() && (newMax.lt(newMin.add(this.zoom().min())))) {
                    d = (this.zoom().min().getRealValue() - (newMax.getRealValue() - newMin.getRealValue())) / 2;
                    newMax = newMax.addRealValue(d);
                    newMin = newMin.addRealValue(-d);
                }
                this.dataMin(newMin);
                this.dataMax(newMax);
            }
        });

        window.multigraph.utilityFunctions.insertDefaults(this, defaultValues.horizontalaxis, attributes);
    });
    Axis.HORIZONTAL = new Orientation("horizontal");
    Axis.VERTICAL   = new Orientation("vertical");

    Axis.Orientation = Orientation;

    ns.Axis = Axis;

});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
        attributes = window.multigraph.utilityFunctions.getKeys(defaultValues.horizontalaxis.title),
        AxisTitle = new window.jermaine.Model( "AxisTitle", function () {
            this.hasA("content").which.isA("string");
            this.hasA("position").which.validatesWith(function (position) {
                return position instanceof window.multigraph.math.Point;
            });
            this.hasA("anchor").which.validatesWith(function (anchor) {
                return anchor instanceof window.multigraph.math.Point;
            });
            this.hasA("angle").which.isA("number");

            window.multigraph.utilityFunctions.insertDefaults(this, defaultValues.horizontalaxis.title, attributes);
        });

    ns.AxisTitle = AxisTitle;

});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var Background,
        defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
        attributes = window.multigraph.utilityFunctions.getKeys(defaultValues.background);

    Background = new window.jermaine.Model( "Background", function () {
        this.hasA("color").which.validatesWith(function (color) {
            return color instanceof window.multigraph.math.RGBColor;
        }).defaultsTo(window.multigraph.math.RGBColor.parse(defaultValues.background.color));
        this.hasA("img").which.validatesWith(function (img) {
            return img instanceof ns.Img;
        });
    });

    ns.Background = Background;

});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
        attributes = window.multigraph.utilityFunctions.getKeys(defaultValues.horizontalaxis.binding),
        Binding = new window.jermaine.Model( "Binding", function () {
            this.hasA("id").which.validatesWith(function (id) {
                return typeof(id) === "string";
            });
            this.hasA("min").which.validatesWith(function (min) {
                return typeof(min) === "string";
            });
            this.hasA("max").which.validatesWith(function (max) {
                return typeof(max) === "string";
            });
            this.isBuiltWith("id", "min", "max");

            window.multigraph.utilityFunctions.insertDefaults(this, defaultValues.horizontalaxis.binding, attributes);
        });

    ns.Binding = Binding;

});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
        attributes = window.multigraph.utilityFunctions.getKeys(defaultValues.plot);

    ns.ConstantPlot = new window.jermaine.Model( "ConstantPlot", function () {
        this.isA(ns.Plot);
        this.hasA("constantValue").which.validatesWith(ns.DataValue.isInstance);

        this.isBuiltWith("constantValue");

        window.multigraph.utilityFunctions.insertDefaults(this, defaultValues.plot, attributes);

        this.respondsTo("render", function (graph, graphicsContext) {
            // graphicsContext is an optional argument passed to ConstantPlot.render() by the
            // graphics driver, and used by that driver's implementation of Renderer.begin().
            // It can be any objectded by the driver -- usually some kind of graphics
            // context object.  It can also be omitted if a driver does not need it.
            //var data = this.data().arraydata();

            var haxis = this.horizontalaxis();
            var renderer = this.renderer();
            var constantValue = this.constantValue();

            if (!haxis.hasDataMin() || !haxis.hasDataMax()) {
                return;
            }

            renderer.setUpMissing(); //TODO: this is awkward -- figure out a better way!
            renderer.begin(graphicsContext);
            renderer.dataPoint([ haxis.dataMin(), constantValue ]);
            renderer.dataPoint([ haxis.dataMax(), constantValue ]);
            renderer.end();

        });

    });

});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var ArrayData = ns.ArrayData,
        DataValue = ns.DataValue,
        Data = ns.Data;

    /*var CSVData = function (filename) {

    };*/

    var CSVData = window.jermaine.Model(function () {
        this.isA(ArrayData);
        this.hasA("filename").which.isA("string");
        this.hasA("dataIsReady").which.isA("boolean").and.defaultsTo(false);

        this.respondsTo("onReady", function (callback) {
            this.readyCallback(callback);
            if (this.dataIsReady()) {
                callback(/* to be defined */);
            }
        });

        this.respondsTo("getIterator", function (columnIds, min, max, buffer) {
            if (this.dataIsReady()) {
                return ArrayData.getArrayDataIterator(this, columnIds, min, max, buffer);
            } else {
                return {
                    "next"    : function () {},
                    "hasNext" : function () { return false; }
                };
            }
        });

        this.isBuiltWith("columns", "filename", function () {
            var that = this;

            this.initializeColumns();

            if (that.filename() !== undefined) {
                window.multigraph.jQuery.ajax({url:that.filename(), success:function (data) {
                    var i, j,
                        lines,
                        stringValues,
                        dataValues = [],
                        dataValuesRow;

                    //parse the data
                    dataValues = ArrayData.textToDataValuesArray(that.getColumns(), data);
                    that.array(dataValues);

                    //in the callback to the request, we need to call onReady
                    that.dataIsReady(true);
                    // populate arraydata
                    if (that.readyCallback() !== undefined) {
                        that.readyCallback()();
                    }
                }});
            }
        });
    });

    ns.CSVData = CSVData;
});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var DataPlot,
        defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
        attributes = window.multigraph.utilityFunctions.getKeys(defaultValues.plot);

    DataPlot = new window.jermaine.Model( "DataPlot", function () {
        this.isA(ns.Plot);
        this.hasMany("variable").which.validatesWith(function (variable) {
            return variable instanceof ns.DataVariable || variable === null;
        });
        this.hasA("filter").which.validatesWith(function (filter) {
            return filter instanceof ns.Filter;
        });
        this.hasA("datatips").which.validatesWith(function (datatips) {
            return datatips instanceof ns.Datatips;
        });
        this.hasA("data").which.validatesWith(function (data) {
            return data instanceof ns.Data;
        });

        window.multigraph.utilityFunctions.insertDefaults(this, defaultValues.plot, attributes);

        this.respondsTo("render", function (graph, graphicsContext) {
            // graphicsContext is an optional argument passed to DataPlot.render() by the
            // graphics driver, and used by that driver's implementation of Renderer.begin().
            // It can be any objectded by the driver -- usually some kind of graphics
            // context object.  It can also be omitted if a driver does not need it.
            //var data = this.data().arraydata();
            var data = this.data();
            if (! data) { return; }

            var haxis = this.horizontalaxis();
            var vaxis = this.verticalaxis();

            var variableIds = [];
            var i;
            for (i=0; i<this.variable().size(); ++i) {
                variableIds.push( this.variable().at(i).id() );
            }

            var iter = data.getIterator(variableIds, haxis.dataMin(), haxis.dataMax(), 1);

            var renderer = this.renderer();
            renderer.setUpMissing(); //TODO: this is awkward -- figure out a better way!
            renderer.begin(graphicsContext);
            while (iter.hasNext()) {
                var datap = iter.next();
                renderer.dataPoint(datap);
            }
            renderer.end();

        });


    });

    ns.DataPlot = DataPlot;
});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var Datatips,
        defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
        attributes = window.multigraph.utilityFunctions.getKeys(defaultValues.plot.datatips);

    Datatips = new window.jermaine.Model( "Datatips", function () {
        this.hasMany("variables").which.validatesWith(function (variable) {
            return variable instanceof ns.DatatipsVariable;
        });
        this.hasA("format").which.validatesWith(function (format) {
            return typeof(format) === "string";
        });
        this.hasA("bgcolor").which.validatesWith(function (bgcolor) {
            return bgcolor instanceof window.multigraph.math.RGBColor;
        });
        this.hasA("bgalpha").which.validatesWith(function (bgalpha) {
            return typeof(bgalpha) === "string";
        });
        this.hasA("border").which.isA("integer");
        this.hasA("bordercolor").which.validatesWith(function (bordercolor) {
            return bordercolor instanceof window.multigraph.math.RGBColor;
        });
        this.hasA("pad").which.isA("integer");

        window.multigraph.utilityFunctions.insertDefaults(this, defaultValues.plot.datatips, attributes);
    });

    ns.Datatips = Datatips;

});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
        attributes = window.multigraph.utilityFunctions.getKeys(defaultValues.plot.datatips.variable),
        DatatipsVariable = new window.jermaine.Model( "DatatipsVariable", function () {
            this.hasA("format").which.validatesWith(function (format) {
                return typeof(format) === "string";
            });

            window.multigraph.utilityFunctions.insertDefaults(this, defaultValues.plot.datatips.variable, attributes);
        });

    ns.DatatipsVariable = DatatipsVariable;

});
/*global sprintf */

window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";
    var DatetimeFormatter = function (format) {
        var testString;
        if (typeof(format) !== "string") {
            throw new Error("format must be a string");
        }
        this.formatString = format;
        testString = DatetimeFormatter.formatInternally(format, new Date(0));
        this.length = testString.length;
    };

    DatetimeFormatter.prototype.format = function (value) {
        return DatetimeFormatter.formatInternally(this.formatString, value.value);
    };

    DatetimeFormatter.prototype.getMaxLength = function () {
        return this.length;
    };

    DatetimeFormatter.prototype.getFormatString = function () {
        return this.formatString;
    };

    DatetimeFormatter.formatInternally = function (formatString, date) {
        var dayNames = {
                "shortNames": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
                "longNames": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
            },
            monthNames = {
                "shortNames": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                "longNames": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
            },
            state = 0,
            c,
            i,
            t,
            output = "";

        for (i = 0; i < formatString.length; i++) {
            c = formatString.charAt(i);
            switch (state) {
                case 0:
                    if (c === "%") {
                        state = 1;
                    } else {
                        output += c;
                    }
                    break;
                case 1:
                    switch (c) {
                        case "Y":
                            // four digit year
                            output += date.getUTCFullYear().toString();
                            break;
                        case "y":
                            // two digit year
                            output += date.getUTCFullYear().toString().substr(2, 2);
                            break;
                        case "M":
                            // 2-digit month number with leading zero
                            output += sprintf("%02s", (date.getUTCMonth() + 1).toString());
                            break;
                        case "m":
                            // month number without leading zero
                            output += (date.getUTCMonth() + 1).toString();
                            break;
                        case "N":
                            // month name, spelled out
                            output += monthNames.longNames[date.getUTCMonth()];
                            break;
                        case "n":
                            // month name, 3 letter abbreviation
                            output += monthNames.shortNames[date.getUTCMonth()];
                            break;
                        case "D":
                            // two-digit day of month with leading zero
                            output += sprintf("%02s", date.getUTCDate().toString());
                            break;
                        case "d":
                            // day of month without leading zero
                            output += date.getUTCDate().toString();
                            break;
                        case "W":
                            // weekday name, spelled out
                            output += dayNames.longNames[date.getUTCDay()];
                            break;
                        case "w":
                            // weekday name, 3-letter abbreviation
                            output += dayNames.shortNames[date.getUTCDay()];
                            break;
                        case "H":
                            // hour of day, 24 hour clock
                            output += sprintf("%02s", date.getUTCHours().toString());
                            break;
                        case "h":
                            // hour of day, 12 hour clock
                            t = date.getUTCHours() % 12;
                            if (t === 0) {
                                output += "12";
                            } else {
                                output += t.toString();
                            }
                            break;
                        case "i":
                            // minutes
                            output += sprintf("%02s", date.getUTCMinutes().toString());
                            break;
                        case "s":
                            // seconds
                            output += sprintf("%02s", date.getUTCSeconds().toString());
                            break;
                        case "v":
                            // deciseconds (10ths of a second)
                            output += sprintf("%03s", date.getUTCMilliseconds().toString()).substr(0, 1);
                            break;
                        case "V":
                            // centiseconds (100ths of a second)
                            output += sprintf("%03s", date.getUTCMilliseconds().toString()).substr(0, 2);
                            break;
                        case "q":
                            // milliseconds (1000ths of a second)
                            output += sprintf("%03s", date.getUTCMilliseconds().toString());
                            break;
                        case "P":
                            // AM or PM
                            t = date.getUTCHours();
                            if (t < 12) {
                                output += "AM";
                            } else {
                                output += "PM";
                            }
                            break;
                        case "p":
                            // am or pm
                            t = date.getUTCHours();
                            if (t < 12) {
                                output += "am";
                            } else {
                                output += "pm";
                            }
                            break;
                        case "L":
                            // newline
                            output += "\n";
                            break;
                        case "%":
                            // %
                            output += "%";
                            break;
                        default:
                            throw new Error("Invalid character code for datetime formatting string");
                    }
                    state = 0;
                    break;
            }
        }
        return output;
    };

    ns.DatetimeFormatter = DatetimeFormatter;

});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var DatetimeMeasure,
        DatetimeUnit = new window.multigraph.math.Enum("DatetimeUnit");

    DatetimeMeasure = function (measure, unit) {
        if (typeof(measure) !== "number" || DatetimeMeasure.isUnit(unit) !== true) {
            throw new Error("Improper input for Datetime Measure's constructor");
        } else if (arguments.length !== 2) {
            throw new Error("Datetime Measure's contructor requires exactly two arguments");
        }
        this.measure = measure;
        this.unit    = unit;
    };

    DatetimeMeasure.isUnit = function (unit) {
        return DatetimeUnit.isInstance(unit);
    };

    DatetimeMeasure.prototype.getRealValue = function () {
        var factor;
        switch (this.unit) {
            case DatetimeMeasure.MILLISECOND:
                factor = 1;
                break;
            case DatetimeMeasure.SECOND:
                factor = 1000;
                break;
            case DatetimeMeasure.MINUTE:
                factor = 60000;
                break;
            case DatetimeMeasure.HOUR:
                factor = 3600000;
                break;
            case DatetimeMeasure.DAY:
                factor = 86400000;
                break;
            case DatetimeMeasure.WEEK:
                factor = 604800000;
                break;
            case DatetimeMeasure.MONTH:
                factor = 2592000000;
                break;
            case DatetimeMeasure.YEAR:
                factor = 31536000000;
                break;
        }
        return this.measure * factor;
    };

    DatetimeMeasure.parse = function (s) {
        var re, measure, unit;

        if (typeof(s) !== "string" || s.match(/\s*-?(([0-9]+\.?[0-9]*)|([0-9]*\.?[0-9]+))\s*(ms|s|m|H|D|W|M|Y){1}\s*$/) === null) {
            throw new Error("Improper input for Datetime Measure's parse method");
        }

        re      = /ms|s|m|H|D|W|M|Y/;
        measure = parseFloat(s.replace(re, ""));
        unit    = s.match(re); // returns an array

        unit = DatetimeUnit.parse(unit[0]);

        return new DatetimeMeasure(measure, unit);
    };

    DatetimeMeasure.findTickmarkWithMillisecondSpacing = function (/*number(milliseconds)*/value, /*number(milliseconds)*/alignment, /*number(milliseconds)*/spacing) {
        var offset = value - alignment,
            d      = Math.floor( offset / spacing );
        if (offset % spacing !== 0) {
            ++d;
        }
        return new ns.DatetimeValue(alignment + d * spacing);
    };

    DatetimeMeasure.findTickmarkWithMonthSpacing = function (/*DatetimeValue*/value, /*DatetimeValue*/alignment, /*number(months)*/monthSpacing) {
        var valueD = value.value,       //NOTE: ".value" property of DatetimeValue is a javascript Date object
            alignD = alignment.value,   //NOTE: ".value" property of DatetimeValue is a javascript Date object
            monthOffset = 12 * (valueD.getUTCFullYear() - alignD.getUTCFullYear()) + (valueD.getUTCMonth() - alignD.getUTCMonth()),
            d = Math.floor( monthOffset / monthSpacing );

        if (monthOffset % monthSpacing !== 0) { ++d; }
        else if (valueD.getUTCDate() > alignD.getUTCDate()) { ++d; }
        else if (valueD.getUTCDate() === alignD.getUTCDate() && valueD.getUTCHours() > alignD.getUTCHours()) { ++d; }
        else if (valueD.getUTCDate() === alignD.getUTCDate() && valueD.getUTCHours() === alignD.getUTCHours() && valueD.getUTCMinutes() > alignD.getUTCMinutes()) { ++d; }
        else if (valueD.getUTCDate() === alignD.getUTCDate() && valueD.getUTCHours() === alignD.getUTCHours() && valueD.getUTCMinutes() === alignD.getUTCMinutes() && valueD.getUTCSeconds() > alignD.getUTCSeconds()) { ++d; }
        else if (valueD.getUTCDate() === alignD.getUTCDate() && valueD.getUTCHours() === alignD.getUTCHours() && valueD.getUTCMinutes() === alignD.getUTCMinutes() && valueD.getUTCSeconds() === alignD.getUTCSeconds() && valueD.getUTCMilliseconds() > alignD.getUTCMilliseconds()) { ++d; }

        return alignment.add( DatetimeMeasure.parse((d * monthSpacing) + "M") );
    };

    DatetimeMeasure.prototype.firstSpacingLocationAtOrAfter = function (value, alignment)  {
        switch (this.unit) {
            case DatetimeMeasure.MILLISECOND:
            case DatetimeMeasure.SECOND:
            case DatetimeMeasure.MINUTE:
            case DatetimeMeasure.HOUR:
            case DatetimeMeasure.DAY:
            case DatetimeMeasure.WEEK:
                return DatetimeMeasure.findTickmarkWithMillisecondSpacing(value.getRealValue(), alignment.getRealValue(), this.getRealValue());
            case DatetimeMeasure.MONTH:
                return DatetimeMeasure.findTickmarkWithMonthSpacing(value, alignment, this.measure);
            case DatetimeMeasure.YEAR:
                return DatetimeMeasure.findTickmarkWithMonthSpacing(value, alignment, this.measure * 12);
        }    
    };

    DatetimeMeasure.prototype.toString = function () {
        return this.measure.toString() + this.unit.toString();
    };

    DatetimeMeasure.MILLISECOND = new DatetimeUnit("ms");
    DatetimeMeasure.SECOND      = new DatetimeUnit("s");
    DatetimeMeasure.MINUTE      = new DatetimeUnit("m");
    DatetimeMeasure.HOUR        = new DatetimeUnit("H");
    DatetimeMeasure.DAY         = new DatetimeUnit("D");
    DatetimeMeasure.WEEK        = new DatetimeUnit("W");
    DatetimeMeasure.MONTH       = new DatetimeUnit("M");
    DatetimeMeasure.YEAR        = new DatetimeUnit("Y");

    ns.DatetimeMeasure = DatetimeMeasure;

});
/*global sprintf */

window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var DatetimeValue = function (value) {
        if (typeof(value) !== "number") {
            throw new Error("DatetimeValue requires its parameter to be a number");
        }
        this.value = new Date(value);
    };

    DatetimeValue.prototype.getRealValue = function () {
        return this.value.getTime();
    };

    DatetimeValue.prototype.type = ns.DataValue.DATETIME;

    DatetimeValue.prototype.clone = function() {
        return new DatetimeValue(this.getRealValue());
    };

    DatetimeValue.parse = function (string) {
        var Y = 0,
            M = 0,
            D = 1,
            H = 0,
            m = 0,
            s = 0,
            ms = 0;
        if (typeof(string) === "string") {
            string = string.replace(/[\.\-\:\s]/g, "");
            if (string.length === 4) {
                Y = parseInt(string, 10);
            } else if (string.length === 6) {
                Y = parseInt(string.substring(0,4), 10);
                M = parseInt(string.substring(4,6), 10) - 1;
            } else if (string.length === 8) {
                Y = parseInt(string.substring(0,4), 10);
                M = parseInt(string.substring(4,6), 10) - 1;
                D = parseInt(string.substring(6,8), 10);
            } else if (string.length === 10) {
                Y = parseInt(string.substring(0,4), 10);
                M = parseInt(string.substring(4,6), 10) - 1;
                D = parseInt(string.substring(6,8), 10);
                H = parseInt(string.substring(8,10), 10);
            } else if (string.length === 12) {
                Y = parseInt(string.substring(0,4), 10);
                M = parseInt(string.substring(4,6), 10) - 1;
                D = parseInt(string.substring(6,8), 10);
                H = parseInt(string.substring(8,10), 10);
                m = parseInt(string.substring(10,12), 10);
            } else if (string.length === 14) {
                Y = parseInt(string.substring(0,4), 10);
                M = parseInt(string.substring(4,6), 10) - 1;
                D = parseInt(string.substring(6,8), 10);
                H = parseInt(string.substring(8,10), 10);
                m = parseInt(string.substring(10,12), 10);
                s = parseInt(string.substring(12,14), 10);
            } else if (string.length === 15 || string.length === 16 || string.length === 17) {
                Y  = parseInt(string.substring(0,4), 10);
                M  = parseInt(string.substring(4,6), 10) - 1;
                D  = parseInt(string.substring(6,8), 10);
                H  = parseInt(string.substring(8,10), 10);
                m  = parseInt(string.substring(10,12), 10);
                s  = parseInt(string.substring(12,14), 10);
                ms = parseInt(string.substring(14,17), 10);
            } else if (string === "0") {
                // handles the case of "0", which parser should convert to the Unix epoch
                Y = 1970;
            } else {
                throw new Error("Incorrect input format for Datetime Value's parse method");
            }
        } else {
            throw new Error("Datetime Value's parse method requires its parameter to be a string");
        }
        return new DatetimeValue(Date.UTC(Y, M, D, H, m, s, ms));
    };


    DatetimeValue.prototype.toString = function () {
        var Y, M, D, H, m, s, ms;

        Y  = sprintf("%04s", this.value.getUTCFullYear().toString());
        M  = sprintf("%02s", (this.value.getUTCMonth() + 1).toString());
        D  = sprintf("%02s", this.value.getUTCDate().toString());
        H  = sprintf("%02s", this.value.getUTCHours().toString());
        m  = sprintf("%02s", this.value.getUTCMinutes().toString());
        s  = sprintf("%02s", this.value.getUTCSeconds().toString());
        ms = "." + sprintf("%03s", this.value.getUTCMilliseconds().toString());

        if (ms === ".000") {
            ms = "";
        }
        
        return Y + M + D + H + m + s + ms;
    };


    DatetimeValue.prototype.compareTo = function (x) {
        if (this.getRealValue() < x.getRealValue()) {
            return -1;
        } else if (this.getRealValue() > x.getRealValue()) {
            return 1;
        }
        return 0;
    };

    DatetimeValue.prototype.addRealValue = function ( realValueIncr ) {
        return new DatetimeValue(this.value.getTime() + realValueIncr);
    };

    DatetimeValue.prototype.add = function ( /*DataMeasure*/ measure) {
        var date = new DatetimeValue(this.getRealValue());
        switch (measure.unit) {
            case ns.DatetimeMeasure.MILLISECOND:
                date.value.setUTCMilliseconds(date.value.getUTCMilliseconds() + measure.measure);
                break;
            case ns.DatetimeMeasure.SECOND:
                date.value.setUTCSeconds(date.value.getUTCSeconds() + measure.measure);
                break;
            case ns.DatetimeMeasure.MINUTE:
                date.value.setUTCMinutes(date.value.getUTCMinutes() + measure.measure);
                break;
            case ns.DatetimeMeasure.HOUR:
                date.value.setUTCHours(date.value.getUTCHours() + measure.measure);
                break;
            case ns.DatetimeMeasure.DAY:
                date.value.setUTCDate(date.value.getUTCDate() + measure.measure);
                break;
            case ns.DatetimeMeasure.WEEK:
                date.value.setUTCDate(date.value.getUTCDate() + measure.measure * 7);
                break;
            case ns.DatetimeMeasure.MONTH:
                date.value.setUTCMonth(date.value.getUTCMonth() + measure.measure);
                break;
            case ns.DatetimeMeasure.YEAR:
                date.value.setUTCFullYear(date.value.getUTCFullYear() + measure.measure);
                break;
        }
        return date;
    };

    ns.DataValue.mixinComparators(DatetimeValue.prototype);

    ns.DatetimeValue = DatetimeValue;

});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var Filter,
        defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
        attributes = window.multigraph.utilityFunctions.getKeys(defaultValues.plot.filter);

    Filter = new window.jermaine.Model( "Filter", function () {
        this.hasMany("options").which.validatesWith(function (option) {
            return option instanceof ns.FilterOption;
        });
        this.hasA("type").which.validatesWith(function (type) {
            return typeof(type) === "string";
        });

        window.multigraph.utilityFunctions.insertDefaults(this, defaultValues.plot.filter, attributes);
    });

    ns.Filter = Filter;
});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
        attributes = window.multigraph.utilityFunctions.getKeys(defaultValues.plot.filter.option),
        FilterOption = new window.jermaine.Model( "FilterOption", function () {
        this.hasA("name").which.validatesWith(function (name) {
            return typeof(name) === "string";
        });
        this.hasA("value").which.validatesWith(function (value) {
            return typeof(value) === "string";
        });

        window.multigraph.utilityFunctions.insertDefaults(this, defaultValues.plot.filter.option, attributes);
    });

    ns.FilterOption = FilterOption;

});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var Box = window.multigraph.math.Box;

    var defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
        attributes = window.multigraph.utilityFunctions.getKeys(defaultValues),
        Graph = new window.jermaine.Model( "Graph", function () {
            this.hasA("window").which.validatesWith(function (w) {
                return w instanceof ns.Window;
            });
            this.hasA("plotarea").which.validatesWith(function (plotarea) {
                return plotarea instanceof ns.Plotarea;
            });


            this.hasA("legend").which.validatesWith(function (legend) {
                return legend instanceof ns.Legend;
            });
            this.hasA("background").which.validatesWith(function (background) {
                return background instanceof ns.Background;
            });

            this.hasA("title").which.validatesWith(function (title) {
                return title instanceof ns.Title;
            });
            this.hasMany("axes").which.validatesWith(function (axis) {
                return axis instanceof ns.Axis;
            });
            this.hasMany("plots").which.validatesWith(function (plot) {
                return plot instanceof ns.Plot;
            });
            this.hasMany("data").which.validatesWith(function (data) {
                return data instanceof ns.Data;
            });

            this.hasA("windowBox").which.validatesWith(function (val) {
                return val instanceof Box;
            });
            this.hasA("paddingBox").which.validatesWith(function (val) {
                return val instanceof Box;
            });
            this.hasA("plotBox").which.validatesWith(function (val) {
                return val instanceof Box;
            });
            
            this.isBuiltWith(function () {
                this.window( new ns.Window() );
                this.plotarea( new ns.Plotarea() );
                this.background( new ns.Background() );
            });

            this.respondsTo("postParse", function () {
            });

            this.respondsTo("initializeGeometry", function (width, height, graphicsContext) {
                var i;
                this.windowBox( new Box(width, height) );
                this.paddingBox( new Box(
                    ( width -
                      ( this.window().margin().left()  + this.window().border() + this.window().padding().left() ) -
                      ( this.window().margin().right() + this.window().border() + this.window().padding().right() )
                    ),
                    ( height -
                      ( this.window().margin().top()    + this.window().border() + this.window().padding().top() ) -
                      ( this.window().margin().bottom() + this.window().border() + this.window().padding().bottom() )
                    )
                )
                               );
                this.plotBox( new Box(
                    ( this.paddingBox().width() -
                      ( this.plotarea().margin().left() + this.plotarea().margin().right() + (2 * this.plotarea().border()))
                    ),
                    (
                        this.paddingBox().height() -
                            ( this.plotarea().margin().top() + this.plotarea().margin().bottom() + (2 * this.plotarea().border()))
                    )
                )
                            );
                for (i = 0; i < this.axes().size(); ++i) {
                    this.axes().at(i).initializeGeometry(this);
                }
                if (this.legend()) {
                    this.legend().initializeGeometry(this, graphicsContext);
                }
            });

            window.multigraph.utilityFunctions.insertDefaults(this, defaultValues, attributes);
        });

    Graph.prototype.axisById = function (id) {
      // return a pointer to the axis for this graph that has the given id, if any
        var axes = this.axes(),
            i;
        for (i = 0; i < axes.size(); ++i) {
            if (axes.at(i).id() === id) {
                return axes.at(i);
            }
        }
        return undefined;
    };

    Graph.prototype.variableById = function (id) {
      // return a pointer to the variable for this graph that has the given id, if any
        var data = this.data(),
            i,
            j;
        for (i = 0; i < data.size(); ++i) {
            for (j = 0; j < data.at(i).columns().size(); ++j) {
                if (data.at(i).columns().at(j).id() === id) {
                    return data.at(i).columns().at(j);
                }
            }
        }
        return undefined;
    };

    ns.Graph = Graph;

});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
        attributes = window.multigraph.utilityFunctions.getKeys(defaultValues.title),
        Title = new window.jermaine.Model( "GraphTitle", function () {
            this.hasA("content").which.isA("string");
            this.hasA("border").which.validatesWith(function (border) {
                return typeof(border) === "string";
            });
            this.hasA("color").which.validatesWith(function (color) {
                return color instanceof window.multigraph.math.RGBColor;
            });
            this.hasA("bordercolor").which.validatesWith(function (bordercolor) {
                return bordercolor instanceof window.multigraph.math.RGBColor;
            });
            this.hasA("opacity").which.isA("number");
            this.hasA("padding").which.validatesWith(function (padding) {
                return typeof(padding) === "string";
            });
            this.hasA("cornerradius").which.validatesWith(function (cornerradius) {
                return typeof(cornerradius) === "string";
            });
            this.hasA("anchor").which.validatesWith(function (anchor) {
                return anchor instanceof window.multigraph.math.Point;
            });
            this.hasA("base").which.validatesWith(function (base) {
                return base instanceof window.multigraph.math.Point;
            });
            this.hasA("position").which.validatesWith(function (position) {
                return position instanceof window.multigraph.math.Point;
            });

            window.multigraph.utilityFunctions.insertDefaults(this, defaultValues.title, attributes);

        });

    ns.Title = Title;
});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
        attributes = window.multigraph.utilityFunctions.getKeys(defaultValues.horizontalaxis.grid),
        Grid = new window.jermaine.Model( "Grid", function () {
            this.hasA("color").which.validatesWith(function (color) {
                return color instanceof window.multigraph.math.RGBColor;
            });
            this.hasA("visible").which.isA("boolean");

            window.multigraph.utilityFunctions.insertDefaults(this, defaultValues.horizontalaxis.grid, attributes);
        });

    ns.Grid = Grid;

});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
        attributes = window.multigraph.utilityFunctions.getKeys(defaultValues.legend.icon),
        Icon = new window.jermaine.Model( "Icon", function () {
            this.hasA("height").which.isA("integer");
            this.hasA("width").which.isA("integer");
            this.hasA("border").which.isA("integer");

            window.multigraph.utilityFunctions.insertDefaults(this, defaultValues.legend.icon, attributes);
        });

    ns.Icon = Icon;


});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
        attributes = window.multigraph.utilityFunctions.getKeys(defaultValues.background.img),
        Img = new window.jermaine.Model( "Img", function () {
            this.hasA("src").which.validatesWith(function (src) {
                return typeof(src) === "string";
            });
            this.hasA("anchor").which.validatesWith(function (anchor) {
                return anchor instanceof window.multigraph.math.Point;
            });
            this.hasA("base").which.validatesWith(function (base) {
                return base instanceof window.multigraph.math.Point;
            });
            this.hasA("position").which.validatesWith(function (position) {
                return position instanceof window.multigraph.math.Point;
            });
            this.hasA("frame").which.validatesWith(function (frame) {
                return frame === Img.PADDING || frame === Img.PLOT;
            });
            this.isBuiltWith("src");

            window.multigraph.utilityFunctions.insertDefaults(this, defaultValues.background.img, attributes);
        });

    Img.PADDING = "padding";
    Img.PLOT    = "plot";

    ns.Img = Img;
});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
        attributes = window.multigraph.utilityFunctions.getKeys(defaultValues.horizontalaxis.labels.label),
        Axis = ns.Axis,
        DataValue = ns.DataValue,

        Labeler = new window.jermaine.Model( "Labeler", function () {

            var getValue = function (valueOrFunction) {
                if (typeof(valueOrFunction) === "function") {
                    return valueOrFunction();
                } else {
                    return valueOrFunction;
                }
            };

            this.hasA("axis").which.validatesWith(function (axis) {
                return axis instanceof ns.Axis;
            });
            this.hasA("formatter").which.validatesWith(ns.DataFormatter.isInstance);
            this.hasA("start").which.validatesWith(ns.DataValue.isInstance);
            this.hasA("angle").which.isA("number");
            this.hasA("position").which.validatesWith(function (position) {
                return position instanceof window.multigraph.math.Point;
            });
            this.hasA("anchor").which.validatesWith(function (anchor) {
                return anchor instanceof window.multigraph.math.Point;
            });
            this.hasA("spacing").which.validatesWith(ns.DataMeasure.isInstance);
            this.hasA("densityfactor").which.isA("number");

            this.isBuiltWith("axis", function () {
                if (this.axis().type() === DataValue.DATETIME) {
                    this.start( getValue(defaultValues.horizontalaxis.labels['start-datetime']) );
                } else {
                    this.start( getValue(defaultValues.horizontalaxis.labels['start-number']) );
                }
            });

            this.respondsTo("initializeGeometry", function (graph) {
                var labelDefaults = defaultValues.horizontalaxis.labels.label;

                if (this.position() === undefined) {
                    if (this.axis().orientation() === Axis.HORIZONTAL) {
                        if (this.axis().perpOffset() > graph.plotBox().height()/2) {
                            this.position( getValue(labelDefaults["position-horizontal-top"]) );
                        } else {
                            this.position( getValue(labelDefaults["position-horizontal-bottom"]) );
                        }
                    } else {
                        if (this.axis().perpOffset() > graph.plotBox().width()/2) {
                            this.position( getValue(labelDefaults["position-vertical-right"]) );
                        } else {
                            this.position( getValue(labelDefaults["position-vertical-left"]) );
                        }
                    }
                }

                if (this.anchor() === undefined) {
                    if (this.axis().orientation() === Axis.HORIZONTAL) {
                        if (this.axis().perpOffset() > graph.plotBox().height()/2) {
                            this.anchor( getValue(labelDefaults["anchor-horizontal-top"]) );
                        } else {
                            this.anchor( getValue(labelDefaults["anchor-horizontal-bottom"]) );
                        }
                    } else {
                        if (this.axis().perpOffset() > graph.plotBox().width()/2) {
                            this.anchor( getValue(labelDefaults["anchor-vertical-right"]) );
                        } else {
                            this.anchor( getValue(labelDefaults["anchor-vertical-left"]) );
                        }
                    }
                }


            });

            this.respondsTo("isEqualExceptForSpacing", function (labeler) {
                // return true iff the given labeler and this labeler are equal in every way
                // except for their spacing values
                return ((this.axis()                         ===   labeler.axis()                            ) &&
                        (this.formatter().getFormatString()  ===   labeler.formatter().getFormatString()     ) &&
                        (this.start()                        .eq(  labeler.start()                         ) ) &&
                        (this.angle()                        ===   labeler.angle()                           ) &&
                        (this.position()                     .eq(  labeler.position()                      ) ) &&
                        (this.anchor()                       .eq(  labeler.anchor()                        ) ) &&
                        (this.densityfactor()                ===   labeler.densityfactor()                   )
                       );
            });


            this.hasA("iteratorNextValue").which.validatesWith(ns.DataValue.isInstance).and.which.defaultsTo(null);
            this.hasA("iteratorMinValue").which.validatesWith(ns.DataValue.isInstance);
            this.hasA("iteratorMaxValue").which.validatesWith(ns.DataValue.isInstance);

            this.respondsTo("prepare", function (minDataValue, maxDataValue) {
                this.iteratorMinValue(minDataValue);
                this.iteratorMaxValue(maxDataValue);
                this.iteratorNextValue( this.spacing().firstSpacingLocationAtOrAfter(minDataValue, this.start()) );
            });
            this.respondsTo("hasNext", function () {
                if (this.iteratorNextValue() === null || this.iteratorNextValue() === undefined) {
                    return false;
                }
                return this.iteratorNextValue().le(this.iteratorMaxValue());
            });
            this.respondsTo("peekNext", function () {
                var value = this.iteratorNextValue();
                if (value === null || value === undefined) {
                    return undefined;
                }
                if (this.iteratorMaxValue() !== undefined && value.gt(this.iteratorMaxValue())) {
                    return undefined;
                }
                return value;
            });
            this.respondsTo("next", function () {
                var value = this.iteratorNextValue();
                if (value === null || value === undefined) {
                    return undefined;
                }
                if (this.iteratorMaxValue() !== undefined && value.gt(this.iteratorMaxValue())) {
                    return undefined;
                }
                this.iteratorNextValue( value.add( this.spacing() ) );
                return value;
            });

            this.respondsTo("getLabelDensity", function (graphicsContext) {
                // convert the spacing measure to pixels:
                var pixelSpacing = this.spacing().getRealValue() * this.axis().axisToDataRatio();
                // length of the formatted axis min value, in pixels
                var pixelFormattedValue = this.measureStringWidth(graphicsContext, this.formatter().format(this.axis().dataMin()));
                // return the ratio -- the fraction of the spacing taken up by the formatted string
                return pixelFormattedValue / pixelSpacing;
            });


            this.respondsTo("measureStringWidth", function (graphicsContext, string) {
                // Graphics drivers should replace this method with an actual implementation; this
                // is just a placeholder.  The implementation should return the width, in pixels,
                // of the given string.  Of course this is dependent on font choice, size, etc,
                // but we gloss over that at the moment.  Just return the width of the string
                // using some reasonable default font for now.  Later on, we'll modify this
                // function to use font information.
                return string.length*30;
            });
            this.respondsTo("renderLabel", function (graphicsContext, value) {
                // Graphics drivers should replace this method with an actual implementation; this
                // is just a placeholder.  The implementation should draw the string for the given
                // value, formatted by the labeler's DataFormatter, in the location along the axis
                // determined by the value itself, and the labeler's position, anchor, and angle
                // attributes.
            });


            window.multigraph.utilityFunctions.insertDefaults(this, defaultValues.horizontalaxis.labels.label, attributes);
        });

    ns.Labeler = Labeler;

});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    /**
        @name Legend
        @constructor
        @param {boolean} visible
        @param {point} base
        @param {point} anchor
        @param {point} position 
        @param frame - plot or padding
        @param {rgb} color 
        @param {rgb} bordercolor 
        @param {number} opacity 
        @param {integer} border
        @param {integer} rows
        @param {integer} columns
        @param {integer} cornerradius
        @param {integer} padding
        @param {icon} icon
        @param {plot} plots
        @param {integer} [iconOffset=5]
        @param {integer} [labelOffset=5] 
        @param {integer} [labelEnding=15]
        @param width
        @param height
        @param x
        @param y
        @param blockWidth
        @param blockHeight
        @param maxLabelWidth
        @param maxLabelHeight
        @requires point.js
        @requires rgb_color.js
        @requires validation-functions.js
        @requires plot.js
        @requires icon.js
    */

    var Icon,
        Legend,
        defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
        attributes = window.multigraph.utilityFunctions.getKeys(defaultValues.legend);

    Legend = new window.jermaine.Model( "Legend", function () {
        this.hasA("visible").which.isA("boolean");
        this.hasA("base").which.validatesWith(function (base) {
            return base instanceof window.multigraph.math.Point;
        });
        this.hasAn("anchor").which.validatesWith(function (anchor) {
            return anchor instanceof window.multigraph.math.Point;
        });
        this.hasA("position").which.validatesWith(function (position) {
            return position instanceof window.multigraph.math.Point;
        });
        this.hasA("frame").which.validatesWith(function (frame) {
            return frame === "plot" || frame === "padding";
        });
        this.hasA("color").which.validatesWith(function (color) {
            return color instanceof window.multigraph.math.RGBColor;
        });
        this.hasA("bordercolor").which.validatesWith(function (bordercolor) {
            return bordercolor instanceof window.multigraph.math.RGBColor;
        });
        this.hasA("opacity").which.validatesWith(function (opacity) {
            return window.multigraph.utilityFunctions.validateNumberRange(opacity, 0.0, 1.0);
        });
        this.hasA("border").which.isA("integer");
        this.hasA("rows").which.isA("integer").and.isGreaterThan(0);
        this.hasA("columns").which.isA("integer").and.isGreaterThan(0);
        this.hasA("cornerradius").which.isA("integer");
        this.hasA("padding").which.isA("integer");
        this.hasAn("icon").which.validatesWith(function (icon) {
            return icon instanceof ns.Icon;
        });

        this.hasMany("plots").which.validatesWith(function (plot) {
            return plot instanceof ns.Plot;
        });

        this.hasA("iconOffset").which.defaultsTo(5);
        this.hasA("labelOffset").which.defaultsTo(5);
        this.hasA("labelEnding").which.defaultsTo(15);

        this.hasA("width");
        this.hasA("height");

        this.hasA("x");
        this.hasA("y");

        this.hasA("blockWidth");
        this.hasA("blockHeight");

        this.hasA("maxLabelWidth");
        this.hasA("maxLabelHeight");

        /**
            Initializes the legend
            @method Legend#initializeGeometry
            @param graph
            @return {boolean} visible
            @return widths
            @return heights
            @todo Find out whether or not padding needs to be taken into consideration.
        */
        this.respondsTo("initializeGeometry", function (graph, graphicsContext) {
            var widths = [],
                heights = [],
                label,
                i;

            if (this.visible() === false) {
                return;
            }

            for (i = 0; i < graph.plots().size(); i++) {
                if (graph.plots().at(i).legend() && graph.plots().at(i).legend().visible() !== false) {
                    this.plots().add(graph.plots().at(i));
                }
            }

            if (this.visible() === undefined) {
                if (this.plots().size() > 1) {
                    this.visible(true);
                } else {
                    this.visible(false);
                    return;
                }
            }

            // if neither rows nor cols is specified, default to 1 col
            if (this.rows() === undefined && this.columns() === undefined) {
                this.columns(1);
            }

            // if only one of rows/cols is specified, compute the other
            if (this.columns() === undefined) {
                this.columns(parseInt(this.plots().size() / this.rows() + ( (this.plots().size() % this.rows()) > 0 ? 1 : 0 ), 10));
            } else if  (this.rows() === undefined) {
                this.rows(parseInt(this.plots().size() / this.columns() + ( (this.plots().size() % this.columns()) > 0 ? 1 : 0 ), 10));
            }

            for (i = 0; i < this.plots().size(); i++) {
                label = this.plots().at(i).legend().label();
                if (label !== undefined) {
                    label.initializeGeometry(graphicsContext);
                    widths.push(label.width());
                    heights.push(label.height());
                }
            }

            widths.sort(function (a, b) {
                return b - a;
            });
            heights.sort(function (a, b) {
                return b - a;
            });
            this.maxLabelWidth(widths[0]);
            this.maxLabelHeight(Math.max(heights[0], this.icon().height()));

            this.blockWidth(this.iconOffset() + this.icon().width() + this.labelOffset() + this.maxLabelWidth() + this.labelEnding());
            this.blockHeight(this.iconOffset() + this.maxLabelHeight());

// TODO: find out whether or not padding needs to be taken into consideration
            this.width((2 * this.border()) + (this.columns() * this.blockWidth()));
            this.height((2 * this.border()) + (this.rows() * this.blockHeight()) + this.iconOffset());

            if (this.frame() === "padding") {
                this.x(((this.base().x() + 1) * graph.paddingBox().width()/2) - ((this.anchor().x() + 1) * this.width()/2) + this.position().x());
                this.y(((this.base().y() + 1) * graph.paddingBox().height()/2) - ((this.anchor().y() + 1) * this.height()/2) + this.position().y());
            } else {
                this.x(((this.base().x() + 1) * graph.plotBox().width()/2) - ((this.anchor().x() + 1) * this.width()/2) + this.position().x());
                this.y(((this.base().y() + 1) * graph.plotBox().height()/2) - ((this.anchor().y() + 1) * this.height()/2) + this.position().y());
            }

        });

        /**
            Draws the legend
            @method Legend#render
            @param graphicsContext
           
        */
        this.respondsTo("render", function (graphicsContext) {
            var blockx, blocky,
                iconx, icony,
                labelx, labely,
                plotCount = 0,
                r, c;

            if (this.visible() === false) {
                return;
            }

            // preform any neccesary setup
            this.begin(graphicsContext);

            // Draw the legend box
            this.renderLegend(graphicsContext);

            for (r = 0; r < this.rows(); r++) {
                if (plotCount >= this.plots().size()) {
                    break;
                }
                blocky = this.border() + ((this.rows() - r - 1) * this.blockHeight());
                icony  = blocky + this.iconOffset();
                labely = icony;
                for (c = 0; c < this.columns(); c++) {
                    if (plotCount >= this.plots().size()) {
                        break;
                    }
                    blockx = this.border() + (c * this.blockWidth());
                    iconx  = blockx + this.iconOffset();
                    labelx = iconx + this.icon().width() + this.labelOffset();

                    // Draw the icon
                    this.plots().at(plotCount).renderer().renderLegendIcon(graphicsContext, iconx, icony, this.icon(), this.opacity());
                    
                    // Draw the icon border
                    if (this.icon().border() > 0) {
                        this.icon().renderBorder(graphicsContext, iconx, icony, this.opacity());
                    }
                    
                    // Write the text
                    this.renderLabel(this.plots().at(plotCount).legend().label().string(), graphicsContext, labelx, labely);

                    plotCount++;
                }
            }

            // preform any neccesary steps at the end of rendering
            this.end(graphicsContext);

        });

//        /**
//            Measure the width of the text
//            @method Legend#measureLabelWidth
//            @param {string}
//            @return length
//            @todo Replace this function with one that properly measure the width of text.  This will most likely be done in an abstract text class which has knowledge of the rendering environment.
//        */
//
//
//// TODO: replace these functions with ones that properly measure the width/height of text.
////       This will most likely be done in an abstract text class which has knowledge of the
////       rendering environment.
//        this.respondsTo("measureLabelWidth", function (string) {
//                // Graphics drivers should replace this method with an actual implementation; this
//                // is just a placeholder.  The implementation should return the width, in pixels,
//                // of the given string.  Of course this is dependent on font choice, size, etc,
//                // but we gloss over that at the moment.  Just return the width of the string
//                // using some reasonable default font for now.  Later on, we'll modify this
//                // function to use font information.
//                return string.length*30;
//        });
//
//
//
//        /**
//            Measure the height of the text
//            @method Legend#measureLabelHeight
//            @param {string}
//            @return height
//            @todo Replace this function with one that properly measures the height of text.  This will most likely be done in an abstract text class which has knowledge of the rendering environment.
//        */
//        this.respondsTo("measureLabelHeight", function (string) {
//                // Graphics drivers should replace this method with an actual implementation; this
//                // is just a placeholder.  The implementation should return the height, in pixels,
//                // of the given string.  Of course this is dependent on font choice, size, etc,
//                // but we gloss over that at the moment.  Just return the height of the string
//                // using some reasonable default font for now.  Later on, we'll modify this
//                // function to use font information.
//                return 12;
//        });

        window.multigraph.utilityFunctions.insertDefaults(this, defaultValues.legend, attributes);
    });

    ns.Legend = Legend;

});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var Mixin = new window.jermaine.Model( "Mixin", function () {
        //var mixinfuncs = [];

        this.hasMany("mixinfuncs");

        this.respondsTo("add", function (func) {
            this.mixinfuncs().add(func);
        });

        this.respondsTo("apply", function () {
            var i;
            for (i=0; i<this.mixinfuncs().size(); ++i) {
                this.mixinfuncs().at(i).apply(this, arguments);
            }
        });

   });

    ns.Mixin = Mixin;

});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var Multigraph = new window.jermaine.Model( "Multigraph", function () {

        this.hasMany("graphs").which.validatesWith(function (graph) {
            return graph instanceof ns.Graph;
        });

        this.hasA("div"); // the actual div element

        this.respondsTo("initializeGeometry", function (width, height, graphicsContext) {
            var i;
            for (i=0; i < this.graphs().size(); ++i) {
                this.graphs().at(i).initializeGeometry(width, height, graphicsContext);
            }
        });

        this.respondsTo("registerCommonDataCallback", function (callback) {
            var i, j,
                graphs = this.graphs(),
                data;
            for (i=0; i < graphs.size(); ++i) {
                data = graphs.at(i).data();
                for (j=0; j<data.size(); ++j) {
                    data.at(j).onReady(callback);
                }
            }
        });

    });

    Multigraph.createGraph = function (obj) {
        var div = obj.div;
        if (!obj.driver) {
            obj.driver = "canvas";
        }
        if (typeof(div) === "string") {
            // if div is a string, assume it's an id, and convert
            // it to the div element itself
            div = window.multigraph.jQuery("#" + div)[0];
        }
        if (!obj.errorHandler || typeof(obj.errorHandler) !== "function") {
            obj.errorHandler = Multigraph.createDefaultErrorHandler(div);
        }
        if (obj.driver === "canvas") {
            return Multigraph.createCanvasGraph(div, obj.mugl, obj.errorHandler);
        } else if (obj.driver === "raphael") {
            return Multigraph.createRaphaelGraph(div, obj.mugl, obj.errorHandler);
        } else if (obj.driver === "logger") {
            return Multigraph.createLoggerGraph(div, obj.mugl);
        }
        throw new Error("invalid graphic driver '" + obj.driver + "' specified to Multigraph.createGraph");
    };

    Multigraph.createDefaultErrorHandler = function (div) {
        return function (e) {
            var errorMessages,
                flag = true,
                i;

            window.multigraph.jQuery(div).css("overflow", "auto");

            window.multigraph.jQuery(div).children("div").each(function (i) {
                if (window.multigraph.jQuery(this).text() === "An error has occured. Please scroll down in this region to see the error messages.") {
                    flag = false;
                }
            });

            if (flag) {
                window.multigraph.jQuery(div).prepend(window.multigraph.jQuery("<br>"));
                window.multigraph.jQuery(div).prepend(window.multigraph.jQuery("<div>", {"text" : "An error has occured. Please scroll down in this region to see the error messages.", "style" : "z-index:100; border:1px solid black; background-color : #E00; white-space: pre-wrap; text-align: left;"}));
            }

            window.multigraph.jQuery(div).append(window.multigraph.jQuery("<ol>", {"text" : e.message, "style" : "z-index:100; border:1px solid black; background-color : #CCC; white-space: pre-wrap; text-align: left;"}));

            if (e.stack && typeof(e.stack) === "string") {
                errorMessages = e.stack.split(/\n/);
                for (i = 1; i < errorMessages.length; i++) {
                    window.multigraph.jQuery(window.multigraph.jQuery(div).find("ol")).append(window.multigraph.jQuery("<li>", {"text" : errorMessages[i].trim().replace(" (file", "\n(file"), "style" : "margin-bottom: 3px;"}));
                }
            }
        };
    };

    ns.Multigraph = Multigraph;

});
/*global sprintf */

window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";
    var NumberFormatter = function (format) {
        var testString;
        if (typeof(format) !== "string") {
            throw new Error("format must be a string");
        }
        this.formatString = format;
        testString = sprintf(format, 0);
        this.length = testString.length;
    };

    NumberFormatter.prototype.format = function (value) {
        return sprintf(this.formatString, value.getRealValue());
    };

    NumberFormatter.prototype.getMaxLength = function () {
        return this.length;
    };

    NumberFormatter.prototype.getFormatString = function () {
        return this.formatString;
    };

    ns.NumberFormatter = NumberFormatter;

});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    // Fudge factor for floating point comparisons:
    var epsilon = 1E-12;

    var NumberMeasure = function (measure) {
        this.measure = measure;
    };

    NumberMeasure.prototype.getRealValue = function () {
        return this.measure;
    };

    NumberMeasure.prototype.toString = function () {
        return this.measure.toString();
    };

    NumberMeasure.prototype.firstSpacingLocationAtOrAfter = function (value, alignment)  {
        var f,
            n,
            m,
            a = alignment.value,
            v = value.value,
            s = Math.abs(this.measure);
        f = (v - a) / s;
        n = Math.floor(f);
        m = n + 1;
        //if ((Math.abs(n - f) < epsilon) || (Math.abs(m - f) < epsilon)) {
        //NOTE: by definition of n=floor(f), we know f >= n, so Math.abs(n - f) is the same as (f - n)
        //Also by definition, floor(f)+1 >= f, so Math.abs(m - f) is the same as (m - f)
        if ((f - n < epsilon) || (m - f < epsilon)) {
            return new ns.NumberValue(v);
        }
        return new ns.NumberValue(a + s * m);

    };

    NumberMeasure.parse = function (s) {
        return new NumberMeasure(parseFloat(s));
    };

    ns.NumberMeasure = NumberMeasure;

});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var NumberValue = function (value) {
        this.value = value;
    };

    NumberValue.prototype.getRealValue = function () {
        return this.value;
    };

    NumberValue.prototype.toString = function () {
        return this.value.toString();
    };

    NumberValue.prototype.compareTo = function (x) {
        if (this.value < x.value) {
            return -1;
        } else if (this.value > x.value) {
            return 1;
        }
        return 0;
    };

    NumberValue.prototype.addRealValue = function ( realValueIncr ) {
        return new NumberValue(this.value + realValueIncr);
    };

    NumberValue.prototype.add = function (/*DataMeasure*/ measure) {
        // NOTE: deliberately accessing the 'measure' property of a NumberMeasure here, rather
        // than calling its getRealValue() method, for convenience and efficiency:
        return new NumberValue(this.value + measure.measure);
    };

    NumberValue.prototype.type = ns.DataValue.NUMBER;

    NumberValue.prototype.clone = function() {
        return new NumberValue(this.value);
    };

    NumberValue.parse = function (s) {
        return new NumberValue(parseFloat(s));
    };

    ns.DataValue.mixinComparators(NumberValue.prototype);

    ns.NumberValue = NumberValue;

});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
    attributes = window.multigraph.utilityFunctions.getKeys(defaultValues.horizontalaxis.pan),
    Pan = new window.jermaine.Model( "Pan", function () {
        this.hasA("allowed").which.isA("boolean");
        this.hasA("min").which.validatesWith(function (min) {
            return ns.DataValue.isInstance(min);
        });
        this.hasA("max").which.validatesWith(function (max) {
            return ns.DataValue.isInstance(max);
        });

        //NOTE: the distinction between DataValue and DataMeasure for the zoom & pan model
        //      attributes might seem confusing, so here's a table to clarify it:
        //
        //              Boolean      DataValue      DataMeasure
        //              -------      ---------      -----------
        //  zoom:       allowed      anchor         min,max
        //   pan:       allowed      min,max

        window.multigraph.utilityFunctions.insertDefaults(this, defaultValues.horizontalaxis.pan, attributes);
    });

    ns.Pan = Pan;

});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
        attributes = window.multigraph.utilityFunctions.getKeys(defaultValues.plot.legend),
        PlotLegend = new window.jermaine.Model( "PlotLegend", function () {
            this.hasA("visible").which.isA("boolean");
            this.hasA("label").which.validatesWith(function (label) {
                return label instanceof ns.Text;
            });

            window.multigraph.utilityFunctions.insertDefaults(this, defaultValues.plot.legend, attributes);
        });

    ns.PlotLegend = PlotLegend;

});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
        attributes = window.multigraph.utilityFunctions.getKeys(defaultValues.plotarea),
        Plotarea = new window.jermaine.Model("Plotarea", function () {

            this.hasA("margin").which.validatesWith(function (margin) {
                return margin instanceof window.multigraph.math.Insets;
            }); // defaultTo temporarily handled in isBuiltWith below

            this.hasA("border").which.isA("integer").and.defaultsTo(defaultValues.plotarea.border);

            this.hasA("bordercolor").which.validatesWith(function (bordercolor) {
                return bordercolor instanceof window.multigraph.math.RGBColor;
            }).defaultsTo(window.multigraph.math.RGBColor.parse(defaultValues.plotarea.bordercolor));

            this.isBuiltWith(function () {
                // temporary workaround until we can pass a function to be evaled to defaultsTo():
                this.margin( defaultValues.plotarea.margin() );
            });

        });

    ns.Plotarea = Plotarea;
});
// The Band renderer is a 2-variable renderer which fills the region
// between two data lines with a solid color, and draws a line segment
// between consecutive data points in each line.
// 
// It is very similar to the fill renderer except that the filled region
// extends between the two (vertical axis) data values at each data point, instead
// of between a single (vertical axis) value and a horizontal base line.
// 
// The line segements should occlude the solid fill.
// 
// This renderer accepts the following options:
// 
//     OPTION NAME:          linecolor
//     DATA TYPE:            RGBColor
//     DEFAULT VALUE:        0x000000 (black)
//     DESCRIPTION:          Color used for line segments.
// 
//     OPTION NAME:          linewidth
//     DATA TYPE:            number
//     DEFAULT VALUE:        1
//     DESCRIPTION:          Width, in pixels, of line segments.  A
//                           value of 0 means do not draw line segments.
// 
//     OPTION NAME:          line1color
//     DATA TYPE:            RGBColor
//     DEFAULT VALUE:        none (linecolor is used)
//     DESCRIPTION:          Color used for line segments connecting the
//                           values of variable 1.   If both linecolor and
//                           line1color are specified, line1color is used.
// 
//     OPTION NAME:          line1width
//     DATA TYPE:            number
//     DEFAULT VALUE:        -1 (linewidth is used)
//     DESCRIPTION:          Width, in pixels, of line segments connecting the
//                           values of variable 1.  A value of 0 means do not
//                           draw line segments.   If both linewidth and
//                           line1width are specified, line1width is used.
// 
//     OPTION NAME:          line2color
//     DATA TYPE:            RGBColor
//     DEFAULT VALUE:        none (linecolor is used)
//     DESCRIPTION:          Color used for line segments connecting the
//                           values of variable 2.   If both linecolor and
//                           line2color are specified, line2color is used.
// 
//     OPTION NAME:          line2width
//     DATA TYPE:            number
//     DEFAULT VALUE:        -1 (linewidth is used)
//     DESCRIPTION:          Width, in pixels, of line segments connecting the
//                           values of variable 2.  A value of 0 means do not
//                           draw line segments.   If both linewidth and
//                           line2width are specified, line2width is used.
// 
//     OPTION NAME:          fillcolor
//     DATA TYPE:            RGBColor
//     DEFAULT VALUE:        0x808080 (dark gray)
//     DESCRIPTION:          Color used for the fill area.
// 
//     OPTION NAME:          fillopacity
//     DATA TYPE:            number
//     DEFAULT VALUE:        1
//     DESCRIPTION:          Opacity used for the fill area.
// 
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var BandRenderer;

    BandRenderer = new window.jermaine.Model( "BandRenderer", function () {
        this.isA(ns.Renderer);
    });

    BandRenderer.GRAY = parseInt("80", 16) / 255;

    ns.Renderer.declareOptions(BandRenderer, "BandRendererOptions", [
        {
            "name"          : "linecolor",
            "type"          : ns.Renderer.RGBColorOption,
            "default"       : new window.multigraph.math.RGBColor(0,0,0)
        },
        {
            "name"          : "linewidth",
            "type"          : ns.Renderer.NumberOption,
            "default"       : 1
        },
        {
            "name"          : "line1color",
            "type"          : ns.Renderer.RGBColorOption,
            "default"       : null
        },
        {
            "name"          : "line1width",
            "type"          : ns.Renderer.NumberOption,
            "default"       : -1
        },
        {
            "name"          : "line2color",
            "type"          : ns.Renderer.RGBColorOption,
            "default"       : null
        },
        {
            "name"          : "line2width",
            "type"          : ns.Renderer.NumberOption,
            "default"       : -1
        },
        {
            "name"          : "fillcolor",
            "type"          : ns.Renderer.RGBColorOption,
            "default"       : new window.multigraph.math.RGBColor(BandRenderer.GRAY,BandRenderer.GRAY,BandRenderer.GRAY)
        },
        {
            "name"          : "fillopacity",
            "type"          : ns.Renderer.NumberOption,
            "default"       : 1.0
        }
    ]);

    ns.Renderer.addType({"type"  : ns.Renderer.Type.parse("band"),
                         "model" : BandRenderer});

    ns.BandRenderer = BandRenderer;
});
// The Bar renderer is a 1-variable renderer which draws a bar at each
// non-missing data point with an outline around the bar and a solid
// fill between the bar and the horizontal axis.
// 
// This renderer accepts the following options:
// 
//     OPTION NAME:          barwidth
//     DATA TYPE:            DataMeasure
//     DEFAULT VALUE:        ???
//     DESCRIPTION:          Width, in relative terms to the type of the
//                           axis the plot is on, of the bars.
//                           
//     OPTION NAME:          baroffset
//     DATA TYPE:            number
//     DEFAULT VALUE:        0
//     DESCRIPTION:          The offset, in pixels, of the left edge of
//                           each bar from the corresponding data value.
//                           
//     OPTION NAME:          barbase
//     DATA TYPE:            DataValue
//     DEFAULT VALUE:        null
//     DESCRIPTION:          The location, relative to the plot's
//                           vertical axis, of the bottom of the bar; if
//                           no barbase is specified, the bars will
//                           extend down to the bottom of the plot area.
//                           
//     OPTION NAME:          linecolor
//     DATA TYPE:            RGBColor
//     DEFAULT VALUE:        0x000000 (black)
//     DESCRIPTION:          The color to be used for the outline around
//                           each bar.
// 
//     OPTION NAME:          fillcolor
//     DATA TYPE:            RGBColor
//     DEFAULT VALUE:        0x000000 (black)
//     DESCRIPTION:          The color to be used for the fill inside
//                           each bar; if barbase is specified, this
//                           color is used only for bars that extend
//                           above the base.
// 
//     OPTION NAME:          fillopacity
//     DATA TYPE:            number
//     DEFAULT VALUE:        1
//     DESCRIPTION:          Opacity used for the fill inside each bar.
// 
//     OPTION NAME:          hidelines
//     DATA TYPE:            number
//     DEFAULT VALUE:        2
//     DESCRIPTION:          Bars which are less wide, in pixels, than
//                           this number do not render their outlines.
//                           
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var BarRenderer,
        defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
        attributes = window.multigraph.utilityFunctions.getKeys(defaultValues.plot.renderer);

    BarRenderer = new window.jermaine.Model( "BarRenderer", function () {
        this.isA(ns.Renderer);
    });

    ns.Renderer.declareOptions(BarRenderer, "BarRendererOptions", [
        {
            "name"          : "barwidth",
            "type"          : ns.Renderer.HorizontalDataMeasureOption,
            "default"       : new ns.DataMeasure.parse("number", 0)
        },
        {
            "name"          : "baroffset",
            "type"          : ns.Renderer.NumberOption,
            "default"       : 0
        },
        {
            "name"          : "barbase",
            "type"          : ns.Renderer.VerticalDataValueOption,
            "default"       : null
        },
        {
            "name"          : "fillcolor",
            "type"          : ns.Renderer.RGBColorOption,
            "default"       : new window.multigraph.math.RGBColor(0,0,0)
        },
        {
            "name"          : "fillopacity",
            "type"          : ns.Renderer.NumberOption,
            "default"       : 1.0
        },
        {
            "name"          : "linecolor",
            "type"          : ns.Renderer.RGBColorOption,
            "default"       : new window.multigraph.math.RGBColor(0,0,0)
        },
        {
            "name"          : "hidelines",
            "type"          : ns.Renderer.NumberOption,
            "default"       : 2
        }
    ]);

    ns.Renderer.addType({"type"  : ns.Renderer.Type.parse("bar"),
                         "model" : BarRenderer});

    ns.BarRenderer = BarRenderer;
});
// The Fill renderer is a 1-variable renderer which connects consecutive
// non-missing data points with line segments with a solid fill between
// the lines and the horizontal axis.
// 
// The line segements should occlude the solid fill.
// 
// This renderer accepts the following options:
// 
//     OPTION NAME:          linecolor
//     DATA TYPE:            RGBColor
//     DEFAULT VALUE:        0x000000 (black)
//     DESCRIPTION:          Color used for line segments
// 
//     OPTION NAME:          linewidth
//     DATA TYPE:            number
//     DEFAULT VALUE:        1
//     DESCRIPTION:          Width, in pixels, of line segments.  A
//                           value of 0 means do not draw line segments.
// 
//     OPTION NAME:          fillcolor
//     DATA TYPE:            RGBColor
//     DEFAULT VALUE:        0x808080 (dark gray)
//     DESCRIPTION:          Color used for the fill area.
// 
//     OPTION NAME:          downfillcolor
//     DATA TYPE:            RGBColor
//     DEFAULT VALUE:        null
//     DESCRIPTION:          Color used for fill area that is below the
//                           fillbase, if a fillbase is specified. If no
//                           downfillcolor is specifed, fillcolor will
//                           be used for all fill areas.
// 
//     OPTION NAME:          fillopacity
//     DATA TYPE:            number
//     DEFAULT VALUE:        1
//     DESCRIPTION:          Opacity used for the fill area.
// 
//     OPTION NAME:          fillbase
//     DATA TYPE:            DataValue
//     DEFAULT VALUE:        null
//     DESCRIPTION:          The location along the plot's vertical axis
//                           of the horizontal line that defines the
//                           bottom (or top) of the filled region; if no
//                           fillbase is specified, the fill will extend
//                           down to the bottom of the plot area.
// 
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var FillRenderer,
        defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
        attributes = window.multigraph.utilityFunctions.getKeys(defaultValues.plot.renderer);

    FillRenderer = new window.jermaine.Model( "FillRenderer", function () {
        this.isA(ns.Renderer);
    });

    FillRenderer.GRAY = parseInt("80", 16) / 255;

    ns.Renderer.declareOptions(FillRenderer, "FillRendererOptions", [
        {
            "name"          : "linecolor",
            "type"          : ns.Renderer.RGBColorOption,
            "default"       : new window.multigraph.math.RGBColor(0,0,0)
        },
        {
            "name"          : "linewidth",
            "type"          : ns.Renderer.NumberOption,
            "default"       : 1
        },
        {
            "name"          : "fillcolor",
            "type"          : ns.Renderer.RGBColorOption,
            "default"       : new window.multigraph.math.RGBColor(FillRenderer.GRAY,FillRenderer.GRAY,FillRenderer.GRAY)
        },
        {
            "name"          : "downfillcolor",
            "type"          : ns.Renderer.RGBColorOption,
            "default"       : null
        },
        {
            "name"          : "fillopacity",
            "type"          : ns.Renderer.NumberOption,
            "default"       : 1.0
        },
        {
            "name"          : "fillbase",
            "type"          : ns.Renderer.VerticalDataValueOption,
            "default"       : null
        }
    ]);

    ns.Renderer.addType({"type"  : ns.Renderer.Type.parse("fill"),
                         "model" : FillRenderer});

    ns.FillRenderer = FillRenderer;
});
// The Pointline renderer is a 1-variable renderer which draws a shape
// at each non-missing data point, and connects consecutive
// non-missing data points with line segments.  The drawing of both
// the points, and the lines, is optional, so this renderer can be
// used to draw just points, just line segments, or both.
// 
// When both points and line segments are drawn, the points should
// be drawn on "top of" the line segments.
// 
// This renderer accepts the following options:
// 
//     OPTION NAME:          linewidth
//     DATA TYPE:            number
//     DEFAULT VALUE:        1
//     DESCRIPTION:          Width, in pixels, of line segments.  A
//                           value of 0 means do not draw line segments.
// 
//     OPTION NAME:          linecolor
//     DATA TYPE:            RGBColor
//     DEFAULT VALUE:        0x000000 (black)
//     DESCRIPTION:          Color used for line segments
// 
//     OPTION NAME:          pointsize
//     DATA TYPE:            number
//     DEFAULT VALUE:        0
//     DESCRIPTION:          The radius of drawn points.  A value
//                           of 0 means do not draw points.
// 
//     OPTION NAME:          pointcolor
//     DATA TYPE:            RGBColor
//     DEFAULT VALUE:        0x000000 (black)
//     DESCRIPTION:          Color used for drawing points
// 
//     OPTION NAME:          pointshape
//     DATA TYPE:            One of the constants PointlineRenderer.CIRCLE,
//                           PointlineRenderer.SQUARE, PointlineRenderer.TRIANGLE,
//                           PointlineRenderer.DIAMOND, PointlineRenderer.STAR,
//                           PointlineRenderer.PLUS, or PointlineRenderer.X.  These
//                           correspond to the strings "circle", "square", "triangle",
//                           "diamond", "star", "plus", and "x" in MUGL files.
//     DEFAULT VALUE:        PointlineRenderer.CIRCLE
//     DESCRIPTION:          The shape to use for drawing points.
// 
//     OPTION NAME:          pointopacity
//     DATA TYPE:            number
//     DEFAULT VALUE:        1.0
//     DESCRIPTION:          The opactiy of the drawn points, in the range 0-1.
//                           A value of 1 means completely opaque; a value of 0
//                           means completely invisible.
// 
//     OPTION NAME:          pointoutlinewidth
//     DATA TYPE:            number
//     DEFAULT VALUE:        0
//     DESCRIPTION:          The width, in pixels, of the outline to be drawn
//                           around each point.  A value of 0 means draw no
//                           outline.
// 
//     OPTION NAME:          pointoutlinecolor
//     DATA TYPE:            RGBColor
//     DEFAULT VALUE:        0x000000 (black)
//     DESCRIPTION:          The color to use for the outline around each point.
//
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var PointlineRenderer,
        defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
        attributes = window.multigraph.utilityFunctions.getKeys(defaultValues.plot.renderer);

    PointlineRenderer = new window.jermaine.Model( "PointlineRenderer", function () {
        this.isA(ns.Renderer);

        //
        //this.isBuiltWith(...)  NO NO NO!!!
        //
        // DO NOT CALL isBuiltWith for a renderer subclass; Renderer.declareOptions calls isBuiltWith(), and it
        // will break if you also call it here!!!

    });


    PointlineRenderer.CIRCLE   = "circle";
    PointlineRenderer.SQUARE   = "square";
    PointlineRenderer.TRIANGLE = "triangle";
    PointlineRenderer.DIAMOND  = "diamond";
    PointlineRenderer.STAR     = "star";
    PointlineRenderer.PLUS     = "plus";
    PointlineRenderer.X        = "x";

    PointlineRenderer.shapes = [ 
        PointlineRenderer.CIRCLE,
        PointlineRenderer.SQUARE,
        PointlineRenderer.TRIANGLE,
        PointlineRenderer.DIAMOND,
        PointlineRenderer.STAR,
        PointlineRenderer.PLUS,
        PointlineRenderer.X
    ];

    PointlineRenderer.isShape = function (shape) {
        var i;
        for (i=0; i<PointlineRenderer.shapes.length; ++i) {
            if (PointlineRenderer.shapes[i] === shape) { return true; }
        }
        return false;
    };

    PointlineRenderer.parseShape = function (string) {
        if (string.toLowerCase() === PointlineRenderer.CIRCLE)   { return PointlineRenderer.CIRCLE;   }
        if (string.toLowerCase() === PointlineRenderer.SQUARE)   { return PointlineRenderer.SQUARE;   }
        if (string.toLowerCase() === PointlineRenderer.TRIANGLE) { return PointlineRenderer.TRIANGLE; }
        if (string.toLowerCase() === PointlineRenderer.DIAMOND)  { return PointlineRenderer.DIAMOND;  }
        if (string.toLowerCase() === PointlineRenderer.STAR)     { return PointlineRenderer.STAR;     }
        if (string.toLowerCase() === PointlineRenderer.PLUS)     { return PointlineRenderer.PLUS;     }
        if (string.toLowerCase() === PointlineRenderer.X)        { return PointlineRenderer.X;        }
        throw new Error("unknown point shape: " + string);
    };

    /*
     * This function converts a "shape" enum object to a string.  In reality, the objects ARE
     * the strings, so we just return the object.
     */
    PointlineRenderer.serializeShape = function (shape) {
        return shape;
    };

    PointlineRenderer.ShapeOption = new window.jermaine.Model( "PointlineRenderer.ShapeOption", function () {
        this.isA(ns.Renderer.Option);
        this.hasA("value").which.validatesWith(PointlineRenderer.isShape);
        this.isBuiltWith("value");
        this.respondsTo("serializeValue", function () {
            return PointlineRenderer.serializeShape(this.value());
        });
        this.respondsTo("parseValue", function (string) {
            this.value( PointlineRenderer.parseShape(string) );
        });
        this.respondsTo("valueEq", function (value) {
            return (this.value()===value);
        });
    });


    ns.Renderer.declareOptions(PointlineRenderer, "PointlineRendererOptions", [
        {
            "name"          : "linecolor",
            "type"          : ns.Renderer.RGBColorOption,
            "default"       : new window.multigraph.math.RGBColor(0,0,0)
        },
        {
            "name"          : "linewidth",
            "type"          : ns.Renderer.NumberOption,
            "default"       : 1
        },
        {
            "name"          : "pointshape",
            "type"          : PointlineRenderer.ShapeOption,
            "default"       : PointlineRenderer.CIRCLE
        },
        {
            "name"          : "pointsize",
            "type"          : ns.Renderer.NumberOption,
            "default"       : 0
        },
        {
            "name"          : "pointcolor",
            "type"          : ns.Renderer.RGBColorOption,
            "default"       : new window.multigraph.math.RGBColor(0,0,0)
        },
        {
            "name"          : "pointopacity",
            "type"          : ns.Renderer.NumberOption,
            "default"       : 1.0
        },
        {
            "name"          : "pointoutlinewidth",
            "type"          : ns.Renderer.NumberOption,
            "default"       : 0
        },
        {
            "name"          : "pointoutlinecolor",
            "type"          : ns.Renderer.RGBColorOption,
            "default"       : new window.multigraph.math.RGBColor(0,0,0)
        }
    ]);

    ns.Renderer.addType({"type"  : ns.Renderer.Type.parse("pointline"),
                         "model" : PointlineRenderer});
    ns.Renderer.addType({"type"  : ns.Renderer.Type.parse("line"),
                         "model" : PointlineRenderer});

    ns.PointlineRenderer = PointlineRenderer;
});
// The RangeBar renderer is a 2-variable renderer which draws a
// vertical bar between two data values, and optionally outlines
// around the bars.  It is very similar to the Bar renderer except
// that the bar is drawn between two data values, instead of between a
// single data value and a base line.
// 
// The line segements should occlude the solid fill.
// 
// This renderer accepts the following options:
// 
//     OPTION NAME:          barwidth
//     DATA TYPE:            DataMeasure
//     DEFAULT VALUE:        ???
//     DESCRIPTION:          Width, in relative terms to the type of the
//                           axis the plot is on, of the bars.
//                           
//     OPTION NAME:          baroffset
//     DATA TYPE:            number
//     DEFAULT VALUE:        0
//     DESCRIPTION:          The offset of the left edge of each bar
//                           from the corresponding data value, as a
//                           fraction (0-1) of the barwidth.
// 
//     OPTION NAME:          fillcolor
//     DATA TYPE:            RGBColor
//     DEFAULT VALUE:        0x808080 (dark gray)
//     DESCRIPTION:          Color used for filling the bars.
// 
//     OPTION NAME:          fillopacity
//     DATA TYPE:            number
//     DEFAULT VALUE:        1
//     DESCRIPTION:          Opacity used for the fill area.
// 
//     OPTION NAME:          linecolor
//     DATA TYPE:            RGBColor
//     DEFAULT VALUE:        0x000000 (black)
//     DESCRIPTION:          Color used for outlines around the bars.
// 
//     OPTION NAME:          linewidth
//     DATA TYPE:            number
//     DEFAULT VALUE:        0
//     DESCRIPTION:          Width, in pixels, of outlines around
//                           the bars.  A value of 0 (which is the
//                           default) means don't draw outlines.
// 
//     OPTION NAME:          hidelines
//     DATA TYPE:            number
//     DEFAULT VALUE:        2
//     DESCRIPTION:          Bars which are less wide, in pixels, than
//                           this number do not render their outlines.
// 
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var RangeBarRenderer;

    RangeBarRenderer = new window.jermaine.Model( "RangeBarRenderer", function () {
        this.isA(ns.Renderer);
    });

    ns.Renderer.declareOptions(RangeBarRenderer, "RangeBarRendererOptions", [
        {
            "name"          : "barwidth",
            "type"          : ns.Renderer.HorizontalDataMeasureOption,
            "default"       : new ns.DataMeasure.parse("number", 0)
        },
        {
            "name"          : "baroffset",
            "type"          : ns.Renderer.NumberOption,
            "default"       : 0
        },
        {
            "name"          : "fillcolor",
            "type"          : ns.Renderer.RGBColorOption,
            "default"       : window.multigraph.math.RGBColor.parse("0x808080")
        },
        {
            "name"          : "fillopacity",
            "type"          : ns.Renderer.NumberOption,
            "default"       : 1.0
        },
        {
            "name"          : "linecolor",
            "type"          : ns.Renderer.RGBColorOption,
            "default"       : new window.multigraph.math.RGBColor(0,0,0)
        },
        {
            "name"          : "linewidth",
            "type"          : ns.Renderer.NumberOption,
            "default"       : 1
        },
        {
            "name"          : "hidelines",
            "type"          : ns.Renderer.NumberOption,
            "default"       : 2
        }
    ]);

    ns.Renderer.addType({"type"  : ns.Renderer.Type.parse("rangebar"),
                         "model" : RangeBarRenderer});

    ns.RangeBarRenderer = RangeBarRenderer;
});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
        attributes = window.multigraph.utilityFunctions.getKeys(defaultValues.data.service),
        Service = new window.jermaine.Model( "Service", function () {
            this.hasA("location").which.validatesWith(function (location) {
                return typeof(location) === "string";
            });

            window.multigraph.utilityFunctions.insertDefaults(this, defaultValues.data.service, attributes);
        });

    ns.Service = Service;

});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    ns.Text = new window.jermaine.Model( "Text", function () {
        this.hasA("string").which.isA("string");
        this.hasA("width").which.isA("number");
        this.hasA("height").which.isA("number");

        this.isBuiltWith("string");

        this.respondsTo("initializeGeometry", function (graphicsContext) {
            this.width(this.measureStringWidth(graphicsContext));
            this.height(this.measureStringHeight(graphicsContext));
        });

        this.respondsTo("measureStringWidth", function () {
            // Graphics drivers should replace this method with an actual implementation; this
            // is just a placeholder.  The implementation should return the width, in pixels,
            // of the given string.  Of course this is dependent on font choice, size, etc,
            // but we gloss over that at the moment.  Just return the width of the string
            // using some reasonable default font for now.  Later on, we'll modify this
            // function to use font information.
            var lines,
                maxLength = 1,
                testLength,
                i;

            if (this.string() === undefined) {
                throw new Error("measureStringWidth requires the string attr to be set.");
            }

            lines = this.string().split(/\n/);
            for (i = 0; i < lines.length; i++) {
                testLength = lines[i].length;
                if (testLength > maxLength) {
                    maxLength = testLength;
                }
            }
            
            return maxLength * 15;
        });

        this.respondsTo("measureStringHeight", function () {
            // Graphics drivers should replace this method with an actual implementation; this
            // is just a placeholder.  The implementation should return the height, in pixels,
            // of the given string.  Of course this is dependent on font choice, size, etc,
            // but we gloss over that at the moment.  Just return the height of the string
            // using some reasonable default font for now.  Later on, we'll modify this
            // function to use font information.
            if (this.string() === undefined) {
                throw new Error("measureStringHeight requires the string attr to be set.");
            }
            var newlineCount = this.string().match(/\n/g);
            return (newlineCount !== null ? (newlineCount.length + 1) : 1) * 12;
        });
    });
});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var Variables,
        defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
        attributes = window.multigraph.utilityFunctions.getKeys(defaultValues.data.variables);

    Variables = new window.jermaine.Model( "Variables", function () {
        this.hasMany("variable").which.validatesWith(function (variable) {
            return variable instanceof ns.DataVariable;
        });
        this.hasA("missingvalue").which.validatesWith(function (missingvalue) {
            return typeof(missingvalue) === "string";
        });
        this.hasA("missingop").which.validatesWith(function (missingop) {
            return typeof(missingop) === "string";
        });

        window.multigraph.utilityFunctions.insertDefaults(this, defaultValues.data.variables, attributes);
    });

    ns.Variables = Variables;

});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    ns.WebServiceData = window.jermaine.Model(function () {
        var WebServiceData = this;

        this.isA(ns.Data);
        this.hasA("serviceaddress").which.isA("string");
        this.hasA("serviceaddresspattern").which.isA("string");
        this.hasA("format").which.isA("string");
        this.hasA("formatter").which.validatesWith(ns.DataFormatter.isInstance);
        this.isBuiltWith("columns", "serviceaddress", function () {
            this.initializeColumns();
            if (this.columns().size() > 0) {
                var column0Type = this.columns().at(0).type();
                if (this.format() === undefined) {
                    this.format(column0Type===ns.DataValue.NUMBER ? "%f" : "%Y%M%D%H%i%s");
                }
                this.formatter(ns.DataFormatter.create(column0Type, this.format()));
            }
        });

        this.hasA("arraydata").which.defaultsTo(null).and.validatesWith(function(arraydata) {
            return arraydata instanceof ns.ArrayData || arraydata === null;
        });

        /**
         * A pointer to the head WebServiceDataCacheNode in this WebServieData's cache
         */
        this.hasA("cacheHead").which.defaultsTo(null).and.validatesWith(function(x) {
            //NOTE: need "ns." prefix on WebServiceDataCacheNode below, because of file
            //  load order issues
            return x === null || x instanceof ns.WebServiceDataCacheNode;
        });

        /**
         * A pointer to the tail WebServiceDataCacheNode in this WebServieData's cache
         */
        this.hasA("cacheTail").which.defaultsTo(null).and.validatesWith(function(x) {
            //NOTE: need "ns." prefix on WebServiceDataCacheNode below, because of file
            //  load order issues
            return x === null || x instanceof ns.WebServiceDataCacheNode;
        });

        /**
         * Return a pointer to the first WebServiceDataCacheNode in this WebServieData's cache
         * that actually contains data, if any.  If the cache doesn't contain any data, return null.
         */
        this.respondsTo("dataHead", function() {
            var head = this.cacheHead();
            if (head === null) { return null; }
            if (head.hasData()) { return head; }
            return head.dataNext();
        });

        /**
         * Return a pointer to the last WebServiceDataCacheNode in this WebServieData's cache
         * that actually contains data, if any.  If the cache doesn't contain any data, return null.
         */
        this.respondsTo("dataTail", function() {
            var tail = this.cacheTail();
            if (tail === null) { return null; }
            if (tail.hasData()) { return tail; }
            return tail.dataPrev();
        });

        /**
         * Insert a WebServiceCacheNode into this WebService's cache.
         * If this node's coveredMin is less than the cache head's
         * coveredMin, insert it at the head; otherwise insert it at
         * the tail.  Note that nodes are only inserted either at the
         * head or at the tail of the cache --- not in the middle.
         */
        this.respondsTo("insertCacheNode", function(node) {
            var head = this.cacheHead(),
                tail = this.cacheTail();
            if (head === null) {
                this.cacheHead(node);
                this.cacheTail(node);
            } else {
                if (node.coveredMin().lt(head.coveredMin())) {
                    node.next(head);
                    head.prev(node);
                    this.cacheHead(node);
                } else {
                    node.prev(tail);
                    tail.next(node);
                    this.cacheTail(node);
                }
            }
        });

        this.respondsTo("constructRequestURL", function(min, max) {
            if (this.serviceaddress() === undefined) {
                throw new Error("WebServiceData.constructRequestURL: undefined service address");
            }
            if (this.formatter() === undefined) {
                throw new Error("WebServiceData.constructRequestURL: undefined formatter for column 0");
            }
            if (this.serviceaddresspattern() === undefined) {
                if ((this.serviceaddress().indexOf("$min") < 0) &&
                    (this.serviceaddress().indexOf("$max") < 0)) {
                    this.serviceaddresspattern(this.serviceaddress() + "$min,$max");
                } else {
                    this.serviceaddresspattern(this.serviceaddress());
                }
            }
            return (this.serviceaddresspattern()
                    .replace("$min",this.formatter().format(min))
                    .replace("$max",this.formatter().format(max)));
        });

        this.hasA("coveredMin").which.defaultsTo(null).and.validatesWith(function(x) {
            return x === null || ns.DataValue.isInstance(x);
        });
        this.hasA("coveredMax").which.defaultsTo(null).and.validatesWith(function(x) {
            return x === null || ns.DataValue.isInstance(x);
        });

        /**
         * Initiate requests needed to fetch data between coveredMin and coveredMax, if any.
         */
        this.respondsTo("insureCoveredRange", function() {
            var head = this.cacheHead(),
                tail = this.cacheTail(),
                coveredMin = this.coveredMin(),
                coveredMax = this.coveredMax();

            if (coveredMin === null || coveredMax === null) {
                return;
            }
            if (head === null || tail === null) {
                this.requestSingleRange(coveredMin, coveredMax);
            } else {
                if (coveredMin.lt(head.coveredMin())) {
                    //                     head's min              tail's max
                    //  -----|-------------|-----------------------|----------------
                    //       coveredMin
                    this.requestSingleRange(coveredMin, head.coveredMin());
                }
                if (coveredMax.gt(tail.coveredMax())) {
                    //                     head's min              tail's max
                    //  -------------------|-----------------------|-----------|----
                    //                                                         coveredMax
                    this.requestSingleRange(tail.coveredMax(), coveredMax);
                }
            }
        });

        this.respondsTo("requestSingleRange", function(min, max) {
            var node,
                requestURL,
                that = this;

            // create the cache node that will hold the data in this range
            node = new ns.WebServiceDataCacheNode(min, max);

            // insert it into the cache linked list
            this.insertCacheNode(node);

            // construct the URL for fetching the data in this range
            requestURL = this.constructRequestURL(min, max);

            // initiate the fetch request
            window.multigraph.jQuery.ajax({
                url      : requestURL,
                dataType : "text",
                success  : function(data) {
                    // if data contains a <values> tag, extract its text string value
                    if (data.indexOf("<values>") > 0) {
                        data = window.multigraph.parser.jquery.stringToJQueryXMLObj(data).find("values").text();
                    }
                    node.parseData(that.getColumns(), data);
                    if (that.readyCallback() !== undefined) {
                        that.readyCallback()(node.dataMin(), node.dataMax());
                    }
                }
            });
        });

        this.respondsTo("getIterator", function(columnIds, min, max, buffer) {
      
            var initialNode,
                initialIndex,
                n, b, i, tmp,
                finalNode,
                finalIndex,
                columnIndices;

            // if min > max, swap them
            if (min.gt(max)) {
                tmp = min;
                min = max;
                max = tmp;
            }

            if (this.coveredMin() === null || min.lt(this.coveredMin())) {
                this.coveredMin(min.clone());
            }
            if (this.coveredMax() === null || max.gt(this.coveredMax())) {
                this.coveredMax(max.clone());
            }

            if (!this.paused()) {
                this.insureCoveredRange();
            }

            if (this.dataHead() === null) {
                // cache is empty, return empty iterator:
                return {
                    "next"    : function () {},
                    "hasNext" : function () { return false; }
                };
            }
            // convert columnIds to columnIndices
            columnIndices = [];
            for (i=0; i<columnIds.length; ++i) {
                columnIndices.push( this.columnIdToColumnNumber(columnIds[i]) );
            }

            // find the data node containing the 'min' value
            initialNode = this.dataHead();
            while ((initialNode !== null) &&
                   (initialNode.dataNext() !== null) &&
                   (min.gt(initialNode.dataMax()))) {
                initialNode = initialNode.dataNext();
            }
            
            if (initialNode === null || !initialNode.hasData()) {
                initialIndex = -1;
            } else {
                initialIndex = 0;
                // find the index within the initial node corresponding to the 'min' value
                while ((initialIndex < initialNode.data().length-1) &&
                       (initialNode.data()[initialIndex][columnIndices[0]].lt(min))) {
                    ++initialIndex;
                }
                
                // back up 'buffer' steps, being careful not to go further back than the first element of the head node
                n = 0;
                while (n<buffer) {
                    --initialIndex;
                    if (initialIndex<0) {
                        b = initialNode.dataPrev();
                        if (b !== null) {
                            initialNode = b;
                            initialIndex = initialNode.data().length-1;
                        } else {
                            initialIndex = 0;
                            break;
                        }
                    }
                    ++n;
                }
                
                // find the data node containing the 'max' value
                finalNode = initialNode;
                while ( (max.gt(finalNode.dataMax())) &&
                        (finalNode.dataNext() !== null) ) {
                    finalNode = finalNode.dataNext();
                }
                
                // find the index within the final node corresponding to the 'max' value
                finalIndex = 0;
                if (finalNode === initialNode) {
                    finalIndex = initialIndex;
                }
                while ((finalIndex < finalNode.data().length-1) &&
                       (finalNode.data()[finalIndex][columnIndices[0]].lt(max))) {
                    ++finalIndex;
                }
                
                // go forward 'buffer' more steps, being careful not to go further than the last element of the tail
                n = 0;
                //while (n<buffer && !(finalNode===_tail && finalIndex<finalNode.data.length)) {
                while (n<buffer) {
                    ++finalIndex;
                    if (finalIndex>=finalNode.data().length) {
                        b = finalNode.dataNext();
                        if (b !== null) {
                            finalNode = b;
                            finalIndex = 0;
                        } else {
                            finalIndex = finalNode.data().length-1;
                            break;
                        }
                    }
                    ++n;
                }
                
            }
            
            return new ns.WebServiceDataIterator(columnIndices, initialNode, initialIndex, finalNode, finalIndex);
        });

        this.respondsTo("onReady", function (callback) {
            this.readyCallback(callback);
        });

        this.hasA("paused").which.isA("boolean").and.defaultsTo(false);
        this.respondsTo("pause", function() {
            this.paused(true);
        });
        this.respondsTo("resume", function() {
            this.paused(false);
            if (this.readyCallback() !== undefined) {
                this.readyCallback()(this.coveredMin(), this.coveredMax());
            }
        });

    });
});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var UF = window.multigraph.util.namespace("window.multigraph.utilityFunctions");

    /**
     * A WebServiceDataCacheNode represents a single node in the
     * doubly-linked list holding the data for a WebServiceDataCache.
     * The WebServiceDataCacheNode has an array of data (which may
     * actually be null, if the node's data has not yet been loaded),
     * next and prev pointers to the next and previous nodes in the
     * linked list, and coveredMin and coveredMax values that indicate
     * the min and max values of the "covered" range of data for this
     * node.
     * 
     * The "covered" range is the interval of the data number line for
     * which this node is responsible for storing data; Multigraph
     * uses range this to avoid requesting the same data twice --- it
     * never requests data for a range already covered by an existing
     * cache node.
     * 
     * Initially, when the WebServiceDataCacheNode is created, the
     * limits of the covered range are specified in the constructor.
     * Later on, when the node's data is actually populated, the
     * limits are potentially adjusted outward, if the range of data
     * received is larger than the initially specified covered range.
     * So in all cases, the covered range indicates the range for
     * which no more data is needed, because it's covered by this
     * node.
     * 
     * Note that the covered range is never adjusted to be smaller.
     * 
     * The WebServiceDataCacheNode does not actually fetch any data
     * --- it is simply a storage container for fetched data; it's up
     * to other code outside of this object to fetch and populate the
     * data.
     */
    ns.WebServiceDataCacheNode = window.jermaine.Model(function () {

        /**
         * The actual data for this node.
         */
        this.hasA("data").which.defaultsTo(null).and.validatesWith(function(data) {
            // accept null
            if (data === null) { return true; }
            // only accept arrays
            if (UF.typeOf(data) !== "array") {
                this.message = "WebServiceDataCacheNode's data attribute is not an Array";
                return false;
            }
            // if the array contains anything, do a cursory check that it looks
            // like an array of DataValue arrays (just check the first row)
            if (data.length > 0) {
                var firstRow = data[0],
                    i;
                if (UF.typeOf(firstRow) !== "array") {
                    this.message = "WebServiceDataCacheNode's data attribute is not an Array of Arrays";
                    return false;
                }
                for (i=0; i<firstRow.length; ++i) {
                    if (!ns.DataValue.isInstance(firstRow[i])) {
                        this.message = "WebServiceDataCacheNode's data attribute is not an Array of Arrays of DataValues (bad value in position " + i + " of first row";
                        return false;
                    }
                }
            }
            return true;
        });

        /**
         * The next node in the cache's linked list
         */
        this.hasA("next").which.defaultsTo(null).and.validatesWith(function(x) {
            return x === null || x instanceof ns.WebServiceDataCacheNode;
        });

        /**
         * The previous node in the cache's linked list
         */
        this.hasA("prev").which.defaultsTo(null).and.validatesWith(function(x) {
            return x === null || x instanceof ns.WebServiceDataCacheNode;
        });

        /**
         * The min of the covered value range
         */
        this.hasA("coveredMin").which.validatesWith(ns.DataValue.isInstance);

        /**
         * The max of the covered value range
         */
        this.hasA("coveredMax").which.validatesWith(ns.DataValue.isInstance);

        /**
         * Return the next node in the cache that actually has data,
         * or null if none exists.
         */
        this.respondsTo("dataNext", function() {
            var node = this.next();
            while (node !== null && !node.hasData()) {
                node = node.next();
            }
            return node;
        });

        /**
         * Return the previous node in the cache that actually has data,
         * or null if none exists.
         */
        this.respondsTo("dataPrev", function() {
            var node = this.prev();
            while (node !== null && !node.hasData()) {
                node = node.prev();
            }
            return node;
        });

        /**
         * Return the minimum (column 0) data value for this node.  Returns null
         * if the node has no data yet.
         */
        this.respondsTo("dataMin", function() {
            var data = this.data();
            if (data === null) { return null; }
            if (data.length === 0) { return null; }
            if (data[0] === null) { return null; }
            if (data[0].length === 0) { return null; }
            return data[0][0];
        });

        /**
         * Return the maximum (column 0) data value for this node.    Returns null
         * if the node has no data yet.
         */
        this.respondsTo("dataMax", function() {
            var data = this.data();
            if (data === null) { return null; }
            if (data.length === 0) { return null; }
            if (data[data.length-1] === null) { return null; }
            if (data[data.length-1].length === 0) { return null; }
            return data[data.length-1][0];
        });

        /**
         * Return true if this node has data; false if not
         */
        this.respondsTo("hasData", function() {
            return this.data() !== null;
        });

        this.isBuiltWith("coveredMin", "coveredMax");

        /**
         * Populate this node's data array by parsing the values
         * contained in the 'dataText' string, which should be a
         * string of comma-separated values of the same sort expected
         * by ArrayData and CSVData.  The first argument, 'columns',
         * should be a plain javascript array of DataVariable instances,
         * of the sort returned by Data.getColumns().
         * 
         * This method examines other nodes in the cache in order
         * insure that values included in this node's data array
         * are (a) strictly greater than the maximum value present in the
         * cache prior to this node, and (b) strictly less than the
         * minimum value present in the cache after this node.
         * This guarantees that there is no overlap between the
         * data in this node and other nodes in the cache.
         */
        this.respondsTo("parseData", function(columns, dataText) {
            var i, b,
                maxPrevValue = null,
                minNextValue = null,
                arrayDataArray,
                data,
                row;

            // set maxPrevValue to the max value in column0 in the cache prior to this block, if any:
            b = this.dataPrev();
            if (b !== null) {
                maxPrevValue = b.dataMax();
            }

            // set minNextValue to the min value in column0 in the cache after this block, if any:
            b = this.dataNext();
            if (b !== null) {
                minNextValue = b.dataMin();
            }

            // convert the csv dataText string to an array
            arrayDataArray = ns.ArrayData.textToDataValuesArray(columns, dataText);

            // populate the data array by copying values from the converted array, skipping any
            // values that are already within the range covered by the rest of the cache
            data = [];
            for (i=0; i<arrayDataArray.length; ++i) {
                row = arrayDataArray[i];
                if ((maxPrevValue === null || row[0].gt(maxPrevValue)) &&
                    (minNextValue === null || row[0].lt(minNextValue))) {
                    data.push( row );
                }
            }

            // if we didn't get any new values, we're done
            if (data.length === 0) {
                return;
            }
            
            // lower the coveredMin value if the actual data received is lower than the current coveredMin value
            if (data[0][0].lt(this.coveredMin())) {
                this.coveredMin(data[0][0]);
            }

            // raise the coveredMax value if the actual data received is higher than the current coveredMax value
            if (data[data.length-1][0].gt(this.coveredMax())) {
                this.coveredMax(data[data.length-1][0]);
            }

            // load the data
            this.data( data );
        });
    });

});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var UF = window.multigraph.util.namespace("window.multigraph.utilityFunctions");

    /**
     * An iterator for stepping through data values stored in a linked list of
     * WebServiceDataCacheNodes.  The constructor takes 5 arguments:
     * 
     * @param {Array} columnIndices:
     *     JavaScript array of the indices of the columns
     *     of data to return
     * @param {WebServiceDataCacheNode} initialNode: 
     *     Pointer to the WebServiceDataCacheNode containing the first
     *     value to iterate over
     * @param {integer} initialIndex: 
     *     Index, within initialNode, of the first value to iterate over
     * @param {WebServiceDataCacheNode} finalNode: 
     *     Pointer to the WebServiceDataCacheNode containing the last
     *     value to iterate over
     * @param {integer} finalIndex: 
     *     Index, within finalNode, of the last value to iterate over
     */
    ns.WebServiceDataIterator = window.jermaine.Model(function () {
        var WebServiceDataIterator = this;

        this.hasA("currentNode").which.validatesWith(function(x) {
            return x instanceof ns.WebServiceDataCacheNode;
        });
        this.hasA("currentIndex").which.isA("integer");
        this.hasA("columnIndices").which.validatesWith(function(x) {
            return UF.typeOf(x) === "array";
        });
    
        this.hasA("initialNode").which.validatesWith(function(x) {
            return x instanceof ns.WebServiceDataCacheNode;
        });
        this.hasA("finalNode").which.validatesWith(function(x) {
            return x instanceof ns.WebServiceDataCacheNode;
        });
        this.hasA("initialIndex").which.isA("integer");
        this.hasA("finalIndex").which.isA("integer");

        this.isBuiltWith("columnIndices", "initialNode", "initialIndex", "finalNode", "finalIndex", function() {
            this.currentNode(this.initialNode());
            this.currentIndex(this.initialIndex());
        });

        this.respondsTo("hasNext", function() {
            if (this.currentNode() === null || this.currentIndex() < 0) { return false; }
            if (this.currentNode() !== this.finalNode()) {
                return true;
            }
            return this.currentIndex() <= this.finalIndex();
        });

        this.respondsTo("next", function() {
            var vals = [],
                columnIndices = this.columnIndices(),
                currentIndex = this.currentIndex(),
                finalIndex = this.finalIndex(),
                currentNode = this.currentNode(),
                i;

            if (currentNode === this.finalNode()) {
                if (currentIndex > finalIndex) { return null; }
                for (i=0; i<columnIndices.length; ++i) {
                    vals.push(currentNode.data()[currentIndex][columnIndices[i]]);
                }
                this.currentIndex(++currentIndex);
                return vals;
            } else {
                for (i=0; i<columnIndices.length; ++i) {
                    vals.push(currentNode.data()[currentIndex][columnIndices[i]]);
                }
                this.currentIndex(++currentIndex);
                if (currentIndex >= currentNode.data().length) {
                    this.currentNode(currentNode.dataNext());
                    this.currentIndex(0);
                }
                return vals;
            }
        });

    });

});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
        attributes = window.multigraph.utilityFunctions.getKeys(defaultValues.window),
        Window = new window.jermaine.Model( "Window", function () {

            this.hasA("width").which.isA("integer");

            this.hasA("height").which.isA("integer");

            this.hasA("border").which.isA("integer").and.defaultsTo(defaultValues.window.border);

            this.hasA("margin").which.validatesWith(function (margin) {
                return margin instanceof window.multigraph.math.Insets;
            }); // defaultTo temporarily handled in isBuiltWith below

            this.hasA("padding").which.validatesWith(function (padding) {
                return padding instanceof window.multigraph.math.Insets;
            }); // defaultTo temporarily handled in isBuiltWith below

            this.hasA("bordercolor").which.validatesWith(function (bordercolor) {
                return bordercolor instanceof window.multigraph.math.RGBColor;
            }).defaultsTo(window.multigraph.math.RGBColor.parse(defaultValues.window.bordercolor));

            this.isBuiltWith(function () {
                // temporary workaround until we can pass a function to be evaled to defaultsTo():
                this.margin( defaultValues.window.margin() );
                this.padding( defaultValues.window.padding() );
            });

        });

    ns.Window = Window;
});
window.multigraph.util.namespace("window.multigraph.core", function (ns) {
    "use strict";

    var defaultValues = window.multigraph.utilityFunctions.getDefaultValuesFromXSD(),
        attributes = window.multigraph.utilityFunctions.getKeys(defaultValues.horizontalaxis.zoom),
        Zoom = new window.jermaine.Model( "Zoom", function () {

            this.hasA("allowed").which.isA("boolean");
            this.hasA("min").which.validatesWith(function (min) {
                return ns.DataMeasure.isInstance(min);
            });
            this.hasA("max").which.validatesWith(function (max) {
                return ns.DataMeasure.isInstance(max);
            });
            this.hasA("anchor").which.validatesWith(function (anchor) {
                return ns.DataValue.isInstance(anchor) || anchor === null;
            });

            window.multigraph.utilityFunctions.insertDefaults(this, defaultValues.horizontalaxis.zoom, attributes);
        });

    ns.Zoom = Zoom;

});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    ns.mixin = new window.multigraph.core.Mixin();

});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    var ArrayData  = window.multigraph.core.ArrayData;

    ns.mixin.add(function (ns, parse, serialize) {
        
        ArrayData.prototype[serialize+'Contents'] = function () {
            var output = '<values>',
                i, j,
                array = this.array(),
                row;

            for (i=0; i<array.length; ++i) {
                if (i>0) {
                    output += '\n';
                }
                row = array[i];
                for (j=0; j<row.length; ++j) {
                    if (j > 0) {
                        output += ',';
                    }
                    output += row[j].toString();
                }
            }
            output += '</values>';
            return output;
        };

    });
});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    ns.mixin.add(function (ns, parse, serialize) {


        var parseLabels = function (xml, axis) {
            var spacingStrings = [],
                labelers = axis.labelers(),
                i,
                j;
            if (window.multigraph.jQuery.trim(xml.find("labels").attr("spacing"))!=="") {
                spacingStrings = window.multigraph.jQuery.trim(xml.find("labels").attr("spacing")).split(/\s+/);
            }
            if (spacingStrings.length > 0) {
                // If there was a spacing attr on the <labels> tag, create a new labeler for
                // each spacing present in it, using the other values from the <labels> tag
                for (i=0; i<spacingStrings.length; ++i) {
                    //labelers.push(ns.core.Labeler[parse](xml.find("labels"), axis, undefined, spacingStrings[i]));
                    labelers.add(ns.core.Labeler[parse](xml.find("labels"), axis, undefined, spacingStrings[i]));
                }
            } else {
                // Otherwise, parse the <labels> tag to get default values
                var defaults = ns.core.Labeler[parse](xml.find("labels"), axis, undefined, null);
                // And loop over each <label> tag, creating labelers for each, splitting multiple
                // spacings on the same <label> tag into multiple labelers:
                window.multigraph.jQuery.each(xml.find("label"), function (j, e) {
                    spacingStrings = [];
                    if (window.multigraph.jQuery.trim(window.multigraph.jQuery(e).attr("spacing"))!=="") {
                        spacingStrings = window.multigraph.jQuery.trim(window.multigraph.jQuery(e).attr("spacing")).split(/\s+/);
                    }
                    for (i=0; i<spacingStrings.length; ++i) {
                        //labelers.push( ns.core.Labeler[parse](window.multigraph.jQuery(e), axis, defaults, spacingStrings[i]) );
                        labelers.add( ns.core.Labeler[parse](window.multigraph.jQuery(e), axis, defaults, spacingStrings[i]) );
                    }
                });
            }
        };

        
        ns.core.Axis[parse] = function (xml, orientation) {

            var axis = new ns.core.Axis(orientation),
                i,
                j;

            if (xml) {

                axis.id(xml.attr("id"));
                if (xml.attr("type")) {
                    axis.type(ns.core.DataValue.parseType(xml.attr("type")));
                }
                axis.length(window.multigraph.math.Displacement.parse(xml.attr("length")));
                if (xml.attr("position")) {
                    axis.position(window.multigraph.math.Point.parse(xml.attr("position")));
                }
                if (xml.attr("pregap") !== undefined) {
                    axis.pregap(parseFloat(xml.attr("pregap")));
                }
                if (xml.attr("postgap") !== undefined) {
                    axis.postgap(parseFloat(xml.attr("postgap")));
                }
                if (xml.attr("anchor")) {
                    axis.anchor(parseFloat(xml.attr("anchor")));
                }
                if (xml.attr("base")) {
                    axis.base(window.multigraph.math.Point.parse(xml.attr("base")));
                }
                if (xml.attr("minposition") !== undefined) {
                    axis.minposition(window.multigraph.math.Displacement.parse(xml.attr("minposition")));
                }
                if (xml.attr("maxposition") !== undefined) {
                    axis.maxposition(window.multigraph.math.Displacement.parse(xml.attr("maxposition")));
                }
                axis.min(xml.attr("min"));
                if (axis.min() !== "auto") {
                    axis.dataMin(ns.core.DataValue.parse(axis.type(), axis.min()));
                }
                if (xml.attr("minoffset") !== undefined) {
                    axis.minoffset(parseFloat(xml.attr("minoffset")));
                }
                axis.max(xml.attr("max"));
                if (axis.max() !== "auto") {
                    axis.dataMax(ns.core.DataValue.parse(axis.type(), axis.max()));
                }
                if (xml.attr("maxoffset") !== undefined) {
                    axis.maxoffset(parseFloat(xml.attr("maxoffset")));
                }
                axis.positionbase(xml.attr("positionbase"));
                axis.color(window.multigraph.math.RGBColor.parse(xml.attr("color")));
                if (xml.attr("tickmin") !== undefined) {
                    axis.tickmin(parseInt(xml.attr("tickmin"), 10));
                }
                if (xml.attr("tickmax") !== undefined) {
                    axis.tickmax(parseInt(xml.attr("tickmax"), 10));
                }
                axis.highlightstyle(xml.attr("highlightstyle"));
                if (xml.attr("linewidth") !== undefined) {
                    axis.linewidth(parseInt(xml.attr("linewidth"), 10));
                }

                if (xml.find("title").length > 0)        { axis.title(ns.core.AxisTitle[parse](xml.find("title")));                  }
                if (xml.find("grid").length > 0)         { axis.grid(ns.core.Grid[parse](xml.find("grid")));                         }
                if (xml.find("pan").length > 0)          { axis.pan(ns.core.Pan[parse](xml.find("pan"), axis.type()));               }
                if (xml.find("zoom").length > 0)         { axis.zoom(ns.core.Zoom[parse](xml.find("zoom"), axis.type()));            }
                if (xml.find("binding").length > 0)      { axis.binding(ns.core.Binding[parse](xml.find("binding")));                }
                if (xml.find("labels").length > 0)       { parseLabels(xml, axis);                                                   }


            }
            return axis;
        };

        var serializeLabels = function (axis, serialize) {

            var labelers = axis.labelers(),
                nlabelers = axis.labelers().size();

            // if this axis has no labelers, output nothing
            if (nlabelers <= 0) { return ""; }

            // if all the Labelers are equal except for spacing, output a single <labels> tag
            var singleLabels = true;
            var i = 1;
            var spacings = [ labelers.at(0).spacing() ];
            while (singleLabels && i<nlabelers) {
                spacings.push(labelers.at(i).spacing());
                singleLabels = labelers.at(0).isEqualExceptForSpacing(labelers.at(i));
                ++i;
            }
            if (singleLabels) {
                return labelers.at(0)[serialize](spacings.join(" "), "labels");
            }
            // otherwise, serialize each individual labeler as a <label> tag,
            // collapsing together consecutive ones that are equal except for
            // spacing:
            var labeltags = [];
            spacings = [];
            for (i = 0; i < nlabelers; ++i) {
                // save the current spacing into the spacings array
                spacings.push(labelers.at(i).spacing().toString());
                if ((i >= nlabelers-1) || !labelers.at(i).isEqualExceptForSpacing(labelers.at(i+1))) {
                    // if this labeler's spacing is not the same as the next one in the list,
                    // output this abeler, with the current set of spacings, and reset the
                    // spacings array
                    labeltags.push( labelers.at(i).serialize( spacings.join(" ") ) );
                    spacings = [];
                }
            }
            return "<labels>" + labeltags.join("") + "</labels>";
        };
        
        ns.core.Axis.prototype[serialize] = function () {
            var attributeStrings = [],
                childStrings,
                output = '<' + this.orientation() + 'axis ';

            if (this.color() !== undefined)          { attributeStrings.push('color="'           + this.color().getHexString()     + '"'); }
            if (this.id() !== undefined)             { attributeStrings.push('id="'              + this.id()                       + '"'); }
            if (this.type() !== undefined)           { attributeStrings.push('type="'            + this.type()                     + '"'); }
            if (this.pregap() !== undefined)         { attributeStrings.push('pregap="'          + this.pregap()                   + '"'); }
            if (this.postgap() !== undefined)        { attributeStrings.push('postgap="'         + this.postgap()                  + '"'); }
            if (this.anchor() !== undefined)         { attributeStrings.push('anchor="'          + this.anchor()                   + '"'); }
            if (this.min() !== undefined)            { attributeStrings.push('min="'             + this.min()                      + '"'); }
            if (this.minoffset() !== undefined)      { attributeStrings.push('minoffset="'       + this.minoffset()                + '"'); }
            if (this.max() !== undefined)            { attributeStrings.push('max="'             + this.max()                      + '"'); }
            if (this.maxoffset() !== undefined)      { attributeStrings.push('maxoffset="'       + this.maxoffset()                + '"'); }
            if (this.positionbase() !== undefined)   { attributeStrings.push('positionbase="'    + this.positionbase()             + '"'); }
            if (this.tickmin() !== undefined)        { attributeStrings.push('tickmin="'         + this.tickmin()                  + '"'); }
            if (this.tickmax() !== undefined)        { attributeStrings.push('tickmax="'         + this.tickmax()                  + '"'); }
            if (this.highlightstyle() !== undefined) { attributeStrings.push('highlightstyle="'  + this.highlightstyle()           + '"'); }
            if (this.linewidth() !== undefined)      { attributeStrings.push('linewidth="'       + this.linewidth()                + '"'); }
            if (this.length() !== undefined)         { attributeStrings.push('length="'          + this.length().serialize()       + '"'); }
            if (this.position() !== undefined)       { attributeStrings.push('position="'        + this.position().serialize()     + '"'); }
            if (this.base() !== undefined)           { attributeStrings.push('base="'            + this.base().serialize()         + '"'); }
            if (this.minposition() !== undefined)    { attributeStrings.push('minposition="'     + this.minposition().serialize()  + '"'); }
            if (this.maxposition() !== undefined)    { attributeStrings.push('maxposition="'     + this.maxposition().serialize()  + '"'); }

            output += attributeStrings.join(' ');

            childStrings = [];
            if (this.title())             { childStrings.push(this.title()[serialize]());        }
            if (this.labelers().size()>0) { childStrings.push(serializeLabels(this, serialize)); }
            if (this.grid())              { childStrings.push(this.grid()[serialize]());         }

            if (this.pan()) {
                // only serialize the pan subobject if it differs from the default
                if (!this.pan().allowed() ||
                    (this.pan().min() !== undefined) ||
                    (this.pan().max() !== undefined)) {
                    childStrings.push(this.pan()[serialize]());
                }
            }

            if (this.zoom()) {
                // only serialize the zoom subobject if it differs from the default
                if (!this.zoom().allowed() ||
                    (this.zoom().anchor() !== undefined) ||
                    (this.zoom().min() !== undefined) ||
                    (this.zoom().max() !== undefined)) {
                childStrings.push(this.zoom()[serialize]());
                }
            }

            if (this.binding())           { childStrings.push(this.binding()[serialize]());      }


            if (childStrings.length > 0) {
                output += '>' + childStrings.join('') + '</' + this.orientation() + 'axis>';
            } else {
                output += '/>';
            }

            return output;
        };

    });
});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    var scalarAttributes = ["angle"];

    ns.mixin.add(function (ns, parse, serialize) {
        
        ns.core.AxisTitle[parse] = function (xml) {
            var title = new ns.core.AxisTitle();
            if (xml) {
                title.content(xml.text());
                if (xml.attr("anchor") !== undefined) {
                    title.anchor(window.multigraph.math.Point.parse(xml.attr("anchor")));
                }
                if (xml.attr("position") !== undefined) {
                    title.position(window.multigraph.math.Point.parse(xml.attr("position")));
                }
                if (xml.attr("angle") !== undefined) {
                    title.angle(parseFloat(xml.attr("angle")));
                }
            }
            return title;
        };
        
        ns.core.AxisTitle.prototype[serialize] = function () {
            var attributeStrings = [],
                output = '<title ';

            attributeStrings = window.multigraph.utilityFunctions.serializeScalarAttributes(this, scalarAttributes, attributeStrings);

            if (this.anchor() !== undefined) {
                attributeStrings.push('anchor="' + this.anchor().serialize() + '"');
            }
            if (this.position() !== undefined) {
                attributeStrings.push('position="' + this.position().serialize() + '"');
            }

            output += attributeStrings.join(' ');

            if (this.content() !== undefined && this.content() !== '') {
                output += '>' + this.content() + '</title>';
            } else {
                output += '/>';
            }

            return output;
        };

    });
});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    ns.mixin.add(function (ns, parse, serialize) {

        ns.core.Background[parse] = function (xml) {
            var background = new ns.core.Background();
            if (xml) {
                background.color(ns.math.RGBColor.parse(xml.attr("color")));
                if (xml.find("img").length > 0) {
                    background.img(ns.core.Img[parse](xml.find("img")));
                }
            }
            return background;
        };

        ns.core.Background.prototype[serialize] = function () {
            var attributeStrings = [],
                output = '<background ';

            if (this.color() !== undefined) {
                attributeStrings.push('color="' + this.color().getHexString() + '"');
            }

            output += attributeStrings.join(' ');
            if (this.img()) {
                output += '>' + this.img()[serialize]() + '</background>';
            } else {
                output += '/>';
            }
            return output;
        };

    });
});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    var scalarAttributes = ["id", "min", "max"];

    ns.mixin.add(function (ns, parse, serialize) {
        
        ns.core.Binding[parse] = function (xml) {
            var binding;
            if (xml && xml.attr("id") !== undefined && xml.attr("min") !== undefined && xml.attr("max") !== undefined) {
                binding = new ns.core.Binding(xml.attr("id"), xml.attr("min"), xml.attr("max"));
            }
            return binding;
        };
        
        ns.core.Binding.prototype[serialize] = function () {
            var attributeStrings = [],
                output = '<binding ';

            attributeStrings = window.multigraph.utilityFunctions.serializeScalarAttributes(this, scalarAttributes, attributeStrings);

            output += attributeStrings.join(' ') + '/>';

            return output;
        };

    });
});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    var CSVData  = window.multigraph.core.CSVData;

    ns.mixin.add(function (ns, parse, serialize) {
        
        CSVData.prototype[serialize+'Contents'] = function () {
            var output = '<csv location="';
            output += this.filename();
            output += '"/>';
            return output;
        };

    });
});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    var DataVariable = window.multigraph.core.DataVariable,
        NumberValue  = window.multigraph.core.NumberValue,
        ArrayData  = window.multigraph.core.ArrayData,
        CSVData  = window.multigraph.core.CSVData,
        WebServiceData  = window.multigraph.core.WebServiceData,
        Data = window.multigraph.core.Data;

    ns.mixin.add(function (ns, parse, serialize) {
        
        Data[parse] = function (xml) {

            var variables_xml,
                values_xml,
//                default_missingvalue_string,
//                default_missingop_string,
                dataVariables = [],
                data = { 'dummy' : 'foo' };

            if (xml) {

                // parse the <variables> section
                variables_xml = xml.find("variables");
                data.defaultMissingvalueString = variables_xml.attr("missingvalue");
                data.defaultMissingopString = variables_xml.attr("missingop");

                if (variables_xml.find(">variable").length > 0) {
                    window.multigraph.jQuery.each(variables_xml.find(">variable"), function (i,e) {
                        dataVariables.push( ns.core.DataVariable[parse](window.multigraph.jQuery(e)) );
                    });
                }

                // if we have a <values> section, parse it and return an ArrayData instance:
                values_xml = window.multigraph.jQuery(xml.find(">values"));
                if (values_xml.length > 0 && dataVariables) {
                    values_xml = values_xml[0];
                    var dataValues = ArrayData.textToDataValuesArray(dataVariables, window.multigraph.jQuery(values_xml).text());
                    var values = new ArrayData(dataVariables, dataValues);
                    if (data.defaultMissingvalueString !== undefined) {
                        values.defaultMissingvalue(data.defaultMissingvalueString);
                    }
                    if (data.defaultMissingopString !== undefined) {
                        values.defaultMissingop(xml.attr("missingop"));
                    }
                    return values;
                }

                // if we have a <csv> section, parse it and return a CSVData instance:
                var csv_xml = window.multigraph.jQuery(xml.find(">csv"));
                if (csv_xml.length > 0 && dataVariables) {
                    csv_xml = csv_xml[0];
                    var filename = window.multigraph.jQuery(csv_xml).attr("location");
                    var csv = new CSVData(dataVariables, filename);
                    if (data.defaultMissingvalueString !== undefined) {
                        csv.defaultMissingvalue(data.defaultMissingvalueString);
                    }
                    if (data.defaultMissingopString !== undefined) {
                        csv.defaultMissingop(xml.attr("missingop"));
                    }
                    return csv;
                }

                // if we have a <service> section, parse it and return a WebServiceData instance:
                var service_xml = window.multigraph.jQuery(xml.find(">service"));
                if (service_xml.length > 0 && dataVariables) {
                    service_xml = service_xml[0];
                    var location = window.multigraph.jQuery(service_xml).attr("location");
                    var wsd = new WebServiceData(dataVariables, location);
                    var format = window.multigraph.jQuery(service_xml).attr("format");
                    if (format) {
                        wsd.format(format);
                    }
                    if (data.defaultMissingvalueString !== undefined) {
                        wsd.defaultMissingvalue(data.defaultMissingvalueString);
                    }
                    if (data.defaultMissingopString !== undefined) {
                        wsd.defaultMissingop(xml.attr("missingop"));
                    }
                    return wsd;
                }
            }
            return data;
        };
        
        Data.prototype[serialize] = function () {
            var output = '<data>',
                i;

            // serialize the <variables> section
            output += '<variables>';
            for (i=0; i<this.columns().size(); ++i) {
                output += this.columns().at(i).serialize();
            }
            output += '</variables>';

            // serialize the rest...
            output += this[serialize+"Contents"]();

            output += '</data>';
            return output;
        };

    });
});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    var DataValue = window.multigraph.core.DataValue;

    ns.mixin.add(function (ns, parse, serialize) {
        
        ns.core.DataVariable[parse] = function (xml, data) {
            var variable;
            if (xml && xml.attr("id")) {
                variable = new ns.core.DataVariable(xml.attr("id"));
                if (xml.attr("column")) {
                    variable.column(parseInt(xml.attr("column"), 10));
                }
                if (xml.attr("type")) {
                    variable.type(DataValue.parseType(xml.attr("type")));
                }
                if (xml.attr("missingvalue")) {
                    variable.missingvalue(DataValue.parse(variable.type(), xml.attr("missingvalue")));
                }
                if (xml.attr("missingop")) {
                    variable.missingop(DataValue.parseComparator(xml.attr("missingop")));
                }
            }
            return variable;
        };
        
        ns.core.DataVariable.prototype[serialize] = function () {
            var output = '<variable';

            output += ' id="' + this.id() + '"';
            output += ' column="' + this.column() + '"';
            output += ' type="' + DataValue.serializeType(this.type()) + '"';
            if (this.missingvalue() !== null && this.missingvalue() !== undefined) {
                output += ' missingvalue="' + this.missingvalue().toString() + '"';
            }
            if (this.missingop() !== null && this.missingop() !== undefined) {
                output += ' missingop="' + this.missingop() + '"';
            }
            output += '/>';

            return output;
        };

    });
});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    var scalarAttributes = ["format", "bgalpha", "border", "pad"],
        Variable = window.multigraph.core.DatatipsVariable;

    ns.mixin.add(function (ns, parse, serialize) {

        ns.core.Datatips[parse] = function (xml) {
            var datatips = new ns.core.Datatips();
            if (xml) {
                if (xml.find("variable").length > 0) {
                    window.multigraph.jQuery.each(xml.find("variable"), function (i, e) {
                        datatips.variables().add( ns.core.DatatipsVariable[parse](window.multigraph.jQuery(e)) );
                    });
                }
                datatips.format(xml.attr("format"));
                datatips.bgcolor(window.multigraph.math.RGBColor.parse(xml.attr("bgcolor")));
                datatips.bgalpha(xml.attr("bgalpha"));
                if (xml.attr("border") !== undefined) {
                    datatips.border(parseInt(xml.attr("border"), 10));
                }
                datatips.bordercolor(window.multigraph.math.RGBColor.parse(xml.attr("bordercolor")));
                if (xml.attr("pad") !== undefined) {
                    datatips.pad(parseInt(xml.attr("pad"), 10));
                }

            }
            return datatips;
        };

        ns.core.Datatips.prototype[serialize] = function () {
            var attributeStrings = [],
                output = '<datatips ',
                i;

            if (this.bgcolor() !== undefined) {
                attributeStrings.push('bgcolor="' + this.bgcolor().getHexString() + '"');
            }

            if (this.bordercolor() !== undefined) {
                attributeStrings.push('bordercolor="' + this.bordercolor().getHexString() + '"');
            }

            attributeStrings = window.multigraph.utilityFunctions.serializeScalarAttributes(this, scalarAttributes, attributeStrings);

            output += attributeStrings.join(' ');

            if (this.variables().size() !== 0) {
                output += '>';
                for (i = 0; i < this.variables().size(); i++) {
                    output += this.variables().at(i)[serialize]();
                }
                output += '</datatips>';
            } else {
                output += '/>';
            }
            return output;
        };

    });
});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    var scalarAttributes = ["format"];

    ns.mixin.add(function (ns, parse, serialize) {
        
        ns.core.DatatipsVariable[parse] = function (xml) {
            var variable = new ns.core.DatatipsVariable();
            if (xml) {
                variable.format(xml.attr("format"));
            }
            return variable;
        };
        
        ns.core.DatatipsVariable.prototype[serialize] = function () {
            var attributeStrings = [],
                output = '<variable ';

            attributeStrings = window.multigraph.utilityFunctions.serializeScalarAttributes(this, scalarAttributes, attributeStrings);

            output += attributeStrings.join(' ') + '/>';

            return output;
        };

    });
});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    var scalarAttributes = ["type"];

    ns.mixin.add(function (ns, parse, serialize) {

        ns.core.Filter[parse] = function (xml) {
            var filter = new ns.core.Filter();
            if (xml) {
                if (xml.find("option").length > 0) {
                    window.multigraph.jQuery.each(xml.find(">option"), function (i, e) {
                        filter.options().add( ns.core.FilterOption[parse](window.multigraph.jQuery(e)) );
                    });
                }
                filter.type(xml.attr("type"));
            }
            return filter;
        };

        ns.core.Filter.prototype[serialize] = function () {
            var attributeStrings = [],
                output = '<filter ',
                i;

            attributeStrings = window.multigraph.utilityFunctions.serializeScalarAttributes(this, scalarAttributes, attributeStrings);

            output += attributeStrings.join(' ');

            if (this.options().size() !== 0) {
                output += '>';
                for (i = 0; i < this.options().size(); i++) {
                    output += this.options().at(i)[serialize]();
                }
                output += '</filter>';
            } else {
                output += '/>';
            }
            return output;
        };

    });
});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    var scalarAttributes = ["name", "value"];

    ns.mixin.add(function (ns, parse, serialize) {
        
        ns.core.FilterOption[parse] = function (xml) {
            var option = new ns.core.FilterOption();
            if (xml) {
                option.name(xml.attr("name"));
                option.value(xml.attr("value") === "" ? undefined : xml.attr("value"));
            }
            return option;
        };
        
        ns.core.FilterOption.prototype[serialize] = function () {
            var attributeStrings = [],
                output = '<option ';

            attributeStrings = window.multigraph.utilityFunctions.serializeScalarAttributes(this, scalarAttributes, attributeStrings);

            output += attributeStrings.join(' ') + '/>';

            return output;
        };

    });
});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    ns.mixin.add(function (ns, parse, serialize) {

        ns.core.Graph[parse] = function (xml) {
            var graph = new ns.core.Graph();
            if (xml) {
                // NOTE: 'OBJ.find(">TAG")' returns a list of JQuery objects corresponding to the immediate
                // (1st generation) child nodes of OBJ corresponding to xml tag TAG
                if (xml.find(">window").length > 0) {
                    graph.window( ns.core.Window[parse](xml.find(">window")) );
                } else {
                    graph.window( ns.core.Window[parse]() );
                }

                if (xml.find(">legend").length > 0) {
                    graph.legend( ns.core.Legend[parse](xml.find(">legend")) );
                } else {
                    graph.legend( ns.core.Legend[parse]() );
                }
                if (xml.find(">background").length > 0) {
                    graph.background( ns.core.Background[parse](xml.find(">background")) );
                }
                if (xml.find(">plotarea").length > 0) {
                    graph.plotarea( ns.core.Plotarea[parse](xml.find(">plotarea")) );
                }
                if (xml.find(">title").length > 0) {
                    graph.title( ns.core.Title[parse](xml.find(">title")) );
                }
                window.multigraph.jQuery.each(xml.find(">horizontalaxis"), function (i,e) {
                    graph.axes().add( ns.core.Axis[parse](window.multigraph.jQuery(e), ns.core.Axis.HORIZONTAL) );
                });
                window.multigraph.jQuery.each(xml.find(">verticalaxis"), function (i,e) {
                    graph.axes().add( ns.core.Axis[parse](window.multigraph.jQuery(e), ns.core.Axis.VERTICAL) );
                });
                window.multigraph.jQuery.each(xml.find(">data"), function (i,e) {
                    graph.data().add( ns.core.Data[parse](window.multigraph.jQuery(e)) );
                });
                window.multigraph.jQuery.each(xml.find(">plot"), function (i,e) {
                    graph.plots().add( ns.core.Plot[parse](window.multigraph.jQuery(e), graph) );
                });
                graph.postParse();
            }
            return graph;
        };

        ns.core.Graph.prototype[serialize] = function () {
            var xmlstring = '<graph>',
                i;
            if (this.window()) {
                xmlstring += this.window()[serialize]();
            }
            if (this.legend()) {
                xmlstring += this.legend()[serialize]();
            }
            if (this.background()) {
                xmlstring += this.background()[serialize]();
            }
            if (this.plotarea()) {
                xmlstring += this.plotarea()[serialize]();
            }
            if (this.title()) {
                xmlstring += this.title()[serialize]();
            }
            for (i = 0; i < this.axes().size(); ++i) {
                xmlstring += this.axes().at(i)[serialize]();
            }
            for (i = 0; i < this.plots().size(); ++i) {
                xmlstring += this.plots().at(i)[serialize]();
            }
            for (i = 0; i < this.data().size(); ++i) {
                xmlstring += this.data().at(i)[serialize]();
            }

            xmlstring += "</graph>";
            return xmlstring;
        };

    });

});

window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    var scalarAttributes = ["border", "opacity", "padding", "cornerradius"];

    ns.mixin.add(function (ns, parse, serialize) {
        
        ns.core.Title[parse] = function (xml) {
            var title = new ns.core.Title();
            if (xml) {
                title.content(xml.text());
                title.border(xml.attr("border"));
                title.color(window.multigraph.math.RGBColor.parse(xml.attr("color")));
                title.bordercolor(window.multigraph.math.RGBColor.parse(xml.attr("bordercolor")));
                if (xml.attr("opacity") !== undefined) {
                    title.opacity(parseFloat(xml.attr("opacity")));
                }
                title.padding(xml.attr("padding"));
                title.cornerradius(xml.attr("cornerradius"));
                if (xml.attr("anchor") !== undefined) {
                    title.anchor(window.multigraph.math.Point.parse(xml.attr("anchor")));
                }
                if (xml.attr("base") !== undefined) {
                    title.base(window.multigraph.math.Point.parse(xml.attr("base")));
                }
                if (xml.attr("position") !== undefined) {
                    title.position(window.multigraph.math.Point.parse(xml.attr("position")));
                }
            }
            return title;
        };

        ns.core.Title.prototype[serialize] = function () {
            var attributeStrings = [],
                output = '<title ';

            if (this.color() !== undefined) {
                attributeStrings.push('color="' + this.color().getHexString() + '"');
            }

            if (this.bordercolor() !== undefined) {
                attributeStrings.push('bordercolor="' + this.bordercolor().getHexString() + '"');
            }

            attributeStrings = window.multigraph.utilityFunctions.serializeScalarAttributes(this, scalarAttributes, attributeStrings);

            if (this.anchor() !== undefined) {
                attributeStrings.push('anchor="' + this.anchor().serialize() + '"');
            }
            if (this.base() !== undefined) {
                attributeStrings.push('base="' + this.base().serialize() + '"');
            }
            if (this.position() !== undefined) {
                attributeStrings.push('position="' + this.position().serialize() + '"');
            }

            output += attributeStrings.join(' ');

            if (this.content() !== undefined && this.content() !== '') {
                output += '>' + this.content() + '</title>';
            } else {
                output += '/>';
            }

            return output;
        };

    });
});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    var scalarAttributes = ["visible"];

    ns.mixin.add(function (ns, parse, serialize) {
        
        ns.core.Grid[parse] = function (xml) {
            var grid = new ns.core.Grid();
            if (xml) {
                grid.color(ns.math.RGBColor.parse(xml.attr("color")));
                //NOTE: visible attribute should default to true when parsing, so that
                //      the presence of a <grid> tag at all will turn on a grid.  In
                //      the Grid object itself, though, the default for the visible
                //      attribute is false, so that when we create a default grid object
                //      in code (as opposed to parsing), it defaults to not visible.
                if ((xml.attr("visible") === "true") || (xml.attr("visible") === undefined)) {
                    grid.visible(true);
                } else {
                    grid.visible(false);
                }
            }
            return grid;
        };
        
        ns.core.Grid.prototype[serialize] = function () {
            var attributeStrings = [],
                output = '<grid ';

            if (this.color() !== undefined) {
                attributeStrings.push('color="' + this.color().getHexString() + '"');
            }

            attributeStrings = window.multigraph.utilityFunctions.serializeScalarAttributes(this, scalarAttributes, attributeStrings);

            output += attributeStrings.join(' ') + '/>';

            return output;
        };

    });
});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    var scalarAttributes = ["height", "width", "border"];

    ns.mixin.add(function (ns, parse, serialize) {
        
        ns.core.Icon[parse] = function (xml) {
            var icon = new ns.core.Icon();
            if (xml) {
                if (xml.attr("height") !== undefined) {
                    icon.height(parseInt(xml.attr("height"), 10));
                }
                if (xml.attr("width") !== undefined) {
                    icon.width(parseInt(xml.attr("width"), 10));
                }
                if (xml.attr("border") !== undefined) {
                    icon.border(parseInt(xml.attr("border"), 10));
                }
            }
            return icon;
        };
        
        ns.core.Icon.prototype[serialize] = function () {
            var attributeStrings = [],
                output = '<icon ';

            attributeStrings = window.multigraph.utilityFunctions.serializeScalarAttributes(this, scalarAttributes, attributeStrings);

            output += attributeStrings.join(' ') + '/>';

            return output;
        };

    });
});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    var scalarAttributes = ["src", "frame"];

    ns.mixin.add(function (ns, parse, serialize) {
        
        ns.core.Img[parse] = function (xml) {
            var img;
            if (xml && xml.attr("src") !== undefined) {
                img = new ns.core.Img(xml.attr("src"));
                if (xml.attr("anchor") !== undefined) {
                    img.anchor(window.multigraph.math.Point.parse(xml.attr("anchor")));
                }
                if (xml.attr("base") !== undefined) {
                    img.base(window.multigraph.math.Point.parse(xml.attr("base")));
                }
                if (xml.attr("position") !== undefined) {
                    img.position(window.multigraph.math.Point.parse(xml.attr("position")));
                }
                if (xml.attr("frame") !== undefined) {
                    img.frame(xml.attr("frame").toLowerCase());
                }
            }
            return img;
        };
        
        ns.core.Img.prototype[serialize] = function () {
            var attributeStrings = [],
                output = '<img ';

            attributeStrings = window.multigraph.utilityFunctions.serializeScalarAttributes(this, scalarAttributes, attributeStrings);
            if (this.anchor() !== undefined) {
                attributeStrings.push('anchor="' + this.anchor().serialize() + '"');
            }
            if (this.base() !== undefined) {
                attributeStrings.push('base="' + this.base().serialize() + '"');
            }
            if (this.position() !== undefined) {
                attributeStrings.push('position="' + this.position().serialize() + '"');
            }
            output += attributeStrings.join(' ') + '/>';

            return output;
        };

    });
});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    ns.mixin.add(function (ns, parse, serialize) {

        
        ns.core.Labeler[parse] = function (xml, axis, defaults, spacing) {
            // This parser takes an optional final argument, spacing, which is a string representing
            // the spacing to be parsed for the labeler.  If that argument is not present, the spacing
            // value is taken from the xml object.  If a spacing argument is present, it is parsed
            // and used to set the spacing attribute of the Labeler object, and in this case, any
            // spacing value present in the xml is ignored.
            //
            // If the spacing argument has the value null, the resulting labeler will have no spacing
            // attribute set at all.
            var labeler;
            if (xml) {
                labeler = new ns.core.Labeler(axis);
                if (spacing !== null) {
                    if (spacing === undefined) {
                        spacing = xml.attr("spacing");
                    }
                    //NOTE: spacing might still === undefined at this point
                    if (spacing !== undefined) {
                        labeler.spacing(ns.core.DataMeasure.parse(axis.type(), spacing));
                    } else if (defaults !== undefined) {
                        labeler.spacing(defaults.spacing());
                    }
                }
                if (xml.attr("format") !== undefined) {
                    labeler.formatter(ns.core.DataFormatter.create(axis.type(), xml.attr("format")));
                } else if (defaults !== undefined) {
                    labeler.formatter(defaults.formatter());
                }
                if (xml.attr("start") !== undefined) {
                    labeler.start(ns.core.DataValue.parse(axis.type(), xml.attr("start")));
                } else if (defaults !== undefined) {
                    labeler.start(defaults.start());
                }
                if (xml.attr("angle") !== undefined) {
                    labeler.angle(parseFloat(xml.attr("angle")));
                } else if (defaults !== undefined) {
                    labeler.angle(defaults.angle());
                }
                if (xml.attr("position") !== undefined) { 
                    labeler.position(ns.math.Point.parse(xml.attr("position")));
                } else if (defaults !== undefined) {
                    labeler.position(defaults.position());
                }
                if (xml.attr("anchor") !== undefined) {
                    labeler.anchor(ns.math.Point.parse(xml.attr("anchor")));
                } else if (defaults !== undefined) {
                    labeler.anchor(defaults.anchor());
                }
                if (xml.attr("densityfactor") !== undefined) {
                    labeler.densityfactor(parseFloat(xml.attr("densityfactor")));
                } else if (defaults !== undefined) {
                    labeler.densityfactor(defaults.densityfactor());
                }
            }
            return labeler;
        };

/*
        ns.core.Labeler[parse] = function (xml, axis, labels) {
            var labeler;
            if (xml && xml.attr("spacing") !== undefined) {
                labeler = new ns.core.Labeler(axis);
                labeler.spacing(xml.attr("spacing"));
                if (xml.attr("format") !== undefined) {
                    labeler.formatter(ns.core.DataFormatter.create(axis.type(), xml.attr("format")));
                } else if (labels !== undefined) {
                    labeler.formatter(labels.formatter());
                }
                if (xml.attr("start") !== undefined) {
                    labeler.start(ns.core.DataValue.parse(axis.type(), xml.attr("start")));
                } else if (labels !== undefined) {
                    labeler.start(labels.start());
                }
                if (xml.attr("angle") !== undefined) {
                    labeler.angle(parseFloat(xml.attr("angle")));
                } else if (labels !== undefined) {
                    labeler.angle(labels.angle());
                }
                if (xml.attr("position") !== undefined) { 
                    labeler.position(ns.math.Point.parse(xml.attr("position")));
                } else if (labels !== undefined) {
                    labeler.position(labels.position());
                }
                if (xml.attr("anchor") !== undefined) {
                    labeler.anchor(ns.math.Point.parse(xml.attr("anchor")));
                } else if (labels !== undefined) {
                    labeler.anchor(labels.anchor());
                }
                if (xml.attr("densityfactor") !== undefined) {
                    labeler.densityfactor(parseFloat(xml.attr("densityfactor")));
                } else if (labels !== undefined) {
                    labeler.densityfactor(labels.densityfactor());
                }
            }
            return labeler;
        };
*/
        
        ns.core.Labeler.prototype[serialize] = function (spacing, tag) {
            // This serializer takes a single optional argument which is a value to output for the "spacing"
            // attribute.  If that argument is missing, the labeler's own spacing value is used.  This seemingly
            // weird API is in support of the ability to collapse multiple <label> tags into a single one,
            // with spacings separated by spaces.  The idea is that whoever calls this serialize method will
            // figure out if it has multiple Labelers are the same except for spacing, and if so, it will
            // serialize only one of them, passing in a space-separated string of the spacings for the "spacing"
            // argument.
            //
            // It also takes a second optional argument which is the tag string to use; the default is "label".
            if (tag === undefined) {
                tag = 'label';
            }

            var attributeStrings = [],
                output = '<'+tag+' ';

            if (spacing === undefined) {
                spacing = this.spacing();
            }

            if (this.start() !== undefined)          { attributeStrings.push('start="'           + this.start()                       + '"'); }
            if (this.angle() !== undefined)          { attributeStrings.push('angle="'           + this.angle()                       + '"'); }
            if (this.formatter() !== undefined)      { attributeStrings.push('format="'          + this.formatter().getFormatString() + '"'); }
            if (this.anchor() !== undefined)         { attributeStrings.push('anchor="'          + this.anchor().serialize()          + '"'); }
            if (this.position() !== undefined)        { attributeStrings.push('position="'        + this.position().serialize()        + '"'); }
            if (spacing !== undefined)               { attributeStrings.push('spacing="'         + spacing                            + '"'); }
            if (this.densityfactor() !== undefined)  { attributeStrings.push('densityfactor="'   + this.densityfactor()               + '"'); }

            output += attributeStrings.join(' ') + '/>';

            return output;
        };

    });
});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    var scalarAttributes = ["visible", "frame", "opacity", "border", "rows", "columns", "cornerradius", "padding"];

    ns.mixin.add(function (ns, parse, serialize) {

        ns.core.Legend[parse] = function (xml) {
            var legend = new ns.core.Legend();
            if (xml) {
                
                if (xml.attr("visible") !== undefined) {
                    if (xml.attr("visible").toLowerCase() === "true") {
                        legend.visible(true);
                    } else if (xml.attr("visible").toLowerCase() === "false") {
                        legend.visible(false);
                    } else {
                        legend.visible(xml.attr("visible"));
                    }
                }
                if (xml.attr("base") !== undefined) {
                    legend.base(window.multigraph.math.Point.parse(xml.attr("base")));
                }
                if (xml.attr("anchor") !== undefined) {
                    legend.anchor(window.multigraph.math.Point.parse(xml.attr("anchor")));
                }
                if (xml.attr("position") !== undefined) {
                    legend.position(window.multigraph.math.Point.parse(xml.attr("position")));
                }
                legend.frame(xml.attr("frame"));
                legend.color(ns.math.RGBColor.parse(xml.attr("color")));
                legend.bordercolor(ns.math.RGBColor.parse(xml.attr("bordercolor")));
                if (xml.attr("opacity") !== undefined) {
                    legend.opacity(parseFloat(xml.attr("opacity")));
                }
                if (xml.attr("border") !== undefined) {
                    legend.border(parseInt(xml.attr("border"), 10));
                }
                if (xml.attr("rows") !== undefined) {
                    legend.rows(parseInt(xml.attr("rows"), 10));
                }
                if (xml.attr("columns") !== undefined) {
                    legend.columns(parseInt(xml.attr("columns"), 10));
                }
                if (xml.attr("cornerradius") !== undefined) {
                    legend.cornerradius(parseInt(xml.attr("cornerradius"), 10));
                }
                if (xml.attr("padding") !== undefined) {
                    legend.padding(parseInt(xml.attr("padding"), 10));
                }
                if (xml.find("icon").length > 0) {
                    legend.icon(ns.core.Icon[parse](xml.find("icon")));
                } else {
                    legend.icon(ns.core.Icon[parse]());
                }
            }
            return legend;
        };

        ns.core.Legend.prototype[serialize] = function () {
            var attributeStrings = [],
                output = '<legend ';

            if (this.color() !== undefined) {
                attributeStrings.push('color="' + this.color().getHexString() + '"');
            }

            if (this.bordercolor() !== undefined) {
                attributeStrings.push('bordercolor="' + this.bordercolor().getHexString() + '"');
            }

            if (this.base() !== undefined) {
                attributeStrings.push('base="' + this.base().serialize() + '"');
            }

            if (this.anchor() !== undefined) {
                attributeStrings.push('anchor="' + this.anchor().serialize() + '"');
            }

            if (this.position() !== undefined) {
                attributeStrings.push('position="' + this.position().serialize() + '"');
            }

            attributeStrings = window.multigraph.utilityFunctions.serializeScalarAttributes(this, scalarAttributes, attributeStrings);

            output +=  attributeStrings.join(' ');
            if (this.icon()) {
                output += '>' + this.icon()[serialize]() + '</legend>';
            } else {
                output += '/>';
            }
            return output;
        };

    });
});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    ns.mixin.add(function (ns, parse, serialize) {

        ns.core.Multigraph[parse] = function (xml) {
            var multigraph = new ns.core.Multigraph();
            if (xml) {
                if (xml.find(">graph").length > 0) {
                    window.multigraph.jQuery.each(xml.find(">graph"), function (i,e) {
                        multigraph.graphs().add( ns.core.Graph[parse](window.multigraph.jQuery(e)) );
                    });
                } else if (xml.find(">graph").length === 0 && xml.children().length > 0) {
                    multigraph.graphs().add( ns.core.Graph[parse](xml) );
                }
            }
            return multigraph;
        };

        ns.core.Multigraph.prototype[serialize] = function () {
            var output = '<mugl>',
                i;

            for (i = 0; i < this.graphs().size(); ++i) {
                output += this.graphs().at(i)[serialize]();
            }

            output += '</mugl>';

            if (this.graphs().size() === 1) {
                output = output.replace('<mugl><graph>', '<mugl>');
                output = output.replace('</graph></mugl>', '</mugl>');
            }

            return output;
        };

    });

});

window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    var scalarAttributes = ["min", "max"];

    ns.mixin.add(function (ns, parse, serialize) {
        
        ns.core.Pan[parse] = function (xml, type) {
            var pan = new ns.core.Pan(),
                allowed;
            if (xml) {
                allowed = xml.attr("allowed");
                if (allowed !== undefined) {
                    switch (allowed.toLowerCase()) {
                        case "yes":
                            allowed = true;
                            break;
                        case "no":
                            allowed = false;
                            break;
                        default:
                            break;
                    }

                    pan.allowed(allowed);
                }
                if (xml.attr("min") !== undefined) {
                    pan.min( window.multigraph.core.DataValue.parse(type, xml.attr("min")) );
                }
                if (xml.attr("max") !== undefined) {
                    pan.max( window.multigraph.core.DataValue.parse(type, xml.attr("max")) );
                }
            }
            return pan;
        };
        
        ns.core.Pan.prototype[serialize] = function () {
            var attributeStrings = [],
                output = '<pan ';

            if (this.allowed()) {
                attributeStrings.push('allowed="yes"');
            } else {
                attributeStrings.push('allowed="no"');
            }
            attributeStrings = window.multigraph.utilityFunctions.serializeScalarAttributes(this, scalarAttributes, attributeStrings);

            output += attributeStrings.join(' ') + '/>';

            return output;
        };

    });
});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    ns.stringToJQueryXMLObj = function (string) {
        var xml = window.multigraph.jQuery.parseXML(string);
        return window.multigraph.jQuery(window.multigraph.jQuery(xml).children()[0]);
    };

});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    ns.mixin.add(function (ns, parse, serialize) {

        ns.core.Plot[parse] = function (xml, graph) {
            var DataPlot = window.multigraph.core.DataPlot,
                ConstantPlot = window.multigraph.core.ConstantPlot,
                DataValue = ns.core.DataValue,
                PlotLegend = ns.core.PlotLegend,
                Filter = ns.core.Filter,
                Renderer = ns.core.Renderer,
                Datatips = ns.core.Datatips,
                //plot = new DataPlot(),
                plot,
                haxis,
                vaxis,
                variable;
            if (xml) {

//populate verticalaxis from xml
                // same for verticalaxis property...
                vaxis = undefined;
                if (xml.find(">verticalaxis").length === 1 && xml.find(">verticalaxis").attr("ref") !== undefined) {
                    if (graph) {
                        vaxis = graph.axisById(xml.find(">verticalaxis").attr("ref"));
                        if (vaxis === undefined) {
                            throw new Error("The graph does not contain an axis with an id of: " + xml.find(">verticalaxis").attr("ref"));
                        }
                    }
                }

                if (xml.find("verticalaxis constant").length > 0) {
                    var constantValueString = xml.find("verticalaxis constant").attr("value");
                    if (constantValueString === undefined) {
                        throw new Error("foo foo");
                    }
                    plot = new ConstantPlot(DataValue.parse(vaxis.type(), constantValueString));
                } else {
                    plot = new DataPlot();
                }


                plot.verticalaxis(vaxis);


//populate horizontalaxis from xml

                // the Plot's horizontalaxis property is a pointer to an Axis object (not just the
                // string id of the axis!)
                if (xml.find(">horizontalaxis").length === 1 && xml.find(">horizontalaxis").attr("ref") !== undefined) {
                    if (graph) {
                        haxis = graph.axisById(xml.find(">horizontalaxis").attr("ref"));
                        if (haxis !== undefined) {
                            plot.horizontalaxis(haxis);
                        } else {
                            throw new Error("The graph does not contain an axis with an id of: " + xml.find(">horizontalaxis").attr("ref"));
                        }
                    }
                }

                //if this is a DataPlot, parse variables
                if (plot instanceof DataPlot) {

                    //provide default horizontalaxis variable if not present in xml
                    if (xml.find("horizontalaxis variable").length === 0) {
                        plot.variable().add(null);
                    }

                    //populate axis variables from xml
                    if (xml.find("horizontalaxis variable, verticalaxis variable").length > 0) {
                        if (graph) {
                            window.multigraph.jQuery.each(xml.find("horizontalaxis variable, verticalaxis variable"), function (i,e) {
                                variable = graph.variableById( window.multigraph.jQuery(e).attr("ref") );
                                if (variable !== undefined) {
                                    plot.data( variable.data() );
                                    plot.variable().add(variable);
                                } else {
                                    throw new Error("The graph does not contain a variable with an id of: " + window.multigraph.jQuery(e).attr("ref"));
                                }
                            });
                        }
                    }
                }

//populate legend from xml
                if (xml.find("legend").length > 0) {
                    plot.legend(PlotLegend[parse](xml.find("legend"), plot));
                } else {
                    plot.legend(PlotLegend[parse](undefined, plot));
                }

//populate renderer from xml
                if (xml.find("renderer").length > 0) {
                    plot.renderer(Renderer[parse](xml.find("renderer"), plot));
                }

//populate filter from xml
                if (xml.find("filter").length > 0) {
                    plot.filter(Filter[parse](xml.find("filter")));
                }

//populate datatips from xml
                if (xml.find("datatips").length > 0) {
                    plot.datatips(Datatips[parse](xml.find("datatips")));
                }

            }
            return plot;
        };

        ns.core.Plot.prototype[serialize] = function () {
            var output = '<plot>',
                axisHasContent,
                i;

            if (this.horizontalaxis() || (this.variable().size() > 0 && this.variable().at(0) !== null && this.variable().size() !==1)) {
                output += '<horizontalaxis';
                if (this.horizontalaxis() && this.horizontalaxis().id()) {
                    output += ' ref="' + this.horizontalaxis().id() + '"';
                }
                if (this.variable().size() > 0 && this.variable().at(0) !== null) {
                    output += '><variable ref="' + this.variable().at(0).id() + '"/></horizontalaxis>';
                } else {
                    output += '/>';
                }
            }

            if (this.verticalaxis() || this.variable().size() > 1) {
                output += '<verticalaxis';
                if (this.verticalaxis() && this.verticalaxis().id()) {
                    output += ' ref="' + this.verticalaxis().id() + '"';
                }
                axisHasContent = false;
                if (this instanceof ns.core.ConstantPlot) {
                    output += '<constant value="' + this.constantValue().toString() + '"/>';
                    axisHasContent = true;
                } else {
                    if (this.variable().size() > 1) {
                        output += '>';
                        for (i = 1; i < this.variable().size(); i++) {
                            output += '<variable ref="' + this.variable().at(i).id() + '"/>';
                        }
                        axisHasContent = true;
                    }
                }
                if (axisHasContent) {
                    output += '</verticalaxis>';
                } else {
                    output += '/>';
                }
            }

            if (this.legend()) {
                output += this.legend()[serialize]();
            }
            if (this.renderer()) {
                output += this.renderer()[serialize]();
            }
            if (this.filter()) {
                output += this.filter()[serialize]();
            }
            if (this.datatips()) {
                output += this.datatips()[serialize]();
            }

            output += '</plot>';

            return output;
        };

    });
});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    var scalarAttributes = ["visible"];

    ns.mixin.add(function (ns, parse, serialize) {
        
        ns.core.PlotLegend[parse] = function (xml, plot) {
            var legend = new ns.core.PlotLegend();
            if (xml) {
                if (xml.attr("visible") !== undefined) {
                    if (xml.attr("visible").toLowerCase() === "true") {
                        legend.visible(true);
                    } else if (xml.attr("visible").toLowerCase() === "false") {
                        legend.visible(false);
                    } else {
                        legend.visible(xml.attr("visible"));
                    }
                }
                if (xml.attr("label") !== undefined) {
                    legend.label(new ns.core.Text(xml.attr("label")));
                }
            }

            if (legend.label() === undefined) {
                // TODO: remove this ugly patch with something that works properly
                if (typeof(plot.variable)==="function" && plot.variable().size() >= 2) { 
                    legend.label(new ns.core.Text(plot.variable().at(1).id()));
                } else {
                    legend.label(new ns.core.Text("plot"));
                }
            }
            return legend;
        };
        
        ns.core.PlotLegend.prototype[serialize] = function () {
            var attributeStrings = [],
                output = '<legend ',
                i;

            attributeStrings = window.multigraph.utilityFunctions.serializeScalarAttributes(this, scalarAttributes, attributeStrings);

            if (this.label() !== undefined) {
                attributeStrings.push('label="' + this.label().string() + '"');
            }

            output += attributeStrings.join(' ') + '/>';

            return output;
        };

    });
});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    var scalarAttributes = ["border"];
    ns.mixin.add(function (ns, parse, serialize) {
        
        ns.core.Plotarea[parse] = function (xml) {
            var plotarea = new ns.core.Plotarea();
            if (xml) {
                if (xml.attr("marginbottom") !== undefined) {
                    plotarea.margin().bottom(parseInt(xml.attr("marginbottom"), 10));
                }
                if (xml.attr("marginleft") !== undefined) {
                    plotarea.margin().left(parseInt(xml.attr("marginleft"), 10));
                }
                if (xml.attr("margintop") !== undefined) {
                    plotarea.margin().top(parseInt(xml.attr("margintop"), 10));
                }
                if (xml.attr("marginright") !== undefined) {
                    plotarea.margin().right(parseInt(xml.attr("marginright"), 10));
                }
                if (xml.attr("border") !== undefined) {
                    plotarea.border(parseInt(xml.attr("border"), 10));
                }
                plotarea.bordercolor(ns.math.RGBColor.parse(xml.attr("bordercolor")));
            }
            return plotarea;
        };
        
        ns.core.Plotarea.prototype[serialize] = function () {
            var attributeStrings = [],
                output = '<plotarea ';

            attributeStrings.push('margintop="' + this.margin().top() + '"');
            attributeStrings.push('marginleft="' + this.margin().left() + '"');
            attributeStrings.push('marginbottom="' + this.margin().bottom() + '"');
            attributeStrings.push('marginright="' + this.margin().right() + '"');

            if (this.bordercolor() !== undefined) {
                attributeStrings.push('bordercolor="' + this.bordercolor().getHexString() + '"');
            }

            attributeStrings = window.multigraph.utilityFunctions.serializeScalarAttributes(this, scalarAttributes, attributeStrings);

            output += attributeStrings.join(' ') + '/>';

            return output;
        };

    });
});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    ns.mixin.add(function (ns, parse, serialize) {

        ns.core.Renderer[parse] = function (xml, plot) {
            var rendererType,
                renderer,
                opt;

            if (xml && xml.attr("type") !== undefined) {
                rendererType = ns.core.Renderer.Type.parse(xml.attr("type"));
                renderer = ns.core.Renderer.create(rendererType);
                if (!renderer) {
                    throw new Error("unknown renderer type '"+rendererType+"'");
                }
                renderer.plot(plot);
                if (xml.find("option").length > 0) {
                    window.multigraph.jQuery.each(xml.find(">option"), function (i, e) {
                        renderer.setOptionFromString(window.multigraph.jQuery(e).attr("name"),
                                                     window.multigraph.jQuery(e).attr("value"),
                                                     window.multigraph.jQuery(e).attr("min"),
                                                     window.multigraph.jQuery(e).attr("max"));
                    });
                }
            }
            return renderer;
        };

        ns.core.Renderer.prototype[serialize] = function () {
            var attributeStrings = [],
                output = '<renderer ',
                i;

            attributeStrings.push('type="' + this.type().toString() + '"');

            output += attributeStrings.join(' ');

            var opt,
                optionString,
                optionStrings = [];
            for (opt in this.optionsMetadata) {
                if (this.optionsMetadata.hasOwnProperty(opt)) {
                    var ropts = this.options()[opt]();
                    for (i=0; i<ropts.size(); ++i) {
/*
  console.log('option: ' + opt);
  console.log('   min: ' + ropts.at(i).min());
  console.log('   max: ' + ropts.at(i).max());
  console.log('   val: ' + ropts.at(i).serializeValue());
  console.log('   dal: ' + (new (this.optionsMetadata[opt].type)(this.optionsMetadata[opt]["default"])).serializeValue());
*/
                        if ((ropts.at(i).min() !== undefined) ||
                            (ropts.at(i).max() !== undefined) ||
                            !(ropts.at(i).valueEq(this.optionsMetadata[opt]["default"]))
                           ) {
                            optionString = '<option name="'+opt+'" value="'+ropts.at(i).serializeValue()+'"';
                            if (ropts.at(i).min() !== undefined) {
                                optionString += ' min="'+ropts.at(i).min()+'"';
                            }
                            if (ropts.at(i).max() !== undefined) {
                                optionString += ' max="'+ropts.at(i).max()+'"';
                            }
                            optionString += '/>';
                            optionStrings.push(optionString);
                        }
                    }
                }
            }


            if (optionStrings.length > 0) {
                output += '>';
                output += optionStrings.join("");
                output += '</renderer>';
            } else {
                output += '/>';
            }

/*
            if (this.options().size() !== 0) {
                output += '>';
                for (i = 0; i < this.options().size(); i++) {
                    //foo.yaya;
                    output += this.options().at(i)[serialize]();
                }
console.log(optionStrings.join(""));
                output += '</renderer>';
            } else {
                output += '/>';
            }
*/





            return output;
        };

    });
});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    var scalarAttributes = ["location"];

    ns.mixin.add(function (ns, parse, serialize) {
        
        ns.core.Service[parse] = function (xml) {
            var service = new ns.core.Service();
            if (xml) {
                service.location(xml.attr("location"));
            }
            return service;
        };
        
        ns.core.Service.prototype[serialize] = function () {
            var attributeStrings = [],
                output = '<service ';

            attributeStrings = window.multigraph.utilityFunctions.serializeScalarAttributes(this, scalarAttributes, attributeStrings);

            output += attributeStrings.join(' ') + '/>';

            return output;
        };

    });
});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    var scalarAttributes = ["missingvalue", "missingop"];

    ns.mixin.add(function (ns, parse, serialize) {

        ns.core.Variables[parse] = function (xml, data) {
            var variables = new ns.core.Variables();
            if (xml) {
                variables.missingvalue(xml.attr("missingvalue"));
                variables.missingop(xml.attr("missingop"));
                if (xml.find(">variable").length > 0) {
                    window.multigraph.jQuery.each(xml.find(">variable"), function (i,e) {
                        variables.variable().add( ns.core.DataVariable[parse](window.multigraph.jQuery(e), data) );
                    });
                }
            }
            return variables;
        };

        ns.core.Variables.prototype[serialize] = function () {
            var attributeStrings = [],
                output = '<variables ',
                i;

            attributeStrings = window.multigraph.utilityFunctions.serializeScalarAttributes(this, scalarAttributes, attributeStrings);

            output += attributeStrings.join(' ');

            if (this.variable().size() > 0) {
                output += '>';
                for (i = 0; i < this.variable().size(); i++) {
                    output += this.variable().at(i)[serialize]();
                }
                output += '</variables>';
            } else {
                output += '/>';
            }

            return output;
        };

    });
});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    var scalarAttributes = ["width", "height", "border"];
    ns.mixin.add(function (ns, parse, serialize) {
        
        ns.core.Window[parse] = function (xml) {
            //WARNING: do not declare a local var named "window" here; it masks the global 'window' object,
            //  which screws up the references to window.multigraph.* below!
            var w = new ns.core.Window();
            if (xml) {
                if (xml.attr("width") !== undefined) {
                    w.width(parseInt(xml.attr("width"), 10));
                }
                if (xml.attr("height") !== undefined) {
                    w.height(parseInt(xml.attr("height"), 10));
                }
                if (xml.attr("border") !== undefined) {
                    w.border(parseInt(xml.attr("border"), 10));
                }

                if (xml.attr("margin") !== undefined) {
                    (function (m) {
                        w.margin().set(m,m,m,m);
                    }(parseInt(xml.attr("margin"), 10)));
                }

                if (xml.attr("padding") !== undefined) {
                    (function (m) {
                        w.padding().set(m,m,m,m);
                    }(parseInt(xml.attr("padding"), 10)));
                }

                w.bordercolor(ns.math.RGBColor.parse(xml.attr("bordercolor")));
            }
            return w;
        };
        
        ns.core.Window.prototype[serialize] = function () {
            var attributeStrings = [],
                output = '<window ';

            attributeStrings.push('margin="' + this.margin().top() + '"');
            attributeStrings.push('padding="' + this.padding().top() + '"');
            if (this.bordercolor() !== undefined) {
                attributeStrings.push('bordercolor="' + this.bordercolor().getHexString() + '"');
            }

            attributeStrings = window.multigraph.utilityFunctions.serializeScalarAttributes(this, scalarAttributes, attributeStrings);

            output += attributeStrings.join(' ') + '/>';

            return output;
        };

    });
});
window.multigraph.util.namespace("window.multigraph.parser.jquery", function (ns) {
    "use strict";

    var scalarAttributes = ["min", "max"];

    ns.mixin.add(function (ns, parse, serialize) {
        
        ns.core.Zoom[parse] = function (xml, type) {
            var zoom = new ns.core.Zoom(),
                allowed;
            if (xml) {
                allowed = xml.attr("allowed");
                if (allowed !== undefined) {
                    switch (allowed.toLowerCase()) {
                        case "yes":
                            allowed = true;
                            break;
                        case "no":
                            allowed = false;
                            break;
                        default:
                            break;
                    }

                    zoom.allowed(allowed);
                }
                if (xml.attr("min") !== undefined) {
                    zoom.min( window.multigraph.core.DataMeasure.parse(type, xml.attr("min")) );
                }
                if (xml.attr("max") !== undefined) {
                    zoom.max( window.multigraph.core.DataMeasure.parse(type, xml.attr("max")) );
                }
                if (xml.attr("anchor") !== undefined) {
                    if (xml.attr("anchor").toLowerCase() === "none") {
                        zoom.anchor(null);
                    } else {
                        zoom.anchor( window.multigraph.core.DataValue.parse(type, xml.attr("anchor")) );
                    }
                }
            }
            return zoom;
        };
        
        ns.core.Zoom.prototype[serialize] = function () {
            var attributeStrings = [],
                output = '<zoom ';

            if (this.allowed()) {
                attributeStrings.push('allowed="yes"');
            } else {
                attributeStrings.push('allowed="no"');
            }

            attributeStrings = window.multigraph.utilityFunctions.serializeScalarAttributes(this, scalarAttributes, attributeStrings);

            if (this.anchor() === null) {
                attributeStrings.push('anchor="none"');
            } else {
                attributeStrings.push('anchor="' + this.anchor() + '"');
            }

            output += attributeStrings.join(' ') + '/>';

            return output;
        };

    });
});
window.multigraph.util.namespace("window.multigraph.normalizer", function (ns) {
    "use strict";

    ns.mixin = new window.multigraph.core.Mixin();

});
window.multigraph.util.namespace("window.multigraph.normalizer", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {

        ns.Axis.respondsTo("normalize", function (graph) {
            var i,
                defaultNumberSpacing = "10000 5000 2000 1000 500 200 100 50 20 10 5 2 1 0.1 0.01 0.001",
                defaultDatetimeSpacing = "1000Y 500Y 200Y 100Y 50Y 20Y 10Y 5Y 2Y 1Y 6M 3M 2M 1M 7D 3D 2D 1D 12H 6H 3H 2H 1H",
                defaultNumberFormat = "%1d",
                defaultDatetimeFormat = "%Y-%M-%D $H:%i",
                labelerFormat,
                spacingStrings,
                title,
                label;

            //
            // Handles title tags
            //
            if (this.title() === undefined) {
                // TODO: once axis title stuff has been merged in then the axis title
                // will require a pointer to the axis.
                title = new ns.AxisTitle();
                title.content(this.id());
                this.title(title);
            }

            //
            // Handles missing labelers
            //
            if (this.labelers().size() === 0) {
                if (this.type() === ns.DataValue.DATETIME) {
                    spacingStrings = defaultDatetimeSpacing.split(/\s+/);
                    labelerFormat = defaultDatetimeFormat;
                } else {
                    spacingStrings = defaultNumberSpacing.split(/\s+/);
                    labelerFormat = defaultNumberFormat;
                }

                for (i = 0; i < spacingStrings.length; i++) {
                    label = new ns.Labeler(this);
                    label.spacing(ns.DataMeasure.parse(this.type(), spacingStrings[i]));
                    label.formatter(ns.DataFormatter.create(this.type(),labelerFormat));
                    this.labelers().add(label);
                }
            }

        });

    });

});
window.multigraph.util.namespace("window.multigraph.normalizer", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {

        ns.Data.prototype.normalize = function () {
            var i,
                j,
                sortedVariables = [],
                unsortedVariables = [];

            //
            // Handles missing variable tags if the data tag has a 'csv' or 'service' tag
            //
            if (this instanceof ns.CSVData || this instanceof ns.WebServiceData) {
                if (this.columns().size() === 0) {
                    throw new Error("Data Normalization: Data gotten from csv and web service sources require variables to be specified in the mugl.");
                }
            }

            //
            // Sorts variables into appropriate order
            //
            for (i = 0; i < this.columns().size(); i++) {
                if (this.columns().at(i).column() !== undefined) {
                    sortedVariables[this.columns().at(i).column()] = this.columns().at(i);
                } else {
                    unsortedVariables.push(this.columns().at(i));
                }
            }

            // creates placeholder variables if the data tag has a 'values' tag
            if (this instanceof ns.ArrayData === true && this instanceof ns.CSVData === false && this instanceof ns.WebServiceData === false) {
                var numMissingVariables = this.array()[0].length - this.columns().size();
                if (numMissingVariables > 0) {
                    for (i = 0; i < numMissingVariables; i++) {
                        unsortedVariables.push(null);
                    }
                }
            }

            // inserts unsorted variables into the correct location
            var index = 0;
            for (i = 0; i < unsortedVariables.length; i++) {
                while (true) {
                    if (sortedVariables[index] === undefined) {
                        break;
                    }
                    index++;
                }
                sortedVariables[index] = unsortedVariables[i];
            }
            
            //
            // Handles missing attrs.
            // creates the appropriate variable if missing and if the data had a 'values' tag.
            //
            var defaultid,
                defaultMissingop = ns.DataValue.parseComparator(this.defaultMissingop());
            for (i = 0; i < sortedVariables.length; i++) {
                if (sortedVariables[i] === null) {
                    if (i === 0) {
                        defaultid = "x";
                    } else if (i === 1) {
                        defaultid = "y";
                    } else {
                        defaultid = "y" + (i-1);
                    }
                    sortedVariables[i] = new ns.DataVariable(defaultid, i, ns.DataValue.NUMBER);
                } else {
                    if (sortedVariables[i].column() === undefined) {
                        sortedVariables[i].column(i);
                    }
                    if (sortedVariables[i].type() === undefined) {
                        sortedVariables[i].type(ns.DataValue.NUMBER);
                    }
                }

                if (this.defaultMissingvalue() !== undefined) {
                    if (sortedVariables[i].missingvalue() === undefined) {
                        sortedVariables[i].missingvalue(ns.DataValue.parse(sortedVariables[i].type(), this.defaultMissingvalue()));
                    }
                }
                if (sortedVariables[i].missingop() === undefined) {
                    sortedVariables[i].missingop(defaultMissingop);
                }
            }

            //
            // Inserts the normalized variables into the data instance
            //
            while (this.columns().size() > 0) {
                this.columns().pop();
            }
            for (i = 0; i < sortedVariables.length; i++) {
                this.columns().add(sortedVariables[i]);
            }
            this.initializeColumns();
        };

    });

});
window.multigraph.util.namespace("window.multigraph.normalizer", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {

        ns.Graph.respondsTo("normalize", function () {
            var i,
                haxisCount = 0,
                vaxisCount = 0,
                axisid;

            //
            // normalizes the data sections
            //
            for (i = 0; i < this.data().size(); i++) {
                this.data().at(i).normalize();
            }

            //
            // Handles missing horizontalaxis and vertical axis tags
            //
            for (i = 0; i < this.axes().size(); i++) {
                if (this.axes().at(i).orientation() === ns.Axis.HORIZONTAL) {
                    haxisCount++;
                } else if (this.axes().at(i).orientation() === ns.Axis.VERTICAL) {
                    vaxisCount++;
                }
            }

            if (haxisCount === 0) {
                this.axes().add(new ns.Axis(ns.Axis.HORIZONTAL));
            }
            if (vaxisCount === 0) {
                this.axes().add(new ns.Axis(ns.Axis.VERTICAL));
            }

            //
            // Handles missing id's for axes
            //
            haxisCount = 0;
            vaxisCount = 0;
            for (i = 0; i < this.axes().size(); i++) {
                if (this.axes().at(i).orientation() === ns.Axis.HORIZONTAL) {
                    axisid = "x";
                    if (haxisCount > 0) {
                        axisid += haxisCount;
                    }
                    haxisCount++;
                } else if (this.axes().at(i).orientation() === ns.Axis.VERTICAL) {
                    axisid = "y";
                    if (vaxisCount > 0) {
                        axisid += vaxisCount;
                    }
                    vaxisCount++;
                }

                if (this.axes().at(i).id() === undefined) {
                    this.axes().at(i).id(axisid);
                }
            }

            //
            // normalizes the rest of the axis properties
            //
            for (i = 0; i < this.axes().size(); i++) {
                this.axes().at(i).normalize(this);
            }

            //
            // handles missing plot tags
            //
            if (this.plots().size() === 0) {
                this.plots().add(new ns.DataPlot());
            }

            //
            // normalizes the plots
            //
            for (i = 0; i < this.plots().size(); i++) {
                var p = this.plots().at(i);
                this.plots().at(i).normalize(this);
            }

        });

    });

});
window.multigraph.util.namespace("window.multigraph.normalizer", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {

        ns.Multigraph.respondsTo("normalize", function () {
            var i;
            for (i = 0; i < this.graphs().size(); ++i) {
                this.graphs().at(i).normalize();
            }
        });

    });

});
window.multigraph.util.namespace("window.multigraph.normalizer", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {

        var normalizePlot = function (graph) {
            var i,
                rendererType,
                numberOfVariables,
                findNextVariableAtOrAfter,
                columnNum;

            //
            // Handles missing horizontalaxis tags
            //
            if (this.horizontalaxis() === undefined) {
                for (i = 0; i < graph.axes().size(); i++) {
                    if (graph.axes().at(i).orientation() === ns.Axis.HORIZONTAL) {
                        this.horizontalaxis(graph.axes().at(i));
                        break;
                    }
                }
            }

            //
            // Handles missing verticalaxis tags
            //
            if (this.verticalaxis() === undefined) {
                for (i = 0; i < graph.axes().size(); i++) {
                    if (graph.axes().at(i).orientation() === ns.Axis.VERTICAL) {
                        this.verticalaxis(graph.axes().at(i));
                        break;
                    }
                }
            }

            //
            // Handles missing renderer tags
            //
            if (this.renderer() === undefined) {
                rendererType = ns.Renderer.Type.parse("line");
                this.renderer(ns.Renderer.create(rendererType));
            }

            //
            // Handles missing variables
            //
            findNextVariableAtOrAfter = function (plot, data, index) {
                var flag = true,
                    overlapFlag = false,
                    variableInPlotFlag,
                    i = index,
                    j,
                    variable;

                while (flag) {
                    if (i === index && overlapFlag === true) {
                        throw new Error("Plot Normalizer: There does not exist an unused variable");
                    }

                    if (i === data.columns().size()) {
                        i = 0;
                        overlapFlag = true;
                    }

                    variableInPlotFlag = false;
                    variable = data.columns().at(i);

                    for (j = 0; j < plot.variable().size(); j++) {
                        if (plot.variable().at(j) === variable) {
                            variableInPlotFlag = true;
                            break;
                        }
                    }

                    if (variableInPlotFlag === false) {
                        return variable;
                    }

                    i++;
                }
                
            };

            switch (this.renderer().type()) {
                case ns.Renderer.POINTLINE:
                case ns.Renderer.POINT:
                case ns.Renderer.LINE:
                case ns.Renderer.BAR:
                case ns.Renderer.FILL:
                    numberOfVariables = 2;
                    break;
                case ns.Renderer.BAND:
                case ns.Renderer.RANGEERROR:
                case ns.Renderer.LINEERROR:
                case ns.Renderer.BARERROR:
                    numberOfVariables = 3;
                    break;
            }

            if (this instanceof ns.DataPlot) {
                if (this.data() === undefined) {
                    this.data(graph.data().at(0));
                }

                if (this.variable().size() === 0) {
                    this.variable().add(findNextVariableAtOrAfter(this, this.data(), 0));
                }

                if (this.variable().at(0) === null) {
                    this.variable().replace(0, findNextVariableAtOrAfter(this, this.data(), 0));
                }

                while (this.variable().size() < numberOfVariables) {
                    this.variable().add(findNextVariableAtOrAfter(this, this.data(), 1));
                }

                // 1. get variables from a data section, some will be used, others won't be.
                // 2. check if horizontal axis needs a variable
                //       if it does - find first unused variable, starting at position 0
                //                  - if no unused variables exist - throw error
                //                  - CONTINUE
                //       if it does not - CONTINUE
                // 3. check if vertical axis needs variable(s)
                //       if it does - find first unused variable, starting at the position of
                //                    the x variable
                //                  - if no unused variables exist - throw error
                //                  - check if vertical axis needs another variable
                //                        if it does - Repeat step 3
            }

        };

        ns.DataPlot.respondsTo("normalize", normalizePlot);
        ns.ConstantPlot.respondsTo("normalize", normalizePlot);

    });

});
window.multigraph.util.namespace("window.multigraph.events.jquery.mouse", function (ns) {
    "use strict";

    ns.mixin = new window.multigraph.core.Mixin();

});
window.multigraph.util.namespace("window.multigraph.events.jquery.mouse", function (ns) {
    "use strict";

    ns.mixin.add(function (ns, errorHandler) {
        var Graph = ns.core.Graph;
        var Axis  = ns.core.Axis;

        Graph.hasA("dragStarted").which.isA("boolean");
        Graph.hasA("dragOrientation").which.validatesWith(Axis.Orientation.isInstance);
        Graph.hasA("dragAxis").which.validatesWith(function (a) {
            return a instanceof Axis;
        });

        Graph.respondsTo("doDragReset", function () {
            var i;
            this.dragStarted(false);
            // pause all this graph's data sources:
            for (i=0; i<this.data().size(); ++i) {
                this.data().at(i).pause();
            }
        });
        Graph.respondsTo("doDragDone", function () {
            var i;
            // unpause all this graph's data sources:
            for (i=0; i<this.data().size(); ++i) {
                this.data().at(i).resume();
            }
        });

        Graph.respondsTo("doDrag", function (multigraph, bx, by, dx, dy, shiftKey) {
            var i = 0;
// TODO: this try...catch is just to remind myself how to apply, make sure this is correct later
            try {
                if (!this.dragStarted()) {
                    if (Math.abs(dx) > Math.abs(dy)) {
                        this.dragOrientation(Axis.HORIZONTAL);
                    } else {
                        this.dragOrientation(Axis.VERTICAL);
                    }
                    this.dragAxis(this.findNearestAxis(bx, by, this.dragOrientation()));
                    if (this.dragAxis() === null) {
                        this.dragOrientation( (this.dragOrientation() === Axis.HORIZONTAL) ? Axis.VERTICAL : Axis.HORIZONTAL );
                        this.dragAxis( this.findNearestAxis(bx, by, this.dragOrientation()) );
                    }
                    this.dragStarted(true);
                }

                // do the action
                if (shiftKey) {
                    if (this.dragOrientation() === Axis.HORIZONTAL) {
                        this.dragAxis().doZoom(bx, dx);
                    } else {
                        this.dragAxis().doZoom(by, dy);
                    }
                } else {
                    if (this.dragOrientation() === Axis.HORIZONTAL) {
                        this.dragAxis().doPan(bx, dx);
                    } else {
                        this.dragAxis().doPan(by, dy);
                    }
                }


                // draw everything
                multigraph.redraw();
            } catch (e) {
                errorHandler(e);
            }
        });

        /**
         * Compute the distance from an axis to a point.  The point
         * (x,y) is expressed in pixel coordinates in the same
         * coordinate system as the axis.
         * 
         * We use two different kinds of computations depending on
         * whether the point lies inside or outside the region bounded
         * by the two lines perpendicular to the axis through its
         * endpoints.  If the point lies inside this region, the
         * distance is simply the difference in the perpendicular
         * coordinate of the point and the perpendicular coordinate of
         * the axis.
         * 
         * If the point lies outside the region, then the distance is
         * the L2 distance between the point and the closest endpoint
         * of the axis.
         */
        var axisDistanceToPoint = function (axis, x, y) {
            var perpCoord     = (axis.orientation() === Axis.HORIZONTAL) ? y : x;
            var parallelCoord = (axis.orientation() === Axis.HORIZONTAL) ? x : y;
            if (parallelCoord < axis.parallelOffset()) {
                // point is under or left of the axis; return L2 distance to bottom or left axis endpoint
                return l2dist(parallelCoord, perpCoord, axis.parallelOffset(), axis.perpOffset());
            }
            if (parallelCoord > axis.parallelOffset() + axis.pixelLength()) {
                // point is above or right of the axis; return L2 distance to top or right axis endpoint
                return l2dist(parallelCoord, perpCoord, axis.parallelOffset()+axis.pixelLength(), axis.perpOffset());
            }
            // point is between the axis endpoints; return difference in perpendicular coords
            return Math.abs(perpCoord - axis.perpOffset());
        };

        var l2dist = function (x1, y1, x2, y2) {
            var dx = x1 - x2;
            var dy = y1 - y2;
            return Math.sqrt(dx*dx + dy*dy);
        };

        Graph.respondsTo("findNearestAxis", function (x, y, orientation) {
            var foundAxis = null,
                mindist = 9999,
                i,
                axes = this.axes(),
                naxes = this.axes().size(),
                axis,
                d;
            for (i = 0; i < naxes; ++i) {
                axis = axes.at(i);
                if (axis.orientation() === orientation) {
                    d = axisDistanceToPoint(axis, x, y);
                    if (foundAxis===null || d < mindist) {
                        foundAxis = axis;
                        mindist = d;
                    }
                }
            }
            return foundAxis;
        });


    });

});
window.multigraph.util.namespace("window.multigraph.events.jquery.mouse", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {
        var core = ns.core;
        var math = window.multigraph.util.namespace("window.multigraph.math");

        core.Multigraph.respondsTo("registerMouseEvents", function (target) {

            var base;
            var mouseLast;
            var mouseIsDown = false;
            var dragStarted = false;
            var multigraph = this;

            var $target = window.multigraph.jQuery(target);

            var eventLocationToGraphCoords = function (event) {
                return new math.Point((event.pageX - $target.offset().left) - multigraph.graphs().at(0).x0(),
                                      $target.height() - (event.pageY - $target.offset().top) - multigraph.graphs().at(0).y0());
            };

            $target.mousedown(function (event) {
                mouseLast = base = eventLocationToGraphCoords(event);
                mouseIsDown = true;
                dragStarted = false;
            });
            $target.mouseup(function (event) {
                mouseIsDown = false;
                multigraph.graphs().at(0).doDragDone();
            });
            $target.mousemove(function (event) {
                var eventLoc = eventLocationToGraphCoords(event);
                if (mouseIsDown) {
                    var dx = eventLoc.x() - mouseLast.x();
                    var dy = eventLoc.y() - mouseLast.y();
                    if (multigraph.graphs().size() > 0) {
                        if (!dragStarted ) {
                            multigraph.graphs().at(0).doDragReset();
                        }
                        multigraph.graphs().at(0).doDrag(multigraph,base.x(),base.y(),dx,dy,event.shiftKey);
                    }
                    dragStarted = true;
                }
                mouseLast = eventLoc;
            });
            $target.mouseenter(function (event) {
                mouseLast = eventLocationToGraphCoords(event);
                mouseIsDown = false;
                multigraph.graphs().at(0).doDragDone();
            });
            $target.mouseleave(function (event) {
                mouseIsDown = false;
                multigraph.graphs().at(0).doDragDone();
            });
        });

    });

});

(function($) {
    "use strict";

    var core = window.multigraph.util.namespace("window.multigraph.core");

    /**
     * Inclusion of this file allows markup like the following to be
     * used in HTML:
     * 
     *     <div class="multigraph"
     *        data-src="MUGL_FILE"
     *        data-width="WIDTH"
     *        data-height="HEIGHT"
     *        data-driver="DRIVER">
     *     </div>
     * 
     * The data-driver tag is optional; if not specified, it currently
     * defaults to "canvas", but that will be changed in the future to
     * make a smart choice based on browser capabilities.
     * 
     * The data-width and data-height tags are also optional; if they
     * are not specified, Multigraph will use the div size as determined
     * by the browser (which may be set by css rules, for example).  If
     * data-width or data-height is present, it will override any css
     * width or height.
     * 
     */
    $(document).ready(function() {

        $("div.multigraph").each(function() {

            var width = $(this).attr("data-width"),
                height = $(this).attr("data-height"),
                src = $(this).attr("data-src"),
                driver = $(this).attr("data-driver"),
                options;

            if (width !== undefined) {
                $(this).css('width', width + 'px');
            }
            if (height !== undefined) {
                $(this).css('height', height + 'px');
            }
            if (driver === undefined) {
                driver = "canvas";
            }
            
            options = {
                'div'    : this,
                'mugl'   : src,
                'driver' : driver
            };

            if (src !== undefined) {
                core.Multigraph.createGraph(options);
            }

        });

    });

}(window.multigraph.jQuery));
// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ Raphaël 2.1.0 - JavaScript Vector Library                          │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2008-2012 Dmitry Baranovskiy (http://raphaeljs.com)    │ \\
// │ Copyright © 2008-2012 Sencha Labs (http://sencha.com)              │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT (http://raphaeljs.com/license.html) license.│ \\
// └────────────────────────────────────────────────────────────────────┘ \\

// ┌──────────────────────────────────────────────────────────────────────────────────────┐ \\
// │ Eve 0.3.4 - JavaScript Events Library                                                │ \\
// ├──────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright (c) 2008-2011 Dmitry Baranovskiy (http://dmitry.baranovskiy.com/)          │ \\
// │ Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license. │ \\
// └──────────────────────────────────────────────────────────────────────────────────────┘ \\

(function (glob) {
    var version = "0.3.4",
        has = "hasOwnProperty",
        separator = /[\.\/]/,
        wildcard = "*",
        fun = function () {},
        numsort = function (a, b) {
            return a - b;
        },
        current_event,
        stop,
        events = {n: {}},
    
        eve = function (name, scope) {
            var e = events,
                oldstop = stop,
                args = Array.prototype.slice.call(arguments, 2),
                listeners = eve.listeners(name),
                z = 0,
                f = false,
                l,
                indexed = [],
                queue = {},
                out = [],
                ce = current_event,
                errors = [];
            current_event = name;
            stop = 0;
            for (var i = 0, ii = listeners.length; i < ii; i++) if ("zIndex" in listeners[i]) {
                indexed.push(listeners[i].zIndex);
                if (listeners[i].zIndex < 0) {
                    queue[listeners[i].zIndex] = listeners[i];
                }
            }
            indexed.sort(numsort);
            while (indexed[z] < 0) {
                l = queue[indexed[z++]];
                out.push(l.apply(scope, args));
                if (stop) {
                    stop = oldstop;
                    return out;
                }
            }
            for (i = 0; i < ii; i++) {
                l = listeners[i];
                if ("zIndex" in l) {
                    if (l.zIndex == indexed[z]) {
                        out.push(l.apply(scope, args));
                        if (stop) {
                            break;
                        }
                        do {
                            z++;
                            l = queue[indexed[z]];
                            l && out.push(l.apply(scope, args));
                            if (stop) {
                                break;
                            }
                        } while (l)
                    } else {
                        queue[l.zIndex] = l;
                    }
                } else {
                    out.push(l.apply(scope, args));
                    if (stop) {
                        break;
                    }
                }
            }
            stop = oldstop;
            current_event = ce;
            return out.length ? out : null;
        };
    
    eve.listeners = function (name) {
        var names = name.split(separator),
            e = events,
            item,
            items,
            k,
            i,
            ii,
            j,
            jj,
            nes,
            es = [e],
            out = [];
        for (i = 0, ii = names.length; i < ii; i++) {
            nes = [];
            for (j = 0, jj = es.length; j < jj; j++) {
                e = es[j].n;
                items = [e[names[i]], e[wildcard]];
                k = 2;
                while (k--) {
                    item = items[k];
                    if (item) {
                        nes.push(item);
                        out = out.concat(item.f || []);
                    }
                }
            }
            es = nes;
        }
        return out;
    };
    
    
    eve.on = function (name, f) {
        var names = name.split(separator),
            e = events;
        for (var i = 0, ii = names.length; i < ii; i++) {
            e = e.n;
            !e[names[i]] && (e[names[i]] = {n: {}});
            e = e[names[i]];
        }
        e.f = e.f || [];
        for (i = 0, ii = e.f.length; i < ii; i++) if (e.f[i] == f) {
            return fun;
        }
        e.f.push(f);
        return function (zIndex) {
            if (+zIndex == +zIndex) {
                f.zIndex = +zIndex;
            }
        };
    };
    
    eve.stop = function () {
        stop = 1;
    };
    
    eve.nt = function (subname) {
        if (subname) {
            return new RegExp("(?:\\.|\\/|^)" + subname + "(?:\\.|\\/|$)").test(current_event);
        }
        return current_event;
    };
    
    
    eve.off = eve.unbind = function (name, f) {
        var names = name.split(separator),
            e,
            key,
            splice,
            i, ii, j, jj,
            cur = [events];
        for (i = 0, ii = names.length; i < ii; i++) {
            for (j = 0; j < cur.length; j += splice.length - 2) {
                splice = [j, 1];
                e = cur[j].n;
                if (names[i] != wildcard) {
                    if (e[names[i]]) {
                        splice.push(e[names[i]]);
                    }
                } else {
                    for (key in e) if (e[has](key)) {
                        splice.push(e[key]);
                    }
                }
                cur.splice.apply(cur, splice);
            }
        }
        for (i = 0, ii = cur.length; i < ii; i++) {
            e = cur[i];
            while (e.n) {
                if (f) {
                    if (e.f) {
                        for (j = 0, jj = e.f.length; j < jj; j++) if (e.f[j] == f) {
                            e.f.splice(j, 1);
                            break;
                        }
                        !e.f.length && delete e.f;
                    }
                    for (key in e.n) if (e.n[has](key) && e.n[key].f) {
                        var funcs = e.n[key].f;
                        for (j = 0, jj = funcs.length; j < jj; j++) if (funcs[j] == f) {
                            funcs.splice(j, 1);
                            break;
                        }
                        !funcs.length && delete e.n[key].f;
                    }
                } else {
                    delete e.f;
                    for (key in e.n) if (e.n[has](key) && e.n[key].f) {
                        delete e.n[key].f;
                    }
                }
                e = e.n;
            }
        }
    };
    
    eve.once = function (name, f) {
        var f2 = function () {
            var res = f.apply(this, arguments);
            eve.unbind(name, f2);
            return res;
        };
        return eve.on(name, f2);
    };
    
    eve.version = version;
    eve.toString = function () {
        return "You are running Eve " + version;
    };
    (typeof module != "undefined" && module.exports) ? (module.exports = eve) : (typeof define != "undefined" ? (define("eve", [], function() { return eve; })) : (glob.eve = eve));
})(this);


// ┌─────────────────────────────────────────────────────────────────────┐ \\
// │ "Raphaël 2.1.0" - JavaScript Vector Library                         │ \\
// ├─────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright (c) 2008-2011 Dmitry Baranovskiy (http://raphaeljs.com)   │ \\
// │ Copyright (c) 2008-2011 Sencha Labs (http://sencha.com)             │ \\
// │ Licensed under the MIT (http://raphaeljs.com/license.html) license. │ \\
// └─────────────────────────────────────────────────────────────────────┘ \\
(function () {
    
    function R(first) {
        if (R.is(first, "function")) {
            return loaded ? first() : eve.on("raphael.DOMload", first);
        } else if (R.is(first, array)) {
            return R._engine.create[apply](R, first.splice(0, 3 + R.is(first[0], nu))).add(first);
        } else {
            var args = Array.prototype.slice.call(arguments, 0);
            if (R.is(args[args.length - 1], "function")) {
                var f = args.pop();
                return loaded ? f.call(R._engine.create[apply](R, args)) : eve.on("raphael.DOMload", function () {
                    f.call(R._engine.create[apply](R, args));
                });
            } else {
                return R._engine.create[apply](R, arguments);
            }
        }
    }
    R.version = "2.1.0";
    R.eve = eve;
    var loaded,
        separator = /[, ]+/,
        elements = {circle: 1, rect: 1, path: 1, ellipse: 1, text: 1, image: 1},
        formatrg = /\{(\d+)\}/g,
        proto = "prototype",
        has = "hasOwnProperty",
        g = {
            doc: document,
            win: window
        },
        oldRaphael = {
            was: Object.prototype[has].call(g.win, "Raphael"),
            is: g.win.Raphael
        },
        Paper = function () {
            
            
            this.ca = this.customAttributes = {};
        },
        paperproto,
        appendChild = "appendChild",
        apply = "apply",
        concat = "concat",
        supportsTouch = "createTouch" in g.doc,
        E = "",
        S = " ",
        Str = String,
        split = "split",
        events = "click dblclick mousedown mousemove mouseout mouseover mouseup touchstart touchmove touchend touchcancel"[split](S),
        touchMap = {
            mousedown: "touchstart",
            mousemove: "touchmove",
            mouseup: "touchend"
        },
        lowerCase = Str.prototype.toLowerCase,
        math = Math,
        mmax = math.max,
        mmin = math.min,
        abs = math.abs,
        pow = math.pow,
        PI = math.PI,
        nu = "number",
        string = "string",
        array = "array",
        toString = "toString",
        fillString = "fill",
        objectToString = Object.prototype.toString,
        paper = {},
        push = "push",
        ISURL = R._ISURL = /^url\(['"]?([^\)]+?)['"]?\)$/i,
        colourRegExp = /^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgba?\(\s*([\d\.]+%?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+%?)?)\s*\)|hsba?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?)%?\s*\)|hsla?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?)%?\s*\))\s*$/i,
        isnan = {"NaN": 1, "Infinity": 1, "-Infinity": 1},
        bezierrg = /^(?:cubic-)?bezier\(([^,]+),([^,]+),([^,]+),([^\)]+)\)/,
        round = math.round,
        setAttribute = "setAttribute",
        toFloat = parseFloat,
        toInt = parseInt,
        upperCase = Str.prototype.toUpperCase,
        availableAttrs = R._availableAttrs = {
            "arrow-end": "none",
            "arrow-start": "none",
            blur: 0,
            "clip-rect": "0 0 1e9 1e9",
            cursor: "default",
            cx: 0,
            cy: 0,
            fill: "#fff",
            "fill-opacity": 1,
            font: '10px "Arial"',
            "font-family": '"Arial"',
            "font-size": "10",
            "font-style": "normal",
            "font-weight": 400,
            gradient: 0,
            height: 0,
            href: "http://raphaeljs.com/",
            "letter-spacing": 0,
            opacity: 1,
            path: "M0,0",
            r: 0,
            rx: 0,
            ry: 0,
            src: "",
            stroke: "#000",
            "stroke-dasharray": "",
            "stroke-linecap": "butt",
            "stroke-linejoin": "butt",
            "stroke-miterlimit": 0,
            "stroke-opacity": 1,
            "stroke-width": 1,
            target: "_blank",
            "text-anchor": "middle",
            title: "Raphael",
            transform: "",
            width: 0,
            x: 0,
            y: 0
        },
        availableAnimAttrs = R._availableAnimAttrs = {
            blur: nu,
            "clip-rect": "csv",
            cx: nu,
            cy: nu,
            fill: "colour",
            "fill-opacity": nu,
            "font-size": nu,
            height: nu,
            opacity: nu,
            path: "path",
            r: nu,
            rx: nu,
            ry: nu,
            stroke: "colour",
            "stroke-opacity": nu,
            "stroke-width": nu,
            transform: "transform",
            width: nu,
            x: nu,
            y: nu
        },
        whitespace = /[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]/g,
        commaSpaces = /[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*/,
        hsrg = {hs: 1, rg: 1},
        p2s = /,?([achlmqrstvxz]),?/gi,
        pathCommand = /([achlmrqstvz])[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*)+)/ig,
        tCommand = /([rstm])[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*)+)/ig,
        pathValues = /(-?\d*\.?\d*(?:e[\-+]?\d+)?)[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*/ig,
        radial_gradient = R._radial_gradient = /^r(?:\(([^,]+?)[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*([^\)]+?)\))?/,
        eldata = {},
        sortByKey = function (a, b) {
            return a.key - b.key;
        },
        sortByNumber = function (a, b) {
            return toFloat(a) - toFloat(b);
        },
        fun = function () {},
        pipe = function (x) {
            return x;
        },
        rectPath = R._rectPath = function (x, y, w, h, r) {
            if (r) {
                return [["M", x + r, y], ["l", w - r * 2, 0], ["a", r, r, 0, 0, 1, r, r], ["l", 0, h - r * 2], ["a", r, r, 0, 0, 1, -r, r], ["l", r * 2 - w, 0], ["a", r, r, 0, 0, 1, -r, -r], ["l", 0, r * 2 - h], ["a", r, r, 0, 0, 1, r, -r], ["z"]];
            }
            return [["M", x, y], ["l", w, 0], ["l", 0, h], ["l", -w, 0], ["z"]];
        },
        ellipsePath = function (x, y, rx, ry) {
            if (ry == null) {
                ry = rx;
            }
            return [["M", x, y], ["m", 0, -ry], ["a", rx, ry, 0, 1, 1, 0, 2 * ry], ["a", rx, ry, 0, 1, 1, 0, -2 * ry], ["z"]];
        },
        getPath = R._getPath = {
            path: function (el) {
                return el.attr("path");
            },
            circle: function (el) {
                var a = el.attrs;
                return ellipsePath(a.cx, a.cy, a.r);
            },
            ellipse: function (el) {
                var a = el.attrs;
                return ellipsePath(a.cx, a.cy, a.rx, a.ry);
            },
            rect: function (el) {
                var a = el.attrs;
                return rectPath(a.x, a.y, a.width, a.height, a.r);
            },
            image: function (el) {
                var a = el.attrs;
                return rectPath(a.x, a.y, a.width, a.height);
            },
            text: function (el) {
                var bbox = el._getBBox();
                return rectPath(bbox.x, bbox.y, bbox.width, bbox.height);
            }
        },
        
        mapPath = R.mapPath = function (path, matrix) {
            if (!matrix) {
                return path;
            }
            var x, y, i, j, ii, jj, pathi;
            path = path2curve(path);
            for (i = 0, ii = path.length; i < ii; i++) {
                pathi = path[i];
                for (j = 1, jj = pathi.length; j < jj; j += 2) {
                    x = matrix.x(pathi[j], pathi[j + 1]);
                    y = matrix.y(pathi[j], pathi[j + 1]);
                    pathi[j] = x;
                    pathi[j + 1] = y;
                }
            }
            return path;
        };

    R._g = g;
    
    R.type = (g.win.SVGAngle || g.doc.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1") ? "SVG" : "VML");
    if (R.type == "VML") {
        var d = g.doc.createElement("div"),
            b;
        d.innerHTML = '<v:shape adj="1"/>';
        b = d.firstChild;
        b.style.behavior = "url(#default#VML)";
        if (!(b && typeof b.adj == "object")) {
            return (R.type = E);
        }
        d = null;
    }
    
    
    R.svg = !(R.vml = R.type == "VML");
    R._Paper = Paper;
    
    R.fn = paperproto = Paper.prototype = R.prototype;
    R._id = 0;
    R._oid = 0;
    
    R.is = function (o, type) {
        type = lowerCase.call(type);
        if (type == "finite") {
            return !isnan[has](+o);
        }
        if (type == "array") {
            return o instanceof Array;
        }
        return  (type == "null" && o === null) ||
                (type == typeof o && o !== null) ||
                (type == "object" && o === Object(o)) ||
                (type == "array" && Array.isArray && Array.isArray(o)) ||
                objectToString.call(o).slice(8, -1).toLowerCase() == type;
    };

    function clone(obj) {
        if (Object(obj) !== obj) {
            return obj;
        }
        var res = new obj.constructor;
        for (var key in obj) if (obj[has](key)) {
            res[key] = clone(obj[key]);
        }
        return res;
    }

    
    R.angle = function (x1, y1, x2, y2, x3, y3) {
        if (x3 == null) {
            var x = x1 - x2,
                y = y1 - y2;
            if (!x && !y) {
                return 0;
            }
            return (180 + math.atan2(-y, -x) * 180 / PI + 360) % 360;
        } else {
            return R.angle(x1, y1, x3, y3) - R.angle(x2, y2, x3, y3);
        }
    };
    
    R.rad = function (deg) {
        return deg % 360 * PI / 180;
    };
    
    R.deg = function (rad) {
        return rad * 180 / PI % 360;
    };
    
    R.snapTo = function (values, value, tolerance) {
        tolerance = R.is(tolerance, "finite") ? tolerance : 10;
        if (R.is(values, array)) {
            var i = values.length;
            while (i--) if (abs(values[i] - value) <= tolerance) {
                return values[i];
            }
        } else {
            values = +values;
            var rem = value % values;
            if (rem < tolerance) {
                return value - rem;
            }
            if (rem > values - tolerance) {
                return value - rem + values;
            }
        }
        return value;
    };
    
    
    var createUUID = R.createUUID = (function (uuidRegEx, uuidReplacer) {
        return function () {
            return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(uuidRegEx, uuidReplacer).toUpperCase();
        };
    })(/[xy]/g, function (c) {
        var r = math.random() * 16 | 0,
            v = c == "x" ? r : (r & 3 | 8);
        return v.toString(16);
    });

    
    R.setWindow = function (newwin) {
        eve("raphael.setWindow", R, g.win, newwin);
        g.win = newwin;
        g.doc = g.win.document;
        if (R._engine.initWin) {
            R._engine.initWin(g.win);
        }
    };
    var toHex = function (color) {
        if (R.vml) {
            // http://dean.edwards.name/weblog/2009/10/convert-any-colour-value-to-hex-in-msie/
            var trim = /^\s+|\s+$/g;
            var bod;
            try {
                var docum = new ActiveXObject("htmlfile");
                docum.write("<body>");
                docum.close();
                bod = docum.body;
            } catch(e) {
                bod = createPopup().document.body;
            }
            var range = bod.createTextRange();
            toHex = cacher(function (color) {
                try {
                    bod.style.color = Str(color).replace(trim, E);
                    var value = range.queryCommandValue("ForeColor");
                    value = ((value & 255) << 16) | (value & 65280) | ((value & 16711680) >>> 16);
                    return "#" + ("000000" + value.toString(16)).slice(-6);
                } catch(e) {
                    return "none";
                }
            });
        } else {
            var i = g.doc.createElement("i");
            i.title = "Rapha\xebl Colour Picker";
            i.style.display = "none";
            g.doc.body.appendChild(i);
            toHex = cacher(function (color) {
                i.style.color = color;
                return g.doc.defaultView.getComputedStyle(i, E).getPropertyValue("color");
            });
        }
        return toHex(color);
    },
    hsbtoString = function () {
        return "hsb(" + [this.h, this.s, this.b] + ")";
    },
    hsltoString = function () {
        return "hsl(" + [this.h, this.s, this.l] + ")";
    },
    rgbtoString = function () {
        return this.hex;
    },
    prepareRGB = function (r, g, b) {
        if (g == null && R.is(r, "object") && "r" in r && "g" in r && "b" in r) {
            b = r.b;
            g = r.g;
            r = r.r;
        }
        if (g == null && R.is(r, string)) {
            var clr = R.getRGB(r);
            r = clr.r;
            g = clr.g;
            b = clr.b;
        }
        if (r > 1 || g > 1 || b > 1) {
            r /= 255;
            g /= 255;
            b /= 255;
        }
        
        return [r, g, b];
    },
    packageRGB = function (r, g, b, o) {
        r *= 255;
        g *= 255;
        b *= 255;
        var rgb = {
            r: r,
            g: g,
            b: b,
            hex: R.rgb(r, g, b),
            toString: rgbtoString
        };
        R.is(o, "finite") && (rgb.opacity = o);
        return rgb;
    };
    
    
    R.color = function (clr) {
        var rgb;
        if (R.is(clr, "object") && "h" in clr && "s" in clr && "b" in clr) {
            rgb = R.hsb2rgb(clr);
            clr.r = rgb.r;
            clr.g = rgb.g;
            clr.b = rgb.b;
            clr.hex = rgb.hex;
        } else if (R.is(clr, "object") && "h" in clr && "s" in clr && "l" in clr) {
            rgb = R.hsl2rgb(clr);
            clr.r = rgb.r;
            clr.g = rgb.g;
            clr.b = rgb.b;
            clr.hex = rgb.hex;
        } else {
            if (R.is(clr, "string")) {
                clr = R.getRGB(clr);
            }
            if (R.is(clr, "object") && "r" in clr && "g" in clr && "b" in clr) {
                rgb = R.rgb2hsl(clr);
                clr.h = rgb.h;
                clr.s = rgb.s;
                clr.l = rgb.l;
                rgb = R.rgb2hsb(clr);
                clr.v = rgb.b;
            } else {
                clr = {hex: "none"};
                clr.r = clr.g = clr.b = clr.h = clr.s = clr.v = clr.l = -1;
            }
        }
        clr.toString = rgbtoString;
        return clr;
    };
    
    R.hsb2rgb = function (h, s, v, o) {
        if (this.is(h, "object") && "h" in h && "s" in h && "b" in h) {
            v = h.b;
            s = h.s;
            h = h.h;
            o = h.o;
        }
        h *= 360;
        var R, G, B, X, C;
        h = (h % 360) / 60;
        C = v * s;
        X = C * (1 - abs(h % 2 - 1));
        R = G = B = v - C;

        h = ~~h;
        R += [C, X, 0, 0, X, C][h];
        G += [X, C, C, X, 0, 0][h];
        B += [0, 0, X, C, C, X][h];
        return packageRGB(R, G, B, o);
    };
    
    R.hsl2rgb = function (h, s, l, o) {
        if (this.is(h, "object") && "h" in h && "s" in h && "l" in h) {
            l = h.l;
            s = h.s;
            h = h.h;
        }
        if (h > 1 || s > 1 || l > 1) {
            h /= 360;
            s /= 100;
            l /= 100;
        }
        h *= 360;
        var R, G, B, X, C;
        h = (h % 360) / 60;
        C = 2 * s * (l < .5 ? l : 1 - l);
        X = C * (1 - abs(h % 2 - 1));
        R = G = B = l - C / 2;

        h = ~~h;
        R += [C, X, 0, 0, X, C][h];
        G += [X, C, C, X, 0, 0][h];
        B += [0, 0, X, C, C, X][h];
        return packageRGB(R, G, B, o);
    };
    
    R.rgb2hsb = function (r, g, b) {
        b = prepareRGB(r, g, b);
        r = b[0];
        g = b[1];
        b = b[2];

        var H, S, V, C;
        V = mmax(r, g, b);
        C = V - mmin(r, g, b);
        H = (C == 0 ? null :
             V == r ? (g - b) / C :
             V == g ? (b - r) / C + 2 :
                      (r - g) / C + 4
            );
        H = ((H + 360) % 6) * 60 / 360;
        S = C == 0 ? 0 : C / V;
        return {h: H, s: S, b: V, toString: hsbtoString};
    };
    
    R.rgb2hsl = function (r, g, b) {
        b = prepareRGB(r, g, b);
        r = b[0];
        g = b[1];
        b = b[2];

        var H, S, L, M, m, C;
        M = mmax(r, g, b);
        m = mmin(r, g, b);
        C = M - m;
        H = (C == 0 ? null :
             M == r ? (g - b) / C :
             M == g ? (b - r) / C + 2 :
                      (r - g) / C + 4);
        H = ((H + 360) % 6) * 60 / 360;
        L = (M + m) / 2;
        S = (C == 0 ? 0 :
             L < .5 ? C / (2 * L) :
                      C / (2 - 2 * L));
        return {h: H, s: S, l: L, toString: hsltoString};
    };
    R._path2string = function () {
        return this.join(",").replace(p2s, "$1");
    };
    function repush(array, item) {
        for (var i = 0, ii = array.length; i < ii; i++) if (array[i] === item) {
            return array.push(array.splice(i, 1)[0]);
        }
    }
    function cacher(f, scope, postprocessor) {
        function newf() {
            var arg = Array.prototype.slice.call(arguments, 0),
                args = arg.join("\u2400"),
                cache = newf.cache = newf.cache || {},
                count = newf.count = newf.count || [];
            if (cache[has](args)) {
                repush(count, args);
                return postprocessor ? postprocessor(cache[args]) : cache[args];
            }
            count.length >= 1e3 && delete cache[count.shift()];
            count.push(args);
            cache[args] = f[apply](scope, arg);
            return postprocessor ? postprocessor(cache[args]) : cache[args];
        }
        return newf;
    }

    var preload = R._preload = function (src, f) {
        var img = g.doc.createElement("img");
        img.style.cssText = "position:absolute;left:-9999em;top:-9999em";
        img.onload = function () {
            f.call(this);
            this.onload = null;
            g.doc.body.removeChild(this);
        };
        img.onerror = function () {
            g.doc.body.removeChild(this);
        };
        g.doc.body.appendChild(img);
        img.src = src;
    };
    
    function clrToString() {
        return this.hex;
    }

    
    R.getRGB = cacher(function (colour) {
        if (!colour || !!((colour = Str(colour)).indexOf("-") + 1)) {
            return {r: -1, g: -1, b: -1, hex: "none", error: 1, toString: clrToString};
        }
        if (colour == "none") {
            return {r: -1, g: -1, b: -1, hex: "none", toString: clrToString};
        }
        !(hsrg[has](colour.toLowerCase().substring(0, 2)) || colour.charAt() == "#") && (colour = toHex(colour));
        var res,
            red,
            green,
            blue,
            opacity,
            t,
            values,
            rgb = colour.match(colourRegExp);
        if (rgb) {
            if (rgb[2]) {
                blue = toInt(rgb[2].substring(5), 16);
                green = toInt(rgb[2].substring(3, 5), 16);
                red = toInt(rgb[2].substring(1, 3), 16);
            }
            if (rgb[3]) {
                blue = toInt((t = rgb[3].charAt(3)) + t, 16);
                green = toInt((t = rgb[3].charAt(2)) + t, 16);
                red = toInt((t = rgb[3].charAt(1)) + t, 16);
            }
            if (rgb[4]) {
                values = rgb[4][split](commaSpaces);
                red = toFloat(values[0]);
                values[0].slice(-1) == "%" && (red *= 2.55);
                green = toFloat(values[1]);
                values[1].slice(-1) == "%" && (green *= 2.55);
                blue = toFloat(values[2]);
                values[2].slice(-1) == "%" && (blue *= 2.55);
                rgb[1].toLowerCase().slice(0, 4) == "rgba" && (opacity = toFloat(values[3]));
                values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
            }
            if (rgb[5]) {
                values = rgb[5][split](commaSpaces);
                red = toFloat(values[0]);
                values[0].slice(-1) == "%" && (red *= 2.55);
                green = toFloat(values[1]);
                values[1].slice(-1) == "%" && (green *= 2.55);
                blue = toFloat(values[2]);
                values[2].slice(-1) == "%" && (blue *= 2.55);
                (values[0].slice(-3) == "deg" || values[0].slice(-1) == "\xb0") && (red /= 360);
                rgb[1].toLowerCase().slice(0, 4) == "hsba" && (opacity = toFloat(values[3]));
                values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
                return R.hsb2rgb(red, green, blue, opacity);
            }
            if (rgb[6]) {
                values = rgb[6][split](commaSpaces);
                red = toFloat(values[0]);
                values[0].slice(-1) == "%" && (red *= 2.55);
                green = toFloat(values[1]);
                values[1].slice(-1) == "%" && (green *= 2.55);
                blue = toFloat(values[2]);
                values[2].slice(-1) == "%" && (blue *= 2.55);
                (values[0].slice(-3) == "deg" || values[0].slice(-1) == "\xb0") && (red /= 360);
                rgb[1].toLowerCase().slice(0, 4) == "hsla" && (opacity = toFloat(values[3]));
                values[3] && values[3].slice(-1) == "%" && (opacity /= 100);
                return R.hsl2rgb(red, green, blue, opacity);
            }
            rgb = {r: red, g: green, b: blue, toString: clrToString};
            rgb.hex = "#" + (16777216 | blue | (green << 8) | (red << 16)).toString(16).slice(1);
            R.is(opacity, "finite") && (rgb.opacity = opacity);
            return rgb;
        }
        return {r: -1, g: -1, b: -1, hex: "none", error: 1, toString: clrToString};
    }, R);
    
    R.hsb = cacher(function (h, s, b) {
        return R.hsb2rgb(h, s, b).hex;
    });
    
    R.hsl = cacher(function (h, s, l) {
        return R.hsl2rgb(h, s, l).hex;
    });
    
    R.rgb = cacher(function (r, g, b) {
        return "#" + (16777216 | b | (g << 8) | (r << 16)).toString(16).slice(1);
    });
    
    R.getColor = function (value) {
        var start = this.getColor.start = this.getColor.start || {h: 0, s: 1, b: value || .75},
            rgb = this.hsb2rgb(start.h, start.s, start.b);
        start.h += .075;
        if (start.h > 1) {
            start.h = 0;
            start.s -= .2;
            start.s <= 0 && (this.getColor.start = {h: 0, s: 1, b: start.b});
        }
        return rgb.hex;
    };
    
    R.getColor.reset = function () {
        delete this.start;
    };

    // http://schepers.cc/getting-to-the-point
    function catmullRom2bezier(crp, z) {
        var d = [];
        for (var i = 0, iLen = crp.length; iLen - 2 * !z > i; i += 2) {
            var p = [
                        {x: +crp[i - 2], y: +crp[i - 1]},
                        {x: +crp[i],     y: +crp[i + 1]},
                        {x: +crp[i + 2], y: +crp[i + 3]},
                        {x: +crp[i + 4], y: +crp[i + 5]}
                    ];
            if (z) {
                if (!i) {
                    p[0] = {x: +crp[iLen - 2], y: +crp[iLen - 1]};
                } else if (iLen - 4 == i) {
                    p[3] = {x: +crp[0], y: +crp[1]};
                } else if (iLen - 2 == i) {
                    p[2] = {x: +crp[0], y: +crp[1]};
                    p[3] = {x: +crp[2], y: +crp[3]};
                }
            } else {
                if (iLen - 4 == i) {
                    p[3] = p[2];
                } else if (!i) {
                    p[0] = {x: +crp[i], y: +crp[i + 1]};
                }
            }
            d.push(["C",
                  (-p[0].x + 6 * p[1].x + p[2].x) / 6,
                  (-p[0].y + 6 * p[1].y + p[2].y) / 6,
                  (p[1].x + 6 * p[2].x - p[3].x) / 6,
                  (p[1].y + 6*p[2].y - p[3].y) / 6,
                  p[2].x,
                  p[2].y
            ]);
        }

        return d;
    }
    
    R.parsePathString = function (pathString) {
        if (!pathString) {
            return null;
        }
        var pth = paths(pathString);
        if (pth.arr) {
            return pathClone(pth.arr);
        }
        
        var paramCounts = {a: 7, c: 6, h: 1, l: 2, m: 2, r: 4, q: 4, s: 4, t: 2, v: 1, z: 0},
            data = [];
        if (R.is(pathString, array) && R.is(pathString[0], array)) { // rough assumption
            data = pathClone(pathString);
        }
        if (!data.length) {
            Str(pathString).replace(pathCommand, function (a, b, c) {
                var params = [],
                    name = b.toLowerCase();
                c.replace(pathValues, function (a, b) {
                    b && params.push(+b);
                });
                if (name == "m" && params.length > 2) {
                    data.push([b][concat](params.splice(0, 2)));
                    name = "l";
                    b = b == "m" ? "l" : "L";
                }
                if (name == "r") {
                    data.push([b][concat](params));
                } else while (params.length >= paramCounts[name]) {
                    data.push([b][concat](params.splice(0, paramCounts[name])));
                    if (!paramCounts[name]) {
                        break;
                    }
                }
            });
        }
        data.toString = R._path2string;
        pth.arr = pathClone(data);
        return data;
    };
    
    R.parseTransformString = cacher(function (TString) {
        if (!TString) {
            return null;
        }
        var paramCounts = {r: 3, s: 4, t: 2, m: 6},
            data = [];
        if (R.is(TString, array) && R.is(TString[0], array)) { // rough assumption
            data = pathClone(TString);
        }
        if (!data.length) {
            Str(TString).replace(tCommand, function (a, b, c) {
                var params = [],
                    name = lowerCase.call(b);
                c.replace(pathValues, function (a, b) {
                    b && params.push(+b);
                });
                data.push([b][concat](params));
            });
        }
        data.toString = R._path2string;
        return data;
    });
    // PATHS
    var paths = function (ps) {
        var p = paths.ps = paths.ps || {};
        if (p[ps]) {
            p[ps].sleep = 100;
        } else {
            p[ps] = {
                sleep: 100
            };
        }
        setTimeout(function () {
            for (var key in p) if (p[has](key) && key != ps) {
                p[key].sleep--;
                !p[key].sleep && delete p[key];
            }
        });
        return p[ps];
    };
    
    R.findDotsAtSegment = function (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) {
        var t1 = 1 - t,
            t13 = pow(t1, 3),
            t12 = pow(t1, 2),
            t2 = t * t,
            t3 = t2 * t,
            x = t13 * p1x + t12 * 3 * t * c1x + t1 * 3 * t * t * c2x + t3 * p2x,
            y = t13 * p1y + t12 * 3 * t * c1y + t1 * 3 * t * t * c2y + t3 * p2y,
            mx = p1x + 2 * t * (c1x - p1x) + t2 * (c2x - 2 * c1x + p1x),
            my = p1y + 2 * t * (c1y - p1y) + t2 * (c2y - 2 * c1y + p1y),
            nx = c1x + 2 * t * (c2x - c1x) + t2 * (p2x - 2 * c2x + c1x),
            ny = c1y + 2 * t * (c2y - c1y) + t2 * (p2y - 2 * c2y + c1y),
            ax = t1 * p1x + t * c1x,
            ay = t1 * p1y + t * c1y,
            cx = t1 * c2x + t * p2x,
            cy = t1 * c2y + t * p2y,
            alpha = (90 - math.atan2(mx - nx, my - ny) * 180 / PI);
        (mx > nx || my < ny) && (alpha += 180);
        return {
            x: x,
            y: y,
            m: {x: mx, y: my},
            n: {x: nx, y: ny},
            start: {x: ax, y: ay},
            end: {x: cx, y: cy},
            alpha: alpha
        };
    };
    
    R.bezierBBox = function (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y) {
        if (!R.is(p1x, "array")) {
            p1x = [p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y];
        }
        var bbox = curveDim.apply(null, p1x);
        return {
            x: bbox.min.x,
            y: bbox.min.y,
            x2: bbox.max.x,
            y2: bbox.max.y,
            width: bbox.max.x - bbox.min.x,
            height: bbox.max.y - bbox.min.y
        };
    };
    
    R.isPointInsideBBox = function (bbox, x, y) {
        return x >= bbox.x && x <= bbox.x2 && y >= bbox.y && y <= bbox.y2;
    };
    
    R.isBBoxIntersect = function (bbox1, bbox2) {
        var i = R.isPointInsideBBox;
        return i(bbox2, bbox1.x, bbox1.y)
            || i(bbox2, bbox1.x2, bbox1.y)
            || i(bbox2, bbox1.x, bbox1.y2)
            || i(bbox2, bbox1.x2, bbox1.y2)
            || i(bbox1, bbox2.x, bbox2.y)
            || i(bbox1, bbox2.x2, bbox2.y)
            || i(bbox1, bbox2.x, bbox2.y2)
            || i(bbox1, bbox2.x2, bbox2.y2)
            || (bbox1.x < bbox2.x2 && bbox1.x > bbox2.x || bbox2.x < bbox1.x2 && bbox2.x > bbox1.x)
            && (bbox1.y < bbox2.y2 && bbox1.y > bbox2.y || bbox2.y < bbox1.y2 && bbox2.y > bbox1.y);
    };
    function base3(t, p1, p2, p3, p4) {
        var t1 = -3 * p1 + 9 * p2 - 9 * p3 + 3 * p4,
            t2 = t * t1 + 6 * p1 - 12 * p2 + 6 * p3;
        return t * t2 - 3 * p1 + 3 * p2;
    }
    function bezlen(x1, y1, x2, y2, x3, y3, x4, y4, z) {
        if (z == null) {
            z = 1;
        }
        z = z > 1 ? 1 : z < 0 ? 0 : z;
        var z2 = z / 2,
            n = 12,
            Tvalues = [-0.1252,0.1252,-0.3678,0.3678,-0.5873,0.5873,-0.7699,0.7699,-0.9041,0.9041,-0.9816,0.9816],
            Cvalues = [0.2491,0.2491,0.2335,0.2335,0.2032,0.2032,0.1601,0.1601,0.1069,0.1069,0.0472,0.0472],
            sum = 0;
        for (var i = 0; i < n; i++) {
            var ct = z2 * Tvalues[i] + z2,
                xbase = base3(ct, x1, x2, x3, x4),
                ybase = base3(ct, y1, y2, y3, y4),
                comb = xbase * xbase + ybase * ybase;
            sum += Cvalues[i] * math.sqrt(comb);
        }
        return z2 * sum;
    }
    function getTatLen(x1, y1, x2, y2, x3, y3, x4, y4, ll) {
        if (ll < 0 || bezlen(x1, y1, x2, y2, x3, y3, x4, y4) < ll) {
            return;
        }
        var t = 1,
            step = t / 2,
            t2 = t - step,
            l,
            e = .01;
        l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
        while (abs(l - ll) > e) {
            step /= 2;
            t2 += (l < ll ? 1 : -1) * step;
            l = bezlen(x1, y1, x2, y2, x3, y3, x4, y4, t2);
        }
        return t2;
    }
    function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {
        if (
            mmax(x1, x2) < mmin(x3, x4) ||
            mmin(x1, x2) > mmax(x3, x4) ||
            mmax(y1, y2) < mmin(y3, y4) ||
            mmin(y1, y2) > mmax(y3, y4)
        ) {
            return;
        }
        var nx = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4),
            ny = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4),
            denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

        if (!denominator) {
            return;
        }
        var px = nx / denominator,
            py = ny / denominator,
            px2 = +px.toFixed(2),
            py2 = +py.toFixed(2);
        if (
            px2 < +mmin(x1, x2).toFixed(2) ||
            px2 > +mmax(x1, x2).toFixed(2) ||
            px2 < +mmin(x3, x4).toFixed(2) ||
            px2 > +mmax(x3, x4).toFixed(2) ||
            py2 < +mmin(y1, y2).toFixed(2) ||
            py2 > +mmax(y1, y2).toFixed(2) ||
            py2 < +mmin(y3, y4).toFixed(2) ||
            py2 > +mmax(y3, y4).toFixed(2)
        ) {
            return;
        }
        return {x: px, y: py};
    }
    function inter(bez1, bez2) {
        return interHelper(bez1, bez2);
    }
    function interCount(bez1, bez2) {
        return interHelper(bez1, bez2, 1);
    }
    function interHelper(bez1, bez2, justCount) {
        var bbox1 = R.bezierBBox(bez1),
            bbox2 = R.bezierBBox(bez2);
        if (!R.isBBoxIntersect(bbox1, bbox2)) {
            return justCount ? 0 : [];
        }
        var l1 = bezlen.apply(0, bez1),
            l2 = bezlen.apply(0, bez2),
            n1 = ~~(l1 / 5),
            n2 = ~~(l2 / 5),
            dots1 = [],
            dots2 = [],
            xy = {},
            res = justCount ? 0 : [];
        for (var i = 0; i < n1 + 1; i++) {
            var p = R.findDotsAtSegment.apply(R, bez1.concat(i / n1));
            dots1.push({x: p.x, y: p.y, t: i / n1});
        }
        for (i = 0; i < n2 + 1; i++) {
            p = R.findDotsAtSegment.apply(R, bez2.concat(i / n2));
            dots2.push({x: p.x, y: p.y, t: i / n2});
        }
        for (i = 0; i < n1; i++) {
            for (var j = 0; j < n2; j++) {
                var di = dots1[i],
                    di1 = dots1[i + 1],
                    dj = dots2[j],
                    dj1 = dots2[j + 1],
                    ci = abs(di1.x - di.x) < .001 ? "y" : "x",
                    cj = abs(dj1.x - dj.x) < .001 ? "y" : "x",
                    is = intersect(di.x, di.y, di1.x, di1.y, dj.x, dj.y, dj1.x, dj1.y);
                if (is) {
                    if (xy[is.x.toFixed(4)] == is.y.toFixed(4)) {
                        continue;
                    }
                    xy[is.x.toFixed(4)] = is.y.toFixed(4);
                    var t1 = di.t + abs((is[ci] - di[ci]) / (di1[ci] - di[ci])) * (di1.t - di.t),
                        t2 = dj.t + abs((is[cj] - dj[cj]) / (dj1[cj] - dj[cj])) * (dj1.t - dj.t);
                    if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {
                        if (justCount) {
                            res++;
                        } else {
                            res.push({
                                x: is.x,
                                y: is.y,
                                t1: t1,
                                t2: t2
                            });
                        }
                    }
                }
            }
        }
        return res;
    }
    
    R.pathIntersection = function (path1, path2) {
        return interPathHelper(path1, path2);
    };
    R.pathIntersectionNumber = function (path1, path2) {
        return interPathHelper(path1, path2, 1);
    };
    function interPathHelper(path1, path2, justCount) {
        path1 = R._path2curve(path1);
        path2 = R._path2curve(path2);
        var x1, y1, x2, y2, x1m, y1m, x2m, y2m, bez1, bez2,
            res = justCount ? 0 : [];
        for (var i = 0, ii = path1.length; i < ii; i++) {
            var pi = path1[i];
            if (pi[0] == "M") {
                x1 = x1m = pi[1];
                y1 = y1m = pi[2];
            } else {
                if (pi[0] == "C") {
                    bez1 = [x1, y1].concat(pi.slice(1));
                    x1 = bez1[6];
                    y1 = bez1[7];
                } else {
                    bez1 = [x1, y1, x1, y1, x1m, y1m, x1m, y1m];
                    x1 = x1m;
                    y1 = y1m;
                }
                for (var j = 0, jj = path2.length; j < jj; j++) {
                    var pj = path2[j];
                    if (pj[0] == "M") {
                        x2 = x2m = pj[1];
                        y2 = y2m = pj[2];
                    } else {
                        if (pj[0] == "C") {
                            bez2 = [x2, y2].concat(pj.slice(1));
                            x2 = bez2[6];
                            y2 = bez2[7];
                        } else {
                            bez2 = [x2, y2, x2, y2, x2m, y2m, x2m, y2m];
                            x2 = x2m;
                            y2 = y2m;
                        }
                        var intr = interHelper(bez1, bez2, justCount);
                        if (justCount) {
                            res += intr;
                        } else {
                            for (var k = 0, kk = intr.length; k < kk; k++) {
                                intr[k].segment1 = i;
                                intr[k].segment2 = j;
                                intr[k].bez1 = bez1;
                                intr[k].bez2 = bez2;
                            }
                            res = res.concat(intr);
                        }
                    }
                }
            }
        }
        return res;
    }
    
    R.isPointInsidePath = function (path, x, y) {
        var bbox = R.pathBBox(path);
        return R.isPointInsideBBox(bbox, x, y) &&
               interPathHelper(path, [["M", x, y], ["H", bbox.x2 + 10]], 1) % 2 == 1;
    };
    R._removedFactory = function (methodname) {
        return function () {
            eve("raphael.log", null, "Rapha\xebl: you are calling to method \u201c" + methodname + "\u201d of removed object", methodname);
        };
    };
    
    var pathDimensions = R.pathBBox = function (path) {
        var pth = paths(path);
        if (pth.bbox) {
            return pth.bbox;
        }
        if (!path) {
            return {x: 0, y: 0, width: 0, height: 0, x2: 0, y2: 0};
        }
        path = path2curve(path);
        var x = 0, 
            y = 0,
            X = [],
            Y = [],
            p;
        for (var i = 0, ii = path.length; i < ii; i++) {
            p = path[i];
            if (p[0] == "M") {
                x = p[1];
                y = p[2];
                X.push(x);
                Y.push(y);
            } else {
                var dim = curveDim(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
                X = X[concat](dim.min.x, dim.max.x);
                Y = Y[concat](dim.min.y, dim.max.y);
                x = p[5];
                y = p[6];
            }
        }
        var xmin = mmin[apply](0, X),
            ymin = mmin[apply](0, Y),
            xmax = mmax[apply](0, X),
            ymax = mmax[apply](0, Y),
            bb = {
                x: xmin,
                y: ymin,
                x2: xmax,
                y2: ymax,
                width: xmax - xmin,
                height: ymax - ymin
            };
        pth.bbox = clone(bb);
        return bb;
    },
        pathClone = function (pathArray) {
            var res = clone(pathArray);
            res.toString = R._path2string;
            return res;
        },
        pathToRelative = R._pathToRelative = function (pathArray) {
            var pth = paths(pathArray);
            if (pth.rel) {
                return pathClone(pth.rel);
            }
            if (!R.is(pathArray, array) || !R.is(pathArray && pathArray[0], array)) { // rough assumption
                pathArray = R.parsePathString(pathArray);
            }
            var res = [],
                x = 0,
                y = 0,
                mx = 0,
                my = 0,
                start = 0;
            if (pathArray[0][0] == "M") {
                x = pathArray[0][1];
                y = pathArray[0][2];
                mx = x;
                my = y;
                start++;
                res.push(["M", x, y]);
            }
            for (var i = start, ii = pathArray.length; i < ii; i++) {
                var r = res[i] = [],
                    pa = pathArray[i];
                if (pa[0] != lowerCase.call(pa[0])) {
                    r[0] = lowerCase.call(pa[0]);
                    switch (r[0]) {
                        case "a":
                            r[1] = pa[1];
                            r[2] = pa[2];
                            r[3] = pa[3];
                            r[4] = pa[4];
                            r[5] = pa[5];
                            r[6] = +(pa[6] - x).toFixed(3);
                            r[7] = +(pa[7] - y).toFixed(3);
                            break;
                        case "v":
                            r[1] = +(pa[1] - y).toFixed(3);
                            break;
                        case "m":
                            mx = pa[1];
                            my = pa[2];
                        default:
                            for (var j = 1, jj = pa.length; j < jj; j++) {
                                r[j] = +(pa[j] - ((j % 2) ? x : y)).toFixed(3);
                            }
                    }
                } else {
                    r = res[i] = [];
                    if (pa[0] == "m") {
                        mx = pa[1] + x;
                        my = pa[2] + y;
                    }
                    for (var k = 0, kk = pa.length; k < kk; k++) {
                        res[i][k] = pa[k];
                    }
                }
                var len = res[i].length;
                switch (res[i][0]) {
                    case "z":
                        x = mx;
                        y = my;
                        break;
                    case "h":
                        x += +res[i][len - 1];
                        break;
                    case "v":
                        y += +res[i][len - 1];
                        break;
                    default:
                        x += +res[i][len - 2];
                        y += +res[i][len - 1];
                }
            }
            res.toString = R._path2string;
            pth.rel = pathClone(res);
            return res;
        },
        pathToAbsolute = R._pathToAbsolute = function (pathArray) {
            var pth = paths(pathArray);
            if (pth.abs) {
                return pathClone(pth.abs);
            }
            if (!R.is(pathArray, array) || !R.is(pathArray && pathArray[0], array)) { // rough assumption
                pathArray = R.parsePathString(pathArray);
            }
            if (!pathArray || !pathArray.length) {
                return [["M", 0, 0]];
            }
            var res = [],
                x = 0,
                y = 0,
                mx = 0,
                my = 0,
                start = 0;
            if (pathArray[0][0] == "M") {
                x = +pathArray[0][1];
                y = +pathArray[0][2];
                mx = x;
                my = y;
                start++;
                res[0] = ["M", x, y];
            }
            var crz = pathArray.length == 3 && pathArray[0][0] == "M" && pathArray[1][0].toUpperCase() == "R" && pathArray[2][0].toUpperCase() == "Z";
            for (var r, pa, i = start, ii = pathArray.length; i < ii; i++) {
                res.push(r = []);
                pa = pathArray[i];
                if (pa[0] != upperCase.call(pa[0])) {
                    r[0] = upperCase.call(pa[0]);
                    switch (r[0]) {
                        case "A":
                            r[1] = pa[1];
                            r[2] = pa[2];
                            r[3] = pa[3];
                            r[4] = pa[4];
                            r[5] = pa[5];
                            r[6] = +(pa[6] + x);
                            r[7] = +(pa[7] + y);
                            break;
                        case "V":
                            r[1] = +pa[1] + y;
                            break;
                        case "H":
                            r[1] = +pa[1] + x;
                            break;
                        case "R":
                            var dots = [x, y][concat](pa.slice(1));
                            for (var j = 2, jj = dots.length; j < jj; j++) {
                                dots[j] = +dots[j] + x;
                                dots[++j] = +dots[j] + y;
                            }
                            res.pop();
                            res = res[concat](catmullRom2bezier(dots, crz));
                            break;
                        case "M":
                            mx = +pa[1] + x;
                            my = +pa[2] + y;
                        default:
                            for (j = 1, jj = pa.length; j < jj; j++) {
                                r[j] = +pa[j] + ((j % 2) ? x : y);
                            }
                    }
                } else if (pa[0] == "R") {
                    dots = [x, y][concat](pa.slice(1));
                    res.pop();
                    res = res[concat](catmullRom2bezier(dots, crz));
                    r = ["R"][concat](pa.slice(-2));
                } else {
                    for (var k = 0, kk = pa.length; k < kk; k++) {
                        r[k] = pa[k];
                    }
                }
                switch (r[0]) {
                    case "Z":
                        x = mx;
                        y = my;
                        break;
                    case "H":
                        x = r[1];
                        break;
                    case "V":
                        y = r[1];
                        break;
                    case "M":
                        mx = r[r.length - 2];
                        my = r[r.length - 1];
                    default:
                        x = r[r.length - 2];
                        y = r[r.length - 1];
                }
            }
            res.toString = R._path2string;
            pth.abs = pathClone(res);
            return res;
        },
        l2c = function (x1, y1, x2, y2) {
            return [x1, y1, x2, y2, x2, y2];
        },
        q2c = function (x1, y1, ax, ay, x2, y2) {
            var _13 = 1 / 3,
                _23 = 2 / 3;
            return [
                    _13 * x1 + _23 * ax,
                    _13 * y1 + _23 * ay,
                    _13 * x2 + _23 * ax,
                    _13 * y2 + _23 * ay,
                    x2,
                    y2
                ];
        },
        a2c = function (x1, y1, rx, ry, angle, large_arc_flag, sweep_flag, x2, y2, recursive) {
            // for more information of where this math came from visit:
            // http://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
            var _120 = PI * 120 / 180,
                rad = PI / 180 * (+angle || 0),
                res = [],
                xy,
                rotate = cacher(function (x, y, rad) {
                    var X = x * math.cos(rad) - y * math.sin(rad),
                        Y = x * math.sin(rad) + y * math.cos(rad);
                    return {x: X, y: Y};
                });
            if (!recursive) {
                xy = rotate(x1, y1, -rad);
                x1 = xy.x;
                y1 = xy.y;
                xy = rotate(x2, y2, -rad);
                x2 = xy.x;
                y2 = xy.y;
                var cos = math.cos(PI / 180 * angle),
                    sin = math.sin(PI / 180 * angle),
                    x = (x1 - x2) / 2,
                    y = (y1 - y2) / 2;
                var h = (x * x) / (rx * rx) + (y * y) / (ry * ry);
                if (h > 1) {
                    h = math.sqrt(h);
                    rx = h * rx;
                    ry = h * ry;
                }
                var rx2 = rx * rx,
                    ry2 = ry * ry,
                    k = (large_arc_flag == sweep_flag ? -1 : 1) *
                        math.sqrt(abs((rx2 * ry2 - rx2 * y * y - ry2 * x * x) / (rx2 * y * y + ry2 * x * x))),
                    cx = k * rx * y / ry + (x1 + x2) / 2,
                    cy = k * -ry * x / rx + (y1 + y2) / 2,
                    f1 = math.asin(((y1 - cy) / ry).toFixed(9)),
                    f2 = math.asin(((y2 - cy) / ry).toFixed(9));

                f1 = x1 < cx ? PI - f1 : f1;
                f2 = x2 < cx ? PI - f2 : f2;
                f1 < 0 && (f1 = PI * 2 + f1);
                f2 < 0 && (f2 = PI * 2 + f2);
                if (sweep_flag && f1 > f2) {
                    f1 = f1 - PI * 2;
                }
                if (!sweep_flag && f2 > f1) {
                    f2 = f2 - PI * 2;
                }
            } else {
                f1 = recursive[0];
                f2 = recursive[1];
                cx = recursive[2];
                cy = recursive[3];
            }
            var df = f2 - f1;
            if (abs(df) > _120) {
                var f2old = f2,
                    x2old = x2,
                    y2old = y2;
                f2 = f1 + _120 * (sweep_flag && f2 > f1 ? 1 : -1);
                x2 = cx + rx * math.cos(f2);
                y2 = cy + ry * math.sin(f2);
                res = a2c(x2, y2, rx, ry, angle, 0, sweep_flag, x2old, y2old, [f2, f2old, cx, cy]);
            }
            df = f2 - f1;
            var c1 = math.cos(f1),
                s1 = math.sin(f1),
                c2 = math.cos(f2),
                s2 = math.sin(f2),
                t = math.tan(df / 4),
                hx = 4 / 3 * rx * t,
                hy = 4 / 3 * ry * t,
                m1 = [x1, y1],
                m2 = [x1 + hx * s1, y1 - hy * c1],
                m3 = [x2 + hx * s2, y2 - hy * c2],
                m4 = [x2, y2];
            m2[0] = 2 * m1[0] - m2[0];
            m2[1] = 2 * m1[1] - m2[1];
            if (recursive) {
                return [m2, m3, m4][concat](res);
            } else {
                res = [m2, m3, m4][concat](res).join()[split](",");
                var newres = [];
                for (var i = 0, ii = res.length; i < ii; i++) {
                    newres[i] = i % 2 ? rotate(res[i - 1], res[i], rad).y : rotate(res[i], res[i + 1], rad).x;
                }
                return newres;
            }
        },
        findDotAtSegment = function (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) {
            var t1 = 1 - t;
            return {
                x: pow(t1, 3) * p1x + pow(t1, 2) * 3 * t * c1x + t1 * 3 * t * t * c2x + pow(t, 3) * p2x,
                y: pow(t1, 3) * p1y + pow(t1, 2) * 3 * t * c1y + t1 * 3 * t * t * c2y + pow(t, 3) * p2y
            };
        },
        curveDim = cacher(function (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y) {
            var a = (c2x - 2 * c1x + p1x) - (p2x - 2 * c2x + c1x),
                b = 2 * (c1x - p1x) - 2 * (c2x - c1x),
                c = p1x - c1x,
                t1 = (-b + math.sqrt(b * b - 4 * a * c)) / 2 / a,
                t2 = (-b - math.sqrt(b * b - 4 * a * c)) / 2 / a,
                y = [p1y, p2y],
                x = [p1x, p2x],
                dot;
            abs(t1) > "1e12" && (t1 = .5);
            abs(t2) > "1e12" && (t2 = .5);
            if (t1 > 0 && t1 < 1) {
                dot = findDotAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t1);
                x.push(dot.x);
                y.push(dot.y);
            }
            if (t2 > 0 && t2 < 1) {
                dot = findDotAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t2);
                x.push(dot.x);
                y.push(dot.y);
            }
            a = (c2y - 2 * c1y + p1y) - (p2y - 2 * c2y + c1y);
            b = 2 * (c1y - p1y) - 2 * (c2y - c1y);
            c = p1y - c1y;
            t1 = (-b + math.sqrt(b * b - 4 * a * c)) / 2 / a;
            t2 = (-b - math.sqrt(b * b - 4 * a * c)) / 2 / a;
            abs(t1) > "1e12" && (t1 = .5);
            abs(t2) > "1e12" && (t2 = .5);
            if (t1 > 0 && t1 < 1) {
                dot = findDotAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t1);
                x.push(dot.x);
                y.push(dot.y);
            }
            if (t2 > 0 && t2 < 1) {
                dot = findDotAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t2);
                x.push(dot.x);
                y.push(dot.y);
            }
            return {
                min: {x: mmin[apply](0, x), y: mmin[apply](0, y)},
                max: {x: mmax[apply](0, x), y: mmax[apply](0, y)}
            };
        }),
        path2curve = R._path2curve = cacher(function (path, path2) {
            var pth = !path2 && paths(path);
            if (!path2 && pth.curve) {
                return pathClone(pth.curve);
            }
            var p = pathToAbsolute(path),
                p2 = path2 && pathToAbsolute(path2),
                attrs = {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null},
                attrs2 = {x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null},
                processPath = function (path, d) {
                    var nx, ny;
                    if (!path) {
                        return ["C", d.x, d.y, d.x, d.y, d.x, d.y];
                    }
                    !(path[0] in {T:1, Q:1}) && (d.qx = d.qy = null);
                    switch (path[0]) {
                        case "M":
                            d.X = path[1];
                            d.Y = path[2];
                            break;
                        case "A":
                            path = ["C"][concat](a2c[apply](0, [d.x, d.y][concat](path.slice(1))));
                            break;
                        case "S":
                            nx = d.x + (d.x - (d.bx || d.x));
                            ny = d.y + (d.y - (d.by || d.y));
                            path = ["C", nx, ny][concat](path.slice(1));
                            break;
                        case "T":
                            d.qx = d.x + (d.x - (d.qx || d.x));
                            d.qy = d.y + (d.y - (d.qy || d.y));
                            path = ["C"][concat](q2c(d.x, d.y, d.qx, d.qy, path[1], path[2]));
                            break;
                        case "Q":
                            d.qx = path[1];
                            d.qy = path[2];
                            path = ["C"][concat](q2c(d.x, d.y, path[1], path[2], path[3], path[4]));
                            break;
                        case "L":
                            path = ["C"][concat](l2c(d.x, d.y, path[1], path[2]));
                            break;
                        case "H":
                            path = ["C"][concat](l2c(d.x, d.y, path[1], d.y));
                            break;
                        case "V":
                            path = ["C"][concat](l2c(d.x, d.y, d.x, path[1]));
                            break;
                        case "Z":
                            path = ["C"][concat](l2c(d.x, d.y, d.X, d.Y));
                            break;
                    }
                    return path;
                },
                fixArc = function (pp, i) {
                    if (pp[i].length > 7) {
                        pp[i].shift();
                        var pi = pp[i];
                        while (pi.length) {
                            pp.splice(i++, 0, ["C"][concat](pi.splice(0, 6)));
                        }
                        pp.splice(i, 1);
                        ii = mmax(p.length, p2 && p2.length || 0);
                    }
                },
                fixM = function (path1, path2, a1, a2, i) {
                    if (path1 && path2 && path1[i][0] == "M" && path2[i][0] != "M") {
                        path2.splice(i, 0, ["M", a2.x, a2.y]);
                        a1.bx = 0;
                        a1.by = 0;
                        a1.x = path1[i][1];
                        a1.y = path1[i][2];
                        ii = mmax(p.length, p2 && p2.length || 0);
                    }
                };
            for (var i = 0, ii = mmax(p.length, p2 && p2.length || 0); i < ii; i++) {
                p[i] = processPath(p[i], attrs);
                fixArc(p, i);
                p2 && (p2[i] = processPath(p2[i], attrs2));
                p2 && fixArc(p2, i);
                fixM(p, p2, attrs, attrs2, i);
                fixM(p2, p, attrs2, attrs, i);
                var seg = p[i],
                    seg2 = p2 && p2[i],
                    seglen = seg.length,
                    seg2len = p2 && seg2.length;
                attrs.x = seg[seglen - 2];
                attrs.y = seg[seglen - 1];
                attrs.bx = toFloat(seg[seglen - 4]) || attrs.x;
                attrs.by = toFloat(seg[seglen - 3]) || attrs.y;
                attrs2.bx = p2 && (toFloat(seg2[seg2len - 4]) || attrs2.x);
                attrs2.by = p2 && (toFloat(seg2[seg2len - 3]) || attrs2.y);
                attrs2.x = p2 && seg2[seg2len - 2];
                attrs2.y = p2 && seg2[seg2len - 1];
            }
            if (!p2) {
                pth.curve = pathClone(p);
            }
            return p2 ? [p, p2] : p;
        }, null, pathClone),
        parseDots = R._parseDots = cacher(function (gradient) {
            var dots = [];
            for (var i = 0, ii = gradient.length; i < ii; i++) {
                var dot = {},
                    par = gradient[i].match(/^([^:]*):?([\d\.]*)/);
                dot.color = R.getRGB(par[1]);
                if (dot.color.error) {
                    return null;
                }
                dot.color = dot.color.hex;
                par[2] && (dot.offset = par[2] + "%");
                dots.push(dot);
            }
            for (i = 1, ii = dots.length - 1; i < ii; i++) {
                if (!dots[i].offset) {
                    var start = toFloat(dots[i - 1].offset || 0),
                        end = 0;
                    for (var j = i + 1; j < ii; j++) {
                        if (dots[j].offset) {
                            end = dots[j].offset;
                            break;
                        }
                    }
                    if (!end) {
                        end = 100;
                        j = ii;
                    }
                    end = toFloat(end);
                    var d = (end - start) / (j - i + 1);
                    for (; i < j; i++) {
                        start += d;
                        dots[i].offset = start + "%";
                    }
                }
            }
            return dots;
        }),
        tear = R._tear = function (el, paper) {
            el == paper.top && (paper.top = el.prev);
            el == paper.bottom && (paper.bottom = el.next);
            el.next && (el.next.prev = el.prev);
            el.prev && (el.prev.next = el.next);
        },
        tofront = R._tofront = function (el, paper) {
            if (paper.top === el) {
                return;
            }
            tear(el, paper);
            el.next = null;
            el.prev = paper.top;
            paper.top.next = el;
            paper.top = el;
        },
        toback = R._toback = function (el, paper) {
            if (paper.bottom === el) {
                return;
            }
            tear(el, paper);
            el.next = paper.bottom;
            el.prev = null;
            paper.bottom.prev = el;
            paper.bottom = el;
        },
        insertafter = R._insertafter = function (el, el2, paper) {
            tear(el, paper);
            el2 == paper.top && (paper.top = el);
            el2.next && (el2.next.prev = el);
            el.next = el2.next;
            el.prev = el2;
            el2.next = el;
        },
        insertbefore = R._insertbefore = function (el, el2, paper) {
            tear(el, paper);
            el2 == paper.bottom && (paper.bottom = el);
            el2.prev && (el2.prev.next = el);
            el.prev = el2.prev;
            el2.prev = el;
            el.next = el2;
        },
        
        toMatrix = R.toMatrix = function (path, transform) {
            var bb = pathDimensions(path),
                el = {
                    _: {
                        transform: E
                    },
                    getBBox: function () {
                        return bb;
                    }
                };
            extractTransform(el, transform);
            return el.matrix;
        },
        
        transformPath = R.transformPath = function (path, transform) {
            return mapPath(path, toMatrix(path, transform));
        },
        extractTransform = R._extractTransform = function (el, tstr) {
            if (tstr == null) {
                return el._.transform;
            }
            tstr = Str(tstr).replace(/\.{3}|\u2026/g, el._.transform || E);
            var tdata = R.parseTransformString(tstr),
                deg = 0,
                dx = 0,
                dy = 0,
                sx = 1,
                sy = 1,
                _ = el._,
                m = new Matrix;
            _.transform = tdata || [];
            if (tdata) {
                for (var i = 0, ii = tdata.length; i < ii; i++) {
                    var t = tdata[i],
                        tlen = t.length,
                        command = Str(t[0]).toLowerCase(),
                        absolute = t[0] != command,
                        inver = absolute ? m.invert() : 0,
                        x1,
                        y1,
                        x2,
                        y2,
                        bb;
                    if (command == "t" && tlen == 3) {
                        if (absolute) {
                            x1 = inver.x(0, 0);
                            y1 = inver.y(0, 0);
                            x2 = inver.x(t[1], t[2]);
                            y2 = inver.y(t[1], t[2]);
                            m.translate(x2 - x1, y2 - y1);
                        } else {
                            m.translate(t[1], t[2]);
                        }
                    } else if (command == "r") {
                        if (tlen == 2) {
                            bb = bb || el.getBBox(1);
                            m.rotate(t[1], bb.x + bb.width / 2, bb.y + bb.height / 2);
                            deg += t[1];
                        } else if (tlen == 4) {
                            if (absolute) {
                                x2 = inver.x(t[2], t[3]);
                                y2 = inver.y(t[2], t[3]);
                                m.rotate(t[1], x2, y2);
                            } else {
                                m.rotate(t[1], t[2], t[3]);
                            }
                            deg += t[1];
                        }
                    } else if (command == "s") {
                        if (tlen == 2 || tlen == 3) {
                            bb = bb || el.getBBox(1);
                            m.scale(t[1], t[tlen - 1], bb.x + bb.width / 2, bb.y + bb.height / 2);
                            sx *= t[1];
                            sy *= t[tlen - 1];
                        } else if (tlen == 5) {
                            if (absolute) {
                                x2 = inver.x(t[3], t[4]);
                                y2 = inver.y(t[3], t[4]);
                                m.scale(t[1], t[2], x2, y2);
                            } else {
                                m.scale(t[1], t[2], t[3], t[4]);
                            }
                            sx *= t[1];
                            sy *= t[2];
                        }
                    } else if (command == "m" && tlen == 7) {
                        m.add(t[1], t[2], t[3], t[4], t[5], t[6]);
                    }
                    _.dirtyT = 1;
                    el.matrix = m;
                }
            }

            
            el.matrix = m;

            _.sx = sx;
            _.sy = sy;
            _.deg = deg;
            _.dx = dx = m.e;
            _.dy = dy = m.f;

            if (sx == 1 && sy == 1 && !deg && _.bbox) {
                _.bbox.x += +dx;
                _.bbox.y += +dy;
            } else {
                _.dirtyT = 1;
            }
        },
        getEmpty = function (item) {
            var l = item[0];
            switch (l.toLowerCase()) {
                case "t": return [l, 0, 0];
                case "m": return [l, 1, 0, 0, 1, 0, 0];
                case "r": if (item.length == 4) {
                    return [l, 0, item[2], item[3]];
                } else {
                    return [l, 0];
                }
                case "s": if (item.length == 5) {
                    return [l, 1, 1, item[3], item[4]];
                } else if (item.length == 3) {
                    return [l, 1, 1];
                } else {
                    return [l, 1];
                }
            }
        },
        equaliseTransform = R._equaliseTransform = function (t1, t2) {
            t2 = Str(t2).replace(/\.{3}|\u2026/g, t1);
            t1 = R.parseTransformString(t1) || [];
            t2 = R.parseTransformString(t2) || [];
            var maxlength = mmax(t1.length, t2.length),
                from = [],
                to = [],
                i = 0, j, jj,
                tt1, tt2;
            for (; i < maxlength; i++) {
                tt1 = t1[i] || getEmpty(t2[i]);
                tt2 = t2[i] || getEmpty(tt1);
                if ((tt1[0] != tt2[0]) ||
                    (tt1[0].toLowerCase() == "r" && (tt1[2] != tt2[2] || tt1[3] != tt2[3])) ||
                    (tt1[0].toLowerCase() == "s" && (tt1[3] != tt2[3] || tt1[4] != tt2[4]))
                    ) {
                    return;
                }
                from[i] = [];
                to[i] = [];
                for (j = 0, jj = mmax(tt1.length, tt2.length); j < jj; j++) {
                    j in tt1 && (from[i][j] = tt1[j]);
                    j in tt2 && (to[i][j] = tt2[j]);
                }
            }
            return {
                from: from,
                to: to
            };
        };
    R._getContainer = function (x, y, w, h) {
        var container;
        container = h == null && !R.is(x, "object") ? g.doc.getElementById(x) : x;
        if (container == null) {
            return;
        }
        if (container.tagName) {
            if (y == null) {
                return {
                    container: container,
                    width: container.style.pixelWidth || container.offsetWidth,
                    height: container.style.pixelHeight || container.offsetHeight
                };
            } else {
                return {
                    container: container,
                    width: y,
                    height: w
                };
            }
        }
        return {
            container: 1,
            x: x,
            y: y,
            width: w,
            height: h
        };
    };
    
    R.pathToRelative = pathToRelative;
    R._engine = {};
    
    R.path2curve = path2curve;
    
    R.matrix = function (a, b, c, d, e, f) {
        return new Matrix(a, b, c, d, e, f);
    };
    function Matrix(a, b, c, d, e, f) {
        if (a != null) {
            this.a = +a;
            this.b = +b;
            this.c = +c;
            this.d = +d;
            this.e = +e;
            this.f = +f;
        } else {
            this.a = 1;
            this.b = 0;
            this.c = 0;
            this.d = 1;
            this.e = 0;
            this.f = 0;
        }
    }
    (function (matrixproto) {
        
        matrixproto.add = function (a, b, c, d, e, f) {
            var out = [[], [], []],
                m = [[this.a, this.c, this.e], [this.b, this.d, this.f], [0, 0, 1]],
                matrix = [[a, c, e], [b, d, f], [0, 0, 1]],
                x, y, z, res;

            if (a && a instanceof Matrix) {
                matrix = [[a.a, a.c, a.e], [a.b, a.d, a.f], [0, 0, 1]];
            }

            for (x = 0; x < 3; x++) {
                for (y = 0; y < 3; y++) {
                    res = 0;
                    for (z = 0; z < 3; z++) {
                        res += m[x][z] * matrix[z][y];
                    }
                    out[x][y] = res;
                }
            }
            this.a = out[0][0];
            this.b = out[1][0];
            this.c = out[0][1];
            this.d = out[1][1];
            this.e = out[0][2];
            this.f = out[1][2];
        };
        
        matrixproto.invert = function () {
            var me = this,
                x = me.a * me.d - me.b * me.c;
            return new Matrix(me.d / x, -me.b / x, -me.c / x, me.a / x, (me.c * me.f - me.d * me.e) / x, (me.b * me.e - me.a * me.f) / x);
        };
        
        matrixproto.clone = function () {
            return new Matrix(this.a, this.b, this.c, this.d, this.e, this.f);
        };
        
        matrixproto.translate = function (x, y) {
            this.add(1, 0, 0, 1, x, y);
        };
        
        matrixproto.scale = function (x, y, cx, cy) {
            y == null && (y = x);
            (cx || cy) && this.add(1, 0, 0, 1, cx, cy);
            this.add(x, 0, 0, y, 0, 0);
            (cx || cy) && this.add(1, 0, 0, 1, -cx, -cy);
        };
        
        matrixproto.rotate = function (a, x, y) {
            a = R.rad(a);
            x = x || 0;
            y = y || 0;
            var cos = +math.cos(a).toFixed(9),
                sin = +math.sin(a).toFixed(9);
            this.add(cos, sin, -sin, cos, x, y);
            this.add(1, 0, 0, 1, -x, -y);
        };
        
        matrixproto.x = function (x, y) {
            return x * this.a + y * this.c + this.e;
        };
        
        matrixproto.y = function (x, y) {
            return x * this.b + y * this.d + this.f;
        };
        matrixproto.get = function (i) {
            return +this[Str.fromCharCode(97 + i)].toFixed(4);
        };
        matrixproto.toString = function () {
            return R.svg ?
                "matrix(" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)].join() + ")" :
                [this.get(0), this.get(2), this.get(1), this.get(3), 0, 0].join();
        };
        matrixproto.toFilter = function () {
            return "progid:DXImageTransform.Microsoft.Matrix(M11=" + this.get(0) +
                ", M12=" + this.get(2) + ", M21=" + this.get(1) + ", M22=" + this.get(3) +
                ", Dx=" + this.get(4) + ", Dy=" + this.get(5) + ", sizingmethod='auto expand')";
        };
        matrixproto.offset = function () {
            return [this.e.toFixed(4), this.f.toFixed(4)];
        };
        function norm(a) {
            return a[0] * a[0] + a[1] * a[1];
        }
        function normalize(a) {
            var mag = math.sqrt(norm(a));
            a[0] && (a[0] /= mag);
            a[1] && (a[1] /= mag);
        }
        
        matrixproto.split = function () {
            var out = {};
            // translation
            out.dx = this.e;
            out.dy = this.f;

            // scale and shear
            var row = [[this.a, this.c], [this.b, this.d]];
            out.scalex = math.sqrt(norm(row[0]));
            normalize(row[0]);

            out.shear = row[0][0] * row[1][0] + row[0][1] * row[1][1];
            row[1] = [row[1][0] - row[0][0] * out.shear, row[1][1] - row[0][1] * out.shear];

            out.scaley = math.sqrt(norm(row[1]));
            normalize(row[1]);
            out.shear /= out.scaley;

            // rotation
            var sin = -row[0][1],
                cos = row[1][1];
            if (cos < 0) {
                out.rotate = R.deg(math.acos(cos));
                if (sin < 0) {
                    out.rotate = 360 - out.rotate;
                }
            } else {
                out.rotate = R.deg(math.asin(sin));
            }

            out.isSimple = !+out.shear.toFixed(9) && (out.scalex.toFixed(9) == out.scaley.toFixed(9) || !out.rotate);
            out.isSuperSimple = !+out.shear.toFixed(9) && out.scalex.toFixed(9) == out.scaley.toFixed(9) && !out.rotate;
            out.noRotation = !+out.shear.toFixed(9) && !out.rotate;
            return out;
        };
        
        matrixproto.toTransformString = function (shorter) {
            var s = shorter || this[split]();
            if (s.isSimple) {
                s.scalex = +s.scalex.toFixed(4);
                s.scaley = +s.scaley.toFixed(4);
                s.rotate = +s.rotate.toFixed(4);
                return  (s.dx || s.dy ? "t" + [s.dx, s.dy] : E) + 
                        (s.scalex != 1 || s.scaley != 1 ? "s" + [s.scalex, s.scaley, 0, 0] : E) +
                        (s.rotate ? "r" + [s.rotate, 0, 0] : E);
            } else {
                return "m" + [this.get(0), this.get(1), this.get(2), this.get(3), this.get(4), this.get(5)];
            }
        };
    })(Matrix.prototype);

    // WebKit rendering bug workaround method
    var version = navigator.userAgent.match(/Version\/(.*?)\s/) || navigator.userAgent.match(/Chrome\/(\d+)/);
    if ((navigator.vendor == "Apple Computer, Inc.") && (version && version[1] < 4 || navigator.platform.slice(0, 2) == "iP") ||
        (navigator.vendor == "Google Inc." && version && version[1] < 8)) {
        
        paperproto.safari = function () {
            var rect = this.rect(-99, -99, this.width + 99, this.height + 99).attr({stroke: "none"});
            setTimeout(function () {rect.remove();});
        };
    } else {
        paperproto.safari = fun;
    }
 
    var preventDefault = function () {
        this.returnValue = false;
    },
    preventTouch = function () {
        return this.originalEvent.preventDefault();
    },
    stopPropagation = function () {
        this.cancelBubble = true;
    },
    stopTouch = function () {
        return this.originalEvent.stopPropagation();
    },
    addEvent = (function () {
        if (g.doc.addEventListener) {
            return function (obj, type, fn, element) {
                var realName = supportsTouch && touchMap[type] ? touchMap[type] : type,
                    f = function (e) {
                        var scrollY = g.doc.documentElement.scrollTop || g.doc.body.scrollTop,
                            scrollX = g.doc.documentElement.scrollLeft || g.doc.body.scrollLeft,
                            x = e.clientX + scrollX,
                            y = e.clientY + scrollY;
                    if (supportsTouch && touchMap[has](type)) {
                        for (var i = 0, ii = e.targetTouches && e.targetTouches.length; i < ii; i++) {
                            if (e.targetTouches[i].target == obj) {
                                var olde = e;
                                e = e.targetTouches[i];
                                e.originalEvent = olde;
                                e.preventDefault = preventTouch;
                                e.stopPropagation = stopTouch;
                                break;
                            }
                        }
                    }
                    return fn.call(element, e, x, y);
                };
                obj.addEventListener(realName, f, false);
                return function () {
                    obj.removeEventListener(realName, f, false);
                    return true;
                };
            };
        } else if (g.doc.attachEvent) {
            return function (obj, type, fn, element) {
                var f = function (e) {
                    e = e || g.win.event;
                    var scrollY = g.doc.documentElement.scrollTop || g.doc.body.scrollTop,
                        scrollX = g.doc.documentElement.scrollLeft || g.doc.body.scrollLeft,
                        x = e.clientX + scrollX,
                        y = e.clientY + scrollY;
                    e.preventDefault = e.preventDefault || preventDefault;
                    e.stopPropagation = e.stopPropagation || stopPropagation;
                    return fn.call(element, e, x, y);
                };
                obj.attachEvent("on" + type, f);
                var detacher = function () {
                    obj.detachEvent("on" + type, f);
                    return true;
                };
                return detacher;
            };
        }
    })(),
    drag = [],
    dragMove = function (e) {
        var x = e.clientX,
            y = e.clientY,
            scrollY = g.doc.documentElement.scrollTop || g.doc.body.scrollTop,
            scrollX = g.doc.documentElement.scrollLeft || g.doc.body.scrollLeft,
            dragi,
            j = drag.length;
        while (j--) {
            dragi = drag[j];
            if (supportsTouch) {
                var i = e.touches.length,
                    touch;
                while (i--) {
                    touch = e.touches[i];
                    if (touch.identifier == dragi.el._drag.id) {
                        x = touch.clientX;
                        y = touch.clientY;
                        (e.originalEvent ? e.originalEvent : e).preventDefault();
                        break;
                    }
                }
            } else {
                e.preventDefault();
            }
            var node = dragi.el.node,
                o,
                next = node.nextSibling,
                parent = node.parentNode,
                display = node.style.display;
            g.win.opera && parent.removeChild(node);
            node.style.display = "none";
            o = dragi.el.paper.getElementByPoint(x, y);
            node.style.display = display;
            g.win.opera && (next ? parent.insertBefore(node, next) : parent.appendChild(node));
            o && eve("raphael.drag.over." + dragi.el.id, dragi.el, o);
            x += scrollX;
            y += scrollY;
            eve("raphael.drag.move." + dragi.el.id, dragi.move_scope || dragi.el, x - dragi.el._drag.x, y - dragi.el._drag.y, x, y, e);
        }
    },
    dragUp = function (e) {
        R.unmousemove(dragMove).unmouseup(dragUp);
        var i = drag.length,
            dragi;
        while (i--) {
            dragi = drag[i];
            dragi.el._drag = {};
            eve("raphael.drag.end." + dragi.el.id, dragi.end_scope || dragi.start_scope || dragi.move_scope || dragi.el, e);
        }
        drag = [];
    },
    
    elproto = R.el = {};
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    for (var i = events.length; i--;) {
        (function (eventName) {
            R[eventName] = elproto[eventName] = function (fn, scope) {
                if (R.is(fn, "function")) {
                    this.events = this.events || [];
                    this.events.push({name: eventName, f: fn, unbind: addEvent(this.shape || this.node || g.doc, eventName, fn, scope || this)});
                }
                return this;
            };
            R["un" + eventName] = elproto["un" + eventName] = function (fn) {
                var events = this.events || [],
                    l = events.length;
                while (l--) if (events[l].name == eventName && events[l].f == fn) {
                    events[l].unbind();
                    events.splice(l, 1);
                    !events.length && delete this.events;
                    return this;
                }
                return this;
            };
        })(events[i]);
    }
    
    
    elproto.data = function (key, value) {
        var data = eldata[this.id] = eldata[this.id] || {};
        if (arguments.length == 1) {
            if (R.is(key, "object")) {
                for (var i in key) if (key[has](i)) {
                    this.data(i, key[i]);
                }
                return this;
            }
            eve("raphael.data.get." + this.id, this, data[key], key);
            return data[key];
        }
        data[key] = value;
        eve("raphael.data.set." + this.id, this, value, key);
        return this;
    };
    
    elproto.removeData = function (key) {
        if (key == null) {
            eldata[this.id] = {};
        } else {
            eldata[this.id] && delete eldata[this.id][key];
        }
        return this;
    };
    
    elproto.hover = function (f_in, f_out, scope_in, scope_out) {
        return this.mouseover(f_in, scope_in).mouseout(f_out, scope_out || scope_in);
    };
    
    elproto.unhover = function (f_in, f_out) {
        return this.unmouseover(f_in).unmouseout(f_out);
    };
    var draggable = [];
    
    elproto.drag = function (onmove, onstart, onend, move_scope, start_scope, end_scope) {
        function start(e) {
            (e.originalEvent || e).preventDefault();
            var scrollY = g.doc.documentElement.scrollTop || g.doc.body.scrollTop,
                scrollX = g.doc.documentElement.scrollLeft || g.doc.body.scrollLeft;
            this._drag.x = e.clientX + scrollX;
            this._drag.y = e.clientY + scrollY;
            this._drag.id = e.identifier;
            !drag.length && R.mousemove(dragMove).mouseup(dragUp);
            drag.push({el: this, move_scope: move_scope, start_scope: start_scope, end_scope: end_scope});
            onstart && eve.on("raphael.drag.start." + this.id, onstart);
            onmove && eve.on("raphael.drag.move." + this.id, onmove);
            onend && eve.on("raphael.drag.end." + this.id, onend);
            eve("raphael.drag.start." + this.id, start_scope || move_scope || this, e.clientX + scrollX, e.clientY + scrollY, e);
        }
        this._drag = {};
        draggable.push({el: this, start: start});
        this.mousedown(start);
        return this;
    };
    
    elproto.onDragOver = function (f) {
        f ? eve.on("raphael.drag.over." + this.id, f) : eve.unbind("raphael.drag.over." + this.id);
    };
    
    elproto.undrag = function () {
        var i = draggable.length;
        while (i--) if (draggable[i].el == this) {
            this.unmousedown(draggable[i].start);
            draggable.splice(i, 1);
            eve.unbind("raphael.drag.*." + this.id);
        }
        !draggable.length && R.unmousemove(dragMove).unmouseup(dragUp);
    };
    
    paperproto.circle = function (x, y, r) {
        var out = R._engine.circle(this, x || 0, y || 0, r || 0);
        this.__set__ && this.__set__.push(out);
        return out;
    };
    
    paperproto.rect = function (x, y, w, h, r) {
        var out = R._engine.rect(this, x || 0, y || 0, w || 0, h || 0, r || 0);
        this.__set__ && this.__set__.push(out);
        return out;
    };
    
    paperproto.ellipse = function (x, y, rx, ry) {
        var out = R._engine.ellipse(this, x || 0, y || 0, rx || 0, ry || 0);
        this.__set__ && this.__set__.push(out);
        return out;
    };
    
    paperproto.path = function (pathString) {
        pathString && !R.is(pathString, string) && !R.is(pathString[0], array) && (pathString += E);
        var out = R._engine.path(R.format[apply](R, arguments), this);
        this.__set__ && this.__set__.push(out);
        return out;
    };
    
    paperproto.image = function (src, x, y, w, h) {
        var out = R._engine.image(this, src || "about:blank", x || 0, y || 0, w || 0, h || 0);
        this.__set__ && this.__set__.push(out);
        return out;
    };
    
    paperproto.text = function (x, y, text) {
        var out = R._engine.text(this, x || 0, y || 0, Str(text));
        this.__set__ && this.__set__.push(out);
        return out;
    };
    
    paperproto.set = function (itemsArray) {
        !R.is(itemsArray, "array") && (itemsArray = Array.prototype.splice.call(arguments, 0, arguments.length));
        var out = new Set(itemsArray);
        this.__set__ && this.__set__.push(out);
        return out;
    };
    
    paperproto.setStart = function (set) {
        this.__set__ = set || this.set();
    };
    
    paperproto.setFinish = function (set) {
        var out = this.__set__;
        delete this.__set__;
        return out;
    };
    
    paperproto.setSize = function (width, height) {
        return R._engine.setSize.call(this, width, height);
    };
    
    paperproto.setViewBox = function (x, y, w, h, fit) {
        return R._engine.setViewBox.call(this, x, y, w, h, fit);
    };
    
    
    paperproto.top = paperproto.bottom = null;
    
    paperproto.raphael = R;
    var getOffset = function (elem) {
        var box = elem.getBoundingClientRect(),
            doc = elem.ownerDocument,
            body = doc.body,
            docElem = doc.documentElement,
            clientTop = docElem.clientTop || body.clientTop || 0, clientLeft = docElem.clientLeft || body.clientLeft || 0,
            top  = box.top  + (g.win.pageYOffset || docElem.scrollTop || body.scrollTop ) - clientTop,
            left = box.left + (g.win.pageXOffset || docElem.scrollLeft || body.scrollLeft) - clientLeft;
        return {
            y: top,
            x: left
        };
    };
    
    paperproto.getElementByPoint = function (x, y) {
        var paper = this,
            svg = paper.canvas,
            target = g.doc.elementFromPoint(x, y);
        if (g.win.opera && target.tagName == "svg") {
            var so = getOffset(svg),
                sr = svg.createSVGRect();
            sr.x = x - so.x;
            sr.y = y - so.y;
            sr.width = sr.height = 1;
            var hits = svg.getIntersectionList(sr, null);
            if (hits.length) {
                target = hits[hits.length - 1];
            }
        }
        if (!target) {
            return null;
        }
        while (target.parentNode && target != svg.parentNode && !target.raphael) {
            target = target.parentNode;
        }
        target == paper.canvas.parentNode && (target = svg);
        target = target && target.raphael ? paper.getById(target.raphaelid) : null;
        return target;
    };
    
    paperproto.getById = function (id) {
        var bot = this.bottom;
        while (bot) {
            if (bot.id == id) {
                return bot;
            }
            bot = bot.next;
        }
        return null;
    };
    
    paperproto.forEach = function (callback, thisArg) {
        var bot = this.bottom;
        while (bot) {
            if (callback.call(thisArg, bot) === false) {
                return this;
            }
            bot = bot.next;
        }
        return this;
    };
    
    paperproto.getElementsByPoint = function (x, y) {
        var set = this.set();
        this.forEach(function (el) {
            if (el.isPointInside(x, y)) {
                set.push(el);
            }
        });
        return set;
    };
    function x_y() {
        return this.x + S + this.y;
    }
    function x_y_w_h() {
        return this.x + S + this.y + S + this.width + " \xd7 " + this.height;
    }
    
    elproto.isPointInside = function (x, y) {
        var rp = this.realPath = this.realPath || getPath[this.type](this);
        return R.isPointInsidePath(rp, x, y);
    };
    
    elproto.getBBox = function (isWithoutTransform) {
        if (this.removed) {
            return {};
        }
        var _ = this._;
        if (isWithoutTransform) {
            if (_.dirty || !_.bboxwt) {
                this.realPath = getPath[this.type](this);
                _.bboxwt = pathDimensions(this.realPath);
                _.bboxwt.toString = x_y_w_h;
                _.dirty = 0;
            }
            return _.bboxwt;
        }
        if (_.dirty || _.dirtyT || !_.bbox) {
            if (_.dirty || !this.realPath) {
                _.bboxwt = 0;
                this.realPath = getPath[this.type](this);
            }
            _.bbox = pathDimensions(mapPath(this.realPath, this.matrix));
            _.bbox.toString = x_y_w_h;
            _.dirty = _.dirtyT = 0;
        }
        return _.bbox;
    };
    
    elproto.clone = function () {
        if (this.removed) {
            return null;
        }
        var out = this.paper[this.type]().attr(this.attr());
        this.__set__ && this.__set__.push(out);
        return out;
    };
    
    elproto.glow = function (glow) {
        if (this.type == "text") {
            return null;
        }
        glow = glow || {};
        var s = {
            width: (glow.width || 10) + (+this.attr("stroke-width") || 1),
            fill: glow.fill || false,
            opacity: glow.opacity || .5,
            offsetx: glow.offsetx || 0,
            offsety: glow.offsety || 0,
            color: glow.color || "#000"
        },
            c = s.width / 2,
            r = this.paper,
            out = r.set(),
            path = this.realPath || getPath[this.type](this);
        path = this.matrix ? mapPath(path, this.matrix) : path;
        for (var i = 1; i < c + 1; i++) {
            out.push(r.path(path).attr({
                stroke: s.color,
                fill: s.fill ? s.color : "none",
                "stroke-linejoin": "round",
                "stroke-linecap": "round",
                "stroke-width": +(s.width / c * i).toFixed(3),
                opacity: +(s.opacity / c).toFixed(3)
            }));
        }
        return out.insertBefore(this).translate(s.offsetx, s.offsety);
    };
    var curveslengths = {},
    getPointAtSegmentLength = function (p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length) {
        if (length == null) {
            return bezlen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y);
        } else {
            return R.findDotsAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, getTatLen(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, length));
        }
    },
    getLengthFactory = function (istotal, subpath) {
        return function (path, length, onlystart) {
            path = path2curve(path);
            var x, y, p, l, sp = "", subpaths = {}, point,
                len = 0;
            for (var i = 0, ii = path.length; i < ii; i++) {
                p = path[i];
                if (p[0] == "M") {
                    x = +p[1];
                    y = +p[2];
                } else {
                    l = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6]);
                    if (len + l > length) {
                        if (subpath && !subpaths.start) {
                            point = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6], length - len);
                            sp += ["C" + point.start.x, point.start.y, point.m.x, point.m.y, point.x, point.y];
                            if (onlystart) {return sp;}
                            subpaths.start = sp;
                            sp = ["M" + point.x, point.y + "C" + point.n.x, point.n.y, point.end.x, point.end.y, p[5], p[6]].join();
                            len += l;
                            x = +p[5];
                            y = +p[6];
                            continue;
                        }
                        if (!istotal && !subpath) {
                            point = getPointAtSegmentLength(x, y, p[1], p[2], p[3], p[4], p[5], p[6], length - len);
                            return {x: point.x, y: point.y, alpha: point.alpha};
                        }
                    }
                    len += l;
                    x = +p[5];
                    y = +p[6];
                }
                sp += p.shift() + p;
            }
            subpaths.end = sp;
            point = istotal ? len : subpath ? subpaths : R.findDotsAtSegment(x, y, p[0], p[1], p[2], p[3], p[4], p[5], 1);
            point.alpha && (point = {x: point.x, y: point.y, alpha: point.alpha});
            return point;
        };
    };
    var getTotalLength = getLengthFactory(1),
        getPointAtLength = getLengthFactory(),
        getSubpathsAtLength = getLengthFactory(0, 1);
    
    R.getTotalLength = getTotalLength;
    
    R.getPointAtLength = getPointAtLength;
    
    R.getSubpath = function (path, from, to) {
        if (this.getTotalLength(path) - to < 1e-6) {
            return getSubpathsAtLength(path, from).end;
        }
        var a = getSubpathsAtLength(path, to, 1);
        return from ? getSubpathsAtLength(a, from).end : a;
    };
    
    elproto.getTotalLength = function () {
        if (this.type != "path") {return;}
        if (this.node.getTotalLength) {
            return this.node.getTotalLength();
        }
        return getTotalLength(this.attrs.path);
    };
    
    elproto.getPointAtLength = function (length) {
        if (this.type != "path") {return;}
        return getPointAtLength(this.attrs.path, length);
    };
    
    elproto.getSubpath = function (from, to) {
        if (this.type != "path") {return;}
        return R.getSubpath(this.attrs.path, from, to);
    };
    
    var ef = R.easing_formulas = {
        linear: function (n) {
            return n;
        },
        "<": function (n) {
            return pow(n, 1.7);
        },
        ">": function (n) {
            return pow(n, .48);
        },
        "<>": function (n) {
            var q = .48 - n / 1.04,
                Q = math.sqrt(.1734 + q * q),
                x = Q - q,
                X = pow(abs(x), 1 / 3) * (x < 0 ? -1 : 1),
                y = -Q - q,
                Y = pow(abs(y), 1 / 3) * (y < 0 ? -1 : 1),
                t = X + Y + .5;
            return (1 - t) * 3 * t * t + t * t * t;
        },
        backIn: function (n) {
            var s = 1.70158;
            return n * n * ((s + 1) * n - s);
        },
        backOut: function (n) {
            n = n - 1;
            var s = 1.70158;
            return n * n * ((s + 1) * n + s) + 1;
        },
        elastic: function (n) {
            if (n == !!n) {
                return n;
            }
            return pow(2, -10 * n) * math.sin((n - .075) * (2 * PI) / .3) + 1;
        },
        bounce: function (n) {
            var s = 7.5625,
                p = 2.75,
                l;
            if (n < (1 / p)) {
                l = s * n * n;
            } else {
                if (n < (2 / p)) {
                    n -= (1.5 / p);
                    l = s * n * n + .75;
                } else {
                    if (n < (2.5 / p)) {
                        n -= (2.25 / p);
                        l = s * n * n + .9375;
                    } else {
                        n -= (2.625 / p);
                        l = s * n * n + .984375;
                    }
                }
            }
            return l;
        }
    };
    ef.easeIn = ef["ease-in"] = ef["<"];
    ef.easeOut = ef["ease-out"] = ef[">"];
    ef.easeInOut = ef["ease-in-out"] = ef["<>"];
    ef["back-in"] = ef.backIn;
    ef["back-out"] = ef.backOut;

    var animationElements = [],
        requestAnimFrame = window.requestAnimationFrame       ||
                           window.webkitRequestAnimationFrame ||
                           window.mozRequestAnimationFrame    ||
                           window.oRequestAnimationFrame      ||
                           window.msRequestAnimationFrame     ||
                           function (callback) {
                               setTimeout(callback, 16);
                           },
        animation = function () {
            var Now = +new Date,
                l = 0;
            for (; l < animationElements.length; l++) {
                var e = animationElements[l];
                if (e.el.removed || e.paused) {
                    continue;
                }
                var time = Now - e.start,
                    ms = e.ms,
                    easing = e.easing,
                    from = e.from,
                    diff = e.diff,
                    to = e.to,
                    t = e.t,
                    that = e.el,
                    set = {},
                    now,
                    init = {},
                    key;
                if (e.initstatus) {
                    time = (e.initstatus * e.anim.top - e.prev) / (e.percent - e.prev) * ms;
                    e.status = e.initstatus;
                    delete e.initstatus;
                    e.stop && animationElements.splice(l--, 1);
                } else {
                    e.status = (e.prev + (e.percent - e.prev) * (time / ms)) / e.anim.top;
                }
                if (time < 0) {
                    continue;
                }
                if (time < ms) {
                    var pos = easing(time / ms);
                    for (var attr in from) if (from[has](attr)) {
                        switch (availableAnimAttrs[attr]) {
                            case nu:
                                now = +from[attr] + pos * ms * diff[attr];
                                break;
                            case "colour":
                                now = "rgb(" + [
                                    upto255(round(from[attr].r + pos * ms * diff[attr].r)),
                                    upto255(round(from[attr].g + pos * ms * diff[attr].g)),
                                    upto255(round(from[attr].b + pos * ms * diff[attr].b))
                                ].join(",") + ")";
                                break;
                            case "path":
                                now = [];
                                for (var i = 0, ii = from[attr].length; i < ii; i++) {
                                    now[i] = [from[attr][i][0]];
                                    for (var j = 1, jj = from[attr][i].length; j < jj; j++) {
                                        now[i][j] = +from[attr][i][j] + pos * ms * diff[attr][i][j];
                                    }
                                    now[i] = now[i].join(S);
                                }
                                now = now.join(S);
                                break;
                            case "transform":
                                if (diff[attr].real) {
                                    now = [];
                                    for (i = 0, ii = from[attr].length; i < ii; i++) {
                                        now[i] = [from[attr][i][0]];
                                        for (j = 1, jj = from[attr][i].length; j < jj; j++) {
                                            now[i][j] = from[attr][i][j] + pos * ms * diff[attr][i][j];
                                        }
                                    }
                                } else {
                                    var get = function (i) {
                                        return +from[attr][i] + pos * ms * diff[attr][i];
                                    };
                                    // now = [["r", get(2), 0, 0], ["t", get(3), get(4)], ["s", get(0), get(1), 0, 0]];
                                    now = [["m", get(0), get(1), get(2), get(3), get(4), get(5)]];
                                }
                                break;
                            case "csv":
                                if (attr == "clip-rect") {
                                    now = [];
                                    i = 4;
                                    while (i--) {
                                        now[i] = +from[attr][i] + pos * ms * diff[attr][i];
                                    }
                                }
                                break;
                            default:
                                var from2 = [][concat](from[attr]);
                                now = [];
                                i = that.paper.customAttributes[attr].length;
                                while (i--) {
                                    now[i] = +from2[i] + pos * ms * diff[attr][i];
                                }
                                break;
                        }
                        set[attr] = now;
                    }
                    that.attr(set);
                    (function (id, that, anim) {
                        setTimeout(function () {
                            eve("raphael.anim.frame." + id, that, anim);
                        });
                    })(that.id, that, e.anim);
                } else {
                    (function(f, el, a) {
                        setTimeout(function() {
                            eve("raphael.anim.frame." + el.id, el, a);
                            eve("raphael.anim.finish." + el.id, el, a);
                            R.is(f, "function") && f.call(el);
                        });
                    })(e.callback, that, e.anim);
                    that.attr(to);
                    animationElements.splice(l--, 1);
                    if (e.repeat > 1 && !e.next) {
                        for (key in to) if (to[has](key)) {
                            init[key] = e.totalOrigin[key];
                        }
                        e.el.attr(init);
                        runAnimation(e.anim, e.el, e.anim.percents[0], null, e.totalOrigin, e.repeat - 1);
                    }
                    if (e.next && !e.stop) {
                        runAnimation(e.anim, e.el, e.next, null, e.totalOrigin, e.repeat);
                    }
                }
            }
            R.svg && that && that.paper && that.paper.safari();
            animationElements.length && requestAnimFrame(animation);
        },
        upto255 = function (color) {
            return color > 255 ? 255 : color < 0 ? 0 : color;
        };
    
    elproto.animateWith = function (el, anim, params, ms, easing, callback) {
        var element = this;
        if (element.removed) {
            callback && callback.call(element);
            return element;
        }
        var a = params instanceof Animation ? params : R.animation(params, ms, easing, callback),
            x, y;
        runAnimation(a, element, a.percents[0], null, element.attr());
        for (var i = 0, ii = animationElements.length; i < ii; i++) {
            if (animationElements[i].anim == anim && animationElements[i].el == el) {
                animationElements[ii - 1].start = animationElements[i].start;
                break;
            }
        }
        return element;
        // 
        // 
        // var a = params ? R.animation(params, ms, easing, callback) : anim,
        //     status = element.status(anim);
        // return this.animate(a).status(a, status * anim.ms / a.ms);
    };
    function CubicBezierAtTime(t, p1x, p1y, p2x, p2y, duration) {
        var cx = 3 * p1x,
            bx = 3 * (p2x - p1x) - cx,
            ax = 1 - cx - bx,
            cy = 3 * p1y,
            by = 3 * (p2y - p1y) - cy,
            ay = 1 - cy - by;
        function sampleCurveX(t) {
            return ((ax * t + bx) * t + cx) * t;
        }
        function solve(x, epsilon) {
            var t = solveCurveX(x, epsilon);
            return ((ay * t + by) * t + cy) * t;
        }
        function solveCurveX(x, epsilon) {
            var t0, t1, t2, x2, d2, i;
            for(t2 = x, i = 0; i < 8; i++) {
                x2 = sampleCurveX(t2) - x;
                if (abs(x2) < epsilon) {
                    return t2;
                }
                d2 = (3 * ax * t2 + 2 * bx) * t2 + cx;
                if (abs(d2) < 1e-6) {
                    break;
                }
                t2 = t2 - x2 / d2;
            }
            t0 = 0;
            t1 = 1;
            t2 = x;
            if (t2 < t0) {
                return t0;
            }
            if (t2 > t1) {
                return t1;
            }
            while (t0 < t1) {
                x2 = sampleCurveX(t2);
                if (abs(x2 - x) < epsilon) {
                    return t2;
                }
                if (x > x2) {
                    t0 = t2;
                } else {
                    t1 = t2;
                }
                t2 = (t1 - t0) / 2 + t0;
            }
            return t2;
        }
        return solve(t, 1 / (200 * duration));
    }
    elproto.onAnimation = function (f) {
        f ? eve.on("raphael.anim.frame." + this.id, f) : eve.unbind("raphael.anim.frame." + this.id);
        return this;
    };
    function Animation(anim, ms) {
        var percents = [],
            newAnim = {};
        this.ms = ms;
        this.times = 1;
        if (anim) {
            for (var attr in anim) if (anim[has](attr)) {
                newAnim[toFloat(attr)] = anim[attr];
                percents.push(toFloat(attr));
            }
            percents.sort(sortByNumber);
        }
        this.anim = newAnim;
        this.top = percents[percents.length - 1];
        this.percents = percents;
    }
    
    Animation.prototype.delay = function (delay) {
        var a = new Animation(this.anim, this.ms);
        a.times = this.times;
        a.del = +delay || 0;
        return a;
    };
    
    Animation.prototype.repeat = function (times) { 
        var a = new Animation(this.anim, this.ms);
        a.del = this.del;
        a.times = math.floor(mmax(times, 0)) || 1;
        return a;
    };
    function runAnimation(anim, element, percent, status, totalOrigin, times) {
        percent = toFloat(percent);
        var params,
            isInAnim,
            isInAnimSet,
            percents = [],
            next,
            prev,
            timestamp,
            ms = anim.ms,
            from = {},
            to = {},
            diff = {};
        if (status) {
            for (i = 0, ii = animationElements.length; i < ii; i++) {
                var e = animationElements[i];
                if (e.el.id == element.id && e.anim == anim) {
                    if (e.percent != percent) {
                        animationElements.splice(i, 1);
                        isInAnimSet = 1;
                    } else {
                        isInAnim = e;
                    }
                    element.attr(e.totalOrigin);
                    break;
                }
            }
        } else {
            status = +to; // NaN
        }
        for (var i = 0, ii = anim.percents.length; i < ii; i++) {
            if (anim.percents[i] == percent || anim.percents[i] > status * anim.top) {
                percent = anim.percents[i];
                prev = anim.percents[i - 1] || 0;
                ms = ms / anim.top * (percent - prev);
                next = anim.percents[i + 1];
                params = anim.anim[percent];
                break;
            } else if (status) {
                element.attr(anim.anim[anim.percents[i]]);
            }
        }
        if (!params) {
            return;
        }
        if (!isInAnim) {
            for (var attr in params) if (params[has](attr)) {
                if (availableAnimAttrs[has](attr) || element.paper.customAttributes[has](attr)) {
                    from[attr] = element.attr(attr);
                    (from[attr] == null) && (from[attr] = availableAttrs[attr]);
                    to[attr] = params[attr];
                    switch (availableAnimAttrs[attr]) {
                        case nu:
                            diff[attr] = (to[attr] - from[attr]) / ms;
                            break;
                        case "colour":
                            from[attr] = R.getRGB(from[attr]);
                            var toColour = R.getRGB(to[attr]);
                            diff[attr] = {
                                r: (toColour.r - from[attr].r) / ms,
                                g: (toColour.g - from[attr].g) / ms,
                                b: (toColour.b - from[attr].b) / ms
                            };
                            break;
                        case "path":
                            var pathes = path2curve(from[attr], to[attr]),
                                toPath = pathes[1];
                            from[attr] = pathes[0];
                            diff[attr] = [];
                            for (i = 0, ii = from[attr].length; i < ii; i++) {
                                diff[attr][i] = [0];
                                for (var j = 1, jj = from[attr][i].length; j < jj; j++) {
                                    diff[attr][i][j] = (toPath[i][j] - from[attr][i][j]) / ms;
                                }
                            }
                            break;
                        case "transform":
                            var _ = element._,
                                eq = equaliseTransform(_[attr], to[attr]);
                            if (eq) {
                                from[attr] = eq.from;
                                to[attr] = eq.to;
                                diff[attr] = [];
                                diff[attr].real = true;
                                for (i = 0, ii = from[attr].length; i < ii; i++) {
                                    diff[attr][i] = [from[attr][i][0]];
                                    for (j = 1, jj = from[attr][i].length; j < jj; j++) {
                                        diff[attr][i][j] = (to[attr][i][j] - from[attr][i][j]) / ms;
                                    }
                                }
                            } else {
                                var m = (element.matrix || new Matrix),
                                    to2 = {
                                        _: {transform: _.transform},
                                        getBBox: function () {
                                            return element.getBBox(1);
                                        }
                                    };
                                from[attr] = [
                                    m.a,
                                    m.b,
                                    m.c,
                                    m.d,
                                    m.e,
                                    m.f
                                ];
                                extractTransform(to2, to[attr]);
                                to[attr] = to2._.transform;
                                diff[attr] = [
                                    (to2.matrix.a - m.a) / ms,
                                    (to2.matrix.b - m.b) / ms,
                                    (to2.matrix.c - m.c) / ms,
                                    (to2.matrix.d - m.d) / ms,
                                    (to2.matrix.e - m.e) / ms,
                                    (to2.matrix.f - m.f) / ms
                                ];
                                // from[attr] = [_.sx, _.sy, _.deg, _.dx, _.dy];
                                // var to2 = {_:{}, getBBox: function () { return element.getBBox(); }};
                                // extractTransform(to2, to[attr]);
                                // diff[attr] = [
                                //     (to2._.sx - _.sx) / ms,
                                //     (to2._.sy - _.sy) / ms,
                                //     (to2._.deg - _.deg) / ms,
                                //     (to2._.dx - _.dx) / ms,
                                //     (to2._.dy - _.dy) / ms
                                // ];
                            }
                            break;
                        case "csv":
                            var values = Str(params[attr])[split](separator),
                                from2 = Str(from[attr])[split](separator);
                            if (attr == "clip-rect") {
                                from[attr] = from2;
                                diff[attr] = [];
                                i = from2.length;
                                while (i--) {
                                    diff[attr][i] = (values[i] - from[attr][i]) / ms;
                                }
                            }
                            to[attr] = values;
                            break;
                        default:
                            values = [][concat](params[attr]);
                            from2 = [][concat](from[attr]);
                            diff[attr] = [];
                            i = element.paper.customAttributes[attr].length;
                            while (i--) {
                                diff[attr][i] = ((values[i] || 0) - (from2[i] || 0)) / ms;
                            }
                            break;
                    }
                }
            }
            var easing = params.easing,
                easyeasy = R.easing_formulas[easing];
            if (!easyeasy) {
                easyeasy = Str(easing).match(bezierrg);
                if (easyeasy && easyeasy.length == 5) {
                    var curve = easyeasy;
                    easyeasy = function (t) {
                        return CubicBezierAtTime(t, +curve[1], +curve[2], +curve[3], +curve[4], ms);
                    };
                } else {
                    easyeasy = pipe;
                }
            }
            timestamp = params.start || anim.start || +new Date;
            e = {
                anim: anim,
                percent: percent,
                timestamp: timestamp,
                start: timestamp + (anim.del || 0),
                status: 0,
                initstatus: status || 0,
                stop: false,
                ms: ms,
                easing: easyeasy,
                from: from,
                diff: diff,
                to: to,
                el: element,
                callback: params.callback,
                prev: prev,
                next: next,
                repeat: times || anim.times,
                origin: element.attr(),
                totalOrigin: totalOrigin
            };
            animationElements.push(e);
            if (status && !isInAnim && !isInAnimSet) {
                e.stop = true;
                e.start = new Date - ms * status;
                if (animationElements.length == 1) {
                    return animation();
                }
            }
            if (isInAnimSet) {
                e.start = new Date - e.ms * status;
            }
            animationElements.length == 1 && requestAnimFrame(animation);
        } else {
            isInAnim.initstatus = status;
            isInAnim.start = new Date - isInAnim.ms * status;
        }
        eve("raphael.anim.start." + element.id, element, anim);
    }
    
    R.animation = function (params, ms, easing, callback) {
        if (params instanceof Animation) {
            return params;
        }
        if (R.is(easing, "function") || !easing) {
            callback = callback || easing || null;
            easing = null;
        }
        params = Object(params);
        ms = +ms || 0;
        var p = {},
            json,
            attr;
        for (attr in params) if (params[has](attr) && toFloat(attr) != attr && toFloat(attr) + "%" != attr) {
            json = true;
            p[attr] = params[attr];
        }
        if (!json) {
            return new Animation(params, ms);
        } else {
            easing && (p.easing = easing);
            callback && (p.callback = callback);
            return new Animation({100: p}, ms);
        }
    };
    
    elproto.animate = function (params, ms, easing, callback) {
        var element = this;
        if (element.removed) {
            callback && callback.call(element);
            return element;
        }
        var anim = params instanceof Animation ? params : R.animation(params, ms, easing, callback);
        runAnimation(anim, element, anim.percents[0], null, element.attr());
        return element;
    };
    
    elproto.setTime = function (anim, value) {
        if (anim && value != null) {
            this.status(anim, mmin(value, anim.ms) / anim.ms);
        }
        return this;
    };
    
    elproto.status = function (anim, value) {
        var out = [],
            i = 0,
            len,
            e;
        if (value != null) {
            runAnimation(anim, this, -1, mmin(value, 1));
            return this;
        } else {
            len = animationElements.length;
            for (; i < len; i++) {
                e = animationElements[i];
                if (e.el.id == this.id && (!anim || e.anim == anim)) {
                    if (anim) {
                        return e.status;
                    }
                    out.push({
                        anim: e.anim,
                        status: e.status
                    });
                }
            }
            if (anim) {
                return 0;
            }
            return out;
        }
    };
    
    elproto.pause = function (anim) {
        for (var i = 0; i < animationElements.length; i++) if (animationElements[i].el.id == this.id && (!anim || animationElements[i].anim == anim)) {
            if (eve("raphael.anim.pause." + this.id, this, animationElements[i].anim) !== false) {
                animationElements[i].paused = true;
            }
        }
        return this;
    };
    
    elproto.resume = function (anim) {
        for (var i = 0; i < animationElements.length; i++) if (animationElements[i].el.id == this.id && (!anim || animationElements[i].anim == anim)) {
            var e = animationElements[i];
            if (eve("raphael.anim.resume." + this.id, this, e.anim) !== false) {
                delete e.paused;
                this.status(e.anim, e.status);
            }
        }
        return this;
    };
    
    elproto.stop = function (anim) {
        for (var i = 0; i < animationElements.length; i++) if (animationElements[i].el.id == this.id && (!anim || animationElements[i].anim == anim)) {
            if (eve("raphael.anim.stop." + this.id, this, animationElements[i].anim) !== false) {
                animationElements.splice(i--, 1);
            }
        }
        return this;
    };
    function stopAnimation(paper) {
        for (var i = 0; i < animationElements.length; i++) if (animationElements[i].el.paper == paper) {
            animationElements.splice(i--, 1);
        }
    }
    eve.on("raphael.remove", stopAnimation);
    eve.on("raphael.clear", stopAnimation);
    elproto.toString = function () {
        return "Rapha\xebl\u2019s object";
    };

    // Set
    var Set = function (items) {
        this.items = [];
        this.length = 0;
        this.type = "set";
        if (items) {
            for (var i = 0, ii = items.length; i < ii; i++) {
                if (items[i] && (items[i].constructor == elproto.constructor || items[i].constructor == Set)) {
                    this[this.items.length] = this.items[this.items.length] = items[i];
                    this.length++;
                }
            }
        }
    },
    setproto = Set.prototype;
    
    setproto.push = function () {
        var item,
            len;
        for (var i = 0, ii = arguments.length; i < ii; i++) {
            item = arguments[i];
            if (item && (item.constructor == elproto.constructor || item.constructor == Set)) {
                len = this.items.length;
                this[len] = this.items[len] = item;
                this.length++;
            }
        }
        return this;
    };
    
    setproto.pop = function () {
        this.length && delete this[this.length--];
        return this.items.pop();
    };
    
    setproto.forEach = function (callback, thisArg) {
        for (var i = 0, ii = this.items.length; i < ii; i++) {
            if (callback.call(thisArg, this.items[i], i) === false) {
                return this;
            }
        }
        return this;
    };
    for (var method in elproto) if (elproto[has](method)) {
        setproto[method] = (function (methodname) {
            return function () {
                var arg = arguments;
                return this.forEach(function (el) {
                    el[methodname][apply](el, arg);
                });
            };
        })(method);
    }
    setproto.attr = function (name, value) {
        if (name && R.is(name, array) && R.is(name[0], "object")) {
            for (var j = 0, jj = name.length; j < jj; j++) {
                this.items[j].attr(name[j]);
            }
        } else {
            for (var i = 0, ii = this.items.length; i < ii; i++) {
                this.items[i].attr(name, value);
            }
        }
        return this;
    };
    
    setproto.clear = function () {
        while (this.length) {
            this.pop();
        }
    };
    
    setproto.splice = function (index, count, insertion) {
        index = index < 0 ? mmax(this.length + index, 0) : index;
        count = mmax(0, mmin(this.length - index, count));
        var tail = [],
            todel = [],
            args = [],
            i;
        for (i = 2; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        for (i = 0; i < count; i++) {
            todel.push(this[index + i]);
        }
        for (; i < this.length - index; i++) {
            tail.push(this[index + i]);
        }
        var arglen = args.length;
        for (i = 0; i < arglen + tail.length; i++) {
            this.items[index + i] = this[index + i] = i < arglen ? args[i] : tail[i - arglen];
        }
        i = this.items.length = this.length -= count - arglen;
        while (this[i]) {
            delete this[i++];
        }
        return new Set(todel);
    };
    
    setproto.exclude = function (el) {
        for (var i = 0, ii = this.length; i < ii; i++) if (this[i] == el) {
            this.splice(i, 1);
            return true;
        }
    };
    setproto.animate = function (params, ms, easing, callback) {
        (R.is(easing, "function") || !easing) && (callback = easing || null);
        var len = this.items.length,
            i = len,
            item,
            set = this,
            collector;
        if (!len) {
            return this;
        }
        callback && (collector = function () {
            !--len && callback.call(set);
        });
        easing = R.is(easing, string) ? easing : collector;
        var anim = R.animation(params, ms, easing, collector);
        item = this.items[--i].animate(anim);
        while (i--) {
            this.items[i] && !this.items[i].removed && this.items[i].animateWith(item, anim, anim);
        }
        return this;
    };
    setproto.insertAfter = function (el) {
        var i = this.items.length;
        while (i--) {
            this.items[i].insertAfter(el);
        }
        return this;
    };
    setproto.getBBox = function () {
        var x = [],
            y = [],
            x2 = [],
            y2 = [];
        for (var i = this.items.length; i--;) if (!this.items[i].removed) {
            var box = this.items[i].getBBox();
            x.push(box.x);
            y.push(box.y);
            x2.push(box.x + box.width);
            y2.push(box.y + box.height);
        }
        x = mmin[apply](0, x);
        y = mmin[apply](0, y);
        x2 = mmax[apply](0, x2);
        y2 = mmax[apply](0, y2);
        return {
            x: x,
            y: y,
            x2: x2,
            y2: y2,
            width: x2 - x,
            height: y2 - y
        };
    };
    setproto.clone = function (s) {
        s = new Set;
        for (var i = 0, ii = this.items.length; i < ii; i++) {
            s.push(this.items[i].clone());
        }
        return s;
    };
    setproto.toString = function () {
        return "Rapha\xebl\u2018s set";
    };

    
    R.registerFont = function (font) {
        if (!font.face) {
            return font;
        }
        this.fonts = this.fonts || {};
        var fontcopy = {
                w: font.w,
                face: {},
                glyphs: {}
            },
            family = font.face["font-family"];
        for (var prop in font.face) if (font.face[has](prop)) {
            fontcopy.face[prop] = font.face[prop];
        }
        if (this.fonts[family]) {
            this.fonts[family].push(fontcopy);
        } else {
            this.fonts[family] = [fontcopy];
        }
        if (!font.svg) {
            fontcopy.face["units-per-em"] = toInt(font.face["units-per-em"], 10);
            for (var glyph in font.glyphs) if (font.glyphs[has](glyph)) {
                var path = font.glyphs[glyph];
                fontcopy.glyphs[glyph] = {
                    w: path.w,
                    k: {},
                    d: path.d && "M" + path.d.replace(/[mlcxtrv]/g, function (command) {
                            return {l: "L", c: "C", x: "z", t: "m", r: "l", v: "c"}[command] || "M";
                        }) + "z"
                };
                if (path.k) {
                    for (var k in path.k) if (path[has](k)) {
                        fontcopy.glyphs[glyph].k[k] = path.k[k];
                    }
                }
            }
        }
        return font;
    };
    
    paperproto.getFont = function (family, weight, style, stretch) {
        stretch = stretch || "normal";
        style = style || "normal";
        weight = +weight || {normal: 400, bold: 700, lighter: 300, bolder: 800}[weight] || 400;
        if (!R.fonts) {
            return;
        }
        var font = R.fonts[family];
        if (!font) {
            var name = new RegExp("(^|\\s)" + family.replace(/[^\w\d\s+!~.:_-]/g, E) + "(\\s|$)", "i");
            for (var fontName in R.fonts) if (R.fonts[has](fontName)) {
                if (name.test(fontName)) {
                    font = R.fonts[fontName];
                    break;
                }
            }
        }
        var thefont;
        if (font) {
            for (var i = 0, ii = font.length; i < ii; i++) {
                thefont = font[i];
                if (thefont.face["font-weight"] == weight && (thefont.face["font-style"] == style || !thefont.face["font-style"]) && thefont.face["font-stretch"] == stretch) {
                    break;
                }
            }
        }
        return thefont;
    };
    
    paperproto.print = function (x, y, string, font, size, origin, letter_spacing) {
        origin = origin || "middle"; // baseline|middle
        letter_spacing = mmax(mmin(letter_spacing || 0, 1), -1);
        var letters = Str(string)[split](E),
            shift = 0,
            notfirst = 0,
            path = E,
            scale;
        R.is(font, string) && (font = this.getFont(font));
        if (font) {
            scale = (size || 16) / font.face["units-per-em"];
            var bb = font.face.bbox[split](separator),
                top = +bb[0],
                lineHeight = bb[3] - bb[1],
                shifty = 0,
                height = +bb[1] + (origin == "baseline" ? lineHeight + (+font.face.descent) : lineHeight / 2);
            for (var i = 0, ii = letters.length; i < ii; i++) {
                if (letters[i] == "\n") {
                    shift = 0;
                    curr = 0;
                    notfirst = 0;
                    shifty += lineHeight;
                } else {
                    var prev = notfirst && font.glyphs[letters[i - 1]] || {},
                        curr = font.glyphs[letters[i]];
                    shift += notfirst ? (prev.w || font.w) + (prev.k && prev.k[letters[i]] || 0) + (font.w * letter_spacing) : 0;
                    notfirst = 1;
                }
                if (curr && curr.d) {
                    path += R.transformPath(curr.d, ["t", shift * scale, shifty * scale, "s", scale, scale, top, height, "t", (x - top) / scale, (y - height) / scale]);
                }
            }
        }
        return this.path(path).attr({
            fill: "#000",
            stroke: "none"
        });
    };

    
    paperproto.add = function (json) {
        if (R.is(json, "array")) {
            var res = this.set(),
                i = 0,
                ii = json.length,
                j;
            for (; i < ii; i++) {
                j = json[i] || {};
                elements[has](j.type) && res.push(this[j.type]().attr(j));
            }
        }
        return res;
    };

    
    R.format = function (token, params) {
        var args = R.is(params, array) ? [0][concat](params) : arguments;
        token && R.is(token, string) && args.length - 1 && (token = token.replace(formatrg, function (str, i) {
            return args[++i] == null ? E : args[i];
        }));
        return token || E;
    };
    
    R.fullfill = (function () {
        var tokenRegex = /\{([^\}]+)\}/g,
            objNotationRegex = /(?:(?:^|\.)(.+?)(?=\[|\.|$|\()|\[('|")(.+?)\2\])(\(\))?/g, // matches .xxxxx or ["xxxxx"] to run over object properties
            replacer = function (all, key, obj) {
                var res = obj;
                key.replace(objNotationRegex, function (all, name, quote, quotedName, isFunc) {
                    name = name || quotedName;
                    if (res) {
                        if (name in res) {
                            res = res[name];
                        }
                        typeof res == "function" && isFunc && (res = res());
                    }
                });
                res = (res == null || res == obj ? all : res) + "";
                return res;
            };
        return function (str, obj) {
            return String(str).replace(tokenRegex, function (all, key) {
                return replacer(all, key, obj);
            });
        };
    })();
    
    R.ninja = function () {
        oldRaphael.was ? (g.win.Raphael = oldRaphael.is) : delete Raphael;
        return R;
    };
    
    R.st = setproto;
    // Firefox <3.6 fix: http://webreflection.blogspot.com/2009/11/195-chars-to-help-lazy-loading.html
    (function (doc, loaded, f) {
        if (doc.readyState == null && doc.addEventListener){
            doc.addEventListener(loaded, f = function () {
                doc.removeEventListener(loaded, f, false);
                doc.readyState = "complete";
            }, false);
            doc.readyState = "loading";
        }
        function isLoaded() {
            (/in/).test(doc.readyState) ? setTimeout(isLoaded, 9) : R.eve("raphael.DOMload");
        }
        isLoaded();
    })(document, "DOMContentLoaded");

    oldRaphael.was ? (g.win.Raphael = R) : (Raphael = R);
    
    eve.on("raphael.DOMload", function () {
        loaded = true;
    });
})();


// ┌─────────────────────────────────────────────────────────────────────┐ \\
// │ Raphaël - JavaScript Vector Library                                 │ \\
// ├─────────────────────────────────────────────────────────────────────┤ \\
// │ SVG Module                                                          │ \\
// ├─────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright (c) 2008-2011 Dmitry Baranovskiy (http://raphaeljs.com)   │ \\
// │ Copyright (c) 2008-2011 Sencha Labs (http://sencha.com)             │ \\
// │ Licensed under the MIT (http://raphaeljs.com/license.html) license. │ \\
// └─────────────────────────────────────────────────────────────────────┘ \\
window.Raphael.svg && function (R) {
    var has = "hasOwnProperty",
        Str = String,
        toFloat = parseFloat,
        toInt = parseInt,
        math = Math,
        mmax = math.max,
        abs = math.abs,
        pow = math.pow,
        separator = /[, ]+/,
        eve = R.eve,
        E = "",
        S = " ";
    var xlink = "http://www.w3.org/1999/xlink",
        markers = {
            block: "M5,0 0,2.5 5,5z",
            classic: "M5,0 0,2.5 5,5 3.5,3 3.5,2z",
            diamond: "M2.5,0 5,2.5 2.5,5 0,2.5z",
            open: "M6,1 1,3.5 6,6",
            oval: "M2.5,0A2.5,2.5,0,0,1,2.5,5 2.5,2.5,0,0,1,2.5,0z"
        },
        markerCounter = {};
    R.toString = function () {
        return  "Your browser supports SVG.\nYou are running Rapha\xebl " + this.version;
    };
    var $ = function (el, attr) {
        if (attr) {
            if (typeof el == "string") {
                el = $(el);
            }
            for (var key in attr) if (attr[has](key)) {
                if (key.substring(0, 6) == "xlink:") {
                    el.setAttributeNS(xlink, key.substring(6), Str(attr[key]));
                } else {
                    el.setAttribute(key, Str(attr[key]));
                }
            }
        } else {
            el = R._g.doc.createElementNS("http://www.w3.org/2000/svg", el);
            el.style && (el.style.webkitTapHighlightColor = "rgba(0,0,0,0)");
        }
        return el;
    },
    addGradientFill = function (element, gradient) {
        var type = "linear",
            id = element.id + gradient,
            fx = .5, fy = .5,
            o = element.node,
            SVG = element.paper,
            s = o.style,
            el = R._g.doc.getElementById(id);
        if (!el) {
            gradient = Str(gradient).replace(R._radial_gradient, function (all, _fx, _fy) {
                type = "radial";
                if (_fx && _fy) {
                    fx = toFloat(_fx);
                    fy = toFloat(_fy);
                    var dir = ((fy > .5) * 2 - 1);
                    pow(fx - .5, 2) + pow(fy - .5, 2) > .25 &&
                        (fy = math.sqrt(.25 - pow(fx - .5, 2)) * dir + .5) &&
                        fy != .5 &&
                        (fy = fy.toFixed(5) - 1e-5 * dir);
                }
                return E;
            });
            gradient = gradient.split(/\s*\-\s*/);
            if (type == "linear") {
                var angle = gradient.shift();
                angle = -toFloat(angle);
                if (isNaN(angle)) {
                    return null;
                }
                var vector = [0, 0, math.cos(R.rad(angle)), math.sin(R.rad(angle))],
                    max = 1 / (mmax(abs(vector[2]), abs(vector[3])) || 1);
                vector[2] *= max;
                vector[3] *= max;
                if (vector[2] < 0) {
                    vector[0] = -vector[2];
                    vector[2] = 0;
                }
                if (vector[3] < 0) {
                    vector[1] = -vector[3];
                    vector[3] = 0;
                }
            }
            var dots = R._parseDots(gradient);
            if (!dots) {
                return null;
            }
            id = id.replace(/[\(\)\s,\xb0#]/g, "_");
            
            if (element.gradient && id != element.gradient.id) {
                SVG.defs.removeChild(element.gradient);
                delete element.gradient;
            }

            if (!element.gradient) {
                el = $(type + "Gradient", {id: id});
                element.gradient = el;
                $(el, type == "radial" ? {
                    fx: fx,
                    fy: fy
                } : {
                    x1: vector[0],
                    y1: vector[1],
                    x2: vector[2],
                    y2: vector[3],
                    gradientTransform: element.matrix.invert()
                });
                SVG.defs.appendChild(el);
                for (var i = 0, ii = dots.length; i < ii; i++) {
                    el.appendChild($("stop", {
                        offset: dots[i].offset ? dots[i].offset : i ? "100%" : "0%",
                        "stop-color": dots[i].color || "#fff"
                    }));
                }
            }
        }
        $(o, {
            fill: "url(#" + id + ")",
            opacity: 1,
            "fill-opacity": 1
        });
        s.fill = E;
        s.opacity = 1;
        s.fillOpacity = 1;
        return 1;
    },
    updatePosition = function (o) {
        var bbox = o.getBBox(1);
        $(o.pattern, {patternTransform: o.matrix.invert() + " translate(" + bbox.x + "," + bbox.y + ")"});
    },
    addArrow = function (o, value, isEnd) {
        if (o.type == "path") {
            var values = Str(value).toLowerCase().split("-"),
                p = o.paper,
                se = isEnd ? "end" : "start",
                node = o.node,
                attrs = o.attrs,
                stroke = attrs["stroke-width"],
                i = values.length,
                type = "classic",
                from,
                to,
                dx,
                refX,
                attr,
                w = 3,
                h = 3,
                t = 5;
            while (i--) {
                switch (values[i]) {
                    case "block":
                    case "classic":
                    case "oval":
                    case "diamond":
                    case "open":
                    case "none":
                        type = values[i];
                        break;
                    case "wide": h = 5; break;
                    case "narrow": h = 2; break;
                    case "long": w = 5; break;
                    case "short": w = 2; break;
                }
            }
            if (type == "open") {
                w += 2;
                h += 2;
                t += 2;
                dx = 1;
                refX = isEnd ? 4 : 1;
                attr = {
                    fill: "none",
                    stroke: attrs.stroke
                };
            } else {
                refX = dx = w / 2;
                attr = {
                    fill: attrs.stroke,
                    stroke: "none"
                };
            }
            if (o._.arrows) {
                if (isEnd) {
                    o._.arrows.endPath && markerCounter[o._.arrows.endPath]--;
                    o._.arrows.endMarker && markerCounter[o._.arrows.endMarker]--;
                } else {
                    o._.arrows.startPath && markerCounter[o._.arrows.startPath]--;
                    o._.arrows.startMarker && markerCounter[o._.arrows.startMarker]--;
                }
            } else {
                o._.arrows = {};
            }
            if (type != "none") {
                var pathId = "raphael-marker-" + type,
                    markerId = "raphael-marker-" + se + type + w + h;
                if (!R._g.doc.getElementById(pathId)) {
                    p.defs.appendChild($($("path"), {
                        "stroke-linecap": "round",
                        d: markers[type],
                        id: pathId
                    }));
                    markerCounter[pathId] = 1;
                } else {
                    markerCounter[pathId]++;
                }
                var marker = R._g.doc.getElementById(markerId),
                    use;
                if (!marker) {
                    marker = $($("marker"), {
                        id: markerId,
                        markerHeight: h,
                        markerWidth: w,
                        orient: "auto",
                        refX: refX,
                        refY: h / 2
                    });
                    use = $($("use"), {
                        "xlink:href": "#" + pathId,
                        transform: (isEnd ? "rotate(180 " + w / 2 + " " + h / 2 + ") " : E) + "scale(" + w / t + "," + h / t + ")",
                        "stroke-width": (1 / ((w / t + h / t) / 2)).toFixed(4)
                    });
                    marker.appendChild(use);
                    p.defs.appendChild(marker);
                    markerCounter[markerId] = 1;
                } else {
                    markerCounter[markerId]++;
                    use = marker.getElementsByTagName("use")[0];
                }
                $(use, attr);
                var delta = dx * (type != "diamond" && type != "oval");
                if (isEnd) {
                    from = o._.arrows.startdx * stroke || 0;
                    to = R.getTotalLength(attrs.path) - delta * stroke;
                } else {
                    from = delta * stroke;
                    to = R.getTotalLength(attrs.path) - (o._.arrows.enddx * stroke || 0);
                }
                attr = {};
                attr["marker-" + se] = "url(#" + markerId + ")";
                if (to || from) {
                    attr.d = Raphael.getSubpath(attrs.path, from, to);
                }
                $(node, attr);
                o._.arrows[se + "Path"] = pathId;
                o._.arrows[se + "Marker"] = markerId;
                o._.arrows[se + "dx"] = delta;
                o._.arrows[se + "Type"] = type;
                o._.arrows[se + "String"] = value;
            } else {
                if (isEnd) {
                    from = o._.arrows.startdx * stroke || 0;
                    to = R.getTotalLength(attrs.path) - from;
                } else {
                    from = 0;
                    to = R.getTotalLength(attrs.path) - (o._.arrows.enddx * stroke || 0);
                }
                o._.arrows[se + "Path"] && $(node, {d: Raphael.getSubpath(attrs.path, from, to)});
                delete o._.arrows[se + "Path"];
                delete o._.arrows[se + "Marker"];
                delete o._.arrows[se + "dx"];
                delete o._.arrows[se + "Type"];
                delete o._.arrows[se + "String"];
            }
            for (attr in markerCounter) if (markerCounter[has](attr) && !markerCounter[attr]) {
                var item = R._g.doc.getElementById(attr);
                item && item.parentNode.removeChild(item);
            }
        }
    },
    dasharray = {
        "": [0],
        "none": [0],
        "-": [3, 1],
        ".": [1, 1],
        "-.": [3, 1, 1, 1],
        "-..": [3, 1, 1, 1, 1, 1],
        ". ": [1, 3],
        "- ": [4, 3],
        "--": [8, 3],
        "- .": [4, 3, 1, 3],
        "--.": [8, 3, 1, 3],
        "--..": [8, 3, 1, 3, 1, 3]
    },
    addDashes = function (o, value, params) {
        value = dasharray[Str(value).toLowerCase()];
        if (value) {
            var width = o.attrs["stroke-width"] || "1",
                butt = {round: width, square: width, butt: 0}[o.attrs["stroke-linecap"] || params["stroke-linecap"]] || 0,
                dashes = [],
                i = value.length;
            while (i--) {
                dashes[i] = value[i] * width + ((i % 2) ? 1 : -1) * butt;
            }
            $(o.node, {"stroke-dasharray": dashes.join(",")});
        }
    },
    setFillAndStroke = function (o, params) {
        var node = o.node,
            attrs = o.attrs,
            vis = node.style.visibility;
        node.style.visibility = "hidden";
        for (var att in params) {
            if (params[has](att)) {
                if (!R._availableAttrs[has](att)) {
                    continue;
                }
                var value = params[att];
                attrs[att] = value;
                switch (att) {
                    case "blur":
                        o.blur(value);
                        break;
                    case "href":
                    case "title":
                    case "target":
                        var pn = node.parentNode;
                        if (pn.tagName.toLowerCase() != "a") {
                            var hl = $("a");
                            pn.insertBefore(hl, node);
                            hl.appendChild(node);
                            pn = hl;
                        }
                        if (att == "target") {
                            pn.setAttributeNS(xlink, "show", value == "blank" ? "new" : value);
                        } else {
                            pn.setAttributeNS(xlink, att, value);
                        }
                        break;
                    case "cursor":
                        node.style.cursor = value;
                        break;
                    case "transform":
                        o.transform(value);
                        break;
                    case "arrow-start":
                        addArrow(o, value);
                        break;
                    case "arrow-end":
                        addArrow(o, value, 1);
                        break;
                    case "clip-rect":
                        var rect = Str(value).split(separator);
                        if (rect.length == 4) {
                            o.clip && o.clip.parentNode.parentNode.removeChild(o.clip.parentNode);
                            var el = $("clipPath"),
                                rc = $("rect");
                            el.id = R.createUUID();
                            $(rc, {
                                x: rect[0],
                                y: rect[1],
                                width: rect[2],
                                height: rect[3]
                            });
                            el.appendChild(rc);
                            o.paper.defs.appendChild(el);
                            $(node, {"clip-path": "url(#" + el.id + ")"});
                            o.clip = rc;
                        }
                        if (!value) {
                            var path = node.getAttribute("clip-path");
                            if (path) {
                                var clip = R._g.doc.getElementById(path.replace(/(^url\(#|\)$)/g, E));
                                clip && clip.parentNode.removeChild(clip);
                                $(node, {"clip-path": E});
                                delete o.clip;
                            }
                        }
                    break;
                    case "path":
                        if (o.type == "path") {
                            $(node, {d: value ? attrs.path = R._pathToAbsolute(value) : "M0,0"});
                            o._.dirty = 1;
                            if (o._.arrows) {
                                "startString" in o._.arrows && addArrow(o, o._.arrows.startString);
                                "endString" in o._.arrows && addArrow(o, o._.arrows.endString, 1);
                            }
                        }
                        break;
                    case "width":
                        node.setAttribute(att, value);
                        o._.dirty = 1;
                        if (attrs.fx) {
                            att = "x";
                            value = attrs.x;
                        } else {
                            break;
                        }
                    case "x":
                        if (attrs.fx) {
                            value = -attrs.x - (attrs.width || 0);
                        }
                    case "rx":
                        if (att == "rx" && o.type == "rect") {
                            break;
                        }
                    case "cx":
                        node.setAttribute(att, value);
                        o.pattern && updatePosition(o);
                        o._.dirty = 1;
                        break;
                    case "height":
                        node.setAttribute(att, value);
                        o._.dirty = 1;
                        if (attrs.fy) {
                            att = "y";
                            value = attrs.y;
                        } else {
                            break;
                        }
                    case "y":
                        if (attrs.fy) {
                            value = -attrs.y - (attrs.height || 0);
                        }
                    case "ry":
                        if (att == "ry" && o.type == "rect") {
                            break;
                        }
                    case "cy":
                        node.setAttribute(att, value);
                        o.pattern && updatePosition(o);
                        o._.dirty = 1;
                        break;
                    case "r":
                        if (o.type == "rect") {
                            $(node, {rx: value, ry: value});
                        } else {
                            node.setAttribute(att, value);
                        }
                        o._.dirty = 1;
                        break;
                    case "src":
                        if (o.type == "image") {
                            node.setAttributeNS(xlink, "href", value);
                        }
                        break;
                    case "stroke-width":
                        if (o._.sx != 1 || o._.sy != 1) {
                            value /= mmax(abs(o._.sx), abs(o._.sy)) || 1;
                        }
                        if (o.paper._vbSize) {
                            value *= o.paper._vbSize;
                        }
                        node.setAttribute(att, value);
                        if (attrs["stroke-dasharray"]) {
                            addDashes(o, attrs["stroke-dasharray"], params);
                        }
                        if (o._.arrows) {
                            "startString" in o._.arrows && addArrow(o, o._.arrows.startString);
                            "endString" in o._.arrows && addArrow(o, o._.arrows.endString, 1);
                        }
                        break;
                    case "stroke-dasharray":
                        addDashes(o, value, params);
                        break;
                    case "fill":
                        var isURL = Str(value).match(R._ISURL);
                        if (isURL) {
                            el = $("pattern");
                            var ig = $("image");
                            el.id = R.createUUID();
                            $(el, {x: 0, y: 0, patternUnits: "userSpaceOnUse", height: 1, width: 1});
                            $(ig, {x: 0, y: 0, "xlink:href": isURL[1]});
                            el.appendChild(ig);

                            (function (el) {
                                R._preload(isURL[1], function () {
                                    var w = this.offsetWidth,
                                        h = this.offsetHeight;
                                    $(el, {width: w, height: h});
                                    $(ig, {width: w, height: h});
                                    o.paper.safari();
                                });
                            })(el);
                            o.paper.defs.appendChild(el);
                            $(node, {fill: "url(#" + el.id + ")"});
                            o.pattern = el;
                            o.pattern && updatePosition(o);
                            break;
                        }
                        var clr = R.getRGB(value);
                        if (!clr.error) {
                            delete params.gradient;
                            delete attrs.gradient;
                            !R.is(attrs.opacity, "undefined") &&
                                R.is(params.opacity, "undefined") &&
                                $(node, {opacity: attrs.opacity});
                            !R.is(attrs["fill-opacity"], "undefined") &&
                                R.is(params["fill-opacity"], "undefined") &&
                                $(node, {"fill-opacity": attrs["fill-opacity"]});
                        } else if ((o.type == "circle" || o.type == "ellipse" || Str(value).charAt() != "r") && addGradientFill(o, value)) {
                            if ("opacity" in attrs || "fill-opacity" in attrs) {
                                var gradient = R._g.doc.getElementById(node.getAttribute("fill").replace(/^url\(#|\)$/g, E));
                                if (gradient) {
                                    var stops = gradient.getElementsByTagName("stop");
                                    $(stops[stops.length - 1], {"stop-opacity": ("opacity" in attrs ? attrs.opacity : 1) * ("fill-opacity" in attrs ? attrs["fill-opacity"] : 1)});
                                }
                            }
                            attrs.gradient = value;
                            attrs.fill = "none";
                            break;
                        }
                        clr[has]("opacity") && $(node, {"fill-opacity": clr.opacity > 1 ? clr.opacity / 100 : clr.opacity});
                    case "stroke":
                        clr = R.getRGB(value);
                        node.setAttribute(att, clr.hex);
                        att == "stroke" && clr[has]("opacity") && $(node, {"stroke-opacity": clr.opacity > 1 ? clr.opacity / 100 : clr.opacity});
                        if (att == "stroke" && o._.arrows) {
                            "startString" in o._.arrows && addArrow(o, o._.arrows.startString);
                            "endString" in o._.arrows && addArrow(o, o._.arrows.endString, 1);
                        }
                        break;
                    case "gradient":
                        (o.type == "circle" || o.type == "ellipse" || Str(value).charAt() != "r") && addGradientFill(o, value);
                        break;
                    case "opacity":
                        if (attrs.gradient && !attrs[has]("stroke-opacity")) {
                            $(node, {"stroke-opacity": value > 1 ? value / 100 : value});
                        }
                        // fall
                    case "fill-opacity":
                        if (attrs.gradient) {
                            gradient = R._g.doc.getElementById(node.getAttribute("fill").replace(/^url\(#|\)$/g, E));
                            if (gradient) {
                                stops = gradient.getElementsByTagName("stop");
                                $(stops[stops.length - 1], {"stop-opacity": value});
                            }
                            break;
                        }
                    default:
                        att == "font-size" && (value = toInt(value, 10) + "px");
                        var cssrule = att.replace(/(\-.)/g, function (w) {
                            return w.substring(1).toUpperCase();
                        });
                        node.style[cssrule] = value;
                        o._.dirty = 1;
                        node.setAttribute(att, value);
                        break;
                }
            }
        }

        tuneText(o, params);
        node.style.visibility = vis;
    },
    leading = 1.2,
    tuneText = function (el, params) {
        if (el.type != "text" || !(params[has]("text") || params[has]("font") || params[has]("font-size") || params[has]("x") || params[has]("y"))) {
            return;
        }
        var a = el.attrs,
            node = el.node,
            fontSize = node.firstChild ? toInt(R._g.doc.defaultView.getComputedStyle(node.firstChild, E).getPropertyValue("font-size"), 10) : 10;

        if (params[has]("text")) {
            a.text = params.text;
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }
            var texts = Str(params.text).split("\n"),
                tspans = [],
                tspan;
            for (var i = 0, ii = texts.length; i < ii; i++) {
                tspan = $("tspan");
                i && $(tspan, {dy: fontSize * leading, x: a.x});
                tspan.appendChild(R._g.doc.createTextNode(texts[i]));
                node.appendChild(tspan);
                tspans[i] = tspan;
            }
        } else {
            tspans = node.getElementsByTagName("tspan");
            for (i = 0, ii = tspans.length; i < ii; i++) if (i) {
                $(tspans[i], {dy: fontSize * leading, x: a.x});
            } else {
                $(tspans[0], {dy: 0});
            }
        }
        $(node, {x: a.x, y: a.y});
        el._.dirty = 1;
        var bb = el._getBBox(),
            dif = a.y - (bb.y + bb.height / 2);
        dif && R.is(dif, "finite") && $(tspans[0], {dy: dif});
    },
    Element = function (node, svg) {
        var X = 0,
            Y = 0;
        
        this[0] = this.node = node;
        
        node.raphael = true;
        
        this.id = R._oid++;
        node.raphaelid = this.id;
        this.matrix = R.matrix();
        this.realPath = null;
        
        this.paper = svg;
        this.attrs = this.attrs || {};
        this._ = {
            transform: [],
            sx: 1,
            sy: 1,
            deg: 0,
            dx: 0,
            dy: 0,
            dirty: 1
        };
        !svg.bottom && (svg.bottom = this);
        
        this.prev = svg.top;
        svg.top && (svg.top.next = this);
        svg.top = this;
        
        this.next = null;
    },
    elproto = R.el;

    Element.prototype = elproto;
    elproto.constructor = Element;

    R._engine.path = function (pathString, SVG) {
        var el = $("path");
        SVG.canvas && SVG.canvas.appendChild(el);
        var p = new Element(el, SVG);
        p.type = "path";
        setFillAndStroke(p, {
            fill: "none",
            stroke: "#000",
            path: pathString
        });
        return p;
    };
    
    elproto.rotate = function (deg, cx, cy) {
        if (this.removed) {
            return this;
        }
        deg = Str(deg).split(separator);
        if (deg.length - 1) {
            cx = toFloat(deg[1]);
            cy = toFloat(deg[2]);
        }
        deg = toFloat(deg[0]);
        (cy == null) && (cx = cy);
        if (cx == null || cy == null) {
            var bbox = this.getBBox(1);
            cx = bbox.x + bbox.width / 2;
            cy = bbox.y + bbox.height / 2;
        }
        this.transform(this._.transform.concat([["r", deg, cx, cy]]));
        return this;
    };
    
    elproto.scale = function (sx, sy, cx, cy) {
        if (this.removed) {
            return this;
        }
        sx = Str(sx).split(separator);
        if (sx.length - 1) {
            sy = toFloat(sx[1]);
            cx = toFloat(sx[2]);
            cy = toFloat(sx[3]);
        }
        sx = toFloat(sx[0]);
        (sy == null) && (sy = sx);
        (cy == null) && (cx = cy);
        if (cx == null || cy == null) {
            var bbox = this.getBBox(1);
        }
        cx = cx == null ? bbox.x + bbox.width / 2 : cx;
        cy = cy == null ? bbox.y + bbox.height / 2 : cy;
        this.transform(this._.transform.concat([["s", sx, sy, cx, cy]]));
        return this;
    };
    
    elproto.translate = function (dx, dy) {
        if (this.removed) {
            return this;
        }
        dx = Str(dx).split(separator);
        if (dx.length - 1) {
            dy = toFloat(dx[1]);
        }
        dx = toFloat(dx[0]) || 0;
        dy = +dy || 0;
        this.transform(this._.transform.concat([["t", dx, dy]]));
        return this;
    };
    
    elproto.transform = function (tstr) {
        var _ = this._;
        if (tstr == null) {
            return _.transform;
        }
        R._extractTransform(this, tstr);

        this.clip && $(this.clip, {transform: this.matrix.invert()});
        this.pattern && updatePosition(this);
        this.node && $(this.node, {transform: this.matrix});
    
        if (_.sx != 1 || _.sy != 1) {
            var sw = this.attrs[has]("stroke-width") ? this.attrs["stroke-width"] : 1;
            this.attr({"stroke-width": sw});
        }

        return this;
    };
    
    elproto.hide = function () {
        !this.removed && this.paper.safari(this.node.style.display = "none");
        return this;
    };
    
    elproto.show = function () {
        !this.removed && this.paper.safari(this.node.style.display = "");
        return this;
    };
    
    elproto.remove = function () {
        if (this.removed || !this.node.parentNode) {
            return;
        }
        var paper = this.paper;
        paper.__set__ && paper.__set__.exclude(this);
        eve.unbind("raphael.*.*." + this.id);
        if (this.gradient) {
            paper.defs.removeChild(this.gradient);
        }
        R._tear(this, paper);
        if (this.node.parentNode.tagName.toLowerCase() == "a") {
            this.node.parentNode.parentNode.removeChild(this.node.parentNode);
        } else {
            this.node.parentNode.removeChild(this.node);
        }
        for (var i in this) {
            this[i] = typeof this[i] == "function" ? R._removedFactory(i) : null;
        }
        this.removed = true;
    };
    elproto._getBBox = function () {
        if (this.node.style.display == "none") {
            this.show();
            var hide = true;
        }
        var bbox = {};
        try {
            bbox = this.node.getBBox();
        } catch(e) {
            // Firefox 3.0.x plays badly here
        } finally {
            bbox = bbox || {};
        }
        hide && this.hide();
        return bbox;
    };
    
    elproto.attr = function (name, value) {
        if (this.removed) {
            return this;
        }
        if (name == null) {
            var res = {};
            for (var a in this.attrs) if (this.attrs[has](a)) {
                res[a] = this.attrs[a];
            }
            res.gradient && res.fill == "none" && (res.fill = res.gradient) && delete res.gradient;
            res.transform = this._.transform;
            return res;
        }
        if (value == null && R.is(name, "string")) {
            if (name == "fill" && this.attrs.fill == "none" && this.attrs.gradient) {
                return this.attrs.gradient;
            }
            if (name == "transform") {
                return this._.transform;
            }
            var names = name.split(separator),
                out = {};
            for (var i = 0, ii = names.length; i < ii; i++) {
                name = names[i];
                if (name in this.attrs) {
                    out[name] = this.attrs[name];
                } else if (R.is(this.paper.customAttributes[name], "function")) {
                    out[name] = this.paper.customAttributes[name].def;
                } else {
                    out[name] = R._availableAttrs[name];
                }
            }
            return ii - 1 ? out : out[names[0]];
        }
        if (value == null && R.is(name, "array")) {
            out = {};
            for (i = 0, ii = name.length; i < ii; i++) {
                out[name[i]] = this.attr(name[i]);
            }
            return out;
        }
        if (value != null) {
            var params = {};
            params[name] = value;
        } else if (name != null && R.is(name, "object")) {
            params = name;
        }
        for (var key in params) {
            eve("raphael.attr." + key + "." + this.id, this, params[key]);
        }
        for (key in this.paper.customAttributes) if (this.paper.customAttributes[has](key) && params[has](key) && R.is(this.paper.customAttributes[key], "function")) {
            var par = this.paper.customAttributes[key].apply(this, [].concat(params[key]));
            this.attrs[key] = params[key];
            for (var subkey in par) if (par[has](subkey)) {
                params[subkey] = par[subkey];
            }
        }
        setFillAndStroke(this, params);
        return this;
    };
    
    elproto.toFront = function () {
        if (this.removed) {
            return this;
        }
        if (this.node.parentNode.tagName.toLowerCase() == "a") {
            this.node.parentNode.parentNode.appendChild(this.node.parentNode);
        } else {
            this.node.parentNode.appendChild(this.node);
        }
        var svg = this.paper;
        svg.top != this && R._tofront(this, svg);
        return this;
    };
    
    elproto.toBack = function () {
        if (this.removed) {
            return this;
        }
        var parent = this.node.parentNode;
        if (parent.tagName.toLowerCase() == "a") {
            parent.parentNode.insertBefore(this.node.parentNode, this.node.parentNode.parentNode.firstChild); 
        } else if (parent.firstChild != this.node) {
            parent.insertBefore(this.node, this.node.parentNode.firstChild);
        }
        R._toback(this, this.paper);
        var svg = this.paper;
        return this;
    };
    
    elproto.insertAfter = function (element) {
        if (this.removed) {
            return this;
        }
        var node = element.node || element[element.length - 1].node;
        if (node.nextSibling) {
            node.parentNode.insertBefore(this.node, node.nextSibling);
        } else {
            node.parentNode.appendChild(this.node);
        }
        R._insertafter(this, element, this.paper);
        return this;
    };
    
    elproto.insertBefore = function (element) {
        if (this.removed) {
            return this;
        }
        var node = element.node || element[0].node;
        node.parentNode.insertBefore(this.node, node);
        R._insertbefore(this, element, this.paper);
        return this;
    };
    elproto.blur = function (size) {
        // Experimental. No Safari support. Use it on your own risk.
        var t = this;
        if (+size !== 0) {
            var fltr = $("filter"),
                blur = $("feGaussianBlur");
            t.attrs.blur = size;
            fltr.id = R.createUUID();
            $(blur, {stdDeviation: +size || 1.5});
            fltr.appendChild(blur);
            t.paper.defs.appendChild(fltr);
            t._blur = fltr;
            $(t.node, {filter: "url(#" + fltr.id + ")"});
        } else {
            if (t._blur) {
                t._blur.parentNode.removeChild(t._blur);
                delete t._blur;
                delete t.attrs.blur;
            }
            t.node.removeAttribute("filter");
        }
    };
    R._engine.circle = function (svg, x, y, r) {
        var el = $("circle");
        svg.canvas && svg.canvas.appendChild(el);
        var res = new Element(el, svg);
        res.attrs = {cx: x, cy: y, r: r, fill: "none", stroke: "#000"};
        res.type = "circle";
        $(el, res.attrs);
        return res;
    };
    R._engine.rect = function (svg, x, y, w, h, r) {
        var el = $("rect");
        svg.canvas && svg.canvas.appendChild(el);
        var res = new Element(el, svg);
        res.attrs = {x: x, y: y, width: w, height: h, r: r || 0, rx: r || 0, ry: r || 0, fill: "none", stroke: "#000"};
        res.type = "rect";
        $(el, res.attrs);
        return res;
    };
    R._engine.ellipse = function (svg, x, y, rx, ry) {
        var el = $("ellipse");
        svg.canvas && svg.canvas.appendChild(el);
        var res = new Element(el, svg);
        res.attrs = {cx: x, cy: y, rx: rx, ry: ry, fill: "none", stroke: "#000"};
        res.type = "ellipse";
        $(el, res.attrs);
        return res;
    };
    R._engine.image = function (svg, src, x, y, w, h) {
        var el = $("image");
        $(el, {x: x, y: y, width: w, height: h, preserveAspectRatio: "none"});
        el.setAttributeNS(xlink, "href", src);
        svg.canvas && svg.canvas.appendChild(el);
        var res = new Element(el, svg);
        res.attrs = {x: x, y: y, width: w, height: h, src: src};
        res.type = "image";
        return res;
    };
    R._engine.text = function (svg, x, y, text) {
        var el = $("text");
        svg.canvas && svg.canvas.appendChild(el);
        var res = new Element(el, svg);
        res.attrs = {
            x: x,
            y: y,
            "text-anchor": "middle",
            text: text,
            font: R._availableAttrs.font,
            stroke: "none",
            fill: "#000"
        };
        res.type = "text";
        setFillAndStroke(res, res.attrs);
        return res;
    };
    R._engine.setSize = function (width, height) {
        this.width = width || this.width;
        this.height = height || this.height;
        this.canvas.setAttribute("width", this.width);
        this.canvas.setAttribute("height", this.height);
        if (this._viewBox) {
            this.setViewBox.apply(this, this._viewBox);
        }
        return this;
    };
    R._engine.create = function () {
        var con = R._getContainer.apply(0, arguments),
            container = con && con.container,
            x = con.x,
            y = con.y,
            width = con.width,
            height = con.height;
        if (!container) {
            throw new Error("SVG container not found.");
        }
        var cnvs = $("svg"),
            css = "overflow:hidden;",
            isFloating;
        x = x || 0;
        y = y || 0;
        width = width || 512;
        height = height || 342;
        $(cnvs, {
            height: height,
            version: 1.1,
            width: width,
            xmlns: "http://www.w3.org/2000/svg"
        });
        if (container == 1) {
            cnvs.style.cssText = css + "position:absolute;left:" + x + "px;top:" + y + "px";
            R._g.doc.body.appendChild(cnvs);
            isFloating = 1;
        } else {
            cnvs.style.cssText = css + "position:relative";
            if (container.firstChild) {
                container.insertBefore(cnvs, container.firstChild);
            } else {
                container.appendChild(cnvs);
            }
        }
        container = new R._Paper;
        container.width = width;
        container.height = height;
        container.canvas = cnvs;
        container.clear();
        container._left = container._top = 0;
        isFloating && (container.renderfix = function () {});
        container.renderfix();
        return container;
    };
    R._engine.setViewBox = function (x, y, w, h, fit) {
        eve("raphael.setViewBox", this, this._viewBox, [x, y, w, h, fit]);
        var size = mmax(w / this.width, h / this.height),
            top = this.top,
            aspectRatio = fit ? "meet" : "xMinYMin",
            vb,
            sw;
        if (x == null) {
            if (this._vbSize) {
                size = 1;
            }
            delete this._vbSize;
            vb = "0 0 " + this.width + S + this.height;
        } else {
            this._vbSize = size;
            vb = x + S + y + S + w + S + h;
        }
        $(this.canvas, {
            viewBox: vb,
            preserveAspectRatio: aspectRatio
        });
        while (size && top) {
            sw = "stroke-width" in top.attrs ? top.attrs["stroke-width"] : 1;
            top.attr({"stroke-width": sw});
            top._.dirty = 1;
            top._.dirtyT = 1;
            top = top.prev;
        }
        this._viewBox = [x, y, w, h, !!fit];
        return this;
    };
    
    R.prototype.renderfix = function () {
        var cnvs = this.canvas,
            s = cnvs.style,
            pos;
        try {
            pos = cnvs.getScreenCTM() || cnvs.createSVGMatrix();
        } catch (e) {
            pos = cnvs.createSVGMatrix();
        }
        var left = -pos.e % 1,
            top = -pos.f % 1;
        if (left || top) {
            if (left) {
                this._left = (this._left + left) % 1;
                s.left = this._left + "px";
            }
            if (top) {
                this._top = (this._top + top) % 1;
                s.top = this._top + "px";
            }
        }
    };
    
    R.prototype.clear = function () {
        R.eve("raphael.clear", this);
        var c = this.canvas;
        while (c.firstChild) {
            c.removeChild(c.firstChild);
        }
        this.bottom = this.top = null;
        (this.desc = $("desc")).appendChild(R._g.doc.createTextNode("Created with Rapha\xebl " + R.version));
        c.appendChild(this.desc);
        c.appendChild(this.defs = $("defs"));
    };
    
    R.prototype.remove = function () {
        eve("raphael.remove", this);
        this.canvas.parentNode && this.canvas.parentNode.removeChild(this.canvas);
        for (var i in this) {
            this[i] = typeof this[i] == "function" ? R._removedFactory(i) : null;
        }
    };
    var setproto = R.st;
    for (var method in elproto) if (elproto[has](method) && !setproto[has](method)) {
        setproto[method] = (function (methodname) {
            return function () {
                var arg = arguments;
                return this.forEach(function (el) {
                    el[methodname].apply(el, arg);
                });
            };
        })(method);
    }
}(window.Raphael);

// ┌─────────────────────────────────────────────────────────────────────┐ \\
// │ Raphaël - JavaScript Vector Library                                 │ \\
// ├─────────────────────────────────────────────────────────────────────┤ \\
// │ VML Module                                                          │ \\
// ├─────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright (c) 2008-2011 Dmitry Baranovskiy (http://raphaeljs.com)   │ \\
// │ Copyright (c) 2008-2011 Sencha Labs (http://sencha.com)             │ \\
// │ Licensed under the MIT (http://raphaeljs.com/license.html) license. │ \\
// └─────────────────────────────────────────────────────────────────────┘ \\
window.Raphael.vml && function (R) {
    var has = "hasOwnProperty",
        Str = String,
        toFloat = parseFloat,
        math = Math,
        round = math.round,
        mmax = math.max,
        mmin = math.min,
        abs = math.abs,
        fillString = "fill",
        separator = /[, ]+/,
        eve = R.eve,
        ms = " progid:DXImageTransform.Microsoft",
        S = " ",
        E = "",
        map = {M: "m", L: "l", C: "c", Z: "x", m: "t", l: "r", c: "v", z: "x"},
        bites = /([clmz]),?([^clmz]*)/gi,
        blurregexp = / progid:\S+Blur\([^\)]+\)/g,
        val = /-?[^,\s-]+/g,
        cssDot = "position:absolute;left:0;top:0;width:1px;height:1px",
        zoom = 21600,
        pathTypes = {path: 1, rect: 1, image: 1},
        ovalTypes = {circle: 1, ellipse: 1},
        path2vml = function (path) {
            var total =  /[ahqstv]/ig,
                command = R._pathToAbsolute;
            Str(path).match(total) && (command = R._path2curve);
            total = /[clmz]/g;
            if (command == R._pathToAbsolute && !Str(path).match(total)) {
                var res = Str(path).replace(bites, function (all, command, args) {
                    var vals = [],
                        isMove = command.toLowerCase() == "m",
                        res = map[command];
                    args.replace(val, function (value) {
                        if (isMove && vals.length == 2) {
                            res += vals + map[command == "m" ? "l" : "L"];
                            vals = [];
                        }
                        vals.push(round(value * zoom));
                    });
                    return res + vals;
                });
                return res;
            }
            var pa = command(path), p, r;
            res = [];
            for (var i = 0, ii = pa.length; i < ii; i++) {
                p = pa[i];
                r = pa[i][0].toLowerCase();
                r == "z" && (r = "x");
                for (var j = 1, jj = p.length; j < jj; j++) {
                    r += round(p[j] * zoom) + (j != jj - 1 ? "," : E);
                }
                res.push(r);
            }
            return res.join(S);
        },
        compensation = function (deg, dx, dy) {
            var m = R.matrix();
            m.rotate(-deg, .5, .5);
            return {
                dx: m.x(dx, dy),
                dy: m.y(dx, dy)
            };
        },
        setCoords = function (p, sx, sy, dx, dy, deg) {
            var _ = p._,
                m = p.matrix,
                fillpos = _.fillpos,
                o = p.node,
                s = o.style,
                y = 1,
                flip = "",
                dxdy,
                kx = zoom / sx,
                ky = zoom / sy;
            s.visibility = "hidden";
            if (!sx || !sy) {
                return;
            }
            o.coordsize = abs(kx) + S + abs(ky);
            s.rotation = deg * (sx * sy < 0 ? -1 : 1);
            if (deg) {
                var c = compensation(deg, dx, dy);
                dx = c.dx;
                dy = c.dy;
            }
            sx < 0 && (flip += "x");
            sy < 0 && (flip += " y") && (y = -1);
            s.flip = flip;
            o.coordorigin = (dx * -kx) + S + (dy * -ky);
            if (fillpos || _.fillsize) {
                var fill = o.getElementsByTagName(fillString);
                fill = fill && fill[0];
                o.removeChild(fill);
                if (fillpos) {
                    c = compensation(deg, m.x(fillpos[0], fillpos[1]), m.y(fillpos[0], fillpos[1]));
                    fill.position = c.dx * y + S + c.dy * y;
                }
                if (_.fillsize) {
                    fill.size = _.fillsize[0] * abs(sx) + S + _.fillsize[1] * abs(sy);
                }
                o.appendChild(fill);
            }
            s.visibility = "visible";
        };
    R.toString = function () {
        return  "Your browser doesn\u2019t support SVG. Falling down to VML.\nYou are running Rapha\xebl " + this.version;
    };
    var addArrow = function (o, value, isEnd) {
        var values = Str(value).toLowerCase().split("-"),
            se = isEnd ? "end" : "start",
            i = values.length,
            type = "classic",
            w = "medium",
            h = "medium";
        while (i--) {
            switch (values[i]) {
                case "block":
                case "classic":
                case "oval":
                case "diamond":
                case "open":
                case "none":
                    type = values[i];
                    break;
                case "wide":
                case "narrow": h = values[i]; break;
                case "long":
                case "short": w = values[i]; break;
            }
        }
        var stroke = o.node.getElementsByTagName("stroke")[0];
        stroke[se + "arrow"] = type;
        stroke[se + "arrowlength"] = w;
        stroke[se + "arrowwidth"] = h;
    },
    setFillAndStroke = function (o, params) {
        // o.paper.canvas.style.display = "none";
        o.attrs = o.attrs || {};
        var node = o.node,
            a = o.attrs,
            s = node.style,
            xy,
            newpath = pathTypes[o.type] && (params.x != a.x || params.y != a.y || params.width != a.width || params.height != a.height || params.cx != a.cx || params.cy != a.cy || params.rx != a.rx || params.ry != a.ry || params.r != a.r),
            isOval = ovalTypes[o.type] && (a.cx != params.cx || a.cy != params.cy || a.r != params.r || a.rx != params.rx || a.ry != params.ry),
            res = o;


        for (var par in params) if (params[has](par)) {
            a[par] = params[par];
        }
        if (newpath) {
            a.path = R._getPath[o.type](o);
            o._.dirty = 1;
        }
        params.href && (node.href = params.href);
        params.title && (node.title = params.title);
        params.target && (node.target = params.target);
        params.cursor && (s.cursor = params.cursor);
        "blur" in params && o.blur(params.blur);
        if (params.path && o.type == "path" || newpath) {
            node.path = path2vml(~Str(a.path).toLowerCase().indexOf("r") ? R._pathToAbsolute(a.path) : a.path);
            if (o.type == "image") {
                o._.fillpos = [a.x, a.y];
                o._.fillsize = [a.width, a.height];
                setCoords(o, 1, 1, 0, 0, 0);
            }
        }
        "transform" in params && o.transform(params.transform);
        if (isOval) {
            var cx = +a.cx,
                cy = +a.cy,
                rx = +a.rx || +a.r || 0,
                ry = +a.ry || +a.r || 0;
            node.path = R.format("ar{0},{1},{2},{3},{4},{1},{4},{1}x", round((cx - rx) * zoom), round((cy - ry) * zoom), round((cx + rx) * zoom), round((cy + ry) * zoom), round(cx * zoom));
        }
        if ("clip-rect" in params) {
            var rect = Str(params["clip-rect"]).split(separator);
            if (rect.length == 4) {
                rect[2] = +rect[2] + (+rect[0]);
                rect[3] = +rect[3] + (+rect[1]);
                var div = node.clipRect || R._g.doc.createElement("div"),
                    dstyle = div.style;
                dstyle.clip = R.format("rect({1}px {2}px {3}px {0}px)", rect);
                if (!node.clipRect) {
                    dstyle.position = "absolute";
                    dstyle.top = 0;
                    dstyle.left = 0;
                    dstyle.width = o.paper.width + "px";
                    dstyle.height = o.paper.height + "px";
                    node.parentNode.insertBefore(div, node);
                    div.appendChild(node);
                    node.clipRect = div;
                }
            }
            if (!params["clip-rect"]) {
                node.clipRect && (node.clipRect.style.clip = "auto");
            }
        }
        if (o.textpath) {
            var textpathStyle = o.textpath.style;
            params.font && (textpathStyle.font = params.font);
            params["font-family"] && (textpathStyle.fontFamily = '"' + params["font-family"].split(",")[0].replace(/^['"]+|['"]+$/g, E) + '"');
            params["font-size"] && (textpathStyle.fontSize = params["font-size"]);
            params["font-weight"] && (textpathStyle.fontWeight = params["font-weight"]);
            params["font-style"] && (textpathStyle.fontStyle = params["font-style"]);
        }
        if ("arrow-start" in params) {
            addArrow(res, params["arrow-start"]);
        }
        if ("arrow-end" in params) {
            addArrow(res, params["arrow-end"], 1);
        }
        if (params.opacity != null || 
            params["stroke-width"] != null ||
            params.fill != null ||
            params.src != null ||
            params.stroke != null ||
            params["stroke-width"] != null ||
            params["stroke-opacity"] != null ||
            params["fill-opacity"] != null ||
            params["stroke-dasharray"] != null ||
            params["stroke-miterlimit"] != null ||
            params["stroke-linejoin"] != null ||
            params["stroke-linecap"] != null) {
            var fill = node.getElementsByTagName(fillString),
                newfill = false;
            fill = fill && fill[0];
            !fill && (newfill = fill = createNode(fillString));
            if (o.type == "image" && params.src) {
                fill.src = params.src;
            }
            params.fill && (fill.on = true);
            if (fill.on == null || params.fill == "none" || params.fill === null) {
                fill.on = false;
            }
            if (fill.on && params.fill) {
                var isURL = Str(params.fill).match(R._ISURL);
                if (isURL) {
                    fill.parentNode == node && node.removeChild(fill);
                    fill.rotate = true;
                    fill.src = isURL[1];
                    fill.type = "tile";
                    var bbox = o.getBBox(1);
                    fill.position = bbox.x + S + bbox.y;
                    o._.fillpos = [bbox.x, bbox.y];

                    R._preload(isURL[1], function () {
                        o._.fillsize = [this.offsetWidth, this.offsetHeight];
                    });
                } else {
                    fill.color = R.getRGB(params.fill).hex;
                    fill.src = E;
                    fill.type = "solid";
                    if (R.getRGB(params.fill).error && (res.type in {circle: 1, ellipse: 1} || Str(params.fill).charAt() != "r") && addGradientFill(res, params.fill, fill)) {
                        a.fill = "none";
                        a.gradient = params.fill;
                        fill.rotate = false;
                    }
                }
            }
            if ("fill-opacity" in params || "opacity" in params) {
                var opacity = ((+a["fill-opacity"] + 1 || 2) - 1) * ((+a.opacity + 1 || 2) - 1) * ((+R.getRGB(params.fill).o + 1 || 2) - 1);
                opacity = mmin(mmax(opacity, 0), 1);
                fill.opacity = opacity;
                if (fill.src) {
                    fill.color = "none";
                }
            }
            node.appendChild(fill);
            var stroke = (node.getElementsByTagName("stroke") && node.getElementsByTagName("stroke")[0]),
            newstroke = false;
            !stroke && (newstroke = stroke = createNode("stroke"));
            if ((params.stroke && params.stroke != "none") ||
                params["stroke-width"] ||
                params["stroke-opacity"] != null ||
                params["stroke-dasharray"] ||
                params["stroke-miterlimit"] ||
                params["stroke-linejoin"] ||
                params["stroke-linecap"]) {
                stroke.on = true;
            }
            (params.stroke == "none" || params.stroke === null || stroke.on == null || params.stroke == 0 || params["stroke-width"] == 0) && (stroke.on = false);
            var strokeColor = R.getRGB(params.stroke);
            stroke.on && params.stroke && (stroke.color = strokeColor.hex);
            opacity = ((+a["stroke-opacity"] + 1 || 2) - 1) * ((+a.opacity + 1 || 2) - 1) * ((+strokeColor.o + 1 || 2) - 1);
            var width = (toFloat(params["stroke-width"]) || 1) * .75;
            opacity = mmin(mmax(opacity, 0), 1);
            params["stroke-width"] == null && (width = a["stroke-width"]);
            params["stroke-width"] && (stroke.weight = width);
            width && width < 1 && (opacity *= width) && (stroke.weight = 1);
            stroke.opacity = opacity;
        
            params["stroke-linejoin"] && (stroke.joinstyle = params["stroke-linejoin"] || "miter");
            stroke.miterlimit = params["stroke-miterlimit"] || 8;
            params["stroke-linecap"] && (stroke.endcap = params["stroke-linecap"] == "butt" ? "flat" : params["stroke-linecap"] == "square" ? "square" : "round");
            if (params["stroke-dasharray"]) {
                var dasharray = {
                    "-": "shortdash",
                    ".": "shortdot",
                    "-.": "shortdashdot",
                    "-..": "shortdashdotdot",
                    ". ": "dot",
                    "- ": "dash",
                    "--": "longdash",
                    "- .": "dashdot",
                    "--.": "longdashdot",
                    "--..": "longdashdotdot"
                };
                stroke.dashstyle = dasharray[has](params["stroke-dasharray"]) ? dasharray[params["stroke-dasharray"]] : E;
            }
            newstroke && node.appendChild(stroke);
        }
        if (res.type == "text") {
            res.paper.canvas.style.display = E;
            var span = res.paper.span,
                m = 100,
                fontSize = a.font && a.font.match(/\d+(?:\.\d*)?(?=px)/);
            s = span.style;
            a.font && (s.font = a.font);
            a["font-family"] && (s.fontFamily = a["font-family"]);
            a["font-weight"] && (s.fontWeight = a["font-weight"]);
            a["font-style"] && (s.fontStyle = a["font-style"]);
            fontSize = toFloat(a["font-size"] || fontSize && fontSize[0]) || 10;
            s.fontSize = fontSize * m + "px";
            res.textpath.string && (span.innerHTML = Str(res.textpath.string).replace(/</g, "&#60;").replace(/&/g, "&#38;").replace(/\n/g, "<br>"));
            var brect = span.getBoundingClientRect();
            res.W = a.w = (brect.right - brect.left) / m;
            res.H = a.h = (brect.bottom - brect.top) / m;
            // res.paper.canvas.style.display = "none";
            res.X = a.x;
            res.Y = a.y + res.H / 2;

            ("x" in params || "y" in params) && (res.path.v = R.format("m{0},{1}l{2},{1}", round(a.x * zoom), round(a.y * zoom), round(a.x * zoom) + 1));
            var dirtyattrs = ["x", "y", "text", "font", "font-family", "font-weight", "font-style", "font-size"];
            for (var d = 0, dd = dirtyattrs.length; d < dd; d++) if (dirtyattrs[d] in params) {
                res._.dirty = 1;
                break;
            }
        
            // text-anchor emulation
            switch (a["text-anchor"]) {
                case "start":
                    res.textpath.style["v-text-align"] = "left";
                    res.bbx = res.W / 2;
                break;
                case "end":
                    res.textpath.style["v-text-align"] = "right";
                    res.bbx = -res.W / 2;
                break;
                default:
                    res.textpath.style["v-text-align"] = "center";
                    res.bbx = 0;
                break;
            }
            res.textpath.style["v-text-kern"] = true;
        }
        // res.paper.canvas.style.display = E;
    },
    addGradientFill = function (o, gradient, fill) {
        o.attrs = o.attrs || {};
        var attrs = o.attrs,
            pow = Math.pow,
            opacity,
            oindex,
            type = "linear",
            fxfy = ".5 .5";
        o.attrs.gradient = gradient;
        gradient = Str(gradient).replace(R._radial_gradient, function (all, fx, fy) {
            type = "radial";
            if (fx && fy) {
                fx = toFloat(fx);
                fy = toFloat(fy);
                pow(fx - .5, 2) + pow(fy - .5, 2) > .25 && (fy = math.sqrt(.25 - pow(fx - .5, 2)) * ((fy > .5) * 2 - 1) + .5);
                fxfy = fx + S + fy;
            }
            return E;
        });
        gradient = gradient.split(/\s*\-\s*/);
        if (type == "linear") {
            var angle = gradient.shift();
            angle = -toFloat(angle);
            if (isNaN(angle)) {
                return null;
            }
        }
        var dots = R._parseDots(gradient);
        if (!dots) {
            return null;
        }
        o = o.shape || o.node;
        if (dots.length) {
            o.removeChild(fill);
            fill.on = true;
            fill.method = "none";
            fill.color = dots[0].color;
            fill.color2 = dots[dots.length - 1].color;
            var clrs = [];
            for (var i = 0, ii = dots.length; i < ii; i++) {
                dots[i].offset && clrs.push(dots[i].offset + S + dots[i].color);
            }
            fill.colors = clrs.length ? clrs.join() : "0% " + fill.color;
            if (type == "radial") {
                fill.type = "gradientTitle";
                fill.focus = "100%";
                fill.focussize = "0 0";
                fill.focusposition = fxfy;
                fill.angle = 0;
            } else {
                // fill.rotate= true;
                fill.type = "gradient";
                fill.angle = (270 - angle) % 360;
            }
            o.appendChild(fill);
        }
        return 1;
    },
    Element = function (node, vml) {
        this[0] = this.node = node;
        node.raphael = true;
        this.id = R._oid++;
        node.raphaelid = this.id;
        this.X = 0;
        this.Y = 0;
        this.attrs = {};
        this.paper = vml;
        this.matrix = R.matrix();
        this._ = {
            transform: [],
            sx: 1,
            sy: 1,
            dx: 0,
            dy: 0,
            deg: 0,
            dirty: 1,
            dirtyT: 1
        };
        !vml.bottom && (vml.bottom = this);
        this.prev = vml.top;
        vml.top && (vml.top.next = this);
        vml.top = this;
        this.next = null;
    };
    var elproto = R.el;

    Element.prototype = elproto;
    elproto.constructor = Element;
    elproto.transform = function (tstr) {
        if (tstr == null) {
            return this._.transform;
        }
        var vbs = this.paper._viewBoxShift,
            vbt = vbs ? "s" + [vbs.scale, vbs.scale] + "-1-1t" + [vbs.dx, vbs.dy] : E,
            oldt;
        if (vbs) {
            oldt = tstr = Str(tstr).replace(/\.{3}|\u2026/g, this._.transform || E);
        }
        R._extractTransform(this, vbt + tstr);
        var matrix = this.matrix.clone(),
            skew = this.skew,
            o = this.node,
            split,
            isGrad = ~Str(this.attrs.fill).indexOf("-"),
            isPatt = !Str(this.attrs.fill).indexOf("url(");
        matrix.translate(-.5, -.5);
        if (isPatt || isGrad || this.type == "image") {
            skew.matrix = "1 0 0 1";
            skew.offset = "0 0";
            split = matrix.split();
            if ((isGrad && split.noRotation) || !split.isSimple) {
                o.style.filter = matrix.toFilter();
                var bb = this.getBBox(),
                    bbt = this.getBBox(1),
                    dx = bb.x - bbt.x,
                    dy = bb.y - bbt.y;
                o.coordorigin = (dx * -zoom) + S + (dy * -zoom);
                setCoords(this, 1, 1, dx, dy, 0);
            } else {
                o.style.filter = E;
                setCoords(this, split.scalex, split.scaley, split.dx, split.dy, split.rotate);
            }
        } else {
            o.style.filter = E;
            skew.matrix = Str(matrix);
            skew.offset = matrix.offset();
        }
        oldt && (this._.transform = oldt);
        return this;
    };
    elproto.rotate = function (deg, cx, cy) {
        if (this.removed) {
            return this;
        }
        if (deg == null) {
            return;
        }
        deg = Str(deg).split(separator);
        if (deg.length - 1) {
            cx = toFloat(deg[1]);
            cy = toFloat(deg[2]);
        }
        deg = toFloat(deg[0]);
        (cy == null) && (cx = cy);
        if (cx == null || cy == null) {
            var bbox = this.getBBox(1);
            cx = bbox.x + bbox.width / 2;
            cy = bbox.y + bbox.height / 2;
        }
        this._.dirtyT = 1;
        this.transform(this._.transform.concat([["r", deg, cx, cy]]));
        return this;
    };
    elproto.translate = function (dx, dy) {
        if (this.removed) {
            return this;
        }
        dx = Str(dx).split(separator);
        if (dx.length - 1) {
            dy = toFloat(dx[1]);
        }
        dx = toFloat(dx[0]) || 0;
        dy = +dy || 0;
        if (this._.bbox) {
            this._.bbox.x += dx;
            this._.bbox.y += dy;
        }
        this.transform(this._.transform.concat([["t", dx, dy]]));
        return this;
    };
    elproto.scale = function (sx, sy, cx, cy) {
        if (this.removed) {
            return this;
        }
        sx = Str(sx).split(separator);
        if (sx.length - 1) {
            sy = toFloat(sx[1]);
            cx = toFloat(sx[2]);
            cy = toFloat(sx[3]);
            isNaN(cx) && (cx = null);
            isNaN(cy) && (cy = null);
        }
        sx = toFloat(sx[0]);
        (sy == null) && (sy = sx);
        (cy == null) && (cx = cy);
        if (cx == null || cy == null) {
            var bbox = this.getBBox(1);
        }
        cx = cx == null ? bbox.x + bbox.width / 2 : cx;
        cy = cy == null ? bbox.y + bbox.height / 2 : cy;
    
        this.transform(this._.transform.concat([["s", sx, sy, cx, cy]]));
        this._.dirtyT = 1;
        return this;
    };
    elproto.hide = function () {
        !this.removed && (this.node.style.display = "none");
        return this;
    };
    elproto.show = function () {
        !this.removed && (this.node.style.display = E);
        return this;
    };
    elproto._getBBox = function () {
        if (this.removed) {
            return {};
        }
        return {
            x: this.X + (this.bbx || 0) - this.W / 2,
            y: this.Y - this.H,
            width: this.W,
            height: this.H
        };
    };
    elproto.remove = function () {
        if (this.removed || !this.node.parentNode) {
            return;
        }
        this.paper.__set__ && this.paper.__set__.exclude(this);
        R.eve.unbind("raphael.*.*." + this.id);
        R._tear(this, this.paper);
        this.node.parentNode.removeChild(this.node);
        this.shape && this.shape.parentNode.removeChild(this.shape);
        for (var i in this) {
            this[i] = typeof this[i] == "function" ? R._removedFactory(i) : null;
        }
        this.removed = true;
    };
    elproto.attr = function (name, value) {
        if (this.removed) {
            return this;
        }
        if (name == null) {
            var res = {};
            for (var a in this.attrs) if (this.attrs[has](a)) {
                res[a] = this.attrs[a];
            }
            res.gradient && res.fill == "none" && (res.fill = res.gradient) && delete res.gradient;
            res.transform = this._.transform;
            return res;
        }
        if (value == null && R.is(name, "string")) {
            if (name == fillString && this.attrs.fill == "none" && this.attrs.gradient) {
                return this.attrs.gradient;
            }
            var names = name.split(separator),
                out = {};
            for (var i = 0, ii = names.length; i < ii; i++) {
                name = names[i];
                if (name in this.attrs) {
                    out[name] = this.attrs[name];
                } else if (R.is(this.paper.customAttributes[name], "function")) {
                    out[name] = this.paper.customAttributes[name].def;
                } else {
                    out[name] = R._availableAttrs[name];
                }
            }
            return ii - 1 ? out : out[names[0]];
        }
        if (this.attrs && value == null && R.is(name, "array")) {
            out = {};
            for (i = 0, ii = name.length; i < ii; i++) {
                out[name[i]] = this.attr(name[i]);
            }
            return out;
        }
        var params;
        if (value != null) {
            params = {};
            params[name] = value;
        }
        value == null && R.is(name, "object") && (params = name);
        for (var key in params) {
            eve("raphael.attr." + key + "." + this.id, this, params[key]);
        }
        if (params) {
            for (key in this.paper.customAttributes) if (this.paper.customAttributes[has](key) && params[has](key) && R.is(this.paper.customAttributes[key], "function")) {
                var par = this.paper.customAttributes[key].apply(this, [].concat(params[key]));
                this.attrs[key] = params[key];
                for (var subkey in par) if (par[has](subkey)) {
                    params[subkey] = par[subkey];
                }
            }
            // this.paper.canvas.style.display = "none";
            if (params.text && this.type == "text") {
                this.textpath.string = params.text;
            }
            setFillAndStroke(this, params);
            // this.paper.canvas.style.display = E;
        }
        return this;
    };
    elproto.toFront = function () {
        !this.removed && this.node.parentNode.appendChild(this.node);
        this.paper && this.paper.top != this && R._tofront(this, this.paper);
        return this;
    };
    elproto.toBack = function () {
        if (this.removed) {
            return this;
        }
        if (this.node.parentNode.firstChild != this.node) {
            this.node.parentNode.insertBefore(this.node, this.node.parentNode.firstChild);
            R._toback(this, this.paper);
        }
        return this;
    };
    elproto.insertAfter = function (element) {
        if (this.removed) {
            return this;
        }
        if (element.constructor == R.st.constructor) {
            element = element[element.length - 1];
        }
        if (element.node.nextSibling) {
            element.node.parentNode.insertBefore(this.node, element.node.nextSibling);
        } else {
            element.node.parentNode.appendChild(this.node);
        }
        R._insertafter(this, element, this.paper);
        return this;
    };
    elproto.insertBefore = function (element) {
        if (this.removed) {
            return this;
        }
        if (element.constructor == R.st.constructor) {
            element = element[0];
        }
        element.node.parentNode.insertBefore(this.node, element.node);
        R._insertbefore(this, element, this.paper);
        return this;
    };
    elproto.blur = function (size) {
        var s = this.node.runtimeStyle,
            f = s.filter;
        f = f.replace(blurregexp, E);
        if (+size !== 0) {
            this.attrs.blur = size;
            s.filter = f + S + ms + ".Blur(pixelradius=" + (+size || 1.5) + ")";
            s.margin = R.format("-{0}px 0 0 -{0}px", round(+size || 1.5));
        } else {
            s.filter = f;
            s.margin = 0;
            delete this.attrs.blur;
        }
    };

    R._engine.path = function (pathString, vml) {
        var el = createNode("shape");
        el.style.cssText = cssDot;
        el.coordsize = zoom + S + zoom;
        el.coordorigin = vml.coordorigin;
        var p = new Element(el, vml),
            attr = {fill: "none", stroke: "#000"};
        pathString && (attr.path = pathString);
        p.type = "path";
        p.path = [];
        p.Path = E;
        setFillAndStroke(p, attr);
        vml.canvas.appendChild(el);
        var skew = createNode("skew");
        skew.on = true;
        el.appendChild(skew);
        p.skew = skew;
        p.transform(E);
        return p;
    };
    R._engine.rect = function (vml, x, y, w, h, r) {
        var path = R._rectPath(x, y, w, h, r),
            res = vml.path(path),
            a = res.attrs;
        res.X = a.x = x;
        res.Y = a.y = y;
        res.W = a.width = w;
        res.H = a.height = h;
        a.r = r;
        a.path = path;
        res.type = "rect";
        return res;
    };
    R._engine.ellipse = function (vml, x, y, rx, ry) {
        var res = vml.path(),
            a = res.attrs;
        res.X = x - rx;
        res.Y = y - ry;
        res.W = rx * 2;
        res.H = ry * 2;
        res.type = "ellipse";
        setFillAndStroke(res, {
            cx: x,
            cy: y,
            rx: rx,
            ry: ry
        });
        return res;
    };
    R._engine.circle = function (vml, x, y, r) {
        var res = vml.path(),
            a = res.attrs;
        res.X = x - r;
        res.Y = y - r;
        res.W = res.H = r * 2;
        res.type = "circle";
        setFillAndStroke(res, {
            cx: x,
            cy: y,
            r: r
        });
        return res;
    };
    R._engine.image = function (vml, src, x, y, w, h) {
        var path = R._rectPath(x, y, w, h),
            res = vml.path(path).attr({stroke: "none"}),
            a = res.attrs,
            node = res.node,
            fill = node.getElementsByTagName(fillString)[0];
        a.src = src;
        res.X = a.x = x;
        res.Y = a.y = y;
        res.W = a.width = w;
        res.H = a.height = h;
        a.path = path;
        res.type = "image";
        fill.parentNode == node && node.removeChild(fill);
        fill.rotate = true;
        fill.src = src;
        fill.type = "tile";
        res._.fillpos = [x, y];
        res._.fillsize = [w, h];
        node.appendChild(fill);
        setCoords(res, 1, 1, 0, 0, 0);
        return res;
    };
    R._engine.text = function (vml, x, y, text) {
        var el = createNode("shape"),
            path = createNode("path"),
            o = createNode("textpath");
        x = x || 0;
        y = y || 0;
        text = text || "";
        path.v = R.format("m{0},{1}l{2},{1}", round(x * zoom), round(y * zoom), round(x * zoom) + 1);
        path.textpathok = true;
        o.string = Str(text);
        o.on = true;
        el.style.cssText = cssDot;
        el.coordsize = zoom + S + zoom;
        el.coordorigin = "0 0";
        var p = new Element(el, vml),
            attr = {
                fill: "#000",
                stroke: "none",
                font: R._availableAttrs.font,
                text: text
            };
        p.shape = el;
        p.path = path;
        p.textpath = o;
        p.type = "text";
        p.attrs.text = Str(text);
        p.attrs.x = x;
        p.attrs.y = y;
        p.attrs.w = 1;
        p.attrs.h = 1;
        setFillAndStroke(p, attr);
        el.appendChild(o);
        el.appendChild(path);
        vml.canvas.appendChild(el);
        var skew = createNode("skew");
        skew.on = true;
        el.appendChild(skew);
        p.skew = skew;
        p.transform(E);
        return p;
    };
    R._engine.setSize = function (width, height) {
        var cs = this.canvas.style;
        this.width = width;
        this.height = height;
        width == +width && (width += "px");
        height == +height && (height += "px");
        cs.width = width;
        cs.height = height;
        cs.clip = "rect(0 " + width + " " + height + " 0)";
        if (this._viewBox) {
            R._engine.setViewBox.apply(this, this._viewBox);
        }
        return this;
    };
    R._engine.setViewBox = function (x, y, w, h, fit) {
        R.eve("raphael.setViewBox", this, this._viewBox, [x, y, w, h, fit]);
        var width = this.width,
            height = this.height,
            size = 1 / mmax(w / width, h / height),
            H, W;
        if (fit) {
            H = height / h;
            W = width / w;
            if (w * H < width) {
                x -= (width - w * H) / 2 / H;
            }
            if (h * W < height) {
                y -= (height - h * W) / 2 / W;
            }
        }
        this._viewBox = [x, y, w, h, !!fit];
        this._viewBoxShift = {
            dx: -x,
            dy: -y,
            scale: size
        };
        this.forEach(function (el) {
            el.transform("...");
        });
        return this;
    };
    var createNode;
    R._engine.initWin = function (win) {
            var doc = win.document;
            doc.createStyleSheet().addRule(".rvml", "behavior:url(#default#VML)");
            try {
                !doc.namespaces.rvml && doc.namespaces.add("rvml", "urn:schemas-microsoft-com:vml");
                createNode = function (tagName) {
                    return doc.createElement('<rvml:' + tagName + ' class="rvml">');
                };
            } catch (e) {
                createNode = function (tagName) {
                    return doc.createElement('<' + tagName + ' xmlns="urn:schemas-microsoft.com:vml" class="rvml">');
                };
            }
        };
    R._engine.initWin(R._g.win);
    R._engine.create = function () {
        var con = R._getContainer.apply(0, arguments),
            container = con.container,
            height = con.height,
            s,
            width = con.width,
            x = con.x,
            y = con.y;
        if (!container) {
            throw new Error("VML container not found.");
        }
        var res = new R._Paper,
            c = res.canvas = R._g.doc.createElement("div"),
            cs = c.style;
        x = x || 0;
        y = y || 0;
        width = width || 512;
        height = height || 342;
        res.width = width;
        res.height = height;
        width == +width && (width += "px");
        height == +height && (height += "px");
        res.coordsize = zoom * 1e3 + S + zoom * 1e3;
        res.coordorigin = "0 0";
        res.span = R._g.doc.createElement("span");
        res.span.style.cssText = "position:absolute;left:-9999em;top:-9999em;padding:0;margin:0;line-height:1;";
        c.appendChild(res.span);
        cs.cssText = R.format("top:0;left:0;width:{0};height:{1};display:inline-block;position:relative;clip:rect(0 {0} {1} 0);overflow:hidden", width, height);
        if (container == 1) {
            R._g.doc.body.appendChild(c);
            cs.left = x + "px";
            cs.top = y + "px";
            cs.position = "absolute";
        } else {
            if (container.firstChild) {
                container.insertBefore(c, container.firstChild);
            } else {
                container.appendChild(c);
            }
        }
        res.renderfix = function () {};
        return res;
    };
    R.prototype.clear = function () {
        R.eve("raphael.clear", this);
        this.canvas.innerHTML = E;
        this.span = R._g.doc.createElement("span");
        this.span.style.cssText = "position:absolute;left:-9999em;top:-9999em;padding:0;margin:0;line-height:1;display:inline;";
        this.canvas.appendChild(this.span);
        this.bottom = this.top = null;
    };
    R.prototype.remove = function () {
        R.eve("raphael.remove", this);
        this.canvas.parentNode.removeChild(this.canvas);
        for (var i in this) {
            this[i] = typeof this[i] == "function" ? R._removedFactory(i) : null;
        }
        return true;
    };

    var setproto = R.st;
    for (var method in elproto) if (elproto[has](method) && !setproto[has](method)) {
        setproto[method] = (function (methodname) {
            return function () {
                var arg = arguments;
                return this.forEach(function (el) {
                    el[methodname].apply(el, arg);
                });
            };
        })(method);
    }
}(window.Raphael);
window.multigraph.util.namespace("window.multigraph.graphics.raphael", function (ns) {
    "use strict";

    ns.mixin = new window.multigraph.core.Mixin();

});
window.multigraph.util.namespace("window.multigraph.graphics.raphael", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {

        ns.Axis.respondsTo("renderGrid", function (graph, paper, set) {
            var text = paper.text(-8000, -8000, "foo"),
                path = "";

            this.prepareRender(text);

            // draw the grid lines
            if (this.hasDataMin() && this.hasDataMax()) { // skip if we don't yet have data values
                if (this.grid().visible()) { // skip if grid lines aren't turned on
                    if (this.labelers().size() > 0 && this.currentLabelDensity() <= 1.5) {
                        this.currentLabeler().prepare(this.dataMin(), this.dataMax());
                        while (this.currentLabeler().hasNext()) {
                            var v = this.currentLabeler().next(),
                                a = this.dataValueToAxisValue(v);
                            if (this.orientation() === ns.Axis.HORIZONTAL) {
                                path += "M" + a + "," + this.perpOffset();
                                path += "L" + a + "," + (graph.plotBox().height() - this.perpOffset());
                            } else {
                                path += "M" + this.perpOffset() + "," + a;
                                path += "L" + (graph.plotBox().width() - this.perpOffset()) + "," + a;
                            }
                        }
                        
                        set.push( paper.path(path)
                                .attr({
                                    "stroke-width" : 1,
                                    "stroke"       : this.grid().color().getHexString("#")
                                }));
                    }
                }
            }

            text.remove();

        });

        ns.Axis.respondsTo("render", function (graph, paper, set, baseTransformString) {
            var text = paper.text(-8000, -8000, "foo"),
                tickmarkPath = "";

            // NOTE: axes are drawn relative to the graph's plot area (plotBox); the coordinates
            //   below are relative to the coordinate system of that box.
            if (this.orientation() === ns.Axis.HORIZONTAL) {
                set.push( paper.path("M " + this.parallelOffset() + ", " + this.perpOffset() + 
                                     " l " + this.pixelLength() + ", 0")
                          .attr({"stroke":this.color().getHexString("#")}));

            } else {
                set.push( paper.path("M " + this.perpOffset() + ", " + this.parallelOffset() +
                                     " l 0, " + this.pixelLength() )
                          .attr({"stroke":this.color().getHexString("#")}));
            }

            //
            // Render the tick marks and labels
            //
            if (this.hasDataMin() && this.hasDataMax()) { // but skip if we don't yet have data values
                if (this.currentLabeler()) {
                    this.currentLabeler().prepare(this.dataMin(), this.dataMax());
                    while (this.currentLabeler().hasNext()) {
                        var v = this.currentLabeler().next();
                        var a = this.dataValueToAxisValue(v);
                        if (this.orientation() === ns.Axis.HORIZONTAL) {
                            tickmarkPath += "M" + a + "," + (this.perpOffset() + this.tickmax());
                            tickmarkPath += "L" + a + "," + (this.perpOffset() + this.tickmin());
                        } else {
                            tickmarkPath += "M" + (this.perpOffset() + this.tickmin()) + "," + a;
                            tickmarkPath += "L" + (this.perpOffset() + this.tickmax()) + "," + a;
                        }
                        this.currentLabeler().renderLabel({"paper": paper,
                                                           "textElem": text,
                                                           "transformString": baseTransformString
                                                          }, v);
                    }
                    set.push(
                        paper.path(tickmarkPath)
                    );
                }
            }

            text.remove();

        });

    });

});
window.multigraph.util.namespace("window.multigraph.graphics.raphael", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {

        window.multigraph.core.Background.respondsTo("render", function (graph, paper, set, width, height) {
            var mb = graph.window().margin().left() + graph.window().border();

            set.push( paper.rect(mb,mb,width-2*mb,height-2*mb)
                      .attr({
                          "fill"   : this.color().getHexString("#"),
                          "stroke" : this.color().getHexString("#")
                      }) );
            if (this.img() && this.img().src() !== undefined) {
                this.img().render(graph, paper, set, width, height);
            }
        });

    });

});
window.multigraph.util.namespace("window.multigraph.graphics.raphael", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {
        var Graph = ns.Graph;

        Graph.hasA("transformString");

        Graph.hasA("x0").which.isA("number");
        Graph.hasA("y0").which.isA("number");

        Graph.respondsTo("render", function (paper, width, height) {
            var windowBorder = this.window().border(),
                backgroundSet = paper.set(),
                axesSet = paper.set(),
                plotsSet = paper.set(),
                i;

            this.x0( this.window().margin().left() + windowBorder + this.window().padding().left() + this.plotarea().margin().left() + this.plotarea().border() );
            this.y0( this.window().margin().bottom() + windowBorder + this.window().padding().bottom() + this.plotarea().margin().bottom() + this.plotarea().border() );
            this.transformString("S 1, -1, 0, " + (height/2) + " t " + this.x0() + ", " + this.y0());

            this.window().render(this, paper, backgroundSet, width, height);

            this.background().render(this, paper, backgroundSet, width, height);

            this.plotarea().render(this, paper, backgroundSet);

            for (i = 0; i < this.axes().size(); ++i) {
                this.axes().at(i).renderGrid(this, paper, axesSet);
            }

            for (i = 0; i < this.axes().size(); ++i) {
                this.axes().at(i).render(this, paper, axesSet, this.transformString());
            }

            for (i = 0; i < this.plots().size(); ++i) {
                this.plots().at(i).render(this, {"paper": paper,
                                                 "set": plotsSet});
            }

            this.legend().render({"paper": paper,
                                  "transformString": this.transformString()});

            this.transformSets(height, this.x0(), this.y0(), backgroundSet, axesSet, plotsSet);
            this.fixLayers(backgroundSet, axesSet, plotsSet);

        });

        Graph.respondsTo("transformSets", function (height, x0, y0, backgroundSet, axesSet, plotsSet) {
            var i;
            for (i = 0; i < backgroundSet.length; i++) {
                if (backgroundSet[i].type !== "image") {
                    backgroundSet[i].transform("S 1, -1, 0, " + (height/2));
                }
            }
            axesSet.transform(this.transformString());
            plotsSet.transform(this.transformString());
            plotsSet.attr("clip-rect", "1,1," + (this.plotBox().width()-2) + "," + (this.plotBox().height()-2));
        });

        Graph.respondsTo("fixLayers", function (backgroundSet, axesSet, plotsSet) {
//            backgroundSet.insertAfter(axesSet);
//            axesSet.insertAfter(plotsSet);
//            plotsSet.toFront();
        });

    });

});
window.multigraph.util.namespace("window.multigraph.graphics.raphael", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {
        ns.Icon.respondsTo("renderBorder", function (graphicsContext, x, y, opacity) {
            graphicsContext.paper.rect(x, y, this.width(), this.height())
                .attr({"stroke": "rgba(0, 0, 0, " + opacity + ")"})
                .transform(graphicsContext.transformString);
        });
    });
});
window.multigraph.util.namespace("window.multigraph.graphics.raphael", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {

        window.multigraph.core.Img.hasA("image").which.defaultsTo(function () {return new Image();});
        window.multigraph.core.Img.hasA("fetched").which.defaultsTo(false);

        window.multigraph.core.Img.respondsTo("render", function (graph, paper, set, width, height) {
            var that = this,
                paddingLeft,
                paddingTop,
                plotLeft,
                plotTop,
                ax,
                ay,
                bx,
                by,
                x,
                y;

            if (this.fetched()) {
                ax = window.multigraph.math.util.interp(this.anchor().x(), -1, 1, 0, this.image().width);
                ay = window.multigraph.math.util.interp(this.anchor().y(), 1, -1, 0, this.image().height);
                paddingLeft = graph.window().margin().left() + graph.window().border();
                paddingTop = graph.window().margin().top() + graph.window().border();
                plotLeft = paddingLeft + graph.window().padding().left() + graph.plotarea().margin().left() + graph.plotarea().border();
                plotTop = paddingTop + graph.window().padding().top() + graph.plotarea().margin().top() + graph.plotarea().border();
                if (this.frame() === "plot") {
                    bx = plotLeft + window.multigraph.math.util.interp(this.base().x(), -1, 1, 0, graph.plotBox().width());
                    by = plotTop + window.multigraph.math.util.interp(this.base().y(), 1, -1, 0, graph.plotBox().height());
                } else {
                    bx = paddingLeft + window.multigraph.math.util.interp(this.base().x(), -1, 1, 0, graph.paddingBox().width());
                    by = paddingTop + window.multigraph.math.util.interp(this.base().y(), 1, -1, 0, graph.paddingBox().height());
                }
                x = bx + this.position().x() - ax;
                y = by + this.position().y() - ay;
                set.push( paper.image(this.src(), x, y, this.image().width, this.image().height) );                
            } else {
                this.image().onload = function () {
                    that.fetched(true);
                    graph.render(paper, width, height);
                };
                this.image().src = this.src();
            }
        });

    });

});
window.multigraph.util.namespace("window.multigraph.graphics.raphael", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {

/*
        var measureTextWidth = function (elem, string) {
            elem.attr("text", string);
            return elem.getBBox().width; 
        };

        var measureTextHeight = function (elem, string) {
            elem.attr("text", string);
            return elem.getBBox().height; 
        };
*/

        var drawText = function (text, graphicsContext, base, anchor, position, angle) {
            var h = text.height(),
                w = text.width(),
                ax = 0.5 * w * (anchor.x() + 1),
                ay = 0.5 * h * (anchor.y() + 1),

                dx = base.x() + (0.5 * w) + position.x() - ax,
                dy = base.y() - (0.5 * h) - position.y() + ay,
                transformString = "";

            
            transformString += graphicsContext.transformString;
            transformString += "s1,-1," + dx + "," + base.y();
            transformString += "r" + (-angle) + "," + (dx - w/2) + "," + dy;

            graphicsContext.paper.text(dx, dy, text.string()).transform(transformString);

        };

        ns.Labeler.respondsTo("measureStringWidth", function (graphicsContext, string) {
            return (new ns.Text(string)).measureStringWidth(graphicsContext);
//            return measureTextWidth(graphicsContext, string);
        });

        ns.Labeler.respondsTo("renderLabel", function (graphicsContext, value) {
            var formattedString = new ns.Text(this.formatter().format(value)),
                a = this.axis().dataValueToAxisValue(value);

            formattedString.initializeGeometry(graphicsContext.textElem);

            if (this.axis().orientation() === ns.Axis.HORIZONTAL) {
                drawText(formattedString, graphicsContext, new window.multigraph.math.Point(a, this.axis().perpOffset()), this.anchor(), this.position(), this.angle());
            } else {
                drawText(formattedString, graphicsContext, new window.multigraph.math.Point(this.axis().perpOffset(), a), this.anchor(), this.position(), this.angle());
            }
        });


    });

});
window.multigraph.util.namespace("window.multigraph.graphics.raphael", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {
        ns.Legend.respondsTo("begin", function (graphicsContext) {
            graphicsContext.transformString += "t" + this.x() + "," + this.y();
        });

        ns.Legend.respondsTo("end", function (graphicsContext) {
            // no-op
        });

        ns.Legend.respondsTo("renderLegend", function (graphicsContext) {
            graphicsContext.paper.rect(0, 0, this.width(), this.height())
                .attr({
                    "stroke" : this.bordercolor().toRGBA(this.opacity()),
                    "fill"   : this.bordercolor().toRGBA(this.opacity())
                })
                .transform(graphicsContext.transformString);

            graphicsContext.paper.rect(this.border(), this.border(), this.width() - (2 * this.border()), this.height() - (2 * this.border()))
                .attr({
                    "stroke" : this.color().toRGBA(this.opacity()),
                    "fill"   : this.color().toRGBA(this.opacity())
                })
                .transform(graphicsContext.transformString);

        });

        ns.Legend.respondsTo("renderLabel", function (label, graphicsContext, x, y) {
            graphicsContext.paper.text(x, y, label)
                .attr({
                    "fill" : "rgba(0, 0, 0, " + this.opacity() + ")"
                })
                .transform(graphicsContext.transformString + "t0," + (this.maxLabelHeight()/2) + "s1,-1");

        });

    });

});
/*global Raphael */

window.multigraph.util.namespace("window.multigraph.graphics.raphael", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {

        ns.Multigraph.hasA("paper"); // Raphael paper object

        ns.Multigraph.hasA("$div");  // jQuery object for the Raphael paper's div

        ns.Multigraph.hasA("width").which.isA("number");
        ns.Multigraph.hasA("height").which.isA("number");

        ns.Multigraph.hasA("baseX").which.isA("number");
        ns.Multigraph.hasA("baseY").which.isA("number");
        ns.Multigraph.hasA("mouseLastX").which.isA("number");
        ns.Multigraph.hasA("mouseLastY").which.isA("number");

        ns.Multigraph.respondsTo("redraw", function () {
            var that = this;
            window.requestAnimationFrame(function () {
                that.render();
            });
        });

        ns.Multigraph.respondsTo("init", function () {
            this.$div(window.multigraph.jQuery(this.div()));
            this.$div().on("mousedown", { "mg": this }, this.setupEvents);
            this.width(this.$div().width());
            this.height(this.$div().height());
            if (this.paper()) {
                this.paper().remove();
            }
            this.paper(new window.Raphael(this.div(), this.width(), this.height()));
            this.render();
        });

        ns.Multigraph.respondsTo("render", function () {
            var i;
            var text = this.paper().text(-8000, -8000, "foo");
            this.paper().clear();
            this.initializeGeometry(this.width(), this.height(), text);
            for (i=0; i<this.graphs().size(); ++i) {
                this.graphs().at(i).render(this.paper(), this.width(), this.height());
            }
            text.remove();
        });

        ns.Multigraph.respondsTo("setupEvents", function (mouseDownEvent) {
            var mg = mouseDownEvent.data.mg;

            mg.baseX(mouseDownEvent.pageX - mg.$div().offset().left);
            mg.baseY(mg.$div().height() - (mouseDownEvent.pageY - mg.$div().offset().top));
            mg.mouseLastX(mouseDownEvent.pageX - mg.$div().offset().left);
            mg.mouseLastY(mg.$div().height() - (mouseDownEvent.pageY - mg.$div().offset().top));

            mg.graphs().at(0).doDragReset();

            mg.$div().on("mousemove", { "mg": mg }, mg.triggerEvents);
            mg.$div().on("mouseup", { "mg": mg }, mg.unbindEvents);
            mg.$div().on("mouseleave", { "mg": mg }, mg.unbindEvents);
        });

        ns.Multigraph.respondsTo("triggerEvents", function (mouseMoveEvent) {
            var mg = mouseMoveEvent.data.mg,
                eventX = mouseMoveEvent.pageX - mg.$div().offset().left,
                eventY = mg.$div().height() - (mouseMoveEvent.pageY - mg.$div().offset().top),
                dx = eventX - mg.mouseLastX(),
                dy = eventY - mg.mouseLastY(),
                i;

            mg.mouseLastX(eventX);
            mg.mouseLastY(eventY);

            for (i = 0; i < mg.graphs().size(); ++i) {
                mg.graphs().at(i).doDrag(mg, mg.baseX(), mg.baseY(), dx, dy, mouseMoveEvent.shiftKey);
            }

        });

        ns.Multigraph.respondsTo("unbindEvents", function (e) {
            var mg = e.data.mg;
            mg.$div().off("mousemove", mg.triggerEvents);
            mg.$div().off("mouseup", mg.unbindEvents);
            mg.$div().off("mouseleave", mg.unbindEvents);
        });

    });

    window.multigraph.core.Multigraph.createRaphaelGraph = function (div, muglurl) {

        window.multigraph.parser.jquery.mixin.apply(window.multigraph, "parseXML", "serialize");
        ns.mixin.apply(window.multigraph.core);
        window.multigraph.normalizer.mixin.apply(window.multigraph.core);
        window.multigraph.events.jquery.mouse.mixin.apply(window.multigraph);

        var muglPromise = window.multigraph.jQuery.ajax({
            "url"      : muglurl,
            "dataType" : "text"
        }),

            deferred = window.multigraph.jQuery.Deferred();

        muglPromise.done(function (data) {
            var multigraph = window.multigraph.core.Multigraph.parseXML( window.multigraph.parser.jquery.stringToJQueryXMLObj(data) );
            multigraph.normalize();
            multigraph.div(div);
            multigraph.init();
            multigraph.registerCommonDataCallback(function () {
                multigraph.redraw();
            });
            deferred.resolve(multigraph);
        });

        return deferred.promise();

    };

});
window.multigraph.util.namespace("window.multigraph.graphics.raphael", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {

        window.multigraph.core.Plotarea.respondsTo("render", function (graph, paper, set) {
            var paddingBox = graph.window().margin().left() + graph.window().border() + graph.window().padding().left(),
                plotBoxWidth = graph.paddingBox().width() - this.margin().right() - this.margin().left(),
                plotBoxHeight = graph.paddingBox().height() - this.margin().top() - this.margin().bottom(),
                border;

            if (this.border() > 0) {
                border = paper.rect(paddingBox + this.margin().left(),
                                    paddingBox + this.margin().right(),
                                    plotBoxWidth,
                                    plotBoxHeight)
                    .attr({"fill-opacity" : 0,
                           "stroke-opacity" : 1,
                           "stroke" : this.bordercolor().getHexString("#"),
                           "stroke-width": this.border()});
                border.insertAfter(set);
                set.push(border);
            }

        });

    });

});
window.multigraph.util.namespace("window.multigraph.graphics.raphael", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {

        // cached state object, for quick access during rendering, populated in begin() method:
        ns.BandRenderer.hasA("state");

        ns.BandRenderer.respondsTo("begin", function (graphicsContext) {
            var state = {
                "paper"              : graphicsContext.paper,
                "set"                : graphicsContext.set,
                "run"                : [],
                "fillPath"           : "",
                "line1Path"          : "",
                "line2Path"          : "",
                "linecolor"          : this.getOptionValue("linecolor"),
                "line1color"         : this.getOptionValue("line1color"),
                "line2color"         : this.getOptionValue("line2color"),
                "linewidth"          : this.getOptionValue("linewidth"),
                "line1width"         : this.getOptionValue("line1width"),
                "line2width"         : this.getOptionValue("line2width"),
                "fillcolor"          : this.getOptionValue("fillcolor"),
                "fillopacity"        : this.getOptionValue("fillopacity")
            };
            this.state(state);
        });

        // This renderer's dataPoint() method works by accumulating
        // and drawing one "run" of data points at a time.  A "run" of
        // points consists of a consecutive sequence of non-missing
        // data points which have the same fill color.  (The fill
        // color can change if the data line crosses the fill base
        // line, if the downfillcolor is different from the
        // fillcolor.)
        ns.BandRenderer.respondsTo("dataPoint", function (datap) {
            var state = this.state(),
                p;

            if (this.isMissing(datap)) {
                // if this is a missing point, render and reset the current run, if any
                if (state.run.length > 0) {
                    this.renderRun();
                    state.run = [];
                }
            } else {
                // otherwise, transform point to pixel coords
                p = this.transformPoint(datap);
                // and add it to the current run
                state.run.push(p);
            }
        });

        ns.BandRenderer.respondsTo("end", function () {
            var state = this.state(),
                paper = state.paper,
                set = state.set,
                width,
                color;
            // render the current run, if any
            if (state.run.length > 0) {
                this.renderRun();
            }

            set.push(
                paper.path(state.fillPath)
                    .attr({
                        "stroke-width": 1,
                        "fill": state.fillcolor.toRGBA(state.fillopacity),
                        "stroke": state.fillcolor.toRGBA(state.fillopacity)
                    })
            );
                
            width = (state.line1width >= 0) ? state.line1width : state.linewidth;
            if (state.line1Path !== "" && width > 0) {
                color = (state.line1color !== null) ? state.line1color : state.linecolor;
                set.push(
                    paper.path(state.line1Path)
                        .attr({
                            "stroke-width": width,
                            "stroke": color.getHexString("#")
                        })
                );
            }
            
            width = (state.line2width >= 0) ? state.line2width : state.linewidth;
            if (state.line2Path !== "" && width > 0) {
                color = (state.line2color !== null) ? state.line2color : state.linecolor;
                set.push(
                    paper.path(state.line2Path)
                        .attr({
                            "stroke-width": width,
                            "stroke": color.getHexString("#")
                        })
                );
            }
            
        });

        //
        // Private utility function to stroke line segments connecting the points of a run
        //
        var strokeRunLine = function (path, run, whichLine, width, defaultWidth) {
            var i;

            width = (width >= 0) ? width : defaultWidth;
            if (width > 0) {
                path += "M" + run[0][0] + "," + run[0][whichLine];
                for (i = 1; i < run.length; ++i) {
                    path += "L" + run[i][0] + "," + run[i][whichLine];
                }

            }
            return path;
        };

        // Render the current run of data points.  This consists of drawing the fill region
        // in the band between the two data lines, and connecting the points of each data line
        // with lines of the appropriate color.
        ns.BandRenderer.respondsTo("renderRun", function () {
            var state = this.state(),
                fillPath = state.fillPath,
                line1Path = state.line1Path,
                line2Path = state.line2Path,
                run = state.run,
                i;

            // trace to the right along line 1
            fillPath += "M" + run[0][0] + "," + run[0][1];            
            for (i=1; i<run.length; ++i) {
                fillPath += "L" + run[i][0] + "," + run[i][1];
            }

            // trace back to the left along line 2
            fillPath += "L" + run[run.length-1][0] + "," + run[run.length-1][2];
            for (i=run.length-1; i>=0; --i) {
                fillPath += "L" + run[i][0] + "," + run[i][2];
            }
            fillPath += "Z";

            // stroke line1
            line1Path = strokeRunLine(line1Path, run, 1, state.line1width, state.linewidth);
            
            // stroke line2
            line2Path = strokeRunLine(line2Path, run, 2, state.line2width, state.linewidth);

            state.fillPath = fillPath;
            state.line1Path = line1Path;
            state.line2Path = line2Path;
        });

        ns.BandRenderer.respondsTo("renderLegendIcon", function (graphicsContext, x, y, icon, opacity) {
            var state = this.state(),
                backgroundColor,
                linewidth,
                linecolor,
                path = "";

            // Draw icon background (with opacity)
            if (icon.width() < 10 || icon.height() < 10) {
                backgroundColor = state.fillcolor.toRGBA(opacity);
            } else {
                backgroundColor = "rgba(255, 255, 255, " + opacity + ")";
            }

            graphicsContext.paper.rect(x, y, icon.width(), icon.height())
                .attr({
                    "stroke" : "rgba(255, 255, 255, " + opacity + ")",
                    "fill"   : backgroundColor
                })
                .transform(graphicsContext.transformString);

            
            path += "M" + 0 + "," + (2*icon.height()/8);
            path += "L" + 0 + "," + (6*icon.height()/8);
            path += "L" + icon.width() + "," + (7*icon.height()/8);
            path += "L" + icon.width() + "," + (3*icon.height()/8);
            path += "L" + 0 + "," + (2*icon.height()/8);

            linewidth = (state.line2width >= 0) ? state.line2width : state.linewidth;
            linecolor = (state.line2color !== null) ? state.line2color : state.linecolor;
            graphicsContext.paper.path(path)
                .attr({
                    "stroke-width" : linewidth,
                    "stroke"       : linecolor.toRGBA(opacity),
                    "fill"         : state.fillcolor.toRGBA(opacity * state.fillopacity)
                })
                .transform(graphicsContext.transformString + "t" + x + "," + y);
            
        });

    });

});
window.multigraph.util.namespace("window.multigraph.graphics.raphael", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {

        // cached settings object, for quick access during rendering, populated in begin() method:
        ns.BarRenderer.hasA("settings");

        ns.BarRenderer.respondsTo("begin", function (graphicsContext) {
            var settings = {
                "paper"              : graphicsContext.paper,
                "set"                : graphicsContext.set,
                "paths"              : [],
                "barpixelwidth"      : this.getOptionValue("barwidth").getRealValue() * this.plot().horizontalaxis().axisToDataRatio(),
                "baroffset"          : this.getOptionValue("baroffset"),
                "barpixelbase"       : (this.getOptionValue("barbase") !== null)?this.plot().verticalaxis().dataValueToAxisValue(this.getOptionValue("barbase")):0,
                "fillcolor"          : this.getOptionValue("fillcolor"),
                "linecolor"          : this.getOptionValue("linecolor"),
                "hidelines"          : this.getOptionValue("hidelines"),
                "barGroups"          : [],
                "currentBarGroup"    : null,
                "prevCorner"         : null,
                "pixelEdgeTolerance" : 1
            };

            this.settings(settings);
        });

        ns.BarRenderer.respondsTo("dataPoint", function (datap) {
            var settings = this.settings(),
                p,
                x0,
                x1,
                fillcolor = this.getOptionValue("fillcolor", datap[1]),
                flag = false,
                i;

            if (this.isMissing(datap)) {
                return;
            }

            p = this.transformPoint(datap);

            x0 = p[0] + settings.baroffset;
            x1 = p[0] + settings.baroffset + settings.barpixelwidth;
            
            for (i = 0; i < settings.paths.length; i++) {
                if (settings.paths[i].fillcolor === fillcolor) {
                    settings.paths[i].path += this.generateBar(x0, settings.barpixelbase, settings.barpixelwidth, p[1] - settings.barpixelbase);
                    flag = true;
                    break;
                }
            }

            if (flag === false) {
                i = settings.paths.length;
                settings.paths[i] = {};
                settings.paths[i].fillcolor = fillcolor;
                settings.paths[i].path = this.generateBar(x0, settings.barpixelbase, settings.barpixelwidth, p[1] - settings.barpixelbase);
            }

            if (settings.barpixelwidth > settings.hidelines) {
                if (settings.prevCorner === null) {
                    settings.currentBarGroup = [ [x0,p[1]] ];
                } else {
                    if (Math.abs(x0 - settings.prevCorner[0]) <= settings.pixelEdgeTolerance) {
                        settings.currentBarGroup.push( [x0,p[1]] );
                    } else {
                        settings.currentBarGroup.push( settings.prevCorner );
                        settings.barGroups.push( settings.currentBarGroup );
                        settings.currentBarGroup = [ [x0,p[1]] ];
                    }
                }
                settings.prevCorner = [x1,p[1]];
            }
        });

        ns.BarRenderer.respondsTo("end", function () {
            var settings = this.settings(),
                p,
                outlinePath = "",
                barGroup,
                i,
                j,
                n;

            if (settings.prevCorner !== null && settings.currentBarGroup !== null) {
                settings.currentBarGroup.push( settings.prevCorner );
                settings.barGroups.push( settings.currentBarGroup );
            }        

            for (i = 0; i < settings.barGroups.length; i++) {
                barGroup = settings.barGroups[i];
                n = barGroup.length;
                if (n < 2) { return; } // this should never happen
                
                // For the first point, draw 3 lines:
                //
                //       y |------
                //         |
                //         |
                //    base |------
                //         ^     ^
                //         x     x(next)
                //
                
                //   horizontal line @ y from x(next) to x
                outlinePath += "M" + barGroup[1][0] + "," + barGroup[0][1];
                outlinePath += "L" + barGroup[0][0] + "," + barGroup[0][1];
                //   vertical line @ x from y to base
                outlinePath += "L" + barGroup[0][0] + "," + settings.barpixelbase;
                //   horizontal line @ base from x to x(next)
                outlinePath += "L" + barGroup[1][0] + "," + settings.barpixelbase;
                
                for (j = 1; j < n - 1; ++j) {
                    // For intermediate points, draw 3 lines:
                    //
                    //       y |
                    //         |
                    //         |
                    //         |------ y(next)
                    //         |
                    //         |
                    //         |------ base
                    //         ^     ^
                    //         x     x(next)
                    //
                    //   vertical line @ x from min to max of (y, y(next), base)
                    outlinePath += "M" + barGroup[j][0] + "," + Math.min(barGroup[j-1][1], barGroup[j][1], settings.barpixelbase);
                    outlinePath += "L" + barGroup[j][0] + "," + Math.max(barGroup[j-1][1], barGroup[j][1], settings.barpixelbase);
                    //   horizontal line @ y(next) from x to x(next)
                    outlinePath += "M" + barGroup[j][0] + "," +   barGroup[j][1];
                    outlinePath += "L" + barGroup[j+1][0] + "," + barGroup[j][1];
                    //   horizontal line @ base from x to x(next)
                    outlinePath += "M" + barGroup[j][0] + "," +   settings.barpixelbase;
                    outlinePath += "L" + barGroup[j+1][0] + "," + settings.barpixelbase;
                }
                // For last point, draw one line:
                //
                //       y |
                //         |
                //         |
                //    base |
                //         ^     ^
                //         x     x(next)
                //
                //   vertical line @ x from base to y
                outlinePath += "M" + barGroup[n-1][0] + "," + barGroup[n-1][1];
                outlinePath += "L" + barGroup[n-1][0] + "," + settings.barpixelbase;
            }


            for (i = 0; i < settings.paths.length; i++) {
                settings.set.push( settings.paper.path(settings.paths[i].path)
                                   .attr({
                                       "stroke-width": 1,
                                       "fill": settings.paths[i].fillcolor.getHexString("#"),
                                       "stroke": settings.fillcolor.getHexString("#")
                                   })
                                 );
            }

            settings.set.push( settings.paper.path(outlinePath)
                               .attr({
                                   "stroke-width": 1,
                                   "stroke": settings.linecolor.getHexString("#")
                               })
                             );


        });


        ns.BarRenderer.respondsTo("generateBar", function (x, y, width, height) {
            var path = "M" + x + "," + y;
            path    += "L" + x + "," + (y + height); 
            path    += "L" + (x + width) + "," + (y + height); 
            path    += "L" + (x + width) + "," + y; 
            path    += "Z";
            return path; 
        });

        ns.BarRenderer.respondsTo("renderLegendIcon", function (graphicsContext, x, y, icon, opacity) {
            var settings          = this.settings(),
                rendererFillColor = this.getOptionValue("fillcolor", 0),
                rendererOpacity   = this.getOptionValue("fillopacity", 0),
                iconAttrs,
                barwidth;

            // Draw icon background (with opacity)
            graphicsContext.paper.rect(x, y, icon.width(), icon.height())
                .attr({                    
                    "stroke" : "rgba(255, 255, 255, " + opacity + ")",
                    "fill"   : "rgba(255, 255, 255, " + opacity + ")"
                })
                .transform(graphicsContext.transformString);

            iconAttrs = {
                "stroke-width" : 1,
                "fill"         : rendererFillColor.toRGBA(opacity * rendererOpacity)
            };

            if (settings.barpixelwidth < settings.hidelines) {
                iconAttrs.stroke = rendererFillColor.toRGBA(opacity * rendererOpacity);
            } else {
                iconAttrs.stroke = this.getOptionValue("linecolor", 0).toRGBA(opacity);
            }

            // Adjust the width of the icons bars based upon the width and height of the icon Ranges: {20, 10, 0}
            if (icon.width() > 20 || icon.height() > 20) {
                barwidth = icon.width() / 6;
            } else if (icon.width() > 10 || icon.height() > 10) {
                barwidth = icon.width() / 4;
            } else {
                barwidth = icon.width() / 4;
            }

            // If the icon is large enough draw extra bars
            if (icon.width() > 20 && icon.height() > 20) {
                graphicsContext.paper.rect((icon.width() / 4) - (barwidth / 2), 0, barwidth, icon.height() / 2)
                    .attr(iconAttrs)
                    .transform(graphicsContext.transformString + "t" + x + "," + y);

                graphicsContext.paper.rect(icon.width() - (icon.width() / 4) - (barwidth / 2), 0, barwidth, icon.height() / 3)
                    .attr(iconAttrs)
                    .transform(graphicsContext.transformString + "t" + x + "," + y);
            }

            graphicsContext.paper.rect((icon.width() / 2) - (barwidth / 2), 0, barwidth, icon.height() - (icon.height() / 4))
                .attr(iconAttrs)
                .transform(graphicsContext.transformString + "t" + x + "," + y);


        });

    });

});
window.multigraph.util.namespace("window.multigraph.graphics.raphael", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {

        // cached settings object, for quick access during rendering, populated in begin() method:
        ns.FillRenderer.hasA("settings");

        ns.FillRenderer.respondsTo("begin", function (graphicsContext) {
            var settings = {
                "paper"              : graphicsContext.paper,
                "set"                : graphicsContext.set,
                "path"               : "",
                "fillpath"           : "",
                "previouspoint"      : null,
                "first"              : true,
                "linecolor"          : this.getOptionValue("linecolor"),
                "linewidth"          : this.getOptionValue("linewidth"),
                "fillcolor"          : this.getOptionValue("fillcolor"),
                "downfillcolor"      : this.getOptionValue("downfillcolor"),
                "fillopacity"        : this.getOptionValue("fillopacity"),
                "fillbase"           : this.getOptionValue("fillbase")
            };

            if (settings.fillbase !== null) {
                settings.fillbase = this.plot().verticalaxis().dataValueToAxisValue(settings.fillbase);
            } else {
                settings.fillbase = 0;
            }

            this.settings(settings);
        });

        ns.FillRenderer.respondsTo("dataPoint", function (datap) {
            var settings = this.settings(),
                p;

            if (this.isMissing(datap)) {
                if (settings.previouspoint !== null) {
                    settings.fillpath += "L" + settings.previouspoint[0] + "," + settings.fillbase;
                }
                settings.first = true;
                settings.previouspoint = null;
                return;
            }

            p = this.transformPoint(datap);

            if (settings.first) {
                settings.first = false;
                settings.fillpath += "M" + p[0] + "," + settings.fillbase;
                settings.fillpath += "L" + p[0] + "," + p[1];
                if (settings.linewidth > 0) {
                    settings.path += "M" + p[0] + "," + p[1];
                }
            } else {
                settings.fillpath += "L" + p[0] + "," + p[1];
                if (settings.linewidth > 0) {
                    settings.path += "L" + p[0] + "," + p[1];
                }
            }

            settings.previouspoint = p;
        });

        ns.FillRenderer.respondsTo("end", function () {
            var settings = this.settings();
            
            if (settings.previouspoint !== null) {
                settings.fillpath += "L" + settings.previouspoint[0] + "," + settings.fillbase;
            }
            settings.set.push( settings.paper.path(settings.fillpath)
                               .attr({
                                   "fill"   : settings.fillcolor.toRGBA(settings.fillopacity),
                                   "stroke" : settings.fillcolor.toRGBA(settings.fillopacity)
                               }));

            if (settings.linewidth > 0) {
                settings.set.push( settings.paper.path(settings.path)
                                   .attr({
                                       "stroke"       : settings.linecolor.getHexString("#"),
                                       "stroke-width" : settings.linewidth
                                   }));
            }

        });

        ns.FillRenderer.respondsTo("renderLegendIcon", function (graphicsContext, x, y, icon, opacity) {
            var settings = this.settings(),
                iconBackgroundAttrs = {},
                path = "";
            
            // Draw icon background (with opacity)
            iconBackgroundAttrs.stroke = "rgba(255, 255, 255, " + opacity + ")";
            if (icon.width() < 10 || icon.height() < 10) {
                iconBackgroundAttrs.fill = settings.fillcolor.toRGBA(opacity);
            } else {
                iconBackgroundAttrs.fill = "rgba(255, 255, 255, " + opacity + ")";
            }

            graphicsContext.paper.rect(x, y, icon.width(), icon.height())
                .attr(iconBackgroundAttrs)
                .transform(graphicsContext.transformString);

            path += "M0,0";

      // Draw the middle range icon or the large range icon if the width and height allow it
            if (icon.width() > 10 || icon.height() > 10) {
        // Draw a more complex icon if the icons width and height are large enough
                if (icon.width() > 20 || icon.height() > 20) {
                    path += "L" + (icon.width() / 6) + "," + (icon.height() / 2);
                    path += "L" + (icon.width() / 3) + "," + (icon.height() / 4);
                }
                path += "L" + (icon.width() / 2) + "," + (icon.height() - icon.height() / 4);

                if (icon.width() > 20 || icon.height() > 20) {
                    path += "L" + (icon.width() - icon.width() / 3) + "," + (icon.height() / 4);
                    path += "L" + (icon.width() - icon.width() / 6) + "," + (icon.height() / 2);
                }
            }

            path += "L" + icon.width() + ",0";
            graphicsContext.paper.path(path)
                .attr({
                    "stroke"       : settings.linecolor.toRGBA(opacity),
                    "stroke-width" : settings.linewidth,
                    "fill"         : settings.fillcolor.toRGBA(opacity * settings.fillopacity)
                })
                .transform(graphicsContext.transformString + "t" + x + "," + y);
        });

    });

});
window.multigraph.util.namespace("window.multigraph.graphics.raphael", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {

        // cached settings object, for quick access during rendering, populated in begin() method:
        ns.PointlineRenderer.hasA("settings");

        ns.PointlineRenderer.respondsTo("begin", function (graphicsContext) {
            var settings = {
                "paper"              : graphicsContext.paper,
                "set"                : graphicsContext.set,
                "path"               : "",
                "points"             : [],
                "first"              : true,
                "pointshape"         : this.getOptionValue("pointshape"),
                "pointcolor"         : this.getOptionValue("pointcolor"),
                "pointopacity"       : this.getOptionValue("pointopacity"),
                "pointsize"          : this.getOptionValue("pointsize"),
                "pointoutlinewidth"  : this.getOptionValue("pointoutlinewidth"),
                "pointoutlinecolor"  : this.getOptionValue("pointoutlinecolor"),
                "linecolor"          : this.getOptionValue("linecolor"),
                "linewidth"          : this.getOptionValue("linewidth")
            };
            this.settings(settings);
        });

        ns.PointlineRenderer.respondsTo("dataPoint", function (datap) {
            var settings = this.settings(),
                p;

            if (this.isMissing(datap)) {
                settings.first = true;
                return;
            }
            p = this.transformPoint(datap);
            if (settings.linewidth > 0) {
                if (settings.first) {
                    settings.path += "M" + p[0] + "," + p[1];
                    settings.first = false;
                } else {
                    settings.path += "L" + p[0] + "," + p[1];
                }
            }
            if (settings.pointsize > 0) {
                settings.points.push(p);
            }
        });

        ns.PointlineRenderer.respondsTo("end", function () {
            var settings = this.settings();

            if (settings.linewidth > 0) {
                settings.set.push( settings.paper.path(settings.path)
                                   .attr({
                                       "stroke"       : settings.linecolor.getHexString("#"),
                                       "stroke-width" : settings.linewidth
                                   }));
            }

            if (settings.pointsize > 0) {
                this.drawPoints();
            }
        });

        ns.PointlineRenderer.respondsTo("drawPoints", function () {
            var settings  = this.settings(),
                paper     = settings.paper,
                pointSet  = paper.set(),
                points    = settings.points,
                pointPath = "",
                raphaelAttrs,
                i;

            if ((settings.pointshape === ns.PointlineRenderer.PLUS) || (settings.pointshape === ns.PointlineRenderer.X)) {
                raphaelAttrs = {
                    "stroke"       : settings.pointcolor.getHexString("#"),
                    "stroke-width" : settings.pointoutlinewidth
                };

            } else {
                raphaelAttrs = {
                    "fill"         : settings.pointcolor.toRGBA(settings.pointopacity),
                    "stroke"       : settings.pointoutlinecolor.getHexString("#"),
                    "stroke-width" : settings.pointoutlinewidth
                };
            }

            for (i = 0; i < points.length; ++i) {
                pointPath += this.drawPoint(settings.pointshape, settings.pointsize, points[i]);
            }

            if (pointPath !== "") {
                pointSet.push(paper.path(pointPath));
            }

            pointSet.attr(raphaelAttrs);

            settings.set.push(pointSet);
        });

        ns.PointlineRenderer.respondsTo("drawPoint", function (shape, size, p) {
            var path = "",
                a,b,d;

            switch (shape) {
                case ns.PointlineRenderer.PLUS:
                    path += "M" + p[0] + "," + (p[1]-size);
                    path += "L" + p[0] + "," + (p[1]+size);
                    path += "M" + (p[0]-size) + "," + p[1];
                    path += "L" + (p[0]+size) + "," + p[1];
                    break;
                case ns.PointlineRenderer.X:
                    d = 0.70710 * size;
                    path += "M" + (p[0]-d) + "," + (p[1]-d);
                    path += "L" + (p[0]+d) + "," + (p[1]+d);
                    path += "M" + (p[0]-d) + "," + (p[1]+d);
                    path += "L" + (p[0]+d) + "," + (p[1]-d);
                    break;
                case ns.PointlineRenderer.TRIANGLE:
                    d = 1.5 * size;
                    a = 0.866025 * d;
                    b = 0.5 * d;
                    path += "M" + p[0] + "," + (p[1]+d);
                    path += "L" + (p[0]+a) + "," + (p[1]-b);
                    path += "L" + (p[0]-a) + "," + (p[1]-b);
                    path += "Z";
                    break;
                case ns.PointlineRenderer.DIAMOND:
                    d = 1.5 * size;
                    path += "M" + (p[0]-size) + "," + p[1];
                    path += "L" + p[0] + "," + (p[1]+d);
                    path += "L" + (p[0]+size) + "," + p[1];
                    path += "L" + p[0] + "," + (p[1]-d);
                    path += "Z";
                    break;
                case ns.PointlineRenderer.STAR:
                    d = 1.5 * size;
                    path += "M" + (p[0]-d*0.0000) + "," + (p[1]+d*1.0000);
                    path += "L" + (p[0]+d*0.3536) + "," + (p[1]+d*0.3536);
                    path += "L" + (p[0]+d*0.9511) + "," + (p[1]+d*0.3090);
                    path += "L" + (p[0]+d*0.4455) + "," + (p[1]-d*0.2270);
                    path += "L" + (p[0]+d*0.5878) + "," + (p[1]-d*0.8090);
                    path += "L" + (p[0]-d*0.0782) + "," + (p[1]-d*0.4938);
                    path += "L" + (p[0]-d*0.5878) + "," + (p[1]-d*0.8090);
                    path += "L" + (p[0]-d*0.4938) + "," + (p[1]-d*0.0782);
                    path += "L" + (p[0]-d*0.9511) + "," + (p[1]+d*0.3090);
                    path += "L" + (p[0]-d*0.2270) + "," + (p[1]+d*0.4455);
                    path += "Z";
                    break;
                case ns.PointlineRenderer.SQUARE:
                    path += "M" + (p[0] - size) + "," +  (p[1] - size);
                    path += "L" + (p[0] + (2 * size)) + "," +  (p[1] - size);
                    path += "L" + (p[0] + (2 * size)) + "," +  (p[1] + (2 * size));
                    path += "L" + (p[0] - size) + "," +  (p[1] + (2 * size));
                    path += "Z";
                    break;
                default: // ns.PointlineRenderer.CIRCLE
                    path += "M" + p[0] + "," + p[1];
                    path += "m0," + (-size);
                    path += "a" + size + "," + size + ",0,1,1,0," + (2 * size);
                    path += "a" + size + "," + size + ",0,1,1,0," + (-2 * size);
                    path += "z";
                    break;
            }
            return path;

        });

        ns.PointlineRenderer.respondsTo("renderLegendIcon", function (graphicsContext, x, y, icon, opacity) {
            var settings = this.settings(),
                path     = "",
                pointAttrs;

            // Draw icon background (with opacity)
            graphicsContext.paper.rect(x, y, icon.width(), icon.height())
                .attr({
                    "stroke" : "rgba(255, 255, 255, " + opacity + ")",
                    "fill"   : "rgba(255, 255, 255, " + opacity + ")"
                })
                .transform(graphicsContext.transformString);

            if (settings.linewidth > 0) {
                path += "M" + x + "," + (y + icon.height()/2);
                path += "L" + (x + icon.width()) + "," + (y + icon.height()/2);
                graphicsContext.paper.path(path)
                    .attr({
                        "stroke"       : settings.linecolor.toRGBA(opacity),
                        "stroke-width" : settings.linewidth
                    })
                    .transform(graphicsContext.transformString);
            }
            if (settings.pointsize > 0) {
                if ((settings.pointshape === ns.PointlineRenderer.PLUS) || (settings.pointshape === ns.PointlineRenderer.X)) {
                    pointAttrs = {
                        "stroke"       : settings.pointcolor.toRGBA(opacity),
                        "stroke-width" : settings.pointoutlinewidth
                    };
                } else {
                    pointAttrs = {
                        "fill"         : settings.pointcolor.toRGBA(opacity * settings.pointopacity),
                        "stroke"       : settings.pointoutlinecolor.toRGBA(opacity),
                        "stroke-width" : settings.pointoutlinewidth
                    };
                }

                graphicsContext.paper.path( this.drawPoint(settings.pointshape, settings.pointsize, [(x + icon.width()/2), (y + icon.height()/2)]) )
                    .attr(pointAttrs)
                    .transform(graphicsContext.transformString);
            }

        });
    });

});
window.multigraph.util.namespace("window.multigraph.graphics.raphael", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {
        var Text = ns.Text;

        Text.respondsTo("measureStringWidth", function (elem) {
            if (this.string() === undefined) {
                throw new Error("measureStringWidth requires the string attr to be set.");
            }

            elem.attr("text", this.string());
            return elem.getBBox().height;
        });

        Text.respondsTo("measureStringHeight", function (elem) {
            if (this.string() === undefined) {
                throw new Error("measureStringHeight requires the string attr to be set.");
            }

            elem.attr("text", this.string());
            return elem.getBBox().height;
        });
    });
});
window.multigraph.util.namespace("window.multigraph.graphics.raphael", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {

        window.multigraph.core.Window.respondsTo("render", function (graph, paper, set, width, height) {
            var ml = this.margin().left();

                // window border
                set.push( paper.rect(ml,ml,width-2*ml,height-2*ml)
                          .attr({"fill" : this.bordercolor().getHexString("#")}) );

        });

    });

});
window.multigraph.util.namespace("window.multigraph.graphics.canvas", function (ns) {
    "use strict";

    ns.mixin = new window.multigraph.core.Mixin();

});
window.multigraph.util.namespace("window.multigraph.graphics.canvas", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {

        ns.Axis.respondsTo("renderGrid", function (graph, context) {
            this.prepareRender(context);

            // draw the grid lines
            if (this.hasDataMin() && this.hasDataMax()) { // skip if we don't yet have data values
                if (this.grid().visible()) { // skip if grid lines aren't turned on
                    if (this.labelers().size() > 0 && this.currentLabelDensity() <= 1.5) {
                        this.currentLabeler().prepare(this.dataMin(), this.dataMax());
                        while (this.currentLabeler().hasNext()) {
                            var v = this.currentLabeler().next(),
                                a = this.dataValueToAxisValue(v);
                            if (this.orientation() === ns.Axis.HORIZONTAL) {
                                context.moveTo(a, this.perpOffset());
                                context.lineTo(a, graph.plotBox().height() - this.perpOffset());
                            } else {
                                context.moveTo(this.perpOffset(), a);
                                context.lineTo(graph.plotBox().width() - this.perpOffset(), a);
                            }
                        }
                        context.strokeStyle = this.grid().color().getHexString("#");
                        context.stroke();
                    }
                }
            }
        });

        ns.Axis.respondsTo("render", function (graph, context) {


            //NOTE: axes are drawn relative to the graph's plot area (plotBox); the coordinates
            //      below are relative to the coordinate system of that box.

            //
            // Render the axis line itself
            //
            context.beginPath();
            if (this.orientation() === ns.Axis.HORIZONTAL) {
                context.moveTo(this.parallelOffset(), this.perpOffset());
                context.lineTo(this.parallelOffset() + this.pixelLength(), this.perpOffset());

            } else {
                context.moveTo(this.perpOffset(), this.parallelOffset());
                context.lineTo(this.perpOffset(), this.parallelOffset() + this.pixelLength());
            }

            context.strokeStyle = this.color().getHexString("#");
            context.stroke();
            context.closePath();

            //
            // Render the tick marks and labels
            //
            if (this.hasDataMin() && this.hasDataMax()) { // but skip if we don't yet have data values
                if (this.currentLabeler()) {
                    context.beginPath();
                    context.fillStyle = '#000000';
                    this.currentLabeler().prepare(this.dataMin(), this.dataMax());
                    while (this.currentLabeler().hasNext()) {
                        var v = this.currentLabeler().next();
                        var a = this.dataValueToAxisValue(v);
                        if (this.orientation() === ns.Axis.HORIZONTAL) {
                            context.moveTo(a, this.perpOffset()+this.tickmax());
                            context.lineTo(a, this.perpOffset()+this.tickmin());
                        } else {
                            context.moveTo(this.perpOffset()+this.tickmin(), a);
                            context.lineTo(this.perpOffset()+this.tickmax(), a);
                        }
                        this.currentLabeler().renderLabel(context, v);
                    }
                    context.stroke();
                }
            }

        });

    });

});
window.multigraph.util.namespace("window.multigraph.graphics.canvas", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {
        var Graph = ns.Graph;

        Graph.hasA("x0").which.isA("number");
        Graph.hasA("y0").which.isA("number");

        Graph.respondsTo("render", function (context, width, height) {
            var i;
            context.fillStyle = this.window().bordercolor().getHexString("#");
            var m = this.window().margin().left();
            context.fillRect(m,m,width-2*m,height-2*m);

            var mb = m + this.window().border();

            context.fillStyle = this.background().color().getHexString("#");
            context.fillRect(mb,mb,width-2*mb,height-2*mb);
            this.x0( this.window().margin().left()  + this.window().border() + this.window().padding().left() + this.plotarea().margin().left() );
            this.y0( this.window().margin().bottom() + this.window().border() + this.window().padding().bottom() + this.plotarea().margin().bottom() );

            context.transform(1,0,0,1,this.x0(),this.y0());
            for (i=0; i<this.axes().size(); ++i) {
                this.axes().at(i).renderGrid(this, context);
            }


            context.save();
            context.rect(0,0,this.plotBox().width(), this.plotBox().height());
            context.clip();

            for (i=0; i<this.plots().size(); ++i) {
                this.plots().at(i).render(this, context);
            }

            context.restore();

            for (i=0; i<this.axes().size(); ++i) {
                this.axes().at(i).render(this, context);
            }

            this.legend().render(context);

        });

    });

});
window.multigraph.util.namespace("window.multigraph.graphics.canvas", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {
        ns.Icon.respondsTo("renderBorder", function (context, x, y, opacity) {
            context.save();
            context.strokeStyle = "rgba(0, 0, 0, " + opacity + ")";
            context.strokeRect(x, y, this.width(), this.height());
            context.restore();
        });
    });
});
window.multigraph.util.namespace("window.multigraph.graphics.canvas", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {

/*
        var measureTextWidth = function (context, string) {
            var metrics = context.measureText(string);
            return metrics.width;
        };

        var measureTextHeight = function (context, string) {
            //NOTE: kludge: canvas cannot exactly measure text height, so we just return a value
            //      estimated by using the width of an "M" as a substitute.  Maybe improve this
            //      later by using a better workaround.
            var metrics = context.measureText("M");
            return metrics.width;
        };
*/

        var drawText = function (text, context, base, anchor, position, angle) {
            var h = text.height();
            var w = text.width();
            var ax = 0.5 * w * (anchor.x() + 1);
            var ay = 0.5 * h * (anchor.y() + 1);

            context.save();
            //TODO: later on, once we're sure this is doing the correct thing, combine these 4 transformations
            //      into a single one for efficiency:
            context.transform(1,0,0,-1,0,2*base.y());
            context.transform(1,0,0,1,-ax+position.x(),ay-position.y());
            context.transform(1,0,0,1,base.x(),base.y());
            context.rotate(-angle*Math.PI/180.0);
            context.fillText(text.string(), 0, 0);
            context.restore();
        };

        ns.Labeler.respondsTo("measureStringWidth", function (graphicsContext, string) {
            return (new ns.Text(string)).measureStringWidth(graphicsContext);
//            return measureTextWidth(graphicsContext, string);
        });

        ns.Labeler.respondsTo("renderLabel", function (graphicsContext, value) {
            var formattedString = new ns.Text(this.formatter().format(value)),
                a = this.axis().dataValueToAxisValue(value);

            formattedString.initializeGeometry(graphicsContext);

            if (this.axis().orientation() === ns.Axis.HORIZONTAL) {
                drawText(formattedString, graphicsContext, new window.multigraph.math.Point(a, this.axis().perpOffset()), this.anchor(), this.position(), this.angle());
            } else {
                drawText(formattedString, graphicsContext, new window.multigraph.math.Point(this.axis().perpOffset(), a), this.anchor(), this.position(), this.angle());
            }
        });


    });

});
window.multigraph.util.namespace("window.multigraph.graphics.canvas", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {
        ns.Legend.respondsTo("begin", function (context) {
            context.save();
            context.transform(1, 0, 0, 1, this.x(), this.y());
        });

        ns.Legend.respondsTo("end", function (context) {
            context.restore();
        });

        ns.Legend.respondsTo("renderLegend", function (context) {
            context.save();
            context.fillStyle = this.bordercolor().toRGBA(this.opacity());
            context.fillRect(0, 0, this.width(), this.height());

            context.fillStyle = this.color().toRGBA(this.opacity());
            context.fillRect(this.border(), this.border(), this.width() - (2 * this.border()), this.height() - (2 * this.border()));
            context.restore();
        });

        ns.Legend.respondsTo("renderLabel", function (label, context, x, y) {
            context.save();
            context.fillStyle = "rgba(0, 0, 0, " + this.opacity() + ")";
            context.transform(1, 0, 0, -1, 0, this.maxLabelHeight()-y);
            context.fillText(label, x, y);
            context.restore();
        });

    });

});

window.multigraph.util.namespace("window.multigraph.graphics.canvas", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {

        ns.Multigraph.hasA("canvas");  // canvas object itself (the '<canvas>' tag itself)
        ns.Multigraph.hasA("context"); // canvas context object
        ns.Multigraph.hasA("width").which.isA("number");
        ns.Multigraph.hasA("height").which.isA("number");

        ns.Multigraph.respondsTo("redraw", function () {
            var that = this;
            window.requestAnimationFrame(function () {
                that.render();
            });
        });

        ns.Multigraph.respondsTo("init", function () {
            this.width(window.multigraph.jQuery(this.div()).width());
            this.height(window.multigraph.jQuery(this.div()).height());
            if (this.width() > 0 && this.height() > 0) {
                // create the canvas; store ref to the canvas object in this.canvas()
                this.canvas(window.multigraph.jQuery("<canvas width=\""+this.width()+"\" height=\""+this.height()+"\"/>").appendTo(window.multigraph.jQuery(this.div()).empty())[0]);
                // get the canvas context; store ref to it in this.context()
                this.context(this.canvas().getContext("2d"));
            }
            this.render();
        });

        ns.Multigraph.respondsTo("render", function () {
            var i;
            this.context().setTransform(1, 0, 0, 1, 0, 0);
            this.context().transform(1,0,0,-1,0,this.height());
            this.context().clearRect(0, 0, this.width(), this.height());
            this.initializeGeometry(this.width(), this.height(), this.context());
            for (i=0; i<this.graphs().size(); ++i) {
                this.graphs().at(i).render(this.context(), this.width(), this.height());
            }
        });

    });

    window.multigraph.core.Multigraph.createCanvasGraph = function (div, muglurl, errorHandler) {
        var muglPromise,
            deferred;
        
        try {
            window.multigraph.parser.jquery.mixin.apply(window.multigraph, "parseXML", "serialize");
            ns.mixin.apply(window.multigraph.core);
            window.multigraph.events.jquery.mouse.mixin.apply(window.multigraph, errorHandler);
            window.multigraph.normalizer.mixin.apply(window.multigraph.core);

            muglPromise = window.multigraph.jQuery.ajax({
                "url"      : muglurl,
                "dataType" : "text"
            });

            deferred = window.multigraph.jQuery.Deferred();
        }
        catch (e) {
            errorHandler(e);
        }

        muglPromise.done(function (data) {
            try {
                var multigraph = window.multigraph.core.Multigraph.parseXML( window.multigraph.parser.jquery.stringToJQueryXMLObj(data) );
                multigraph.normalize();
                multigraph.div(div);
                multigraph.init();
                multigraph.registerMouseEvents(multigraph.canvas());
                multigraph.registerCommonDataCallback(function () {
                    multigraph.redraw();
                });
                deferred.resolve(multigraph);
            }
            catch (e) {
                errorHandler(e);
            }
        });

        return deferred.promise();

    };



});
window.multigraph.util.namespace("window.multigraph.graphics.canvas", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {

        // cached state object, for quick access during rendering, populated in begin() method:
        ns.BandRenderer.hasA("state");

        ns.BandRenderer.respondsTo("begin", function (context) {
            var state = {
                "context"            : context,
                "run"                : [],
                "linecolor"          : this.getOptionValue("linecolor"),
                "line1color"         : this.getOptionValue("line1color"),
                "line2color"         : this.getOptionValue("line2color"),
                "linewidth"          : this.getOptionValue("linewidth"),
                "line1width"         : this.getOptionValue("line1width"),
                "line2width"         : this.getOptionValue("line2width"),
                "fillcolor"          : this.getOptionValue("fillcolor"),
                "fillopacity"        : this.getOptionValue("fillopacity")
            };
            this.state(state);
        });

        // This renderer's dataPoint() method works by accumulating
        // and drawing one "run" of data points at a time.  A "run" of
        // points consists of a consecutive sequence of non-missing
        // data points which have the same fill color.  (The fill
        // color can change if the data line crosses the fill base
        // line, if the downfillcolor is different from the
        // fillcolor.)
        ns.BandRenderer.respondsTo("dataPoint", function (datap) {
            var state = this.state(),
                p;

            if (this.isMissing(datap)) {
                // if this is a missing point, render and reset the current run, if any
                if (state.run.length > 0) {
                    this.renderRun();
                    state.run = [];
                }
            } else {
                // otherwise, transform point to pixel coords
                p = this.transformPoint(datap);
                // and add it to the current run
                state.run.push(p);
            }
        });

        ns.BandRenderer.respondsTo("end", function () {
            var state = this.state();
            // render the current run, if any
            if (state.run.length > 0) {
                this.renderRun();
            }
        });

        /**
         * Private utility function to stroke line segments connecting the points of a run
         */
        var strokeRunLine = function(context, run, whichLine, color, defaultColor, width, defaultWidth) {
            var i;

            width = (width >= 0) ? width : defaultWidth;
            if (width > 0) {
                color = (color !== null) ? color : defaultColor;
                context.save();
                context.strokeStyle = color.getHexString("#");
                context.lineWidth = width;
                context.beginPath();
                context.moveTo(run[0][0], run[0][whichLine]);
                for (i=1; i<run.length; ++i) {
                    context.lineTo(run[i][0], run[i][whichLine]);
                }
                context.stroke();
                context.restore();
            }
        };

        // Render the current run of data points.  This consists of drawing the fill region
        // in the band between the two data lines, and connecting the points of each data line
        // with lines of the appropriate color.
        ns.BandRenderer.respondsTo("renderRun", function () {
            var state = this.state(),
                context = state.context,
                run = state.run,
                i;

            // fill the run
            context.save();
            context.globalAlpha = state.fillopacity;
            context.fillStyle = state.fillcolor.getHexString("#");
            context.beginPath();
            // trace to the right along line 1
            context.moveTo(run[0][0], run[0][1]);
            for (i=1; i<run.length; ++i) {
                context.lineTo(run[i][0], run[i][1]);
            }
            // trace back to the left along line 2
            context.lineTo(run[run.length-1][0], run[run.length-1][2]);
            for (i=run.length-1; i>=0; --i) {
                context.lineTo(run[i][0], run[i][2]);
            }
            context.closePath();
            context.fill();
            context.restore();

            // stroke line1
            strokeRunLine(context, run, 1, state.line1color, state.linecolor, state.line1width, state.linewidth);

            // stroke line2
            strokeRunLine(context, run, 2, state.line2color, state.linecolor, state.line2width, state.linewidth);
        });

        ns.BandRenderer.respondsTo("renderLegendIcon", function (context, x, y, icon, opacity) {
/*
            var state = this.state();

            context.save();
            context.transform(1, 0, 0, 1, x, y);

            context.save();
            // Draw icon background (with opacity)
            if (icon.width() < 10 || icon.height() < 10) {
                context.fillStyle = state.fillcolor.toRGBA(opacity);
            } else {
                context.fillStyle = "rgba(255, 255, 255, " + opacity + ")";
            }
            context.fillRect(0, 0, icon.width(), icon.height());
            context.restore();

            context.strokeStyle = state.linecolor.toRGBA(opacity);
            context.lineWidth   = state.linewidth;
            context.fillStyle   = state.fillcolor.toRGBA(opacity * state.fillopacity);

            context.beginPath();
            context.moveTo(0, 0);
            // Draw the middle range icon or the large range icon if the width and height allow it
            if (icon.width() > 10 || icon.height() > 10) {
                // Draw a more complex icon if the icons width and height are large enough
                if (icon.width() > 20 || icon.height() > 20) {
                    context.lineTo(icon.width() / 6, icon.height() / 2);
                    context.lineTo(icon.width() / 3, icon.height() / 4);
                }
                context.lineTo(icon.width() / 2, icon.height() - icon.height() / 4);

                if (icon.width() > 20 || icon.height() > 20) {
                    context.lineTo(icon.width() - icon.width() / 3, icon.height() / 4);
                    context.lineTo(icon.width() - icon.width() / 6, icon.height() / 2);
                }
            }
            context.lineTo(icon.width(), 0);
            context.stroke();
            context.fill();
            context.closePath();

            context.restore();
*/
        });

    });

});
window.multigraph.util.namespace("window.multigraph.graphics.canvas", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {

        // cached settings object, for quick access during rendering, populated in begin() method:
        ns.BarRenderer.hasA("settings");

        ns.BarRenderer.respondsTo("begin", function (context) {
            var settings = {
                "context"            : context,
                "barpixelwidth"      : this.getOptionValue("barwidth").getRealValue() * this.plot().horizontalaxis().axisToDataRatio(),
                "baroffset"          : this.getOptionValue("baroffset"),
                "barpixelbase"       : (this.getOptionValue("barbase") !== null)?this.plot().verticalaxis().dataValueToAxisValue(this.getOptionValue("barbase")):0,
                "fillcolor"          : this.getOptionValue("fillcolor"),
                "linecolor"          : this.getOptionValue("linecolor"),
                "hidelines"          : this.getOptionValue("hidelines"),
                "barGroups"          : [],
                "currentBarGroup"    : null,
                "prevCorner"         : null,
                "pixelEdgeTolerance" : 1
            };

            this.settings(settings);

            //context.fillStyle = settings.fillcolor.getHexString("#");
            context.strokeStyle = settings.linecolor.getHexString("#");
        });

        // This bar renderer uses a somewhat sophisticated technique when drawing
        // the outlines around the bars, in order to make sure that it only draws
        // one vertical line between two bars that share an edge.  If a complete
        // outline were drawn around each bar separately, the common edge between
        // adjacent bars would get drawn twice, once for each bar, possibly in
        // slightly different locations on the screen due to roundoff error,
        // thereby making some of the outline lines appear thicker than others.
        // 
        // In order to avoid this roundoff artifact, this render only draws the
        // bars (the filled region of the bar, that is) in its dataPoint() method,
        // and keeps a record of the bar locations and heights so that it can draw all
        // of the bar outlines at once, in its end() method.  The bar locations and
        // heights are stored in an array called _barGroups, which is an array of
        // "bar group" objects.  Each "bar group" corresponds to a sequence of adjacent
        // bars --- two bars are considered to be adjacent if the right edge of the left
        // bar is within _pixelEdgeTolerance pixels of the left edge of the right bar.
        // A "bar group" is represented by an array of points representing the pixel
        // coordinates of the upper left corners of all the bars in the group, followed by
        // the pixel coordinates of the upper right corner of the right-most bar in the group.
        // (The last, right-most, bar is the only one whose upper right corner is included
        // in the list).  So, for example, the following bar group
        // 
        //        *--*
        //        |  |--*
        //     *--*  |  |
        //     |  |  |  |
        //     |  |  |  |
        //   ---------------
        //     1  2  3  4
        // 
        // would be represented by the array
        //
        //    [ [1,2], [2,3], [3,3], [4,3] ]
        //
    
        ns.BarRenderer.respondsTo("dataPoint", function (datap) {
            var settings = this.settings(),
                context = settings.context,
                p,
                x0,
                x1,
                fillcolor = this.getOptionValue("fillcolor", datap[1]);

            if (this.isMissing(datap)) {
                return;
            }

            p = this.transformPoint(datap);

            x0 = p[0] + settings.baroffset;
            x1 = p[0] + settings.baroffset + settings.barpixelwidth;

            context.fillStyle = fillcolor.getHexString("#");
            context.fillRect(x0, settings.barpixelbase, settings.barpixelwidth, p[1] - settings.barpixelbase);

            if (settings.barpixelwidth > settings.hidelines) {
                if (settings.prevCorner === null) {
                    settings.currentBarGroup = [ [x0,p[1]] ];
                } else {
                    if (Math.abs(x0 - settings.prevCorner[0]) <= settings.pixelEdgeTolerance) {
                        settings.currentBarGroup.push( [x0,p[1]] );
                    } else {
                        settings.currentBarGroup.push( settings.prevCorner );
                        settings.barGroups.push( settings.currentBarGroup );
                        settings.currentBarGroup = [ [x0,p[1]] ];
                    }
                }
                settings.prevCorner = [x1,p[1]];
            }

        });
        
        ns.BarRenderer.respondsTo("end", function () {
            var settings = this.settings(),
                context = settings.context,
                p,
                barGroup,
                i,
                j,
                n;

            if (settings.prevCorner !== null && settings.currentBarGroup !== null) {
                settings.currentBarGroup.push( settings.prevCorner );
                settings.barGroups.push( settings.currentBarGroup );
            }        

            context.beginPath();
            for (i = 0; i < settings.barGroups.length; i++) {
                barGroup = settings.barGroups[i];
                n = barGroup.length;
                if (n < 2) { return; } // this should never happen
                
                // For the first point, draw 3 lines:
                //
                //       y |------
                //         |
                //         |
                //    base |------
                //         ^     ^
                //         x     x(next)
                //
                
                //   horizontal line @ y from x(next) to x
                context.moveTo(barGroup[1][0], barGroup[0][1]);
                context.lineTo(barGroup[0][0], barGroup[0][1]);
                //   vertical line @ x from y to base
                context.lineTo(barGroup[0][0], settings.barpixelbase);
                //   horizontal line @ base from x to x(next)
                context.lineTo(barGroup[1][0], settings.barpixelbase);
                
                for (j = 1; j < n - 1; ++j) {
                    // For intermediate points, draw 3 lines:
                    //
                    //       y |
                    //         |
                    //         |
                    //         |------ y(next)
                    //         |
                    //         |
                    //         |------ base
                    //         ^     ^
                    //         x     x(next)
                    //
                    //   vertical line @ x from min to max of (y, y(next), base)
                    context.moveTo(barGroup[j][0], Math.min(barGroup[j-1][1], barGroup[j][1], settings.barpixelbase));
                    context.lineTo(barGroup[j][0], Math.max(barGroup[j-1][1], barGroup[j][1], settings.barpixelbase));
                    //   horizontal line @ y(next) from x to x(next)
                    context.moveTo(barGroup[j][0],   barGroup[j][1]);
                    context.lineTo(barGroup[j+1][0], barGroup[j][1]);
                    //   horizontal line @ base from x to x(next)
                    context.moveTo(barGroup[j][0],   settings.barpixelbase);
                    context.lineTo(barGroup[j+1][0], settings.barpixelbase);
                }
                // For last point, draw one line:
                //
                //       y |
                //         |
                //         |
                //    base |
                //         ^     ^
                //         x     x(next)
                //
                //   vertical line @ x from base to y
                context.moveTo(barGroup[n-1][0], barGroup[n-1][1]);
                context.lineTo(barGroup[n-1][0], settings.barpixelbase);
            }
            context.stroke();
            context.closePath();

        });

        ns.BarRenderer.respondsTo("renderLegendIcon", function (context, x, y, icon, opacity) {
            var settings          = this.settings(),
                rendererFillColor = this.getOptionValue("fillcolor", 0),
                rendererOpacity   = this.getOptionValue("fillopacity", 0),
                barwidth;

            context.save();
            context.transform(1, 0, 0, 1, x, y);

            // Draw icon background (with opacity)
            context.fillStyle = "rgba(255, 255, 255, " + opacity + ")";
            context.fillRect(0, 0, icon.width(), icon.height());

            context.lineWidth = 1;
            context.fillStyle = rendererFillColor.toRGBA(opacity * rendererOpacity);

            if (settings.barpixelwidth < settings.hidelines) {
                context.strokeStyle = rendererFillColor.toRGBA(opacity * rendererOpacity);
            } else {
                context.strokeStyle = this.getOptionValue("linecolor", 0).toRGBA(opacity);
            }

            // Adjust the width of the icons bars based upon the width and height of the icon Ranges: {20, 10, 0}
            if (icon.width() > 20 || icon.height() > 20) {
                barwidth = icon.width() / 6;
            } else if (icon.width() > 10 || icon.height() > 10) {
                barwidth = icon.width() / 4;
            } else {
                barwidth = icon.width() / 4;
            }

            // If the icon is large enough draw extra bars
            if (icon.width() > 20 && icon.height() > 20) {
                context.fillRect((icon.width() / 4) - (barwidth / 2), 0, barwidth, icon.height() / 2);
                context.strokeRect((icon.width() / 4) - (barwidth / 2), 0, barwidth, icon.height() / 2);

                context.fillRect(icon.width() - (icon.width() / 4) - (barwidth / 2), 0, barwidth, icon.height() / 3);
                context.strokeRect(icon.width() - (icon.width() / 4) - (barwidth / 2), 0, barwidth, icon.height() / 3);
            }

            context.fillRect((icon.width() / 2) - (barwidth / 2), 0, barwidth, icon.height() - (icon.height() / 4));
            context.strokeRect((icon.width() / 2) - (barwidth / 2), 0, barwidth, icon.height() - (icon.height() / 4));

            context.restore();
        });
    
    });

});
window.multigraph.util.namespace("window.multigraph.graphics.canvas", function (ns) {
    "use strict";

    var mathUtil = window.multigraph.math.util;

    ns.mixin.add(function (ns) {

        // cached state object, for quick access during rendering, populated in begin() method:
        ns.FillRenderer.hasA("state");

        ns.FillRenderer.respondsTo("begin", function (context) {
            var state = {
                "context"            : context,
                "run"             : [],
                "previouspoint"      : null,
                "linecolor"          : this.getOptionValue("linecolor"),
                "linewidth"          : this.getOptionValue("linewidth"),
                "fillcolor"          : this.getOptionValue("fillcolor"),
                "downfillcolor"      : this.getOptionValue("downfillcolor"),
                "fillopacity"        : this.getOptionValue("fillopacity"),
                "fillbase"           : this.getOptionValue("fillbase"),
                "currentfillcolor"   : null,
                "currentlinecolor"   : null
            };
            if (state.downfillcolor === null) {
                state.downfillcolor = state.fillcolor;
            }
            if (state.fillbase !== null) {
                state.fillpixelbase = this.plot().verticalaxis().dataValueToAxisValue(state.fillbase);
            } else {
                state.fillpixelbase = 0;
            }

            this.state(state);

            context.fillStyle = state.fillcolor.getHexString("#");
        });

        // This renderer's dataPoint() method works by accumulating
        // and drawing one "run" of data points at a time.  A "run" of
        // points consists of a consecutive sequence of non-missing
        // data points which have the same fill color.  (The fill
        // color can change if the data line crosses the fill base
        // line, if the downfillcolor is different from the
        // fillcolor.)
        ns.FillRenderer.respondsTo("dataPoint", function (datap) {
            var state = this.state(),
                context = state.context,
                fillcolor,
                linecolor,
                p;

            // if this is a missing point, and if it's not the first point, end the current run and render it
            if (this.isMissing(datap)) {
                if (state.previouspoint !== null) {
                    state.run.push( [state.previouspoint[0], state.fillpixelbase] );
                    this.renderRun();
                    state.run = [];
                    state.previouspoint = null;
                }
                return;
            }

            // transform point to pixel coords
            p = this.transformPoint(datap);

            // set the fillcolor and linecolor for this data point, based on whether it's above
            // or below the base line
            if (p[1] >= state.fillpixelbase) {
                fillcolor = state.fillcolor;
                linecolor = state.linecolor;
            } else {
                fillcolor = state.downfillcolor;
                linecolor = state.downlinecolor;
            }

            // if we're starting a new run, start with this data point's base line projection
            if (state.run.length === 0) {
                state.run.push( [p[0], state.fillpixelbase] );
            } else {
                // if we're not starting a new run, but the fill color
                // has changed, interpolate to find the exact base
                // line crossing point, end the current run with that
                // point, render it, and start a new run with the
                // crossing point.
                if (!fillcolor.eq(state.currentfillcolor)) {
                    var x = mathUtil.safe_interp(state.previouspoint[1], p[1], state.previouspoint[0], p[0], state.fillpixelbase);
                    // base line crossing point is [x, state.fillpixelbase]
                    state.run.push( [x, state.fillpixelbase] );
                    this.renderRun();
                    state.run = [];
                    state.run.push( [x, state.fillpixelbase] );
                }
            }

            // add this point to the current run, and remember it and the current colors for next time
            state.run.push(p);
            state.previouspoint = p;
            state.currentfillcolor = fillcolor;
            state.currentlinecolor = linecolor;
        });

        ns.FillRenderer.respondsTo("end", function () {
            var state = this.state(),
                context = state.context;
            if (state.run.length > 0) {
                state.run.push( [state.run[state.run.length-1][0], state.fillpixelbase] );
                this.renderRun(state.currentfillcolor, state.currentlinecolor);
            }
        });

        // Render the current run of data points.  This consists of drawing the fill region
        // under the points, and the lines connecting the points.  The first and last points
        // in the run array are always on the base line; the points in between these two
        // are the actual data points.
        ns.FillRenderer.respondsTo("renderRun", function () {
            var state = this.state(),
                context = state.context,
                i;

            // fill the run
            context.save();
            context.globalAlpha = state.fillopacity;
            context.strokeStyle = state.fillcolor.getHexString("#");
            context.beginPath();
            context.moveTo(state.run[0][0], state.run[0][1]);
            for (i=1; i<state.run.length; ++i) {
                context.lineTo(state.run[i][0], state.run[i][1]);
            }
            context.closePath();
            context.fill();
            context.restore();

            // stroke the run
            context.save();
            context.strokeStyle = state.linecolor.getHexString("#");
            context.lineWidth = state.linewidth;
            context.beginPath();
            context.moveTo(state.run[1][0], state.run[1][1]);
            for (i=2; i<state.run.length-1; ++i) {
                context.lineTo(state.run[i][0], state.run[i][1]);
            }
            context.stroke();
            context.restore();
        });

        ns.FillRenderer.respondsTo("renderLegendIcon", function (context, x, y, icon, opacity) {
            var state = this.state();
            
            context.save();
            context.transform(1, 0, 0, 1, x, y);

            context.save();
            // Draw icon background (with opacity)
            if (icon.width() < 10 || icon.height() < 10) {
                context.fillStyle = state.fillcolor.toRGBA(opacity);
            } else {
                context.fillStyle = "rgba(255, 255, 255, " + opacity + ")";
            }
            context.fillRect(0, 0, icon.width(), icon.height());
            context.restore();

            context.strokeStyle = state.linecolor.toRGBA(opacity);
            context.lineWidth   = state.linewidth;
            context.fillStyle   = state.fillcolor.toRGBA(opacity * state.fillopacity);

            context.beginPath();
            context.moveTo(0, 0);
            // Draw the middle range icon or the large range icon if the width and height allow it
            if (icon.width() > 10 || icon.height() > 10) {
                // Draw a more complex icon if the icons width and height are large enough
                if (icon.width() > 20 || icon.height() > 20) {
                    context.lineTo(icon.width() / 6, icon.height() / 2);
                    context.lineTo(icon.width() / 3, icon.height() / 4);
                }
                context.lineTo(icon.width() / 2, icon.height() - icon.height() / 4);

                if (icon.width() > 20 || icon.height() > 20) {
                    context.lineTo(icon.width() - icon.width() / 3, icon.height() / 4);
                    context.lineTo(icon.width() - icon.width() / 6, icon.height() / 2);
                }
            }
            context.lineTo(icon.width(), 0);
            context.stroke();
            context.fill();
            context.closePath();

            context.restore();

        });

    });

});
window.multigraph.util.namespace("window.multigraph.graphics.canvas", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {

        // cached settings object, for quick access during rendering, populated in begin() method:
        ns.PointlineRenderer.hasA("settings");

        ns.PointlineRenderer.respondsTo("begin", function (context) {
            var settings = {
                "context"            : context,
                "points"             : [],
                "first"              : true,
                "pointshape"         : this.getOptionValue("pointshape"),
                "pointcolor"         : this.getOptionValue("pointcolor"),
                "pointopacity"       : this.getOptionValue("pointopacity"),
                "pointsize"          : this.getOptionValue("pointsize"),
                "pointoutlinewidth"  : this.getOptionValue("pointoutlinewidth"),
                "pointoutlinecolor"  : this.getOptionValue("pointoutlinecolor"),
                "linecolor"          : this.getOptionValue("linecolor"),
                "linewidth"          : this.getOptionValue("linewidth")
            };
            this.settings(settings);

            context.strokeStyle = settings.linecolor.getHexString("#");
            context.lineWidth = settings.linewidth;
            context.beginPath();
        });
        ns.PointlineRenderer.respondsTo("dataPoint", function (datap) {
            var settings = this.settings(),
                context  = settings.context,
                p;
            if (this.isMissing(datap)) {
                settings.first = true;
                return;
            }
            p = this.transformPoint(datap);
            if (settings.linewidth > 0) {
                if (settings.first) {
                    context.moveTo(p[0], p[1]);
                    settings.first = false;
                } else {
                    context.lineTo(p[0], p[1]);
                }
            }
            if (settings.pointsize > 0) {
                settings.points.push(p);
            }
        });

        ns.PointlineRenderer.respondsTo("end", function () {
            var settings = this.settings(),
                context  = settings.context;
            if (settings.linewidth > 0) {
                context.stroke();
                context.closePath();
            }
            if (settings.pointsize > 0) {
                this.drawPoints();
            }
        });


        ns.PointlineRenderer.respondsTo("drawPoints", function (p) {
            var settings = this.settings(),
                context  = settings.context,
                points   = settings.points,
                i;

            if ((settings.pointshape === ns.PointlineRenderer.PLUS) || (settings.pointshape === ns.PointlineRenderer.X)) {
                context.strokeStyle = settings.pointcolor.getHexString("#");
                context.lineWidth = settings.pointoutlinewidth;
                context.beginPath();
            } else {
                context.fillStyle = settings.pointcolor.toRGBA(settings.pointopacity);
                context.strokeStyle = settings.pointoutlinecolor.getHexString("#");
                context.lineWidth = settings.pointoutlinewidth;
            }

            for (i=0; i<points.length; ++i) {
                this.drawPoint(context, settings, points[i]);
            }

            if ((settings.pointshape === ns.PointlineRenderer.PLUS) || (settings.pointshape === ns.PointlineRenderer.X)) {
                context.stroke();
                context.closePath();
            }

        });

        ns.PointlineRenderer.respondsTo("drawPoint", function (context, settings, p) {

            var a,b,d;

            if (settings.pointshape === ns.PointlineRenderer.PLUS) {
                context.moveTo(p[0], p[1]-settings.pointsize);
                context.lineTo(p[0], p[1]+settings.pointsize);
                context.moveTo(p[0]-settings.pointsize, p[1]);
                context.lineTo(p[0]+settings.pointsize, p[1]);
                return;
            } else if (settings.pointshape === ns.PointlineRenderer.X) {
                d = 0.70710 * settings.pointsize;
                context.moveTo(p[0]-d, p[1]-d);
                context.lineTo(p[0]+d, p[1]+d);
                context.moveTo(p[0]-d, p[1]+d);
                context.lineTo(p[0]+d, p[1]-d);
                return;
            }

            context.beginPath();

            if (settings.pointshape === ns.PointlineRenderer.SQUARE) {
                context.moveTo(p[0] - settings.pointsize, p[1] - settings.pointsize);
                context.lineTo(p[0] + settings.pointsize, p[1] - settings.pointsize);
                context.lineTo(p[0] + settings.pointsize, p[1] + settings.pointsize);
                context.lineTo(p[0] - settings.pointsize, p[1] + settings.pointsize);
            } else if (settings.pointshape === ns.PointlineRenderer.TRIANGLE) {
                d = 1.5*settings.pointsize;
                a = 0.866025*d;
                b = 0.5*d;
                context.moveTo(p[0], p[1]+d);
                context.lineTo(p[0]+a, p[1]-b);
                context.lineTo(p[0]-a, p[1]-b);
            } else if (settings.pointshape === ns.PointlineRenderer.DIAMOND) {
                d = 1.5*settings.pointsize;
                context.moveTo(p[0]-settings.pointsize, p[1]);
                context.lineTo(p[0], p[1]+d);
                context.lineTo(p[0]+settings.pointsize, p[1]);
                context.lineTo(p[0], p[1]-d);
            } else if (settings.pointshape === ns.PointlineRenderer.STAR) {
                d = 1.5*settings.pointsize;
                context.moveTo(p[0]-d*0.0000, p[1]+d*1.0000);
                context.lineTo(p[0]+d*0.3536, p[1]+d*0.3536);
                context.lineTo(p[0]+d*0.9511, p[1]+d*0.3090);
                context.lineTo(p[0]+d*0.4455, p[1]-d*0.2270);
                context.lineTo(p[0]+d*0.5878, p[1]-d*0.8090);
                context.lineTo(p[0]-d*0.0782, p[1]-d*0.4938);
                context.lineTo(p[0]-d*0.5878, p[1]-d*0.8090);
                context.lineTo(p[0]-d*0.4938, p[1]-d*0.0782);
                context.lineTo(p[0]-d*0.9511, p[1]+d*0.3090);
                context.lineTo(p[0]-d*0.2270, p[1]+d*0.4455);
            } else { // ns.PointlineRenderer.CIRCLE
                context.arc(p[0], p[1], settings.pointsize, 0, 2*Math.PI, false);
            }

            context.closePath();
            context.fill();
            context.stroke();


        });

        ns.PointlineRenderer.respondsTo("renderLegendIcon", function (context, x, y, icon, opacity) {
            var settings = this.settings();

            context.save();
            // Draw icon background (with opacity)
            context.fillStyle = "rgba(255, 255, 255, " + opacity + ")";
            context.fillRect(x, y, icon.width(), icon.height());

            if (settings.linewidth > 0) {
                context.strokeStyle = settings.linecolor.toRGBA(opacity);
                context.lineWidth   = settings.linewidth;
                context.beginPath();
                context.moveTo(x, y + icon.height()/2);
                context.lineTo(x + icon.width(), y + icon.height()/2);
                context.stroke();
                context.closePath();
            }
            if (settings.pointsize > 0) {
                if ((settings.pointshape === ns.PointlineRenderer.PLUS) || (settings.pointshape === ns.PointlineRenderer.X)) {
                    context.strokeStyle = settings.pointcolor.toRGBA(opacity);
                    context.lineWidth   = settings.pointoutlinewidth;
                    context.beginPath();
                } else {
                    context.fillStyle   = settings.pointcolor.toRGBA(opacity * settings.pointopacity);
                    context.strokeStyle = settings.pointoutlinecolor.toRGBA(opacity);
                    context.lineWidth   = settings.pointoutlinewidth;
                }

                this.drawPoint(context, settings, [(x + icon.width()/2), (y + icon.height()/2)]);

                if ((settings.pointshape === ns.PointlineRenderer.PLUS) || (settings.pointshape === ns.PointlineRenderer.X)) {
                    context.stroke();
                    context.closePath();
                }

            }
            context.restore();

        });

    });

});
window.multigraph.util.namespace("window.multigraph.graphics.canvas", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {

        // cached state object, for quick access during rendering, populated in begin() method:
        ns.RangeBarRenderer.hasA("state");

        ns.RangeBarRenderer.respondsTo("begin", function (context) {
            var state = {
                "context"            : context,
                "run"                : [],
                "barpixelwidth"      : this.getOptionValue("barwidth").getRealValue() * this.plot().horizontalaxis().axisToDataRatio(),
                "barpixeloffset"     : 0,
                "baroffset"          : this.getOptionValue("baroffset"),
                "fillcolor"          : this.getOptionValue("fillcolor"),
                "fillopacity"        : this.getOptionValue("fillopacity"),
                "linecolor"          : this.getOptionValue("linecolor"),
                "linewidth"          : this.getOptionValue("linewidth"),
                "hidelines"          : this.getOptionValue("hidelines")
            };
            state.barpixeloffset = state.barpixelwidth * state.baroffset;
            this.state(state);
        });

        ns.RangeBarRenderer.respondsTo("dataPoint", function (datap) {
            var state = this.state(),
                context = state.context,
                p;

            if (this.isMissing(datap)) {
                return;
            }

            p = this.transformPoint(datap);

            var x0 = p[0] - state.barpixeloffset;
            var x1 = x0 + state.barpixelwidth;

            context.save();
            context.globalAlpha = state.fillopacity;
            context.fillStyle = state.fillcolor.getHexString("#");
            context.beginPath();
            context.moveTo(x0, p[1]);
            context.lineTo(x0, p[2]);
            context.lineTo(x1, p[2]);
            context.lineTo(x1, p[1]);
            context.closePath();
            context.fill();
            context.restore();

            if (state.linewidth > 0 && state.barpixelwidth > state.hidelines) {
                context.save();
                context.strokeStyle = state.linecolor.getHexString("#");
                context.lineWidth = state.linewidth;
                context.beginPath();
                context.moveTo(x0, p[1]);
                context.lineTo(x0, p[2]);
                context.lineTo(x1, p[2]);
                context.lineTo(x1, p[1]);
                context.closePath();
                context.stroke();
                context.restore();
            }

        });

        ns.RangeBarRenderer.respondsTo("end", function () {
        });

        ns.RangeBarRenderer.respondsTo("renderLegendIcon", function (context, x, y, icon, opacity) {
        });

    });

});
window.multigraph.util.namespace("window.multigraph.graphics.canvas", function (ns) {
    "use strict";

    ns.mixin.add(function (ns) {
        var Text = ns.Text;

        Text.respondsTo("measureStringWidth", function (context) {
            if (this.string() === undefined) {
                throw new Error("measureStringWidth requires the string attr to be set.");
            }

            var metrics = context.measureText(this.string());
            return metrics.width;
        });

        Text.respondsTo("measureStringHeight", function (context) {
            if (this.string() === undefined) {
                throw new Error("measureStringHeight requires the string attr to be set.");
            }

            //NOTE: kludge: canvas cannot exactly measure text height, so we just return a value
            //      estimated by using the width of an "M" as a substitute.  Maybe improve this
            //      later by using a better workaround.
            var metrics = context.measureText("M"),
                newlineCount = this.string().match(/\n/g);
            return (newlineCount !== null ? (newlineCount.length + 1) : 1) * metrics.width;
        });
    });
});
