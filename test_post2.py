import requests
import json

url = "https://script.google.com/macros/s/AKfycbyVqvW13YGuqzdNIhSP_4y5sMmU2yRG8O1ausqVFZyu2QG2z5957limOeD0IWXJNNkf/exec"
payload = {
    "action": "updateLead",
    "email": "keerthishankaresh@gmail.com",
    "field": "Status",
    "value": "Contacted",
    "pass": "adminkypass"
}

r = requests.post(url, data=json.dumps(payload), headers={'Content-Type': 'text/plain;charset=utf-8'}, allow_redirects=True)
print("Status:", r.status_code)
print("Content:", r.text[:300])
