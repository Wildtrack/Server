git clone https://github.com/Wildtrack/maze.git
cd maze
npm config set spin=false
npm install
npm install esprima
npm install underscore
npm test
cp ../stuff/main.js main.js
node main.js backtrack.js
npm test
cp ../stuff/commentCheck.js commentCheck.js
node commentCheck.js backtrack.js main.js maze.js mazeMenu.js mazeModel.js mazeRender.js trailModel.js
mv ./report.html ../stuff/report.html
mv ./coverage ../stuff/coverage