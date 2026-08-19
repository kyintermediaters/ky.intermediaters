import requests

url = "https://script.google.com/macros/s/AKfycbyVqvW13YGuqzdNIhSP_4y5sMmU2yRG8O1ausqVFZyu2QG2z5957limOeD0IWXJNNkf/exec"
payload = {
    "action": "updateLead",
    "email": "jaiakash.s.s.122@kalvium.community",
    "field": "Status",
    "value": "Contacted",
    "pass": "adminkypass"
}

r = requests.post(url, json=payload, allow_redirects=True)
print("Status:", r.status_code)
print("Content:", r.text[:300])
