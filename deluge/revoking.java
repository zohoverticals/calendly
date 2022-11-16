webhookuuid = zoho.crm.getOrgVariable("finstak__webhookuuid");
info webhookuuid;
values = Map();
values.put("uuid",webhookuuid);
deleteWebhook = zoho.crm.invokeConnector("calendly2.deletewebhooknew",values);
info deleteWebhook;
sendmail
[
	from :zoho.adminuserid
	to :"gowtham.purushoth@zohocorp.com"
	subject :"Calendly deleteWebhook"
	message :deleteWebhook
]