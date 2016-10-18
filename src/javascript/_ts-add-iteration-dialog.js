Ext.define('CA.techservices.dialog.AddIterationDialog',{
    extend: 'Rally.ui.dialog.Dialog',
    alias: 'widget.tsadditerationdialog',
    
    config: {
        title    : 'Add Iteration',
        autoShow : true,
        closable : true
    },

    constructor: function(config) {
        this.mergeConfig(config);
        this.callParent([this.config]);
    },

    initComponent: function() {
        this.callParent(arguments);
        Ext.tip.QuickTipManager.init();

        this._getIterationModel().then({
            scope: this,
            success: function(model) {
                this.iteration_model = model;
                this.drawHeader();
            
                this.drawFooter();
            }
        });
    },

    _getIterationModel: function() {
        var deferred = Ext.create('Deft.Deferred');
        
        Rally.data.ModelFactory.getModel({
            type: 'Iteration',
            scope: this,
            success: function(model) {
                model = this._changeFieldRights(model);
                deferred.resolve(model);
            }
        });
        
        return deferred.promise;
    },
    
    drawHeader: function() {
        
        this.addDocked({
            xtype:'container',
            dock:'top',
            itemId:'header',
            layout: 'vbox',
            items: [{
                xtype:'container',
                itemId:'message_box',
                width: '100%',
                padding: 5,
                tpl:'<tpl><span class="warning">{message}</span></tpl>'
            },
            {
                xtype:'container',
                layout: 'hbox',
                defaults: {
                    margins: '5 5 5 10'
                },
                items: [{
                    xtype:'rallytextfield',
                    itemId: 'iteration_name_pattern',
                    fieldLabel: 'Name Prefix',
                    labelWidth: 75,
                    value: 'Sprint',
                    height: 23,
                    margins: '5 5 5 25',
                    qtip: 'Sprints will be named with this followed by YYYYMMDD for final day',
                    listeners: {
                        render: function(c) {
                            Ext.QuickTips.register({
                                target: c.getEl(),
                                text: c.qtip
                            });
                        }
                    }
                },
                {
                    xtype:'rallydatefield',
                    itemId:'iteration_start_date',
                    fieldLabel: 'Start',
                    labelWidth: 45,
                    listeners: {
                        scope: this,
                        change: this._checkDates
                    }
                },
                {
                    xtype:'rallydatefield',
                    itemId:'iteration_end_date',
                    fieldLabel: 'End',
                    labelWidth: 35,
                    listeners: {
                        scope: this,
                        change: this._checkDates
                    }
                },
                {
                    xtype:'rallycheckboxfield',
                    itemId:'copy_to_children',
                    boxLabelAlign: 'after',
                    boxLabel: 'Copy to child projects',
                    margins: '0 5 5 10',
                    listeners: {
                        scope: this,
                        change: this._checkDates
                    }
                },
                {
                    xtype:'tsrecurrencepickerbutton',
                    listeners: {
                        scope: this,
                        change: this._checkDates
                    }
                }]
            },
            {
                xtype:'container',
                layout: 'hbox',
                items: [ {
                    xtype:'container',
                    itemId:'task_box',
                    padding: 5,
                    tpl:'<tpl><span>To Do:</span><br/><ul>' +
                            '<li>Create this many (per proj): {numberOfSprints}</li>' +
                            '<li>Sprint length (days): {daysInSprint}</li>' +
                            '<li>Starting: {startDate}</li>' +
                            '<li>Ending: {finalDate}</li>' +
                            '</ul></tpl>'
                },
                {
                    xtype:'textareafield',
                    itemId:'status_box',
                    html: '',
                    width: 600,
                    height: 275,
                    padding: 10
                }]
            }]
        });
    },

    drawFooter: function() {
        this.addDocked({
            xtype: 'toolbar',
            dock: 'bottom',
            layout: {
                type: 'hbox',
                pack: 'center'
            },
            ui: 'footer',
            itemId: 'footer',
            items: [
                {
                    xtype: 'rallybutton',
                    text: 'Create',
                    itemId: 'create_button',
                    cls: 'primary rly-small',
                    disabled: true,
                    handler: function() {
                        this._create();
                    },
                    scope: this
                },
                {
                    xtype: 'rallybutton',
                    text: 'Cancel',
                    ui: 'link',
                    cls: 'secondary rly-small',
                    handler: function() {
                        this.close();
                    },
                    scope: this
                }
            ]
        });
    },
    
    _getStartDateFromField:function(start_field){
        if ( Ext.isEmpty(start_field) ) {
            start_field = this.down('#iteration_start_date');
        }
        var start_date = start_field.getValue();
        if ( Ext.isEmpty(start_date) ) { return null; }
        return  Rally.util.DateTime.convertFromEditing(start_date); //new Date(start_date.setHours(0,0,0,0));
    },
    
    _getEndDateFromField:function(end_field){
        if ( Ext.isEmpty(end_field) ) {
            end_field = this.down('#iteration_end_date');
        }
        
        var end_date = end_field.getValue();
        if ( Ext.isEmpty(end_date) ) { return null; }

        return Rally.util.DateTime.convertFromEditing(end_date); //new Date(end_date.setHours(23,59,0,0));
    },

    _copyToChildProjects: function() {
        var children_box = this.down('#copy_to_children');
        
        if ( Ext.isEmpty(children_box) ) { return false; }
        return children_box.getValue() || false;
    },
    // update message_box if there are existing iterations
    // that overlap
    _checkDates: function() {
        var button = this.down('#create_button');
        if ( !Ext.isEmpty(button) ) { button.setDisabled(true); }
        
        var start_field = this.down('#iteration_start_date'),
            end_field = this.down('#iteration_end_date'),
            message_box = this.down('#message_box'),
            repeat_field = this.down('tsrecurrencepickerbutton');
        
        message_box.update({message: ' '});

        if ( Ext.isEmpty(start_field) || Ext.isEmpty(end_field) ) {
            return;
        }
        
        var start_date = this._getStartDateFromField(start_field);
        var end_date = this._getEndDateFromField(end_field);
        
        if ( Ext.isEmpty(start_date) || Ext.isEmpty(end_date) ) {
            return;
        }
                
        if ( !Ext.isEmpty(repeat_field) && !repeat_field.inactive ) {
            var repeat_value = repeat_field.getValue();
            if ( Ext.isEmpty(repeat_value) ) { 
                message_box.update({message:'No reccurrence set (click button to remove)'});
                return;
            }
            
            if ( Ext.isDate(repeat_value) ) {
                end_date = repeat_value;
            } 
        }
        
        if ( end_date < start_date ) {
            message_box.update({message: 'Dates are in wrong order.'});
            return;
        }
        
        start_date = Rally.util.DateTime.toIsoString(start_date);
        end_date = Rally.util.DateTime.toIsoString(end_date);
                
        var start_inside_filters = Rally.data.wsapi.Filter.and([
            {property:'StartDate',operator:'>=',value: start_date},
            {property:'StartDate',operator:'<=',value: end_date}
        ]);
        
        var end_inside_filters = Rally.data.wsapi.Filter.and([
            {property:'EndDate',operator:'>=',value: start_date},
            {property:'EndDate',operator:'<=',value: end_date}
        ]);
        
        var overlap_filters = Rally.data.wsapi.Filter.and([
            {property:'StartDate',operator:'<=',value: start_date},
            {property:'EndDate',operator:'>=',value: end_date}
        ]);
        
        var filters = start_inside_filters.or(end_inside_filters.or(overlap_filters));
        
        var config = {
            model: 'Iteration',
            filters: filters,
            limit: 1,
            pageSize: 1,
            context: {
                projectScopeDown: false,
                projectScopeUp: false
            }
        };
        
        if ( this._copyToChildProjects() ) {
            config.context.projectScopeDown = true;
        }
        
        // TODO: check if there are existing iterations with recurrence turned on
        // TODO: check if there are existing iterations with recurrence and children turned on

        TSUtils.loadWsapiRecords(config,true).then({
            scope: this,
            success: function(results) {
                var count = results.resultSet.totalRecords;
                if ( count > 0 ) {
                    var verb = "is";
                    var noun = "iteration";
                    if ( count > 1 ) { 
                        verb = "are";
                        noun = "iterations";
                    }
                    var message = Ext.String.format("Warning.  There {0} {1} existing overlapping {2}.",
                        verb,
                        count,
                        noun
                    );
                    message_box.update({message: message});
                }
                
                this._setConfiguration();
                if ( !Ext.isEmpty(button) ) { button.setDisabled(false); }
            },
            failure: function(msg) {
                Ext.Msg.alert('Problem checking iterations', msg);
            }
        });
    },
    
    _setConfiguration: function(){
        var start_date = this._getStartDateFromField();
        var end_date   = this._getEndDateFromField();
        
        var days_in_sprint = Rally.util.DateTime.getDifference(end_date,start_date,'day') + 1;
        var number_of_sprints = 1;
        var final_date = end_date;
        
        var repeat_field = this.down('tsrecurrencepickerbutton');
        if ( !Ext.isEmpty(repeat_field) && !repeat_field.inactive ) {
            var repeat_value = repeat_field.getValue();
          
            if ( Ext.isDate(repeat_value) ) {
                number_of_sprints = this._getNumberOfSprintsFromEndDate(start_date, repeat_value, days_in_sprint);
            } 
            
            if ( Ext.isNumber(repeat_value) ) {
                number_of_sprints = repeat_value;
            }
            
            final_date = Rally.util.DateTime.add(end_date, 'day', ( number_of_sprints - 1 ) * days_in_sprint);
        }
        
        this.copy_config = {
            numberOfSprints: number_of_sprints,
            daysInSprint: days_in_sprint,
            startDate: start_date,
            endDate: end_date,
            finalDate: final_date
        };
        
        this.down('#task_box').update(this.copy_config);
    },
    
    _getNumberOfSprintsFromEndDate: function(start_date, final_date, days_in_sprint) {
        var counter = 0;
        while(start_date <= final_date) {
            counter++;
            start_date = Rally.util.DateTime.add(start_date, 'day', days_in_sprint);
        }
        return counter;
    },
    
    _create: function() {
        var me = this;
        
        if ( Ext.isEmpty(this.copy_config) || this.copy_config == {} ) {
            return;
        }
        
        this.setLoading('Finding projects');
        this._getProjects(this._copyToChildProjects()).then({
            scope: this,
            success: function(projects) {
                projects = Ext.Array.unique( Ext.Array.flatten(projects) );
                
                var number_of_sprints = this.copy_config.numberOfSprints || 1;
                var start_date = this.copy_config.startDate;
                var end_date = this.copy_config.endDate;
                
                this.setLoading(false);
                
                var promises = [];
                var prefix = this.down('#iteration_name_pattern').getValue() || "";
                
                Ext.Array.each(_.range(number_of_sprints), function(i) {
                    var name = Ext.String.trim(prefix + " " + Ext.Date.format(end_date, 'Ymd'));
                    var config = {
                        name: name,
                        startDate: start_date,
                        endDate: end_date,
                        projects: projects
                    };
                    
                    promises.push( function() {
                        return this._createIterations(config);
                    });
                    
                    start_date = Rally.util.DateTime.add(start_date, 'day', this.copy_config.daysInSprint);
                    end_date = Rally.util.DateTime.add(end_date, 'day', this.copy_config.daysInSprint);
                },this);
                
                Deft.Chain.sequence(promises,this).then({
                    success: function(results) {
                        me._checkDates();
                    },
                    failure: function(msg) {
                        Ext.Msg.alert('',msg);
                    }
                }).always(function(){
                    me.setLoading(false);
                });
            },
            failure: function(msg) {
                Ext.Msg.alert("Problem fetching projects", msg);
            }
        });
        
    },
    
    _getProjects: function(get_children) {
        var deferred = Ext.create('Deft.Deferred');
                
        var config = {
            model:'Project',
            filters: [{property:'ObjectID',value:Rally.getApp().getContext().getProject().ObjectID}],
            fetch: ['Name','ObjectID','Children']
        };
        
        TSUtils.loadWsapiRecords(config,false).then({
            scope: this,
            success: function(results) {
                if ( !get_children || results[0].get('Children').Count === 0 ) { 
                    deferred.resolve(results);
                    return;
                }
                
                this._getChildProjects(results[0], results).then({
                    success: function(results) {
                        deferred.resolve(results);
                    },
                    failure: function(msg) {
                        deferred.reject(msg);
                    }
                });
                
            },
            failure: function(msg) {
               deferred.reject(msg);
            }
        });
        
        return deferred.promise;
    },
    
    _getChildProjects: function(project, projects) {
        var deferred = Ext.create('Deft.Deferred');
        
        var config = {
            model:'Project',
            filters: [{property:'Parent.ObjectID',value:project.get('ObjectID')}],
            fetch: ['Name','ObjectID']
        };
        
        TSUtils.loadWsapiRecords(config,false).then({
            scope: this,
            success: function(results) {
                var me = this;
                if ( results.length === 0 ) { 
                    deferred.resolve(projects);
                    return;
                }
                
                projects = Ext.Array.push(projects, results);
                
                var promises = Ext.Array.map(results, function(p){
                    return function() { 
                        return me._getChildProjects(p,projects);
                    };
                });
                
                Deft.Chain.sequence(promises,me).then({
                    success: function(results) {
                        deferred.resolve(results);
                    },
                    failure: function(msg) {
                        deferred.reject(msg);
                    }
                });
            },
            failure: function(msg) {
               deferred.reject(msg);
            }
        });
        
        return deferred.promise;
    },
    
    _createIterations: function(config){
        var deferred = Ext.create('Deft.Deferred'),
            me = this;
        
        var name = config.name;
        var start_date = config.startDate;
        var end_date = config.endDate;
        var projects = config.projects;
        
        var promises = Ext.Array.map(projects, function(project){
            return function() {
                return me._createIteration(name,start_date,end_date,project);
            }
        });
        
        return Deft.Chain.sequence(promises, me);
    },
    
    _createIteration: function(name,start_date,end_date,project){
        var deferred = Ext.create('Deft.Deferred');
        var me = this;
        
        this.setLoading(Ext.String.format("Creating {0} in {1}", 
            name,
            project.get('Name')
        ));
        
        var fields = {
            Name: name,
            StartDate: start_date,
            EndDate: end_date,
            State: 'Planning',
            Project: { _ref: project.get("_ref") }
        };
                
        var iteration = Ext.create(this.iteration_model, fields);
        iteration.save({
            callback: function(result, operation) {
                if(operation.wasSuccessful()) {
                    var text = me.down('#status_box').getValue();
                    
                    text = text + "\nCreated " + name + " in " + project.get('Name');
                    
                    me.down('#status_box').setValue(text);
                    
                    deferred.resolve();
                } else {
                    console.log(operation);
                    deferred.reject("Problem saving iteration " + name + " (" + operation.error.errors.join(', ') + ")" );
                }
            }
        });

        return deferred.promise;
    },
    
    _changeFieldRights: function(model) {
        var fields = model.getFields();
        Ext.Array.each(fields, function(field,idx) {
            if ( field.name == "Project" ) {
                field.readOnly = false;
                field.persist = true;
            }
        });
        
        return model;
    }

    
});