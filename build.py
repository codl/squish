#!/usr/bin/python
import os
import glob
import hashlib
import json

os.makedirs('out', exist_ok=True)

assets = glob.iglob('src/**/*', recursive=True)
assetmap = {}
for asset in assets:
    asset = asset[4:]  # strip 'src/'
    if not asset == 'serviceworker.js':
        with open('src/'+asset, 'rb') as f:
            contents = f.read()
            digest = hashlib.sha256(contents).hexdigest()
            digest = digest[:16]
            assetmap[asset] = digest
            with open('out/'+asset, 'wb') as fout:
                fout.write(contents)

js_assetmap = 'const HASHES = {};\n'.format(json.dumps(assetmap))

with open('src/serviceworker.js', 'r') as swi:
    with open('out/serviceworker.js', 'w') as swo:
        swo.write(js_assetmap)
        swo.write(swi.read())

print('yes')
