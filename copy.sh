find ./ -maxdepth 1 -type f -name '*.js' -exec mv {} ./public/apps/ \;
find ./ -maxdepth 1 -type f -name '*.html' -exec mv {} ./public/apps/ \;
find ./ -maxdepth 1 -type f -name '*.txt' -exec mv {} ./public/apps/ \;