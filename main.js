// YOUR JAVASCRIPT CODE FOR INDEX.HTML GOES HERE

var orgId = '';
var calendlyUserInfo;
var crmUserInfo;
var schedulingUrl = '';
var ownerEmailID = '';
var userBody = '';
var eventBody = '';
var isHeOwner;
var upcomingMeetingArr = [];
var pastMeetingArr = [];
var upcomingMeetingEmailArr = [];
var pastMeetingEmailArr = [];
var currentLoggedInUser;
var newcollections = [];
var collections = [];
var forEmailEventCollections = [];
var isVariableNotificationEmpty = false;
var isVariableUserTypeEmpty = false;
var isVariableHostnameEmpty = false;
var config;
function closing() {
    console.log("close");
    ZOHO.CRM.UI.Popup.close()
        .then(function (data) {
            console.log(data);
        })
}

function dontShow() {
    ZOHO.CRM.ACTION.enableAccountAccess().then(function (data) {
        console.log(data);
    })
}

function getUserMe() {
    fetch("config.json")
    .then(response => response.json())
    .then(json => {  
        config = json;
        console.log(json)

   
    document.getElementById('loadingGif').style.display = "inline-flex";
    document.getElementById('loadingGif').style.position = "fixed";
    document.getElementById('loadingGif').style.zIndex = "1";
    document.getElementById('home').style.opacity = "0.5";
    document.getElementById('configure').disabled = true;
    
    schedulingUrl = '';
   
    var zapiKey = '', zapiurl = '';
    ZOHO.CRM.CONNECTOR.invokeAPI("crm.zapikey", { "nameSpace": "vcrm_finstak" }).then(function (zApiKeyData) {
        var tempZApiKeyResponse = JSON.parse(zApiKeyData);
        console.log(tempZApiKeyResponse);
        if (tempZApiKeyResponse['status_code'] == 200) {
            zapiKey = tempZApiKeyResponse['response'];
            console.log(zapiKey);
        }
        zapiurl = "https://finstak.zohoplatform.com/crm/v2/functions/finstak__calendlyautomation/actions/execute?auth_type=apikey&zapikey=" + zapiKey;
       
        console.log(zapiurl);
        ZOHO.CRM.CONNECTOR.invokeAPI(config.getUsers, {}) //  users  // userme
            .then(function (data) {
                console.log(data);
                if (data['status_code'] == 200) {
                    var response = JSON.parse(data['response'])['resource'];
                    console.log(response);
                    var datas = {};
                    datas.data = {
                        "url": zapiurl,
                        "events": [
                            "invitee.created",
                            "invitee.canceled"
                        ],
                        "organization": response['current_organization'],
                        "user": response['uri'],
                        "scope": "organization"  // organization
                    }
                    orgId = response['current_organization'];
                    console.log(datas);
                    ZOHO.CRM.CONNECTOR.invokeAPI(config.createWebhook, datas)
                        .then(function (data) {
                            console.log(data);
                            document.getElementById('loadingGif').style.display = "none";
                            document.getElementById('home').style.opacity = "1";
                            document.getElementById('configure').disabled = false;
                            if (data.status_code == 201) {
                                var response = JSON.parse(data.response);
                                console.log(response);
                                var webhookuri = response['resource']['uri'].split("/");
                                var webhookuuid = webhookuri[webhookuri.length - 1];
                                console.log(webhookuuid);
                                ZOHO.CRM.CONNECTOR.invokeAPI("crm.set", { "apiname": "finstak__webhookuuid", "value": webhookuuid }).then(function (data) {
                                    console.log(data);
                                    if (JSON.parse(data).status_code == "200") {
                                    }
                                });
                            }
                        });

                        ZOHO.CRM.CONFIG.getOrgInfo().then(function(data){
                            console.log(data);
                            console.log(data.org[0]['Support_Mail']);
                            // support@finstak.com
                            document.getElementById('SupportMail').innerHTML = data.org[0]['Support_Mail'];
                        });
                }
            });
    });

});
}

function configure() {
    var data = {
        "APIName": "userelement_3",
        "webTabMessage": {
        },
        Target: "_blank"
    }

    ZOHO.CRM.UI.Setting.open(data).then(function (response) {
        console.log(response);
    });

    ZOHO.CRM.UI.Popup.close()
        .then(function (data) {
            console.log(data)
        })
}


function authorizeConnector() {
    fetch("config.json")
    .then(response => response.json())
    .then(json => {  
        config = json;
        console.log(json);
        var data = ZOHO.CRM.CONNECTOR.authorize(config.connectorNameSpace);
        console.log(data);
    });
   
    setTimeout(() => {
        document.getElementById('connectorName').innerHTML = 'Authorized';
        document.getElementById('connectorName').disabled = true;
        getUserMe();
    }, 5000);
}

