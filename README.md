# x6ud.github.io

> Stack (v2): Vue 3 + ant-design-vue 4 + vue-router 4 + Three.js, built with Vite
> and TypeScript. Requires Node 18+.

## Project setup
```
npm install
```

## Development
```
npm run serve   # or: npm run dev  (Vite dev server on :8080, includes the editor API)
```

## Compiles and minifies for production
```
npm run build   # type-checks with vue-tsc, then builds with Vite into dist/
```

## Adding photos
1. Apply for a Flickr API key [here](https://www.flickr.com/services/apps/create/apply/).

2. Run the project with `npm run serve`.

3. Open `/#/editor`, paste your API key into the textbox requesting it.

## Adding models
1. Put the .obj file into `static/models`. It's better to keep files within 1MB. I use Blender and MeshLab to reduce the models.

2. Add model url and author link to `src/models.ts`.

## Human references (this fork)

This fork adds a **human head** reference mode on top of the original animal
tool. The search math (orienting a 3D model and matching photos by quaternion
distance) is unchanged — humans are just another tag.

### Facet filters
Beyond the species tag, human photos can be filtered by **ethnicity / sex /
age**. The available options live in `src/facets.ts` (edit them to fit your
dataset). Each photo carries these as optional fields in its
`src/data/*.json` record:

```json
{ "rx": 8, "ry": 24, "rz": -3, "url": "...", "cx": 0, "cy": 0, "cs": 1024,
  "w": 1024, "h": 1024, "tags": ["human"],
  "ethnicity": "East Asian", "sex": "female", "age": "adult" }
```

These labels are **catalog metadata** — self-identified or source-declared,
never inferred from the image.

### Auto-annotating head pose
Instead of aligning the 3D model over each photo by hand, `tools/annotate_pose.py`
estimates `rx/ry/rz` and the crop automatically with MediaPipe + OpenCV. See
[tools/README.md](tools/README.md).
