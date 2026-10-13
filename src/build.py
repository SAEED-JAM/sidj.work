import re
home_css=open("home.css").read()
case_css=open("case.css").read()
extra='''
.eyebrow{display:block;margin-bottom:16px;color:var(--ink-3)}
.plus{position:relative;flex:none;width:26px;height:26px;border-radius:50%;border:1px solid var(--line-2)}
.plus::before,.plus::after{content:"";position:absolute;left:50%;top:50%;width:10px;height:1.5px;background:currentColor;transform:translate(-50%,-50%);transition:transform .4s var(--ease)}
.plus::after{transform:translate(-50%,-50%) rotate(90deg)}
.tags{display:flex;flex-wrap:wrap;gap:8px}
.tag{padding:7px 13px;border-radius:999px;background:var(--bg-2);font-size:14px;color:var(--ink-2)}
.flowline{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.flowline span{padding:8px 12px;border-radius:12px;background:var(--bg-2);font-size:14px;font-weight:550}
.flowline svg{width:15px;height:15px;color:var(--ink-3)}
.case-hero .lede{color:var(--ink-2)}
.sheet-bar .back,.sheet-title{box-shadow:none}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}.rv.pre{transform:none;opacity:1}}
'''
sheet=open("sheet2.html").read()
js=open("script_home.js").read()+open("script_case.js").read()
js=js.replace("t.classList.contains('card') ? t : null","t.classList.contains('work') ? t : null")
lb='''<div class="rsv" id="rsv" hidden role="dialog" aria-label="Résumé"><div class="rsv-bar"><b>Sid Jameson · Résumé</b><div class="rsv-tools"><button id="rsvOut" aria-label="Zoom out"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg></button><span id="rsvZ">100%</span><button id="rsvIn" aria-label="Zoom in"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></button><button id="rsvClose" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div></div><div class="rsv-scroll" id="rsvScroll"><div class="rsv-page" id="rsvPage"><img src="assets/img/resume.webp" alt="Résumé of Sid Jameson" width="1547" height="2190" loading="lazy"><button class="hot copy-mail" aria-label="Copy email" style="left:9.50%;top:9.80%;width:13.59%;height:1.30%"></button><a class="hot" href="https://sidj.work" target="_blank" rel="noopener" aria-label="Portfolio" style="left:24.48%;top:9.80%;width:5.30%;height:1.30%"></a><a class="hot" href="https://www.linkedin.com/in/mirsaeedjamshidi/" target="_blank" rel="noopener" aria-label="LinkedIn" style="left:31.16%;top:9.80%;width:5.13%;height:1.30%"></a><a class="hot" href="https://medium.com/@msaeedjg" target="_blank" rel="noopener" aria-label="Medium" style="left:37.68%;top:9.80%;width:5.19%;height:1.30%"></a></div></div></div><div class="vlb" id="vlb" hidden role="dialog" aria-label="Video"><button class="vlb-close" id="vlbClose" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button><video id="vlbVid" controls playsinline loop muted></video><p id="vlbCap"></p></div><div class="lb" id="lb" hidden><span class="lb-tip">Click image to zoom · Esc to close</span><button class="lb-close" id="lbClose" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button><img class="lb-img" id="lbImg" alt=""><p class="lb-cap" id="lbCap"></p></div>'''
head='''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Sid Jameson</title>
<meta name="description" content="Sid Jameson, AI design engineer at Huma. Case studies from Snappfood, Balad, Graph and more.">
<link rel="canonical" href="https://sidj.work/">
<meta property="og:type" content="website">
<meta property="og:url" content="https://sidj.work/">
<meta property="og:title" content="Sid Jameson · AI Design Engineer">
<meta property="og:description" content="Case studies, experience and writing by Sid Jameson, AI design engineer at Huma.">
<meta property="og:image" content="https://sidj.work/assets/img/cover-promo.webp">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%23111114'/%3E%3Ctext x='32' y='42' font-family='Helvetica,Arial,sans-serif' font-size='26' font-weight='700' fill='%23fff' text-anchor='middle'%3ESJ%3C/text%3E%3C/svg%3E">
<link rel="apple-touch-icon" href="assets/img/portrait.webp">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@300..800&family=Geist+Mono:wght@400;500&display=swap">
<style>
'''
page=head+home_css+case_css+extra+"</style>\n</head>\n<body>\n"+open("home.html").read()+"\n"+sheet+lb+"\n<script>\n"+js+"\n</script>\n</body>\n</html>\n"
open("../index.html","w").write(page)
# optional: page body for a claude.ai artifact (set ARTIFACT_OUT=/path/file.html)
import os
if os.environ.get("ARTIFACT_OUT"):
    art=page
    for pat in [r'<!doctype html>\n',r'<html lang="en">\n',r'<head>\n',r'<meta charset="utf-8">\n',r'<meta name="viewport"[^>]*>\n',r'</head>\n',r'<body>\n',r'</body>\n',r'</html>\n?']:
        art=re.sub(pat,'',art,count=1)
    open(os.environ["ARTIFACT_OUT"],"w").write(art)
print(len(page))
