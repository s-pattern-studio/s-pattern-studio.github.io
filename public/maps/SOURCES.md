# Map data attribution and provenance

Retrieved 2026-10-04 for S. Pattern Studio. Boundaries are simplified geographic references, not a statement of political recognition. City outlines represent administrative areas, not urban built-up footprints.

## Countries and territories

Natural Earth, 1:50m Admin 0 countries (242 features), public domain.
https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-admin-0-countries-2/
https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson

The lightweight room illustration uses Natural Earth 1:110m. The interactive map retains the 1:50m data, including Taiwan, Singapore, Monaco, Vatican, Malta and Liechtenstein. At world scale, small areas require zoom or the country selector.

## City administrative areas

© OpenStreetMap contributors, Open Database License (ODbL) 1.0.
https://www.openstreetmap.org/copyright
https://opendatacommons.org/licenses/odbl/1-0/

Downloaded once through Nominatim, then served locally. No runtime geocoding or tile-service dependency. Queries use polygon_geojson=1, polygon_threshold=0.002 (Shanghai/Suzhou 0.003). The original attributed GeoJSON responses are distributed alongside the derived regions.json, under the same ODbL license.

Cities: Edmonton (Alberta), Shanghai, Suzhou (Jiangsu), Hangzhou, Tianjin, Beijing, Harbin, Taiyuan (Shanxi), Datong (Shanxi), Nanjing. Source relation IDs are retained in regions.json and original files.

## Taiwan counties and cities

© OpenStreetMap contributors; geoBoundaries / Wambacher. ODbL 1.0.
geoBoundaries TWN ADM1, boundaryID TWN-ADM1-90331920, represented year 2017, 22 administrative areas; release commit 9469f09.
https://www.geoboundaries.org/api/current/gbOpen/TWN/ADM1/
https://github.com/wmgeolab/geoBoundaries/tree/9469f09/releaseData/gbOpen/TWN/ADM1

The 2017 source is a historical snapshot and may differ from later coastlines or adjustments. Taiwan counties are selectable; visit status must be supplied by the studio owner. Unconfirmed counties are not marked visited.

## Processing

scripts/build-maps.mjs projects WGS84 polygon rings to Web Mercator, preserving polygon holes with even-odd fill. It retains administrative IDs, labels, bounding boxes, original raw data and license attribution. Rendering precision is rounded to 4 decimals in projected degree units; no invented city borders. regions.json is an ODbL-derived dataset; world.json remains Natural Earth public domain.
