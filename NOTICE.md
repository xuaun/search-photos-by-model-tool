# Attributions

## Original tool
This project is based on **search-photos-by-model-tool** by **x6ud**
(MIT License) — https://github.com/x6ud/search-photos-by-model-tool

## Face images
The human reference photos under `static/human-photos/` are derived from the
**FairFace** dataset, licensed under **Creative Commons Attribution 4.0
International (CC BY 4.0)**.

- FairFace: Kärkkäinen, K. and Joo, J. "FairFace: Face Attribute Dataset for
  Balanced Race, Gender, and Age." (https://github.com/joojunfff/fairface)
- The underlying photographs originate from the YFCC-100M dataset (Flickr,
  Creative Commons licensed).

Head-pose angles and crops are computed with **MediaPipe Face Landmarker**
(Apache 2.0) by the script in `tools/fairface/`.

### Note on likeness
CC BY covers the photographers' copyright, **not** the personality/likeness
rights of the people depicted. These images are included for art-reference /
educational use.
