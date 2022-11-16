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
var isNotAuthorised = false;
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


function onSettingsLoad() {
    document.getElementById('tabview').style.display = "block";
    document.getElementById('calendlyHome').style.opacity = "0.5";
    fetch("config.json")
        .then(response => response.json())
        .then(json => {  
            config = json;
            console.log(json)
       
 
    ZOHO.CRM.CONNECTOR.invokeAPI(config.getUsers, {})  // userme
        .then(function (data) {
            console.log(data);
            document.getElementById('notAuthorized').style.display = "none";
            document.getElementById('Authorized').style.display = "block";
            isNotAuthorised = false;
            if (data['status_code'] == 200) {
                var response = JSON.parse(data['response'])['resource'];
                console.log(response);
                orgId = response['current_organization'];
                var request = {};
                request.current_organization = encodeURIComponent(orgId);
                ZOHO.CRM.CONNECTOR.invokeAPI(config.getorganizationlist, request)
                    .then(function (data) {
                        console.log(data);
                        if (data['status_code'] == 200) {
                            var response = JSON.parse(data['response'])['collection'];
                            console.log(response);
                            calendlyUserInfo = response;
                            var body;
                            var tds = "";
                            tds = "<option value='" + 0 + "'>" + 'select calendly user' + "</option>";
                            for (var j = 0; j < response.length; j++) {
                                tds += "<option value='" + response[j]['user']['uri'] + "'>" + response[j]['user']['email'] + "</option>";
                            }

                            body = `<select  class="selects" >` + tds + `</select>`;
                            bodies = body;
                            console.log(bodies);
                            ZOHO.CRM.CONFIG.getCurrentUser().then(function (currentUser) {
                                console.log(currentUser);
                                ZOHO.CRM.API.getOrgVariable("finstak__calendlyHostNameNew").then(function (data) {
                                    console.log(data.Success.Content);
                                    if (data.Success.Content) {
                                        calendlyUserInfo.forEach(user => {
                                            console.log(user['role']);
                                            if (user['role'] == 'owner') {
                                                ownerEmailID = user['user']['email'];
                                            }
                                        });
                                        var hostName = JSON.parse(data.Success.Content);
                                        hostName.forEach(element => {
                                            if (element['crmUsers'] == currentUser['users'][0]['id']) {
                                                calendlyUserInfo.forEach(cUser => {
                                                    if (cUser['user']['uri'] == element['calendlyUsers']) {
                                                        schedulingUrl = cUser['user']['scheduling_url'];
                                                        isHeOwner = cUser['role'] == 'user' ? false : true;
                                                        currentLoggedInUser = cUser;
                                                        console.log(schedulingUrl);
                                                    }
                                                });
                                            }
                                        });
                                    } else {
                                        isVariableHostnameEmpty = true;
                                    }
                                });
                            });
                            ZOHO.CRM.API.getAllUsers({ Type: "ActiveUsers" })
                                .then(function (data) {
                                    console.log(data);
                                    console.log(data.users);
                                    crmUserInfo = data.users;

                                    ZOHO.CRM.API.getOrgVariable("finstak__calendlyHostNameNew").then(function (data) {
                                        console.log(data.Success.Content);
                                        if (data.Success.Content) {
                                            var variables = JSON.parse(data.Success.Content);
                                            for (let vars of variables) {
                                                for (var i = 0; i < crmUserInfo.length; i++) {
                                                    if (vars['crmUsers'] == crmUserInfo[i]['id']) {
                                                        document.getElementById("CalendlyUser" + i).value = vars['calendlyUsers'];
                                                    }
                                                }
                                            }
                                        } else {
                                            isVariableHostnameEmpty = true;
                                        }
                                    });

                                    var gow = "";
                                    for (var j = 0; j < data.users.length; j++) {
                                        gow += "<tr><td>" + data.users[j]['email'] + "</td><td id='" + j + "'></td></tr>";
                                    }
                                    document.getElementById('gowtham').innerHTML = gow;
                                    for (var j = 0; j < data.users.length; j++) {
                                        document.getElementById(j).innerHTML = body;
                                    }

                                    var select = document.getElementsByClassName("selects");
                                    console.log(select);
                                    for (var i = 0; i < select.length; i++) {
                                        var table = select[i];
                                        table.setAttribute("id", "CalendlyUser" + i);
                                        console.log("CalendlyUser" + i);
                                        table.setAttribute("onchange", "toggleSelect(this.id)");
                                    }
                                });

                            ZOHO.CRM.META.getModules().then(function (data) {
                                console.log(data);
                                var arr = [];
                                var moduleArr = data['modules'];
                                moduleArr.forEach(element => {
                                    if (element['api_name'] == 'Contacts' || element['api_name'] == 'Leads') {
                                        ZOHO.CRM.META.getFields({ "Entity": element['api_name'] }).then(function (data) {
                                            console.log(data);
                                            var fields = data['fields'];
                                            var fieldArr = [];
                                            fields.forEach(field => {
                                                if (field['system_mandatory'] == true) {
                                                    var fObj = {
                                                        "fieldApiName": field['api_name'],
                                                        "displayName": field['display_label']
                                                    }
                                                    fieldArr.push(fObj);
                                                }
                                            });
                                            var obj = {
                                                "displayName": element['plural_label'],
                                                "moduleApiName": element['api_name'],
                                                "fields": fieldArr
                                            }
                                            arr.push(obj);

                                        });
                                    }
                                });
                                setTimeout(() => {

                                    console.log(arr);
                                    // display the select option from the above arr first ,
                                    var body = `
                                    <option value='0'>Select Type</option>`;
                                    var tds = "";
                                    for (var l = 0; l < arr.length; l++) {
                                        tds += "<option value='" + arr[l]['moduleApiName'] + "'>" + arr[l]['displayName'] + "</option>";
                                    }
                                    body = body + tds;
                                    document.getElementById('userModuleType').innerHTML = body;

                                    //save the arr in org variable..
                                    ZOHO.CRM.CONNECTOR.invokeAPI("crm.set", { "apiname": "finstak__fieldModuleArr", "value": arr }).then(function (data) {
                                        console.log(data);
                                        document.getElementById('loadingGif1').style.display = "none";
                                        document.getElementById('calendlyHome').style.opacity = "1";


                                    });

                                    ZOHO.CRM.API.getOrgVariable("finstak__userType").then(function (data) {
                                        console.log(data.Success.Content);
                                        if (data.Success.Content) {
                                            document.getElementById("userModuleType").value = data.Success.Content;
                                        } else {
                                            isVariableUserTypeEmpty = true;
                                        }
                                    });
                                    setTimeout(() => {
                                        console.log(isVariableHostnameEmpty);
                                        console.log(isVariableNotificationEmpty);
                                        console.log(isVariableUserTypeEmpty);
                                        if (isVariableHostnameEmpty || isVariableNotificationEmpty || isVariableUserTypeEmpty) {
                                            document.getElementById('calendlyTab').classList.add('disabled');
                                        }
                                    }, 2000);
                                }, 4000);
                            });
                        }
                    });
            }
        }).catch((err) => {
            console.log(err);
            if (err['code'] == "403") {
                document.getElementById('loadingGif1').style.display = "none";
                document.getElementById('calendlyHome').style.opacity = "1";
                // document.getElementById('successHeader').innerText = 'Its Un Authorized, kindly authorize the connector in getting started page and continue with Calendly integration.';
                // $('#successNotification').click();
                isNotAuthorised = true;
                document.getElementById('connectorName').innerHTML = 'Authorize';
                document.getElementById('notAuthorized').style.display = "block";
                document.getElementById('Authorized').style.display = "none";
                document.getElementById('calendlyTab').classList.add('disabled');
            }
        });
    });

    ZOHO.CRM.API.getOrgVariable("finstak__notificationSignal").then(function (data) {
        console.log(data.Success.Content);
        if (data.Success.Content) {
            document.getElementById("signal").value = data.Success.Content;
        } else {
            isVariableNotificationEmpty = true;
        }
    });

}
function toggleSelect(val) {
    console.log(val);
    var selectedVal = document.getElementById(val).value;
    var select = document.getElementsByClassName("selects");
    console.log(select);
    console.log(select.length);
    for (var i = 0; i < select.length; i++) {
        if (document.getElementById("CalendlyUser" + i).value == 0) {
            var op = document.getElementById("CalendlyUser" + i).getElementsByTagName("option");
            for (var j = 0; j < op.length; j++) {
                console.log(op[j].value);
                if (op[j].value == selectedVal) {
                    op[j].disabled = true;
                }
            }
        }
    }
}

function revokeWebhook() {
    $('#gowthamBtn').click();
}

function cancelBtn() {
    document.getElementById("toggles").checked = false;
}

function revoking() {
    ZOHO.CRM.CONNECTOR.revokeConnector(config.connectorNameSpace)
        .then(function (data) {
            console.log(data);
            ZOHO.CRM.CONNECTOR.isConnectorAuthorized(config.connectorNameSpace).then(async function (result) {
                if (result == "true") {
                    isNotAuthorised = false;
                    document.getElementById('notAuthorized').style.display = "none";
                    document.getElementById('Authorized').style.display = "block";
                    onSettingsLoad();
                } else if (result == "false") {
                    document.getElementById('connectorName').innerHTML = 'Authorize';
                    document.getElementById('notAuthorized').style.display = "block";
                    document.getElementById('Authorized').style.display = "none";
                    document.getElementById('calendlyTab').classList.add('disabled');
                    isNotAuthorised = true;
                }
            })

        })
}

function authorizeConnector() {
    var data = ZOHO.CRM.CONNECTOR.authorize(config.connectorNameSpace);
    console.log(data);
    setTimeout(() => {
        createWebhookuuid();
    }, 5000);
}

function calen() {
    if (isVariableHostnameEmpty || isVariableNotificationEmpty || isVariableUserTypeEmpty || isNotAuthorised) {
        document.getElementById('Settings').style.display = "block";
    } else {
        document.getElementById('loadingGif1').style.display = "inline-flex";
        document.getElementById('loadingGif1').style.position = "fixed";
        document.getElementById('loadingGif1').style.opacity = "1";
        document.getElementById('Calendly').style.opacity = "0.5";
        document.getElementById('Settings').style.display = "none";
        console.log(schedulingUrl);
        if (schedulingUrl.length > 0) {
            var body = `<iframe src="${schedulingUrl}"  class="myframe"  title="Iframe Example"></iframe>`;
            document.getElementById('calendlyFrame').innerHTML = body;
            setTimeout(() => {
                document.getElementById('loadingGif1').style.display = "none";
                document.getElementById('Calendly').style.opacity = "1";
            }, 2000);
        } else {
            var body = ` <div style="  display: flex;align-items: center;justify-content: center;width: 100%;height: 550px;">
          <span style="color: gray;">You are not part of calendly user, kindly check with the Calendly owner -  ${ownerEmailID}</span>
           </div>`;
            document.getElementById('calendlyFrame').innerHTML = body;
            document.getElementById('loadingGif1').style.display = "none";
        }
    }
}


function getAllCollections(next_page_token) {
    var request = {};
    request.organization = encodeURIComponent(currentLoggedInUser['organization']);
    request.count = 30;
    request.page_token = next_page_token;
    ZOHO.CRM.CONNECTOR.invokeAPI(config.scheduledeventorgpagetoken, request) //scheduledeventorgpagetoken  //testorgevent
        .then(function (data) {
            console.log(data);
            if (data.status_code == 200) {
                var newalleventOrgarr = JSON.parse(data.response);
                collections = collections.concat(newalleventOrgarr['collection']);
                if (newalleventOrgarr['pagination']['next_page'] != null) {
                    getAllCollections(newalleventOrgarr['pagination']['next_page_token']);
                } else {
                    console.log(collections);
                    collections.forEach(element => {
                        findUpcomingPastmeeting(element);
                    });
                    setTimeout(() => {
                        document.getElementById('loadingGif1').style.display = "none";
                        document.getElementById('Calendly').style.opacity = "1";
                        generateUpComingMeetingUI(upcomingMeetingArr);
                        generatePastMeetingUI(pastMeetingArr);
                    }, 3000);
                }
            }
        })
}

function eventHistory() {
    document.getElementById('loadingGif1').style.display = "inline-flex";
    document.getElementById('loadingGif1').style.position = "absolute";
    document.getElementById('loadingGif1').style.opacity = "1";
    document.getElementById('Calendly').style.opacity = "0.5";

    upcomingMeetingArr = [];
    pastMeetingArr = [];
    newcollections = [];
    collections = [];
    console.log(isHeOwner);
    if (isHeOwner) {   // the logged in user is a owner so we have to display all the scheduled events in org level..
        document.getElementById('hasValue').style.display = "block";
        var request = {};
        request.current_organization = encodeURIComponent(currentLoggedInUser['organization']);
        request.count = 30;
        ZOHO.CRM.CONNECTOR.invokeAPI(config.scheduledevents_org, request)  // scheduledevents_org  //testuri
            .then(function (data) {
                console.log(data);
                if (data.status_code == 200) {
                    console.log(JSON.parse(data.response));
                    var alleventOrgarr = JSON.parse(data.response);
                    collections = alleventOrgarr['collection'];
                    if (alleventOrgarr['pagination']['next_page'] != null) {
                        getAllCollections(alleventOrgarr['pagination']['next_page_token']);
                    } else {
                        collections.forEach(element => {
                            findUpcomingPastmeeting(element);
                        });
                        setTimeout(() => {
                            document.getElementById('loadingGif1').style.display = "none";
                            document.getElementById('Calendly').style.opacity = "1";

                            generateUpComingMeetingUI(upcomingMeetingArr);
                            generatePastMeetingUI(pastMeetingArr);
                        }, 3000);
                    }
                }
            })
    } else if (isHeOwner == false) {     // the logged in user is a user so we have to display only  the scheduled events in user level..
        var request = {};
        document.getElementById('hasValue').style.display = "block";
        request.organization = encodeURIComponent(currentLoggedInUser['organization']);
        request.user = encodeURIComponent(currentLoggedInUser['user']['uri']);
        request.count = 30;
        ZOHO.CRM.CONNECTOR.invokeAPI(config.scheduledevents_user, request)
            .then(function (data) {
                console.log(data);
                if (data.status_code == 200) {
                    console.log(JSON.parse(data.response));
                    var alleventOrgarr = JSON.parse(data.response);
                    collections = alleventOrgarr['collection'];
                    if (alleventOrgarr['pagination']['next_page'] != null) {
                        getAllCollections(alleventOrgarr['pagination']['next_page_token']);
                    } else {
                        collections.forEach(element => {
                            findUpcomingPastmeeting(element);
                        });
                        setTimeout(() => {
                            document.getElementById('loadingGif1').style.display = "none";
                            document.getElementById('Calendly').style.opacity = "1";
                            generateUpComingMeetingUI(upcomingMeetingArr);
                            generatePastMeetingUI(pastMeetingArr);
                        }, 3000);
                    }
                }
            })
    } else if (isHeOwner == undefined) {
        document.getElementById('loadingGif1').style.display = "none";
        document.getElementById('Calendly').style.opacity = "1";
        var body = `<div style="  display: flex;align-items: center;justify-content: center;width: 100%;height: 550px;">
          <span style="color: gray;">You are not part of calendly user, kindly check with the Calendly owner -  ${ownerEmailID}</span>
       </div>`;
        document.getElementById('hasValue').style.display = "none";
        document.getElementById('hasNoValue').style.display = "block";
        document.getElementById('hasNoValue').innerHTML = body;
    }
}

function findUpcomingPastmeeting(obj) {
    const dat = new Date(obj['start_time']);
    const currentdat = new Date();
    if (currentdat > dat) {
        pastMeetingArr.push(obj);
    } else {
        upcomingMeetingArr.push(obj);
    }
}

function findUpcomingPastmeetingForEmail(obj) {
    const dat = new Date(obj['start_time']);
    const currentdat = new Date();
    if (currentdat > dat) {
        pastMeetingEmailArr.push(obj);
    } else {
        upcomingMeetingEmailArr.push(obj);
    }
}

function generateUpComingMeetingEmailUI(eventArr) { //email Search
    if (eventArr.length > 0) {
        var body = '';
        for (var j = 0; j < eventArr.length; j++) {
            body = body + `
        <div class="row" style="margin-top: 10px;margin-bottom:10px;">
        <div class="eventboxing col-md-12" style="cursor: pointer;" >
            <div class="row" style="min-height:100px;">
                <div class="col-md-6">
                    <div style="top: 7px;position: relative;">
                        <p style="font-weight: 700;font-size: 13px;">${eventArr[j]['name']}</p>
                         <span> 
                         <p style="font-size: 11px;">${timeFormat(eventArr[j]['start_time'], eventArr[j]['end_time'])}</p>
                         </span>
                    </div>
                </div>
                <div class="col-md-6">
                <div style="height: 100px;float: right;top: 20px;position: relative;">
                <p style="color: ${eventArr[j]['status'] == 'active' ? '#1E8449' : eventArr[j]['status'] == "canceled" ? '#A93226' : '#E67E22'};text-transform: uppercase;">${eventArr[j]['status']}</p>
                </div>
                </div>
            </div>
        </div>
    </div>
        `;
        }
        document.getElementById('emailUpcoming').innerHTML = body;
    } else {
        var body = `
        <div style="height:150px;justify-content:center;align-items: center;display:flex;">
          <span style="color:grey;"> No Upcoming Meetings for the said user
        </div>
      `;
        document.getElementById('emailUpcoming').innerHTML = body;
    }
}

function generatePastMeetingEmailUI(pasteventArr) { // email search 
    if (pasteventArr.length > 0) {
        var body = '';
        for (var j = 0; j < pasteventArr.length; j++) {
            body = body + `
           <div class="row" style="margin-top: 10px;margin-bottom:10px;">
           <div class="eventboxing col-md-12" style="cursor: pointer;">
               <div class="row" style="min-height:100px;">
                   <div class="col-md-8">
                       <div style="top: 7px;position: relative;">
                           <p style="font-weight: 700;font-size: 13px;">${pasteventArr[j]['name']}</p>
                            <span> 
                            <p style="font-size: 11px;">${timeFormat(pasteventArr[j]['start_time'], pasteventArr[j]['end_time'])}</p>
                            </span>
                       </div>
                   </div>
                   <div class="col-md-4">
                   <div style="height: 100px;float: right;top: 20px;position: relative;">
                   <p style="color: ${pasteventArr[j]['status'] == 'active' ? '#1E8449' : pasteventArr[j]['status'] == "canceled" ? '#A93226' : '#E67E22'};text-transform: uppercase;">${pasteventArr[j]['status']}</p>
                   </div>
                   </div>
               </div>
           </div>
       </div>
           `;
        }
        document.getElementById('emailpastmeeting').innerHTML = body;
        $('#emailPopup').click();
    } else {
        var body = `
           <div style="height:150px;justify-content:center;align-items: center;display:flex;">
             <span style="color:grey;"> No Past Meetings for the said user
           </div>
         `;
        document.getElementById('emailpastmeeting').innerHTML = body;
        $('#emailPopup').click();
    }
}

function generatePastMeetingUI(pasteventArr) {
    if (pasteventArr.length > 0) {
        var body = '';
        for (var j = 0; j < pasteventArr.length; j++) {
            body = body + `
           <div class="row" style="margin-top: 10px;margin-bottom:10px;">
           <div class="eventboxing col-md-12" style="cursor: pointer;" onclick="showpopup('${pasteventArr[j]['event_memberships'][0]['user']}');">
               <div class="row" style="height:100px;">
                   <div class="col-md-6">
                       <div style="top: 20px;position: relative;">
                           <p style="font-weight: 700;">${pasteventArr[j]['name']}</p>
                            <span> 
                            <p style="font-size: 13px;">${timeFormat(pasteventArr[j]['start_time'], pasteventArr[j]['end_time'])}</p>
                            </span>
                       </div>
                   </div>
                   <div class="col-md-6">
                   <div style="height: 100px;float: right;top: 20px;position: relative;">
                   <p style="color: ${pasteventArr[j]['status'] == 'active' ? '#1E8449' : pasteventArr[j]['status'] == "canceled" ? '#A93226' : '#E67E22'};text-transform: uppercase;">${pasteventArr[j]['status']}</p>
                   </div>
                   </div>
               </div>
           </div>
       </div>
           `;
        }
        document.getElementById('pastvals').innerHTML = body;
    } else {
        var body = `
           <div style="height:150px;justify-content:center;align-items: center;display:flex;">
             <span style="color:grey;"> No Past Meetings for the said user
           </div>
         `;
        document.getElementById('pastvals').innerHTML = body;
    }
}

function showpopup(hostUrl) {
    var data = hostUrl.split("/");
    var uuid = data[data.length - 1];
    var request = {};
    request.uuid = uuid;
    ZOHO.CRM.CONNECTOR.invokeAPI(config.eventmembership, request)
        .then(function (data) {
            if (data.status_code == 200) {
                var response = JSON.parse(data.response)['resource'];
                document.getElementById('emails').innerText = response['email'];
                document.getElementById('names').innerText = response['name'];
                document.getElementById('timeZones').innerText = response['timezone'];
                $('#historyPopup').click();
                ///  $('#historyPopups').click();
            }
        });
}

function timeFormat(start, end) {
    var startTime = new Date(start);
    var endTime = new Date(end);
    var time = startTime.toLocaleTimeString('en-US') + " - " + endTime.toLocaleTimeString('en-US');
    var meetingdate = start.toString().split("T")[0];
    var val = meetingdate + ", " + time;
    return val;
}


function generateUpComingMeetingUI(eventArr) {
    if (eventArr.length > 0) {
        var body = '';
        for (var j = 0; j < eventArr.length; j++) {
            body = body + `
        <div class="row" style="margin-top: 10px;margin-bottom:10px;">
        <div class="eventboxing col-md-12" style="cursor: pointer;" onclick="showpopup('${eventArr[j]['event_memberships'][0]['user']}');">
            <div class="row" style="height:100px;">
                <div class="col-md-6">
                    <div style="top: 20px;position: relative;">
                        <p style="font-weight: 700;">${eventArr[j]['name']}</p>
                         <span> 
                         <p style="font-size: 13px;">${timeFormat(eventArr[j]['start_time'], eventArr[j]['end_time'])}</p>
                         </span>
                    </div>
                </div>
                <div class="col-md-6">
                <div style="height: 100px;float: right;top: 20px;position: relative;">
                <p style="color: ${eventArr[j]['status'] == 'active' ? '#1E8449' : eventArr[j]['status'] == "canceled" ? '#A93226' : '#E67E22'};text-transform: uppercase;">${eventArr[j]['status']}</p>
                </div>
                </div>
            </div>
        </div>
    </div>
        `;
        }
        document.getElementById('vals').innerHTML = body;
    } else {
        var body = `
        <div style="height:150px;justify-content:center;align-items: center;display:flex;">
          <span style="color:grey;"> No Upcoming Meetings for the said user
        </div>
      `;
        document.getElementById('vals').innerHTML = body;
    }
}

function eventLink() {
    document.getElementById('loadingGif1').style.display = "inline-flex";
    document.getElementById('loadingGif1').style.position = "absolute";
    document.getElementById('loadingGif1').style.opacity = "1";
    document.getElementById('Calendly').style.opacity = "0.5";
    userBody = '';
    calendlyUserInfo.forEach(element => {
        var request = {};
        request.user = encodeURIComponent(element['user']['uri']);
        ZOHO.CRM.CONNECTOR.invokeAPI(config.eventtypeuser, request)  // eventtypeuser  //orgeventtype
            .then(function (data) {
                console.log(data);
                if (data.status_code == 200) {
                    document.getElementById('loadingGif1').style.display = "none";
                    document.getElementById('Calendly').style.opacity = "1";
                    generateEventlinkUI(JSON.parse(data.response), element);
                }
            });
    });
}

function generateEventlinkUI(userEvent, userInfo) {
    var body = `<div class="row"><div class="col-md-12 boxing" ><div class="row">
    <div class="col-md-6">
        <span style="top: 15px;display: flex;position: relative;"><img
                src="Image/profileimg.png" alt="profileimg"
                style="width:50px;height:50px;">
            <div style="width:100%;margin-left: 10px;">
                <p style="margin-bottom: 0px;">${userInfo['user']['name']}</p>
                <a href="">${userInfo['user']['scheduling_url']}</a>
            </div>
        </span>
    </div>
    <div class="col-md-6"></div>
</div></div> </div>
  `;

    for (var i = 0; i < userEvent.collection.length; i++) {
        if (userEvent.collection[i]['profile'] != null) {
            console.log(userEvent.collection[i]['name']);
            body = body + `
           <div class="row" style="margin-top: 10px;margin-bottom:10px;">
           <div class="eventboxing col-md-12"
               style="border-left: 4px solid ${userEvent.collection[i]['color']}">
               <div class="row" style="height:100px;">
                   <div class="col-md-6">
                       <div style="top: 20px;position: relative;">
                           <p style="font-weight: 700;">${userEvent.collection[i]['name']}</p>
                            <span><img src="Image/external-link.png" alt="arrow"
                            style="width: 25px;height: 25px;"><a href="${userEvent.collection[i]['scheduling_url']}" target="_blank" style="padding-left: 5px;"> Open </a>
                            <button class="singleuselink" onclick="getSinglelink('${userEvent.collection[i]['uri']}')">Get single-use link</button>
                            </span>
                       </div>
                   </div>
                   <div class="col-md-6">
                   <div style="height: 100px;float: right;top: 20px;position: relative;">
                   <p style="color: #1E8449;">${userEvent.collection[i]['active'] == true ? "Active" : "In-Active"}</p>
                   <p>${createTime(userEvent.collection[i]['created_at'])}</p>
                   </div>
                   </div>
               </div>
           </div>
       </div>
          `;
        }
    }
    userBody = userBody + body;
    document.getElementById("usersInfo").innerHTML = userBody;
}

function getSinglelink(eventUrl) {
    var req = { "max_event_count": 1, "owner": eventUrl, "owner_type": "EventType" };
    console.log(req);
    var datas = {};
    datas.data = req;
    ZOHO.CRM.CONNECTOR.invokeAPI(config.getsingleuselink, datas)  // getsingleuselink  //gow
        .then(function (data) {
            console.log(data);
            if (data['status_code'] == 201) {
                var response = JSON.parse(data['response']);
                window.open(response['resource']['booking_url'], '_blank');
            }
        })
}

function clearing() {
    var select = document.getElementsByClassName("selects");
    console.log(select);
    for (var i = 0; i < select.length; i++) {
        document.getElementById("CalendlyUser" + i).value = 0;
        var op = document.getElementById("CalendlyUser" + i).getElementsByTagName("option");
        for (var k = 0; k < op.length; k++) {
            op[k].disabled = false;
        }
    }
}

function createTime(create) {
    var createTime = create.split("T");
    return createTime[0];
}

function settings() {
    document.getElementById('Settings').style.display = "block";
}

function back() {
    document.getElementById("home").style.display = "block";
    document.getElementById('tabview').style.display = "none";
    document.getElementById('Settings').style.display = "none";
    document.getElementById("calendlyHome").style.display = "none";
}

function mapUser() {
    // created the org setting varaible , map the user which was selected by the user in the widget and save the id in the sys variable .
    // should implement 
    var arr = [];
    var select = document.getElementsByClassName("selects");
    for (var i = 0; i < select.length; i++) {
        if (document.getElementById("CalendlyUser" + i).value != 0) {
            console.log(document.getElementById("CalendlyUser" + i).value);
            for (var j = 0; j < calendlyUserInfo.length; j++) {
                if (document.getElementById("CalendlyUser" + i).value == calendlyUserInfo[j]['user']['uri']) {
                    var datas = {
                        "crmUsers": crmUserInfo[i]['id'],
                        "calendlyUsers": calendlyUserInfo[j]['user']['uri']
                    }
                    arr.push(datas);
                    console.log(datas);
                }
            }
        }
    }


    ZOHO.CRM.CONNECTOR.invokeAPI("crm.set", { "apiname": "finstak__calendlyHostNameNew", "value": arr }).then(function (data) {
        console.log(data);
        document.getElementById('successHeader').innerText = 'The User Mapping has been saved successfully.';
        $('#successNotification').click();
    });
}

function saveNotification() {
    var signal = document.getElementById('signal').value;
    console.log(signal);
    ZOHO.CRM.CONNECTOR.invokeAPI("crm.set", { "apiname": "finstak__notificationSignal", "value": signal }).then(function (data) {
        console.log(JSON.parse(data));
        if (JSON.parse(data).status_code == "200") {
            document.getElementById('successHeader').innerText = 'The Signal Notification has been saved successfully.';
            $('#successNotification').click();
        }
    });
}

function saveUserType() {
    var userType = document.getElementById('userModuleType').value;
    console.log(userType);
    ZOHO.CRM.CONNECTOR.invokeAPI("crm.set", { "apiname": "finstak__userType", "value": userType }).then(function (data) {
        console.log(data);
        if (JSON.parse(data).status_code == "200") {
            document.getElementById('successHeader').innerText = 'The User Type has been saved successfully.';
            $('#successNotification').click();
        }
    });
}


function search() {
    document.getElementById('loadingGif1').style.display = "inline-flex";
    document.getElementById('loadingGif1').style.position = "absolute";
    document.getElementById('loadingGif1').style.opacity = "1";
    document.getElementById('Calendly').style.opacity = "0.5";

    pastMeetingEmailArr = [];
    upcomingMeetingEmailArr = [];
    console.log(document.getElementById('inviteeEmail').value);
    var email = document.getElementById('inviteeEmail').value;
    var validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (email.length > 0 && email.match(validRegex)) { // check the email is in valid format
        var request = {};
        request.organization = encodeURIComponent(currentLoggedInUser['organization']);
        request.invitee_email = encodeURIComponent(email);
        ZOHO.CRM.CONNECTOR.invokeAPI(config.scheduledevents_invitee, request)
            .then(function (data) {
                console.log(data);
                if (data.status_code == 200) {
                    var emailAssociatedEvent = JSON.parse(data.response);
                    forEmailEventCollections = emailAssociatedEvent['collection'];
                    console.log(forEmailEventCollections);
                    forEmailEventCollections.forEach(element => {
                        findUpcomingPastmeetingForEmail(element);
                    });
                    setTimeout(() => {
                        document.getElementById('loadingGif1').style.display = "none";
                        document.getElementById('Calendly').style.opacity = "1";
                        generatePastMeetingEmailUI(pastMeetingEmailArr);
                        generateUpComingMeetingEmailUI(upcomingMeetingEmailArr);
                    }, 3000);
                }
            });
    } else {
        alert('Enter valid email address..');
        document.getElementById('loadingGif1').style.display = "none";
        document.getElementById('Calendly').style.opacity = "1";
    }
}

function createWebhookuuid() {

    var zapiKey = '', zapiurl = '';
    ZOHO.CRM.CONNECTOR.invokeAPI("crm.zapikey", { "nameSpace": "vcrm_finstak" }).then(function (zApiKeyData) {
        var tempZApiKeyResponse = JSON.parse(zApiKeyData);
        console.log(tempZApiKeyResponse);
        if (tempZApiKeyResponse['status_code'] == 200) {
            zapiKey = tempZApiKeyResponse['response'];
            console.log(zapiKey);
        }
        zapiurl = "https://finstak.zohoplatform.com/crm/v2/functions/finstak__calendlyautomation/actions/execute?auth_type=apikey&zapikey=" + zapiKey;// prod

        console.log(zapiurl);
        ZOHO.CRM.CONNECTOR.invokeAPI(config.getUsers, {}) //  users
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
                            if (data.status_code == 201) {
                                var response = JSON.parse(data.response);
                                console.log(response);
                                var webhookuri = response['resource']['uri'].split("/");
                                var webhookuuid = webhookuri[webhookuri.length - 1];
                                console.log(webhookuuid);
                                ZOHO.CRM.CONNECTOR.invokeAPI("crm.set", { "apiname": "finstak__webhookuuid", "value": webhookuuid }).then(function (data) {
                                    console.log(data);
                                    if (JSON.parse(data).status_code == "200") {
                                        window.location.reload(true);
                                    }
                                });
                            }
                        });
                }
            });
    });
}

