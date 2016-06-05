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
        
        var start_date = start_field.getValue();
        var end_date = end_field.getValue();
        
        if ( Ext.isEmpty(start_date) || Ext.isEmpty(end_date) ) {
            return;
        }
        
        if ( end_date < start_date ) {
            message_box.update({message: 'Dates are in wrong order.'});
            return;
        }
        
        
        start_date = new Date(start_date.setHours(0,0,0,0));
        end_date   = new Date(end_date.setHours(23,59,0,0));
        
        console.log(start_date, end_date);
        
        // TODO: check if there are existing iterations 
        // TODO: check if there are existing iterations with children turned on
        // TODO: check if there are existing iterations with recurrence turned on
        // TODO: check if there are existing iterations with recurrence and children turned on
        
        if ( !Ext.isEmpty(button) ) { button.setDisabled(false); }
        
    },
    
    _create: function() {
        
    }

    
});