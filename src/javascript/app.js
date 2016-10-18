Ext.define("TSRecurringIterationCreator", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    items: [
        {xtype:'container',itemId:'selector_box'},
        {xtype:'container',itemId:'display_box'}
    ],

    
    integrationHeaders : {
        name : "TSRecurringIterationCreator"
    },
                        
    launch: function() {
        var me = this;
        this._addButtons(this.down('#selector_box'));
        this._updateData();
    },
    
    _addButtons: function(container) {
        container.removeAll();
        
        container.add({
            xtype:'rallybutton',
            text: 'Add',
            disabled: true,
            listeners: {
                scope: this,
                click: this._launchAddIterationDialog
            }
        });
    },
    
    _updateData: function() {
        var me = this,
            field_names = ['Name','StartDate','EndDate','Project'],
            button = this.down('rallybutton');
        
        this.setLoading("Loading Existing Iterations...");
        
        button.setDisabled(true);
        
        var config = {
            model: 'Iteration',
            fetch: field_names,
            sorters: [{property:'EndDate',direction:'DESC'}]
        };
        
        TSUtils.loadAStoreWithAPromise(config).then({
            scope: this,
            success: function(store) {
                this._displayGrid(store,field_names);
                button.setDisabled(false);
            },
            failure: function(error_message){
                alert(error_message);
            }
        }).always(function() {
            me.setLoading(false);
        });
    },
    
    _launchAddIterationDialog: function() {
        // TODO
        Ext.create('CA.techservices.dialog.AddIterationDialog',{
            width    : Ext.getBody().getWidth() - 20,
            height   : Ext.getBody().getHeight() - 20,
            context: this.getContext()
        });
    },
    
    _displayGrid: function(store,field_names){
        this.down('#display_box').add({
            xtype: 'rallygrid',
            store: store,
            columnCfgs: field_names
        });
    },
    
    getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];
    },
    
    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{});
    },
    
    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    },
    
    //onSettingsUpdate:  Override
    onSettingsUpdate: function (settings){
        this.logger.log('onSettingsUpdate',settings);
        // Ext.apply(this, settings);
        this.launch();
    }
});
