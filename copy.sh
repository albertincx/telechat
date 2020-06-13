#find ./ -maxdepth 1 -type f -name '*.js' -exec mv {} ./public/apps/ \;
#find ./ -maxdepth 1 -type f -name '*.html' -exec mv {} ./public/apps/ \;
#find ./ -maxdepth 1 -type f -name '*.txt' -exec mv {} ./public/apps/ \;
#mv ./public/apps/ii.html ./public/apps/index.html
cp ./build.txt ./build.tar.gz
tar -C ./public/apps -xzvf ./build.tar.gz