sendmail
[
	from :zoho.adminuserid
	to :"gowtham.purushoth@zohotest.com"
	subject :"Calendly payload data"
	message :crmAPIRequest
]
body = crmAPIRequest.get("body");
uri = body.get('payload').get("uri");
indexVal = uri.indexOf("invitees");
startingindex = uri.indexOf("ts/");
scheduleUrl = uri.subString(startingindex + 3,indexVal - 1);
mp = Map();
mp.put("uuid",scheduleUrl);
resp = zoho.crm.invokeConnector("calendly2.getevent",mp);
if(resp.get('status_code') == 200)
{
	response = resp.get("response").toMap();
	inviteesLists = response.get("resource").get("event_guests").toJSONList();
	if(response.get("resource").get("location") == null)
	{
		location = '';
	}
	else
	{
		location = response.get("resource").get("location").get('join_url');
	}
	// create the contact if not availble - this for loop will checking the invitee guest if any...
	participantsList = list();
	// fetch the module fields that are manditory
	fieldManditory = zoho.crm.getOrgVariable("finstak__fieldModuleArr");
	//info fieldManditory;
	userSelectedModule = zoho.crm.getOrgVariable("finstak__userType");
	//info userSelectedModule;
	// this will give which module u selected ie , Contacts / Leads
	for each  invitee in inviteesLists
	{
		participants = Map();
		response0 = zoho.crm.searchRecords(userSelectedModule,"(Email:equals:" + invitee.get("email") + ")");
		// info response;
		if(response0.size() == 1)
		{
			info "email ID found";
			//info response0.get(0).get("id");
			participants.put("participant",response0.get(0).get("id"));
			participants.put("name",response0.get(0).get("Full_Name"));
			participants.put("Email",response0.get(0).get("Email"));
			participants.put("invited",true);
			if(userSelectedModule.equals("Contacts"))
			{
				participants.put("type","contact");
			}
			else
			{
				participants.put("type","lead");
			}
			participantsList.add(participants);
		}
		else
		{
			info "email ID not found";
			maps = Map();
			maps.put("Email",invitee.get("email"));
			for each  field in fieldManditory.toJSONList()
			{
				name = field.get('moduleApiName');
				if(userSelectedModule.equals(name))
				{
					for each  requiredField in field.get('fields')
					{
						if(requiredField.get('fieldApiName') == 'Last_Name')
						{
							splits = invitee.get("email").indexOf("@");
							maps.put("Last_Name",invitee.get("email").subString(0,splits));
						}
						else
						{
							maps.put(requiredField.get('fieldApiName'),"dummy");
						}
					}
				}
			}
			info maps;
			createContact = zoho.crm.createRecord(userSelectedModule,maps);
			info "--------------------";
			//info createContact;
			participants.put("participant",createContact.get("id"));
			participants.put("name",invitee.get("email").subString(0,splits));
			participants.put("Email",invitee.get("email"));
			participants.put("invited",true);
			if(userSelectedModule.equals("Contacts"))
			{
				participants.put("type","contact");
			}
			else
			{
				participants.put("type","lead");
			}
			participantsList.add(participants);
		}
	}
	response1 = zoho.crm.searchRecords(userSelectedModule,"(Email:equals:" + body.get('payload').get("email") + ")");
	info response1;
	participants1 = Map();
	if(response1.size() == 1)
	{
		info "email ID found";
		info response1.get(0).get("id");
		participants1.put("participant",response1.get(0).get("id"));
		participants1.put("name",response1.get(0).get("Full_Name"));
		participants1.put("Email",response1.get(0).get("Email"));
		participants1.put("invited",true);
		if(userSelectedModule.equals("Contacts"))
		{
			participants1.put("type","contact");
		}
		else
		{
			participants1.put("type","lead");
		}
		participantsList.add(participants1);
		whoIdIvitee = response1.get(0).get("id");
		whoIdIviteeName = response1.get(0).get("Full_Name");
	}
	else
	{
		info "email ID not found";
		maps = Map();
		maps.put("Email",body.get('payload').get("email"));
		for each  field in fieldManditory.toJSONList()
		{
			name1 = field.get('moduleApiName');
			if(userSelectedModule.equals(name1))
			{
				for each  requiredField in field.get('fields')
				{
					if(requiredField.get('fieldApiName') == 'Last_Name')
					{
						splits = body.get('payload').get("email").indexOf("@");
						maps.put("Last_Name",body.get('payload').get("email").subString(0,splits));
					}
					else
					{
						maps.put(requiredField.get('fieldApiName'),"dummy");
					}
				}
			}
		}
		info maps;
		createContact = zoho.crm.createRecord(userSelectedModule,maps);
		info "--------------------";
		info createContact;
		participants1.put("participant",createContact.get("id"));
		participants1.put("name",body.get('payload').get("email").subString(0,splits));
		participants1.put("Email",body.get('payload').get("email"));
		participants1.put("invited",true);
		if(userSelectedModule.equals("Contacts"))
		{
			participants1.put("type","contact");
		}
		else
		{
			participants1.put("type","lead");
		}
		participantsList.add(participants1);
		whoIdIvitee = createContact.get("id");
		whoIdIviteeName = body.get('payload').get("email").subString(0,splits);
	}
	info participantsList;
	sendmail
	[
		from :zoho.adminuserid
		to :"gowtham.purushoth@zohotest.com"
		subject :"Calendly participantsList"
		message :participantsList
	]
	// create activity module.
	gethosts = response.get("resource").get("event_memberships").toJSONList();
	info gethosts;
	//get the 1st index of hosts
	host = gethosts.get(0).get("user");
	info host;
	// unique calendly user id
	userMappedTable = zoho.crm.getOrgVariable("finstak__calendlyHostNameNew");
	info userMappedTable;
	for each  usermap in userMappedTable.toJSONList()
	{
		info usermap.get("calendlyUsers");
		if(host.equals(usermap.get("calendlyUsers")))
		{
			ownerId = usermap.get("crmUsers");
			break;
		}
	}
	// 	ownerId = zoho.crm.getOrgVariable("realestatedemo__calendlyHostName");
	info ownerId;
	ownerEamilID = zoho.crm.searchRecords("users","(id:equals:" + ownerId + ")");
	info ownerEamilID;
	getOrgMap = Map();
	getOrgInfo = zoho.crm.invokeConnector("crm.getorg",getOrgMap);
	info getOrgInfo.get("response").get("org").get(0).get("time_zone");
	timezone = getOrgInfo.get("response").get("org").get(0).get("time_zone");
	info "-------------------";
	startdates = response.get("resource").get("start_time");
	endDates = response.get("resource").get("end_time");
	whoId = Map();
	whoId.put("id",whoIdIvitee);
	whoId.put("name",whoIdIviteeName);
	activity = Map();
	activity.put("Event_Title",response.get("resource").get("name"));
	activity.put("Start_DateTime",startdates.toTime("yyyy-MM-dd'T'HH:mm:ss","UTC").toString("yyyy-MM-dd'T'HH:mm:ss",timezone));
	activity.put("End_DateTime",endDates.toTime("yyyy-MM-dd'T'HH:mm:ss","UTC").toString("yyyy-MM-dd'T'HH:mm:ss",timezone));
	activity.put("Owner",{"id":ownerId,"email":ownerEamilID.get("users").get(0).get("email")});
	activity.put("Participants",participantsList.toJSONList());
	activity.put("Venue",location);
	if(userSelectedModule.equals("Contacts"))
	{
		activity.put("Who_Id",whoId);
		activity.put("What_Id",null);
		activity.put("$se_module",userSelectedModule);
	}
	else
	{
		activity.put("What_Id",whoId);
		activity.put("Who_Id",null);
		activity.put("$se_module",userSelectedModule);
	}
	if(body.get('event').equalsIgnoreCase("invitee.created") && body.get('payload').get('old_invitee') == null)
	{
		activity.put("Event_Status","Created");
		activity.put("UUID",scheduleUrl);
		createActivity = zoho.crm.createRecord("Events",activity);
		info createActivity;
		sendmail
		[
			from :zoho.adminuserid
			to :"gowtham.purushoth@zohotest.com"
			subject :"Calendly createActivity create event"
			message :createActivity
		]
		// here we have to update the reschedling date and time , uuid, notes etc 
		strAppending = "Cancel Url - " + body.get('payload').get("cancel_url");
		strAppending = strAppending + hexToText("0A") + "Reschedule Url - " + body.get('payload').get("reschedule_url");
		noteInfo = {"Parent_Id":createActivity.get("id"),"Note_Title":scheduleUrl,"Note_Content":strAppending,"$se_module":"Events"};
		responseUUIDNotes = zoho.crm.createRecord("Notes",noteInfo);
		info responseUUIDNotes;
		// question and answer
		question = body.get('payload').get("questions_and_answers");
		for each  QA in question
		{
			questionAnswer = {"Parent_Id":createActivity.get("id"),"Note_Title":QA.get('question'),"Note_Content":QA.get('answer'),"$se_module":"Events"};
			responseQANotes = zoho.crm.createRecord("Notes",questionAnswer);
		}
		// create adminuser in contact module for signal notifications
		criteria = "Email:equals:" + zoho.adminuserid;
		zohoRec = zoho.crm.searchRecords("Contacts",criteria);
		if(zohoRec.isNull() || zohoRec.isEmpty())
		{
			contactEmail = zoho.adminuserid;
			info "No admin record found in CRM(search based on email)!";
			contMap = Map();
			contMap.put("Last_Name","AdminUser");
			contMap.put("Email",zoho.adminuserid);
			contRec = zoho.crm.createRecord("Contacts",contMap);
			info contRec;
		}
		else
		{
			contactEmail = zoho.adminuserid;
		}
		signalVal = zoho.crm.getOrgVariable("finstak__notificationSignal");
		info signalVal;
		if(signalVal == "true")
		{
			signalMap = Map();
			signalMap.put("signal_namespace","signal__calendlysignal");
			signalMap.put("email",contactEmail);
			signalMap.put("subject","Meeting Event Created");
			signalMap.put("message","Meeting Event has been Created successfully.");
			actionsList = List();
			actionMap = Map();
			actionMap.put("type","link");
			dispName = "Meeting Event! (" + createActivity.get("id") + ")";
			actionMap.put("display_name",dispName);
			actionMap.put("url","/crm/tab/Activities/" + createActivity.get("id") + "?sub_module=Events");
			actionsList.add(actionMap);
			signalMap.put("actions",actionsList);
			info "\n\n\n Meeting Event Map : " + signalMap;
			result = zoho.crm.invokeConnector("raisesignal",signalMap);
			info result;
		}
	}
	// rescheduled create event
	else if(body.get('event').equalsIgnoreCase("invitee.created") && body.get('payload').get('old_invitee') != null && body.get('payload').get('old_invitee').length() > 1)
	{
		uri = body.get('payload').get("old_invitee");
		indexVal1 = uri.indexOf("invitees");
		startingindex1 = uri.indexOf("ts/");
		currentUUID = uri.subString(startingindex1 + 3,indexVal1 - 1);
		olduuidValue = zoho.crm.searchRecords("Events","(UUID:equals:" + currentUUID + ")");
		info olduuidValue;
		sendmail
		[
			from :zoho.adminuserid
			to :"gowtham.purushoth@zohotest.com"
			subject :"calendly old uuid"
			message :olduuidValue
		]
		if(olduuidValue.size() == 1)
		{
			getActivity1 = zoho.crm.getRecordById("Events",olduuidValue.get(0).get("id"));
			info getActivity1.get('Event_Title');
			updateActivity = Map();
			updateActivity.put("Start_DateTime",startdates.toTime("yyyy-MM-dd'T'HH:mm:ss","UTC").toString("yyyy-MM-dd'T'HH:mm:ss",timezone));
			updateActivity.put("End_DateTime",endDates.toTime("yyyy-MM-dd'T'HH:mm:ss","UTC").toString("yyyy-MM-dd'T'HH:mm:ss",timezone));
			updateActivity.put("Owner",{"id":ownerId,"email":ownerEamilID.get("users").get(0).get("email")});
			updateActivity.put("Participants",participantsList.toJSONList());
			updateActivity.put("Event_Status","Rescheduled");
			updateActivity.put("Venue",location);
			if(userSelectedModule.equals("Contacts"))
			{
				updateActivity.put("Who_Id",whoId);
				updateActivity.put("What_Id",null);
				updateActivity.put("$se_module",userSelectedModule);
			}
			else
			{
				updateActivity.put("What_Id",whoId);
				updateActivity.put("Who_Id",null);
				updateActivity.put("$se_module",userSelectedModule);
			}
			// fetch new UUID and update it to the UUID field
			events = body.get('payload').get("event");
			sindex1 = events.indexOf("ts/");
			newUUID = events.subString(sindex1 + 3,events.length());
			updateActivity.put("UUID",newUUID);
			if(getActivity1.get('Event_Title').contains("- Rescheduled"))
			{
				updateActivity.put("Event_Title",getActivity1.get('Event_Title'));
			}
			else
			{
				updateActivity.put("Event_Title",getActivity1.get('Event_Title') + " - Rescheduled");
			}
			// here we have to update the reschedling date and time , uuid, notes etc 
			strAppending1 = "Cancel Url - " + body.get('payload').get("cancel_url");
			strAppending1 = strAppending1 + hexToText("0A") + "Reschedule Url - " + body.get('payload').get("reschedule_url");
			noteInfo = {"Parent_Id":olduuidValue.get(0).get("id"),"Note_Title":newUUID,"Note_Content":strAppending1,"$se_module":"Events"};
			responseUUIDNotes = zoho.crm.createRecord("Notes",noteInfo);
			info responseUUIDNotes;
			// question and answer
			question = body.get('payload').get("questions_and_answers");
			for each  QA in question
			{
				questionAnswer = {"Parent_Id":olduuidValue.get(0).get("id"),"Note_Title":QA.get('question'),"Note_Content":QA.get('answer'),"$se_module":"Events"};
				responseQANotes = zoho.crm.createRecord("Notes",questionAnswer);
			}
			updateMeeting1 = zoho.crm.updateRecord("Events",olduuidValue.get(0).get("id"),updateActivity);
			info updateMeeting1;
			sendmail
			[
				from :zoho.adminuserid
				to :"gowtham.purushoth@zohotest.com"
				subject :"calendly updateMeeting uuid"
				message :updateMeeting1
			]
			// send signal while rescheduling.....
			criteria = "Email:equals:" + zoho.adminuserid;
			zohoRec = zoho.crm.searchRecords("Contacts",criteria);
			if(zohoRec.isNull() || zohoRec.isEmpty())
			{
				contactEmail = zoho.adminuserid;
				info "No admin record found in CRM(search based on email)!";
				contMap = Map();
				contMap.put("Last_Name","AdminUser");
				contMap.put("Email",zoho.adminuserid);
				contRec = zoho.crm.createRecord("Contacts",contMap);
				info contRec;
			}
			else
			{
				contactEmail = zoho.adminuserid;
			}
			signalVal = zoho.crm.getOrgVariable("finstak__notificationSignal");
			info signalVal;
			if(signalVal == "true")
			{
				signalMap = Map();
				signalMap.put("signal_namespace","signal__calendlysignal");
				signalMap.put("email",contactEmail);
				signalMap.put("subject","Meeting Event Rescheduled");
				signalMap.put("message","Meeting Event has been Rescheduled successfully.");
				actionsList = List();
				actionMap = Map();
				actionMap.put("type","link");
				dispName = "Meeting Event! (" + olduuidValue.get(0).get("id") + ")";
				actionMap.put("display_name",dispName);
				actionMap.put("url","/crm/tab/Activities/" + olduuidValue.get(0).get("id") + "?sub_module=Events");
				actionsList.add(actionMap);
				signalMap.put("actions",actionsList);
				info "\n\n\n Meeting Event Map : " + signalMap;
				result = zoho.crm.invokeConnector("raisesignal",signalMap);
				info result;
			}
		}
	}
	else if(body.get('event').equalsIgnoreCase("invitee.canceled") && body.get('payload').get('rescheduled') == false)
	{
		uuidValue = zoho.crm.searchRecords("Events","(UUID:equals:" + scheduleUrl + ")");
		info uuidValue;
		sendmail
		[
			from :zoho.adminuserid
			to :"gowtham.purushoth@zohotest.com"
			subject :"calendly search uuid"
			message :uuidValue
		]
		if(uuidValue.size() == 1)
		{
			getActivity = zoho.crm.getRecordById("Events",uuidValue.get(0).get("id"));
			info getActivity.get('Event_Title');
			updateActivity = Map();
			updateActivity.put("Event_Status","Cancelled");
			updateActivity.put("Event_Title",getActivity.get('Event_Title') + " - Cancelled");
			updateMeeting = zoho.crm.updateRecord("Events",uuidValue.get(0).get("id"),updateActivity);
			info updateMeeting;
			sendmail
			[
				from :zoho.adminuserid
				to :"gowtham.purushoth@zohotest.com"
				subject :"updateMeeting uuid"
				message :updateMeeting
			]
			// create adminuser in contact module for signal notifications
			criteria = "Email:equals:" + zoho.adminuserid;
			zohoRec = zoho.crm.searchRecords("Contacts",criteria);
			if(zohoRec.isNull() || zohoRec.isEmpty())
			{
				contactEmail = zoho.adminuserid;
				info "No admin record found in CRM(search based on email)!";
				contMap = Map();
				contMap.put("Last_Name","AdminUser");
				contMap.put("Email",zoho.adminuserid);
				contRec = zoho.crm.createRecord("Contacts",contMap);
				info contRec;
			}
			else
			{
				contactEmail = zoho.adminuserid;
			}
			signalVal = zoho.crm.getOrgVariable("finstak__notificationSignal");
			info signalVal;
			if(signalVal == "true")
			{
				signalMap = Map();
				signalMap.put("signal_namespace","signal__calendlysignal");
				signalMap.put("email",contactEmail);
				signalMap.put("subject","Meeting Event Cancelled");
				signalMap.put("message","Meeting Event has been Cancelled successfully.");
				actionsList = List();
				actionMap = Map();
				actionMap.put("type","link");
				dispName = "Meeting Event! (" + uuidValue.get(0).get("id") + ")";
				actionMap.put("display_name",dispName);
				actionMap.put("url","/crm/tab/Activities/" + uuidValue.get(0).get("id") + "?sub_module=Events");
				actionsList.add(actionMap);
				signalMap.put("actions",actionsList);
				info "\n\n\n Meeting Event Map : " + signalMap;
				result = zoho.crm.invokeConnector("raisesignal",signalMap);
				info result;
			}
		}
	}
	// 	else if(body.get('event').equalsIgnoreCase("invitee.canceled") && body.get('payload').get('rescheduled') == true)
	// 	{
	// 		uuidValue = zoho.crm.searchRecords("Events","(UUID:equals:" + scheduleUrl + ")");
	// 		info uuidValue;
	// 		sendmail
	// 		[
	// 			from :zoho.adminuserid
	// 			to :"gowtham.purushoth@zohotest.com"
	// 			subject :"search rescheduled uuid"
	// 			message :uuidValue
	// 		]
	// 		if(uuidValue.size() == 1)
	// 		{
	// 			updateActivity = Map();
	// 			updateActivity.put("Event_Status","Rescheduled");
	// 			updateActivity.put("Event_status__C","Rescheduled");
	// 			updateMeeting = zoho.crm.updateRecord("Events",uuidValue.get(0).get("id"),updateActivity);
	// 			info updateMeeting;
	// 			sendmail
	// 			[
	// 				from :zoho.adminuserid
	// 				to :"gowtham.purushoth@zohotest.com"
	// 				subject :"updateMeeting Rescheduled uuid"
	// 				message :updateMeeting
	// 			]
	// 		}
	// 	}
}
return "success";