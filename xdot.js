/*jshint browser:true, jquery:true */
(function(root) {

// Lexer tokens.
var EOF = -1,
    SKIP = -2,

    ID = 0,
    STR_ID = 1,
    HTML_ID = 2,
    EDGE_OP = 3,

    LSQUARE = 4,
    RSQUARE = 5,
    LCURLY = 6,
    RCURLY = 7,
    COMMA = 8,
    COLON = 9,
    SEMI = 10,
    EQUAL = 11,
    PLUS = 12,

    STRICT = 13,
    GRAPH = 14,
    DIGRAPH = 15,
    NODE = 16,
    EDGE = 17,
    SUBGRAPH = 18;
  
var Color = function(r, g, b, a) {
  this.r = r || 0.0;
  this.g = g || 0.0;
  this.b = b || 0.0;
  this.a = a || 1.0;
  
  this.toHex = function() {
    var intToHex = function(i) {
      var h = i.toString(16);
      return h.length === 2 ? h : '0' + h;
    };

    return '#' + intToHex(r) + intToHex(g) + intToHex(b);
  };

  this.toString = function() {
    return this.toHex();
  };
};

// Store pen attributes.
var Pen = function() {
  // set default attributes
  this.color = new Color();
  this.fillcolor = new Color();
  this.linewidth = 1.0;
  this.fontsize = 14.0;
  this.fontname = "Times-Roman";
  this.dash = [];

  this.copy = function() {
    return jQuery.extend(true, {}, this);
  };

  this.highlighted = function() {
    var pen = this.copy();
    pen.color = new Color(255, 0, 0, 1.0);
    pen.fillcolor = new Color(255, 205, 205, 1.0);
    return pen;
  };
};

// Abstract base class for all the drawing shapes.
var Shape = function() {
  // Draw this shape with the given cairo context.
  this.draw = function() {};

  this.select_pen = function(highlight) {
    if (highlight) {
      if (!('highlight_pen' in this)) {
        this.highlight_pen = this.pen.highlighted();
      }
      return this.highlight_pen;
    }
    else {
      return this.pen;
    }
  };
};

var TextShape = function(pen, x, y, j, w, t) {
  Shape.apply(this);

  this.pen = pen.copy();
  this.x = x;
  this.y = y;
  this.j = j;
  this.w = w;
  this.t = t;

  this.draw = function(paper) {
    var attr = {};
    
    paper.text(this.x, this.y, this.t).attr({
      'font-family': this.pen.fontname,
      'font-size': this.pen.fontsize,
      'text-anchor': this.j === -1 ? 'start' : (this.j === 0 ? 'middle' : 'end'),
    });
  };
};

var ImageShape = function(pen, x0, y0, w, h, path) {
  Shape.apply(this);

  this.pen = pen.copy();
  this.x0 = x0;
  this.y0 = y0;
  this.w = w;
  this.h = h;
  this.path = path;
};

var EllipseShape = function(pen, x0, y0, w, h, filled) {
  Shape.apply(this);

  this.pen = pen.copy();
  this.x0 = x0;
  this.y0 = y0;
  this.w = w;
  this.h = h;
  this.filled = filled;

  this.draw = function(paper) {
    var attr = {
      stroke: this.pen.color.toHex(),
    };
    
    if (this.filled) {
      attr.fill = this.pen.fillcolor.toHex();
      attr["fill-opacity"] = this.pen.fillcolor.a;
    }

    paper.ellipse(x0, y0, w, h).attr(attr);
  };

};

var PolygonShape = function(pen, points, filled) {
  Shape.apply(this);

  this.pen = pen.copy();
  this.points = points;
  this.filled = filled;
  
  this.draw = function(paper) {
    var path = this.points.map(function(value, index, points){
      return value.join(',');
    }).join('L');
    
    path = 'M' + path + 'Z';
    
    var attr = {
      stroke: this.pen.color.toHex(),
    };
    
    if (this.filled) {
      attr.fill = this.pen.fillcolor.toHex();
      attr["fill-opacity"] = this.pen.fillcolor.a;
    }

    paper.path(path).attr(attr);
  };
};

var LineShape = function(pen, points) {
  Shape.apply(this);

  this.pen = pen.copy();
  this.points = points;

  this.draw = function(paper) {
    var path = 'M' + this.points.shift().join(',');
    path += 'L' + this.points.map(function(value, index, points){
      return value.join(',');
    }).join(' ');

    var attr = {
      stroke: this.pen.color.toHex(),
    };

    paper.path(path).attr(attr);
  };

};

var BezierShape = function(pen, points, filled) {
  PolygonShape.apply(this, arguments);

  this.draw = function(paper) {
    var path = 'M' + this.points.shift().join(',');
    path += 'C' + this.points.map(function(value, index, points){
      return value.join(',');
    }).join(' ');

    var attr = {
      stroke: this.pen.color.toHex(),
    };

    if (this.filled) {
      path += 'Z';
      attr.fill = this.pen.fillcolor.toHex();
      attr["fill-opacity"] = this.pen.fillcolor.a;
    }
    
    paper.path(path).attr(attr);
  };
};

var CompoundShape = function(shapes) {
  Shape.apply(this);

  this.shapes = shapes;

  this.draw = function(paper, highlight) {
    for (var i=0; i < this.shapes.length; i++) {
      var shape = this.shapes[i];
      shape.draw(paper, highlight);
    }
  };
};

var Node = function(id, x, y, w, h, shapes, url) {
  CompoundShape.apply(this, [shapes]);

  this.id = id;
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.url = url;

  this.draw = function(paper) {
    paper.setStart();
    for (var i=0; i<shapes.length; i++) {
      shapes[i].draw(paper);
    }
    var set = paper.setFinish();    
  };

};

var Edge = function(src, dst, points, shapes) {
  CompoundShape.apply(this, [shapes]);

  this.src = src;
  this.dst = dst;
  this.points = points;
};

var Graph = function(w, h, shapes, nodes, edges) {
  Shape.apply(this);
  
  this.width = w;
  this.height = h;
  this.shapes = shapes;
  this.nodes = nodes;
  this.edges = edges;
  
  this.draw = function(paper, highlight) {
    var i;
    for (i = 0; i < this.shapes.length; i++) {
      this.shapes[i].draw(paper);
    }
    for (i = 0; i < this.edges.length; i++) {
      this.edges[i].draw(paper);
    }
    for (i = 0; i < this.nodes.length; i++) {
      this.nodes[i].draw(paper);
    }
    return this;
  };
};


var ParseError = function(msg, line, col) {
  this.msg = msg;
  this.line = line;
  this.col = col;

  console.trace();

  this.toString = function() {
    return this.line + ':' + this.col + ':' + this.msg;
  };
};

var Token = function(type, text, line, col) {
  this.type = type;
  this.text = text;
  this.line = line;
  this.col = col;
};

var DotScanner = function() {
  // token regular expression table
  this.tokens = [
      // whitespace and comments
      [SKIP,
          // whitespace
          '[ \\t\\f\\r\\n\\v]+|' +
          // // ... comments
          '\\/\\/[^\\r\\n]*|' +
          // /* ... */ comments
          '\\/\\*.*?\\*\\/|' +
          // # ... comments
          '#[^\\r\\n]*',
      false],
      // Alphanumeric IDs
      [ID, '[a-zA-Z_\\x80-\\xff][a-zA-Z0-9_\\x80-\\xff]*', true],
      // Numeric IDs
      [ID, '-?(?:\\.[0-9]+|[0-9]+(?:\\.[0-9]*)?)', false],
      // String IDs
      [STR_ID, '"[^"\\\\]*(?:\\\\.[^"\\\\]*)*"', false],
      // HTML IDs
      [HTML_ID, '<[^<>]*(?:<[^<>]*>[^<>]*)*>', false],
      // Edge operators
      [EDGE_OP, '-[>-]', true]
  ];

  // symbol table
  this.symbols = {
      '[': LSQUARE,
      ']': RSQUARE,
      '{': LCURLY,
      '}': RCURLY,
      ',': COMMA,
      ':': COLON,
      ';': SEMI,
      '=': EQUAL,
      '+': PLUS
  };

  // literal table
  this.literals = {
      'strict': STRICT,
      'graph': GRAPH,
      'digraph': DIGRAPH,
      'node': NODE,
      'edge': EDGE,
      'subgraph': SUBGRAPH
  };

  this.ignorecase = true;

  var flags = (this.ignorecase) ? 'gi' : 'g';

  var tokens_re_array = [], type, regexp, test_lit;
  jQuery.each(this.tokens, function(i, token) {
    regexp = token[1];
    tokens_re_array.push('(' + regexp + ')');
  });
  this.tokens_re = new RegExp(tokens_re_array.join('|'), flags);
};

DotScanner.prototype.next = function(buf, pos) {
  var text, type;

  if (pos >= buf.length) {
    return [EOF, '', pos];
  }

  // Using the 'g' flag, so this should resume from the lastIndex position.
  this.tokens_re.lastIndex = pos;
  var mo = this.tokens_re.exec(buf);
  if (mo.index == pos) {
    text = mo[0];
    pos = mo.index + text.length;
    for (var i = 1; i < mo.length; i++) {
      if (mo[i] == text) {
        break;
      }
    }
    var token = this.tokens[i-1];
    type = token[0];
    test_lit = token[2];
    if (test_lit) {
      type = this.literals[text] || type;
    }
    return [type, text, pos];
  }
  else {
    var c = buf[pos];
    type = this.symbols[c];
    text = c;
    pos = pos + 1;

    return [type, text, pos];
  }
};


var DotLexer = function(buf, pos) {
  this.newline_re = /\r\n?|\n/g;

  this.buf = buf;
  this.pos = pos;
  this.line = 1;
  this.col = 1;

  this.scanner = new DotScanner();
};

DotLexer.prototype.next = function() {
  var pos = this.pos,
    line = this.line,
    col = this.col,
    type, text, endpos, token;

  while (true) {
    // save state
    pos = this.pos;
    line = this.line;
    col = this.col;

    token = this.scanner.next(this.buf, pos);
    type = token[0];
    text = token[1];
    endpos = token[2];
    // assert(pos + text.length == endpos);
    this.consume(text);

    var filter_results = this.filter(type, text);
    type = filter_results[0];
    text = filter_results[1];

    this.pos = endpos;

    if (type == SKIP) {
      continue;
    }
    else if (type === undefined) {
      throw new ParseError("unexpected char " + text + "(" + escape(text) + ")", line, col);
    }
    else {
      break;
    }
  }
  return new Token(type, text, line, col);
};

DotLexer.prototype.consume = function(text) {
  // update line number
  var pos = 0;
  var mo;
  while ((mo = this.newline_re.exec(text))) {
    this.line += 1;
    this.col = 1;
    pos = mo.index + mo[0].length;
  }

  // update column number
  while (true) {
    var tabpos = text.indexOf("\t", pos);
    if (tabpos == -1) {
      break;
    }
    this.col += tabpos - pos;
    this.col = (this.col - 1);
    pos = tabpos + 1;
  }
  this.col += text.length - pos;
};

DotLexer.prototype.filter = function(type, text) {
  if (type == STR_ID) {
    text = text.substring(1, text.length - 1);

    // line continuations
    text = text.replace('\\\r\n', '');
    text = text.replace('\\\r', '');
    text = text.replace('\\\n', '');

    // quotes
    text = text.replace('\\"', '"');

    type = ID;
  }
  else if (type == HTML_ID) {
    text = text.substring(1, text.length - 1);
    type = ID;
  }
  return [type, text];
};

var XDotParser = function(xdotcode) {
  // Normalize line-endings to make it easier to parse
  xdotcode = xdotcode.replace(/\r\n/g, '\n');
  xdotcode = xdotcode.replace(/\\\n/g, '');
  
  this.lexer = new DotLexer(xdotcode, 0);
  this.lookahead = this.lexer.next();

  this.graph_attrs = {};
  this.node_attrs = {};
  this.edge_attrs = {};

  this.match = function(type) {
    if (this.lookahead.type != type) {
      throw new ParseError("unexpected token " + this.lookahead.text, this.lookahead.line, this.lookahead.col);
    }
  };

  this.skip = function(type) {
    while (this.lookahead.type != type) {
      this.consume();
    }
  };

  this.consume = function() {
    var token = this.lookahead;
    this.lookahead = this.lexer.next();
    return token;
  };

  this.nodes = [];
  this.edges = [];
  this.shapes = [];
  this.node_by_name = {};
  this.top_graph = true;
};


XDotParser.prototype.parse = function() {
  this.parse_graph();
  this.match(EOF);
  return new Graph(this.width, this.height, this.shapes, this.nodes, this.edges);
};

XDotParser.prototype.parse_graph = function() {
  if (this.lookahead.type == STRICT) {
    this.consume();
  }
  this.skip(LCURLY);
  this.consume();
  while (this.lookahead.type != RCURLY) {
    this.parse_stmt();
  }
  this.consume();
};

XDotParser.prototype.parse_subgraph = function() {
  var id;
  if (this.lookahead.type == SUBGRAPH) {
    this.consume();
    if (this.lookahead.type == ID) {
      id = this.lookahead.text;
      this.consume();
    }
  }

  if (this.lookahead.type == LCURLY) {
    this.consume();
    while (this.lookahead.type != RCURLY) {
      this.parse_stmt();
    }
    this.consume();
  }

  return id;
};

XDotParser.prototype.parse_stmt = function() {
  var attr, attrs;
  switch (this.lookahead.type) {
    case GRAPH:
      this.consume();
      attrs = this.parse_attrs();
      jQuery.extend(this.graph_attrs, attrs);
      this.handle_graph(attrs);
      break;
    case NODE:
      this.consume();
      jQuery.extend(this.node_attrs, this.parse_attrs());
      break;
    case EDGE:
      this.consume();
      jQuery.extend(this.edge_attrs, this.parse_attrs());
      break;
    case SUBGRAPH:
    case LCURLY:
      this.parse_subgraph();
      break;
    default:
      var id = this.parse_node_id();
      if (this.lookahead.type == EDGE_OP) {
        this.consume();
        var node_ids = [id, this.parse_node_id()];
        while (this.lookahead.typ == EDGE_OP) {
          node_ids.push(this.parse_node_id());
        }
        attrs = this.parse_attrs();
        for (var i = 0; i < node_ids.length; i++) {
          this.handle_edge(node_ids[i], node_ids[i + 1], attrs);
        }
      }
      else if (this.lookahead.type == EQUAL) {
        this.consume();
        this.parse_id();
      }
      else {
        attrs = this.parse_attrs();
        this.handle_node(id, attrs);
      }
  }
  if (this.lookahead.type == SEMI) {
    this.consume();
  }
};

XDotParser.prototype.parse_attrs = function() {
  var attrs = {};
  while (this.lookahead.type == LSQUARE) {
    this.consume();
    while (this.lookahead.type != RSQUARE) {
      var attr, name, value;
      attr = this.parse_attr();
      name = attr[0];
      value = attr[1];
      attrs[name] = value;
      if (this.lookahead.type == COMMA) {
        this.consume();
      }
    }
    this.consume();
  }
  return attrs;
};

XDotParser.prototype.parse_attr = function() {
  var value, name = this.parse_id();
  if (this.lookahead.type == EQUAL) {
    this.consume();
    value = this.parse_id();
  }
  else {
    value = 'true';
  }
  return [name, value];
};

XDotParser.prototype.parse_node_id = function() {
  var node_id = this.parse_id();
  var port, compass_pt;
  if (this.lookahead.type == COLON) {
    this.consume();
    port = this.parse_id();
    if (this.lookahead.type == COLON) {
      this.consume();
      compass_pt = this.parse_id();
    }
  }
  return node_id;
};

XDotParser.prototype.parse_id = function() {
  this.match(ID);
  var id = this.lookahead.text;
  this.consume();
  return id;
};

XDotParser.prototype.handle_graph = function(attrs) {
  if (this.top_graph) {
    var bb = attrs.bb;
    if (!bb) {
      return;
    }
    var values = bb.split(',').map(parseFloat);
    var xmin, ymin, xmax, ymax;
    xmin = values[0];
    ymin = values[1];
    xmax = values[2];
    ymax = values[3];

    this.xoffset = 0;
    this.yoffset = ymax;
    this.xscale = 1.0;
    this.yscale = -1.0;

    // FIXME: scale from points to pixels
    this.width  = Math.max(xmax - xmin, 1);
    this.height = Math.max(ymax - ymin, 1);

    this.top_graph = false;
  }

  var attr, draw_attrs = ["_draw_", "_ldraw_", "_hdraw_", "_tdraw_", "_hldraw_", "_tldraw_"];
  for (var i = 0; i < draw_attrs.length; i++) {
    if (draw_attrs[i] in attrs) {
      attr = draw_attrs[i];
      var parser = new XDotAttrParser(this, attrs[attr]);
      // Append the returned parse array to the existing shapes array.
      var shapes = parser.parse();
      this.shapes.push.apply(this.shapes, shapes);
    }
  }
};

XDotParser.prototype.handle_node = function(id, attrs) {
  if (!('pos' in attrs)) {
    console.error('no pos in handle_node', id, attrs);
    return;
  }

  var x, y,
    w = parseFloat((attrs.width || 0) * 72),
    h = parseFloat((attrs.height || 0) * 72),
    pos = attrs.pos,
    xy = this.parse_node_pos(pos),  
    shapes = [];
    
  x = xy[0];
  y = xy[1];

  var attr, draw_attrs = ["_draw_", "_ldraw_"];
  for (var i = 0; i < draw_attrs.length; i++) {
    if (draw_attrs[i] in attrs) {
      attr = draw_attrs[i];
      var parser = new XDotAttrParser(this, attrs[attr]);
      // Append the returned parse array to the existing shapes array.
      shapes.push.apply(shapes, parser.parse());
    }
  }

  var url = attrs.URL;
  var node = new Node(id, x, y, w, h, shapes, url);
  this.node_by_name[id] = node;
  if (shapes.length) {
    this.nodes.push(node);
  }
};

XDotParser.prototype.handle_edge = function(src_id, dst_id, attrs) {
  if (!('pos' in attrs)) {
    return;
  }
  var points = this.parse_edge_pos(attrs.pos);
  var shapes = [];

  var attr, draw_attrs = ["_draw_", "_ldraw_", "_hdraw_", "_tdraw_", "_hldraw_", "_tldraw_"];
  for (var i = 0; i < draw_attrs.length; i++) {
    if (draw_attrs[i] in attrs) {
      attr = draw_attrs[i];
      var parser = new XDotAttrParser(this, attrs[attr]);
      // Append the returned parse array to the existing shapes array.
      shapes.push.apply(shapes, parser.parse());
    }
  }
  if (shapes.length) {
    var src = this.node_by_name[src_id];
    var dst = this.node_by_name[dst_id];
    this.edges.push(new Edge(src, dst, points, shapes));
  }
};

XDotParser.prototype.parse_node_pos = function(pos) {
  var point = pos.split(",").map(parseFloat);
  return this.transform(point[0], point[1]);
};

XDotParser.prototype.parse_edge_pos = function(pos) {
  var points = [], fields, entries, entry;
  entries = pos.split(' ');
  for (var i = 0; i < entries.length; i++) {
    entry = entries[i];
    fields = entry.split(',');
    if (fields.length == 2) {
      points.push(this.transform(parseFloat(fields[0]), parseFloat(fields[1])));
    }
  }
  return points;
};

// XXX: this is not the right place for this code
XDotParser.prototype.transform = function(x, y) {
  y = this.yoffset - y;
  return [x, y];
};

var XDotAttrParser = function(parser, buf) {
  this.parser = parser;
  this.buf = buf;
  this.pos = 0;

  this.pen = new Pen();
  this.shapes = [];

  this.nonzero = function() {
    return this.pos < this.buf.length;
  };

  this.read_code = function() {
    var pos = this.buf.indexOf(" ", this.pos);
    var res = this.buf.substring(this.pos, pos);
    this.pos = pos + 1;
    while(this.pos < this.buf.length && /\s/.test(this.buf[this.pos])) {
      this.pos += 1;
    }
    return res;
  };

  this.read_number = function() {
    return parseInt(this.read_code(), 10);
  };

  this.read_float = function() {
    return parseFloat(this.read_code());
  };

  this.read_point = function() {
    var x = this.read_number();
    var y = this.read_number();
    return this.transform(x, y);
  };

  this.read_text = function() {
    var num = this.read_number();
    var pos = this.buf.indexOf("-", this.pos) + 1;
    this.pos = pos + num;
    var res = this.buf.substring(pos, this.pos);
    while(this.pos < this.buf.length && /\s/.test(this.buf[this.pos])) {
      this.pos += 1;
    }
    return res;
  };

  this.read_polygon = function() {
    var n = this.read_number();
    var p = [];
    for (var i=0; i < n; i++) {
      p.push(this.read_point());
    }
    return p;
  };

  this.read_color = function() {
    // See http://www.graphviz.org/doc/info/attrs.html#k:color
    var c = this.read_text();
    var c1 = c[0];
    if (c1 == '#') {
      var r = parseInt(c.substring(1, 3), 16);
      var g = parseInt(c.substring(3, 5), 16);
      var b = parseInt(c.substring(5, 7), 16);
      var a = parseInt(c.substring(7, 9), 16);
      a = isNaN(a) ? 1.0 : (a / 255.0);
      return new Color(r, g, b, a);
    }

    // TODO: Handle hsv and color names.
    return false;
  };

  this.parse = function() {
    var op, point, w, h, points;
    while (this.nonzero()) {
      op = this.read_code();
      switch (op) {
        case 'C':
        case 'c':
          var color = this.read_color();
          if (color) {
            this.handle_color(color, (op == 'C'));
          }
          break;

        // http://www.graphviz.org/doc/info/attrs.html#k:style
        case 'S':
          var style = this.read_text();
          if (style.substr(0, 13) == 'setlinewidth(') {
            var lw = style.split("(")[1].split(")")[0];
            lw = parseFloat(lw);
            this.handle_linewidth(lw);
          }
          else if (jQuery.inArray(style, ['solid', 'dashed', 'dotted'])) {
            this.handle_linestyle(style);
          }
          break;

        case 'F':
          var size = this.read_float();
          var name = this.read_text();
          this.handle_font(size, name);
          break;

        case 'T':
          point = this.read_point();
          var j = this.read_number();
          w = this.read_number();
          var t = this.read_text();
          this.handle_text(point[0], point[1], j, w, t);
          break;

        case 'E':
        case 'e':
          point = this.read_point();
          w = this.read_number();
          h = this.read_number();
          this.handle_ellipse(point[0], point[1], w, h, (op == 'E'));
          break;

        case 'L':
          points = this.read_polygon();
          this.handle_line(points);
          break;

        case 'B':
        case 'b':
          points = this.read_polygon();
          // Note that the lowercase b is the filled option here.
          this.handle_bezier(points, (op == 'b'));
          break;

        case 'P':
        case 'p':
          points = this.read_polygon();
          this.handle_polygon(points, (op == 'P'));
          break;

        case 'I':
          point = this.read_point();
          w = this.read_number();
          h = this.read_number();
          var path = this.read_text();
          this.handle_image(point[0], point[1], w, h, path);
          break;

        default:
          throw new ParseError("unknown xdot opcode " + op, this.lexer.line, this.lexer.col);
      }
    }
    return this.shapes;
  };

  // TODO: wtf is the parser.
  this.transform = function(x, y) {
    return this.parser.transform(x, y);
  };

  this.handle_color = function(color, filled) {
    if (filled) {
      this.pen.fillcolor = color;
    }
    else {
      this.pen.color = color;
    }
  };

  this.handle_linewidth = function(linewidth) {
    this.pen.linewidth = linewidth;
  };

  this.handle_linestyle = function(style) {
    switch (style) {
      case 'solid':
        this.pen.dash = [];
        break;
      case 'dashed':
        this.pen.dash = [6, 6];
        break;
      case 'dotted':
        this.pen.dash = [2, 4];
        break;
    }
  };

  this.handle_font = function(size, name) {
    this.pen.fontsize = size;
    this.pen.fontname = name;
  };

  this.handle_text = function(x, y, j, w, t) {
    this.shapes.push(new TextShape(this.pen, x, y, j, w, t));
  };

  this.handle_ellipse = function(x0, y0, w, h, filled) {
    this.shapes.push(new EllipseShape(this.pen, x0, y0, w, h, filled));
  };

  this.handle_image = function(x0, y0, w, h, path) {
    this.shapes.push(new ImageShape(this.pen, x0, y0, w, h, path));
  };

  this.handle_line = function(points) {
    this.shapes.push(new LineShape(this.pen, points));
  };

  this.handle_bezier = function(points, filled) {
    this.shapes.push(new BezierShape(this.pen, points, filled));
  };

  this.handle_polygon = function(points, filled) {
    this.shapes.push(new PolygonShape(this.pen, points, filled));
  };
};

root.XDotParser = XDotParser;

})(this);
