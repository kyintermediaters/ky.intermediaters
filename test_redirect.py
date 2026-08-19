import requests
import json
import logging
import http.client as http_client

http_client.HTTPConnection.debuglevel = 1
logging.basicConfig()
logging.getLogger().setLevel(logging.DEBUG)
requests_log = logging.getLogger("requests.packages.urllib3")
requests_log.setLevel(logging.DEBUG)
requests_log.propagate = True

url = "https://script.google.com/macros/s/AKfycbyVqvW13YGuqzdNIhSP_4y5sMmU2yRG8O1ausqVFZyu2QG2z5957limOeD0IWXJNNkf/exec"
payload = {
    "action": "updateLead",
    "email": "keerthishankaresh@gmail.com",
    "field": "Status",
    "value": "Contacted",
    "pass": "adminkypass"
}

r = requests.post(url, data=json.dumps(payload), headers={'Content-Type': 'text/plain;charset=utf-8'}, allow_redirects=True)
