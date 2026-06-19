import json, unicodedata

SRC = '/private/tmp/claude-501/-Users-gustavoniella/d222f8ff-8188-4b61-aba7-feaaf7e10e9a/tasks/wsjrj57c8.output'
raw = open(SRC, encoding='utf-8').read()
s, e = raw.find('{'), raw.rfind('}')
env = json.loads(raw[s:e + 1])
res = env.get('result', env)
teams = res.get('teams', [])
print('seleções reavaliadas:', len(teams))


def norm(x):
    x = unicodedata.normalize('NFKD', x).encode('ascii', 'ignore').decode().lower().strip()
    return ' '.join(x.split())


rate, surn, extra = {}, {}, {}
for t in teams:
    nm = t['name']
    rate[nm], surn[nm] = {}, {}
    for p in t.get('players', []):
        n = norm(p['nome'])
        rate[nm][n] = p['nota']
        toks = n.split()
        if toks:
            surn[nm].setdefault(toks[-1], p['nota'])
    extra[nm] = t.get('missingStars', []) or []

data = json.load(open('src/data/copa_data.json', encoding='utf-8'))
matched = unm = 0
unmatched = []
for p in data['jogadores']:
    sel = p['selecao']
    n = norm(p['nome'])
    if sel in rate and n in rate[sel]:
        p['nota'] = rate[sel][n]; matched += 1
    elif sel in surn and n.split() and n.split()[-1] in surn[sel]:
        p['nota'] = surn[sel][n.split()[-1]]; matched += 1
    else:
        unm += 1; unmatched.append((sel, p['nome']))

existing = {(p['selecao'], norm(p['nome'])) for p in data['jogadores']}
added = 0
for nm, stars in extra.items():
    for st in stars:
        k = (nm, norm(st['nome']))
        if k not in existing:
            data['jogadores'].append({'nome': st['nome'], 'selecao': nm, 'posicao': st['posicao'],
                                      'numero': None, 'clube': None, 'idade': None,
                                      'nota': st['nota'], 'confianca': 'reavaliado', 'obs': 'craque adicionado'})
            existing.add(k); added += 1

json.dump(data, open('src/data/copa_data.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

from collections import Counter
notas = Counter(round(p['nota'], 1) for p in data['jogadores'])
print(f'casados: {matched} | não-casados (mantiveram nota antiga): {unm} | craques adicionados: {added}')
print('nova distribuição de notas:', dict(sorted(notas.items())))
print('amostra não-casados:', unmatched[:12])
for nome in ['Lionel Messi', 'Cristiano Ronaldo', 'Rashford', 'Chris Wood', 'Mbapp', 'Haaland', 'Vinícius']:
    f = [(p['nome'], p['selecao'], p['nota']) for p in data['jogadores'] if nome.lower() in p['nome'].lower()]
    print(nome, '->', f[:2])
