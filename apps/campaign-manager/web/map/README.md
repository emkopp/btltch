# The Inner Sphere 3025 local mirror

This folder is a local mirror of [The Inner Sphere 3025](https://www.gruese.de/innersphere/), a non-profit BattleTech fan project by Christoph Wassermann with data editing and cleanup by Wraith_81.

The original site states that planet names and coordinates came from [Sarna.net](https://www.sarna.net/) and that BattleTech branding and faction sigils came from Harebrained Schemes/community promotional assets. This mirror preserves the site's original disclaimer and About dialog. No affiliation or ownership is implied.

Run from this directory with:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000/`. A local web server is required because the application loads its JSON datasets through browser requests.