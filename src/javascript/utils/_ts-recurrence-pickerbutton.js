Ext.define('CA.technicalservices.button.RecurrencePickerButton',{
    extend: "Ext.container.Container",
    
    alias: 'widget.tsrecurrencepickerbutton',
    
    inactive: true,
    
    config: {
        text: '<span class="icon-refresh"> </span>'
    },
    
    layout: 'hbox',
    
    items: [
        {
            xtype:'rallybutton',
            text: '<span class="icon-refresh"> </span>'
        },
        {
            xtype:'container',
            itemId:'picker_box'
        }
    ],
    
    constructor:function (config) {
        this.mergeConfig(config);
        this.callParent([this.config]);
    },
    
    initComponent: function() {
        this.callParent(arguments);
        this.addEvents(
            'change'
        );
        
        this.mon(this.down('rallybutton'),'click',this._toggleDetails,this);
        
    },
    
    _toggleDetails: function() {
        var me = this;
        var container = this.down('#picker_box');
        
        if ( !this.inactive ) {
            container.removeAll();
            this.inactive = true;
            this.fireEvent('click',this);
            return;
        }
        
        this._addRadioButtons(container);
        this.inactive = false;
        this.fireEvent('change',me);
    },
    
    _addRadioButtons: function(container) {
        var me = this;
        
        container.add({
            xtype:'radiogroup',
            id: 'radio_group_id',
            item_id: 'radio_group',
            layout: 'vbox',
            items: [{
                xtype:'radiofield',
                boxLabel: 'After x occurrences',
                checked: true,
                name: 'occurrence_type',
                inputValue: 1,
                listeners: {
                    render: function() {
                        this.boxLabelEl.update("");
                        me.first_field = Ext.create('Rally.ui.NumberField',{
                            itemId:'field_1',
                            renderTo: this.boxLabelEl,
                            disabled: !this.getValue(),
                            minValue: 1,
                            value: 1,
                            labelWidth: 100,
                            width: 140,
                            fieldLabel: 'After occurrences',
                            listeners: {
                                scope: me,
                                change: function() {
                                    me.fireEvent('change',me);
                                }
                            }
                        });
                    },
                    change: function() {
                        me.first_field.setDisabled(!this.getValue());
                        me.fireEvent('change',me);
                    }
                }
            },
            {
                xtype:'radiofield',
                boxLabel: 'By date',
                name: 'occurrence_type',
                checked: false,
                inputValue: 2,
                listeners: {
                    render: function() {
                        this.boxLabelEl.update("");
                        me.second_field = Ext.create('Rally.ui.DateField',{
                            renderTo: this.boxLabelEl,
                            itemId:'field_2',
                            disabled: !this.getValue(),
                            labelWidth: 100,
                            fieldLabel: 'By Date',
                            listeners: {
                                scope: me,
                                change: function() {
                                    me.fireEvent('change',me);
                                }
                            }
                        });
                    },
                    change: function() {
                        me.second_field.setDisabled(!this.getValue());
                        me.fireEvent('change',me);
                    }
                }
            }]
        });
        
    },
    
    getValue: function() {
        var group = this.down('radiogroup');
        if ( group.getValue().occurrence_type == 1 ) {
            return this.first_field.getValue();
        }
        
        if ( group.getValue().occurrence_type == 2 ) {
            var end_date = this.second_field.getValue();
            if ( Ext.isEmpty(end_date) ) { return null; }
            
            return new Date(end_date.setHours(23,59,0,0));
        }
        
        return null;
    }
});