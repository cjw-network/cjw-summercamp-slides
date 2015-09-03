#!/bin/sh

# render the presentation from the MD file

cd scripts/md
python render.py
echo "Slides written to presentation-output.html"
cd ../..
echo "Make copy for direct browser view"
cp presentation-output.html index.html

# Hint for apple users they use the render.py scripts with failed modules
#
# sudo easy_install Jinja2
# sudo easy_install markdown
#