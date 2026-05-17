How to use
Examples for enrichment, deep research, and platform scraping. Use your API key and secret from Credentials.

Request templates

curl

Node.js

Python

Go

C#

Java

Rust
Base URL
https://developer.thehog.ai
POST /api/enrichments
Beta
Replace ak_REPLACE_ME and sk_REPLACE_ME with your credential values.

import json
import requests

URL = "https://developer.thehog.ai/api/enrichments"
ACCESS = "ak_REPLACE_ME"
SECRET = "sk_REPLACE_ME"

payload = json.loads(r'''{"identifier":{"linkedin_url":"https://www.linkedin.com/in/example"},"fields":["contact.email","contact.phone"]}''')

r = requests.post(
    URL,
    headers={
        "X-Access-Key": ACCESS,
        "X-Secret-Key": SECRET,
        "Content-Type": "application/json",
    },
    json=payload,
)
print(r.text)

GET /api/enrichments/:id
Beta
Replace ak_REPLACE_ME and sk_REPLACE_ME with your credential values.

import requests

BASE = "https://developer.thehog.ai/api/enrichments/OPERATION_ID_REPLACE_ME"
ACCESS = "ak_REPLACE_ME"
SECRET = "sk_REPLACE_ME"

r = requests.get(
    BASE,
    headers={
        "X-Access-Key": ACCESS,
        "X-Secret-Key": SECRET,
    },
)
print(r.text)

POST /api/v1/people/search
Beta
Replace ak_REPLACE_ME and sk_REPLACE_ME with your credential values.

import json
import requests

URL = "https://developer.thehog.ai/api/v1/people/search"
ACCESS = "ak_REPLACE_ME"
SECRET = "sk_REPLACE_ME"

payload = json.loads(r'''{"query":"VP Engineering at hiring B2B SaaS companies in SF","limit":25,"includeContacts":true,"includeSignals":true}''')

r = requests.post(
    URL,
    headers={
        "X-Access-Key": ACCESS,
        "X-Secret-Key": SECRET,
        "Content-Type": "application/json",
    },
    json=payload,
)
print(r.text)

POST /api/v1/companies/search
Beta
Replace ak_REPLACE_ME and sk_REPLACE_ME with your credential values.

import json
import requests

URL = "https://developer.thehog.ai/api/v1/companies/search"
ACCESS = "ak_REPLACE_ME"
SECRET = "sk_REPLACE_ME"

payload = json.loads(r'''{"query":"B2B SaaS companies in Austin hiring engineers","limit":25,"includeSignals":true,"filters":{"signals":["hiring"]}}''')

r = requests.post(
    URL,
    headers={
        "X-Access-Key": ACCESS,
        "X-Secret-Key": SECRET,
        "Content-Type": "application/json",
    },
    json=payload,
)
print(r.text)

POST /api/deep-research
Beta
Replace ak_REPLACE_ME and sk_REPLACE_ME with your credential values.

Deep Research defaults to budget.maxCredits=1000. Lower caps intentionally do less research. Higher maxCredits often, but not always, improves AI processing and investigative enrichment by allowing more planning, sources, and verification.

import json
import requests

URL = "https://developer.thehog.ai/api/deep-research"
ACCESS = "ak_REPLACE_ME"
SECRET = "sk_REPLACE_ME"

payload = json.loads(r'''{"prompt":"Research Acme Corp funding, leadership, and products.","schema":{"type":"object","properties":{"company_name":{"type":"string"},"funding_summary":{"type":"string"},"key_products":{"type":"array","items":{"type":"string"}}},"required":["company_name"]},"budget":{"maxCredits":1000},"urls":["https://acme.com"]}''')

r = requests.post(
    URL,
    headers={
        "X-Access-Key": ACCESS,
        "X-Secret-Key": SECRET,
        "Content-Type": "application/json",
    },
    json=payload,
)
print(r.text)

POST /api/v1/platform/scrapers/web/scrape
Beta
Replace ak_REPLACE_ME and sk_REPLACE_ME with your credential values.

import json
import requests

URL = "https://developer.thehog.ai/api/v1/platform/scrapers/web/scrape"
ACCESS = "ak_REPLACE_ME"
SECRET = "sk_REPLACE_ME"

payload = json.loads(r'''{"url":"https://example.com","renderJs":true}''')

r = requests.post(
    URL,
    headers={
        "X-Access-Key": ACCESS,
        "X-Secret-Key": SECRET,
        "Content-Type": "application/json",
    },
    json=payload,
)
print(r.text)

POST /api/v1/platform/scrapers/tiktok/profile
Beta
Replace ak_REPLACE_ME and sk_REPLACE_ME with your credential values.

import json
import requests

URL = "https://developer.thehog.ai/api/v1/platform/scrapers/tiktok/profile"
ACCESS = "ak_REPLACE_ME"
SECRET = "sk_REPLACE_ME"

payload = json.loads(r'''{"username":"tiktok","maxVideos":20}''')

r = requests.post(
    URL,
    headers={
        "X-Access-Key": ACCESS,
        "X-Secret-Key": SECRET,
        "Content-Type": "application/json",
    },
    json=payload,
)
print(r.text)

POST /api/v1/platform/scrapers/instagram/profile
Beta
Replace ak_REPLACE_ME and sk_REPLACE_ME with your credential values.

import json
import requests

URL = "https://developer.thehog.ai/api/v1/platform/scrapers/instagram/profile"
ACCESS = "ak_REPLACE_ME"
SECRET = "sk_REPLACE_ME"

payload = json.loads(r'''{"username":"instagram"}''')

r = requests.post(
    URL,
    headers={
        "X-Access-Key": ACCESS,
        "X-Secret-Key": SECRET,
        "Content-Type": "application/json",
    },
    json=payload,
)
print(r.text)

POST /api/v1/platform/scrapers/instagram/posts
Beta
Replace ak_REPLACE_ME and sk_REPLACE_ME with your credential values.

import json
import requests

URL = "https://developer.thehog.ai/api/v1/platform/scrapers/instagram/posts"
ACCESS = "ak_REPLACE_ME"
SECRET = "sk_REPLACE_ME"

payload = json.loads(r'''{"username":"instagram","maxPosts":20}''')

r = requests.post(
    URL,
    headers={
        "X-Access-Key": ACCESS,
        "X-Secret-Key": SECRET,
        "Content-Type": "application/json",
    },
    json=payload,
)
print(r.text)

POST /api/v1/platform/scrapers/instagram/post-details
Beta
Replace ak_REPLACE_ME and sk_REPLACE_ME with your credential values.

import json
import requests

URL = "https://developer.thehog.ai/api/v1/platform/scrapers/instagram/post-details"
ACCESS = "ak_REPLACE_ME"
SECRET = "sk_REPLACE_ME"

payload = json.loads(r'''{"postUrl":"https://www.instagram.com/p/POST_SHORTCODE/"}''')

r = requests.post(
    URL,
    headers={
        "X-Access-Key": ACCESS,
        "X-Secret-Key": SECRET,
        "Content-Type": "application/json",
    },
    json=payload,
)
print(r.text)

POST /api/v1/platform/scrapers/instagram/post-comments
Beta
Replace ak_REPLACE_ME and sk_REPLACE_ME with your credential values.

import json
import requests

URL = "https://developer.thehog.ai/api/v1/platform/scrapers/instagram/post-comments"
ACCESS = "ak_REPLACE_ME"
SECRET = "sk_REPLACE_ME"

payload = json.loads(r'''{"postUrl":"https://www.instagram.com/p/POST_SHORTCODE/","maxComments":20,"includeNested":false}''')

r = requests.post(
    URL,
    headers={
        "X-Access-Key": ACCESS,
        "X-Secret-Key": SECRET,
        "Content-Type": "application/json",
    },
    json=payload,
)
print(r.text)

POST /api/v1/platform/scrapers/instagram/followers
Beta
Replace ak_REPLACE_ME and sk_REPLACE_ME with your credential values.

import json
import requests

URL = "https://developer.thehog.ai/api/v1/platform/scrapers/instagram/followers"
ACCESS = "ak_REPLACE_ME"
SECRET = "sk_REPLACE_ME"

payload = json.loads(r'''{"username":"instagram","maxFollowers":100}''')

r = requests.post(
    URL,
    headers={
        "X-Access-Key": ACCESS,
        "X-Secret-Key": SECRET,
        "Content-Type": "application/json",
    },
    json=payload,
)
print(r.text)

POST /api/v1/platform/scrapers/instagram/following
Beta
Replace ak_REPLACE_ME and sk_REPLACE_ME with your credential values.

import json
import requests

URL = "https://developer.thehog.ai/api/v1/platform/scrapers/instagram/following"
ACCESS = "ak_REPLACE_ME"
SECRET = "sk_REPLACE_ME"

payload = json.loads(r'''{"username":"instagram","maxFollowing":100}''')

r = requests.post(
    URL,
    headers={
        "X-Access-Key": ACCESS,
        "X-Secret-Key": SECRET,
        "Content-Type": "application/json",
    },
    json=payload,
)
print(r.text)

GET /api/operations/:id
Beta
Replace ak_REPLACE_ME and sk_REPLACE_ME with your credential values.

import requests

BASE = "https://developer.thehog.ai/api/operations/OPERATION_ID_REPLACE_ME"
ACCESS = "ak_REPLACE_ME"
SECRET = "sk_REPLACE_ME"

r = requests.get(
    BASE,
    headers={
        "X-Access-Key": ACCESS,
        "X-Secret-Key": SECRET,
    },
)
print(r.text)