import urllib.request, json, sys

data = {
    "FirstName": "Mahammadkhasim",
    "LastName": "S",
    "Email": "mahmammadabdul90@gmail.com",
    "Password": "TestPass123",
    "PhoneNumber": "1234343435"
}
req = urllib.request.Request('http://127.0.0.1:7788/signup', data=json.dumps(data).encode('utf-8'), headers={'Content-Type':'application/json'})
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        body = resp.read().decode('utf-8')
        print('STATUS', resp.status)
        print('BODY', body)
except Exception as e:
    print('ERROR', e)
    sys.exit(1)
