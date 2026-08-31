# Laboratory 3D Models

Place legally downloaded GLB/GLTF assets here, then set `LAB_USE_PROXY_MODELS = false` in
`src/components/laboratory/sceneConfig.ts`.

## Core bioprocessing (original brief)

| File | Reference | Component |
|------|-----------|-----------|
| `bioreactor-main.glb` | [Sketchfab Bioreactor](https://sketchfab.com/3d-models/bioreactor-653399916c7f435cab2534e8259f3d65) | Main bioreactor |
| `bioreactor-secondary.glb` | [Sketchfab Bioreactor 2](https://sketchfab.com/3d-models/bioreactor-b4e7010eef1645a4b4bfbc2793e5e902) | Secondary vessel |
| `single-use-mixer.glb` | [Sketchfab Single-Use Mixer](https://sketchfab.com/3d-models/single-use-mixer-2e9f708bad834b0097d607c20a71386e) | Mixer |
| `microscope.glb` | [Sketchfab Trinocular Microscope](https://sketchfab.com/3d-models/trinocular-microscope-laboratory-pbr-5c19d49d66994f989173292b80513ed9) | Microscope |
| `lab-cabinet.glb` | [Sketchfab Lab Cabinet](https://sketchfab.com/3d-models/laboratory-cabinet-storage-pbr-low-poly-free-6c5d3bde09dd4f55ad973d8429441190) | Storage |

## Additional equipment

| File | Reference | Component |
|------|-----------|-----------|
| `centrifuge.glb` | [Sketchfab Lab Centrifuge (CC Attribution)](https://sketchfab.com/3d-models/lab-centrifugi-567c68237e5242139edd87455b730b02) | Centrifuge |
| `fume-hood.glb` | [Meshy Fume Hood (CC0)](https://www.meshy.ai/3d-models/Laboratory-Fume-Hood-0195df7b-c832-7728-98ff-221e81460f12) | Fume hood |
| `chromatography.glb` | [Sketchfab Lab Equipment](https://sketchfab.com/3d-models/lab-equipment-39146b8982bf41ee9b054adb466225b2) | HPLC rack |
| `autoclave.glb` | Reference: educational lab GLB naming (`autoclave.glb`) | Autoclave |
| `incubator.glb` | Reference: educational lab GLB naming (`incubadora.glb`) | CO₂ incubator |

## Notes

- Do **not** embed Sketchfab iframes in the production scene.
- Do **not** bypass download restrictions — only use assets you are licensed to use.
- Until GLBs are added, proxy geometry is rendered automatically.

## Layout

Equipment positions and inspector walkways are defined in `src/components/laboratory/labLayout.ts`.

Floor size: **36 × 26 m** (expanded R&D hall).
