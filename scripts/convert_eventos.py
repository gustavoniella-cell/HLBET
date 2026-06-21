import json

SRC = "/private/tmp/claude-501/-Users-gustavoniella/d222f8ff-8188-4b61-aba7-feaaf7e10e9a/tasks/wjr36l0yd.output"
DATE = "2026-06-20"
OUT = "/Users/gustavoniella/copa-fantasy/web/src/data/eventos.json"

raw = open(SRC, encoding="utf-8").read()
s, e = raw.find("{"), raw.rfind("}")
env = json.loads(raw[s:e + 1])
games = env.get("result", env).get("games", [])

EVENT_KEYS = ["gols", "assist", "golContra", "penPerd", "penDef", "defesas"]
BOOL_KEYS = ["amarelo", "vermelho", "motm"]

dia = {}
for g in games:
    if not g.get("found"):
        print("SEM DADOS:", g.get("teamA"), "x", g.get("teamB"))
        continue
    a, b = g["teamA"], g["teamB"]
    ga, gb = g["golsA"], g["golsB"]
    for team, gp, gs in [(a, ga, gb), (b, gb, ga)]:
        dia.setdefault(team, {"golsPro": gp, "golsSofridos": gs, "jogadores": {}})
    for p in g["players"]:
        team = p["selecao"]
        if team not in dia:
            # caso o nome da seleção não bata, ainda registra
            dia.setdefault(team, {"golsPro": 0, "golsSofridos": 0, "jogadores": {}})
        ev = {}
        for k in EVENT_KEYS:
            if p.get(k):
                ev[k] = p[k]
        for k in BOOL_KEYS:
            if p.get(k):
                ev[k] = True
        dia[team]["jogadores"][p["nome"]] = ev

out = {DATE: dia}
json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# relatório
for team, te in dia.items():
    nj = len(te["jogadores"])
    ev = sum(1 for x in te["jogadores"].values() if x)
    print(f"{team}: {te['golsPro']}x{te['golsSofridos']} | {nj} jogaram | {ev} com evento")
