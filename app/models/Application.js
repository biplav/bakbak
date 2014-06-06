var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Schema
 */
 var BakBak = Schema({
    name: String, 
    type: String,
    data: String
});

var PageLevelMouseTrack = Schema({
    url: String,
    clickTrack:Boolean,
    movementTrack:Boolean,
    scrollDepth:Boolean
});


var ApplicationSchema = Schema({
    adminId: String,
    name: String,
    agents: Number,
    email: String,
    domain_blacklist: Array,
    enabled: Boolean,
    agentIds: Array,
    displayName: String,
    mouseTracking: [PageLevelMouseTrack],
    offlineForm: { type:[BakBak], default:[]}
});

ApplicationSchema.methods.upsertMouseTracking = function(data,cb) {
    if(data['clickTrack'] == 'on') data['clickTrack'] = true;
        else data['clickTrack'] = false;
    if(data._id && (data._id != null && data._id != 'null' && data._id != 'undefined')) {
        console.log("Need to update mouse tracking");
        console.log(data);
        var set = {};
        set['mouseTracking.$.url'] = data['url'];
        set['mouseTracking.$.clickTrack'] = data['clickTrack'];
        this.model('ApplicationModel').update({_id:this._id,'mouseTracking._id':data._id},
            {$set: set},cb);
    } else {
        delete data['_id'];
        console.log(data);
        this.mouseTracking.push(data);
        this.save(cb);
    }
}

ApplicationSchema.methods.upsertOfflineForm = function(data,cb) {
    if(data._id && (data._id != null && data._id != 'null' && data._id != 'undefined')) {
        console.log("Updating offlineForm");
        console.log(data);
        var set = {};
        set['offlineForm.$.name'] = 'OfflineForm';
        set['offlineForm.$.type'] = data['type'];
        set['offlineForm.$.data'] = data['data'][+data['type']];
        this.model('ApplicationModel').update({_id:this._id,'offlineForm._id':data._id},
            {$set: set},cb);
    } else {
        console.log(data);
        delete data['_id'];
        var set = {};
        set['name'] = 'OfflineForm';
        set['type'] = data['type'];
        set['data'] = data['data'][data['type']];
        console.log("Creating new offlineForm");
        console.log(set);
        this.offlineForm.push(set);
        this.save(cb)
    }
}


mongoose.model('ApplicationModel', ApplicationSchema);