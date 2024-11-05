var request = require("request");

module.exports.getWebhook = function(reqBody) {

    let headers = {};
    // let properties = {}; // TODO: Add support for webhook properties

    if(!reqBody)
    {
        return {
            "WebhookId": 0,
            "Name": "",
            "Events": [],
            "TargetUrl": "",
            "Secret": "",
            "State": "Active",
            "Type": "webhook",
            "Headers": headers,
            // "Properties": properties
        };
    }

    if(reqBody.Headers && reqBody.Headers.length > 0) {
        // headers come in as one array, so transform into key-value pairs
        for (let i = 0; i < reqBody.Headers.length; i++) {
            const key = reqBody.Headers[i];
            const value = reqBody.Headers[++i];
            headers[key] = value;
        }
    }

    // if only one is selected, built-in parser doesn't create an array, so it's done here
    if(!Array.isArray(reqBody.Events)){
        reqBody.Events = [reqBody.Events];
    }

    return {
        "WebhookId": reqBody.WebhookId,
        "Name": reqBody.Name,
        "Events": reqBody.Events,
        "TargetUrl": reqBody.TargetUrl,
        "Secret": reqBody.Secret,
        "State": reqBody.State,
        "Type": reqBody.Type,
        "Headers": headers,
        "Properties": {}
    };
}

module.exports.getWebhookTypes = function(webhook) {

    const webHookTypes = [ 
        { "type": "webhook","selected": false}, 
        { "type": "crmscript", "selected": false} 
    ];

    const whType = webHookTypes.find((wh) => {
        return wh.type == webhook.Type;
    });

    if(whType)
    {
        whType.selected = true;
    }

    return webHookTypes;
}

module.exports.getWebhookStates = function(webhook) {

    //Unknown = 0, Active = 1, Stopped = 2, TooManyErrors = 3
    const states = [ 
        { "name": "Unknown","selected": false}, 
        { "name": "Active", "selected": false},
        { "name": "Stopped", "selected": false},
        { "name": "TooManyErrors", "selected": false} 
    ];

    const state = states.find((s) => {
        return s.name == webhook.State;
    });

    if(state)
    {
        state.selected = true;
    }

    return states;
}

module.exports.getEventArray = function() {
    
    return [
        {
            "prefix": "activity",
            "events": [
                { name: "created", selected: false }, 
                { name: "changed", selected: false },
                { name: "deleted", selected: false } 
        ]},
        {
            "prefix": "associate",
            "events": [
                { name: "created", selected: false }, 
                { name: "changed", selected: false },
                { name: "deleted", selected: false }
        ]},
        {
            "prefix": "chatsession",
            "events": [
                { name: "created", selected: false },
                { name: "changed", selected: false },
                { name: "message", selected: false }
        ]},
        {
            "prefix": "contact",
            "events": [
                { name: "created", selected: false }, 
                { name: "changed", selected: false },
                { name: "deleted", selected: false },
                { name: "softdeleted", selected: false }
        ]},
        {
            "prefix": "document",
            "events": [
                { name: "created", selected: false }, 
                { name: "changed", selected: false },
                { name: "deleted", selected: false },
                { name: "edited", selected: false }
        ]},
        {
            "prefix": "person",
            "events": [
                { name: "created", selected: false }, 
                { name: "changed", selected: false },
                { name: "deleted", selected: false },
                { name: "softdeleted", selected: false },
                { name: "consented", selected: false },
                { name: "unconsented", selected: false }
        ]},
        {
            "prefix": "project",
            "events": [
                { name: "created", selected: false }, 
                { name: "changed", selected: false },
                { name: "deleted", selected: false }
        ]},
        {
            "prefix": "projectmember",
            "events": [
                { name: "created", selected: false }, 
                { name: "changed", selected: false },
                { name: "deleted", selected: false }
        ]},
        {
            "prefix": "quote",
            "events": [
                { name: "approved", selected: false },
                { name: "ordered", selected: false },
                { name: "rejected", selected: false },
                { name: "sent", selected: false }
        ]},
        {
            "prefix": "relation",
            "events": [
                { name: "created", selected: false },
                { name: "changed", selected: false },
                { name: "deleted", selected: false }
        ]},
        {
            "prefix": "sale",
            "events": [
                { name: "created", selected: false },
                { name: "changed", selected: false },
                { name: "deleted", selected: false },
                { name: "sold", selected: false },
                { name: "lost", selected: false },
                { name: "completed", selected: false }
        ]},
        {
            "prefix": "salestakeholder",
            "events": [
            { name: "created", selected: false }, 
            { name: "changed", selected: false },
            { name: "deleted", selected: false }
        ]},
        {
            "prefix": "ticket",
            "events": [
            { name: "created", selected: false },
            { name: "changed", selected: false }
        ]}
    ];
}

module.exports.getWebhookEvents = function(webhook) {
    
    const eventArray = this.getEventArray();

    webhook.Events.forEach((whEvt) => {
       const whEventName = whEvt.split(".");
       const prefix = whEventName[0];
       const suffix = whEventName[1];
       const eventIndex = eventArray.findIndex((evt) => {
           return evt.prefix == prefix;
       });

       const event = eventArray[eventIndex].events.find((eventObj)=>{
        return eventObj.name == suffix
       })

       if(event)
       {
           event.selected = true;
       }
    });
    
    return eventArray;
}