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
        
        this.drawHeader();
        
        this.drawFooter();
        
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
                    listeners: {
                        scope: this,
                        change: this._checkDates
                    }
                }]
            },
            {
                xtype:'container',
                itemId:'task_box',
                padding: 5,
                tpl:'<tpl><span>To Do:</span><br/><ul>' +
                        '<li>Create this many sprints: {numberOfSprints}</li>' +
                        '<li>Sprint length (days): {daysInSprint}</li>' +
                        '<li>Starting: {startDate}</li>' +
                        '<li>Ending: {endDate}</li>' +
                        '</ul></tpl>'
            }]
        });
    },

    drawFooter: function() {
        // TODO: Iteration recurrence button
        // TODO: Iteration name pattern
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
        return new Date(start_date.setHours(0,0,0,0));
    },
    
    _getEndDateFromField:function(end_field){
        if ( Ext.isEmpty(end_field) ) {
            end_field = this.down('#iteration_end_date');
        }
        
        var end_date = end_field.getValue();
        if ( Ext.isEmpty(end_date) ) { return null; }
        return new Date(end_date.setHours(23,59,0,0));
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
            message_box = this.down('#message_box');
        
        message_box.update({message: ' '});

        if ( Ext.isEmpty(start_field) || Ext.isEmpty(end_field) ) {
            return;
        }
        
        var start_date = this._getStartDateFromField(start_field);
        var end_date = this._getEndDateFromField(end_field);
        
        if ( Ext.isEmpty(start_date) || Ext.isEmpty(end_date) ) {
            return;
        }
        
        if ( end_date < start_date ) {
            message_box.update({message: 'Dates are in wrong order.'});
            return;
        }
        
        start_date = Rally.util.DateTime.toIsoString(start_date);
        end_date = Rally.util.DateTime.toIsoString(end_date);
        
        console.log(start_date, end_date);
        
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
                        nount = "iterations";
                    }
                    var message = Ext.String.format("Warning.  There {0} {1} existing overlapping {2}.",
                        verb,
                        count,
                        noun
                    );
                    message_box.update({message: message});
                    
                    this._setConfiguration();
                    if ( !Ext.isEmpty(button) ) { button.setDisabled(false); }
                }
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
        
        this.copy_config = {
                numberOfSprints: number_of_sprints,
                daysInSprint: days_in_sprint,
                startDate: start_date,
                endDate: end_date
        };
        
        this.down('#task_box').update(this.copy_config);
    },
                    
    _create: function() {
        
    }

    
});