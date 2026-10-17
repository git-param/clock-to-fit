"""Small Chrome DevTools check for the local Clock To Fit preview."""
import base64
import json
import sys
import time
import urllib.request
from pathlib import Path
import websocket

BASE = 'http://127.0.0.1:9222'
URL = 'http://127.0.0.1:8765/index.html'
OUT = Path('/private/tmp')

def call(ws, method, params=None):
    call.counter += 1
    ident = call.counter
    ws.send(json.dumps({'id': ident, 'method': method, 'params': params or {}}))
    while True:
        data = json.loads(ws.recv())
        if data.get('id') == ident:
            if 'error' in data:
                raise RuntimeError(data['error'])
            return data.get('result', {})
call.counter = 0

def evaluate(ws, expression):
    result = call(ws, 'Runtime.evaluate', {'expression': expression, 'returnByValue': True, 'awaitPromise': True})
    if 'exceptionDetails' in result:
        raise RuntimeError(result['exceptionDetails'])
    return result.get('result', {}).get('value')

def run(width, height, name):
    request = urllib.request.Request(BASE + '/json/new?' + URL, method='PUT')
    target = json.load(urllib.request.urlopen(request))
    ws = websocket.create_connection(target['webSocketDebuggerUrl'], timeout=90, origin=BASE)
    call(ws, 'Page.enable')
    call(ws, 'Runtime.enable')
    call(ws, 'Emulation.setDeviceMetricsOverride', {'width': width, 'height': height, 'deviceScaleFactor': 1, 'mobile': width < 600})
    time.sleep(7)
    expression = """(() => {
      const rail = document.querySelector('.word-rail');
      const rect = rail.getBoundingClientRect();
      const start = rect.top + scrollY;
      const travel = rail.offsetHeight - innerHeight;
      const states = [];
      for (const p of [0, .5, 1]) {
        scrollTo({top: start + p * travel, behavior: 'instant'});
        window.dispatchEvent(new Event('scroll'));
        const track = document.querySelector('.word-rail-track');
        states.push({p, transform: track.style.transform, first: document.querySelector('.word-panel-food').getBoundingClientRect().left, last: document.querySelector('.word-panel-time').getBoundingClientRect().left});
      }
      scrollTo({top: 0, behavior: 'instant'}); window.dispatchEvent(new Event('scroll'));
      return { viewport:[innerWidth,innerHeight], ready:document.querySelector('#scene-wrap').classList.contains('scene-ready'), text3d:document.documentElement.classList.contains('text3d'), railHeight:rail.offsetHeight, travel, states, overflow:document.documentElement.scrollWidth-innerWidth, panels:[...document.querySelectorAll('.word-panel')].map(x=>x.getBoundingClientRect().width), menuCards:document.querySelectorAll('.dish-open').length };
    })()"""
    result = evaluate(ws, expression)
    time.sleep(1)
    screenshot = call(ws, 'Page.captureScreenshot', {'format': 'png', 'captureBeyondViewport': False})['data']
    (OUT / f'ctf-{name}.png').write_bytes(base64.b64decode(screenshot))
    if name == 'desktop':
        for choice in ('avocado', 'citrus'):
            evaluate(ws, f"document.querySelector('[data-scene={choice}]').click()")
            time.sleep(1.5)
            selected = call(ws, 'Page.captureScreenshot', {'format':'png', 'captureBeyondViewport':False})['data']
            (OUT / f'ctf-{name}-{choice}.png').write_bytes(base64.b64decode(selected))
            print('selected', choice, evaluate(ws, "[...document.querySelectorAll('[data-scene]')].filter(x=>x.getAttribute('aria-pressed')==='true').map(x=>x.dataset.scene)"))
        evaluate(ws, "document.querySelector('[data-scene=bowl]').click()")
    evaluate(ws, "(() => { const r=document.querySelector('.word-rail'); scrollTo({top:r.getBoundingClientRect().top+scrollY+(r.offsetHeight-innerHeight)/2,behavior:'instant'}); dispatchEvent(new Event('scroll')); return true })()")
    time.sleep(1)
    middle = call(ws, 'Page.captureScreenshot', {'format':'png', 'captureBeyondViewport':False})['data']
    (OUT / f'ctf-{name}-rail.png').write_bytes(base64.b64decode(middle))
    for step, panel_name in ((0, 'food'), (.5, 'mood'), (1, 'time')):
        evaluate(ws, f"(() => {{ const r=document.querySelector('.word-rail'); scrollTo({{top:r.getBoundingClientRect().top+scrollY+{step}*(r.offsetHeight-innerHeight),behavior:'instant'}}); dispatchEvent(new Event('scroll')); return true }})()")
        time.sleep(.5)
        state = evaluate(ws, f"(() => {{ const p=document.querySelector('.word-panel-{panel_name}'); const photo=p.querySelector('img').getBoundingClientRect(); const word=p.querySelector('h2').getBoundingClientRect(); return {{loaded:p.querySelector('img').naturalWidth>0, photo:[photo.left,photo.top,photo.right,photo.bottom], word:[word.left,word.top,word.right,word.bottom], overflow:document.documentElement.scrollWidth-innerWidth}} }})()")
        picture = call(ws, 'Page.captureScreenshot', {'format':'png', 'captureBeyondViewport':False})['data']
        (OUT / f'ctf-{name}-{panel_name}.png').write_bytes(base64.b64decode(picture))
        print(name, panel_name, json.dumps(state))
    print(name, json.dumps(result))
    if name == 'desktop':
        call(ws, 'Emulation.setEmulatedMedia', {'features':[{'name':'prefers-reduced-motion','value':'reduce'}]})
        call(ws, 'Page.reload', {'ignoreCache':False})
        time.sleep(4)
        reduced = evaluate(ws, "(() => { const r=document.querySelector('.word-rail'); const t=document.querySelector('.word-rail-track'); return {static:r.classList.contains('rail-static'), height:r.offsetHeight, panels:[...document.querySelectorAll('.word-panel')].map(x=>x.getBoundingClientRect().top), transform:getComputedStyle(t).transform, motionPaused:document.documentElement.classList.contains('motion-paused')} })()")
        print('reduced-motion', json.dumps(reduced))
        call(ws, 'Emulation.setEmulatedMedia', {'features':[{'name':'prefers-reduced-motion','value':'no-preference'}]})
        call(ws, 'Page.navigate', {'url': (Path(__file__).resolve().parents[1] / 'Clock-To-Fit-Preview.html').as_uri()})
        time.sleep(5)
        standalone = evaluate(ws, "({ready:document.querySelector('#scene-wrap').classList.contains('scene-ready'), text3d:document.documentElement.classList.contains('text3d'), panels:document.querySelectorAll('.word-panel').length, overflow:document.documentElement.scrollWidth-innerWidth})")
        print('standalone-preview', json.dumps(standalone))
    ws.close()
    urllib.request.urlopen(urllib.request.Request(BASE + '/json/close/' + target['id']))

sizes = ((1440,900,'desktop'),) if '--desktop-only' in sys.argv else ((1440,900,'desktop'), (820,1100,'tablet'), (390,844,'phone'))
for width, height, name in sizes:
    run(width,height,name)
