# Real-terrain reference data for Breakaway

## Approved sources

1. **USGS 3DEP elevation models (United States)** — public domain; no use restrictions. Primary source for elevation sampling, including 10 m 1/3-arc-second DEMs and locally available 1 m products. https://www.usgs.gov/3d-elevation-program
2. **OpenStreetMap road/trail geometries** — ODbL, permitted for commercial use with attribution and applicable derivative-database share-alike obligations. https://www.openstreetmap.org/copyright
3. **Rider-provided GPX/TCX with explicit permission for statistical analysis** — use only if the uploader owns or has rights to grant analysis rights. Do not assume public Strava visibility implies permission.

## Collection workflow

- Select diverse cycling road and trail samples using OSM geometries, excluding unsuitable ways (motorways, private access, non-cyclable tracks).
- Sample ground elevations from USGS 3DEP at 10–30 m intervals. Record the DEM source, geographic area, license and OSM attribution with every sample.
- Apply robust elevation filtering to reduce GPS/DEM artifacts, but preserve genuine 50–500 m changes in gradient.
- Extract empirical distributions of climb lengths, descent lengths, grades, grade changes, false-flat frequencies and rolling terrain by terrain category.
- Split regions into training/reference and holdout evaluation sets. Compare generated versus held-out routes before deploying model coefficients.
- Keep raw OSM-derived geometry and any derivative databases separate from proprietary code; comply with ODbL attribution and share-alike requirements.

## Important

The currently deployed generator is **procedural** and has **not** been trained on 1,000 real routes. Do not describe it as trained until a licensed corpus is collected, processed, and validated. Do not scrape Strava or republish riders' private GPS tracks.

## First milestone

Collect 1,000 geographically varied, licensed OSM road/trail segments with 3DEP elevation samples. Produce aggregate statistics (not rider traces), validation plots and a versioned JSON terrain-parameter set before replacing the procedural terrain model.

## Calibration implementation (added October 2026)

The executable pipeline is at `scripts/calibrate_terrain.py`. It is **not yet a collected dataset**.

1. Obtain an Oregon OpenStreetMap extract from https://download.geofabrik.de/north-america/us/oregon.html (ODbL). Convert selected rideable highway/track geometries to a GeoJSON FeatureCollection with LineString geometries; exclude private/inaccessible routes and preserve OSM attribution.
2. Download an overlapping USGS 3DEP GeoTIFF using https://apps.nationalmap.gov/downloader/ (public domain). The GeoTIFF and GeoJSON must cover the same area.
3. Install dependencies: `python -m pip install numpy rasterio`.
4. Run: `python scripts/calibrate_terrain.py --roads data/roads.geojson --dem data/3dep.tif --samples 1000 --out public/terrain-calibration.json`.
5. Check `sample_count`. The tool explicitly warns if fewer than 1,000 valid segments are available. Do not deploy model coefficients until samples are independently reviewed, geographically stratified, and compared against held-out routes.

**Limitations:** This initial pipeline measures *road/trail segments*, not complete cyclist-recorded routes. It does not yet automatically download or convert OSM extracts or DEMs, and it does not automatically update the generator. USGS elevations are ground DEM measurements, not GPS recordings; bridges and tunnels require special handling. Never claim a 1,000-route-trained model from this script alone.
