function initMatrix(m, n) {
  var tmp =  [];
  for(var i = 0; i < m; i ++) {
    tmp.push(Array(n));
  }
  for(var i = 0; i < m; i ++) {
    for(var j = 0; j < n; j ++) {
      tmp[i][j] = "1";
    }
  }
  return tmp;
}

var level = (function() {
  var mat = initMatrix(10,16);
  for(var i = 0; i < 10; i ++) {
    mat[i][i] = "2";
    mat[i][i+6] = "3";
    mat[9-i][i+1] = "2";
  }
  return mat;
})();

var height = level.length, width = level[0].length;

var table, rows = [], cells = [];

var currentColor = "1", colorIndicator;

function init() {
  table = document.createElement("table");
  document.body.appendChild(table);
  for(var i = 0; i < height; i ++) {
    var tr = document.createElement("tr");
    table.appendChild(tr);
    rows.push(tr);
  }

  for(var i = 0; i < height; i ++) {
    cells.push([]);
    for(var j = 0; j < width; j ++) {
      var td = document.createElement("td");
      td.className = "cell cell-" + level[i][j];
      td.onclick = (function(i, j){
        return function() { fill(i, j, currentColor); }
      })(i, j);
      rows[i].appendChild(td);
      cells[i].push(td);
    }
  }

  colorIndicator = document.createElement("div");
  colorIndicator.className = "cell cell-" + currentColor;
  document.body.appendChild(colorIndicator);
}

function fill(i, j, c) {
  if(i < 0 || i >= height || j < 0 || j >= width) return;
  var oldColor = level[i][j];
  if(oldColor == c) return;
  level[i][j] = c;
  cells[i][j].className = "cell cell-" + c;
  if(i < height - 1 && level[i+1][j] == oldColor) fill(i+1, j, c);
  if(i > 0          && level[i-1][j] == oldColor) fill(i-1, j, c);
  if(j < width - 1  && level[i][j+1]== oldColor) fill(i, j+1, c);
  if(j > 0          && level[i][j-1] == oldColor) fill(i, j-1, c);
}

window.onkeypress = function(event) {
  if("1234".contains(event.key)) {
    currentColor = event.key;
    colorIndicator.className = "cell cell-" + currentColor;
  }
};

window.onload = init;
