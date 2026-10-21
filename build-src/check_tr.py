import sys,glob,re,os
D=os.path.join(os.path.dirname(os.path.abspath(__file__)),'i18n')
cat={}
for l in open(os.path.join(D,'catalog.txt'),encoding='utf-8'):
    if '|||' in l and not l.startswith('#'):
        k,v=l.rstrip('\n').split('|||',1);cat[k]=v
for f in sorted(glob.glob(os.path.join(D,'[a-z][a-z]-*.txt'))):
    bad=[]
    for n,l in enumerate(open(f,encoding='utf-8'),1):
        l=l.rstrip('\n')
        if not l or l.startswith('#'):continue
        k,_,v=l.partition('|||')
        if k not in cat: bad.append((n,'unknown id',l[:40]));continue
        if not v.strip(): bad.append((n,'empty',k));continue
        en=cat[k]
        for ph in re.findall(r'\{\d\}',en):
            if ph not in v: bad.append((n,'missing '+ph,k))
        for t in re.findall(r'<(/?\w+)',en):
            if en.count('<'+t)!=v.count('<'+t): bad.append((n,'tag '+t,k));break
    print(f.split('/')[-1],'issues:',bad[:12])
