import json
import re

print("Loading JSON...")
with open('csgo_data.json', 'r') as f:
    data = json.load(f)
print(f"Loaded {len(data)} items.")

# Storage
categories = {
    'WEAPONS': set(),
    'KNIVES': set(),
    'GLOVES': set(),
    'STICKERS': set(),
    'MUSIC_KITS': set(),
    'GRAFFITI': set(),
    'CONTAINERS': set(),
    'TOOLS': set(),
    'AGENTS': set(),
    'GENERIC_SKINS': set()
}

weapon_skins = {} # Map Weapon -> Set(Skins)

# Regex to parse "Weapon | Skin (Condition)"
# Examples: "AK-47 | Redline (Field-Tested)" -> Match
# "Sticker | Titan (Holo) | Katowice 2014" -> match?
# Stickers are tricky. "Sticker | Name".
# Music Kits: "Music Kit | Name"
name_parser = re.compile(r'^(.*?)\s?\|\s?(.*?)(?:\s\(.*\))?$')

for key, item in data.items():
    name = item.get('market_hash_name', item.get('name', ''))
    if not name: continue
    
    # Check for ignore types
    # Maybe ignore "Souvenir" ? User implies "all.json" has everything.
    # If I include Souvenir, I get duplicates of skins. e.g. "Souvenir AK-47 | Safari Mesh".
    # I should strip "Souvenir " prefix.
    # StatTrak is usually "StatTrak™ AK-47 | ..."
    
    clean_name = name.replace("Souvenir ", "").replace("StatTrak™ ", "").replace("★ ", "")
    
    # Identify Type based on ID prefix or Category
    item_id = item.get('id', '')
    category_id = item.get('category', {}).get('id', '')
    category_name = item.get('category', {}).get('name', '')
    
    # 1. Agents
    if item_id.startswith('agent-') or category_name == 'Agents':
        # "Sir Bloody Miami Darryl | The Professionals" is usually the name
        categories['AGENTS'].add(clean_name)
        continue
        
    # 2. Music Kits
    if item_id.startswith('music_kit-') or clean_name.startswith('Music Kit |'):
        categories['MUSIC_KITS'].add(clean_name)
        continue
        
    # 3. Stickers
    if item_id.startswith('sticker-') or clean_name.startswith('Sticker |'):
        # Extract the part after "Sticker |"
        if clean_name.startswith('Sticker | '):
            sticker_name = clean_name[10:]
            categories['STICKERS'].add(sticker_name)
        else:
             categories['STICKERS'].add(clean_name)
        continue
        
    # 4. Graffiti
    if item_id.startswith('graffiti-') or clean_name.startswith('Graffiti |') or clean_name.startswith('Sealed Graffiti |'):
        categories['GRAFFITI'].add(clean_name)
        continue
        
    # 5. Containers (Cases, Capsules, Packages)
    if item_id.startswith('crate-') or category_name in ['Container', 'Case', 'Gift']:
        # Exclude "Key" if it appears as tool?
        categories['CONTAINERS'].add(clean_name)
        continue

    # 6. Tools
    if item_id.startswith('tool-') or category_name == 'Tool':
        categories['TOOLS'].add(clean_name)
        continue
        
    # 7. Gloves
    if category_name == 'Gloves' or item_id.startswith('glove-'):
        # Format: "Sport Gloves | Vice (Factory New)"
        match = name_parser.match(clean_name)
        if match:
            glove_type = match.group(1).strip()
            skin = match.group(2).strip()
            categories['GLOVES'].add(glove_type)
            categories['GENERIC_SKINS'].add(skin)
        else:
            categories['GLOVES'].add(clean_name)
        continue
        
    # 8. Knives
    if category_name == 'Knives' or 'knife' in item_id:
        # Format: "Karambit | Fade (Factory New)"
        match = name_parser.match(clean_name)
        if match:
            knife_type = match.group(1).strip()
            skin = match.group(2).strip()
            categories['KNIVES'].add(knife_type)
            categories['GENERIC_SKINS'].add(skin)
        else:
            # Vanilla
            categories['KNIVES'].add(clean_name)
        continue
    
    # 9. Weapons
    # Check if it has a skin pattern
    match = name_parser.match(clean_name)
    if match:
        weapon = match.group(1).strip()
        skin = match.group(2).strip()
        
        # Add to Weapons list
        categories['WEAPONS'].add(weapon)
        
        # Add to Specific Skins
        if weapon not in weapon_skins:
            weapon_skins[weapon] = set()
        weapon_skins[weapon].add(skin)
        
        # Add to Generic Skins
        categories['GENERIC_SKINS'].add(skin)
    else:
        # Maybe vanilla weapon?
        # categories['WEAPONS'].add(clean_name)
        pass

# Post-Process:
# Remove 'Sticker' from STICKERS set if somehow "Sticker | Name" was added fully?
# Filter out weird stuff.

print("Processing complete. Generating data.js content...")

# Helper
def format_list(name, s):
    l = sorted(list(s))
    return f"const {name} = [\n" + ",\n".join([f"    {json.dumps(i)}" for i in l]) + "\n].sort();\n\n"

output = ""
output += "const CATEGORIES = {\n    weapon: 'Weapon Skin',\n    knife: 'Knife / Gloves',\n    sticker: 'Sticker',\n    music: 'Music Kit',\n    graffiti: 'Graffiti',\n    container: 'Case / Capsule',\n    tool: 'Tool / Tag',\n    agent: 'Agent'\n};\n\n"
output += "const CONDITIONS = [\n    \"Factory New\",\n    \"Minimal Wear\",\n    \"Field-Tested\",\n    \"Well-Worn\",\n    \"Battle-Scarred\"\n];\n\n"

output += format_list("WEAPONS", categories['WEAPONS'])
output += format_list("KNIVES", categories['KNIVES'])
output += format_list("GLOVES", categories['GLOVES'])
output += format_list("STICKERS", categories['STICKERS'])
output += format_list("MUSIC_KITS", categories['MUSIC_KITS'])
output += format_list("GRAFFITI", categories['GRAFFITI'])
output += format_list("CONTAINERS", categories['CONTAINERS'])
output += format_list("TOOLS", categories['TOOLS'])
output += format_list("AGENTS", categories['AGENTS'])

output += "const WEAPON_SKINS = {\n"
sorted_weapons = sorted(weapon_skins.keys())
for w in sorted_weapons:
    skins = sorted(list(weapon_skins[w]))
    output += f"    {json.dumps(w)}: {json.dumps(skins)},\n"
output = output.rstrip(',\n') + "\n};\n\n"

output += format_list("GENERIC_SKINS", categories['GENERIC_SKINS'])

with open('../data.js', 'w') as f:
    f.write(output)

print("data.js written to parent directory!")
