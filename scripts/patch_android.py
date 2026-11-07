#!/usr/bin/env python3
"""Run after `npx cap add android`: app icons, a fixed debug signing key and a rising versionCode."""
import os, re, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.join(ROOT, 'android', 'app')
RES = os.path.join(APP, 'src', 'main', 'res')


def fail(msg):
    print('PATCH FAILED: ' + msg, file=sys.stderr)
    sys.exit(1)


if not os.path.isdir(APP):
    fail('android/app not found. Run `npx cap add android` first.')

# icons: drop the adaptive icon definitions so our PNG icons are used
for d in os.listdir(RES):
    if d.startswith('mipmap-anydpi'):
        shutil.rmtree(os.path.join(RES, d))
for fn in ('ic_launcher_foreground.xml', 'ic_launcher_background.xml'):
    for sub in ('drawable', 'drawable-v24', 'values'):
        p = os.path.join(RES, sub, fn)
        if os.path.exists(p):
            os.remove(p)
src_res = os.path.join(ROOT, 'native', 'res')
for d in os.listdir(src_res):
    dest = os.path.join(RES, d)
    os.makedirs(dest, exist_ok=True)
    for fn in os.listdir(os.path.join(src_res, d)):
        shutil.copy(os.path.join(src_res, d, fn), os.path.join(dest, fn))

# signing and version
gr_path = os.path.join(APP, 'build.gradle')
gr = open(gr_path, encoding='utf-8').read()
if 'savings-signing' not in gr:
    block = (
        "android {\n"
        "    // savings-signing\n"
        "    signingConfigs {\n"
        "        debug {\n"
        "            storeFile file('../../native/debug.keystore')\n"
        "            storePassword 'android'\n"
        "            keyAlias 'androiddebugkey'\n"
        "            keyPassword 'android'\n"
        "        }\n"
        "    }\n"
    )
    gr, n = re.subn(r'^android\s*\{\s*\n', block, gr, count=1, flags=re.M)
    if n != 1:
        fail('could not find the android { block in app/build.gradle')
run = os.environ.get('RUN_NUMBER', '1')
run = run if run.isdigit() else '1'
gr, n = re.subn(r'versionCode\s+\d+', 'versionCode ' + run, gr, count=1)
if n != 1:
    fail('could not find versionCode in app/build.gradle')
gr = re.sub(r'versionName\s+"[^"]*"', 'versionName "1.0"', gr, count=1)
open(gr_path, 'w', encoding='utf-8').write(gr)
# AdMob app id in the manifest (from www/ads-config.json)
import json
cfg = json.load(open(os.path.join(ROOT, 'www', 'ads-config.json'), encoding='utf-8'))
mf_path = os.path.join(APP, 'src', 'main', 'AndroidManifest.xml')
mf = open(mf_path, encoding='utf-8').read()
if 'com.google.android.gms.ads.APPLICATION_ID' not in mf:
    meta = '<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="%s"/>\n    </application>' % cfg['appId']
    mf, n = re.subn(r'</application>', meta, mf, count=1)
    if n != 1:
        fail('could not add AdMob id to AndroidManifest.xml')
    open(mf_path, 'w', encoding='utf-8').write(mf)

print('Android project patched. versionCode =', run)
