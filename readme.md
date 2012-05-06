Parse xdot file according to http://www.graphviz.org/doc/info/output.html#d:xdot.

Mainly interested in any \_*draw\_ commands.

Turn xdot into array of js drawing commands.  commands can then be used by other
libraries (e.g. Raphael) to do the actual drawing.

    [
      {
        command: 'filled-ellipse',
        args: {x: 0, y: 0, h: 0, w: 0},
        raw: 'E x0 y0 w h '
      }
    ];
