# split_data.py
import os, shutil, random

SRC_ROOT  = "data/images"          
TRAIN_DIR = os.path.join(SRC_ROOT, "train")
VAL_DIR   = os.path.join(SRC_ROOT, "val")
VAL_FRAC  = 0.2
SEED      = 42

# 1) Make sure train/ and val/ exist
for d in (TRAIN_DIR, VAL_DIR):
    os.makedirs(d, exist_ok=True)

random.seed(SEED)

# 2) Split each class subfolder
for cls in os.listdir(SRC_ROOT):
    if cls in ("train", "val"):
        continue
    src = os.path.join(SRC_ROOT, cls)
    if not os.path.isdir(src):
        continue

    imgs = [f for f in os.listdir(src)
            if f.lower().endswith((".jpg","jpeg","png","bmp","gif"))]
    random.shuffle(imgs)

    n_val = int(len(imgs) * VAL_FRAC)
    val_imgs   = imgs[:n_val]
    train_imgs = imgs[n_val:]

    for base, subset in ((TRAIN_DIR, train_imgs), (VAL_DIR, val_imgs)):
        tgt_dir = os.path.join(base, cls)
        os.makedirs(tgt_dir, exist_ok=True)
        for fn in subset:
            shutil.copy(os.path.join(src, fn),
                        os.path.join(tgt_dir, fn))
    print(f"{cls}: {len(train_imgs)} train, {len(val_imgs)} val")

print("Finished splitting into train/ and val/ subfolders.")
