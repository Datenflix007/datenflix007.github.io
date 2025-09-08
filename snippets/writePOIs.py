# pseudo_code.py
import json

features = []
for row in rows_from_db:
    features.append({
        "type": "Feature",
        "geometry": {"type":"Point","coordinates":[row["lon"], row["lat"]]},
        "properties": {
            "title": row["name"],
            "description": row["desc"],
            "era": row["era"],          # oder Liste
            "tags": row.get("tags",[])
        }
    })

with open("assets/data/pois.json","w",encoding="utf-8") as f:
    json.dump({"type":"FeatureCollection","features":features}, f, ensure_ascii=False, indent=2)
