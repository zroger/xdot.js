# xdot.js

xdot.js parses [GraphViz xdot](http://www.graphviz.org/doc/info/output.html#d:xdot) 
formatted strings into [Raphaël](http://raphaeljs.com/) objects.  This first 
version of xdot.py is a very close port of the lexer/parser code in 
[xdot.py](http://code.google.com/p/jrfonseca/wiki/XDot).

## Generating xdot files

_xdot_ is generated from _dot_ files using one of the GraphViz layout commands.
In this case, we'll just use the _dot_ command.

```
> dot -Txdot -oexample.xdot example.dot
```

## Usage

Include jQuery, Raphael and xdot.js.  Create a new XDotParser object with your 
_xdot_ formatted text, parse it, then draw it.

```javascript
var graph = new XDotParser(text).parse();
graph.draw();
```

Or, you can get the _xdot_ data via AJAX.

```javascript
$.get('graph.xdot', function(text) {
  var graph = new XDotParser(text).parse();
  graph.draw();
});
```

## Todo

- Decouple the parsing from the drawing.  Ideally, we could use any capable
  drawing library, not just Raphael.
- Overall code cleanup.  I'm not happy with how many variables are added to the
  global namespace.

